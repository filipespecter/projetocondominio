import authApi from "../Services/authApi.js";
export function reportIdentity(user) {
  const condo = user?.condominium;
  if (!user?.condominiumId || !condo?.name) throw new Error("Não foi possível identificar o condomínio autenticado. Atualize a sessão antes de exportar.");
  return {
    id: user.condominiumId,
    name: condo.name,
    document: condo.document || ""
  };
}
export async function currentReportIdentity() {
  return reportIdentity(await authApi.me());
}
