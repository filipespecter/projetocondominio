import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

const uuid=z.string().uuid();
const version=z.string().datetime({offset:true});
const text=(max=160)=>z.string().trim().max(max).refine(v=>!Array.from(v).some(char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127),"Use texto sem caracteres de controle.");
const optionalText=(max=160)=>text(max).transform(v=>v || null);
const email=text(200).refine(v=>!v || z.string().email().safeParse(v).success,"Informe um e-mail válido.").transform(v=>v.toLowerCase() || null);
const phone=text(30).refine(v=>!v || /^[+()\d .-]{8,30}$/.test(v),"Informe um telefone válido.").transform(v=>v || null);
const condoFields={name:text(160).min(2,"Informe o nome do condomínio."),legalName:optionalText(200),document:optionalText(30),contactName:optionalText(),email,phone,
  postalCode:text(10).refine(v=>!v||/^\d{5}-?\d{3}$/.test(v),"Informe um CEP válido.").transform(v=>v || null),addressLine:optionalText(250),addressNumber:optionalText(30),addressExtra:optionalText(120),neighborhood:optionalText(120),city:optionalText(120),state:text(2).refine(v=>!v||/^[a-zA-Z]{2}$/.test(v),"Informe a UF com duas letras.").transform(v=>v.toUpperCase()||null)};
