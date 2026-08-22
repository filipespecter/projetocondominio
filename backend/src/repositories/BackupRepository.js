import BaseRepository from "./BaseRepository.js";

class BackupRepository extends BaseRepository {
  constructor() {
    super("backupRecord");
  }

  async findById(id) {
    return this.findUnique({
      id,
    });
  }

  async findRecent(
    limit = 50
  ) {
    return this.findMany(
      {},
      {
        orderBy: {
          createdAt: "desc",
        },
        take:
          Math.min(
            200,
            Math.max(
              1,
              Number(limit) || 50
            )
          ),
      }
    );
  }

  async createPending({
    trigger = "AUTOMATIC",
    createdByUserId = null,
    retentionUntil = null,
    metadata = null,
  } = {}) {
    return this.create({
      trigger,
      status:
        "PENDING",
      createdByUserId,
      retentionUntil,
      metadata,
    });
  }

  async markRunning(id) {
    return this.update(
      {
        id,
      },
      {
        status:
          "RUNNING",
        startedAt:
          new Date(),
        failureReason:
          null,
      }
    );
  }

  async markSuccess(
    id,
    {
      storageProvider,
      storageKey,
      fileName,
      sizeBytes,
      checksumSha256,
      metadata = null,
    }
  ) {
    return this.update(
      {
        id,
      },
      {
        status:
          "SUCCESS",
        storageProvider:
          storageProvider ??
          null,
        storageKey:
          storageKey ??
          null,
        fileName:
          fileName ??
          null,
        sizeBytes:
          BigInt(
            sizeBytes ?? 0
          ),
        checksumSha256:
          checksumSha256 ??
          null,
        completedAt:
          new Date(),
        failureReason:
          null,
        metadata,
      }
    );
  }

  async markVerified(id) {
    return this.update(
      {
        id,
      },
      {
        status:
          "VERIFIED",
        verifiedAt:
          new Date(),
      }
    );
  }

  async markFailed(
    id,
    failureReason,
    metadata = null
  ) {
    return this.update(
      {
        id,
      },
      {
        status:
          "FAILED",
        failureReason:
          failureReason ??
          "Falha desconhecida.",
        completedAt:
          new Date(),
        metadata,
      }
    );
  }

  async findExpiredRetention(
    referenceDate = new Date(),
    limit = 100
  ) {
    return this.findMany(
      {
        retentionUntil: {
          lt:
            referenceDate,
        },
        status: {
          in: [
            "SUCCESS",
            "VERIFIED",
          ],
        },
      },
      {
        orderBy: {
          retentionUntil:
            "asc",
        },
        take:
          Math.min(
            500,
            Math.max(
              1,
              Number(limit) || 100
            )
          ),
      }
    );
  }

  async countByStatus(status) {
    return this.count({
      status,
    });
  }
}

export default new BackupRepository();
