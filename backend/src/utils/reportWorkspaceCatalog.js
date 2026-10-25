import { z } from "zod";
export const subjects = [
  ["executive", "Executivo", "Visão geral do condomínio."],
  ["residents", "Moradores", "Dados de moradores."],
  ["visitors", "Visitantes", "Registros de visitas."],
  ["packages", "Encomendas", "Entradas e retiradas."],
  ["reservations", "Reservas", "Áreas comuns e espaços."],
  ["occurrences", "Ocorrências", "Registros e atendimento."],
  ["providers", "Prestadores", "Serviços e atendimentos."],
  ["communications", "Comunicação", "Mensagens e comunicados."],
  ["areas", "Áreas comuns", "Uso e agendamentos."],
  ["operational", "Operacional", "Processos e rotinas."],
  ["security", "Auditoria", "Logs e rastreabilidade."],
  ["custom", "Personalizado", "Relatório sob medida."],
];
export const groups = [
  ["withdrawal", "Tempo de retirada"],
  ["serviceTimes", "Tempo de atendimento"],
  ["handovers", "Passagem de serviço"],
  ["communication", "Comunicação"],
  ["maintenance", "Manutenções"],
  ["participation", "Assembleias"],
  ["activeUsers", "Usuários ativos"],
  ["operations", "Operações por módulo"],
  ["sessions", "Sessões da portaria"],
];
export const datasets = [
  "residents",
  "apartments",
  "doormen",
  "areas",
  "notices",
  "providers",
  "operational",
  "packages",
  "visitors",
  "reservations",
  "occurrences",
];
export const relevance = {
  executive: groups.map(([key]) => key),
  custom: groups.map(([key]) => key),
  packages: ["withdrawal", "communication"],
  visitors: ["serviceTimes"],
  reservations: ["serviceTimes"],
  occurrences: ["serviceTimes"],
  communications: ["communication"],
  operational: ["handovers", "activeUsers", "operations", "sessions"],
  residents: ["activeUsers"],
  providers: [],
  areas: [],
  security: [],
};
export const reportConfigSchema = z
  .object({
    subject: z.enum(subjects.map(([key]) => key)).default("executive"),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    apartmentId: z.string().uuid().optional(),
    floor: z.coerce.number().int().min(-20).max(300).optional(),
    block: z.string().trim().max(40).optional(),
    person: z.string().uuid().optional(),
    content: z.enum(["summary", "detailed"]).default("summary"),
    groups: z
      .array(z.enum(groups.map(([key]) => key)))
      .max(9)
      .default([]),
    datasets: z.array(z.enum(datasets)).max(11).default([]),
    responsible: z.string().trim().max(120).default(""),
    notes: z.string().trim().max(1500).default(""),
    status: z
      .string()
      .regex(/^[A-Z_]{2,40}$/)
      .optional(),
    includeLogo: z.boolean().default(true),
  })
  .strict();
export function allowedGroups(config, user, hasBI) {
  if (!hasBI) return [];
  return (relevance[config.subject] || []).filter(
    (k) =>
      (k !== "sessions" || user.role === "CONDOMINIUM_ADMIN") &&
      (!(config.apartmentId || config.floor !== undefined) ||
        ["withdrawal", "serviceTimes"].includes(k)),
  );
}
export const titleOf = (key) =>
  ({
    packages: "Encomendas",
    visitors: "Visitantes",
    reservations: "Reservas",
    occurrences: "Ocorrências",
    residents: "Moradores",
    apartments: "Apartamentos",
    doormen: "Porteiros",
    areas: "Áreas comuns",
    notices: "Avisos",
    providers: "Prestadores",
    operational: "Registros operacionais",
    handovers: "Passagens de serviço",
    maintenance: "Manutenções",
    assemblies: "Assembleias",
    operations: "Operações",
    sessions: "Sessões da portaria",
    history: "Histórico de vínculos",
  })[key] || key;
