import api from "./api.js";
const unwrap = (response) => response?.data?.data ?? response?.data ?? null;
const supplierApi = {
  async list(params = "") { return unwrap(await api.get(`/v1/suppliers${params}`)) ?? []; },
  async get(id) { return unwrap(await api.get(`/v1/suppliers/${id}`)); },
  async create(payload) { return unwrap(await api.post("/v1/suppliers", payload)); },
  async update(id, payload) { return unwrap(await api.patch(`/v1/suppliers/${id}`, payload)); },
  async remove(id) { return api.delete(`/v1/suppliers/${id}`); },
};
export default supplierApi;
