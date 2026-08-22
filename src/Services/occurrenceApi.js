import api from "./api.js";
const unwrap=(r)=>r?.data?.data??r?.data??null;
const occurrenceApi={
  async list(query=""){return unwrap(await api.get(`/v1/occurrences${query}`))??[];},
  async my(){return unwrap(await api.get("/v1/occurrences/my"))??[];},
  async create(payload){return unwrap(await api.post("/v1/occurrences",payload));},
  async update(id,payload){return unwrap(await api.patch(`/v1/occurrences/${id}`,payload));},
  async markInReview(id){return unwrap(await api.patch(`/v1/occurrences/${id}/in-review`,{}));},
  async start(id){return unwrap(await api.patch(`/v1/occurrences/${id}/start`,{}));},
  async resolve(id,resolution){return unwrap(await api.patch(`/v1/occurrences/${id}/resolve`,{resolution}));},
  async cancel(id){return unwrap(await api.patch(`/v1/occurrences/${id}/cancel`,{}));},
  async markReadDoorman(id){return unwrap(await api.patch(`/v1/occurrences/${id}/read-doorman`,{}));},
  async markReadManager(id){return unwrap(await api.patch(`/v1/occurrences/${id}/read-manager`,{}));},
};
export default occurrenceApi;