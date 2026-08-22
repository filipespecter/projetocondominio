import api from "./api.js";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

const reservationApi = {
  async list(query = "") {
    return (
      unwrap(
        await api.get(
          `/v1/reservations${query}`
        )
      ) ?? []
    );
  },

  async my() {
    return (
      unwrap(
        await api.get(
          "/v1/reservations/my"
        )
      ) ?? []
    );
  },

  async statistics() {
    return (
      unwrap(
        await api.get(
          "/v1/reservations/statistics"
        )
      ) ?? {}
    );
  },

  async create(payload) {
    return unwrap(
      await api.post(
        "/v1/reservations",
        payload
      )
    );
  },

  async createAdministrative(payload) {
    return unwrap(
      await api.post(
        "/v1/reservations/admin",
        payload
      )
    );
  },

  async update(id, payload) {
    return unwrap(
      await api.patch(
        `/v1/reservations/${id}`,
        payload
      )
    );
  },

  async approve(
    id,
    reviewReason = null
  ) {
    return unwrap(
      await api.patch(
        `/v1/reservations/${id}/approve`,
        { reviewReason }
      )
    );
  },

  async reject(
    id,
    reviewReason
  ) {
    return unwrap(
      await api.patch(
        `/v1/reservations/${id}/reject`,
        { reviewReason }
      )
    );
  },

  async reopen(id) {
    return unwrap(
      await api.patch(
        `/v1/reservations/${id}/reopen`,
        {}
      )
    );
  },

  async cancel(id) {
    return unwrap(
      await api.patch(
        `/v1/reservations/${id}/cancel`,
        {}
      )
    );
  },

  async complete(id) {
    return unwrap(
      await api.patch(
        `/v1/reservations/${id}/complete`,
        {}
      )
    );
  },

  async remove(id) {
    return api.delete(
      `/v1/reservations/${id}`
    );
  },
};

export default reservationApi;
