import { ApiError } from "./ApiError.js";
const COMMON = new Set(["123456789012","password1234","senha123456","qwerty123456","admin123456","infinitycondo","starinfinity","111111111111"]);
export function validatePasswordPolicy(value, label = "senha") {
  const password = String(value ?? "");
  if (password.length < 12 || password.length > 128) throw new ApiError(`A ${label} deve possuir entre 12 e 128 caracteres.`, 400);
  if (COMMON.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) throw new ApiError(`A ${label} é muito comum. Use uma frase-senha exclusiva.`, 400);
  return password;
}
