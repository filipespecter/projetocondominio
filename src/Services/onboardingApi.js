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
 * Regra atual:
 *
 * - cria apenas a solicitação do condomínio;
 * - registra os dados do responsável pelo cadastro;
 * - condomínio permanece PENDING;
 * - NÃO cria usuário/senha nesta etapa;
 * - credenciais são definidas posteriormente pela Central Star.
 */
export async function registerCondominium({
  condominium,
  contact,
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

        contact: {
          name:
            contact.name,

          email:
            contact.email,

          phone:
            contact.phone ||
            null,
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
