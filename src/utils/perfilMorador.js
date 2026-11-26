import { rotuloUnidade } from "./unidade.js";

const TIPOS = { OWNER: "Proprietário", TENANT: "Inquilino", DEPENDENT: "Dependente", OTHER: "Outro" };

// Converte a resposta de /v1/auth/me (objeto { user } ou o próprio user) nos campos
// usados pelas telas do morador. Antes as telas liam campos que a API não envia
// (nome, apartamento, moradorPrincipal...) e mostravam "Olá, Morador", "Apto -" e
// "Dependente" mesmo para o morador principal.
export function normalizarMorador(entrada) {
  if (!entrada) return null;
  const user = entrada.user ?? entrada;
  const resident = user.resident ?? {};
  const apartment = resident.apartment ?? user.apartment ?? {};
  const principal = resident.isPrimary === true || user.moradorPrincipal === true;
  return {
    ...user,
    nome: user.nome ?? user.name ?? "",
    telefone: user.telefone ?? user.phone ?? "",
    email: user.email ?? "",
    apartamento: user.apartamento ?? apartment.number ?? "",
    apto: user.apto ?? apartment.number ?? "",
    bloco: user.bloco ?? apartment.block ?? "",
    unidade: rotuloUnidade(apartment),
    apartamentoId: resident.apartmentId ?? apartment.id ?? null,
    moradorPrincipal: principal,
    perfilMorador: principal ? "principal" : "dependente",
    tipoMorador: TIPOS[resident.residentType] ?? user.tipoMorador ?? "Morador",
    permissoesMorador: {
      podeReservar: resident.canReserve !== false,
      podeAbrirSugestao: resident.canOpenOccurrence !== false,
      podeVisualizarEncomendas: resident.canViewPackages !== false, podeConvidarVisitantes: resident.canInviteVisitors !== false, podeSolicitarPrestadores: resident.canRequestServices !== false,
    },
  };
}
