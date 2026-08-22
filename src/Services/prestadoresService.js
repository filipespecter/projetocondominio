import serviceProviderApi from "./serviceProviderApi.js";

export async function buscarPrestadores() { return serviceProviderApi.list(); }
export async function buscarPrestador(id) { return (await serviceProviderApi.list()).find((p) => String(p.id) === String(id)); }
export async function salvarPrestadores() { throw new Error("Persistência em lote desativada; use a API de prestadores."); }
export async function adicionarPrestador(prestador) { return serviceProviderApi.create(prestador); }
export async function atualizarPrestador(id, dados) { return serviceProviderApi.update(id, dados); }
export async function excluirPrestador(id) { await serviceProviderApi.remove(id); return true; }
export async function alterarStatusPrestador(id, status) {
  const value = String(status || "").toLowerCase();
  if (["ativo", "active", "em execução", "aguardando liberação"].includes(value)) return serviceProviderApi.activate(id);
  if (["bloqueado", "blocked"].includes(value)) return serviceProviderApi.block(id);
  return serviceProviderApi.deactivate(id);
}
export async function buscarPrestadoresAtivos() { return (await buscarPrestadores()).filter((p) => String(p.status || "").toUpperCase() === "ACTIVE"); }
export async function buscarPrestadoresFinalizados() { return (await buscarPrestadores()).filter((p) => ["INACTIVE", "FINISHED"].includes(String(p.status || "").toUpperCase())); }
export async function buscarPrestadoresPorApartamento(apartamento) { return (await buscarPrestadores()).filter((p) => String(p.apartamento || p.apartment || "") === String(apartamento)); }
export async function buscarPrestadoresPorMorador(moradorId) { return (await buscarPrestadores()).filter((p) => String(p.moradorId || p.residentId || "") === String(moradorId)); }
export async function buscarPrestadoresPorStatus(status) { return (await buscarPrestadores()).filter((p) => String(p.status) === String(status)); }
export async function existeCpfDuplicado(cpf, id = null) {
  const numero = String(cpf || "").replace(/\D/g, "");
  return (await buscarPrestadores()).some((item) => String(item.id) !== String(id) && String(item.cpf || item.document || "").replace(/\D/g, "") === numero);
}
