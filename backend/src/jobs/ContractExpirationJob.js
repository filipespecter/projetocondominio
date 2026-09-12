import ContractService from "../services/ContractService.js";
import { Logger } from "../utils/logger.js";

export async function runContractExpirationJob({ startedAt = new Date() } = {}) {
  Logger.info("Verificando contratos próximos do vencimento.");
  return ContractService.processExpirationAlerts(startedAt);
}

export default runContractExpirationJob;
