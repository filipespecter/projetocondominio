import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

function issues(error) { return error.issues.map(i => ({ field: i.path.length ? i.path.join(".") : null, message: i.message, code: i.code })); }
function wrap(schema, key = "body") { return (req,_res,next) => { const result = schema.safeParse(req[key] ?? {}); if (!result.success) return next(new ApiError("Dados de fornecedor inválidos.", 422, issues(result.error))); if (key === "query") { Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true, enumerable: true }); } else { req[key] = result.data; } return next(); }; }
const optionalText = max => z.union([z.string().trim().max(max), z.null()]).optional().transform(v => v === "" ? null : v);
const optionalEmail = z.union([z.string().trim().email("Informe um e-mail válido.").max(254), z.literal(""), z.null()]).optional().transform(v => v === "" ? null : v?.toLowerCase?.() ?? v);

export const createSupplierSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  entityType: z.enum(["COMPANY", "INDIVIDUAL", "FREELANCER"]).default("COMPANY"),
  tradeName: optionalText(200), document: optionalText(30), contactName: optionalText(150),
  phone: optionalText(30), whatsapp: optionalText(30), email: optionalEmail,
  address: optionalText(300), serviceType: optionalText(150), notes: optionalText(2000),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
}).strict();
export const updateSupplierSchema = createSupplierSchema.partial().refine(d => Object.keys(d).length > 0, { message: "Informe ao menos um campo." });
const id = z.object({ id: z.string().uuid() }).strict();
const list = z.object({ status: z.enum(["ACTIVE", "INACTIVE"]).optional(), search: z.string().trim().max(150).optional() }).strict();
export const validateCreateSupplier = wrap(createSupplierSchema);
export const validateUpdateSupplier = wrap(updateSupplierSchema);
export const validateSupplierId = wrap(id, "params");
export const validateSupplierList = wrap(list, "query");
