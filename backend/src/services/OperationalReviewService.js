import BackupService from "./BackupService.js";
import {realpath} from "node:fs/promises";
import path from "node:path";
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
const modes=z.enum(["WEEKLY","MONTHLY","QUARTERLY","SEMIANNUAL","ANNUAL"]);
const selection={mode:modes,reference:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)};
const dayString=d=>d.toISOString().slice(0,10);
export function closureDays(input){
 const {mode,reference}=z.object(selection).parse(input);
 const anchor=new Date(reference+"T00:00:00Z");
 if(!Number.isFinite(anchor.getTime())||dayString(anchor)!==reference||anchor.getUTCFullYear()<2000)throw new ApiError("Selecione uma data válida.",422);
 const year=anchor.getUTCFullYear(),month=anchor.getUTCMonth();
 let start,end;
 if(mode==="WEEKLY"){
   start=new Date(anchor);start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
   end=new Date(start);end.setUTCDate(end.getUTCDate()+6);
 }else{
   const size={MONTHLY:1,QUARTERLY:3,SEMIANNUAL:6,ANNUAL:12}[mode];
   const first=Math.floor(month/size)*size;
   start=new Date(Date.UTC(year,first,1));end=new Date(Date.UTC(year,first+size,0));
 }
 return {start:dayString(start),end:dayString(end),key:mode==="MONTHLY"?dayString(start).slice(0,7):mode+":"+dayString(start)};
}
async function closurePeriod(user,input,db,now=new Date()){
 reviewActor(user);if(!z.object(selection).safeParse(input).success)throw new ApiError("Confira o período e a data de referência.",422);
 const days=closureDays(input);
 const condo=await db.condominium.findUnique({where:{id:user.condominiumId},select:{timezone:true}});
 const timezone=condo?.timezone||"America/Recife";
 const d=period(days,now,timezone,370);
 if(d.end>=now)throw new ApiError("Escolha um período já encerrado.",422);
 return {...d,...{startDay:days.start,endDay:days.end,key:days.key}};
}
function monthlyInput(month){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month||""))throw new ApiError("Selecione um mês válido.",422);
 return {mode:"MONTHLY",reference:month+"-01"};
}
async function eligibleBackup(db,cutoff){
 return db.backupRecord.findFirst({where:{status:"VERIFIED",startedAt:{gte:cutoff},verifiedAt:{not:null},retentionUntil:{gt:new Date()},storageKey:{not:null},checksumSha256:{not:null}},orderBy:{verifiedAt:"desc"},select:{id:true,storageKey:true,checksumSha256:true}});
}
export async function verifyClosureBackup(db,cutoff){
 const backup=await eligibleBackup(db,cutoff);
 if(!backup)throw new ApiError("A plataforma precisa validar um backup posterior à emissão deste relatório.",409);
 try {
   const root=await realpath(BackupService.backupDirectory),file=await realpath(backup.storageKey);
   const relative=path.relative(root,file);
   if(!relative||relative.startsWith("..")||path.isAbsolute(relative))throw new Error();
   if(!(await BackupService.verifyFile(file,backup.checksumSha256)).valid)throw new Error();
 }catch{throw new ApiError("Backup ausente ou com integridade não confirmada. Solicite conferência à plataforma.",409);}
 return backup.id;
}
export async function closureSummary(user,input,db=prisma){
 const d=await closurePeriod(user,input,db),base={condominiumId:user.condominiumId,deletedAt:null,createdAt:{gte:d.start,lte:d.end}},summary={};
 let cutoff=new Date(),backupAvailable=false;
 if(input.snapshotId){
   if(!z.string().uuid().safeParse(input.snapshotId).success)throw new ApiError("Documento inválido.",422);
   const issued=await db.auditLog.findFirst({where:{condominiumId:user.condominiumId,userId:user.id,module:"MONTHLY_DOCUMENT",referenceId:input.snapshotId,deletedAt:null},select:{afterData:true}});
   const issuedAt=new Date(issued?.afterData?.cutoff);
   if(issued?.afterData?.month!==d.key||!Number.isFinite(issuedAt.getTime()))throw new ApiError("Documento incompatível com o período.",409);
   cutoff=issuedAt;
   backupAvailable=user.role==="CONDOMINIUM_ADMIN"&&Boolean(await eligibleBackup(db,cutoff));
 }
 for(const kind of ["packages","visitors"]){const model=db[kind==="packages"?"package":"visitor"],scope={...base,...(kind==="packages"?{createdAt:undefined,receivedAt:{gte:d.start,lte:d.end}}:{})};summary[kind]={total:await model.count({where:scope}),pending:await model.count({where:{...scope,status:{notIn:terminal[kind]}}}),eligible:await model.count({where:archiveCriteria(user,d,kind,cutoff)}),archived:await model.count({where:{...scope,operationalArchivedAt:{not:null}}})};}
 const history=await db.auditLog.findMany({where:{condominiumId:user.condominiumId,module:"MONTHLY_CLOSURE",referenceId:d.key,deletedAt:null},orderBy:{createdAt:"desc"},take:10,select:{id:true,userName:true,createdAt:true,afterData:true}});
 return {canClose:user.role==="CONDOMINIUM_ADMIN",start:d.startDay,end:d.endDay,summary,history,backupAvailable};
}
export async function closureDocument(user,input,db=prisma){
 reviewActor(user);const parsed=z.object({...selection,format:z.enum(["PDF","XLSX","CSV"])}).strict().safeParse(input);if(!parsed.success)throw new ApiError("Confira período e formato do relatório.",422);
 const p=parsed.data,d=await closurePeriod(user,p,db),cutoff=new Date().toISOString();
 const preview=await previewWorkspaceReport(user,{subject:"custom",start:d.startDay,end:d.endDay,content:"detailed",groups:[],datasets:["packages","visitors"],includeLogo:true,notes:"Fechamento da portaria. Pendências permanecem ativas. O arquivamento não exclui registros."},db,undefined,{closure:true,monthlyClosure:p.mode==="MONTHLY"});
 const saved=await archiveWorkspaceReport(user,{...preview,format:p.format},db);
 await db.auditLog.create({data:{condominiumId:user.condominiumId,userId:user.id,userName:user.name,userRole:user.role,module:"MONTHLY_DOCUMENT",action:"EXPORT",referenceId:saved.id,afterData:{month:d.key,cutoff},details:"Relatório consolidado emitido antes da revisão operacional."}});
 return {model:preview.model,format:p.format,snapshotId:saved.id};
}
export async function closePeriod(user,input,db=prisma,documentReader=downloadWorkspaceReport,backupVerifier=verifyClosureBackup){
 reviewActor(user,true);const parsed=z.object({...selection,snapshotId:z.string().uuid(),confirmed:z.literal(true)}).strict().safeParse(input);
 if(!parsed.success)throw new ApiError("Exporte o relatório do período e confirme o arquivamento.",422);
 const {snapshotId}=parsed.data,d=await closurePeriod(user,parsed.data,db);
 await documentReader(user,snapshotId,db);
 const issuedWhere={condominiumId:user.condominiumId,userId:user.id,module:"MONTHLY_DOCUMENT",referenceId:snapshotId,deletedAt:null};
 const priorWhere={condominiumId:user.condominiumId,module:"MONTHLY_CLOSURE",referenceId:d.key,afterData:{path:["snapshotId"],equals:snapshotId}};
 const issued=await db.auditLog.findFirst({where:issuedWhere,select:{afterData:true}});
 if(issued?.afterData?.month!==d.key)throw new ApiError("Exporte o relatório consolidado deste período antes de arquivar.",409);
 const cutoff=new Date(issued.afterData.cutoff);if(!Number.isFinite(cutoff.getTime()))throw new ApiError("Documento inválido.",409);
 const previous=await db.auditLog.findFirst({where:priorWhere,select:{afterData:true}});
 if(previous)return {...previous.afterData,repeated:true};
 const backupId=await backupVerifier(db,cutoff);
 return db.$transaction(async tx=>{
   await tx.$executeRaw`SELECT id FROM "Condominium" WHERE id = ${user.condominiumId}::uuid FOR UPDATE`;
   const repeated=await tx.auditLog.findFirst({where:priorWhere,select:{afterData:true}});
   if(repeated)return {...repeated.afterData,repeated:true};
   const packages=await tx.package.updateMany({where:archiveCriteria(user,d,"packages",cutoff),data:{operationalArchivedAt:new Date()}});
   const visitors=await tx.visitor.updateMany({where:archiveCriteria(user,d,"visitors",cutoff),data:{operationalArchivedAt:new Date()}});
   const result={snapshotId,backupId,packages:packages.count,visitors:visitors.count,start:d.startDay,end:d.endDay};
   await tx.auditLog.create({data:{condominiumId:user.condominiumId,userId:user.id,userName:user.name,userRole:user.role,module:"MONTHLY_CLOSURE",action:"UPDATE",referenceId:d.key,afterData:result,details:"Arquivamento confirmado após conferência da integridade do backup; originais, pendências e alterações posteriores preservados."}});
   return result;
 });
}
export async function monthlySummary(user,month,db=prisma){
 reviewActor(user);return {month,...await closureSummary(user,monthlyInput(month),db)};
}
export async function monthlyDocument(user,input,db=prisma){
 reviewActor(user);const p=z.object({month:z.string(),format:z.enum(["PDF","XLSX","CSV"])}).strict().safeParse(input);
 if(!p.success)throw new ApiError("Confira mês e formato do relatório.",422);
 return closureDocument(user,{...monthlyInput(p.data.month),format:p.data.format},db);
}
export async function closeMonth(user,input,db=prisma,reader=downloadWorkspaceReport,backupVerifier=verifyClosureBackup){
 reviewActor(user,true);const p=z.object({month:z.string(),snapshotId:z.string().uuid(),confirmed:z.literal(true)}).strict().safeParse(input);
 if(!p.success)throw new ApiError("Exporte o relatório mensal e confirme o arquivamento.",422);
 return closePeriod(user,{...monthlyInput(p.data.month),snapshotId:p.data.snapshotId,confirmed:true},db,reader,backupVerifier);
}
export async function operationPage(user,kind,query={},db=prisma){
 reviewActor(user);if(!["packages","visitors"].includes(kind))throw new ApiError("Módulo inválido.",422);
 const page=Number(query.page||1);if(!Number.isInteger(page)||page<1||page>100000)throw new ApiError("Página inválida.",422);
 if(query.history&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(query.history))throw new ApiError("Mês inválido.",422);
 const q=String(query.q||"").trim().slice(0,100),model=db[kind==="packages"?"package":"visitor"],where={condominiumId:user.condominiumId,deletedAt:null};
 if(query.history){const c=await db.condominium.findUnique({where:{id:user.condominiumId},select:{timezone:true}});const end=new Date(Date.UTC(+query.history.slice(0,4),+query.history.slice(5),0)).toISOString().slice(0,10);const d=period({start:query.history+"-01",end},new Date(),c?.timezone||"America/Recife");const range={gte:d.start,lte:d.end};if(kind==="packages")where.AND=[{OR:[{receivedAt:range},{receivedAt:null,createdAt:range}]}];else where.createdAt=range;}else where.AND=[{OR:[{operationalArchivedAt:null},{status:{notIn:terminal[kind]}}]}];
 if(query.status){if(!["EXPECTED","RECEIVED","DELIVERED","CANCELED","WAITING","AUTHORIZED","INSIDE","EXITED","DENIED"].includes(query.status))throw new ApiError("Situação inválida.",422);where.status=query.status;}
 if(q)where.OR=kind==="packages"?[{carrier:{contains:q,mode:"insensitive"}},{type:{contains:q,mode:"insensitive"}},{apartment:{block:{contains:q,mode:"insensitive"}}},{description:{contains:q,mode:"insensitive"}},{trackingCode:{contains:q,mode:"insensitive"}},{apartment:{number:{contains:q,mode:"insensitive"}}},{expectedByResident:{user:{name:{contains:q,mode:"insensitive"}}}}]:[{document:{contains:q,mode:"insensitive"}},{phone:{contains:q,mode:"insensitive"}},{visitType:{contains:q,mode:"insensitive"}},{notes:{contains:q,mode:"insensitive"}},{apartment:{block:{contains:q,mode:"insensitive"}}},{name:{contains:q,mode:"insensitive"}},{apartment:{number:{contains:q,mode:"insensitive"}}}];
 if(kind==="packages"&&query.apartmentId){
   if(!z.string().uuid().safeParse(query.apartmentId).success)throw new ApiError("Unidade inválida.",422);
   where.apartmentId=query.apartmentId;
 }
 if(kind==="packages"&&query.pending==="true"){where.status={in:["EXPECTED","RECEIVED"]};}
 if(kind==="packages"&&query.overdue==="true"){where.status="RECEIVED";where.receivedAt={lt:new Date(Date.now()-3*86400000)};}
 if(kind==="packages"&&query.completed==="true")where.status={in:terminal.packages};
 if(kind==="packages"&&query.view==="units"){
   const detailed=query.overviewMetrics==="true";
   const [groups,overdue]=await Promise.all([
     model.groupBy({by:["apartmentId","status"],where,_count:{_all:true}}),
     model.count({where:{AND:[where,{status:"RECEIVED",receivedAt:{lt:new Date(Date.now()-3*86400000)}}]}})
   ]);
   const counts=new Map(),statuses={},lastReceived=new Map(),pendingByUnit=new Map();
   for(const group of groups){counts.set(group.apartmentId,(counts.get(group.apartmentId)||0)+group._count._all);statuses[group.status]=(statuses[group.status]||0)+group._count._all;}
   const unitIds=[...counts.keys()].filter(Boolean);
   const unitStats=detailed&&unitIds.length?await model.groupBy({by:["apartmentId","status"],where:{condominiumId:user.condominiumId,deletedAt:null,apartmentId:{in:unitIds}},_count:{_all:true},_max:{receivedAt:true}}):[];
   for(const group of unitStats){
     if(["EXPECTED","RECEIVED"].includes(group.status))pendingByUnit.set(group.apartmentId,(pendingByUnit.get(group.apartmentId)||0)+group._count._all);
     const received=group._max?.receivedAt;
     if(received&&(!lastReceived.has(group.apartmentId)||received>lastReceived.get(group.apartmentId)))lastReceived.set(group.apartmentId,received);
   }
   const units=await db.apartment.findMany({where:{condominiumId:user.condominiumId,id:{in:unitIds}},select:{id:true,block:true,number:true}});
   let metrics;
   if(detailed){
     const scope={condominiumId:user.condominiumId,deletedAt:null};
     const condo=await db.condominium.findUnique({where:{id:user.condominiumId},select:{timezone:true}});
     const now=new Date(),timezone=condo?.timezone||"America/Recife";
     const day=now.toLocaleDateString("sv-SE",{timeZone:timezone});
     const {start,end}=period({start:day,end:day},now,timezone);
     const [pending,deliveredToday]=await Promise.all([
       model.count({where:{...scope,status:{in:["EXPECTED","RECEIVED"]}}}),
       model.count({where:{...scope,status:"DELIVERED",deliveredAt:{gte:start,lte:end}}})
     ]);
     metrics={pending,deliveredToday};
   }
   return {items:[],units:units.map(u=>({...u,count:counts.get(u.id),...(detailed?{pending:pendingByUnit.get(u.id)||0,lastReceivedAt:lastReceived.get(u.id)||null}:{})})),...(detailed?{metrics}:{}),counts:statuses,overdue,total:[...counts.values()].reduce((a,b)=>a+b,0),refreshedAt:new Date().toISOString()};
 }
 const common={id:true,status:true,createdAt:true,updatedAt:true,operationalArchivedAt:true,apartment:{select:{id:true,block:true,number:true,floor:true}}},person={select:{name:true}};
 const select=kind==="packages"?{...common,type:true,notes:true,withdrawnBy:true,withdrawnDocument:true,pickupMethod:true,pickupPersonType:true,description:true,trackingCode:true,carrier:true,receivedAt:true,deliveredAt:true,canceledAt:true,expectedByResidentId:true,apartmentId:true,receivedBy:person,deliveredBy:person,expectedByResident:{select:{id:true,user:{select:{name:true}}}}}:{...common,name:true,document:true,phone:true,visitType:true,notes:true,expectedAt:true,enteredAt:true,exitedAt:true,authorizedAt:true,deniedAt:true,apartmentId:true,registeredBy:person,authorizedBy:person};
 const [items,total]=await Promise.all([model.findMany({where,select,orderBy:[{createdAt:"desc"},{id:"desc"}],skip:(page-1)*50,take:50}),model.count({where})]);
 if(kind==="packages"&&query.noticeSummary==="true"&&items.length){
   const attempts=await db.communicationLog.findMany({
     where:{condominiumId:user.condominiumId,module:"PACKAGE",referenceId:{in:items.map(i=>i.id)},channel:{in:["EMAIL","WHATSAPP"]}},
     orderBy:[{createdAt:"desc"},{id:"desc"}],distinct:["referenceId","channel"],
     select:{referenceId:true,channel:true,status:true,metadata:true}
   });
   const byPackage=new Map();
   for(const {referenceId,channel,status,metadata} of attempts){
     if(!byPackage.has(referenceId))byPackage.set(referenceId,[]);
     byPackage.get(referenceId).push({channel,status,uncertain:status==="FAILED"&&metadata?.requiresReview===true});
   }
   for(const item of items)item.notices=byPackage.get(item.id)||[];
 }
 return {items,total,page,pages:Math.max(1,Math.ceil(total/50)),refreshedAt:new Date().toISOString()};
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
