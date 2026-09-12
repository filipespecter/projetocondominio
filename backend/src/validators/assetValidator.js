import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
const STATUSES=["OPERATIONAL","MAINTENANCE","DEFECTIVE","INACTIVE","REPLACED"];
function issues(e){return e.issues.map(i=>({field:i.path.length?i.path.join("."):null,message:i.message,code:i.code}));}
function wrap(schema,key="body"){return(req,_res,next)=>{const r=schema.safeParse(req[key]??{});if(!r.success)return next(new ApiError("Dados do ativo inválidos.",422,issues(r.error)));if(key==="query"){Object.defineProperty(req,"query",{value:r.data,writable:true,configurable:true,enumerable:true});}else{req[key]=r.data;}return next();};}
const opt=max=>z.union([z.string().trim().max(max),z.null()]).optional().transform(v=>v===""?null:v);
const uuidOpt=z.union([z.string().uuid(),z.null(),z.literal("")]).optional().transform(v=>v===""?null:v);
const date=z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.null(),z.literal("")]).optional().transform(v=>v===""?null:v);
const file=z.string().startsWith("data:").max(12*1024*1024);
export const createAssetSchema=z.object({
  name:z.string().trim().min(2).max(180), category:z.string().trim().min(2).max(120),
  assetTag:opt(80), manufacturer:opt(120), model:opt(120), serialNumber:opt(120), location:opt(180),
  acquiredAt:date, warrantyUntil:date, supplierId:uuidOpt, responsibleUserId:uuidOpt,
  status:z.enum(STATUSES).default("OPERATIONAL"), notes:opt(2000),
  attachmentFileName:opt(180), attachmentDataUrl:file.optional(),
}).strict();
export const updateAssetSchema=createAssetSchema.partial().refine(d=>Object.keys(d).length>0,{message:"Informe ao menos um campo."});
const id=z.object({id:z.string().uuid()}).strict();
const list=z.object({status:z.enum(STATUSES).optional(),category:z.string().trim().max(120).optional(),supplierId:z.string().uuid().optional(),search:z.string().trim().max(150).optional()}).strict();
export const validateCreateAsset=wrap(createAssetSchema);
export const validateUpdateAsset=wrap(updateAssetSchema);
export const validateAssetId=wrap(id,"params");
export const validateAssetList=wrap(list,"query");
