import { Router } from "express";

import OnboardingController from "../controllers/OnboardingController.js";

import {
  validateOnboarding,
} from "../validators/onboardingValidator.js";

const onboardingRoutes = Router();

/**
 * =====================================================
 * ONBOARDING
 * =====================================================
 *
 * Rotas públicas responsáveis pelo envio inicial
 * de solicitações de novos condomínios ao InfinityCondo.
 *
 * ATENÇÃO:
 *
 * Estas rotas não utilizam authMiddleware porque
 * o solicitante ainda não possui conta no momento
 * em que envia o cadastro.
 *
 * Isso NÃO significa ausência de segurança.
 *
 * Os dados são validados no backend e a criação
 * da solicitação ocorre dentro de transação no Service.
 *
 * Nenhum usuário ou senha é criado nesta etapa.
 */

/**
 * =====================================================
 * SOLICITAR CADASTRO DE CONDOMÍNIO
 * =====================================================
 *
 * POST /api/v1/onboarding/condominium
 *
 * Fluxo:
 *
 * 1. valida os dados recebidos;
 * 2. cria o condomínio com status PENDING;
 * 3. salva os dados do responsável;
 * 4. registra auditoria;
 * 5. NÃO cria usuário;
 * 6. NÃO cria senha;
 * 7. NÃO libera acesso imediato;
 * 8. aguarda análise do PLATFORM_ADMIN.
 */
onboardingRoutes.post(
  "/condominium",
  validateOnboarding,
  (req, res, next) =>
    OnboardingController.registerCondominium(
      req,
      res,
      next
    )
);

export default onboardingRoutes;