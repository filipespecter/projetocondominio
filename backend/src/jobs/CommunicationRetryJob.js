import communicationLogRepository from "../repositories/CommunicationLogRepository.js";
import CommunicationService from "../services/CommunicationService.js";
import { Logger } from "../utils/logger.js";

/**
 * =====================================================
 * COMMUNICATION RETRY JOB
 * =====================================================
 *
 * Reprocessa somente comunicações FAILED elegíveis.
 *
 * Regras:
 *
 * - limite de tentativas;
 * - lote limitado;
 * - não cria nova comunicação;
 * - reutiliza CommunicationService.retry();
 * - uma falha individual não interrompe o lote.
 */
export async function runCommunicationRetryJob({
  startedAt = new Date(),
} = {}) {
  const maxAttempts =
    Number(
      process.env
        .COMMUNICATION_MAX_ATTEMPTS ??
      3
    );

  const batchSize =
    Number(
      process.env
        .COMMUNICATION_RETRY_BATCH_SIZE ??
      50
    );

  const retryDelayMinutes =
    Number(
      process.env
        .COMMUNICATION_RETRY_DELAY_MINUTES ??
      15
    );

  const retryBefore =
    new Date(
      startedAt.getTime() -
      retryDelayMinutes *
        60 *
        1000
    );

  const candidates =
    await communicationLogRepository
      .findRetryCandidates({
        maxAttempts,
        retryBefore,
        limit:
          batchSize,
      });

  const result = {
    found:
      candidates.length,
    retried: 0,
    succeeded: 0,
    failed: 0,
    items: [],
  };

  for (
    const communication of
      candidates
  ) {
    result.retried +=
      1;

    try {
      const updated =
        await CommunicationService
          .retry(
            communication.id,
            null,
            {
              requestId:
                `JOB-COMMUNICATION-RETRY-${communication.id}-${startedAt.getTime()}`,
              source:
                "JOB",
            }
          );

      result.succeeded +=
        1;

      result.items.push({
        id:
          communication.id,
        success:
          true,
        status:
          updated?.status ??
          null,
      });
    } catch (error) {
      result.failed +=
        1;

      result.items.push({
        id:
          communication.id,
        success:
          false,
        error:
          error?.message ??
          "Falha desconhecida.",
      });

      Logger.warn(
        `Retry automático da comunicação ${communication.id} falhou.`,
        {
          error:
            error?.message ??
            null,
        }
      );
    }
  }

  return result;
}

export default runCommunicationRetryJob;
