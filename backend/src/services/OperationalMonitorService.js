import {period,group} from "../utils/indicatorMath.js";
import prisma from "../config/prisma.js";
import {ApiError} from "../utils/ApiError.js";
export async function operationalMonitor(user,db=prisma){
 if(!user?.condominiumId||!["CONDOMINIUM_ADMIN","MANAGER"].includes(user.role))throw new ApiError("Monitor restrito à gestão.",403);
 const base={condominiumId:user.condominiumId,deletedAt:null},now=new Date();
 const c=await db.condominium.findUnique({where:{id:user.condominiumId},select:{name:true,settings:true,timezone:true}});
 const defs=[{key:"packages",label:"Encomendas aguardando retirada",model:db.package,where:{...base,status:"RECEIVED"},date:"receivedAt",to:"/dashboard/encomendas",select:{id:true,receivedAt:true,status:true,apartment:{select:{block:true,number:true}}}},
 {key:"visitors",label:"Visitantes presentes",model:db.visitor,where:{...base,status:"INSIDE",enteredAt:{not:null},exitedAt:null},date:"enteredAt",to:"/dashboard/visitantes",select:{id:true,name:true,enteredAt:true,status:true,apartment:{select:{block:true,number:true}}}},
 {key:"occurrences",label:"Ocorrências em aberto",model:db.occurrence,where:{...base,status:{in:["NEW","FORWARDED","IN_REVIEW","IN_PROGRESS"]}},date:"createdAt",to:"/dashboard/sindico",select:{id:true,title:true,priority:true,createdAt:true,status:true}},
 {key:"handovers",label:"Passagens de serviço pendentes",model:db.shiftHandover,where:{condominiumId:user.condominiumId,resolvedAt:null},date:"createdAt",to:"/dashboard/passagem-servico",select:{id:true,title:true,priority:true,createdAt:true}},
 ];
 const panels=await Promise.all(defs.map(async d=>{const [total,rows]=await Promise.all([d.model.count({where:d.where}),d.model.findMany({where:d.where,select:d.select,orderBy:{[d.date]:"asc"},take:100})]);return {key:d.key,label:d.label,total,to:d.to,items:rows.map(x=>({id:x.id,title:x.title||x.name||(x.apartment?`${x.apartment.block} · ${x.apartment.number}`:d.label),priority:x.priority||null,since:x[d.date],status:x.status||"PENDING"})).sort((a,b)=>(["HIGH","URGENT"].includes(a.priority)?-1:0)-(["HIGH","URGENT"].includes(b.priority)?-1:0)||new Date(a.since)-new Date(b.since))};}));
 const timezone=c.timezone||"America/Recife";
 const today=new Intl.DateTimeFormat("sv-SE",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const dates=period({start:today,end:today},now,timezone),range={gte:dates.start,lte:dates.end};
 const count=(model,where)=>db[model].count({where:{...base,...where}});
 const bounded=async(model,where,select)=>{const rows=await db[model].findMany({where:{...base,...where},select,take:10001});if(rows.length>10000)throw new ApiError("Movimentação diária excede o limite do monitor. Consulte o Analytics por período.",422);return rows;};
 const [apartments,residents,doormen,providers,areas,reservations,maintenance,packagesToday,visitorsToday,operations,security]=await Promise.all([
 db.apartment.groupBy({by:["status"],where:base,_count:{_all:true}}),
 count("resident",{user:{status:"ACTIVE",deletedAt:null}}),count("doorman",{user:{status:"ACTIVE",deletedAt:null}}),count("serviceProvider",{status:"ACTIVE"}),count("commonArea",{active:true}),
 count("reservation",{reservationDate:{gte:new Date(today+"T00:00:00Z"),lte:new Date(today+"T23:59:59.999Z")},status:{in:["PENDING","APPROVED"]}}),
 db.assetMaintenance.count({where:{condominiumId:user.condominiumId,completedAt:null,scheduledAt:{lt:dates.start},asset:{deletedAt:null}}}),
 bounded("package",{receivedAt:range},{id:true,receivedAt:true,apartment:{select:{block:true,number:true}}}),
 bounded("visitor",{enteredAt:range},{id:true,enteredAt:true}),
 bounded("auditLog",{createdAt:range,module:{not:"AUTH"}},{id:true,module:true,action:true,createdAt:true}),
 user.role==="CONDOMINIUM_ADMIN"?bounded("auditLog",{createdAt:range,module:"AUTH"},{id:true,action:true,createdAt:true}):null
 ]);
 const hourly=Array.from({length:24},(_,hour)=>({name:String(hour).padStart(2,"0")+"h",packages:0,visitors:0}));
 for(const [rows,date,key] of [[packagesToday,"receivedAt","packages"],[visitorsToday,"enteredAt","visitors"]])for(const row of rows){const hour=+new Intl.DateTimeFormat("en-GB",{timeZone:timezone,hour:"2-digit",hourCycle:"h23"}).format(new Date(row[date]));hourly[hour][key]++;}
 const registered=apartments.reduce((n,x)=>n+x._count._all,0),occupied=apartments.find(x=>x.status==="OCCUPIED")?._count._all||0;
 const capacity=Number.isInteger(c.settings?.structure?.total)&&c.settings.structure.total>0?c.settings.structure.total:null;
 const recent=[...packagesToday.map(x=>({id:x.id,at:x.receivedAt,title:"Encomenda recebida"})),...visitorsToday.map(x=>({id:x.id,at:x.enteredAt,title:"Entrada de visitante"})),...operations.map(x=>({id:x.id,at:x.createdAt,title: x.module,action:x.action}))].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,8);
 return {timezone,today,hourly,recent,reservationsToday:reservations,maintenanceOverdue:maintenance,panorama:{capacity,registered,occupied,residents,doormen,providers,areas,occupancyPercent:capacity?occupied/capacity*100:null},rankings:{apartments:group(packagesToday,x=>[x.apartment?.block,x.apartment?.number].filter(Boolean).join(" · ")||"Sem unidade"),modules:group(operations,x=>x.module)},security:security===null?null:{events:security.length,byAction:group(security,x=>x.action)},condominiumName:c.name,generatedAt:now.toISOString(),theme:{corPrincipal:/^#[0-9a-f]{6}$/i.test(c.settings?.theme?.corPrincipal||"")?c.settings.theme.corPrincipal:"#7c3aed",aplicarTemaPersonalizado:c.settings?.theme?.aplicarTemaPersonalizado===true},panels,methodology:"Posição atual dos registros. Listas exibem até 100 pendências mais antigas por assunto; totais abrangem todos os registros autorizados. Não representa nota de saúde ou desempenho de funcionários."};
}
