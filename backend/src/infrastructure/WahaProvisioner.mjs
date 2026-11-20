import http from "node:http";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

export const IMAGE = "devlikeapro/waha:gows@sha256:1f7faeb0227ad5edb5711f7058bfce807ea65e5f92234af0778e4db140f6eb46";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const managed = "tech.infinitycondo.waha.managed";
const tenantLabel = "tech.infinitycondo.waha.condominium";
export class ProvisionError extends Error { constructor(code) { super(code); this.code = code; } }
export function dockerRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const request = http.request({ socketPath: "/var/run/docker.sock", path: `/v1.44${path}`, method,
      headers: body ? { "Content-Type": "application/json" } : {}, timeout: 30000 }, response => {
      let text = "";
      response.on("data", chunk => { text += chunk; if (text.length > 4000000) request.destroy(); });
      response.on("end", () => { let data; try { data = text ? JSON.parse(text) : null; } catch { return reject(new ProvisionError("PREPARATION_FAILED")); }
        resolve({ status: response.statusCode, data }); });
    });
    request.on("timeout", () => request.destroy()); request.on("error", () => reject(new ProvisionError("SERVICE_UNAVAILABLE")));
    request.end(body ? JSON.stringify(body) : undefined);
  });
}
const enc = encodeURIComponent;
export class Provisioner {
  constructor({ docker = dockerRequest, transport = fetch, directory = "/state", backend = "infinitycondo-backend", self = "infinitycondo-waha-provisioner", maxInstances = 2, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
    if (!Number.isInteger(maxInstances) || maxInstances < 1 || maxInstances > 100) throw new Error("Capacidade inválida.");
    Object.assign(this, { docker, transport, directory, backend, self, maxInstances, pause });
  }
  async call(method, path, body, accepted = [200, 201, 204, 304]) {
    const result = await this.docker(method, path, body);
    if (!accepted.includes(result.status)) throw new ProvisionError(result.status === 409 ? "INSTANCE_CONFLICT" : "PREPARATION_FAILED");
    return result;
  }
  async registry() {
    try {
      const registry = JSON.parse(await fs.readFile(`${this.directory}/registry.json`, "utf8"));
      if (!registry || typeof registry !== "object" || Array.isArray(registry)) throw new ProvisionError("INSTANCE_CONFLICT");
      for (const [id, entry] of Object.entries(registry)) {
        if (!uuid.test(id) || entry?.condominiumId !== id || entry.baseUrl !== `http://infinitycondo-waha-${id}:3000` || !/^[a-f0-9]{64}$/.test(entry.apiKey || "")) throw new ProvisionError("INSTANCE_CONFLICT");
      }
      return registry;
    }
    catch (error) { if (error.code === "ENOENT") return {}; throw new ProvisionError("INSTANCE_CONFLICT"); }
  }
  async saveRegistry(registry) {
    const path = `${this.directory}/registry.json`, temporary = `${path}.${crypto.randomUUID()}.tmp`;
    const handle = await fs.open(temporary, "wx", 0o600);
    try { await handle.writeFile(JSON.stringify(registry)); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temporary, path);
  }
  async attach(network, container) {
    const inspected = await this.call("GET", `/containers/${enc(container)}/json`);
    if (!inspected.data.NetworkSettings?.Networks?.[network]) await this.call("POST", `/networks/${enc(network)}/connect`, { Container: inspected.data.Id });
  }
  async reconcile() {
    // Reattach the new backend ID after a normal application rebuild, without recreating WAHA.
    const registry = await this.registry();
    for (const id of Object.keys(registry)) {
      if (!uuid.test(id)) throw new ProvisionError("INSTANCE_CONFLICT");
      await this.attach(`infinitycondo-waha-net-${id}`, this.backend);
    }
  }
  async prepare(job) {
    const id = job?.condominiumId;
    if (!uuid.test(id || "") || !uuid.test(job.operationId || "") || !uuid.test(job.leaseId || "")) throw new ProvisionError("INSTANCE_CONFLICT");
    const name = `infinitycondo-waha-${id}`, network = `infinitycondo-waha-net-${id}`, volume = `infinitycondo-waha-data-${id}`;
    const labels = { [managed]: "1", [tenantLabel]: id };
    const existing = await this.call("GET", `/containers/${enc(name)}/json`, undefined, [200, 404]);
    const registry = await this.registry();
    let entry = registry[id];
    if (entry && (entry.condominiumId !== id || entry.baseUrl !== `http://${name}:3000` || !/^[a-f0-9]{64}$/.test(entry.apiKey || ""))) throw new ProvisionError("INSTANCE_CONFLICT");
    if (existing.status === 200) {
      const current = existing.data;
      if (current.Config?.Labels?.[managed] !== "1" || current.Config?.Labels?.[tenantLabel] !== id || current.Config?.Image !== IMAGE || !entry || !current.Config?.Env?.includes(`WAHA_API_KEY=${entry.apiKey}`) || Object.keys(current.HostConfig?.PortBindings || {}).length || current.HostConfig?.NetworkMode !== network || current.HostConfig?.Privileged || !current.HostConfig?.Mounts?.some(m => m.Type === "volume" && m.Source === volume && m.Target === "/app/.sessions")) throw new ProvisionError("INSTANCE_CONFLICT");
    } else {
      const all = await this.call("GET", `/containers/json?all=true&filters=${enc(JSON.stringify({ label: [`${managed}=1`] }))}`);
      if (!Array.isArray(all.data) || all.data.length >= this.maxInstances) throw new ProvisionError("CAPACITY");
    }
    for (const [path, body, check] of [
      [`/networks/${enc(network)}`, { Name: network, Driver: "bridge", Labels: labels }, item => item.Labels?.[tenantLabel] === id && item.Labels?.[managed] === "1" && item.Driver === "bridge"],
      [`/volumes/${enc(volume)}`, { Name: volume, Labels: labels }, item => item.Labels?.[tenantLabel] === id && item.Labels?.[managed] === "1"],
    ]) {
      const resource = await this.call("GET", path, undefined, [200, 404]);
      if (resource.status === 404) await this.call("POST", path.startsWith("/networks/") ? "/networks/create" : "/volumes/create", body);
      else if (!check(resource.data)) throw new ProvisionError("INSTANCE_CONFLICT");
    }
    if (!entry) {
      entry = { condominiumId: id, baseUrl: `http://${name}:3000`, apiKey: crypto.randomBytes(32).toString("hex") };
      registry[id] = entry; await this.saveRegistry(registry);
    }
    if (existing.status === 404) await this.call("POST", `/containers/create?name=${enc(name)}`, {
      Image: IMAGE, Labels: labels,
      Env: [`WAHA_API_KEY=${entry.apiKey}`, `WAHA_API_KEY_PLAIN=${entry.apiKey}`, "WAHA_DASHBOARD_ENABLED=false", "WHATSAPP_SWAGGER_ENABLED=false", "WHATSAPP_DEFAULT_ENGINE=GOWS", "WAHA_LOG_LEVEL=error", "WAHA_PRINT_QR=false"],
      HostConfig: { NetworkMode: network, RestartPolicy: { Name: "unless-stopped" }, Memory: 1073741824, NanoCpus: 1000000000, PidsLimit: 512, ShmSize: 268435456,
        SecurityOpt: ["no-new-privileges:true"], Mounts: [{ Type: "volume", Source: volume, Target: "/app/.sessions" }], LogConfig: { Type: "json-file", Config: { "max-size": "5m", "max-file": "2" } } },
      NetworkingConfig: { EndpointsConfig: { [network]: { Aliases: [name] } } },
    });
    await this.call("POST", `/containers/${enc(name)}/start`);
    await this.attach(network, this.backend);
    await this.attach(network, this.self);
    try {
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          const response = await this.transport(`${entry.baseUrl}/api/sessions`, { headers: { "X-Api-Key": entry.apiKey }, redirect: "error", signal: AbortSignal.timeout(3000) });
          if (response.ok && Array.isArray(await response.json())) return;
        } catch { /* startup is bounded; no session or message is created here */ }
        await this.pause(3000);
      }
      throw new ProvisionError("SERVICE_UNAVAILABLE");
    } finally {
      await this.call("POST", `/networks/${enc(network)}/disconnect`, { Container: this.self, Force: false });
    }
  }
}
export async function run() {
  const key = (await fs.readFile("/control/control.key", "utf8")).trim();
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("Configuração interna inválida.");
  const runner = new Provisioner({ maxInstances: Number(process.env.WAHA_MAX_INSTANCES || 2) });
  const control = async (path, body = {}) => {
    const response = await fetch(`http://infinitycondo-backend:3229${path}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body), redirect: "error", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Controle indisponível.");
    return response.json();
  };
  const heartbeat = setInterval(() => { control("/heartbeat").catch(() => {}); }, 10000);
  heartbeat.unref();
  for (;;) {
    try {
      const job = await control("/claim");
      if (job) {
        let result = { state: "READY" };
        try { await runner.prepare(job); }
        catch (error) { result = { state: error.code === "CAPACITY" ? "WAITING_CAPACITY" : "FAILED", errorCode: ["INSTANCE_CONFLICT", "SERVICE_UNAVAILABLE", "CAPACITY"].includes(error.code) ? error.code : "PREPARATION_FAILED" }; }
        await control("/complete", { ...job, ...result });
      }
      await runner.reconcile();
    } catch { console.error("Preparador indisponível ou aguardando recuperação; nenhuma credencial registrada."); }
    await runner.pause(5000);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run().catch(() => { console.error("Preparador não iniciado. Confira a configuração privada."); process.exitCode = 1; });
