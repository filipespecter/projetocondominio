import api from "./api.js";
const unwrap=(r)=>r?.data?.data??r?.data??null;
const operationalRecordApi={
  async list(){return unwrap(await api.get("/v1/operational-records"))??[];},
  async create(payload){return unwrap(await api.post("/v1/operational-records",payload));},
  async remove(id){return api.delete(`/v1/operational-records/${id}`);},
};
export default operationalRecordApi;