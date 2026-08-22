import api from "./api.js";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

export async function listarMinhasNotificacoes() {
  return (
    unwrap(
      await api.get(
        "/v1/notifications/my"
      )
    ) ?? []
  );
}

export async function listarNaoLidas() {
  return (
    unwrap(
      await api.get(
        "/v1/notifications/my/unread"
      )
    ) ?? []
  );
}

export async function contarNaoLidas() {
  const data =
    unwrap(
      await api.get(
        "/v1/notifications/unread-count"
      )
    );

  return Number(
    data?.unread ??
    data?.count ??
    0
  );
}

export async function marcarComoLida(id) {
  return unwrap(
    await api.patch(
      `/v1/notifications/${id}/read`,
      {}
    )
  );
}

export async function marcarTodasComoLidas() {
  return unwrap(
    await api.patch(
      "/v1/notifications/read-all",
      {}
    )
  );
}

export async function removerNotificacao(id) {
  return api.delete(
    `/v1/notifications/${id}`
  );
}

export async function removerLidas() {
  return api.delete(
    "/v1/notifications/read"
  );
}



export default {
  listarMinhasNotificacoes,
  listarNaoLidas,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  removerNotificacao,
  removerLidas,
};
