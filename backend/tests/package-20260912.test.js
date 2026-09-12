import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createPrivateServiceRequestSchema, validatePrivateServiceRequestList } from "../src/validators/privateServiceRequestValidator.js";
import { createSupplierSchema, validateSupplierList } from "../src/validators/supplierValidator.js";
import { createContractSchema, validateContractList } from "../src/validators/contractValidator.js";
import { validateAssetList } from "../src/validators/assetValidator.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const projectRoot = process.env.PROJECT_ROOT ? path.resolve(process.env.PROJECT_ROOT) : path.resolve(backendRoot, "..");
const backendSource = (relativePath) => readFile(path.resolve(backendRoot, relativePath), "utf8");
const projectSource = (relativePath) => readFile(path.resolve(projectRoot, relativePath), "utf8");
const UUID_A = "123e4567-e89b-42d3-a456-426614174000";

test("fornecedor aceita empresa, pessoa física e freelancer", () => {
  for (const entityType of ["COMPANY", "INDIVIDUAL", "FREELANCER"]) {
    const result = createSupplierSchema.safeParse({ legalName: "Profissional Teste", entityType });
    assert.equal(result.success, true, entityType);
  }
});

test("serviço avulso não exige vencimento nem renovação", () => {
  const result = createContractSchema.safeParse({
    supplierId: UUID_A,
    contractKind: "ONE_OFF_SERVICE",
    serviceType: "Eletricista",
    description: "Troca do disjuntor do quadro principal",
    startDate: "2026-09-20",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.contractKind, "ONE_OFF_SERVICE");
});

test("contrato recorrente continua exigindo vencimento", () => {
  const result = createContractSchema.safeParse({
    supplierId: UUID_A,
    contractKind: "CONTRACT",
    serviceType: "Elevadores",
    description: "Manutenção preventiva mensal",
    startDate: "2026-09-20",
  });
  assert.equal(result.success, false);
});

test("morador informa prestador particular com janela válida", () => {
  const result = createPrivateServiceRequestSchema.safeParse({
    providerName: "João da Silva",
    providerPhone: "81999999999",
    serviceType: "Elétrica",
    description: "Manutenção da tomada do quarto",
    scheduledDate: "2026-09-20",
    scheduledStartTime: "09:00",
    scheduledEndTime: "11:00",
  });
  assert.equal(result.success, true);
});

test("solicitação particular impede horário final anterior", () => {
  const result = createPrivateServiceRequestSchema.safeParse({
    providerName: "João da Silva",
    serviceType: "Elétrica",
    description: "Manutenção da tomada do quarto",
    scheduledDate: "2026-09-20",
    scheduledStartTime: "11:00",
    scheduledEndTime: "09:00",
  });
  assert.equal(result.success, false);
});

test("schema integra solicitação privada e sessões persistentes", async () => {
  const schema = await backendSource("prisma/schema.prisma");
  assert.match(schema, /model\s+PrivateServiceRequest\s*\{/);
  assert.match(schema, /model\s+UserSession\s*\{/);
  assert.match(schema, /model\s+Supplier[\s\S]*entityType\s+String/);
  assert.match(schema, /model\s+Contract[\s\S]*contractKind\s+String/);
  assert.match(schema, /endDate\s+DateTime\?\s+@db\.Date/);
});

test("solicitação privada está protegida pelos guardas operacionais", async () => {
  const routes = await backendSource("src/routes/index.js");
  assert.match(routes, /\/v1\/private-service-requests[\s\S]{0,120}operationalGuards/);
  const featureRoutes = await backendSource("src/routes/private-service-request.routes.js");
  assert.match(featureRoutes, /authorizeRoles\("RESIDENT"\)/);
  assert.match(featureRoutes, /authorizeRoles\("CONDOMINIUM_ADMIN",\s*"MANAGER"\)/);
});

test("aprovação do serviço particular gera acesso vinculado ao apartamento", async () => {
  const service = await backendSource("src/services/PrivateServiceRequestService.js");
  assert.match(service, /ProviderAccessService\.create/);
  assert.match(service, /apartmentId:\s*request\.apartmentId/);
  assert.match(service, /providerAccessId:\s*access\.id/);
});

test("supervisão da portaria agrega sessão, auditoria e atos operacionais", async () => {
  const service = await backendSource("src/services/DoormanSupervisionService.js");
  for (const token of ["UserSessionService.listByUser", "auditLog.findMany", "occurrence.count", "package.count", "visitor.count", "providerAccess.count"]) {
    assert.match(service, new RegExp(token.replaceAll(".", "\\.")), token);
  }
});

test("frontend expõe fluxo do morador e supervisão sem alterar QR atual", async () => {
  const app = await projectSource("src/App.jsx");
  const resident = await projectSource("src/pages/morador/ServicosApartamentoMorador.jsx");
  const doorman = await projectSource("src/pages/sindico/Porteiros.jsx");
  const visitorApi = await projectSource("src/Services/visitorApi.js");
  assert.match(app, /servicos-apartamento/);
  assert.match(resident, /Enviar para aprovação/);
  assert.match(doorman, /Supervisão operacional/);
  assert.match(visitorApi, /invitation|convite|validateInvitation|consumeInvitation/i);
});

test("guarda operacional usa somente campos estáveis da assinatura", async () => {
  const middleware = await backendSource("src/middlewares/subscriptionAccessMiddleware.js");
  assert.match(middleware, /prisma\.condominium\.findFirst/);
  assert.match(middleware, /prisma\.subscription\.findFirst/);
  assert.match(middleware, /select:\s*\{\s*id:\s*true,\s*status:\s*true/);
  assert.doesNotMatch(middleware, /gracePeriodDays:\s*true|nextDueDate:\s*true|suspendedAt:\s*true/);
  assert.match(middleware, /DATABASE_SCHEMA_OUT_OF_SYNC/);
});

test("tema personalizado só substitui o roxo após opção explícita do condomínio", async () => {
  const theme = await projectSource("src/utils/condominiumTheme.js");
  const config = await projectSource("src/pages/sindico/Configuracoes.jsx");
  const configurationService = await backendSource("src/services/ConfigurationService.js");
  const managerLayout = await projectSource("src/layout/DashboardLayout.jsx");
  const residentLayout = await projectSource("src/layout/DashboardMoradorLayout.jsx");
  const doormanLayout = await projectSource("src/layout/DashboardPorteiroLayout.jsx");
  const modules = await projectSource("src/styles/infinityModules.css");

  assert.match(theme, /theme\?\.aplicarTemaPersonalizado === true/);
  assert.match(theme, /return DEFAULT_PRIMARY/);
  assert.match(config, /Personalizar cores do condomínio/);
  assert.match(config, /disabled=\{!temaPersonalizadoAtivo\}/);
  assert.match(config, /aplicarTemaPersonalizado,/);
  assert.doesNotMatch(config, /aplicarTemaPersonalizado:\s*true/);
  assert.match(configurationService, /typeof theme\.aplicarTemaPersonalizado === "boolean"/);
  assert.doesNotMatch(configurationService, /payload\.corTema \|\| theme\.corPrincipal\s*\?\s*true/);

  for (const source of [managerLayout, residentLayout, doormanLayout]) {
    assert.match(source, /buildCondominiumThemeVariables\(user\)/);
    assert.match(source, /themeVariables/);
  }

  assert.match(modules, /var\(--ic-primary\)/);
  assert.doesNotMatch(modules, /#7c3aed|#6d28d9|#5b21b6|#4c1d95/i);
});

test("validadores de query são compatíveis com Express 5 sem sobrescrever getter diretamente", async () => {
  const { validateDocumentList } = await import("../src/validators/documentValidator.js");
  const requestPrototype = {};
  Object.defineProperty(requestPrototype, "query", {
    get() {
      return { search: "  contrato  " };
    },
    configurable: true,
  });

  const req = Object.create(requestPrototype);
  let nextError = null;
  validateDocumentList(req, {}, (error) => {
    nextError = error ?? null;
  });

  assert.equal(nextError, null);
  assert.equal(Object.hasOwn(req, "query"), true);
  assert.deepEqual(req.query, { search: "contrato" });
});

test("nenhum validador operacional atribui diretamente em req.query", async () => {
  const validators = [
    "documentValidator.js",
    "auditLogValidator.js",
    "apartmentValidator.js",
    "visitorValidator.js",
    "serviceProviderValidator.js",
    "residentValidator.js",
    "providerAccessValidator.js",
    "noticeValidator.js",
    "packageValidator.js",
    "reservationValidator.js",
    "occurrenceValidator.js",
    "doormanValidator.js",
    "commonAreaValidator.js",
    "notificationValidator.js",
  ];

  for (const file of validators) {
    const source = await backendSource(`src/validators/${file}`);
    assert.doesNotMatch(source, /req\.query\s*=/, file);
    assert.match(source, /Object\.defineProperty\(req,\s*["']query["']/, file);
  }
});


test("validadores dos módulos novos também suportam req.query somente leitura no Express 5", () => {
  const validators = [
    ["fornecedores", validateSupplierList],
    ["ativos", validateAssetList],
    ["contratos", validateContractList],
    ["serviços particulares", validatePrivateServiceRequestList],
  ];

  for (const [label, validator] of validators) {
    const requestPrototype = {};
    Object.defineProperty(requestPrototype, "query", {
      get() {
        return {};
      },
      configurable: true,
    });
    const req = Object.create(requestPrototype);
    let nextError = null;
    validator(req, {}, (error) => {
      nextError = error ?? null;
    });
    assert.equal(nextError, null, label);
    assert.equal(Object.hasOwn(req, "query"), true, label);
    assert.deepEqual(req.query, {}, label);
  }
});

test("wrappers genéricos dos módulos novos tratam query por defineProperty", async () => {
  for (const file of [
    "supplierValidator.js",
    "assetValidator.js",
    "contractValidator.js",
    "privateServiceRequestValidator.js",
  ]) {
    const source = await backendSource(`src/validators/${file}`);
    assert.match(source, /key\s*===\s*["']query["'][\s\S]{0,260}Object\.defineProperty\(req,\s*["']query["']/, file);
  }
});
