import api from "./api.js";
const unwrap = (response) => response?.data?.data ?? response?.data ?? null;
const documentApi = {
  async list(params = "") { return unwrap(await api.get(`/v1/documents${params}`)) ?? []; },
  async get(id) { return unwrap(await api.get(`/v1/documents/${id}`)); },
  async create(payload) { return unwrap(await api.post("/v1/documents", payload)); },
  async update(id, payload) { return unwrap(await api.patch(`/v1/documents/${id}`, payload)); },
  async remove(id) { return api.delete(`/v1/documents/${id}`); },
  async download(id) { return unwrap(await api.get(`/v1/documents/${id}/download`)); },
};
export default documentApi;
