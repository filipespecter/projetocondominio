import api from "./api.js";

function dataOf(response) {
  return response?.data ?? null;
}

function listOf(response) {
  const data =
    dataOf(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

const platformApi = {
  dashboard: {
    async get() {
      return dataOf(
        await api.get(
          "/v1/platform/dashboard"
        )
      );
    },
  },

  condominiums: {
    async list(params = "") {
      return dataOf(
        await api.get(
          `/v1/platform/condominiums${params}`
        )
      );
    },

    async pending() {
      return dataOf(
        await api.get(
          "/v1/platform/condominiums/pending"
        )
      );
    },

    async clients(params = "") {
      return dataOf(
        await api.get(
          `/v1/platform/condominiums/clients${params}`
        )
      );
    },

    async statistics() {
      return dataOf(
        await api.get(
          "/v1/platform/condominiums/statistics"
        )
      );
    },

    async show(id) {
      return dataOf(
        await api.get(
          `/v1/platform/condominiums/${id}`
        )
      );
    },

    async approve(id, payload) {
      return dataOf(
        await api.post(
          `/v1/platform/condominiums/${id}/approve`,
          payload
        )
      );
    },

    async reject(id, payload) {
      return dataOf(
        await api.post(
          `/v1/platform/condominiums/${id}/reject`,
          payload
        )
      );
    },

    async changePlan(id, planId) {
      return dataOf(
        await api.patch(
          `/v1/platform/condominiums/${id}/plan`,
          { planId }
        )
      );
    },
  },

  users: {
    async list(params = "") {
      return dataOf(
        await api.get(
          `/v1/platform/users${params}`
        )
      );
    },

    async statistics() {
      return dataOf(
        await api.get(
          "/v1/platform/users/statistics"
        )
      );
    },

    async show(id) {
      return dataOf(
        await api.get(
          `/v1/platform/users/${id}`
        )
      );
    },

    async profile(id) {
      return dataOf(
        await api.get(
          `/v1/platform/users/${id}/profile`
        )
      );
    },

    async create(payload) {
      return dataOf(
        await api.post(
          "/v1/platform/users",
          payload
        )
      );
    },

    async update(id, payload) {
      return dataOf(
        await api.put(
          `/v1/platform/users/${id}`,
          payload
        )
      );
    },

    async changeStatus(
      id,
      payload
    ) {
      return dataOf(
        await api.patch(
          `/v1/platform/users/${id}/status`,
          payload
        )
      );
    },

    async resetPassword(
      id,
      payload
    ) {
      return dataOf(
        await api.patch(
          `/v1/platform/users/${id}/reset-password`,
          payload
        )
      );
    },
  },

  plans: {
    async active() {
      return listOf(
        await api.get(
          "/v1/platform/plans/active"
        )
      );
    },

    async list() {
      return listOf(
        await api.get(
          "/v1/platform/plans"
        )
      );
    },

    async statistics() {
      return dataOf(
        await api.get(
          "/v1/platform/plans/statistics"
        )
      );
    },

    async create(payload) {
      return dataOf(
        await api.post(
          "/v1/platform/plans",
          payload
        )
      );
    },

    async update(id, payload) {
      return dataOf(
        await api.put(
          `/v1/platform/plans/${id}`,
          payload
        )
      );
    },

    async activate(id) {
      return dataOf(
        await api.patch(
          `/v1/platform/plans/${id}/activate`,
          {}
        )
      );
    },

    async deactivate(id) {
      return dataOf(
        await api.patch(
          `/v1/platform/plans/${id}/deactivate`,
          {}
        )
      );
    },
  },

  audit: {
    async show(id) { return dataOf(await api.get(`/v1/platform/audit/${id}`)); },
    async remove(id, reason = "") { return dataOf(await api.delete(`/v1/platform/audit/${id}`, { body: { reason } })); },
    async clearView(reason = "") { return dataOf(await api.post("/v1/platform/audit/clear-view", { reason })); },
    async list() {
      return dataOf(
        await api.get(
          "/v1/platform/audit"
        )
      );
    },

    async statistics() {
      return dataOf(
        await api.get(
          "/v1/platform/audit/statistics"
        )
      );
    },
  },

  events: {
    async list() {
      return dataOf(
        await api.get(
          "/v1/platform/system-events"
        )
      );
    },

    async statistics() {
      return dataOf(
        await api.get(
          "/v1/platform/system-events/statistics"
        )
      );
    },

    async resolve(id, payload = {}) {
      return dataOf(
        await api.patch(
          `/v1/platform/system-events/${id}/resolve`,
          payload
        )
      );
    },

    async reopen(id) {
      return dataOf(
        await api.patch(
          `/v1/platform/system-events/${id}/reopen`,
          {}
        )
      );
    },
  },

  support: {
    async tickets(params = "") { return dataOf(await api.get(`/v1/platform/support/tickets${params}`)) ?? []; },
    async ticketStatistics() { return dataOf(await api.get("/v1/platform/support/tickets/statistics")); },
    async updateTicket(id, payload) { return dataOf(await api.patch(`/v1/platform/support/tickets/${id}`, payload)); },

    async current() {
      return dataOf(
        await api.get(
          "/v1/platform/support/current"
        )
      );
    },

    async history() {
      return dataOf(
        await api.get(
          "/v1/platform/support/history"
        )
      );
    },

    async start(payload) {
      return dataOf(
        await api.post(
          "/v1/platform/support/start",
          payload
        )
      );
    },

    async close(id) {
      return dataOf(
        await api.post(
          `/v1/platform/support/${id}/close`,
          {}
        )
      );
    },
  },

  operations: {
    async databaseStatistics() { return dataOf(await api.get("/v1/platform/operations/database/statistics")); },
    async resetHomologation(phrase) { return dataOf(await api.post("/v1/platform/operations/database/reset-homologation", { phrase })); },

    async jobs() {
      return dataOf(
        await api.get(
          "/v1/platform/operations/jobs"
        )
      );
    },

    async runJob(name) {
      return dataOf(
        await api.post(
          `/v1/platform/operations/jobs/${name}/run`,
          {}
        )
      );
    },

    async enableJob(name) {
      return dataOf(
        await api.patch(
          `/v1/platform/operations/jobs/${name}/enable`,
          {}
        )
      );
    },

    async disableJob(name) {
      return dataOf(
        await api.patch(
          `/v1/platform/operations/jobs/${name}/disable`,
          {}
        )
      );
    },

    async backups() {
      return dataOf(
        await api.get(
          "/v1/platform/operations/backups"
        )
      );
    },

    async createBackup() {
      return dataOf(
        await api.post(
          "/v1/platform/operations/backups",
          {}
        )
      );
    },

    async cleanupBackups() {
      return dataOf(
        await api.post(
          "/v1/platform/operations/backups/cleanup",
          {}
        )
      );
    },
  },

  finance: {
    async allCharges() { return listOf(await api.get("/v1/platform/charges")); },

    async chargeStatistics() {
      return dataOf(
        await api.get(
          "/v1/platform/charges/statistics"
        )
      );
    },

    async condominiumCharges(
      condominiumId
    ) {
      return listOf(
        await api.get(
          `/v1/platform/charges/condominiums/${condominiumId}`
        )
      );
    },

    async charge(id) {
      return dataOf(
        await api.get(
          `/v1/platform/charges/${id}`
        )
      );
    },

    async createCharge(payload) {
      return dataOf(
        await api.post(
          "/v1/platform/charges",
          payload
        )
      );
    },

    async processCharge(
      id,
      payload = {}
    ) {
      return dataOf(
        await api.post(
          `/v1/platform/charges/${id}/process`,
          payload
        )
      );
    },

    async refundProvider(
      id,
      payload = {}
    ) {
      return dataOf(
        await api.post(
          `/v1/platform/charges/${id}/refund-provider`,
          payload
        )
      );
    },

    async paymentMethods(
      condominiumId
    ) {
      return listOf(
        await api.get(
          `/v1/platform/payment-methods/condominiums/${condominiumId}`
        )
      );
    },

    async createPaymentMethod(
      condominiumId,
      payload
    ) {
      return dataOf(
        await api.post(
          `/v1/platform/payment-methods/condominiums/${condominiumId}`,
          payload
        )
      );
    },

    async updatePaymentMethod(
      condominiumId,
      id,
      payload
    ) {
      return dataOf(
        await api.put(
          `/v1/platform/payment-methods/condominiums/${condominiumId}/${id}`,
          payload
        )
      );
    },

    async changePaymentMethodStatus(
      condominiumId,
      id,
      status
    ) {
      return dataOf(
        await api.patch(
          `/v1/platform/payment-methods/condominiums/${condominiumId}/${id}/status`,
          { status }
        )
      );
    },
  },
};

export {
  dataOf,
  listOf,
};

export default platformApi;
