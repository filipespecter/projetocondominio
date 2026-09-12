import api from "./api.js";
const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

const privateServiceRequestApi = {
  async list(query = "") { return unwrap(await api.get(`/v1/private-service-requests${query}`)) ?? []; },
  async create(payload) { return unwrap(await api.post("/v1/private-service-requests", payload)); },
  async cancel(id) { return unwrap(await api.patch(`/v1/private-service-requests/${id}/cancel`, {})); },
  async approve(id, payload = {}) { return unwrap(await api.patch(`/v1/private-service-requests/${id}/approve`, payload)); },
  async reject(id, payload) { return unwrap(await api.patch(`/v1/private-service-requests/${id}/reject`, payload)); },
};

export default privateServiceRequestApi;
