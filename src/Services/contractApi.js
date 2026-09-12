import api from "./api.js";
const unwrap = (response) => response?.data?.data ?? response?.data ?? null;
const contractApi = {
  async list(params = "") { return unwrap(await api.get(`/v1/contracts${params}`)) ?? []; },
  async get(id) { return unwrap(await api.get(`/v1/contracts/${id}`)); },
  async create(payload) { return unwrap(await api.post("/v1/contracts", payload)); },
  async update(id, payload) { return unwrap(await api.patch(`/v1/contracts/${id}`, payload)); },
  async remove(id) { return api.delete(`/v1/contracts/${id}`); },
  async download(id) { return unwrap(await api.get(`/v1/contracts/${id}/download`)); },
};
export default contractApi;
