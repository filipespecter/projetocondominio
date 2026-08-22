import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

function errors(error){ return error.issues.map(i=>({field:i.path.join(".")||null,message:i.message,code:i.code})); }
function body(schema){ return (req,res,next)=>{ const r=schema.safeParse(req.body??{}); if(!r.success) return next(new ApiError("Dados inválidos.",422,errors(r.error))); req.body=r.data; return next(); }; }
function params(schema){ return (req,res,next)=>{ const r=schema.safeParse(req.params??{}); if(!r.success) return next(new ApiError("Parâmetros inválidos.",422,errors(r.error))); req.params=r.data; return next(); }; }
const nullableNumber=z.union([z.coerce.number().nonnegative(),z.null(),z.literal("")]).transform(v=>v===""?null:v).optional();
const schema=z.object({
  recordDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Data inválida."),
  recordTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,"Horário inválido."),
  responsibleName:z.string().trim().min(2).max(150),
  previousReading:nullableNumber,
  currentReading:nullableNumber,
  consumption:nullableNumber,
  wellStatus:z.enum(["Ligado","Desligado"]),
  notes:z.string().trim().max(1000).optional().nullable().transform(v=>v===""?null:v),
}).strict();
const idSchema=z.object({id:z.string().uuid()}).strict();
export const validateCreateOperationalRecord=body(schema);
export const validateOperationalRecordId=params(idSchema);
export default {validateCreateOperationalRecord,validateOperationalRecordId};
