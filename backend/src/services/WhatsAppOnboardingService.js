import crypto from "node:crypto";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { seal, unseal } from "../utils/MessagingSecrets.js";
import { ApiError } from "../utils/ApiError.js";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");
export const idSchema = z.string().regex(/^[0-9]{1,30}$/);
export function approvedTemplate(template, name, language) {
  if (!template || template.name !== name || template.language !== language || template.status !== "APPROVED") return false;
  const body = template.components?.find(c => c.type === "BODY");
  const params = body?.text?.match(/\{\{\d+\}\}/g) || [];
  return params.join(",") === "{{1}},{{2}},{{3}}" && template.components.every(c => c.type === "BODY" || (c.type === "FOOTER" && !c.text?.includes("{{")));
}

export class WhatsAppOnboardingService {
  constructor(db = prisma, transport = (...args) => fetch(...args)) { this.db = db; this.transport = transport; }
  settings() {
    const e = process.env;
    return { appId:e.META_APP_ID || "", configId:e.META_SIGNUP_CONFIG_ID || "", secret:e.META_APP_SECRET || "", verifyToken:e.META_WEBHOOK_VERIFY_TOKEN || "", version:e.META_GRAPH_VERSION || "v23.0", template:e.META_PACKAGE_TEMPLATE || "encomenda_recebida", language:"pt_BR" };
  }
  requireAdmin(user) {
    if (user?.role !== "CONDOMINIUM_ADMIN" || !user.condominiumId) throw new ApiError("Somente o síndico pode conectar o WhatsApp.", 403);
  }
  publicSettings() {
    const c=this.settings();
    const configured = idSchema.safeParse(c.appId).success && idSchema.safeParse(c.configId).success && /^[a-f0-9]{32}$/i.test(c.secret) && c.verifyToken.length >= 32 && /^v\d{1,3}\.0$/.test(c.version);
    return { configured, appId:configured?c.appId:null, configId:configured?c.configId:null, version:c.version };
  }
  async graph(path, token, body = null) {
    const c=this.settings();
    let response;
    try {
      response=await this.transport(`https://graph.facebook.com/${c.version}/${path}`, { method:body?"POST":"GET", headers:{ Authorization:`Bearer ${token}`, ...(body?{"Content-Type":"application/json"}:{}) }, ...(body?{body:JSON.stringify(body)}:{}), signal:AbortSignal.timeout(20000) });
    } catch { throw new ApiError("Não foi possível consultar a Meta. Tente novamente.", 502); }
    const data=await response.json().catch(()=>null);
    if (!response.ok || !data || typeof data!=="object" || data.error) throw new ApiError(`A Meta não concluiu esta etapa${data?.error?.code?` (código ${Number(data.error.code)})`:""}. Verifique as permissões e a configuração da conta.`, 422);
    return data;
  }
  async start(user) {
    this.requireAdmin(user);
    const config=this.publicSettings();
    if (!config.configured) throw new ApiError("A conexão guiada aguarda a configuração do aplicativo Meta pela plataforma. O e-mail continua disponível.", 503);
    const state=crypto.randomBytes(32).toString("hex");
    await this.db.messagingConnectionAttempt.deleteMany({where:{expiresAt:{lt:new Date()}}});
    await this.db.messagingConnectionAttempt.create({data:{stateHash:hash(state),condominiumId:user.condominiumId,userId:user.id,expiresAt:new Date(Date.now()+10*60*1000)}});
    return {...config,state};
  }
  async finish(user, input) {
    this.requireAdmin(user);
    if (!this.publicSettings().configured) throw new ApiError("Aplicativo Meta ainda não configurado.",503);
    const parsed=z.object({state:z.string().regex(/^[a-f0-9]{64}$/),code:z.string().min(5).max(4096),phoneNumberId:idSchema.optional(),wabaId:idSchema,event:z.enum(["FINISH","FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"])}).strict().safeParse(input);
    if (!parsed.success) throw new ApiError("A autorização não retornou todos os dados necessários. Reinicie a conexão.",422);
    // Valida a chave local antes de realizar etapas externas na conta do cliente.
    seal({}, `whatsapp:${user.condominiumId}`);
    const data=parsed.data;
    const claim=await this.db.messagingConnectionAttempt.updateMany({where:{stateHash:hash(data.state),userId:user.id,condominiumId:user.condominiumId,consumedAt:null,expiresAt:{gt:new Date()}},data:{consumedAt:new Date()}});
    if (claim.count!==1) throw new ApiError("Autorização expirada ou já utilizada. Reinicie a conexão.",409);
    const c=this.settings();
    const tokenResult=await this.graph(`oauth/access_token?${new URLSearchParams({client_id:c.appId,client_secret:c.secret,code:data.code})}`,`${c.appId}|${c.secret}`);
    if (!tokenResult.access_token) throw new ApiError("A Meta não retornou a autorização do número.",422);
    const token=tokenResult.access_token;
    const debug=await this.graph(`debug_token?${new URLSearchParams({input_token:token})}`,`${c.appId}|${c.secret}`);
    if (!debug.data?.is_valid || String(debug.data.app_id)!==c.appId || !["whatsapp_business_management","whatsapp_business_messaging"].every(scope=>debug.data.scopes?.includes(scope))) throw new ApiError("Autorização da Meta inválida ou incompleta.",403);
    const numbers=await this.graph(`${data.wabaId}/phone_numbers?fields=id,display_phone_number,is_on_biz_app,platform_type&limit=100`,token);
    const phone=data.phoneNumberId?numbers.data?.find(p=>String(p.id)===data.phoneNumberId):numbers.data?.length===1?numbers.data[0]:null;
    if (!phone) throw new ApiError("O número não pertence à conta comercial autorizada.",403);
    if (await this.db.tenantMessagingConfig.findFirst({where:{phoneNumberId:String(phone.id),condominiumId:{not:user.condominiumId}}})) throw new ApiError("Este número já pertence a outro condomínio na plataforma.",409);
    // O evento do navegador não é prova suficiente para registrar um número.
    // A Meta precisa informar se o número está no app; em caso de dúvida, não registrar.
    if (typeof phone.is_on_biz_app!=="boolean") throw new ApiError("A Meta não confirmou a modalidade do número. Nenhum novo registro foi solicitado. Refaça a conexão.",422);
    const coexistence=phone.is_on_biz_app;
    if (data.event==="FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" && !coexistence) throw new ApiError("A Meta ainda não confirmou a conexão com o WhatsApp Business do celular. Refaça a autorização sem excluir a conta do aplicativo.",422);
    if (coexistence && phone.platform_type!=="CLOUD_API") throw new ApiError("A Meta ainda não concluiu a integração do número com a API. O aplicativo do celular foi preservado; refaça a conexão.",422);
    let pin;
    // Coexistência não chama /register, mesmo se o navegador enviar FINISH.
    if (!coexistence) {
      pin=String(crypto.randomInt(100000,1000000));
      const registered=await this.graph(`${phone.id}/register`,token,{messaging_product:"whatsapp",pin});
      if(registered.success!==true) throw new ApiError("A Meta não confirmou o registro do número.",422);
    }
    const subscribed=await this.graph(`${data.wabaId}/subscribed_apps`,token,{});
    if(subscribed.success!==true) throw new ApiError("A Meta não confirmou a assinatura dos eventos da conta.",422);
    const secrets=seal({accessToken:token,appSecret:c.secret,verifyToken:c.verifyToken,...(pin?{registrationPin:pin}:{})},`whatsapp:${user.condominiumId}`);
    await this.db.$transaction(async tx=>{
      await tx.tenantMessagingConfig.upsert({where:{condominiumId:user.condominiumId},create:{condominiumId:user.condominiumId,channel:"WHATSAPP",enabled:false,phoneNumberId:String(phone.id),displayPhone:phone.display_phone_number,wabaId:data.wabaId,apiVersion:c.version,templateName:c.template,languageCode:c.language,secrets,webhookSubscribed:true,onboardingStatus:"PENDING_TEMPLATE"},update:{channel:"WHATSAPP",enabled:false,phoneNumberId:String(phone.id),displayPhone:phone.display_phone_number,wabaId:data.wabaId,apiVersion:c.version,templateName:c.template,languageCode:c.language,secrets,webhookSubscribed:true,templateStatus:null,verifiedAt:null,onboardingStatus:"PENDING_TEMPLATE"}});
      await tx.auditLog.create({data:{condominiumId:user.condominiumId,userId:user.id,userName:user.name,userRole:user.role,action:"UPDATE",module:"WHATSAPP_CONNECTION",details:"Conexão autorizada pelo síndico; aguardando verificação do modelo. Credenciais omitidas."}});
    });
    // A autorização já foi salva. Uma consulta temporariamente indisponível não
    // deve fazer o cliente repetir a autorização ou apagar a conexão existente.
    try { return {connected:true,...await this.check(user)}; }
    catch { return {connected:true,ready:false,templateStatus:null,message:"Número autorizado e salvo. Não foi possível concluir a verificação do modelo. Clique em Verificar aprovação da conexão; o envio permanece desativado."}; }
  }
  async check(user) {
    this.requireAdmin(user);
    const row=await this.db.tenantMessagingConfig.findUnique({where:{condominiumId:user.condominiumId}});
    if (!row?.wabaId || !row.secrets) throw new ApiError("Conecte primeiro o número do condomínio.",422);
    const {accessToken}=unseal(row.secrets,`whatsapp:${user.condominiumId}`);
    const numbers=await this.graph(`${row.wabaId}/phone_numbers?fields=id,display_phone_number&limit=100`,accessToken);
    if (!numbers.data?.some(n=>String(n.id)===row.phoneNumberId)) throw new ApiError("Número não encontrado na conta autorizada.",403);
    const templates=await this.graph(`${row.wabaId}/message_templates?${new URLSearchParams({name:row.templateName,fields:"id,name,language,status,components",limit:"100"})}`,accessToken);
    let template=templates.data?.find(t=>t.name===row.templateName&&t.language===row.languageCode);
    if (!template) {
      const created=await this.graph(`${row.wabaId}/message_templates`,accessToken,{ name:row.templateName, language:row.languageCode, category:"UTILITY", components:[{type:"BODY",text:"{{1}}: encomenda recebida na portaria para {{2}}. Informação de retirada: {{3}}.",example:{body_text:[["Condomínio Exemplo","Bloco A, apartamento 101","123456"]]}}] });
      if(!created.id) throw new ApiError("A Meta não confirmou a solicitação do modelo. Verifique novamente.",422);
      template={name:row.templateName,language:row.languageCode,status:created.status||"PENDING"};
    }
    const ready=approvedTemplate(template,row.templateName,row.languageCode)&&row.webhookSubscribed;
    await this.db.tenantMessagingConfig.update({where:{condominiumId:user.condominiumId},data:{onboardingStatus:ready?"READY":"PENDING_TEMPLATE",templateStatus:template?.status||"NOT_FOUND",verifiedAt:ready?new Date():null,...(!ready?{enabled:false}:{})}});
    const pendingMessage=template?.status==="APPROVED"
      ? "O modelo foi aprovado, mas seu conteúdo ou a configuração de eventos não corresponde ao aviso de encomenda. Solicite a revisão ao suporte. O envio permanece desativado."
      : ["REJECTED","PAUSED","DISABLED"].includes(template?.status)
        ? "O modelo de aviso foi recusado ou está indisponível na Meta. Solicite a revisão ao suporte. O envio permanece desativado."
        : "Número autorizado. O modelo de aviso aguarda aprovação da Meta. Verifique novamente após a análise.";
    return {ready,templateStatus:template?.status||"NOT_FOUND",message:ready?"Número e modelo verificados. Escolha WhatsApp e salve o canal para ativar. O teste real de entrega ainda está pendente.":pendingMessage};
  }
}
export default new WhatsAppOnboardingService();
