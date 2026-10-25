import prisma from "../config/prisma.js";
import {z} from "zod";
import {ApiError} from "../utils/ApiError.js";
import {period} from "../utils/indicatorMath.js";
const definitions={
 residents:{model:"resident",stock:true,select:{residentType:true,isPrimary:true,createdAt:true,user:{select:{name:true,status:true}},apartment:{select:{block:true,number:true}}}},
 apartments:{model:"apartment",stock:true,select:{block:true,number:true,floor:true,status:true}},
 doormen:{model:"doorman",stock:true,select:{code:true,shift:true,user:{select:{name:true,status:true}}}},
 areas:{model:"commonArea",stock:true,select:{name:true,capacity:true,active:true}},
 notices:{model:"notice",select:{title:true,status:true,createdAt:true,publishedAt:true}},
 providers:{model:"serviceProvider",stock:true,select:{name:true,companyName:true,serviceType:true,status:true}},
 operational:{model:"operationalRecord",select:{recordDate:true,responsibleName:true,previousReading:true,currentReading:true,consumption:true,wellStatus:true,createdAt:true}},
 packages:{model:"package",date:"receivedAt",select:{receivedBy:{select:{name:true}},deliveredBy:{select:{name:true}},type:true,status:true,receivedAt:true,deliveredAt:true,apartment:{select:{block:true,number:true}}}},
 visitors:{model:"visitor",select:{registeredBy:{select:{name:true}},authorizedBy:{select:{name:true}},name:true,status:true,createdAt:true,enteredAt:true,exitedAt:true,apartment:{select:{block:true,number:true}}}},
 reservations:{model:"reservation",select:{status:true,createdAt:true,reservationDate:true,startTime:true,endTime:true,apartment:{select:{block:true,number:true}}}},
 occurrences:{model:"occurrence",select:{title:true,category:true,status:true,priority:true,createdAt:true,resolvedAt:true,apartment:{select:{block:true,number:true}}}}
};
export async function managementReport(user,subject,input,db=prisma){
 if(!user?.condominiumId||!["CONDOMINIUM_ADMIN","MANAGER"].includes(user.role))throw new ApiError("Relatório restrito à gestão.",403);
 const def=definitions[subject];if(!def)throw new ApiError("Assunto inválido.",422);
 const p=z.object({start:z.string().optional(),end:z.string().optional(),status:z.string().regex(/^[A-Z_]{2,40}$/).optional()}).strict().safeParse(input);if(!p.success)throw new ApiError("Confira o período e a situação.",422);const q=p.data;
 const c=await db.condominium.findUnique({where:{id:user.condominiumId},select:{name:true,logoUrl:true,timezone:true,settings:true}}),dates=period(q,new Date(),c.timezone||"America/Recife");
 const rows=await db[def.model].findMany({where:{condominiumId:user.condominiumId,deletedAt:null,...(def.stock?{}:{[def.date||"createdAt"]:{gte:dates.start,lte:dates.end}}),...(q.status?{status:q.status}:{})},select:def.select,take:10001});if(rows.length>10000)throw new ApiError("Mais de 10 mil registros. Reduza o período; nenhum arquivo foi truncado.",422);
 const totals=[[def.stock?"Registros atuais":"Registros no período",rows.length]];
 if(subject==="apartments"){const total=c.settings?.structure?.total;totals.push(["Capacidade prevista",total||null],["Cadastro concluído (%)",total?rows.length/total*100:null],["Ocupação confirmada (%)",total?rows.filter(r=>r.status==="OCCUPIED").length/total*100:null]);}
 return {simple:true,condominiumName:c.name,logoUrl:c.logoUrl,generatedAt:new Date().toISOString(),period:{start:dates.start,end:dates.end,timezone:dates.timezone},filters:q,metrics:totals,details:{[subject]:rows},methodology:[def.stock?"Esta consulta representa o cadastro atual, não a situação histórica no período.":"Registros vinculados ao condomínio, no período selecionado.","A exportação usa o mesmo resultado carregado na tela. Nenhum registro de outro condomínio é incluído."]};
}
