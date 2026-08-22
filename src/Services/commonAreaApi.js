import api from "./api.js";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

const commonAreaApi = {
  async list(query = "") {
    return (
      unwrap(
        await api.get(
          `/v1/common-areas${query}`
        )
      ) ?? []
    );
  },

  async statistics() {
    return (
      unwrap(
        await api.get(
          "/v1/common-areas/statistics"
        )
      ) ?? {}
    );
  },

  async create(payload) {
    return unwrap(
      await api.post(
        "/v1/common-areas",
        payload
      )
    );
  },

  async update(id, payload) {
    return unwrap(
      await api.patch(
        `/v1/common-areas/${id}`,
        payload
      )
    );
  },

  async activate(id) {
    return unwrap(
      await api.patch(
        `/v1/common-areas/${id}/activate`,
        {}
      )
    );
  },

  async deactivate(id) {
    return unwrap(
      await api.patch(
        `/v1/common-areas/${id}/deactivate`,
        {}
      )
    );
  },

  async setReservationRequired(
    id,
    reservationRequired
  ) {
    return unwrap(
      await api.patch(
        `/v1/common-areas/${id}/reservation-required`,
        { reservationRequired }
      )
    );
  },

  async remove(id) {
    return api.delete(
      `/v1/common-areas/${id}`
    );
  },
};

export default commonAreaApi;