export const formatNumber = (v) =>
  v == null
    ? "Sem amostra"
    : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const duration = (v) =>
  v == null
    ? "Sem amostra"
    : `${Math.floor(v / 3600)} h ${Math.floor((v % 3600) / 60)} min`;
const labels = {
  name: "Nome",
  status: "Situação",
  createdAt: "Cadastro",
  receivedAt: "Recebimento",
  deliveredAt: "Retirada",
  enteredAt: "Entrada",
  exitedAt: "Saída",
  reservationDate: "Data da reserva",
  startTime: "Início",
  endTime: "Fim",
  title: "Título",
  category: "Categoria",
  priority: "Prioridade",
  resolvedAt: "Resolução",
  reviewedAt: "Decisão",
  apartment: "Unidade",
  block: "Bloco",
  number: "Apartamento",
  floor: "Andar",
  residentType: "Tipo de morador",
  isPrimary: "Morador principal",
  user: "Morador",
  active: "Ativa",
  capacity: "Capacidade",
  code: "Identificação",
  shift: "Turno",
  serviceType: "Serviço",
  companyName: "Empresa",
  publishedAt: "Publicação",
  recordDate: "Data do registro",
  responsibleName: "Responsável",
  consumption: "Consumo",
  previousReading: "Leitura anterior",
  currentReading: "Leitura atual",
  wellStatus: "Situação do poço",
  action: "Operação",
  module: "Módulo",
  scheduledAt: "Agendamento",
  completedAt: "Conclusão",
  description: "Descrição",
  costInCents: "Valor (centavos)",
  receivedBy:"Recebido por",
  deliveredBy:"Retirada registrada por",
  registeredBy:"Cadastrado por",
  authorizedBy:"Autorizado por",
  operator: "Operador",
  role: "Perfil",
  acknowledgements: "Ciências",
  notes: "Observações",
  loginAt: "Entrada da sessão",
  logoutAt: "Saída da sessão",
  observedSpanSeconds: "Intervalo observado (s)",
  endReason: "Encerramento",
};
export const values = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  OCCUPIED: "Ocupado",
  VACANT: "Vago",
  UNKNOWN: "Não informado",
  MAINTENANCE: "Manutenção",
  RECEIVED: "Aguardando retirada",
  DELIVERED: "Retirada concluída",
  EXPECTED: "Esperada",
  CANCELED: "Cancelado",
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  DENIED: "Recusado",
  COMPLETED: "Concluído",
  WAITING: "Aguardando",
  AUTHORIZED: "Autorizado",
  INSIDE: "Presente",
  EXITED: "Saiu",
  NEW: "Nova",
  FORWARDED: "Encaminhada",
  IN_REVIEW: "Em análise",
  IN_PROGRESS: "Em atendimento",
  RESOLVED: "Resolvida",
  CLOSED: "Encerrada",
  HIGH: "Alta",
  NORMAL: "Normal",
  LOW: "Baixa",
  MEDIUM: "Média",
  URGENT: "Urgente",
  OWNER: "Proprietário",
  TENANT: "Inquilino",
  DEPENDENT: "Dependente",
  OTHER: "Outro",
  DOORMAN: "Porteiro",
  CONDOMINIUM_ADMIN: "Síndico",
  MANAGER: "Gestor",
  RESIDENT: "Morador",
  CREATE: "Cadastro",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  LOGIN: "Entrada",
  LOGOUT: "Saída",
  PACKAGE: "Encomendas",
  VISITOR: "Visitantes",
  RESERVATION: "Reservas",
  OCCURRENCE: "Ocorrências",
  SHIFT_HANDOVER: "Passagem de serviço",
  ASSEMBLY_RECORD: "Assembleias",
  ASSET: "Ativos",
  AUTH: "Autenticação",
  PUBLISHED: "Publicado",
  DRAFT: "Rascunho",
  ARCHIVED: "Arquivado",
};
function cell(v, zone, key) {
  if (v != null && ["reservationDate", "recordDate"].includes(key))
    return new Date(v)
      .toISOString()
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("/");
  if (v == null) return "Não informado";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (
    v instanceof Date ||
    (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v))
  )
    return new Date(v).toLocaleString("pt-BR", { timeZone: zone });
  if (typeof v === "number") return formatNumber(v);
  if (typeof v === "object")
    return Object.entries(v)
      .filter(([key]) => labels[key])
      .map(([key, value]) => `${labels[key]}: ${cell(value, zone)}`)
      .join("; ");
  return values[v] || String(v);
}
export function reportTable(key, rows, zone) {
  const keys = [...new Set(rows.flatMap((x) => Object.keys(x)))].filter(
    (key) => labels[key],
  );
  return {
    title: titleOf(key),
    columns: keys.map((key) => labels[key]),
    rows: rows.map((row) => keys.map((key) => cell(row[key], zone, key))),
  };
}
export function extraMetrics(d, selected) {
  const m = [];
  const put = (group, label, value, unit) => {
    if (selected.includes(group))
      m.push([
        label,
        unit === "duration"
          ? duration(value)
          : value == null
            ? "Sem amostra"
            : formatNumber(value) + (unit || ""),
      ]);
  };
  put(
    "withdrawal",
    "Tempo médio de retirada",
    d.packages.withdrawalMeanSeconds,
    "duration",
  );
  put(
    "withdrawal",
    "Tempo mediano de retirada",
    d.packages.withdrawalMedianSeconds,
    "duration",
  );
  put("withdrawal", "Amostra de retiradas", d.packages.withdrawalSample);
  put(
    "serviceTimes",
    "Permanência média de visitantes",
    d.visitors.stayMeanSeconds,
    "duration",
  );
  put(
    "serviceTimes",
    "Tempo médio de decisão de reservas",
    d.reservations.decisionMeanSeconds,
    "duration",
  );
  put(
    "serviceTimes",
    "Tempo médio de resolução de ocorrências",
    d.occurrences.resolutionTime,
    "duration",
  );
  for (const [key, label] of [
    ["total", "Passagens registradas"],
    ["acknowledged", "Passagens com ciência"],
    ["pending", "Passagens pendentes na amostra"],
    ["resolved", "Passagens resolvidas"],
  ])
    put("handovers", label, d.handovers?.[key]);
  put(
    "communication",
    "Mensagens com entrega WhatsApp confirmada",
    d.communications.whatsappDelivered,
  );
  put(
    "communication",
    "Amostra de mensagens WhatsApp",
    d.communications.whatsappTotal,
  );
  put(
    "communication",
    "Entrega WhatsApp confirmada",
    d.communications.confirmedDeliveryPercent,
    "%",
  );
  put("communication", "Falhas de comunicação", d.communications.failures);
  put(
    "maintenance",
    "Manutenções pendentes",
    d.administration.maintenancePending,
  );
  put(
    "maintenance",
    "Manutenções concluídas",
    d.administration.maintenanceCompleted,
  );
  put(
    "maintenance",
    "Manutenções atrasadas",
    d.administration.maintenanceOverdue,
  );
  put(
    "participation",
    "Assembleias agendadas",
    d.administration.assembliesScheduled,
  );
  for (const a of d.administration.assemblyParticipation || [])
    put(
      "participation",
      `Participação — ${a.title}`,
      a.participationPercent,
      "%",
    );
  put(
    "activeUsers",
    "Usuários com operação registrada",
    d.adoption.activeUsers,
  );
  for (const row of d.adoption.byModule || [])
    put("operations", `Operações — ${values[row.name] || row.name}`, row.total);
  put("sessions", "Sessões iniciadas", d.sessionSummary?.total);
  put("sessions", "Operadores com sessão", d.sessionSummary?.operators);
  put(
    "sessions",
    "Intervalo observado médio",
    d.sessionSummary?.observedMeanSeconds,
    "duration",
  );
  return m;
}
