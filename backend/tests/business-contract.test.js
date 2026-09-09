import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { onboardingSchema } from "../src/validators/onboardingValidator.js";
import { validatePlatformApproval } from "../src/validators/platformCondominiumApprovalValidator.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");

// Em execução local, o backend fica em <projeto>/backend.
// No container Docker, o backend é construído em /app e o repositório
// completo é montado somente para leitura em /workspace.
const projectRoot = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.resolve(backendRoot, "..");

async function source(relativePath) {
  return readFile(path.resolve(projectRoot, relativePath), "utf8");
}

function validOnboarding() {
  return {
    condominium: {
      name: "Condomínio Teste",
      email: "condominio@example.com",
      phone: "81999999999",
      city: "Recife",
      state: "PE",
    },
    contact: {
      name: "Responsável Teste",
      email: "responsavel@example.com",
      phone: "81988888888",
    },
  };
}

function runMiddleware(middleware, body) {
  return new Promise((resolve) => {
    const req = { body };
    middleware(req, {}, (error) => resolve({ error, body: req.body }));
  });
}

test("onboarding aceita condomínio + contato", () => {
  const result = onboardingSchema.safeParse(validOnboarding());
  assert.equal(result.success, true);
});

test("onboarding público rejeita credenciais", () => {
  const payload = validOnboarding();
  payload.administrator = {
    name: "Admin",
    username: "admin",
    password: "Senha123!",
  };
  const result = onboardingSchema.safeParse(payload);
  assert.equal(result.success, false);
});

test("aprovação exige credenciais e vencimento válidos", async () => {
  const payload = {
    username: "sindico.teste",
    password: "SenhaTeste123!",
    passwordConfirmation: "SenhaTeste123!",
    planId: "123e4567-e89b-12d3-a456-426614174000",
    gracePeriodDays: 5,
    initialStatus: "ACTIVE",
    billingCycle: "MONTHLY",
    adminName: "Síndico Teste",
    adminEmail: "sindico@example.com",
    adminPhone: "81999999999",
    billingContactName: "Síndico Teste",
    billingEmail: "financeiro@example.com",
    billingPhone: "81999999999",
  };
  const result = await runMiddleware(validatePlatformApproval, payload);
  assert.equal(result.error, undefined);
});

test("aprovação rejeita senha divergente", async () => {
  const result = await runMiddleware(validatePlatformApproval, {
    username: "sindico.teste",
    password: "SenhaTeste123!",
    passwordConfirmation: "OutraSenha123!",
    planId: "123e4567-e89b-12d3-a456-426614174000",
    gracePeriodDays: 5,
  });
  assert.ok(result.error);
});

