import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { WahaProvisioningService } from "../src/services/WahaProvisioningService.js";
import { createControlHandler } from "../src/services/WahaControlServer.js";
import { WahaConnectionService } from "../src/services/WahaConnectionService.js";
import { Provisioner, IMAGE } from "../src/infrastructure/WahaProvisioner.mjs";
const id = "11111111-1111-4111-8111-111111111111", op = "22222222-2222-4222-8222-222222222222", lease = "33333333-3333-4333-8333-333333333333";
const owner = { id: op, name: "Central", role: "PLATFORM_OWNER", condominiumId: null };
function fixture({ status = "ACTIVE", online = true } = {}) {
  let row = null; const audits = [], writes = [], queries = [];
  const db = { condominium: { findFirst: async () => ({ id, status }) }, wahaProvisioning: {
    findUnique: async () => row,
    upsert: async ({ create, update }) => { row = row ? { ...row, ...update } : create; writes.push(row); return row; },
    update: async ({ data }) => { row = { ...row, ...data }; return row; },
    updateMany: async ({ where, data }) => { writes.push({ where, data }); return { count: row?.leaseId === where.leaseId && row?.operationId === where.operationId && row?.enabled ? 1 : 0 }; },
  }, auditLog: { create: async value => { audits.push(value); } }, $queryRaw: async (strings, ...values) => { queries.push({ sql: strings.join("?"), values }); return row ? [{ condominiumId: id }] : []; } };
  db.$transaction = async fn => fn(db);
  return { service: new WahaProvisioningService(db, () => online), db, writes, audits, queries, row: () => row, set: value => { row = value; } };
}
test("Central: consulta não cria vínculo, instância ou dado de condomínio", async () => {
  const h = fixture(); const result = await h.service.status(owner, id);
  assert.equal(result.state, "NOT_ENABLED"); assert.equal(h.writes.length, 0); assert.equal(h.audits.length, 0);
});
test("Central: síndico e suporte não podem preparar; confirmação é obrigatória", async () => {
  const h = fixture();
  for (const role of ["CONDOMINIUM_ADMIN", "PLATFORM_SUPPORT", "DOORMAN"]) await assert.rejects(h.service.prepare({ ...owner, role }, id, { confirmed: true }), e => e.statusCode === 403);
  for (const body of [{}, { confirmed: false }, { confirmed: true, condominiumId: op }]) await assert.rejects(h.service.prepare(owner, id, body), e => e.statusCode === 422);
  assert.equal(h.writes.length, 0);
});
test("Central: indisponibilidade e cliente suspenso impedem habilitação", async () => {
  await assert.rejects(fixture({ online: false }).service.prepare(owner, id, { confirmed: true }), e => e.statusCode === 503);
  const h = fixture({ status: "SUSPENDED" }); await assert.rejects(h.service.prepare(owner, id, { confirmed: true }), e => e.statusCode === 409); assert.equal(h.writes.length, 0);
});
test("Central: repetição preserva operação única e auditoria; trava por condomínio", async () => {
  const h = fixture(); await h.service.prepare(owner, id, { confirmed: true }); const operation = h.row().operationId;
  await h.service.prepare(owner, id, { confirmed: true }); assert.equal(h.row().operationId, operation); assert.equal(h.writes.length, 1); assert.equal(h.audits.length, 1);
  assert.match(h.queries[0].sql, /FOR UPDATE/); assert.deepEqual(h.queries[0].values, [id]);
});
test("Fila: claim usa bloqueio sem espera e lease; callback antigo não ativa", async () => {
  const h = fixture(); await h.service.prepare(owner, id, { confirmed: true }); const job = await h.service.claim();
  assert.equal(job.condominiumId, id); assert.match(h.queries.at(-1).sql, /FOR UPDATE OF p SKIP LOCKED/);
  await assert.rejects(h.service.complete({ ...job, leaseId: lease, state: "READY" }), e => e.statusCode === 409);
  await h.service.complete({ ...job, state: "READY" }); const write = h.writes.at(-1);
  assert.equal(write.where.condominiumId, id); assert.equal(write.where.enabled, true); assert.deepEqual(write.where.condominium.status.in, ["ACTIVE", "TRIAL"]); assert.equal(write.data.state, "READY");
});
test("Fila: espera de capacidade não consome tentativas; erros não aceitam texto secreto", async () => {
  const h = fixture(); h.set({ enabled: true, operationId: op, leaseId: lease });
  await h.service.complete({ condominiumId: id, operationId: op, leaseId: lease, state: "WAITING_CAPACITY" });
  assert.deepEqual(h.writes.at(-1).data.attemptCount, { decrement: 1 });
  await h.service.complete({ condominiumId: id, operationId: op, leaseId: lease, state: "FAILED", errorCode: "secret-api-key" });
  assert.equal(h.writes.at(-1).data.errorCode, "PREPARATION_FAILED"); assert.ok(!JSON.stringify(h.audits).includes("secret-api-key"));
});
test("Conexão: registro privado sozinho não autoriza condomínio não preparado", async () => {
  let called = false;
  const service = new WahaConnectionService({ wahaProvisioning: { findUnique: async () => null } }, async () => { called = true; });
  await assert.rejects(service.instance(id), e => e.statusCode === 503); assert.equal(called, false);
});
async function control({ authorization, origin, url = "/claim", body = "{}" }) {
  const req = Readable.from([body]); req.headers = { authorization, ...(origin ? { origin } : {}) }; req.method = "POST"; req.url = url;
  const result = { headers: {}, status: 0, body: "" };
  const res = { setHeader: (key, value) => { result.headers[key] = value; }, writeHead: value => { result.status = value; }, end: value => { result.body = value || ""; } };
  let claims = 0;
  await createControlHandler("a".repeat(64), { claim: async () => { claims++; return null; } })(req, res);
  return { ...result, claims };
}
test("Controle privado: exige chave, recusa navegador e não oferece provisionamento arbitrário", async () => {
  for (const authorization of [undefined, "Bearer wrong", "Bearer " + "á".repeat(64)]) { const r = await control({ authorization }); assert.equal(r.status, 401); assert.equal(r.claims, 0); }
  assert.equal((await control({ authorization: "Bearer " + "a".repeat(64), origin: "https://localhost:5443" })).status, 401);
  assert.equal((await control({ authorization: "Bearer " + "a".repeat(64), url: "/containers/create" })).status, 404);
  const ok = await control({ authorization: "Bearer " + "a".repeat(64) }); assert.equal(ok.status, 200); assert.equal(ok.claims, 1); assert.equal(ok.headers["Cache-Control"], "no-store");
});
function dockerFixture({ conflict = false, full = false } = {}) {
  const calls = [], resources = new Map();
  if (conflict) resources.set(`/containers/infinitycondo-waha-${id}/json`, { Config: { Image: "other" } });
  const docker = async (method, target, body) => {
    calls.push({ method, target, body });
    if (method === "GET" && target.startsWith("/containers/json?")) return { status: 200, data: full ? [{}, {}] : [] };
    if (method === "GET" && ["/containers/infinitycondo-backend/json", "/containers/infinitycondo-waha-provisioner/json"].includes(target)) return { status: 200, data: { Id: target.split("/")[2], NetworkSettings: { Networks: {} } } };
    if (method === "GET") return resources.has(target) ? { status: 200, data: resources.get(target) } : { status: 404 };
    if (target.startsWith("/containers/create")) resources.set(`/containers/infinitycondo-waha-${id}/json`, { Config: body, HostConfig: body.HostConfig });
    if (target === "/networks/create") resources.set(`/networks/${body.Name}`, body);
    if (target === "/volumes/create") resources.set(`/volumes/${body.Name}`, body);
    return { status: 201, data: {} };
  };
  return { docker, calls };
}
test("Preparador: recurso divergente e capacidade esgotada não criam instância", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "waha-agent-"));
  try {
    for (const options of [{ conflict: true }, { full: true }]) {
      const h = dockerFixture(options); const runner = new Provisioner({ docker: h.docker, directory });
      await assert.rejects(runner.prepare({ condominiumId: id, operationId: op, leaseId: lease }), e => ["INSTANCE_CONFLICT", "CAPACITY"].includes(e.code));
      assert.equal(h.calls.filter(c => c.method === "POST").length, 0);
    }
  } finally { await fs.rm(directory, { recursive: true }); }
});
test("Preparador: isolamento por cliente, imagem fixa, sem porta pública, sem pareamento automático", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "waha-agent-"));
  try {
    const h = dockerFixture(), fetched = [];
    const runner = new Provisioner({ docker: h.docker, directory, transport: async (url, options) => { fetched.push({ url, options }); return { ok: true, json: async () => [] }; } });
    const job = { condominiumId: id, operationId: op, leaseId: lease };
    await runner.prepare(job); await runner.prepare(job);
    const creates = h.calls.filter(c => c.target.startsWith("/containers/create")); assert.equal(creates.length, 1);
    const config = creates[0].body; assert.equal(config.Image, IMAGE); assert.equal(config.HostConfig.PortBindings, undefined); assert.equal(config.HostConfig.Memory, 1073741824);
    assert.equal(config.HostConfig.Mounts[0].Target, "/app/.sessions"); assert.ok(config.HostConfig.NetworkMode.endsWith(id));
    assert.ok(!JSON.stringify(config).includes("docker.sock")); assert.ok(config.Env.includes("WAHA_PRINT_QR=false"));
    assert.equal(fetched.length, 2); assert.ok(fetched.every(x => x.url.endsWith("/api/sessions") && !x.options.method));
    const registry = JSON.parse(await fs.readFile(`${directory}/registry.json`, "utf8")); assert.equal(Object.keys(registry).length, 1); assert.equal(registry[id].apiKey.length, 64);
    assert.equal(h.calls.filter(c => c.target.endsWith("/disconnect")).length, 2);
  } finally { await fs.rm(directory, { recursive: true }); }
});
