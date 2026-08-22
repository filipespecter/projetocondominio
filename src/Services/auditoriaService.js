import api from "./api.js";

const unwrap = (r) => r?.data?.data ?? r?.data ?? [];

export async function buscarAuditoria() {
  const response = await api.get("/v1/audit");
  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
}


export async function buscarAuditoriaPorModulo(modulo) {
  const logs = await buscarAuditoria();
  return logs.filter((item) => item.module === modulo || item.modulo === modulo);
}

export async function buscarAuditoriaPorPerfil(perfil) {
  const logs = await buscarAuditoria();
  return logs.filter((item) => item.role === perfil || item.perfil === perfil);
}

export async function limparAuditoria() {
  throw new Error("Logs de auditoria não podem ser apagados pelo frontend.");
}