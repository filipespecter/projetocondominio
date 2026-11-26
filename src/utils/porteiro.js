/**
 * Rótulos e formatações usados nas telas da portaria.
 */

const TURNOS = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  NIGHT: "Noite",
  TWELVE_BY_THIRTY_SIX: "12x36",
  OTHER: "Outro",
};

const TIPOS_MORADOR = {
  OWNER: "Proprietário",
  TENANT: "Inquilino",
  DEPENDENT: "Dependente",
  OTHER: "Outro",
};

export function rotuloTurno(valor) {
  if (!valor) return "";
  return TURNOS[valor] ?? valor;
}

export function rotuloTipoMorador(valor) {
  if (!valor) return "-";
  return TIPOS_MORADOR[valor] ?? valor;
}

/** "25/11/2026 às 21:54" (ou "-" se vazio/ inválido). */
export function dataHora(valor) {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  const dia = data.toLocaleDateString("pt-BR");
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
}
