import prisma from "../config/prisma.js";
import {z} from "zod";
import {ApiError} from "../utils/ApiError.js";
import {period} from "../utils/indicatorMath.js";
export async function apartmentReport(user,input,db=prisma){
 if(!user?.condominiumId||!["CONDOMINIUM_ADMIN","MANAGER"].includes(user.role))throw new ApiError("Consulta restrita à gestão do condomínio.",403);
 const p=z.object({apartmentId:z.string().uuid().optional(),floor:z.coerce.number().int().optional(),block:z.string().max(40).optional(),person:z.string().uuid().optional(),start:z.string().optional(),end:z.string().optional()}).strict().safeParse(input);if(!p.success)throw new ApiError("Confira unidade, andar e período.",422);const q=p.data,id=user.condominiumId;if(!q.apartmentId&&q.floor===undefined)throw new ApiError("Selecione um apartamento ou andar.",422);
 const condo=await db.condominium.findUnique({where:{id},select:{name:true,timezone:true,logoUrl:true}});const dates=period(q,new Date(),condo.timezone||"America/Recife");
 const units=await db.apartment.findMany({where:{condominiumId:id,deletedAt:null,...(q.apartmentId?{id:q.apartmentId}:{}),...(q.floor!==undefined?{floor:q.floor}:{}),...(q.block?{block:q.block}:{})},select:{id:true,block:true,number:true,floor:true,status:true,residents:{where:{deletedAt:null,user:{deletedAt:null}},select:{id:true,isPrimary:true,residentType:true,userId:true,createdAt:true,user:{select:{id:true,name:true,status:true}}}}}});if(!units.length)throw new ApiError("Unidade não encontrada neste condomínio.",404);
 const residents=units.flatMap(u=>u.residents);if(q.person&&!residents.some(r=>r.userId===q.person))throw new ApiError("Pessoa não vinculada às unidades selecionadas.",422);
 const base={condominiumId:id,deletedAt:null,apartmentId:{in:units.map(u=>u.id)}},inPeriod={gte:dates.start,lte:dates.end};
 const bounded=async(model,args)=>{const rows=await model.findMany({...args,take:10001});if(rows.length>10000)throw new ApiError("Reduza o período para exportar sem omitir registros.",422);return rows;};
 const [packages,visitors,reservations,occurrences]=await Promise.all([
 bounded(db.package,{where:{...base,receivedAt:inPeriod,...(q.person?{OR:[{expectedByResident:{userId:q.person}},{pickupResident:{userId:q.person}}]}:{})},select:{id:true,apartmentId:true,status:true,receivedAt:true,deliveredAt:true}}),
 bounded(db.visitor,{where:{...base,createdAt:inPeriod,...(q.person?{invitedByResidentId:{in:residents.filter(r=>r.userId===q.person).map(r=>r.id)}}:{})},select:{id:true,apartmentId:true,name:true,status:true,enteredAt:true,exitedAt:true,createdAt:true}}),
 bounded(db.reservation,{where:{...base,createdAt:inPeriod,...(q.person?{requestedByUserId:q.person}:{})},select:{id:true,apartmentId:true,status:true,reservationDate:true,startTime:true,endTime:true,createdAt:true,reviewedAt:true}}),
 bounded(db.occurrence,{where:{...base,createdAt:inPeriod,...(q.person?{createdByUserId:q.person}:{})},select:{id:true,apartmentId:true,title:true,status:true,createdAt:true,resolvedAt:true}})
 ]);
 const label=row=>({...row,apartment:units.find(u=>u.id===row.apartmentId)?`${units.find(u=>u.id===row.apartmentId).block} · ${units.find(u=>u.id===row.apartmentId).number}`:"",apartmentId:undefined});
 const history=await bounded(db.auditLog,{where:{condominiumId:id,module:"RESIDENT",referenceId:{in:residents.map(r=>r.id)},createdAt:inPeriod},select:{action:true,details:true,createdAt:true}});
 return {condominiumName:condo.name,logoUrl:condo.logoUrl,generatedAt:new Date().toISOString(),period:{start:dates.start,end:dates.end,timezone:dates.timezone||condo.timezone},filters:q,current:units.map(u=>({...u,residents:u.residents.map(r=>({name:r.user.name,status:r.user.status,type:r.residentType,isPrimary:r.isPrimary,userId:r.userId}))})),details:{packages:packages.map(label),visitors:visitors.map(label),reservations:reservations.map(label),occurrences:occurrences.map(label),history},methodology:["Ocupação e moradores representam a situação atual; atividades respeitam o período e o vínculo gravado no registro.","O filtro de pessoa inclui somente vínculos explícitos: destinatário, convite, solicitante ou autor. Não atribui todas as atividades do apartamento ao ocupante atual.","Histórico de vínculos só existe quando registrado. Mudanças antigas não documentadas não são reconstruídas."]};
}
