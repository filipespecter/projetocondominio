import api from "./api.js";

const residentApi = {
  async list(params = {}) {
    const response = await api.get("/v1/residents", { params });
    return response?.data?.data ?? response?.data ?? [];
  },

  async directory() {
    const response = await api.get("/v1/residents/directory");
    return response?.data?.data ?? response?.data ?? [];
  },

  async create(payload) {
    const response = await api.post("/v1/residents", payload);
    return response?.data?.data ?? response?.data;
  },

  async update(id, payload) {
    const response = await api.patch(`/v1/residents/${id}`, payload);
    return response?.data?.data ?? response?.data;
  },

  async changeApartment(id, apartmentId) {
    const response = await api.patch(`/v1/residents/${id}/apartment`, { apartmentId });
    return response?.data?.data ?? response?.data;
  },

  async updatePermissions(id, payload) {
    const response = await api.patch(`/v1/residents/${id}/permissions`, payload);
    return response?.data?.data ?? response?.data;
  },

  async resetPassword(id, newPassword) {
    const response = await api.patch(`/v1/residents/${id}/reset-password`, { newPassword });
    return response?.data ?? null;
  },

  async remove(id) {
    const response = await api.delete(`/v1/residents/${id}`);
    return response?.data ?? null;
  },
};

export default residentApi;
