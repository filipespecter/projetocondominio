import api from "./api.js";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

const visitorApi = {
  async list(params = "") {
    return unwrap(
      await api.get(`/v1/visitors${params}`)
    ) ?? [];
  },

  async statistics() {
    return unwrap(
      await api.get("/v1/visitors/statistics")
    ) ?? {};
  },

  async create(payload) {
    return unwrap(
      await api.post("/v1/visitors", payload)
    );
  },

  async update(id, payload) {
    return unwrap(
      await api.patch(`/v1/visitors/${id}`, payload)
    );
  },

  async authorize(id) {
    return unwrap(
      await api.patch(`/v1/visitors/${id}/authorize`, {})
    );
  },

  async deny(id) {
    return unwrap(
      await api.patch(`/v1/visitors/${id}/deny`, {})
    );
  },

  async registerEntry(id) {
    return unwrap(
      await api.patch(`/v1/visitors/${id}/entry`, {})
    );
  },

  async registerExit(id) {
    return unwrap(
      await api.patch(`/v1/visitors/${id}/exit`, {})
    );
  },

  async remove(id) {
    return api.delete(`/v1/visitors/${id}`);
  },

  async apartmentsDirectory() {
    return unwrap(
      await api.get("/v1/apartments/directory")
    ) ?? [];
  },

  async residentsDirectory() {
    return unwrap(
      await api.get("/v1/residents/directory")
    ) ?? [];
  },

  async myInvitations() {
    return unwrap(await api.get("/v1/visitors/invitations/my")) ?? [];
  },

  async createInvitation(payload) {
    return unwrap(await api.post("/v1/visitors/invitations", payload));
  },

  async validateInvitation(token) {
    return unwrap(await api.post("/v1/visitors/invitations/validate", { token }));
  },

  async cancelInvitation(id) {
    return unwrap(await api.patch(`/v1/visitors/invitations/${id}/cancel`, {}));
  },

};

export default visitorApi;
