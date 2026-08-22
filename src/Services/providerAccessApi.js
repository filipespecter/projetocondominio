import api from "./api.js";
const unwrap=(r)=>r?.data?.data??r?.data??null;
const providerAccessApi={
  async list(query=""){return unwrap(await api.get(`/v1/provider-accesses${query}`))??[];},
  async create(payload){return unwrap(await api.post("/v1/provider-accesses",payload));},
  async update(id,payload){return unwrap(await api.patch(`/v1/provider-accesses/${id}`,payload));},
  async entry(id){return unwrap(await api.patch(`/v1/provider-accesses/${id}/entry`,{}));},
  async exit(id){return unwrap(await api.patch(`/v1/provider-accesses/${id}/exit`,{}));},
  async cancel(id){return unwrap(await api.patch(`/v1/provider-accesses/${id}/cancel`,{}));},
  async remove(id){return api.delete(`/v1/provider-accesses/${id}`);},
};
export default providerAccessApi;