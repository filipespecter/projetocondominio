import {billingDate,currentBillingSubscription} from "./SubscriptionBillingService.js";
import prisma from "../config/prisma.js";
import Password from "../utils/Password.js";
import { ApiError } from "../utils/ApiError.js";
import { z } from "zod";

const open=["OPEN","IN_PROGRESS","WAITING_CUSTOMER"];
export async function configurationRequest(user,body,db=prisma){
 const condominiumId=user?.condominiumId;
 if(!condominiumId||user.role!=="CONDOMINIUM_ADMIN")throw new ApiError("Ação reservada ao Síndico Mestre.",403);
 const parsed=z.discriminatedUnion("kind",[
   z.object({kind:z.literal("PAY"),method:z.enum(["PIX","BOLETO","CARD"])}).strict(),
   z.object({kind:z.literal("CNPJ"),cnpj:z.string().regex(/^\d{14}$/)}).strict(),
   z.object({kind:z.literal("RESET"),confirmation:z.string().max(250),username:z.string().max(150),password:z.string().min(1).max(72)}).strict(),
 ]).safeParse(body);
 if(!parsed.success)throw new ApiError("Confira os dados informados.",422);
 const d=parsed.data;
 if(d.kind==="RESET"){
  const u=await db.user.findFirst({where:{id:user.id,condominiumId,role:"CONDOMINIUM_ADMIN",status:"ACTIVE",deletedAt:null,loginEnabled:true},select:{username:true,passwordHash:true,lockedUntil:true}});
  if(!u||u.username!==d.username||(u.lockedUntil&&u.lockedUntil>new Date())||!await Password.compare(d.password,u.passwordHash))throw new ApiError("Credenciais não confirmadas.",403);
 }
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "Condominium" WHERE id=${condominiumId}::uuid FOR UPDATE`;
  const condo=await tx.condominium.findUnique({where:{id:condominiumId},select:{name:true}});
  if(!condo)throw new ApiError("Condomínio não encontrado.",404);
  const category={PAY:"PAGAMENTO_ANTECIPADO",CNPJ:"ALTERACAO_CNPJ",RESET:"REINICIAR_CADASTROS"}[d.kind];
  if(await tx.supportTicket.findFirst({where:{condominiumId,category,status:{in:open}},select:{id:true}}))throw new ApiError("Já existe uma solicitação em andamento.",409);
  let title,description,metadata;
  if(d.kind==="PAY"){
   const subscription=await currentBillingSubscription(tx,condominiumId);
   if(!subscription)throw new ApiError("Assinatura ativa não encontrada.",404);
   const due=billingDate(subscription);
   const now=new Date(new Date().toLocaleDateString("sv-SE",{timeZone:subscription.condominium.timezone||"America/Recife"})+"T00:00:00Z");
   if(due<=now)throw new ApiError("A data do ciclo chegou. Consulte a cobrança em Financeiro → Assinatura.",409);
   const start=new Date(Date.UTC(due.getUTCFullYear(),due.getUTCMonth(),1));
   const end=new Date(Date.UTC(due.getUTCFullYear(),due.getUTCMonth()+1,1));
   if(await tx.charge.findFirst({where:{condominiumId,status:{not:"CANCELED"},dueDate:{gte:start,lt:end}},select:{id:true}}))throw new ApiError("Já existe cobrança para esse período.",409);
   const period=due.toISOString().slice(0,10);
   metadata={kind:"SUBSCRIPTION_ADVANCE",subscriptionId:subscription.id,dueDate:period,preferredMethod:d.method};
   title="Pagamento antecipado";description=`Mensalidade com vencimento em ${period}, R$ ${(subscription.priceInCents/100).toFixed(2)}. Preferência: ${{PIX:"Pix",BOLETO:"Boleto",CARD:"Cartão de crédito"}[d.method]}.`;
  }else if(d.kind==="CNPJ"){
   title="Alteração de CNPJ";description=`Novo CNPJ solicitado: ${d.cnpj}.`;
  }else{
   if(d.confirmation!==`REINICIAR ${condo.name}`)throw new ApiError("A frase de confirmação não confere.",422);
   const scope={condominiumId,deletedAt:null};
   const [a,r,p,v,b]=await Promise.all([tx.apartment.count({where:scope}),tx.resident.count({where:scope}),tx.package.count({where:{...scope,status:{in:["RECEIVED","EXPECTED"]}}}),tx.visitor.count({where:{...scope,status:"INSIDE"}}),tx.reservation.count({where:{...scope,status:{in:["PENDING","APPROVED"]},reservationDate:{gte:new Date(new Date().toISOString().slice(0,10)+"T00:00:00Z")}}})]);
   if(p||v||b)throw new ApiError("Resolva primeiro encomendas, visitas e reservas pendentes.",409);
   title="Revisão de reinício dos cadastros";description=`Solicitação confirmada pelo Síndico Mestre. Impacto: ${a} apartamentos e ${r} moradores. Nenhum dado removido. A Central deve validar o escopo e o backup antes de executar.`;
  }
  return tx.supportTicket.create({data:{condominiumId,openedByUserId:user.id,category,title,description,metadata},select:{ticketNumber:true,status:true}});
 });
}
