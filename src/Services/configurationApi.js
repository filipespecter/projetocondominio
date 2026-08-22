import api from "./api.js";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response ?? null;

const configurationApi = {
  async getAll() { return unwrap(await api.get("/v1/configuration")); },
  async updateCondominium(data) { return unwrap(await api.patch("/v1/configuration/condominium", data)); },
  async updateSettings(group, data) { return unwrap(await api.patch(`/v1/configuration/settings/${group}`, data)); },
  async createUser(data) { return unwrap(await api.post("/v1/configuration/users", data)); },
  async updateUser(id, data) { return unwrap(await api.patch(`/v1/configuration/users/${id}`, data)); },
  async toggleUser(id) { return unwrap(await api.patch(`/v1/configuration/users/${id}/status`, {})); },
  async removeUser(id) { return unwrap(await api.delete(`/v1/configuration/users/${id}`)); },
  async updateMasterCredentials(data) { return unwrap(await api.patch("/v1/configuration/master-credentials", data)); },
};

export default configurationApi;