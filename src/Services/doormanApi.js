import api from "./api.js";

const doormanApi = {
  async list(params = {}) {
    const response = await api.get("/v1/doormen", { params });
    return response?.data?.data ?? response?.data ?? [];
  },

  async statistics() {
    const response = await api.get("/v1/doormen/statistics");
    return response?.data?.data ?? response?.data ?? {};
  },

  async supervision(id, days = 30) {
    const response = await api.get(`/v1/doormen/${id}/supervision`, { params: { days } });
    return response?.data?.data ?? response?.data ?? {};
  },

  async create(payload) {
    const response = await api.post("/v1/doormen", payload);
    return response?.data?.data ?? response?.data;
  },

  async update(id, payload) {
    const response = await api.patch(`/v1/doormen/${id}`, payload);
    return response?.data?.data ?? response?.data;
  },

  async changeShift(id, shift, customShift = null) {
    const response = await api.patch(`/v1/doormen/${id}/shift`, { shift, customShift });
    return response?.data?.data ?? response?.data;
  },

  async registerDuty(id, lastDutyAt) {
    const response = await api.patch(`/v1/doormen/${id}/duty`, { lastDutyAt });
    return response?.data?.data ?? response?.data;
  },

  async resetPassword(id, newPassword) {
    const response = await api.patch(`/v1/doormen/${id}/reset-password`, { newPassword });
    return response?.data ?? null;
  },

  async remove(id) {
    const response = await api.delete(`/v1/doormen/${id}`);
    return response?.data ?? null;
  },
};

export default doormanApi;
