import api from "./api.js";
const unwrap = (response) => response?.data?.data ?? response?.data ?? null;
const assetApi = {
  async list(params = "") { return unwrap(await api.get(`/v1/assets${params}`)) ?? []; },
  async get(id) { return unwrap(await api.get(`/v1/assets/${id}`)); },
  async create(payload) { return unwrap(await api.post("/v1/assets", payload)); },
  async update(id, payload) { return unwrap(await api.patch(`/v1/assets/${id}`, payload)); },
  async remove(id) { return api.delete(`/v1/assets/${id}`); },
  async download(id) { return unwrap(await api.get(`/v1/assets/${id}/download`)); },
};
export default assetApi;
