import prisma from "../config/prisma.js";
import { WhatsAppProvider } from "./providers/WhatsAppProvider.js";
import { ApiError } from "../utils/ApiError.js";
import { seal, unseal } from "../utils/MessagingSecrets.js";
export class TenantMessagingService {
  constructor(db=prisma) { this.db=db; }
  publicConfig(row, id) {
    return { channel:row?.channel||"EMAIL", ativo:Boolean(row?.enabled), provider:"Meta Cloud API", phoneNumberId:row?.phoneNumberId||"", numeroEmpresa:row?.displayPhone||"", templateName:row?.templateName||"", languageCode:row?.languageCode||"pt_BR", apiVersion:row?.apiVersion||"v23.0", hasCredentials:Boolean(row?.secrets), onboardingStatus:row?.onboardingStatus||"MANUAL", templateStatus:row?.templateStatus||null, verifiedAt:row?.verifiedAt||null, token:"", appSecret:"", verifyToken:"", webhook:`${String(process.env.FRONTEND_URL||"").replace(/\/$/,"")}/api/v1/webhooks/whatsapp?condominiumId=${id}` };
  }
  async get(id) { return this.publicConfig(await this.db.tenantMessagingConfig.findUnique({where:{condominiumId:id}}),id); }
  async save(user,data) {
    if(user?.role!=="CONDOMINIUM_ADMIN" || !user.condominiumId) throw new ApiError("Somente o síndico pode configurar os canais de comunicação.",403);
    const id=user.condominiumId; const current=await this.db.tenantMessagingConfig.findUnique({where:{condominiumId:id}});
    const channel=data.channel;
    if(!["EMAIL","WHATSAPP"].includes(channel)) throw new ApiError("Escolha WhatsApp ou e-mail.",422);
    const strings={phoneNumberId:String(data.phoneNumberId||"").trim()||null,displayPhone:String(data.numeroEmpresa||"").trim(),templateName:String(data.templateName||"").trim(),languageCode:String(data.languageCode||"pt_BR").trim(),apiVersion:String(data.apiVersion||"v23.0").trim()};
    if(!/^v[0-9]{1,3}\.0$/.test(strings.apiVersion)||! /^[a-z]{2}_[A-Z]{2}$/.test(strings.languageCode)) throw new ApiError("Versão da API ou idioma inválidos.",422);
    if(channel==="WHATSAPP" && data.ativo && current?.onboardingStatus && !["MANUAL","READY"].includes(current.onboardingStatus)) throw new ApiError("A conexão ou o modelo ainda está pendente de aprovação.",422);
    if(current?.onboardingStatus && current.onboardingStatus!=="MANUAL") {
      const changed=Object.entries(strings).some(([key,value])=>value!==current[key]);
      if(changed||data.token||data.appSecret||data.verifyToken) throw new ApiError("Use a conexão guiada para trocar o número ou a autorização. Aqui você pode escolher e ativar o canal.",409);
    }
    let secret=current?.secrets ? unseal(current.secrets,`whatsapp:${id}`):{};
    for(const [field,key] of [["token","accessToken"],["appSecret","appSecret"],["verifyToken","verifyToken"]]) if(data[field]) secret[key]=String(data[field]).trim();
    if(channel==="WHATSAPP" && data.ativo) {
      if(current?.onboardingStatus && current.onboardingStatus!=="MANUAL" && current.onboardingStatus!=="READY") throw new ApiError("A conexão ou o modelo ainda está pendente de aprovação.",422);
      if(!/^[0-9]+$/.test(strings.phoneNumberId)||! /^[a-z0-9_]+$/.test(strings.templateName)||!secret.accessToken||! /^[a-fA-F0-9]{32}$/.test(secret.appSecret||"")||String(secret.verifyToken||"").length<24) throw new ApiError("Preencha ID do número, modelo aprovado, token, segredo do aplicativo e token de verificação (mínimo 24 caracteres).",422);
    }
    const credentialsChanged=Boolean(data.token||data.appSecret||data.verifyToken)||strings.phoneNumberId!==current?.phoneNumberId;
    const row=await this.db.tenantMessagingConfig.upsert({where:{condominiumId:id},create:{condominiumId:id,...strings,channel,enabled:Boolean(data.ativo),secrets:secret.accessToken?seal(secret,`whatsapp:${id}`):null},update:{...strings,channel,enabled:Boolean(data.ativo),secrets:secret.accessToken?seal(secret,`whatsapp:${id}`):null,verifiedAt:credentialsChanged?null:current?.verifiedAt}});
    await this.db.auditLog.create({data:{condominiumId:id,userId:user.id,userName:user.name,userRole:user.role,action:"UPDATE",module:"MESSAGING_CONFIGURATION",referenceId:id,details:"Canal de avisos atualizado; credenciais omitidas.",afterData:{channel,enabled:row.enabled,phoneNumberId:row.phoneNumberId}}});
    return this.publicConfig(row,id);
  }
  async provider(id, requireEnabled=true) {
    if(!id) throw new ApiError("Condomínio obrigatório para envio de WhatsApp.",422);
    const row=await this.db.tenantMessagingConfig.findUnique({where:{condominiumId:id}});
    if(!row?.secrets || (requireEnabled && (!row.enabled||!row.verifiedAt||row.channel!=="WHATSAPP"))) throw new ApiError("WhatsApp deste condomínio não está conectado.",503);
    return new WhatsAppProvider({...unseal(row.secrets,`whatsapp:${id}`),phoneNumberId:row.phoneNumberId,apiVersion:row.apiVersion});
  }
  async operationalStatus(id) {
    const row=await this.db.tenantMessagingConfig.findUnique({where:{condominiumId:id}});
    const whatsapp=Boolean(row?.enabled && row.channel==="WHATSAPP" && row.secrets && row.verifiedAt && ["MANUAL","READY"].includes(row.onboardingStatus||"MANUAL"));
    const selected=Boolean(row?.enabled && row.channel==="WHATSAPP");
    const email=process.env.EMAIL_PROVIDER==="RESEND" && Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
    return {channel:selected?"WHATSAPP":"EMAIL",displayPhone:selected?row.displayPhone:null,ready:selected?whatsapp:email,status:selected?(whatsapp?"CONNECTED":"NOT_CONFIGURED"):(email?"EMAIL_READY":"NOT_CONFIGURED"),realDeliveryTest:"PENDING"};
  }
  async test(user) {
    if(user?.role!=="CONDOMINIUM_ADMIN") throw new ApiError("Acesso restrito ao síndico.",403);
    const row=await this.db.tenantMessagingConfig.findUnique({where:{condominiumId:user.condominiumId}});
    if(row?.onboardingStatus && row.onboardingStatus!=="MANUAL") {
      const {default:onboarding}=await import("./WhatsAppOnboardingService.js");
      return onboarding.check(user);
    }
    const provider=await this.provider(user.condominiumId,false);
    const response=await fetch(`${provider.baseUrl}/${provider.phoneNumberId}?fields=display_phone_number,verified_name`,{headers:{Authorization:`Bearer ${provider.accessToken}`},signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new ApiError("A Meta recusou a conexão. Verifique o ID e as permissões do token.",422);
    const result=await response.json();
    await this.db.tenantMessagingConfig.update({where:{condominiumId:user.condominiumId},data:{verifiedAt:new Date(),displayPhone:result.display_phone_number||null}});
    return {connected:true,displayPhone:result.display_phone_number||"",verifiedName:result.verified_name||"",message:"Credenciais aceitas. O envio do modelo ainda precisa ser testado."};
  }
}
export default new TenantMessagingService();
