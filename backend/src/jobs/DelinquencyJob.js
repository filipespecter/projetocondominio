import DelinquencyService from "../services/DelinquencyService.js";
import { Logger } from "../utils/logger.js";

/**
 * =====================================================
 * DELINQUENCY JOB
 * =====================================================
 *
 * Orquestra a rotina diária já existente no
 * DelinquencyService.
 *
 * Nenhuma regra financeira fica neste arquivo.
 */
export async function runDelinquencyJob({
  startedAt = new Date(),
} = {}) {
  Logger.info(
    "Executando rotina automática de inadimplência."
  );

  return DelinquencyService
    .runDaily(
      startedAt,
      {
        requestId:
          `JOB-DELINQUENCY-${startedAt.getTime()}`,
        source:
          "JOB",
      }
    );
}

export default runDelinquencyJob;
