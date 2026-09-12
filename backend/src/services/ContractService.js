import contractRepository from "../repositories/ContractRepository.js";
import supplierRepository from "../repositories/SupplierRepository.js";
import userRepository from "../repositories/UserRepository.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";
import { ApiError } from "../utils/ApiError.js";
import {
  removeStoredFile,
  saveFileDataUrl,
  sanitizeFileName,
  storedFileAsDataUrl,
} from "../utils/fileStorage.js";

class ContractService {
  text(value) {
    return value === undefined || value === null || String(value).trim() === ""
      ? null
      : String(value).trim();
  }

  date(value, label) {
    if (!value) return null;
    const date = value instanceof Date
      ? new Date(value)
      : new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new ApiError(`${label} inválida.`, 422);
    }
    return date;
  }

  startOfDay(value = new Date()) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  effectiveStatus(contract, now = new Date()) {
    if (["CLOSED", "CANCELED"].includes(contract.status)) return contract.status;
    if (contract.contractKind === "ONE_OFF_SERVICE" || !contract.endDate) return "ACTIVE";
    const end = this.startOfDay(contract.endDate);
    const today = this.startOfDay(now);
    const days = Math.round((end - today) / 86400000);
    if (days < 0) return "EXPIRED";
    if (days <= 30) return "EXPIRES_SOON";
    return "ACTIVE";
  }

  decorate(contract, now = new Date()) {
    let daysUntilExpiration = null;
    if (contract.endDate) {
      const end = this.startOfDay(contract.endDate);
      const today = this.startOfDay(now);
      daysUntilExpiration = Math.round((end - today) / 86400000);
    }
    return {
      ...contract,
      status: this.effectiveStatus(contract, now),
      daysUntilExpiration,
    };
  }

  async validateRelations(condominiumId, data) {
    if (data.supplierId) {
      const supplier = await supplierRepository.findById(data.supplierId, condominiumId);
      if (!supplier) throw new ApiError("Fornecedor não encontrado neste condomínio.", 404);
      if (supplier.status === "INACTIVE") {
        throw new ApiError("O fornecedor selecionado está inativo.", 409);
      }
    }

    if (data.responsibleUserId) {
      const user = await userRepository.findById(data.responsibleUserId, condominiumId);
      if (!user) throw new ApiError("Responsável não encontrado neste condomínio.", 404);
      if (user.status !== "ACTIVE") throw new ApiError("O responsável selecionado está inativo.", 409);
    }
  }

  normalize(data) {
    const output = {};
    for (const key of [
      "supplierId",
      "contractKind",
      "serviceType",
      "reference",
      "description",
      "responsibleUserId",
      "status",
      "notes",
    ]) {
      if (data[key] !== undefined) output[key] = this.text(data[key]);
    }
    if (data.valueInCents !== undefined) output.valueInCents = data.valueInCents;
    if (data.autoRenew !== undefined) output.autoRenew = data.autoRenew;
    if (data.startDate !== undefined) output.startDate = this.date(data.startDate, "Data inicial");
    if (data.endDate !== undefined) output.endDate = this.date(data.endDate, "Vencimento");
    return output;
  }

  async findAll(condominiumId, filters = {}) {
    let rows = await contractRepository.findByCondominium(condominiumId, {
      ...filters,
      status: undefined,
    });
    rows = rows.map((contract) => this.decorate(contract));
    if (filters.status) rows = rows.filter((contract) => contract.status === filters.status);
    return rows;
  }

  async findById(id, condominiumId) {
    const contract = await contractRepository.findById(id, condominiumId);
    if (!contract) throw new ApiError("Contrato não encontrado.", 404);
    return this.decorate(contract);
  }

  async sendExpirationAlert(contract, now = new Date()) {
    if (contract.contractKind === "ONE_OFF_SERVICE" || !contract.endDate) return false;
    const decorated = this.decorate(contract, now);
    if (decorated.status !== "EXPIRES_SOON" || contract.expirationAlertSentAt) return false;

    const message = `${contract.serviceType} vence em ${decorated.daysUntilExpiration} dia${decorated.daysUntilExpiration === 1 ? "" : "s"}.`;
    const notificationData = {
      title: "Contrato próximo do vencimento",
      message,
      type: "CONTRACT_EXPIRATION",
      origin: "SYSTEM",
      module: "CONTRACT",
      referenceId: contract.id,
      priority: "HIGH",
    };

    await Promise.all([
      NotificationService.createForActiveRoleUsers(contract.condominiumId, "CONDOMINIUM_ADMIN", notificationData),
      NotificationService.createForActiveRoleUsers(contract.condominiumId, "MANAGER", notificationData),
    ]);

    const marked = await contractRepository.markExpirationAlerted(
      contract.id,
      contract.condominiumId,
      now
    );

    if (marked.count) {
      await AuditLogService.createLog({
        condominiumId: contract.condominiumId,
        action: "CONTRACT_EXPIRATION_ALERT",
        module: "CONTRACT",
        referenceId: contract.id,
        details: message,
        afterData: {
          endDate: contract.endDate,
          daysUntilExpiration: decorated.daysUntilExpiration,
        },
      });
    }

    return marked.count > 0;
  }

  async processExpirationAlerts(now = new Date()) {
    const from = this.startOfDay(now);
    const until = new Date(from);
    until.setDate(until.getDate() + 30);

    const candidates = await contractRepository.findExpirationAlertCandidates(from, until);
    const result = { found: candidates.length, sent: 0, failed: 0 };

    for (const contract of candidates) {
      try {
        if (await this.sendExpirationAlert(contract, now)) result.sent += 1;
      } catch {
        result.failed += 1;
      }
    }

    return result;
  }

  async create(condominiumId, data, user, requestContext = null) {
    await this.validateRelations(condominiumId, data);
    const normalized = this.normalize(data);
    normalized.contractKind ||= "CONTRACT";
    if (normalized.contractKind === "CONTRACT" && !normalized.endDate) {
      throw new ApiError("Informe o vencimento do contrato.", 422);
    }
    if (normalized.endDate && normalized.endDate < normalized.startDate) {
      throw new ApiError("O vencimento não pode ser anterior ao início.", 422);
    }
    if (normalized.contractKind === "ONE_OFF_SERVICE") {
      normalized.autoRenew = false;
      normalized.expirationAlertSentAt = null;
    }

    // Status temporais são calculados pelo servidor, não aceitos como forma de burlar o ciclo.
    if (!["CLOSED", "CANCELED"].includes(normalized.status)) normalized.status = "ACTIVE";

    let saved = null;
    try {
      if (data.documentDataUrl) {
        saved = await saveFileDataUrl(data.documentDataUrl, "contracts");
        normalized.documentFileName = sanitizeFileName(data.documentFileName || "contrato");
        normalized.documentFilePath = saved.filePath;
        normalized.documentMimeType = saved.mimeType;
        normalized.documentFileSize = saved.fileSize;
      }

      const contract = await contractRepository.createForCondominium(condominiumId, normalized);
      const decorated = this.decorate(contract);

      await AuditLogService.logCreate({
        condominiumId,
        user,
        module: "CONTRACT",
        referenceId: contract.id,
        afterData: {
          supplierId: contract.supplierId,
          serviceType: contract.serviceType,
          reference: contract.reference,
          endDate: contract.endDate,
          status: decorated.status,
        },
        details: "Contrato cadastrado.",
        requestContext,
      });

      await this.sendExpirationAlert(contract).catch(() => false);
      return decorated;
    } catch (error) {
      if (saved) await removeStoredFile(saved.filePath);
      throw error;
    }
  }

  async update(id, condominiumId, data, user, requestContext = null) {
    const before = await this.findById(id, condominiumId);
    await this.validateRelations(condominiumId, data);
    const normalized = this.normalize(data);
    if (data.contractKind === "ONE_OFF_SERVICE" && data.endDate === undefined) {
      normalized.endDate = null;
      normalized.autoRenew = false;
    }
    const kind = normalized.contractKind ?? before.contractKind ?? "CONTRACT";
    const start = normalized.startDate ?? new Date(before.startDate);
    const end = data.endDate !== undefined ? normalized.endDate : (before.endDate ? new Date(before.endDate) : null);
    if (kind === "CONTRACT" && !end) throw new ApiError("Informe o vencimento do contrato.", 422);
    if (end && end < start) throw new ApiError("O vencimento não pode ser anterior ao início.", 422);
    if (kind === "ONE_OFF_SERVICE") {
      normalized.autoRenew = false;
      normalized.expirationAlertSentAt = null;
    }

    if (data.endDate !== undefined || data.status !== undefined || data.contractKind !== undefined) {
      normalized.expirationAlertSentAt = null;
    }
    if (!["CLOSED", "CANCELED"].includes(normalized.status) && data.status !== undefined) {
      normalized.status = "ACTIVE";
    }

    let saved = null;
    try {
      if (data.documentDataUrl) {
        saved = await saveFileDataUrl(data.documentDataUrl, "contracts");
        normalized.documentFileName = sanitizeFileName(data.documentFileName || before.documentFileName || "contrato");
        normalized.documentFilePath = saved.filePath;
        normalized.documentMimeType = saved.mimeType;
        normalized.documentFileSize = saved.fileSize;
      }

      const contract = await contractRepository.updateById(id, condominiumId, normalized);
      if (!contract) throw new ApiError("Contrato não encontrado.", 404);
      if (saved && before.documentFilePath) await removeStoredFile(before.documentFilePath);
      const decorated = this.decorate(contract);

      await AuditLogService.logUpdate({
        condominiumId,
        user,
        module: "CONTRACT",
        referenceId: id,
        beforeData: {
          supplierId: before.supplierId,
          serviceType: before.serviceType,
          endDate: before.endDate,
          status: before.status,
        },
        afterData: {
          supplierId: decorated.supplierId,
          serviceType: decorated.serviceType,
          endDate: decorated.endDate,
          status: decorated.status,
        },
        details: "Contrato atualizado.",
        requestContext,
      });

      await this.sendExpirationAlert(contract).catch(() => false);
      return decorated;
    } catch (error) {
      if (saved) await removeStoredFile(saved.filePath);
      throw error;
    }
  }

  async remove(id, condominiumId, user, requestContext = null) {
    const before = await this.findById(id, condominiumId);
    const ok = await contractRepository.softDelete(id, condominiumId);
    if (!ok) throw new ApiError("Contrato não encontrado.", 404);
    if (before.documentFilePath) await removeStoredFile(before.documentFilePath);

    await AuditLogService.logDelete({
      condominiumId,
      user,
      module: "CONTRACT",
      referenceId: id,
      beforeData: {
        supplierId: before.supplierId,
        serviceType: before.serviceType,
        reference: before.reference,
        status: before.status,
      },
      details: "Contrato encerrado e removido logicamente.",
      requestContext,
    });
    return { message: "Contrato removido com sucesso." };
  }

  async download(id, condominiumId) {
    const contract = await this.findById(id, condominiumId);
    if (!contract.documentFilePath) throw new ApiError("Este contrato não possui documento anexado.", 404);
    const dataUrl = await storedFileAsDataUrl(contract.documentFilePath, contract.documentMimeType);
    if (!dataUrl) throw new ApiError("Arquivo do contrato não encontrado no armazenamento.", 404);
    return {
      fileName: contract.documentFileName,
      mimeType: contract.documentMimeType,
      fileSize: contract.documentFileSize,
      dataUrl,
    };
  }
}

export default new ContractService();
