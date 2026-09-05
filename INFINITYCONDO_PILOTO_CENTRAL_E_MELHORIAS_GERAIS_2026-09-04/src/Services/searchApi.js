import api from "./api.js";
const searchApi = { async search(q) { const response = await api.get(`/v1/search?q=${encodeURIComponent(q)}`); return response?.data ?? {}; } };
export default searchApi;
