import api from "./api.js";
function unwrap(r){return r?.data?.data ?? r?.data ?? null;}
const expenseApi={
  async list({month,categoryId="",search=""}={}){ const q=new URLSearchParams(); if(month)q.set("month",month); if(categoryId)q.set("categoryId",categoryId); if(search)q.set("search",search); return unwrap(await api.get(`/v1/expenses?${q.toString()}`)); },
  async categories(){ return unwrap(await api.get("/v1/expenses/categories")) ?? []; },
  async createCategory(payload){ return unwrap(await api.post("/v1/expenses/categories",payload)); },
  async updateCategory(id,payload){ return unwrap(await api.patch(`/v1/expenses/categories/${id}`,payload)); },
  async removeCategory(id){ return unwrap(await api.delete(`/v1/expenses/categories/${id}`)); },
  async receipt(id){ return unwrap(await api.get(`/v1/expenses/${id}/receipt`)); },
  async create(payload){ return unwrap(await api.post("/v1/expenses",payload)); },
  async update(id,payload){ return unwrap(await api.patch(`/v1/expenses/${id}`,payload)); },
  async remove(id){ return unwrap(await api.delete(`/v1/expenses/${id}`)); },
};
export default expenseApi;
