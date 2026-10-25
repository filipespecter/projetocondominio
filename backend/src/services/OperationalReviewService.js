import crypto from "node:crypto";
import {z} from "zod";
import prisma from "../config/prisma.js";
import {ApiError} from "../utils/ApiError.js";
import {period} from "../utils/indicatorMath.js";
import {previewWorkspaceReport,archiveWorkspaceReport,downloadWorkspaceReport} from "./ReportWorkspaceService.js";
export function reviewActor(user,write=false){
 if(!user?.id||!user?.condominiumId||!(write?["CONDOMINIUM_ADMIN"]:["CONDOMINIUM_ADMIN","MANAGER"]).includes(user.role))throw new ApiError("Operação restrita à gestão autorizada do condomínio.",403);
}
export function previousMonth(now=new Date(),timezone="America/Recife"){
 const day=new Intl.DateTimeFormat("sv-SE",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const d=new Date(day.slice(0,7)+"-01T12:00:00Z");d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7);
}
export async function monthPeriod(user,month,db=prisma,now=new Date()){
 reviewActor(user);
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month||""))throw new ApiError("Selecione um mês válido.",422);
 const condo=await db.condominium.findUnique({where:{id:user.condominiumId},select:{timezone:true}});
 const timezone=condo?.timezone||"America/Recife";
 if(month>previousMonth(now,timezone))throw new ApiError("O fechamento está disponível somente para meses encerrados.",422);
 const end=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).toISOString().slice(0,10);
 return period({start:month+"-01",end},now,timezone);
}
const terminal={packages:["DELIVERED","CANCELED"],visitors:["EXITED","DENIED","CANCELED"]};
export function archiveCriteria(user,dates,kind,cutoff){
 const finished=kind==="packages"?[{status:"DELIVERED",deliveredAt:{lte:dates.end}},{status:"CANCELED",canceledAt:{lte:dates.end}}]:[{status:"EXITED",exitedAt:{lte:dates.end}},{status:"DENIED",deniedAt:{lte:dates.end}},{status:"CANCELED",updatedAt:{lte:dates.end}}];
 return {condominiumId:user.condominiumId,deletedAt:null,operationalArchivedAt:null,...(kind==="packages"?{receivedAt:{gte:dates.start,lte:dates.end}}:{createdAt:{gte:dates.start,lte:dates.end}}),updatedAt:{lte:cutoff},OR:finished};
}
export async function monthlySummary(user,month,db=prisma){
 const d=await monthPeriod(user,month,db),base={condominiumId:user.condominiumId,deletedAt:null,createdAt:{gte:d.start,lte:d.end}},summary={};
 for(const kind of ["packages","visitors"]){const model=db[kind==="packages"?"package":"visitor"],scope={...base,...(kind==="packages"?{createdAt:undefined,receivedAt:{gte:d.start,lte:d.end}}:{})};summary[kind]={total:await model.count({where:scope}),pending:await model.count({where:{...scope,status:{notIn:terminal[kind]}}}),eligible:await model.count({where:archiveCriteria(user,d,kind,new Date())}),archived:await model.count({where:{...scope,operationalArchivedAt:{not:null}}})};}
 const history=await db.auditLog.findMany({where:{condominiumId:user.condominiumId,module:"MONTHLY_CLOSURE",referenceId:month,deletedAt:null},orderBy:{createdAt:"desc"},take:10,select:{id:true,userName:true,createdAt:true,afterData:true}});
 return {month,canClose:user.role==="CONDOMINIUM_ADMIN",start:month+"-01",end:d.end.toLocaleDateString("sv-SE",{timeZone:d.timezone}),summary,history};
}
export async function monthlyDocument(user,input,db=prisma){
 reviewActor(user);const parsed=z.object({month:z.string(),format:z.enum(["PDF","XLSX","CSV"])}).strict().safeParse(input);if(!parsed.success)throw new ApiError("Confira mês e formato do relatório.",422);const p=parsed.data;const d=await monthPeriod(user,p.month,db);
 const cutoff=new Date().toISOString();
 const preview=await previewWorkspaceReport(user,{subject:"custom",start:p.month+"-01",end:d.end.toLocaleDateString("sv-SE",{timeZone:d.timezone}),content:"detailed",groups:[],datasets:["packages","visitors"],includeLogo:true,notes:"Fechamento mensal da portaria. Pendências permanecem ativas. O arquivamento não exclui registros."},db,undefined,{monthlyClosure:true});
 const saved=await archiveWorkspaceReport(user,{...preview,format:p.format},db);
 await db.auditLog.create({data:{condominiumId:user.condominiumId,userId:user.id,userName:user.name,userRole:user.role,module:"MONTHLY_DOCUMENT",action:"EXPORT",referenceId:saved.id,afterData:{month:p.month,cutoff},details:"Relatório mensal consolidado emitido antes da revisão operacional."}});
 return {model:preview.model,format:p.format,snapshotId:saved.id};
}
export async function closeMonth(user,input,db=prisma,documentReader=downloadWorkspaceReport){
 reviewActor(user,true);const parsed=z.object({month:z.string(),snapshotId:z.string().uuid(),confirmed:z.literal(true)}).strict().safeParse(input);
 if(!parsed.success)throw new ApiError("Exporte o relatório mensal e confirme o arquivamento.",422);
 const {month,snapshotId}=parsed.data,d=await monthPeriod(user,month,db);
 // Authenticated immutable document must still exist and belong to this tenant and user.
 await documentReader(user,snapshotId,db);
 return db.$transaction(async tx=>{
 await tx.$executeRaw`SELECT id FROM "Condominium" WHERE id = ${user.condominiumId}::uuid FOR UPDATE`;
 const issued=await tx.auditLog.findFirst({where:{condominiumId:user.condominiumId,userId:user.id,module:"MONTHLY_DOCUMENT",referenceId:snapshotId,deletedAt:null},select:{afterData:true}});
 if(issued?.afterData?.month!==month)throw new ApiError("Exporte o relatório consolidado deste mês antes de arquivar.",409);
 const cutoff=new Date(issued.afterData.cutoff);if(!Number.isFinite(cutoff.getTime()))throw new ApiError("Documento inválido.",409);
 const previous=await tx.auditLog.findFirst({where:{condominiumId:user.condominiumId,module:"MONTHLY_CLOSURE",referenceId:month,afterData:{path:["snapshotId"],equals:snapshotId}},select:{afterData:true}});
 if(previous)return {...previous.afterData,repeated:true};
 const packages=await tx.package.updateMany({where:archiveCriteria(user,d,"packages",cutoff),data:{operationalArchivedAt:new Date()}});
 const visitors=await tx.visitor.updateMany({where:archiveCriteria(user,d,"visitors",cutoff),data:{operationalArchivedAt:new Date()}});
 const result={snapshotId,packages:packages.count,visitors:visitors.count};
 await tx.auditLog.create({data:{condominiumId:user.condominiumId,userId:user.id,userName:user.name,userRole:user.role,module:"MONTHLY_CLOSURE",action:"UPDATE",referenceId:month,afterData:result,details:"Arquivamento confirmado: registros originais preservados; pendências e alterações posteriores à emissão permanecem ativas."}});return result;
 });
}
export async function operationPage(user,kind,query={},db=prisma){
 reviewActor(user);if(!["packages","visitors"].includes(kind))throw new ApiError("Módulo inválido.",422);
 const page=Number(query.page||1);if(!Number.isInteger(page)||page<1||page>100000)throw new ApiError("Página inválida.",422);
 if(query.history&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(query.history))throw new ApiError("Mês inválido.",422);
 const q=String(query.q||"").trim().slice(0,100),model=db[kind==="packages"?"package":"visitor"],where={condominiumId:user.condominiumId,deletedAt:null};
 if(query.history){const c=await db.condominium.findUnique({where:{id:user.condominiumId},select:{timezone:true}});const end=new Date(Date.UTC(+query.history.slice(0,4),+query.history.slice(5),0)).toISOString().slice(0,10);const d=period({start:query.history+"-01",end},new Date(),c?.timezone||"America/Recife");where.createdAt={gte:d.start,lte:d.end};}else where.AND=[{OR:[{operationalArchivedAt:null},{status:{notIn:terminal[kind]}}]}];
 if(query.status){if(!["EXPECTED","RECEIVED","DELIVERED","CANCELED","WAITING","AUTHORIZED","INSIDE","EXITED","DENIED"].includes(query.status))throw new ApiError("Situação inválida.",422);where.status=query.status;}
 if(q)where.OR=kind==="packages"?[{carrier:{contains:q,mode:"insensitive"}},{type:{contains:q,mode:"insensitive"}},{apartment:{block:{contains:q,mode:"insensitive"}}},{description:{contains:q,mode:"insensitive"}},{trackingCode:{contains:q,mode:"insensitive"}},{apartment:{number:{contains:q,mode:"insensitive"}}},{expectedByResident:{user:{name:{contains:q,mode:"insensitive"}}}}]:[{document:{contains:q,mode:"insensitive"}},{phone:{contains:q,mode:"insensitive"}},{visitType:{contains:q,mode:"insensitive"}},{notes:{contains:q,mode:"insensitive"}},{apartment:{block:{contains:q,mode:"insensitive"}}},{name:{contains:q,mode:"insensitive"}},{apartment:{number:{contains:q,mode:"insensitive"}}}];
 const common={id:true,status:true,createdAt:true,updatedAt:true,operationalArchivedAt:true,apartment:{select:{id:true,block:true,number:true,floor:true}}},person={select:{name:true}};
 const select=kind==="packages"?{...common,type:true,notes:true,withdrawnBy:true,withdrawnDocument:true,pickupMethod:true,pickupPersonType:true,description:true,trackingCode:true,carrier:true,receivedAt:true,deliveredAt:true,canceledAt:true,expectedByResidentId:true,apartmentId:true,receivedBy:person,deliveredBy:person,expectedByResident:{select:{id:true,user:{select:{name:true}}}}}:{...common,name:true,document:true,phone:true,visitType:true,notes:true,expectedAt:true,enteredAt:true,exitedAt:true,authorizedAt:true,deniedAt:true,apartmentId:true,registeredBy:person,authorizedBy:person};
 const [items,total]=await Promise.all([model.findMany({where,select,orderBy:[{createdAt:"desc"},{id:"desc"}],skip:(page-1)*50,take:50}),model.count({where})]);return {items,total,page,pages:Math.max(1,Math.ceil(total/50)),refreshedAt:new Date().toISOString()};
}
export async function feedState(user,db=prisma){reviewActor(user);const row=await db.auditLog.findFirst({where:{condominiumId:user.condominiumId,userId:user.id,module:"DASHBOARD_FEED",deletedAt:null},orderBy:{createdAt:"desc"},select:{afterData:true}});return {clearedThrough:row?.afterData?.clearedThrough||null};}
export async function clearFeed(user,through,db=prisma){reviewActor(user);if(!z.string().datetime().safeParse(through).success||new Date(through)>new Date())throw new ApiError("Atualize o painel antes de limpar.",422);const old=await feedState(user,db);const cutoff=old.clearedThrough&&old.clearedThrough>through?old.clearedThrough:through;await db.auditLog.create({data:{condominiumId:user.condominiumId,userId:user.id,userName:user.name,userRole:user.role,module:"DASHBOARD_FEED",action:"UPDATE",afterData:{clearedThrough:cutoff},details:"Limpeza da visualização pessoal do painel; registros originais preservados."}});return {clearedThrough:cutoff};}
export async function notifyMonthlyReview(db=prisma,now=new Date()){
 const condos=await db.condominium.findMany({where:{deletedAt:null},select:{id:true,timezone:true}});let count=0;
 for(const c of condos){const month=previousMonth(now,c.timezone||"America/Recife");const id=crypto.createHash("sha256").update(`monthly-review:${c.id}:${month}`).digest("hex").slice(0,32).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,"$1-$2-$3-$4-$5");
 const dates=period({start:month+"-01",end:new Date(Date.UTC(+month.slice(0,4),+month.slice(5),0)).toISOString().slice(0,10)},now,c.timezone||"America/Recife");const activity=await db.package.count({where:{condominiumId:c.id,deletedAt:null,receivedAt:{gte:dates.start,lte:dates.end}}})+await db.visitor.count({where:{condominiumId:c.id,deletedAt:null,createdAt:{gte:dates.start,lte:dates.end}}});if(!activity)continue;
 await db.notification.upsert({where:{id},update:{},create:{id,condominiumId:c.id,targetRole:"CONDOMINIUM_ADMIN",title:`Fechamento mensal • ${month}`,message:"Revise encomendas e visitantes em Relatórios → Fechamento mensal. Exporte o documento e confirme o arquivamento dos concluídos. Pendências continuam ativas.",type:"INFO",module:"MONTHLY_REVIEW",referenceId:month,origin:"SYSTEM"}});count++;}
 return {count};
}

export async function operationEvents(user,kind,query={},db=prisma){
 reviewActor(user);if(!["packages","visitors"].includes(kind))throw new ApiError("Módulo inválido.",422);
 const module=kind==="packages"?"PACKAGE":"VISITOR",page=Number(query.page||1);if(!Number.isInteger(page)||page<1||page>100000)throw new ApiError("Página inválida.",422);
 const where={condominiumId:user.condominiumId,module,deletedAt:null};
 const [items,total]=await Promise.all([db.auditLog.findMany({where,orderBy:[{createdAt:"desc"},{id:"desc"}],take:25,skip:(page-1)*25,select:{id:true,userName:true,userRole:true,createdAt:true,action:true,referenceId:true,details:true}}),db.auditLog.count({where})]);return {items,total,page};
}
