import api from "./api.js";

/**
 * Contexto autenticado do condomínio.
 *
 * A identidade, role e condominiumId sempre vêm do backend.
 * Nenhum dado operacional é persistido no navegador.
 */
const condominiumApi = {
  async me() {
    const response =
      await api.get(
        "/v1/auth/me"
      );

    return (
      response?.data?.user ??
      response?.data ??
      null
    );
  },
};

export default condominiumApi;