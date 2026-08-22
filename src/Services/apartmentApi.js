import api from "./api.js";

const apartmentApi = {
  async list(params = {}) {
    const response = await api.get("/v1/apartments", { params });
    return response?.data?.data ?? response?.data ?? [];
  },

  async directory() {
    const response = await api.get("/v1/apartments/directory");
    return response?.data?.data ?? response?.data ?? [];
  },

  async statistics() {
    const response = await api.get("/v1/apartments/statistics");
    return response?.data?.data ?? response?.data ?? {};
  },

  async create(payload) {
    const response = await api.post("/v1/apartments", payload);
    return response?.data?.data ?? response?.data;
  },

  async update(id, payload) {
    const response = await api.patch(`/v1/apartments/${id}`, payload);
    return response?.data?.data ?? response?.data;
  },

  async changeStatus(id, status) {
    const response = await api.patch(`/v1/apartments/${id}/status`, { status });
    return response?.data?.data ?? response?.data;
  },

  async remove(id) {
    const response = await api.delete(`/v1/apartments/${id}`);
    return response?.data ?? null;
  },
};

export default apartmentApi;
