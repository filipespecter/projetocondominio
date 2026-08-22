import api from "./api.js";

const operationalDirectoryApi = {
  async residents() {
    const response = await api.get("/v1/residents/directory");
    return response?.data?.data ?? response?.data ?? [];
  },

  async apartments() {
    const response = await api.get("/v1/apartments/directory");
    return response?.data?.data ?? response?.data ?? [];
  },
};

export default operationalDirectoryApi;