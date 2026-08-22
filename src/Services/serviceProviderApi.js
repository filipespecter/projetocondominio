import api from "./api.js";
const unwrap=(r)=>r?.data?.data??r?.data??null;
const serviceProviderApi={
  async list(query=""){return unwrap(await api.get(`/v1/service-providers${query}`))??[];},
  async create(payload){return unwrap(await api.post("/v1/service-providers",payload));},
  async update(id,payload){return unwrap(await api.patch(`/v1/service-providers/${id}`,payload));},
  async activate(id){return unwrap(await api.patch(`/v1/service-providers/${id}/activate`,{}));},
  async deactivate(id){return unwrap(await api.patch(`/v1/service-providers/${id}/deactivate`,{}));},
  async block(id){return unwrap(await api.patch(`/v1/service-providers/${id}/block`,{}));},
  async remove(id){return api.delete(`/v1/service-providers/${id}`);},
};
export default serviceProviderApi;