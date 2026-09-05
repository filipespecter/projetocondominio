import api from "./api.js";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

const packageApi = {
  async list(query = "") {
    return (
      unwrap(
        await api.get(
          `/v1/packages${query}`
        )
      ) ?? []
    );
  },

  async my() {
    return (
      unwrap(
        await api.get(
          "/v1/packages/my"
        )
      ) ?? []
    );
  },

  async statistics() {
    return (
      unwrap(
        await api.get(
          "/v1/packages/statistics"
        )
      ) ?? {}
    );
  },

  async createReceived(payload) {
    return unwrap(
      await api.post(
        "/v1/packages/received",
        payload
      )
    );
  },

  async update(id, payload) {
    return unwrap(
      await api.patch(
        `/v1/packages/${id}`,
        payload
      )
    );
  },

  async deliver(id, payload = {}) {
    return unwrap(
      await api.patch(
        `/v1/packages/${id}/deliver`,
        payload
      )
    );
  },

  async generatePickupCredential(id) {
    return unwrap(
      await api.post(
        `/v1/packages/${id}/pickup-credential`,
        {}
      )
    );
  },

  async validatePickup(method, value) {
    return unwrap(
      await api.post(
        "/v1/packages/pickup/validate",
        {
          method,
          value,
        }
      )
    );
  },

  async confirmPickup(id, payload) {
    return unwrap(
      await api.post(
        `/v1/packages/${id}/pickup/confirm`,
        payload
      )
    );
  },

  async deliveryProof(id) {
    return unwrap(await api.get(`/v1/packages/${id}/delivery-proof`));
  },

  async remove(id) {
    return api.delete(
      `/v1/packages/${id}`
    );
  },

  async apartmentsDirectory() {
    return (
      unwrap(
        await api.get(
          "/v1/apartments/directory"
        )
      ) ?? []
    );
  },

  async residentsDirectory() {
    return (
      unwrap(
        await api.get(
          "/v1/residents/directory"
        )
      ) ?? []
    );
  },
};

export default packageApi;
