import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
import provisioning, { agentSeen } from "./WahaProvisioningService.js";

export function createControlHandler(secret, service = provisioning) {
  if (!/^[a-f0-9]{64}$/.test(secret || "")) throw new Error("Chave de controle inválida.");
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const received = req.headers.authorization || "";
    const expected = `Bearer ${secret}`;
    if (!/^Bearer [a-f0-9]{64}$/.test(received) || received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected)) || req.headers.origin) { res.writeHead(401); return res.end(); }
    if (req.method !== "POST" || !["/claim", "/complete", "/heartbeat"].includes(req.url)) { res.writeHead(404); return res.end(); }
    try {
      let body = "";
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 4096) { res.writeHead(413); res.end(); req.destroy(); return; } }
      const data = JSON.parse(body || "{}");
      agentSeen();
      const result = req.url === "/heartbeat" ? { online: true } : req.url === "/claim" ? await service.claim() : await service.complete(data);
      res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(result));
    } catch (error) { res.writeHead(error.statusCode || 503, { "Content-Type": "application/json" }); res.end(JSON.stringify({ message: "Operação interna não concluída." })); }
  };
}
export function startWahaControlServer() {
  if (process.env.WAHA_CONTROL_ENABLED !== "true") return null;
  const secret = fs.readFileSync(process.env.WAHA_CONTROL_KEY_FILE, "utf8").trim();
  // A separate, unpublished port. No route is mounted in the public application.
  const server = http.createServer(createControlHandler(secret));
  server.requestTimeout = 10000; server.headersTimeout = 5000;
  server.listen(3229, "0.0.0.0");
  return server;
}
