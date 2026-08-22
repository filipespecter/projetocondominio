import api from "./api.js";
import doormanApi from "./doormanApi.js";
import serviceProviderApi from "./serviceProviderApi.js";
import occurrenceApi from "./occurrenceApi.js";
import reservationApi from "./reservationApi.js";
import visitorApi from "./visitorApi.js";
import packageApi from "./packageApi.js";
import { listarMinhasNotificacoes, contarNaoLidas } from "./notificacaoService.js";

const unwrap = (r) => r?.data?.data ?? r?.data ?? r ?? null;

const dashboardApi = {
  async manager() {
    const [dashboard, doormen, providers, occurrences, reservations, visitors, packages, notifications, unread, audit, me] = await Promise.all([
      api.get("/v1/dashboard/manager"), doormanApi.list(), serviceProviderApi.list(), occurrenceApi.list(),
      reservationApi.list(), visitorApi.list(), packageApi.list(), listarMinhasNotificacoes(), contarNaoLidas(),
      api.get("/v1/audit"), api.get("/v1/auth/me")
    ]);
    return {
      dashboard: unwrap(dashboard) || {}, doormen, providers, occurrences, reservations, visitors, packages, notifications,
      unread: Number(unread || 0), audit: unwrap(audit) || [], me: unwrap(me) || {}
    };
  },

  async doorman() {
    const [dashboard, residents, packages, occurrences, me] = await Promise.all([
      api.get("/v1/dashboard/doorman"),
      api.get("/v1/residents/directory"),
      api.get("/v1/packages"),
      api.get("/v1/occurrences"),
      api.get("/v1/auth/me"),
    ]);
    return { dashboard: unwrap(dashboard) || {}, residents: unwrap(residents) || [], packages: unwrap(packages) || [], occurrences: unwrap(occurrences) || [], me: unwrap(me) || {} };
  },

  async resident() {
    const [dashboard, occurrences, me] = await Promise.all([
      api.get("/v1/dashboard/resident"),
      api.get("/v1/occurrences/my"),
      api.get("/v1/auth/me"),
    ]);
    return { dashboard: unwrap(dashboard) || {}, occurrences: unwrap(occurrences) || [], me: unwrap(me) || {} };
  },

};

export default dashboardApi;
