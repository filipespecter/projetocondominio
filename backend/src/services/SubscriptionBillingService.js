import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

const eligible = ["ACTIVE","OVERDUE"];
const months = { MONTHLY:1, QUARTERLY:3, SEMIANNUAL:6, ANNUAL:12 };
const day = value => new Date(new Date(value).toISOString().slice(0,10)+"T00:00:00Z");

export function billingDate(s) {
  const date = day(s.nextDueDate ?? s.currentPeriodEnd);
  if(s.billingCycle==="MONTHLY" && !s.lastPaymentAt) {
    const minimum=day(s.condominium?.activatedAt ?? s.currentPeriodStart);
    minimum.setUTCDate(minimum.getUTCDate()+30);
    return date < minimum ? minimum : date;
  }
  return date;
}
export function nextBillingDate(date,s) {
  const month = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+months[s.billingCycle],1));
  const last = new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
  const anchor = s.dueDay ?? day(s.condominium?.activatedAt ?? s.currentPeriodStart).getUTCDate();
  month.setUTCDate(Math.min(anchor,last));
  // Keep one charge per calendar month, including a first due date rolled forward to 30 days.
  return month;
}
export async function currentBillingSubscription(tx, condominiumId) {
  return tx.subscription.findFirst({where:{condominiumId,status:{in:eligible},condominium:{deletedAt:null,status:"ACTIVE"}},orderBy:[{createdAt:"desc"},{id:"desc"}],include:{plan:true,condominium:true}});
}
export async function createCycleCharge(tx,s,dueDate,user=null) {
  const start=new Date(Date.UTC(dueDate.getUTCFullYear(),dueDate.getUTCMonth(),1));
  const end=new Date(Date.UTC(dueDate.getUTCFullYear(),dueDate.getUTCMonth()+1,1));
  const existing=await tx.charge.findFirst({where:{condominiumId:s.condominiumId,dueDate:{gte:start,lt:end},OR:[
    {status:{not:"CANCELED"}},{providerChargeId:{not:null}},{metadata:{path:["gatewayAttemptPending"],equals:true}}
  ]}});
  if(existing)return {charge:existing,created:false};
  if(!Number.isSafeInteger(s.priceInCents)||s.priceInCents<=0)throw new ApiError("Configure um valor válido na assinatura antes de cobrar.",422);
  const official=s.plan?.monthlyPriceInCents??s.priceInCents;
  const charge=await tx.charge.create({data:{condominiumId:s.condominiumId,subscriptionId:s.id,amountInCents:s.priceInCents,dueDate,
    metadata:{officialPriceInCents:official,discountInCents:Math.max(0,official-s.priceInCents)}}});
  await tx.auditLog.create({data:{condominiumId:s.condominiumId,userId:user?.id,userName:user?.name,userRole:user?.role,action:"CREATE",module:"CHARGE",referenceId:charge.id,
    details:user?"Mensalidade antecipada aprovada pela Central.":"Mensalidade disponibilizada pelo ciclo da assinatura."}});
  await tx.notification.create({data:{condominiumId:s.condominiumId,title:"Mensalidade disponível",message:"Abra Financeiro → Assinatura para escolher Pix ou boleto.",type:"CHARGE_CREATED",module:"CHARGE",referenceId:charge.id,targetRole:"CONDOMINIUM_ADMIN"}});
  return {charge,created:true};
}
export async function materializeDueCharge(condominiumId,now=new Date(),db=prisma) {
  return db.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "Condominium" WHERE id=${condominiumId}::uuid FOR UPDATE`;
    const s=await currentBillingSubscription(tx,condominiumId);
    if(!s || !months[s.billingCycle])return null;
    const dueDate=billingDate(s);
    const today=new Date(now.toLocaleDateString("sv-SE",{timeZone:s.condominium.timezone||"America/Recife"})+"T00:00:00Z");
    if(dueDate>today)return null;
    if(process.env.SUBSCRIPTION_BILLING_NOT_BEFORE) {
      const cutoff=process.env.SUBSCRIPTION_BILLING_NOT_BEFORE;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)||!Number.isFinite(Date.parse(cutoff))||day(cutoff).toISOString().slice(0,10)!==cutoff) throw new Error("Data de início da cobrança automática inválida.");
      if(dueDate<day(cutoff)){
        let upcoming=nextBillingDate(dueDate,s);
        while(upcoming<day(cutoff))upcoming=nextBillingDate(upcoming,s);
        if(upcoming>today) {
          await tx.subscription.update({where:{id:s.id},data:{nextDueDate:upcoming}});
          return null;
        }
        const result=await createCycleCharge(tx,s,upcoming);
        await tx.subscription.update({where:{id:s.id},data:{nextDueDate:nextBillingDate(upcoming,s)}});
        return result;
      }
    }
    const result=await createCycleCharge(tx,s,dueDate);
    await tx.subscription.update({where:{id:s.id},data:{nextDueDate:nextBillingDate(dueDate,s)}});
    return result;
  });
}
export async function runSubscriptionBilling({db=prisma,now=new Date(),onError=()=>{},only=process.env.SUBSCRIPTION_BILLING_CONDOMINIUM_ID}={}) {
  if(only&&!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(only))throw new Error("Identificador do condomínio de homologação inválido.");
  const ids=await db.subscription.findMany({where:{...(only?{condominiumId:only}:{}),status:{in:eligible},condominium:{deletedAt:null,status:"ACTIVE"},OR:[
    {nextDueDate:{lte:now}},{nextDueDate:null,currentPeriodEnd:{lte:now}}
  ]},distinct:["condominiumId"],select:{condominiumId:true}});
  for(const {condominiumId} of ids) {
    try{await materializeDueCharge(condominiumId,now,db);}catch(error){onError(error,condominiumId);}
  }
}
