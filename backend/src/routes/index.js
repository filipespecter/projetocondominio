import { Router } from "express";

import authRoutes from "./auth.routes.js";
import onboardingRoutes from "./onboarding.routes.js";
import apartmentRoutes from "./apartment.routes.js";
import residentRoutes from "./resident.routes.js";
import doormanRoutes from "./doorman.routes.js";
import visitorRoutes from "./visitor.routes.js";
import packageRoutes from "./package.routes.js";
import reservationRoutes from "./reservation.routes.js";
import commonAreaRoutes from "./common-area.routes.js";
import serviceProviderRoutes from "./service-provider.routes.js";
import providerAccessRoutes from "./provider-access.routes.js";
import operationalRecordRoutes from "./operational-record.routes.js";
import occurrenceRoutes from "./occurrence.routes.js";
import noticeRoutes from "./notice.routes.js";
import notificationRoutes from "./notification.routes.js";
import auditRoutes from "./audit.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import configurationRoutes from "./configuration.routes.js";
import expenseRoutes from "./expense.routes.js";
import supportTicketRoutes from "./support-ticket.routes.js";

import platformDashboardRoutes from "./platform-dashboard.routes.js";
import platformCondominiumRoutes from "./platform-condominium.routes.js";
import platformPlanRoutes from "./platform-plan.routes.js";
import platformUserRoutes from "./platform-user.routes.js";
import platformSystemEventRoutes from "./platform-system-event.routes.js";
import platformAuditRoutes from "./platform-audit.routes.js";
import platformPaymentMethodRoutes from "./platform-payment-method.routes.js";
import platformChargeRoutes from "./platform-charge.routes.js";
import platformPaymentTransactionRoutes from "./platform-payment-transaction.routes.js";
import paymentWebhookRoutes from "./payment-webhook.routes.js";
import platformSupportRoutes from "./platform-support.routes.js";
import platformOperationsRoutes from "./platform-operations.routes.js";
import platformDelinquencyRoutes from "./platform-delinquency.routes.js";
import platformCommunicationRoutes from "./platform-communication.routes.js";
import whatsappWebhookRoutes from "./whatsapp-webhook.routes.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import subscriptionAccessMiddleware from "../middlewares/subscriptionAccessMiddleware.js";
import { requireFeature } from "../middlewares/featureAccessMiddleware.js";

export const router = Router();

/**
 * =====================================================
 * ROTAS PÚBLICAS
 * =====================================================
 */

/**
 * Rota principal da API.
 */
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,

    message:
      "InfinityCondo API está funcionando.",

    data: {
      application:
        "InfinityCondo",

      company:
        "Star Infinity Code",

      version:
        "1.0.0",

      environment:
        process.env.NODE_ENV ||
        "development",

      timestamp:
        new Date().toISOString(),
    },
  });
});

/**
 * Health check da aplicação.
 */
router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,

    message:
      "Servidor saudável.",

    data: {
      status:
        "online",

      uptimeSeconds:
        Math.floor(
          process.uptime()
        ),

      timestamp:
        new Date().toISOString(),
    },
  });
});

/**
 * =====================================================
 * API V1
 * =====================================================
 */

/**
 * =====================================================
 * AUTENTICAÇÃO
 * =====================================================
 */
router.use(
  "/v1/auth",
  authRoutes
);

/**
 * =====================================================
 * ONBOARDING
 * =====================================================
 *
 * Rota pública responsável pelo primeiro cadastro
 * de um condomínio na plataforma.
 *
 * A solicitação inicial cria o condomínio em estado
 * PENDING.
 *
 * A liberação comercial, plano, vencimento,
 * usuário e senha são controlados posteriormente
 * pelo PLATFORM_ADMIN através da Central Star.
 */
router.use(
  "/v1/onboarding",
  onboardingRoutes
);

/**
 * =====================================================
 * WEBHOOKS PÚBLICOS DE PAGAMENTO
 * =====================================================
 *
 * As rotas validam a assinatura do provedor.
 */
router.use(
  "/v1/webhooks/payments",
  paymentWebhookRoutes
);

/**
 * =====================================================
 * WEBHOOK PÚBLICO DO WHATSAPP
 * =====================================================
 *
 * GET:
 * validação inicial da URL pela Meta.
 *
 * POST:
 * atualização de status de mensagens.
 *
 * A autenticidade do POST é validada através de
 * X-Hub-Signature-256 usando WHATSAPP_APP_SECRET.
 */
router.use(
  "/v1/webhooks/whatsapp",
  whatsappWebhookRoutes
);



