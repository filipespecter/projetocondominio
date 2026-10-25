import crypto from "node:crypto";
import { ApiError } from "./ApiError.js";
const mac = (value, secret) => crypto.createHmac("sha256", secret).update(value).digest("base64url");
export function signNotice(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${mac(data, secret)}`;
}
export function verifyNotice(token, expected, secret, now = Date.now()) {
  if (typeof token !== "string" || token.length > 4096) throw new ApiError("Confirmação inválida.", 422);
  const [data, signature, ...rest] = token.split("."),
    signatureExpected = mac(data || "", secret);
  if (rest.length || !signature || signature.length !== signatureExpected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(signatureExpected))) throw new ApiError("Confirmação inválida.", 422);
  let payload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    throw new ApiError("Confirmação inválida.", 422);
  }
  if (!Number.isFinite(payload.expires) || payload.expires <= now || Object.entries(expected).some(([key, value]) => payload[key] !== value)) throw new ApiError("Confirmação expirada ou pertencente a outro contexto. Confira novamente.", 409);
  return payload;
}
