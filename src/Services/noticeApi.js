import api from "./api.js";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

const noticeApi = {
  async list(query = "") {
    return (
      unwrap(
        await api.get(
          `/v1/notices${query}`
        )
      ) ?? []
    );
  },

  async statistics() {
    return (
      unwrap(
        await api.get(
          "/v1/notices/statistics"
        )
      ) ?? {}
    );
  },

  async create(payload) {
    return unwrap(
      await api.post(
        "/v1/notices",
        payload
      )
    );
  },

  async update(id, payload) {
    return unwrap(
      await api.patch(
        `/v1/notices/${id}`,
        payload
      )
    );
  },

  async publish(id) {
    return unwrap(
      await api.patch(
        `/v1/notices/${id}/publish`,
        {}
      )
    );
  },

  async draft(id) {
    return unwrap(
      await api.patch(
        `/v1/notices/${id}/draft`,
        {}
      )
    );
  },

  async archive(id) {
    return unwrap(
      await api.patch(
        `/v1/notices/${id}/archive`,
        {}
      )
    );
  },

  async remove(id) {
    return api.delete(
      `/v1/notices/${id}`
    );
  },
};

export default noticeApi;