router.use("/v1/support-tickets", supportTicketRoutes);

/**
 * =====================================================
 * CENTRAL STAR INFINITY CODE
 * PLATFORM ADMIN
 * =====================================================
 *
 * Área administrativa privada da plataforma.
 *
 * Cada módulo interno aplica:
 *
 * - authMiddleware;
 * - platformAdminMiddleware.
 *
 * Nenhum usuário pertencente a condomínio deve
 * possuir acesso às rotas abaixo.
 */

/**
 * Dashboard global da plataforma.
 *
 * Indicadores:
 *
 * - condomínios;
 * - usuários;
 * - assinaturas;
 * - planos;
 * - operação;
 * - cobranças;
 * - comunicações;
 * - jobs;
 * - backups;
 * - eventos do sistema.
 */
router.use(
  "/v1/platform/dashboard",
  platformDashboardRoutes
);

/**
 * Gestão administrativa de condomínios.
 *
 * Inclui:
 *
 * - solicitações PENDING;
 * - filtros;
 * - paginação;
 * - detalhes;
 * - aprovação;
 * - rejeição;
 * - plano;
 * - vencimento;
 * - criação de credenciais.
 */
router.use(
  "/v1/platform/condominiums",
  platformCondominiumRoutes
);

/**
 * Gestão comercial de planos.
 *
 * Inclui:
 *
 * - criação;
 * - edição;
 * - ativação;
 * - desativação;
 * - ordenação;
 * - estatísticas.
 */
router.use(
  "/v1/platform/plans",
  platformPlanRoutes
);

/**
 * Gestão global de usuários.
 *
 * Uso exclusivo da Central Star Infinity Code.
 *
 * Inclui:
 *
 * - pesquisa global;
 * - filtros;
 * - paginação;
 * - alteração de username;
 * - alteração de dados;
 * - bloqueio;
 * - desbloqueio;
 * - ativação;
 * - inativação;
 * - redefinição de senha temporária;
 * - consulta de último acesso.
 */
router.use(
  "/v1/platform/users",
  platformUserRoutes
);

/**
 * Monitoramento técnico e central de eventos do sistema.
 */
router.use(
  "/v1/platform/system-events",
  platformSystemEventRoutes
);

/**
 * Auditoria global e timelines da Central Star.
 *
 * Uso exclusivo do PLATFORM_ADMIN.
 *
 * Inclui:
 *
 * - filtros globais;
 * - paginação;
 * - timeline por condomínio;
 * - timeline por usuário;
 * - timeline por sessão de suporte;
 * - rastreamento por requestId;
 * - indicadores de auditoria.
 */
router.use(
  "/v1/platform/audit",
  platformAuditRoutes
);

/**
 * =====================================================
 * COMUNICAÇÕES DA CENTRAL STAR
 * =====================================================
 *
 * Uso exclusivo do PLATFORM_ADMIN.
 *
 * Permite:
 *
 * - acompanhar mensagens enviadas;
 * - consultar mensagens com falha;
 * - consultar histórico por condomínio;
 * - consultar estatísticas;
 * - reenviar comunicações com falha.
 */
router.use(
  "/v1/platform/communications",
  platformCommunicationRoutes
);


/**
 * =====================================================
 * FINANCEIRO DA CENTRAL STAR
 * =====================================================
 */

router.use(
  "/v1/platform/payment-methods",
  platformPaymentMethodRoutes
);

router.use(
  "/v1/platform/charges",
  platformChargeRoutes
);

router.use(
  "/v1/platform/payment-transactions",
  platformPaymentTransactionRoutes
);

/**
 * =====================================================
 * INADIMPLÊNCIA AUTOMÁTICA
 * =====================================================
 *
 * Uso exclusivo da Central Star Infinity Code.
 *
 * A execução manual existe para operação,
 * manutenção e homologação.
 *
 * O agendamento automático desta rotina
 * será realizado pelo scheduler do Bloco 9.
 */
router.use(
  "/v1/platform/delinquency",
  platformDelinquencyRoutes
);

/**
 * Sessões administrativas de suporte.
 *
 * Uso exclusivo do PLATFORM_ADMIN.
 *
 * Permite:
 *
 * - iniciar sessão de suporte;
 * - acessar temporariamente o contexto
 *   de um condomínio;
 * - manter a identidade real do
 *   PLATFORM_ADMIN;
 * - registrar suporte em auditoria;
 * - consultar sessão atual;
 * - consultar histórico;
 * - encerrar a sessão.
 *
 * O administrador da plataforma nunca utiliza
 * a senha do cliente para prestar suporte.
 */