const adminFields={id:uuid,expectedUpdatedAt:version,name:text(160).min(2,"Informe o nome do administrador."),username:text(100).min(1,"Informe o usuário de acesso.").regex(/^[a-zA-Z0-9._-]+$/,"Use letras, números, ponto, hífen ou sublinhado no usuário.").transform(v=>v.toLowerCase()),email,phone,document:optionalText(30)};
const payload=z.object({condominium:z.object({...condoFields,expectedUpdatedAt:version}).strict(),administrator:z.object(adminFields).strict().nullable(),billingContact:z.object({id:uuid,expectedUpdatedAt:version,name:optionalText(),email,phone}).strict().nullable()}).strict();
const roles=["CONDOMINIUM_ADMIN","MANAGER"];
const condoSelect={id:true,updatedAt:true,...Object.fromEntries(Object.keys(condoFields).map(k=>[k,true]))};
const adminSelect={id:true,updatedAt:true,name:true,username:true,email:true,phone:true,document:true};
const billingSelect={id:true,updatedAt:true,billingContactName:true,billingEmail:true,billingPhone:true};
function authorize(actor){if(!actor?.id||!["PLATFORM_OWNER","PLATFORM_ADMIN"].includes(actor.role)||actor.condominiumId!=null)throw new ApiError("Edição restrita ao proprietário e administradores da Central.",403);}
function id(value){if(!uuid.safeParse(value).success)throw new ApiError("Identificador de cliente inválido.",400);}
export async function readClientProfile({actor,condominiumId,administratorId=null},{db}){
 authorize(actor);id(condominiumId);if(administratorId)id(administratorId);
 const condominium=await db.condominium.findFirst({where:{id:condominiumId,deletedAt:null},select:condoSelect});
 if(!condominium)throw new ApiError("Cliente não encontrado.",404);
 const administrator=await db.user.findFirst({where:{...(administratorId?{id:administratorId}:{}),condominiumId,deletedAt:null,role:{in:roles}},select:adminSelect,orderBy:[{createdAt:"asc"},{id:"asc"}]});
 if(administratorId&&!administrator)throw new ApiError("Administrador não encontrado neste cliente.",404);
 const subscription=await db.subscription.findFirst({where:{condominiumId},orderBy:[{createdAt:"desc"},{id:"desc"}],select:billingSelect});
 return {condominium,administrator,billingContact:subscription?{id:subscription.id,updatedAt:subscription.updatedAt,name:subscription.billingContactName,email:subscription.billingEmail,phone:subscription.billingPhone}:null};
}
export async function updateClientProfile({actor,condominiumId,data,context={}},{db}){
 authorize(actor);id(condominiumId);
 const parsed=payload.safeParse(data);
 if(!parsed.success)throw new ApiError("Confira os dados da ficha.",422,parsed.error.issues.map(i=>({field:i.path.join("."),message:i.message})));
 const input=parsed.data;
 try{return await db.$transaction(async tx=>{
  const before=await readClientProfile({actor,condominiumId,administratorId:input.administrator?.id},{db:tx});
  const same=(actual,expected)=>new Date(actual).getTime()===new Date(expected).getTime();
  if(!same(before.condominium.updatedAt,input.condominium.expectedUpdatedAt)||
    (input.administrator&&(!before.administrator||!same(before.administrator.updatedAt,input.administrator.expectedUpdatedAt)))||
    (input.billingContact&&(!before.billingContact||before.billingContact.id!==input.billingContact.id||!same(before.billingContact.updatedAt,input.billingContact.expectedUpdatedAt))))throw new ApiError("A ficha mudou desde a abertura. Feche e abra a edição novamente antes de salvar.",409);
  const {expectedUpdatedAt,...condominium}=input.condominium;
  const changed=await tx.condominium.updateMany({where:{id:condominiumId,deletedAt:null,updatedAt:new Date(expectedUpdatedAt)},data:condominium});
  if(changed.count!==1)throw new ApiError("A ficha mudou durante a gravação. Reabra a edição.",409);
  if(input.administrator){
    const {id:userId,expectedUpdatedAt:revision,...administrator}=input.administrator;
    const identifiersChanged=administrator.email!==before.administrator.email||administrator.username!==before.administrator.username;
    // Usernames and recovery email must continue to identify one account in this portal.
    if(identifiersChanged){
      const conflicts=await tx.user.findFirst({where:{id:{not:userId},deletedAt:null,role:{in:roles},OR:[{username:{equals:administrator.username,mode:"insensitive"}},...(administrator.email?[{email:{equals:administrator.email,mode:"insensitive"}}]:[])]},select:{id:true}});
      if(conflicts)throw new ApiError("Usuário ou e-mail já utilizado por outra conta deste portal. Use um identificador exclusivo para permitir login e recuperação sem ambiguidade.",409);
    }
    const updated=await tx.user.updateMany({where:{id:userId,condominiumId,deletedAt:null,role:{in:roles},updatedAt:new Date(revision)},data:{...administrator,...(identifiersChanged?{securityVersion:{increment:1}}:{})}});
    if(updated.count!==1)throw new ApiError("O administrador mudou durante a gravação. Reabra a edição.",409);
    if(identifiersChanged){
      await tx.passwordResetCode.updateMany({where:{userId,usedAt:null},data:{usedAt:new Date()}});
      await tx.authSession.updateMany({where:{userId,revokedAt:null},data:{revokedAt:new Date(),revokeReason:"CLIENT_PROFILE_ACCESS_CHANGED"}});
    }
  }
  if(input.billingContact){
    const bill=input.billingContact;
    const updated=await tx.subscription.updateMany({where:{id:bill.id,condominiumId,updatedAt:new Date(bill.expectedUpdatedAt)},data:{billingContactName:bill.name,billingEmail:bill.email,billingPhone:bill.phone}});
    if(updated.count!==1)throw new ApiError("O contato financeiro mudou durante a gravação. Reabra a edição.",409);
  }
  const after=await readClientProfile({actor,condominiumId,administratorId:input.administrator?.id},{db:tx});
  await tx.auditLog.create({data:{condominiumId,userId:actor.id,userName:actor.name,userRole:actor.role,action:"UPDATE",module:"PLATFORM_CLIENT_PROFILE",referenceId:condominiumId,details:"Central atualizou a ficha cadastral do cliente. Plano, preço, status e senha preservados.",beforeData:JSON.parse(JSON.stringify(before)),afterData:JSON.parse(JSON.stringify(after)),ipAddress:context.ipAddress??null,userAgent:context.userAgent??null}});
  return after;
 });}catch(error){if(error.code==="P2002")throw new ApiError("Documento, usuário ou e-mail já cadastrado. Confira os dados antes de salvar.",409);throw error;}
}
