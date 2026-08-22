/**
 * =====================================================
 * INFINITYCONDO - API DE ONBOARDING
 * =====================================================
 *
 * Responsável por conectar o frontend ao fluxo público
 * de cadastro inicial de condomínios.
 *
 * Esta camada NÃO contém regra de negócio.
 *
 * Ela apenas:
 *
 * - prepara o payload;
 * - chama o backend;
 * - devolve a resposta para a interface.
 */

import { api } from "./api.js";

/**
 * =====================================================
 * CADASTRO DE CONDOMÍNIO
 * =====================================================
 *
 * POST /api/v1/onboarding/condominium
 *
 * O backend cria de forma transacional:
 *
 * - Condominium;
 * - CONDOMINIUM_ADMIN;
 * - AuditLog inicial.
 */
export async function registerCondominium({
  condominium,
  administrator,
}) {
  const response =
    await api.post(
      "/v1/onboarding/condominium",
      {
        condominium: {
          name:
            condominium.name,

          legalName:
            condominium.legalName ||
            null,

          document:
            condominium.document ||
            null,

          email:
            condominium.email ||
            null,

          phone:
            condominium.phone ||
            null,

          postalCode:
            condominium.postalCode ||
            null,

          addressLine:
            condominium.addressLine ||
            null,

          addressNumber:
            condominium.addressNumber ||
            null,

          addressExtra:
            condominium.addressExtra ||
            null,

          neighborhood:
            condominium.neighborhood ||
            null,

          city:
            condominium.city ||
            null,

          state:
            condominium.state ||
            null,
        },

        administrator: {
          name:
            administrator.name,

          username:
            administrator.username,

          email:
            administrator.email,

          phone:
            administrator.phone ||
            null,

          password:
            administrator.password,

          passwordConfirmation:
            administrator.passwordConfirmation,
        },
      },
      {
        /**
         * O onboarding é público.
         *
         * Neste momento ainda não existe JWT.
         */
        authenticated: false,
      }
    );

  return response?.data ?? null;
}

/**
 * Exportação agrupada.
 */
const onboardingApi = {
  registerCondominium,
};

export default onboardingApi;
