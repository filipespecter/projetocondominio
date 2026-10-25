import { z } from "zod";
import crypto from "node:crypto";
import prisma from "../config/prisma.js";
import env from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { managementReport } from "./ManagementReportService.js";
import { apartmentReport } from "./ApartmentReportService.js";
import { intelligence } from "./IntelligenceService.js";
import {
  mean,
  median,
  secondsBetween,
  period,
  group,
} from "../utils/indicatorMath.js";
import {
  saveReportSnapshot,
  readReportSnapshot,
} from "../utils/reportSnapshotStore.js";
import {
  subjects,
  groups,
  relevance,
  reportConfigSchema,
  allowedGroups,
  titleOf,
  formatNumber,
  duration,
  values,
  reportTable,
  extraMetrics,
} from "../utils/reportWorkspaceCatalog.js";
function actor(user) {
  if (
    !user?.id ||
    !user?.condominiumId ||
    !["CONDOMINIUM_ADMIN", "MANAGER"].includes(user.role)
  )
    throw new ApiError("Relatórios restritos à gestão do condomínio.", 403);
}
export async function reportBIAccess(user, db = prisma) {
  actor(user);
  const s = await db.subscription.findFirst({
    where: {
      condominiumId: user.condominiumId,
      status: { in: ["TRIAL", "ACTIVE", "OVERDUE"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      plan: {
        select: {
          planFeatures: {
            where: {
              enabled: true,
              feature: { active: true, deletedAt: null },
            },
            select: { feature: { select: { code: true } } },
          },
        },
      },
    },
  });
  return !!s?.plan?.planFeatures?.some(
    (x) => x.feature.code === "BI_DASHBOARD",
  );
}
const parseConfig = (input) => {
  const p = reportConfigSchema.safeParse(input);
  if (!p.success) throw new ApiError("Confira as opções do relatório.", 422);
  return {
    ...p.data,
    groups: [...new Set(p.data.groups)],
    datasets: [...new Set(p.data.datasets)],
  };
};
export async function reportWorkspaceBoot(user, db = prisma) {
  actor(user);
  const [hasBI, units, presets, history] = await Promise.all([
    reportBIAccess(user, db),
    db.apartment.findMany({
      where: { condominiumId: user.condominiumId, deletedAt: null },
      select: {
        id: true,
        block: true,
        number: true,
        floor: true,
        residents: {
          where: { deletedAt: null, user: { deletedAt: null } },
          select: { userId: true, user: { select: { name: true } } },
        },
      },
      orderBy: [{ block: "asc" }, { number: "asc" }],
      take: 10001,
    }),
    db.auditLog.findMany({
      where: {
        condominiumId: user.condominiumId,
        userId: user.id,
        module: "REPORT_PRESET",
        deletedAt: null,
      },
      select: { id: true, afterData: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    reportHistory(user, db),
  ]);
  if (units.length > 10000)
    throw new ApiError("Muitas unidades para carregar. Solicite suporte.", 422);
  return {
    relevance,
    subjects: subjects.filter(
      ([id]) => id !== "security" || user.role === "CONDOMINIUM_ADMIN",
    ),
    groups: groups.filter(
      ([key]) => key !== "sessions" || user.role === "CONDOMINIUM_ADMIN",
    ),
    hasBI,
    role: user.role,
    units,
    presets: presets.map((p) => ({
      id: p.id,
      name: p.afterData?.name,
      config: p.afterData?.config,
    })),
    history,
  };
}
function sign(model, user, expiresAt) {
  return crypto
    .createHmac("sha256", env.JWT_ACCESS_SECRET)
    .update(
      "InfinityCondo/report-preview/v1|" +
        JSON.stringify({
          model,
          userId: user.id,
          condominiumId: user.condominiumId,
          role: user.role,
          expiresAt,
        }),
    )
    .digest("hex");
}
export async function previewWorkspaceReport(
  user,
  input,
  db = prisma,
  services = { managementReport, apartmentReport, intelligence },
  options = {},
) {
  actor(user);
  const c = parseConfig(input);
  if (c.subject === "security" && user.role !== "CONDOMINIUM_ADMIN")
    throw new ApiError("Auditoria restrita ao síndico.", 403);
  if (c.block && !c.apartmentId && c.floor === undefined)
    throw new ApiError("Selecione o andar para filtrar o bloco.", 422);
  if (c.person && !c.apartmentId && c.floor === undefined)
    throw new ApiError("Selecione a unidade para filtrar uma pessoa.", 422);
  const hasBI =
    c.groups.length > 0 || ["communications", "security"].includes(c.subject)
      ? await reportBIAccess(user, db)
      : false;
  const validStatuses = {
    packages: ["EXPECTED", "RECEIVED", "DELIVERED", "CANCELED"],
    visitors: [
      "WAITING",
      "AUTHORIZED",
      "INSIDE",
      "EXITED",
      "DENIED",
      "CANCELED",
    ],
    reservations: ["PENDING", "APPROVED", "DENIED", "CANCELED", "COMPLETED"],
    occurrences: [
      "NEW",
      "FORWARDED",
      "IN_REVIEW",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "CANCELED",
    ],
  };
  if (c.status && !validStatuses[c.subject]?.includes(c.status))
    throw new ApiError("Situação inválida para o assunto selecionado.", 422);
  const allowed = allowedGroups(c, user, hasBI);
  if (c.groups.some((key) => !allowed.includes(key)))
    throw new ApiError(
      "Métrica indisponível para o assunto, unidade, perfil ou plano selecionado.",
      403,
    );
  if (["communications", "security"].includes(c.subject) && !hasBI)
    throw new ApiError(
      "Este relatório exige o recurso de BI do Plano Completo.",
      403,
    );
  const condo = await db.condominium.findUnique({
    where: { id: user.condominiumId },
    select: { name: true, timezone: true, logoUrl: true },
  });
  const dates = period(c, new Date(), condo.timezone || "America/Recife"),
    zone = dates.timezone;
  const basicKeys = ["executive", "custom"].includes(c.subject)
    ? c.subject === "custom" && c.datasets.length
      ? c.datasets
      : ["packages", "visitors", "reservations", "occurrences"]
    : ["communications", "security"].includes(c.subject)
      ? []
      : [c.subject];
  let summary = [],
    extra = [],
    collections = [],
    methodology = [],
    recordCount = 0,
    personName = "";
  if (c.apartmentId || c.floor !== undefined) {
    if (
      ![
        "executive",
        "custom",
        "residents",
        "packages",
        "visitors",
        "reservations",
        "occurrences",
      ].includes(c.subject) ||
      basicKeys.some(
        (key) =>
          ![
            "residents",
            "apartments",
            "packages",
            "visitors",
            "reservations",
            "occurrences",
          ].includes(key),
      )
    )
      throw new ApiError(
        "Este assunto não possui vínculo individual de unidade. Selecione todas as unidades.",
        422,
      );
    const d = await services.apartmentReport(
      user,
      Object.fromEntries(
        Object.entries({
          apartmentId: c.apartmentId,
          floor: c.floor,
          block: c.block,
          person: c.person,
          start: c.start,
          end: c.end,
        }).filter(([, v]) => v !== undefined),
      ),
      db,
    );
    personName = c.person
      ? d.current.flatMap((u) => u.residents).find((p) => p.userId === c.person)
          ?.name || "Pessoa selecionada"
      : "";
    const rows = {
      ...d.details,
      residents: d.current.flatMap((u) =>
        u.residents
          .filter((p) => !c.person || p.userId === c.person)
          .map((p) => ({
            name: p.name,
            residentType: p.type,
            isPrimary: p.isPrimary,
            status: p.status,
            apartment: [u.block, u.number].filter(Boolean).join(" · "),
          })),
      ),
      apartments: d.current,
    };
    for (const key of basicKeys) {
      const records = (rows[key] || []).filter(
        (x) => !c.status || x.status === c.status,
      );
      summary.push([
        `${titleOf(key)}${["residents", "apartments"].includes(key) ? " (cadastro atual)" : " no período"}`,
        formatNumber(records.length),
      ]);
      recordCount += records.length;
      if (c.content === "detailed")
        collections.push(reportTable(key, records, zone));
    }
    const packages = (rows.packages || []).filter(
        (x) => !c.status || x.status === c.status,
      ),
      visitors = (rows.visitors || []).filter(
        (x) => !c.status || x.status === c.status,
      ),
      occurrences = (rows.occurrences || []).filter(
        (x) => !c.status || x.status === c.status,
      );
    const withdrawals = packages
      .map((x) => secondsBetween(x.receivedAt, x.deliveredAt))
      .filter((x) => x !== null);
    if (c.groups.includes("withdrawal"))
      extra.push(
        ["Tempo médio de retirada", duration(mean(withdrawals))],
        ["Tempo mediano de retirada", duration(median(withdrawals))],
        ["Amostra de retiradas", formatNumber(withdrawals.length)],
      );
    if (c.groups.includes("serviceTimes"))
      extra.push(
        [
          "Tempo médio de decisão de reservas",
          duration(
            mean(
              (rows.reservations || [])
                .filter((x) => !c.status || x.status === c.status)
                .map((x) => secondsBetween(x.createdAt, x.reviewedAt))
                .filter((x) => x !== null),
            ),
          ),
        ],
        [
          "Permanência média de visitantes",
          duration(
            mean(
              visitors
                .map((x) => secondsBetween(x.enteredAt, x.exitedAt))
                .filter((x) => x !== null),
            ),
          ),
        ],
        [
          "Tempo médio de resolução de ocorrências",
          duration(
            mean(
              occurrences
                .map((x) => secondsBetween(x.createdAt, x.resolvedAt))
                .filter((x) => x !== null),
            ),
          ),
        ],
      );
    methodology = d.methodology;
  } else if (c.subject === "security") {
    const events = await db.auditLog.findMany({
      where: {
        condominiumId: user.condominiumId,
        deletedAt: null,
        createdAt: { gte: dates.start, lte: dates.end },
      },
      select: {
        action: true,
        module: true,
        userRole: true,
        userName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10001,
    });
    if (events.length > 10000)
      throw new ApiError("Mais de 10 mil eventos. Reduza o período.", 422);
    summary = [
      ["Eventos auditados", formatNumber(events.length)],
      ...group(events, (x) => x.action).map((x) => [
        values[x.name] || x.name,
        formatNumber(x.total),
      ]),
    ];
    recordCount = events.length;
    if (c.content === "detailed")
      collections.push(
        reportTable(
          "operations",
          events.map((x) => ({
            createdAt: x.createdAt,
            module: x.module,
            action: x.action,
            role: x.userRole,
            operator: x.userName,
          })),
          zone,
        ),
      );
    methodology = [
      "Eventos do condomínio no período selecionado. Dados de sessão, chaves, IPs e estados internos não integram o documento.",
    ];
  } else {
    const basic = await Promise.all(
      basicKeys.map((key) =>
        services.managementReport(
          user,
          key,
          Object.fromEntries(
            Object.entries({
              start: c.start,
              end: c.end,
              status: c.status,
            }).filter(([, v]) => v !== undefined),
          ),
          db,
        ),
      ),
    );
    basic.forEach((d, index) => {
      const key = basicKeys[index],
        rows = d.details[key] || [];
      summary.push([
        `${titleOf(key)}${["residents", "apartments", "doormen", "areas", "providers"].includes(key) ? " (cadastro atual)" : " no período"}`,
        formatNumber(rows.length),
      ]);
      for (const [label, value] of d.metrics?.slice(1) || [])
        summary.push([
          label,
          value == null
            ? "Sem amostra"
            : formatNumber(value) + (label.includes("(%)") ? "%" : ""),
        ]);
      if (key === "packages")
        summary.push([
          "Retiradas concluídas da amostra",
          formatNumber(rows.filter((x) => x.status === "DELIVERED").length),
        ]);
      if (key === "reservations")
        summary.push([
          "Reservas aprovadas da amostra",
          formatNumber(rows.filter((x) => x.status === "APPROVED").length),
        ]);
      recordCount += rows.length;
      if (c.content === "detailed")
        collections.push(reportTable(key, rows, zone));
      methodology.push(...d.methodology);
    });
    if (c.groups.length || ["communications", "security"].includes(c.subject)) {
      const moduleMap = {
        packages: "PACKAGE",
        visitors: "VISITOR",
        reservations: "RESERVATION",
        occurrences: "OCCURRENCE",
        security: "AUTH",
      };
      const d = await services.intelligence(
        user,
        {
          start: c.start,
          end: c.end,
          export: "true",
          ...(moduleMap[c.subject] ? { module: moduleMap[c.subject] } : {}),
          ...(c.status ? { status: c.status } : {}),
        },
        db,
        { auditExport: false },
      );
      extra = extraMetrics(d, c.groups);
      methodology.push(...d.methodology);
      if (c.subject === "communications")
        summary = [
          ["Mensagens no período", formatNumber(d.communications.total)],
          ...d.communications.byStatus.map((x) => [
            {
              PENDING: "Pendente",
              SENT: "Enviada",
              DELIVERED: "Entrega confirmada",
              FAILED: "Falha",
              CANCELED: "Cancelada",
            }[x.name] || x.name,
            formatNumber(x.total),
          ]),
        ];
      if (c.subject === "security")
        summary = d.security.map((x) => [
          values[x.name] || x.name,
          formatNumber(x.total),
        ]);
      if (["communications", "security"].includes(c.subject))
        recordCount = Number(
          c.subject === "communications"
            ? d.communications.total
            : d.security.reduce((n, x) => n + x.total, 0),
        );
      if (c.content === "detailed")
        for (const [group, key] of [
          ["handovers", "handovers"],
          ["maintenance", "maintenance"],
          ["participation", "assemblies"],
          ["sessions", "sessions"],
        ])
          if (c.groups.includes(group))
            collections.push(
              reportTable(key, d.details[key]?.rows || [], zone),
            );
    }
  }
  if (c.content === "detailed")
    recordCount = collections.reduce((n, t) => n + t.rows.length, 0);
  if (
    recordCount > 10000 ||
    collections.reduce((n, t) => n + t.rows.length, 0) > 10000
  )
    throw new ApiError(
      "Mais de 10 mil registros combinados. Reduza o período ou os assuntos.",
      422,
    );
  if (c.subject === "visitors")
    extra = extra.filter(([label]) => /Permanência/.test(label));
  if (c.subject === "reservations")
    extra = extra.filter(([label]) => /decisão/.test(label));
  if (c.subject === "occurrences")
    extra = extra.filter(([label]) => /resolução/.test(label));
  const id = crypto.randomUUID(),
    generatedAt = new Date().toISOString(),
    scoped = !!(c.apartmentId || c.floor !== undefined);
  let scope = "Todas as unidades";
  if (scoped) {
    const units = await db.apartment.findMany({
      where: {
        condominiumId: user.condominiumId,
        deletedAt: null,
        ...(c.apartmentId ? { id: c.apartmentId } : { floor: c.floor }),
        ...(c.block ? { block: c.block } : {}),
      },
      select: { block: true, number: true },
    });
    scope = c.apartmentId
      ? units
          .map((u) => [u.block, u.number].filter(Boolean).join(" · "))
          .join(", ")
      : `Andar ${c.floor}${c.block ? " • Bloco " + c.block : ""}`;
    if (!units.length)
      throw new ApiError("Unidade não encontrada neste condomínio.", 404);
  }
  if (c.status) scope += ` • Situação: ${values[c.status] || c.status}`;
  if (personName) scope += ` • Pessoa: ${personName}`;
  const model = {
    schemaVersion: 1,
    id,
    number: `${generatedAt.slice(0, 4)}-${id.replaceAll("-", "").slice(0, 16).toUpperCase()}`,
    title:
      options.monthlyClosure ? "FECHAMENTO MENSAL DA PORTARIA" : c.subject === "executive"
        ? "RELATÓRIO EXECUTIVO CONDOMINIAL"
        : `RELATÓRIO DE ${subjects.find(([key]) => key === c.subject)[1].toLocaleUpperCase("pt-BR")}`,
    condominiumName: condo.name.replace(/\s+/g, " "),
    generatedAt,
    emittedDay: new Intl.DateTimeFormat("sv-SE", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(generatedAt)),
    timeZone: zone,
    start: c.start,
    end: c.end,
    scope,
    responsible: (c.responsible || user.name || "Administração").replace(
      /\s+/g,
      " ",
    ),
    notes: c.notes,
    content: c.content,
    subject: c.subject,
    summary,
    extra,
    collections,
    recordCount,
    methodology: [...new Set(methodology)],
    logoUrl: c.includeLogo ? condo.logoUrl : null,
    requiresBI: !!(
      c.groups.length || ["communications", "security"].includes(c.subject)
    ),
    requiresAdmin: c.subject === "security" || c.groups.includes("sessions"),
    config: c,
  };
  const expiresAt = Date.now() + 30 * 60 * 1000;
  if (Buffer.byteLength(JSON.stringify(model)) > 8 * 1024 * 1024)
    throw new ApiError("Documento muito grande. Reduza o período.", 422);
  return { model, expiresAt, signature: sign(model, user, expiresAt) };
}
export async function saveReportPreset(user, input, db = prisma) {
  actor(user);
  const p = z
    .object({
      name: z.string().trim().min(2).max(60),
      config: reportConfigSchema,
    })
    .strict()
    .safeParse(input);
  if (!p.success)
    throw new ApiError("Informe um nome e opções válidas para o modelo.", 422);
  const config = parseConfig(p.data.config);
  config.notes = "";
  config.responsible = "";
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${user.id}::uuid FOR UPDATE`;
    const rows = await tx.auditLog.findMany({
      where: {
        condominiumId: user.condominiumId,
        userId: user.id,
        module: "REPORT_PRESET",
        deletedAt: null,
      },
      select: { id: true, afterData: true },
      take: 21,
    });
    const old = rows.find(
      (x) =>
        x.afterData?.name?.toLocaleLowerCase("pt-BR") ===
        p.data.name.toLocaleLowerCase("pt-BR"),
    );
    if (!old && rows.length >= 20)
      throw new ApiError(
        "Limite de 20 modelos. Reutilize o nome para atualizar um modelo.",
        422,
      );
    const data = { afterData: { name: p.data.name, config } };
    const row = old
      ? await tx.auditLog.update({ where: { id: old.id }, data })
      : await tx.auditLog.create({
          data: {
            ...data,
            condominiumId: user.condominiumId,
            userId: user.id,
            userRole: user.role,
            module: "REPORT_PRESET",
            action: "CREATE",
            details:
              "Modelo de seleção de relatório salvo, sem conteúdo do documento.",
          },
        });
    return { id: row.id, name: p.data.name, config };
  });
}
export async function reportHistory(user, db = prisma) {
  actor(user);
  const rows = await db.auditLog.findMany({
    where: {
      condominiumId: user.condominiumId,
      userId: user.id,
      module: "REPORT_DOCUMENT",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, createdAt: true, afterData: true },
  });
  return rows
    .filter(
      (r) => !r.afterData?.requiresAdmin || user.role === "CONDOMINIUM_ADMIN",
    )
    .map((r) => ({ id: r.id, createdAt: r.createdAt, ...r.afterData }));
}
export async function archiveWorkspaceReport(
  user,
  input,
  db = prisma,
  store = saveReportSnapshot,
) {
  actor(user);
  const p = z
    .object({
      model: z.record(z.string(), z.unknown()),
      expiresAt: z.number().int(),
      signature: z.string().regex(/^[a-f0-9]{64}$/),
      format: z.enum(["PDF", "XLSX", "CSV"]),
    })
    .strict()
    .safeParse(input);
  if (!p.success)
    throw new ApiError("Documento inválido. Atualize a prévia.", 422);
  const { model, expiresAt, signature, format } = p.data;
  if (expiresAt < Date.now())
    throw new ApiError("Prévia vencida. Atualize antes de exportar.", 409);
  const expected = sign(model, user, expiresAt);
  if (
    !crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    )
  )
    throw new ApiError(
      "A prévia foi alterada ou pertence a outro usuário. Atualize o relatório.",
      403,
    );
  if (model.requiresBI && !(await reportBIAccess(user, db)))
    throw new ApiError("Recurso de BI indisponível no plano atual.", 403);
  const metadata = {
    number: model.number,
    title: model.title,
    start: model.start,
    end: model.end,
    responsible: model.responsible,
    format,
    requiresAdmin: model.requiresAdmin,
    requiresBI: model.requiresBI,
  };
  return store(user, model, metadata, db);
}
export async function downloadWorkspaceReport(
  user,
  id,
  db = prisma,
  read = readReportSnapshot,
) {
  actor(user);
  if (!z.string().uuid().safeParse(id).success)
    throw new ApiError("Relatório não encontrado.", 404);
  const row = await db.auditLog.findFirst({
    where: {
      id,
      condominiumId: user.condominiumId,
      userId: user.id,
      module: "REPORT_DOCUMENT",
      deletedAt: null,
    },
    select: { afterData: true },
  });
  if (!row) throw new ApiError("Relatório não encontrado.", 404);
  if (row.afterData?.requiresAdmin && user.role !== "CONDOMINIUM_ADMIN")
    throw new ApiError("Documento restrito ao síndico.", 403);
  if (row.afterData?.requiresBI && !(await reportBIAccess(user, db)))
    throw new ApiError("Recurso indisponível no plano atual.", 403);
  return {
    model: await read(user, id, row.afterData.digest),
    format: row.afterData.format,
  };
}
