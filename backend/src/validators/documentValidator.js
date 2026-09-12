import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

const VISIBILITIES = ["MANAGERS_ONLY", "RESIDENTS", "DOORMEN", "ALL"];
const CATEGORIES = [
  "CONVENCAO", "REGIMENTO_INTERNO", "ATA", "CIRCULAR", "CONTRATO",
  "PRESTACAO_CONTAS", "COMUNICADO", "OUTROS",
];

function errors(error) {
  return error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : null,
    message: issue.message,
    code: issue.code,
  }));
}
function body(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) return next(new ApiError("Dados do documento inválidos.", 422, errors(result.error)));
    req.body = result.data;
    return next();
  };
}
function params(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params ?? {});
    if (!result.success) return next(new ApiError("Identificador inválido.", 422, errors(result.error)));
    req.params = result.data;
    return next();
  };
}
function query(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query ?? {});
    if (!result.success) return next(new ApiError("Filtros inválidos.", 422, errors(result.error)));
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return next();
  };
}

const optionalText = (max) => z.union([z.string().trim().max(max), z.null()]).optional().transform(v => v === "" ? null : v);
const fileData = z.string().startsWith("data:", "Arquivo inválido.").max(12 * 1024 * 1024, "Arquivo excede o limite permitido.");
const date = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null(), z.literal("")]).optional().transform(v => v === "" ? null : v);

export const createDocumentSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: optionalText(2000),
  category: z.enum(CATEGORIES),
  visibility: z.enum(VISIBILITIES).default("MANAGERS_ONLY"),
  documentDate: date,
  fileName: z.string().trim().min(1).max(180),
  fileDataUrl: fileData,
}).strict();

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  description: optionalText(2000),
  category: z.enum(CATEGORIES).optional(),
  visibility: z.enum(VISIBILITIES).optional(),
  documentDate: date,
  fileName: z.string().trim().min(1).max(180).optional(),
  fileDataUrl: fileData.optional(),
}).strict().refine(data => Object.keys(data).length > 0, { message: "Informe ao menos um campo." });

const idSchema = z.object({ id: z.string().uuid() }).strict();
const listSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  visibility: z.enum(VISIBILITIES).optional(),
  search: z.string().trim().max(150).optional(),
}).strict();

export const validateCreateDocument = body(createDocumentSchema);
export const validateUpdateDocument = body(updateDocumentSchema);
export const validateDocumentId = params(idSchema);
export const validateDocumentList = query(listSchema);
export { VISIBILITIES as DOCUMENT_VISIBILITIES, CATEGORIES as DOCUMENT_CATEGORIES };