router.use(
  "/v1/platform/support",
  platformSupportRoutes
);

/**
 * =====================================================
 * OPERAÇÕES DA PLATAFORMA
 * =====================================================
 *
 * Uso exclusivo do PLATFORM_ADMIN.
 *
 * Inclui:
 *
 * - status do scheduler;
 * - listagem de jobs;
 * - execução manual de jobs;
 * - enable/disable;
 * - histórico de backups;
 * - backup manual;
 * - limpeza por retenção.
 */
router.use(
  "/v1/platform/operations",
  platformOperationsRoutes
);


/**
 * =====================================================
 * CONTROLE DE ACESSO POR ASSINATURA
 * =====================================================
 *
 * Este conjunto de middlewares protege todos os
 * módulos operacionais do InfinityCondo.
 *
 * A ordem é:
 *
 * 1. valida JWT;
 * 2. verifica o status do condomínio/assinatura;
 * 3. encaminha para a rota específica do módulo.
 *
 * A assinatura OVERDUE continua liberada durante
 * o período de tolerância.
 *
 * SUSPENDED, CANCELED, PENDING e REJECTED
 * bloqueiam o uso operacional.
 *
 * PLATFORM_ADMIN continua liberado para suporte
 * e administração da plataforma.
 */
const operationalGuards = [
  authMiddleware,
  subscriptionAccessMiddleware,
];

router.use(
  "/v1/configuration",
  ...operationalGuards,
  configurationRoutes
);

/**
 * =====================================================
 * APARTAMENTOS
 * =====================================================
 */
router.use(
  "/v1/expenses",
  ...operationalGuards,
  expenseRoutes
);

router.use(
  "/v1/apartments",
  ...operationalGuards,
  apartmentRoutes
);

/**
 * =====================================================
 * MORADORES
 * =====================================================
 */
router.use(
  "/v1/residents",
  ...operationalGuards,
  residentRoutes
);

/**
 * =====================================================
 * PORTEIROS
 * =====================================================
 */
router.use(
  "/v1/doormen",
  ...operationalGuards,
  doormanRoutes
);

/**
 * =====================================================
 * VISITANTES
 * =====================================================
 */
router.use(
  "/v1/visitors",
  ...operationalGuards,
  visitorRoutes
);

/**
 * =====================================================
 * ENCOMENDAS
 * =====================================================
 */
router.use(
  "/v1/packages",
  ...operationalGuards,
  packageRoutes
);

/**
 * =====================================================
 * RESERVAS
 * =====================================================
 */
router.use(
  "/v1/reservations",
  ...operationalGuards,
  reservationRoutes
);

/**
 * =====================================================
 * ÁREAS COMUNS
 * =====================================================
 */
router.use(
  "/v1/common-areas",
  ...operationalGuards,
  commonAreaRoutes
);

/**
 * =====================================================
 * PRESTADORES
 * =====================================================
 */
router.use(
  "/v1/service-providers",
  ...operationalGuards,
  serviceProviderRoutes
);

/**
 * =====================================================
 * ACESSOS DE PRESTADORES
 * =====================================================
 */
router.use(
  "/v1/provider-accesses",
  ...operationalGuards,
  providerAccessRoutes
);

/** Registros técnicos COMPESA / Poço. */
router.use(
  "/v1/operational-records",
  ...operationalGuards,
  operationalRecordRoutes
);

/**
 * =====================================================
 * OCORRÊNCIAS
 * =====================================================
 */
router.use(
  "/v1/occurrences",
  ...operationalGuards,
  occurrenceRoutes
);

/**
 * =====================================================
 * AVISOS
 * =====================================================
 */
router.use(
  "/v1/notices",
  ...operationalGuards,
  noticeRoutes
);

/**
 * =====================================================
 * NOTIFICAÇÕES
 * =====================================================
 */
router.use(
  "/v1/notifications",
  ...operationalGuards,
  notificationRoutes
);

/**
 * =====================================================
 * AUDITORIA
 * =====================================================
 */
router.use(
  "/v1/audit",
  ...operationalGuards,
  auditRoutes
);

/**
 * =====================================================
 * DASHBOARDS OPERACIONAIS
 * =====================================================
 */
router.use(
  "/v1/dashboard",
  ...operationalGuards,
  dashboardRoutes
);

/**
 * =====================================================
 * ANALYTICS / BI
 * =====================================================
 */
router.use(
  "/v1/analytics",
  ...operationalGuards,
  requireFeature("BI_DASHBOARD"),
  analyticsRoutes
);

export default router;
