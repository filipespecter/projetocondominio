import api from "./api.js";
const dataOf = (response) => response?.data ?? null;
const supportTicketApi = {
  async mine() { return dataOf(await api.get("/v1/support-tickets/mine")) ?? []; },
  async create(payload) { return dataOf(await api.post("/v1/support-tickets", payload)); },
};
export default supportTicketApi;
