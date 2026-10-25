import crypto from "node:crypto";
import env from "../src/config/env.js";
env.JWT_ACCESS_SECRET ||= crypto.randomBytes(32).toString("hex");
import test from "node:test";
import assert from "node:assert/strict";
import {
  previewWorkspaceReport,
  archiveWorkspaceReport,
  downloadWorkspaceReport,
  saveReportPreset,
} from "../src/services/ReportWorkspaceService.js";
import {
  reportConfigSchema,
  allowedGroups,
  extraMetrics,
  reportTable,
} from "../src/utils/reportWorkspaceCatalog.js";
const id = "11111111-1111-4111-8111-111111111111",
  unit = "22222222-2222-4222-8222-222222222222",
  user = {
    id,
    name: "Síndico",
    role: "CONDOMINIUM_ADMIN",
    condominiumId: "33333333-3333-4333-8333-333333333333",
  },
  input = {
    subject: "executive",
    start: "2026-10-01",
    end: "2026-10-24",
    groups: [],
    content: "summary",
  };
const db = {
  condominium: {
    findUnique: async () => ({
      name: "Condomínio",
      timezone: "America/Recife",
      logoUrl: null,
    }),
  },
  subscription: {
    findFirst: async () => ({
      plan: { planFeatures: [{ feature: { code: "BI_DASHBOARD" } }] },
    }),
  },
  apartment: { findMany: async () => [{ block: "A", number: "101" }] },
};
const analytics = {
  packages: {
    total: 3,
    withdrawalMeanSeconds: 900,
    withdrawalMedianSeconds: 600,
    withdrawalSample: 2,
  },
  visitors: { stayMeanSeconds: null },
  reservations: { decisionMeanSeconds: null },
  occurrences: { resolutionTime: null },
  handovers: { total: 10, acknowledged: 8, pending: 2, resolved: 6 },
  communications: {
    total: 20,
    whatsappDelivered: 18,
    whatsappTotal: 20,
    confirmedDeliveryPercent: 90,
    failures: 0,
    byStatus: [],
  },
  administration: {
    maintenancePending: 2,
    maintenanceCompleted: 1,
    maintenanceOverdue: 1,
    assembliesScheduled: 1,
    assemblyParticipation: [
      { title: "Assembleia", participationPercent: null },
    ],
  },
  adoption: { activeUsers: 2, byModule: [{ name: "PACKAGE", total: 3 }] },
  sessionSummary: { total: 1, operators: 1, observedMeanSeconds: null },
  details: {
    handovers: { rows: [] },
    maintenance: { rows: [] },
    assemblies: { rows: [] },
    sessions: { rows: [] },
  },
  methodology: ["Origem dos registros"],
};
function services() {
  return {
    managementReport: async (actor, subject, query) => {
      assert.equal(actor.condominiumId, user.condominiumId);
      assert.equal(query.start, input.start);
      return {
        details: {
          [subject]:
            subject === "packages"
              ? [
                  {
                    status: "DELIVERED",
                    receivedAt: "2026-10-02T10:00:00Z",
                    deliveredAt: "2026-10-02T11:00:00Z",
                  },
                ]
              : [],
        },
        methodology: ["Base real"],
      };
    },
    intelligence: async (_actor, query, _db, options) => {
      assert.equal(query.export, "true");
      assert.equal(options.auditExport, false);
      return analytics;
    },
    apartmentReport: async (actor, query) => {
      assert.equal(actor.condominiumId, user.condominiumId);
      assert.equal(query.apartmentId, unit);
      return {
        current: [{ block: "A", number: "101", residents: [] }],
        details: {
          packages: [
            {
              receivedAt: "2026-10-02T10:00:00Z",
              deliveredAt: "2026-10-02T11:00:00Z",
            },
          ],
          visitors: [],
          reservations: [],
          occurrences: [],
        },
        methodology: [],
      };
    },
  };
}
test("configuração recusa campos injetados e modelos sem período", () => {
  assert.equal(
    reportConfigSchema.safeParse({ ...input, password: "secret" }).success,
    false,
  );
  assert.equal(
    reportConfigSchema.safeParse({ subject: "executive" }).success,
    false,
  );
});
test("prévia usa cálculos existentes, sem inventar amostras, e identifica documento único", async () => {
  const data = await previewWorkspaceReport(
    user,
    { ...input, groups: ["withdrawal", "handovers", "participation"] },
    db,
    services(),
  );
  assert.match(
    data.model.number,
    new RegExp("^" + new Date().getUTCFullYear() + "-[A-F0-9]{16}$"),
  );
  assert.deepEqual(
    data.model.extra.find(([name]) => name === "Tempo mediano de retirada"),
    ["Tempo mediano de retirada", "0 h 10 min"],
  );
  assert.deepEqual(
    data.model.extra.find(([name]) => name.startsWith("Participação")),
    ["Participação — Assembleia", "Sem amostra"],
  );
  assert.equal(data.model.logoUrl, null);
  assert.equal(data.model.collections.length, 0);
  assert.match(data.signature, /^[a-f0-9]{64}$/);
});
test("resumo omite tabelas individuais; detalhado preserva filtro e tabelas", async () => {
  const data = await previewWorkspaceReport(
    user,
    { ...input, subject: "packages", content: "detailed", status: "DELIVERED" },
    db,
    services(),
  );
  assert.equal(data.model.collections[0].rows.length, 1);
  assert.match(data.model.scope, /Retirada concluída/);
  assert.equal(data.model.recordCount, 1);
});
test("consulta por unidade não chama agregados gerais e mantém tempos restritos à unidade", async () => {
  const deps = services();
  deps.intelligence = () =>
    assert.fail("Não consultar agregados gerais para uma unidade");
  const data = await previewWorkspaceReport(
    user,
    { ...input, apartmentId: unit, groups: ["withdrawal"] },
    db,
    deps,
  );
  assert.equal(data.model.scope, "A · 101");
  assert.deepEqual(
    data.model.extra.find(([name]) => name === "Tempo mediano de retirada"),
    ["Tempo mediano de retirada", "1 h 0 min"],
  );
});
test("gestor não pode solicitar auditoria ou sessões individualizadas", async () => {
  for (const c of [
    { ...input, subject: "security" },
    { ...input, groups: ["sessions"] },
  ])
    await assert.rejects(
      previewWorkspaceReport({ ...user, role: "MANAGER" }, c, db, services()),
      (e) => e.statusCode === 403,
    );
});
test("porteiro, morador e usuário sem condomínio não podem acessar a prévia", async () => {
  for (const u of [
    { ...user, role: "DOORMAN" },
    { ...user, role: "RESIDENT" },
    { ...user, condominiumId: null },
  ])
    await assert.rejects(
      previewWorkspaceReport(u, input, {}, services()),
      (e) => e.statusCode === 403,
    );
});
test("não permite obter métricas premium através da rota de relatório básico", async () => {
  const basic = { ...db, subscription: { findFirst: async () => null } };
  await assert.rejects(
    previewWorkspaceReport(
      user,
      { ...input, groups: ["withdrawal"] },
      basic,
      services(),
    ),
    (e) => e.statusCode === 403,
  );
  const data = await previewWorkspaceReport(user, input, basic, services());
  assert.equal(data.model.requiresBI, false);
});
test("assunto, escopo e perfil determinam métricas; parâmetros inválidos retornam validação", async () => {
  assert.deepEqual(
    allowedGroups({ ...input, subject: "packages" }, user, true),
    ["withdrawal", "communication"],
  );
  assert.deepEqual(allowedGroups({ ...input, apartmentId: unit }, user, true), [
    "withdrawal",
    "serviceTimes",
  ]);
  await assert.rejects(
    previewWorkspaceReport(
      user,
      { ...input, status: "INVALID" },
      db,
      services(),
    ),
    (e) => e.statusCode === 422,
  );
  await assert.rejects(
    previewWorkspaceReport(
      user,
      { ...input, start: "2026-02-30" },
      db,
      services(),
    ),
    (e) => e.statusCode === 422,
  );
});
test("arquivo só é arquivado se a prévia assinada pertence ao mesmo ator e não foi alterada", async () => {
  const preview = await previewWorkspaceReport(user, input, db, services());
  let saved = 0;
  const store = async (_user, model) => {
    saved++;
    return { id: model.id };
  };
  assert.deepEqual(
    await archiveWorkspaceReport(
      user,
      { ...preview, format: "PDF" },
      db,
      store,
    ),
    { id: preview.model.id },
  );
  const tampered = {
    ...preview,
    model: { ...preview.model, summary: [["Encomendas", "99999"]] },
    format: "PDF",
  };
  await assert.rejects(
    archiveWorkspaceReport(user, tampered, db, store),
    (e) => e.statusCode === 403,
  );
  await assert.rejects(
    archiveWorkspaceReport(
      { ...user, id: unit },
      { ...preview, format: "PDF" },
      db,
      store,
    ),
    (e) => e.statusCode === 403,
  );
  await assert.rejects(
    archiveWorkspaceReport(
      user,
      { ...preview, expiresAt: Date.now() - 1, format: "PDF" },
      db,
      store,
    ),
    (e) => e.statusCode === 409,
  );
  assert.equal(saved, 1);
});
test("histórico verifica proprietário, condomínio e perfil antes de ler o arquivo", async () => {
  let reads = 0;
  const database = {
    auditLog: {
      findFirst: async (q) => {
        assert.equal(q.where.condominiumId, user.condominiumId);
        assert.equal(q.where.userId, user.id);
        return null;
      },
    },
  };
  await assert.rejects(
    downloadWorkspaceReport(user, unit, database, async () => reads++),
    (e) => e.statusCode === 404,
  );
  await assert.rejects(
    downloadWorkspaceReport(user, "../escape", database),
    (e) => e.statusCode === 404,
  );
  assert.equal(reads, 0);
});
test("modelos salvos não guardam observações pessoais nem conteúdo do documento", async () => {
  let stored;
  const tx = {
    $executeRaw: async () => {},
    auditLog: {
      findMany: async () => [],
      create: async (q) => {
        stored = q.data;
        return { id: unit };
      },
    },
  };
  await saveReportPreset(
    user,
    {
      name: "Resumo mensal",
      config: {
        ...input,
        notes: "Não guardar este texto",
        responsible: "Pessoa",
      },
    },
    { $transaction: (fn) => fn(tx) },
  );
  assert.equal(stored.afterData.config.notes, "");
  assert.equal(stored.afterData.config.responsible, "");
  assert.equal(stored.userId, user.id);
  assert.equal(stored.condominiumId, user.condominiumId);
});
test("tabelas de documentos usam lista permitida, sem hashes, tokens e identificadores internos", () => {
  const table = reportTable(
    "residents",
    [
      {
        name: "Pessoa",
        passwordHash: "sensitive",
        secret: "sensitive",
        id: unit,
        userId: id,
      },
    ],
    "America/Recife",
  );
  assert.deepEqual(table.columns, ["Nome"]);
  assert.deepEqual(table.rows, [["Pessoa"]]);
});

