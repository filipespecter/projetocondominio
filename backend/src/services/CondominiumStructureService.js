import { z } from "zod";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
const floor = z.object({ floor:z.number().int().min(-10).max(300), numbers:z.array(z.string().trim().regex(/^[0-9A-Za-z-]{1,12}$/)).min(1).max(200) }).strict();
const schema=z.object({hasBlocks:z.boolean(),blocks:z.array(z.object({name:z.string().trim().max(40),floors:z.array(floor).min(1).max(310)}).strict()).min(1).max(100),generate:z.boolean().default(false)}).strict();
export function validateStructure(input){
 const result=schema.safeParse(input);if(!result.success)throw new ApiError("Confira blocos, andares e numeração da estrutura.",422);
 const data=result.data,units=[],keys=new Set();if(!data.hasBlocks&&data.blocks.length!==1)throw new ApiError("Sem blocos, configure apenas um edifício.",422);
 const blockNames=new Set();
 for(const b of data.blocks){if(blockNames.has(b.name.toLowerCase()))throw new ApiError("Há blocos duplicados na estrutura.",422);blockNames.add(b.name.toLowerCase());if(new Set(b.floors.map(f=>f.floor)).size!==b.floors.length)throw new ApiError("Há andares duplicados no bloco.",422);if(data.hasBlocks&&!b.name)throw new ApiError("Informe o nome de cada bloco.",422);const block=data.hasBlocks?b.name:"Sem bloco";
 for(const f of b.floors)for(const number of f.numbers){const key=`${block.toLowerCase()}|${number.toLowerCase()}`;if(keys.has(key))throw new ApiError("Há unidades duplicadas na estrutura.",422);keys.add(key);units.push({block,number,floor:f.floor});}}
 if(units.length>5000)throw new ApiError("A estrutura deve conter até 5 mil unidades.",422);return {...data,units,total:units.length};
}
export function structureMetrics(structure, apartments){
 const total=structure?.total || null,occupied=apartments.filter(a=>a.status==="OCCUPIED").length;
 return {total,registered:apartments.length,occupied,unknown:apartments.filter(a=>a.status==="UNKNOWN").length,registrationPercent:total?apartments.length/total*100:null,occupancyPercent:total?occupied/total*100:null};
}
export async function readStructure(user,db=prisma){
 if(!user?.condominiumId||!["CONDOMINIUM_ADMIN","MANAGER"].includes(user.role))throw new ApiError("Acesso restrito à gestão.",403);
 const c=await db.condominium.findUnique({where:{id:user.condominiumId},select:{settings:true}});const apartments=await db.apartment.findMany({where:{condominiumId:user.condominiumId,deletedAt:null},select:{block:true,number:true,floor:true,status:true}});
 const structure=c?.settings?.structure || null;return {structure,existingUnits:apartments.map(({block,number,floor})=>({block,number,floor})),metrics:structureMetrics(structure,apartments)};
}
export async function saveStructure(user,input,db=prisma){
 if(user?.role!=="CONDOMINIUM_ADMIN"||!user.condominiumId)throw new ApiError("Somente o síndico pode configurar a estrutura.",403);
 const data=validateStructure(input),id=user.condominiumId;
 await db.$transaction(async tx=>{
 await tx.$executeRaw`SELECT id FROM "Condominium" WHERE id = ${id}::uuid FOR UPDATE`;
 const condo=await tx.condominium.findUnique({where:{id},select:{settings:true}});
 const existing=await tx.apartment.findMany({where:{condominiumId:id,deletedAt:null},select:{block:true,number:true,floor:true}});
 if(existing.some(a=>!data.units.some(u=>u.block.toLowerCase()===a.block.toLowerCase()&&u.number.toLowerCase()===a.number.toLowerCase()&&u.floor===a.floor)))throw new ApiError("A estrutura precisa incluir todas as unidades já cadastradas. Confira os blocos e números; nenhum registro foi apagado.",409);
 if(data.generate)for(const u of data.units){const found=existing.find(a=>a.block.toLowerCase()===u.block.toLowerCase()&&a.number.toLowerCase()===u.number.toLowerCase());if(!found){const previous=await tx.apartment.findFirst({where:{condominiumId:id,block:u.block,number:u.number}});if(previous)throw new ApiError("Há uma unidade arquivada com a mesma identificação. Revise antes de gerar.",409);await tx.apartment.create({data:{...u,condominiumId:id,status:"UNKNOWN"}});}}
 const structure={hasBlocks:data.hasBlocks,blocks:data.blocks,total:data.total,updatedAt:new Date().toISOString()};
 await tx.condominium.update({where:{id},data:{settings:{...(condo.settings||{}),structure}}});
 await tx.auditLog.create({data:{condominiumId:id,userId:user.id,userName:user.name,userRole:user.role,action:"UPDATE",module:"CONDOMINIUM_STRUCTURE",details:`Estrutura conferida: ${data.total} unidades; geração ${data.generate?"solicitada":"não solicitada"}.`}});
 });return readStructure(user,db);
}

export async function validateStructureUnit(condominiumId,unit,db=prisma){
 const c=await db.condominium.findUnique({where:{id:condominiumId},select:{settings:true}});const structure=c?.settings?.structure;if(!structure)throw new ApiError("Configure primeiro a estrutura do condomínio em Apartamentos.",409);
 if(!structure.blocks.some(b=>(structure.hasBlocks?b.name:"Sem bloco").toLowerCase()===String(unit.block).trim().toLowerCase()&&b.floors.some(f=>f.floor===Number(unit.floor)&&f.numbers.some(n=>n.toLowerCase()===String(unit.number).trim().toLowerCase()))))throw new ApiError("A unidade precisa pertencer à estrutura configurada. Confira bloco, andar e número.",422);
}
