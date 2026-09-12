import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

const STATUSES = ["ACTIVE","EXPIRES_SOON","EXPIRED","CLOSED","CANCELED"];
const KINDS = ["CONTRACT","ONE_OFF_SERVICE"];
function issues(e){return e.issues.map(i=>({field:i.path.length?i.path.join("."):null,message:i.message,code:i.code}));}
function wrap(schema,key="body"){return(req,_res,next)=>{const result=schema.safeParse(req[key]??{});if(!result.success)return next(new ApiError("Dados do contrato/serviço inválidos.",422,issues(result.error)));if(key==="query"){Object.defineProperty(req,"query",{value:result.data,writable:true,configurable:true,enumerable:true});}else{req[key]=result.data;}return next();};}
const opt=max=>z.union([z.string().trim().max(max),z.literal(""),z.null()]).optional().transform(v=>v===""?null:v);
const uuidOpt=z.union([z.string().uuid(),z.literal(""),z.null()]).optional().transform(v=>v===""?null:v);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalDate=z.union([date,z.literal(""),z.null()]).optional().transform(v=>v===""?null:v);
const file=z.string().startsWith("data:").max(12*1024*1024);

const base = {
  supplierId:z.string().uuid(),
  contractKind:z.enum(KINDS).default("CONTRACT"),
  serviceType:z.string().trim().min(2).max(180),
  reference:opt(100),
  description:z.string().trim().min(2).max(3000),
  valueInCents:z.number().int().nonnegative().nullable().optional(),
  startDate:date,
  endDate:optionalDate,
  autoRenew:z.boolean().default(false),
  responsibleUserId:uuidOpt,
  status:z.enum(STATUSES).default("ACTIVE"),
  notes:opt(2000),
  documentFileName:opt(180),
  documentDataUrl:file.optional(),
};

export const createContractSchema=z.object(base).strict().superRefine((data,ctx)=>{
  if(data.contractKind==="CONTRACT"&&!data.endDate)ctx.addIssue({code:z.ZodIssueCode.custom,path:["endDate"],message:"Informe o vencimento do contrato."});
  if(data.endDate&&new Date(data.endDate)<new Date(data.startDate))ctx.addIssue({code:z.ZodIssueCode.custom,path:["endDate"],message:"O vencimento não pode ser anterior ao início."});
});

export const updateContractSchema=z.object({
  supplierId:z.string().uuid().optional(),
  contractKind:z.enum(KINDS).optional(),
  serviceType:z.string().trim().min(2).max(180).optional(),
  reference:opt(100),description:z.string().trim().min(2).max(3000).optional(),
  valueInCents:z.number().int().nonnegative().nullable().optional(),
  startDate:date.optional(),endDate:optionalDate,autoRenew:z.boolean().optional(),
  responsibleUserId:uuidOpt,status:z.enum(STATUSES).optional(),notes:opt(2000),
  documentFileName:opt(180),documentDataUrl:file.optional(),
}).strict().refine(d=>Object.keys(d).length>0,{message:"Informe ao menos um campo."});

const id=z.object({id:z.string().uuid()}).strict();
const list=z.object({supplierId:z.string().uuid().optional(),status:z.enum(STATUSES).optional(),contractKind:z.enum(KINDS).optional(),search:z.string().trim().max(150).optional()}).strict();
export const validateCreateContract=wrap(createContractSchema);
export const validateUpdateContract=wrap(updateContractSchema);
export const validateContractId=wrap(id,"params");
export const validateContractList=wrap(list,"query");