test("métricas de exportação incluem os mesmos totais e amostras da fonte do BI", () => {
  const metrics = extraMetrics(analytics, [
    "communication",
    "maintenance",
    "activeUsers",
    "operations",
  ]);
  assert.deepEqual(
    metrics.find(([name]) => name === "Entrega WhatsApp confirmada"),
    ["Entrega WhatsApp confirmada", "90%"],
  );
  assert.deepEqual(
    metrics.find(([name]) => name === "Manutenções pendentes"),
    ["Manutenções pendentes", "2"],
  );
  assert.deepEqual(
    metrics.find(([name]) => name === "Operações — Encomendas"),
    ["Operações — Encomendas", "3"],
  );
});

test("cópia emitida é imutável, privada e separada por condomínio", async () => {
  const fs = await import("node:fs/promises"),
    os = await import("node:os"),
    path = await import("node:path"),
    { saveReportSnapshot, readReportSnapshot } =
      await import("../src/utils/reportSnapshotStore.js");
  const original = process.cwd(),
    folder = await fs.mkdtemp(path.join(os.tmpdir(), "ic-report-storage-"));
  let saved;
  const database = {
    auditLog: {
      findFirst: async () => (saved ? { id: saved.id } : null),
      upsert: async (q) => {
        saved = q.create;
        return saved;
      },
    },
  };
  try {
    process.chdir(folder);
    const model = { id: unit, summary: [["Registros", "2"]] },
      metadata = { number: "2026-teste", format: "PDF" };
    await saveReportSnapshot(user, model, metadata, database);
    const copy = await readReportSnapshot(user, unit, saved.afterData.digest);
    assert.deepEqual(copy, model);
    await saveReportSnapshot(user, model, metadata, database);
    await assert.rejects(
      readReportSnapshot({ ...user, condominiumId: "other" }, unit),
      (e) => e.statusCode === 404,
    );
    await assert.rejects(
      saveReportSnapshot(
        user,
        { ...model, summary: [["Registros", "99"]] },
        metadata,
        database,
      ),
      (e) => e.statusCode === 409,
    );
    const dirs = await fs.readdir(
      path.join(folder, "uploads/report-snapshots"),
    );
    const files = await fs.readdir(
      path.join(folder, "uploads/report-snapshots", dirs[0]),
    );
    assert.deepEqual(files, [unit + ".json"]);
    const info = await fs.stat(
      path.join(folder, "uploads/report-snapshots", dirs[0], files[0]),
    );
    assert.equal(info.isFile(), true);
    // Windows uses ACLs; Unix permission bits are checked on Linux/macOS.
    if (process.platform !== "win32") {
      assert.equal(info.mode & 0o777, 0o600);
    }
  } finally {
    process.chdir(original);
    await fs.rm(folder, { recursive: true, force: true });
  }
});
test("auditoria detalhada usa só eventos do condomínio e não expõe dados técnicos internos", async () => {
  const database = {
    ...db,
    auditLog: {
      findMany: async (q) => {
        assert.equal(q.where.condominiumId, user.condominiumId);
        assert.equal(q.where.deletedAt, null);
        assert.equal(q.select.beforeData, undefined);
        assert.equal(q.select.ipAddress, undefined);
        return [
          {
            action: "UPDATE",
            module: "PACKAGE",
            userRole: "DOORMAN",
            userName: "Operador",
            createdAt: "2026-10-10T10:00:00Z",
          },
        ];
      },
    },
  };
  const data = await previewWorkspaceReport(
    user,
    { ...input, subject: "security", content: "detailed" },
    database,
    services(),
  );
  assert.equal(data.model.recordCount, 1);
  assert.equal(data.model.requiresAdmin, true);
  assert.ok(data.model.collections[0].columns.includes("Operador"));
});
test("datas de reserva e leituras mantêm o dia civil, sem deslocamento pelo fuso", () => {
  const table = reportTable(
    "reservations",
    [
      {
        reservationDate: new Date("2026-10-02T00:00:00Z"),
        createdAt: new Date("2026-10-02T03:00:00Z"),
      },
    ],
    "America/Recife",
  );
  assert.equal(table.rows[0][0], "02/10/2026");
  assert.match(table.rows[0][1], /^02\/10\/2026/);
});
