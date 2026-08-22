import OnboardingService from "../services/OnboardingService.js";

/**
 * =====================================================
 * ONBOARDING CONTROLLER
 * =====================================================
 *
 * Responsável por receber as requisições HTTP
 * relacionadas à solicitação pública de cadastro
 * de um condomínio no InfinityCondo.
 *
 * IMPORTANTE:
 *
 * O Controller não contém regra de negócio.
 *
 * Sua responsabilidade é:
 *
 * 1. receber a requisição;
 * 2. encaminhar os dados validados ao Service;
 * 3. devolver a resposta HTTP;
 * 4. encaminhar erros ao middleware global.
 */
class OnboardingController {
  /**
   * ===================================================
   * SOLICITAÇÃO DE CADASTRO DE CONDOMÍNIO
   * ===================================================
   *
   * POST /api/v1/onboarding/condominium
   *
   * Esta é uma rota pública.
   *
   * Ela cria:
   *
   * - uma solicitação de condomínio;
   * - status inicial PENDING;
   * - dados do responsável;
   * - registro inicial de auditoria.
   *
   * NÃO cria:
   *
   * - usuário;
   * - senha;
   * - CONDOMINIUM_ADMIN;
   * - acesso imediato ao sistema.
   *
   * A liberação de acesso ocorrerá posteriormente
   * através do PLATFORM_ADMIN da Star Infinity Code.
   */
  async registerCondominium(
    req,
    res,
    next
  ) {
    try {
      /**
       * req.body já chega validado e normalizado
       * pelo onboardingValidator.
       */
      const result =
        await OnboardingService.register(
          req.body
        );

      /**
       * Retorna somente os dados públicos necessários
       * para confirmar o recebimento da solicitação.
       */
      return res
        .status(201)
        .json({
          success: true,

          message:
            "Solicitação de cadastro enviada com sucesso.",

          data: result,
        });
    } catch (error) {
      /**
       * O tratamento final fica centralizado no
       * errorHandler global da aplicação.
       */
      return next(error);
    }
  }
}

export default new OnboardingController();