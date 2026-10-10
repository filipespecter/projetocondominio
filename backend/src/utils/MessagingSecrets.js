import crypto from "node:crypto";
import { ApiError } from "./ApiError.js";
function key() {
  const value = process.env.MESSAGING_ENCRYPTION_KEY || "";
  if (!/^[a-fA-F0-9]{64}$/.test(value)) throw new ApiError("A comunicação segura precisa ser configurada no servidor.", 503);
  return Buffer.from(value, "hex");
}
export function seal(value, context) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(context));
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}
export function unseal(value, context) {
  try {
    const [version, iv, tag, data] = String(value).split(".");
    if (version !== "v1") throw new Error();
    const cipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv,"base64url"));
    cipher.setAAD(Buffer.from(context)); cipher.setAuthTag(Buffer.from(tag,"base64url"));
    return JSON.parse(Buffer.concat([cipher.update(Buffer.from(data,"base64url")),cipher.final()]).toString("utf8"));
  } catch { throw new ApiError("Não foi possível abrir a configuração protegida.",503); }
}
export function normalizeWhatsAppPhone(value) {
  let digits=String(value||"").replace(/\D/g,"");
  if (digits.length===10 || digits.length===11) digits="55"+digits;
  if (!/^[1-9][0-9]{9,14}$/.test(digits)) throw new ApiError("Informe telefone com DDI, DDD e número válidos.",422);
  return digits;
}
