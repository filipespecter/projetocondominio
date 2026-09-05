import api from "./api.js";

function dataOf(response) { return response?.data ?? null; }

const supportTicketApi = {
  async list(params = "?mine=true") { return dataOf(await api.get(`/v1/support-tickets${params}`)); },
  async create(payload) { return dataOf(await api.post("/v1/support-tickets", payload)); },
};

export default supportTicketApi;