test("onboarding backend mantém solicitação PENDING e não cria User", async () => {
  const text = await source("backend/src/services/OnboardingService.js");
  assert.match(text, /status:\s*"PENDING"/);
  assert.doesNotMatch(text, /transaction\.user\.create\s*\(/);
});

test("aprovação cria CONDOMINIUM_ADMIN ativo e força troca da senha", async () => {
  const text = await source("backend/src/repositories/PlatformApprovalRepository.js");
  assert.match(text, /role:\s*"CONDOMINIUM_ADMIN"/);
  assert.match(text, /status:\s*"ACTIVE"/);
  assert.match(text, /mustChangePassword:\s*true/);
});

test("controladores operacionais derivam condominiumId da sessão", async () => {
  const files = [
    "backend/src/controllers/ReservationController.js",
    "backend/src/controllers/PackageController.js",
    "backend/src/controllers/VisitorController.js",
    "backend/src/controllers/OccurrenceController.js",
    "backend/src/controllers/NoticeController.js",
  ];
  for (const file of files) {
    const text = await source(file);
    assert.match(text, /req\.user\.condominiumId/, file);
  }
});

test("rotas críticas exigem autenticação", async () => {
  const files = [
    "backend/src/routes/reservation.routes.js",
    "backend/src/routes/package.routes.js",
    "backend/src/routes/visitor.routes.js",
    "backend/src/routes/occurrence.routes.js",
    "backend/src/routes/notice.routes.js",
  ];
  for (const file of files) {
    const text = await source(file);
    assert.match(text, /\.use\(\s*authMiddleware\s*\)/s, file);
  }
});

test("encomenda usa hash para credencial de retirada", async () => {
  const schema = await source("backend/prisma/schema.prisma");
  assert.match(schema, /pickupTokenHash\s+String\?/);
  assert.match(schema, /pickupCodeHash\s+String\?/);
  assert.match(schema, /pickupUsedAt\s+DateTime\?/);
});

test("reserva contém validação de conflito e limite diário", async () => {
  const text = await source("backend/src/services/ReservationService.js");
  assert.match(text, /validateConflict\s*\(/);
  assert.match(text, /validateDailyLimit\s*\(/);
  assert.match(text, /"PENDING"/);
  assert.match(text, /"APPROVED"/);
});

test("frontend de aprovação envia credenciais, plano e ciclo individual", async () => {
  const text = await source("src/pages/platform/PlatformCondominiums.jsx");
  for (const field of ["username", "password", "passwordConfirmation", "planId", "gracePeriodDays", "billingEmail", "billingPhone"]) {
    assert.match(text, new RegExp(field), field);
  }
  assert.doesNotMatch(text, /Dia do vencimento \*/);
});

test("cadastro público usa contact e não envia administrator", async () => {
  const text = await source("src/pages/CadastroCondominio.jsx");
  assert.match(text, /registerCondominium\(\{\s*condominium,\s*contact,/s);
  assert.doesNotMatch(text, /registerCondominium\(\{\s*condominium,\s*administrator,/s);
});

test("controladores expõem métodos usados pelas rotas de notificações e reservas", async () => {
  const notifications = await source("backend/src/controllers/NotificationController.js");
  for (const method of ["unreadCount", "myUnread", "myNotifications", "markAllAsRead", "removeRead", "index", "create", "show", "markAsRead", "remove"]) {
    assert.match(notifications, new RegExp(`async\\s+${method}\\s*\\(`), method);
  }

  const reservations = await source("backend/src/controllers/ReservationController.js");
  assert.match(reservations, /async\s+myReservations\s*\(/);
});

test("services cobrem filtros chamados pelos controllers", async () => {
  const audit = await source("backend/src/services/AuditLogService.js");
  assert.match(audit, /async\s+findByUserAndPeriod\s*\(/);
  assert.match(audit, /async\s+countByAction\s*\(/);

  const notice = await source("backend/src/services/NoticeService.js");
  assert.match(notice, /async\s+findByCategory\s*\(/);
  assert.match(notice, /async\s+findByApartment\s*\(/);
});

test("frontend possui entrega manual de encomenda e troca obrigatória de senha", async () => {
  const packages = await source("src/Services/packageApi.js");
  assert.match(packages, /async\s+deliver\s*\(/);
  assert.match(packages, /\/v1\/packages\/\$\{id\}\/deliver/);

  const login = await source("src/pages/login.jsx");
  assert.match(login, /mustChangePassword\s*===\s*true/);
  assert.match(login, /authApi\.changePassword\s*\(/);
});

test("Docker de primeira inicialização aplica migrations antes do seed", async () => {
  const text = await source("docker/PRIMEIRA_INICIALIZACAO.ps1");
  assert.match(text, /npm run prisma:deploy/);
  assert.ok(text.indexOf("npm run prisma:deploy") < text.indexOf("node prisma/seed.js"));
});


test("ProtectedRoute usa tipoPermitido e nunca monta login com prop tipo antiga", async () => {
  const route = await source("src/components/ProtectedRoute.jsx");
  const app = await source("src/App.jsx");

  assert.match(route, /function\s+ProtectedRoute\(\{[\s\S]*tipoPermitido/);
  assert.match(route, /tipoFrontendAceitaRole\(\s*tipoPermitido,/s);
  assert.match(route, /to=\{`\/login\/\$\{tipoPermitido\}`\}/);
  assert.doesNotMatch(route, /to=\{`\/login\/\$\{tipo\}`\}/);
  assert.match(app, /<ProtectedRoute\s+tipoPermitido="sindico">/);
  assert.match(app, /<ProtectedRoute\s+tipoPermitido="porteiro">/);
  assert.match(app, /<ProtectedRoute\s+tipoPermitido="morador">/);
});

test("Docker frontend inclui configuração do ESLint para validação no container", async () => {
  const dockerfile = await source("Dockerfile");
  assert.match(dockerfile, /COPY\s+eslint\.config\.js\s+\.\//);
});

test("financeiro básico é multi-tenant e possui categorias, despesas e exportação", async () => {
  const schema = await source("backend/prisma/schema.prisma");
  const routes = await source("backend/src/routes/expense.routes.js");
  const service = await source("backend/src/services/ExpenseService.js");
  const page = await source("src/pages/sindico/Financeiro.jsx");
  assert.match(schema, /model\s+ExpenseCategory\s*\{/);
  assert.match(schema, /model\s+Expense\s*\{/);
  assert.match(service, /condominiumId/);
  assert.match(routes, /CONDOMINIUM_ADMIN/);
  assert.match(routes, /MANAGER/);
  assert.match(page, /exportPdf/);
  assert.match(page, /exportXlsx/);
  assert.match(page, /Resumo por categoria/);
});

test("retirada de encomenda aceita comprovante fotográfico opcional e o armazena fora do banco", async () => {
  const schema = await source("backend/prisma/schema.prisma");
  const service = await source("backend/src/services/PackageService.js");
  const modal = await source("src/components/Porteiro/PackagePickupModal.jsx");
  assert.match(schema, /deliveryProofFilePath\s+String\?/);
  assert.match(service, /saveImageDataUrl/);
  assert.match(service, /"package-proofs"/);
  assert.match(modal, /Comprovante de entrega \(opcional\)/);
  assert.match(modal, /deliveryProofImageDataUrl/);
});

test("recuperação de senha usa código por e-mail com expiração, uso único e limite de tentativas", async () => {
  const schema = await source("backend/prisma/schema.prisma");
  const service = await source("backend/src/services/AuthService.js");
  const routes = await source("backend/src/routes/auth.routes.js");
  const login = await source("src/pages/login.jsx");
  assert.match(schema, /model\s+PasswordResetCode\s*\{/);
  assert.match(service, /10\s*\*\s*60\s*\*\s*1000/);
  assert.match(service, /attempts\s*>=\s*5/);
  assert.match(service, /usedAt/);
  assert.match(routes, /password-reset\/request/);
  assert.match(routes, /password-reset\/confirm/);
  assert.match(login, /Código de 6 dígitos/);
  assert.match(login, /Criar nova senha/);
});

test("planos Básico e Completo possuem matriz de features e proteção premium no backend", async () => {
  const seed = await source("backend/prisma/seed.js");
  const middleware = await source("backend/src/middlewares/featureAccessMiddleware.js");
  const expenses = await source("backend/src/routes/expense.routes.js");
  const index = await source("backend/src/routes/index.js");
  assert.match(seed, /code:"BASICO"/);
  assert.match(seed, /code:"COMPLETO"/);
  for (const feature of ["EXPENSES","PACKAGE_PROOF","BI_DASHBOARD","WHATSAPP"]) assert.match(seed, new RegExp(feature));
  assert.doesNotMatch(seed, /AI_ASSISTANT|IA Star|Assistente inteligente futuro/);
  assert.match(middleware, /FEATURE_NOT_AVAILABLE/);
  assert.match(expenses, /requireFeature\("EXPENSES"\)/);
  assert.match(index, /requireFeature\("BI_DASHBOARD"\)/);
});

test("auditoria da Central possui histórico, exclusão lógica exclusiva do owner e backup integrado", async () => {
  const schema = await source("backend/prisma/schema.prisma");
  const routes = await source("backend/src/routes/platform-audit.routes.js");
  const service = await source("backend/src/services/PlatformAuditService.js");
  const page = await source("src/pages/platform/PlatformAudit.jsx");
  assert.match(schema, /deletedAt\s+DateTime\?/);
  assert.match(service, /PLATFORM_OWNER/);
  assert.match(service, /softDelete/);
  assert.match(routes, /platformAuditRoutes\.delete/);
  assert.match(routes, /\/clear-view/);
  assert.match(service, /archiveVisible/);
  assert.match(page, /Detalhes/);
  assert.match(page, /Ocultar/);
  assert.match(page, /Limpar visualização/);
  assert.doesNotMatch(page, />Resolver</);
  assert.match(page, /Gerar backup agora/);
  assert.match(page, /operations\.backups/);
});

test("e-mail de recuperação possui provider real configurável sem depender de senha visível", async () => {
  const provider = await source("backend/src/services/providers/EmailProvider.js");
  const env = await source("backend/.env.docker.example");
  assert.match(provider, /RESEND/);
  assert.match(provider, /EMAIL_API_KEY/);
  assert.match(provider, /EMAIL_FROM/);
  assert.match(env, /EMAIL_PROVIDER=CONSOLE/);
  assert.doesNotMatch(provider, /passwordHash/);
});


test("login do condomínio não exige código e usa usuário ou e-mail conforme o portal", async () => {
  const login = await source("src/pages/login.jsx");
  const api = await source("src/Services/authApi.js");
  const service = await source("backend/src/services/AuthService.js");
  assert.doesNotMatch(login, /Código do condomínio/);
  assert.doesNotMatch(login, /condominioCodigo/);
  assert.match(api, /portalType/);
  assert.match(service, /findLoginCandidates/);
  assert.match(service, /rolesForPortal/);
});

test("recuperação de senha usa somente e-mail e código temporário, sem código do condomínio", async () => {
  const validator = await source("backend/src/validators/authValidator.js");
  const login = await source("src/pages/login.jsx");
  assert.match(validator, /portalTypeSchema/);
  assert.doesNotMatch(validator, /condominiumCodeSchema/);
  assert.doesNotMatch(login, /Código do condomínio usado/);
  assert.match(login, /Código de 6 dígitos/);
});

test("Central possui carteira de clientes com ciclo contado desde a ativação", async () => {
  const page = await source("src/pages/platform/PlatformClients.jsx");
  const service = await source("backend/src/services/PlatformCondominiumService.js");
  const approval = await source("backend/src/services/PlatformCondominiumApprovalService.js");
  const app = await source("src/App.jsx");
  assert.match(page, /Receita mensal estimada/);
  assert.match(page, /Tempo de plano/);
  assert.match(page, /Próxima cobrança/);
  assert.match(service, /async\s+listClients\s*\(/);
  assert.match(approval, /const currentPeriodStart = approvedAt/);
  assert.match(approval, /const nextDueDate = this\.addBillingCycle\(approvedAt, billingCycle\)/);
  assert.match(app, /path="clientes"/);
});

test("Central garante catálogo Básico/Completo também em tempo de execução", async () => {
  const service = await source("backend/src/services/PlanService.js");
  assert.match(service, /ensureDefaultCatalog/);
  assert.match(service, /code:\s*"BASICO"/);
  assert.match(service, /code:\s*"COMPLETO"/);
  assert.match(service, /await this\.ensureDefaultCatalog\(\)/);
});

test("dashboard não soma solicitações rejeitadas ou canceladas no total principal", async () => {
  const dashboard = await source("backend/src/services/PlatformDashboardService.js");
  assert.match(dashboard, /in:\s*\["PENDING",\s*"TRIAL",\s*"ACTIVE",\s*"SUSPENDED"\]/);
});

test("planos permitem trocar o plano de cliente já aprovado pela Central", async () => {
  const page = await source("src/pages/platform/PlatformPlans.jsx");
  const api = await source("src/Services/platformApi.js");
  const routes = await source("backend/src/routes/platform-condominium.routes.js");
  const service = await source("backend/src/services/PlatformCondominiumService.js");
  assert.match(page, /Vincular \/ trocar cliente/);
  assert.match(api, /changePlan/);
  assert.match(routes, /\/:id\/plan/);
  assert.match(service, /changeClientPlan/);
});

test("suporte possui SA persistente com classificação, prioridade e acompanhamento do cliente", async () => {
  const schema = await source("backend/prisma/schema.prisma");
  const service = await source("backend/src/services/SupportTicketService.js");
  const platform = await source("src/pages/platform/PlatformSupport.jsx");
  const syndic = await source("src/pages/sindico/Suporte.jsx");
  assert.match(schema, /model\s+SupportTicket\s*\{/);
  assert.match(schema, /SupportTicketPriority/);
  assert.match(service, /CRITICAL/);
  assert.match(service, /WAITING_CUSTOMER/);
  assert.match(platform, /Solicitações de Atendimento/);
  assert.match(platform, /Assumir/);
  assert.match(platform, /Solução aplicada/);
  assert.match(service, /Descreva a solução aplicada/);
  assert.match(syndic, /Nova solicitação/);
  assert.match(syndic, /SA-/);
});

test("reparo do piloto garante storage de suporte, auditoria e resolução estruturada de eventos", async () => {
  const migration = await source("backend/prisma/migrations/20260905130000_repair_support_audit_events/migration.sql");
  const schema = await source("backend/prisma/schema.prisma");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "SupportTicket"/);
  assert.match(migration, /ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "deletedAt"/);
  assert.match(migration, /ALTER TABLE "SystemEvent" ADD COLUMN IF NOT EXISTS "resolutionAction"/);
  assert.match(migration, /DELETE FROM "PlanFeature"/);
  assert.match(migration, /AI_ASSISTANT/);
  assert.match(schema, /resolutionAction\s+String\?/);
  assert.match(schema, /resolutionComment\s+String\?/);
});

test("eventos do sistema registram falhas técnicas 5xx sem poluir a fila com validações 4xx", async () => {
  const handler = await source("backend/src/middlewares/errorHandler.js");
  assert.match(handler, /if \(statusCode >= 500\)/);
  assert.match(handler, /await registerSystemEvent/);
  assert.doesNotMatch(handler, /await registerSystemEvent\(error, req, statusCode\);\n\s*return res/);
});

test("eventos técnicos exigem ação tomada e registram responsável, data e observação opcional", async () => {
  const service = await source("backend/src/services/SystemEventService.js");
  const repository = await source("backend/src/repositories/SystemEventRepository.js");
  const page = await source("src/pages/platform/PlatformSystemEvents.jsx");
  assert.match(service, /Descreva a ação tomada/);
  assert.match(repository, /resolvedByUserId/);
  assert.match(repository, /resolvedAt: new Date\(\)/);
  assert.match(repository, /resolutionAction/);
  assert.match(repository, /resolutionComment/);
  assert.match(page, /Ação tomada \*/);
  assert.match(page, /Observação/);
  assert.match(page, /Em aberto/);
  assert.match(page, /Resolvidos/);
});

test("catálogo comercial do piloto não anuncia IA ou recurso futuro não entregue", async () => {
  const seed = await source("backend/prisma/seed.js");
  const plans = await source("backend/src/services/PlanService.js");
  const page = await source("src/pages/platform/PlatformPlans.jsx");
  for (const content of [seed, plans, page]) {
    assert.doesNotMatch(content, /IA Star|Assistente inteligente futuro/);
  }
});

test("financeiro da Star possui painel executivo, gráficos e exportações PDF e Excel", async () => {
  const page = await source("src/pages/platform/PlatformFinance.jsx");
  const api = await source("src/Services/platformApi.js");
  const routes = await source("backend/src/routes/platform-charge.routes.js");
  assert.match(page, /exportExecutivePdf/);
  assert.match(page, /exportExecutiveExcel/);
  assert.match(page, /Evolução financeira/);
  assert.match(page, /ResponsiveContainer/);
  assert.match(api, /allCharges/);
  assert.match(routes, /PlatformChargeController\.index/);
});

test("dashboard da Central é executivo e combina carteira, financeiro, suporte e operação", async () => {
  const page = await source("src/pages/platform/PlatformDashboard.jsx");
  assert.match(page, /Dashboard executivo/);
  assert.match(page, /Status dos condomínios/);
  assert.match(page, /Receita e exposição/);
  assert.match(page, /SAs abertas/);
  assert.match(page, /SAÚDE DA PLATAFORMA/i);
});

test("homologação pode ser zerada somente pelo owner, fora de produção e após backup", async () => {
  const service = await source("backend/src/services/HomologationService.js");
  const routes = await source("backend/src/routes/platform-operations.routes.js");
  const page = await source("src/pages/platform/PlatformOperations.jsx");
  assert.match(service, /NODE_ENV === "production"/);
  assert.match(service, /PLATFORM_OWNER/);
  assert.match(service, /ZERAR HOMOLOGACAO/);
  assert.match(service, /BackupService\.createBackup/);
  assert.match(routes, /platformOwnerMiddleware/);
  assert.match(page, /Banco \/ Ambiente de Teste/);
  assert.match(page, /Zerar homologação/);
});

test("exportação de relatórios registra auditoria própria sem usar registro operacional", async () => {
  const api = await source("src/Services/reportApi.js");
  const routes = await source("backend/src/routes/audit.routes.js");
  const controller = await source("backend/src/controllers/AuditLogController.js");
  assert.match(api, /\/v1\/audit\/report-export/);
  assert.doesNotMatch(api, /operational-records.*REPORT_EXPORT/);
  assert.match(routes, /report-export/);
  assert.match(controller, /REPORT_EXPORT/);
});

test("encomendas atrasadas são calculadas por tempo real de recebimento", async () => {
  const page = await source("src/pages/sindico/Encomendas.jsx");
  assert.match(page, /LIMITE_ATRASO_DIAS = 3/);
  assert.match(page, /receivedAtRaw/);
  assert.doesNotMatch(page, /const atrasadas = \[\]/);
});

test("piloto remove diálogos nativos de confirmação e adiciona busca global e onboarding guiado", async () => {
  const dialogs = await source("src/components/GlobalDialogs.jsx");
  const search = await source("src/components/GlobalSearch.jsx");
  const layout = await source("src/layout/DashboardLayout.jsx");
  const dashboard = await source("src/pages/sindico/DashboardSindico.jsx");
  assert.match(dialogs, /confirmDialog/);
  assert.match(dialogs, /window\.alert =/);
  assert.match(search, /Buscar morador, apartamento, visitante, encomenda ou ocorrência/);
  assert.match(layout, /<GlobalSearch/);
  assert.match(dashboard, /Configure seu condomínio/);
});

test("BI utiliza históricos derivados dos registros reais em vez de coleções fixas vazias", async () => {
  const bi = await source("src/Services/biService.js");
  assert.match(bi, /visitantes_historico = visitantesTodos\.filter/);
  assert.match(bi, /encomendas_historico = encomendasTodas\.filter/);
  assert.match(bi, /historico_ocorrencias = ocorrenciasTodas\.filter/);
  assert.doesNotMatch(bi, /cacheDados\.visitantes_historico = \[\]/);
});
