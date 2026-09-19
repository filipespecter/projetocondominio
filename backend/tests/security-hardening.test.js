import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const projectRoot = process.env.PROJECT_ROOT ? path.resolve(process.env.PROJECT_ROOT) : path.resolve(backendRoot, "..");
const backendSource = (relativePath) => readFile(path.resolve(backendRoot, relativePath), "utf8");
const projectSource = (relativePath) => readFile(path.resolve(projectRoot, relativePath), "utf8");

test("sessões de autenticação persistem somente o hash do refresh token", async () => {
  const schema = await backendSource("prisma/schema.prisma");
  const service = await backendSource("src/services/AuthSessionService.js");
  assert.match(schema, /model\s+AuthSession\s*\{/);
  assert.match(schema, /refreshTokenHash\s+String\s+@unique/);
  assert.match(schema, /securityVersion\s+Int\s+@default\(1\)/);
  assert.match(service, /createHash\("sha256"\)/);
  assert.match(service, /REFRESH_REUSE_DETECTED/);
});

test("refresh token fica em cookie HttpOnly e não volta no corpo", async () => {
  const controller = await backendSource("src/controllers/AuthController.js");
  const client = await projectSource("src/Services/api.js");
  assert.match(controller, /httpOnly:true/);
  assert.match(controller, /sameSite:"strict"/);
  assert.match(controller, /delete result\.refreshToken/);
  assert.match(client, /credentials:\s*["']include["']/);
  assert.doesNotMatch(client, /localStorage\.setItem\([^\n]*refresh/i);
});

test("token de acesso é confrontado com usuário e sessão atuais", async () => {
  const middleware = await backendSource("src/middlewares/authMiddleware.js");
  assert.match(middleware, /prisma\.user\.findFirst/);
  assert.match(middleware, /prisma\.authSession\.findUnique/);
  assert.match(middleware, /user\.securityVersion!==payload\.sv/);
  assert.match(middleware, /session\.revokedAt/);
});

test("rotas sensíveis possuem limites e controle de origem", async () => {
  const routes = await backendSource("src/routes/auth.routes.js");
  const middleware = await backendSource("src/middlewares/securityMiddleware.js");
  assert.match(routes, /loginLimiter/);
  assert.match(routes, /resetLimiter/);
  assert.match(routes, /requireTrustedOrigin/);
  assert.match(middleware, /express-rate-limit/);
});

test("uploads validam assinatura real e restringem caminhos", async () => {
  const files = await backendSource("src/utils/fileStorage.js");
  const images = await backendSource("src/utils/imageUpload.js");
  assert.match(files, /matchesContent/);
  assert.match(files, /scanForMalware/);
  assert.match(images, /safeResolve/);
  assert.match(images, /signatures/);
  assert.match(images, /detectMime/);
});

test("exportações Excel não dependem do pacote xlsx vulnerável", async () => {
  const packageJson = JSON.parse(await projectSource("package.json"));
  const helper = await projectSource("src/utils/excelExport.js");
  assert.equal(packageJson.dependencies.xlsx, undefined);
  assert.equal(packageJson.dependencies.exceljs, "^4.4.0");
  assert.match(helper, /ExcelJS/);
});

test("produção possui imagens multi-stage e proxy dedicado", async () => {
  const frontendDocker = await projectSource("Dockerfile.production");
  const backendDocker = await projectSource("backend/Dockerfile.production");
  const compose = await projectSource("compose.production.yaml");
  assert.match(frontendDocker, /FROM\s+node:[^\n]+\s+AS\s+build/i);
  assert.match(frontendDocker, /FROM\s+nginx:/i);
  assert.match(backendDocker, /USER\s+infinity/i);
  assert.match(compose, /read_only:\s*true/);
});
