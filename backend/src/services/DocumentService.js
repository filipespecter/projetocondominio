import documentRepository from "../repositories/DocumentRepository.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { removeStoredFile, saveFileDataUrl, sanitizeFileName, storedFileAsDataUrl } from "../utils/fileStorage.js";

class DocumentService {
  normalizeDate(value, label = "Data") {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new ApiError(`${label} inválida.`, 422);
    return date;
  }

  visibleForRole(role) {
    if (["CONDOMINIUM_ADMIN", "MANAGER"].includes(role)) return null;
    if (role === "RESIDENT") return ["RESIDENTS", "ALL"];
    if (role === "DOORMAN") return ["DOORMEN", "ALL"];
    return [];
  }

  canView(document, role) {
    if (["CONDOMINIUM_ADMIN", "MANAGER"].includes(role)) return true;
    if (role === "RESIDENT") return ["RESIDENTS", "ALL"].includes(document.visibility);
    if (role === "DOORMAN") return ["DOORMEN", "ALL"].includes(document.visibility);
    return false;
  }

  async findAll(condominiumId, role, filters = {}) {
    if (!condominiumId) throw new ApiError("Condomínio não identificado.", 400);
    const visibleFor = this.visibleForRole(role);
    if (visibleFor && visibleFor.length === 0) throw new ApiError("Você não possui permissão para consultar documentos.", 403);
    return documentRepository.findByCondominium(condominiumId, {
      ...filters,
      visibility: visibleFor ? undefined : filters.visibility,
      visibleFor,
    });
  }

  async findById(id, condominiumId, role) {
    const document = await documentRepository.findById(id, condominiumId);
    if (!document) throw new ApiError("Documento não encontrado.", 404);
    if (!this.canView(document, role)) throw new ApiError("Você não possui permissão para visualizar este documento.", 403);
    return document;
  }

  async notifyVisibility(document) {
    const tasks = [];
    const data = {
      title: "Novo documento disponível",
      message: document.title,
      type: "DOCUMENT_PUBLISHED",
      module: "DOCUMENT",
      referenceId: document.id,
      priority: "NORMAL",
    };
    if (["RESIDENTS", "ALL"].includes(document.visibility)) {
      tasks.push(NotificationService.createForActiveRoleUsers(document.condominiumId, "RESIDENT", data));
    }
    if (["DOORMEN", "ALL"].includes(document.visibility)) {
      tasks.push(NotificationService.createForActiveRoleUsers(document.condominiumId, "DOORMAN", data));
    }
    await Promise.allSettled(tasks);
  }

  async create(condominiumId, data, user, requestContext = null) {
    const saved = await saveFileDataUrl(data.fileDataUrl, "documents");
    try {
      const document = await documentRepository.createForCondominium(condominiumId, user.id, {
        title: data.title.trim(),
        description: data.description ?? null,
        category: data.category,
        visibility: data.visibility,
        documentDate: this.normalizeDate(data.documentDate, "Data do documento"),
        fileName: sanitizeFileName(data.fileName),
        filePath: saved.filePath,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
      });
      await AuditLogService.logCreate({
        condominiumId, user, module: "DOCUMENT", referenceId: document.id,
        afterData: { title: document.title, category: document.category, visibility: document.visibility, fileName: document.fileName },
        details: "Documento do condomínio cadastrado.", requestContext,
      });
      await this.notifyVisibility(document);
      return document;
    } catch (error) {
      await removeStoredFile(saved?.filePath);
      throw error;
    }
  }

  async update(id, condominiumId, data, user, requestContext = null) {
    const before = await documentRepository.findById(id, condominiumId);
    if (!before) throw new ApiError("Documento não encontrado.", 404);
    let saved = null;
    try {
      if (data.fileDataUrl) saved = await saveFileDataUrl(data.fileDataUrl, "documents");
      const update = {};
      for (const key of ["title", "description", "category", "visibility"]) {
        if (data[key] !== undefined) update[key] = data[key];
      }
      if (data.documentDate !== undefined) update.documentDate = this.normalizeDate(data.documentDate, "Data do documento");
      if (saved) {
        update.fileName = sanitizeFileName(data.fileName ?? before.fileName);
        update.filePath = saved.filePath;
        update.mimeType = saved.mimeType;
        update.fileSize = saved.fileSize;
      } else if (data.fileName !== undefined) {
        update.fileName = sanitizeFileName(data.fileName);
      }
      const document = await documentRepository.updateById(id, condominiumId, update);
      if (!document) throw new ApiError("Documento não encontrado.", 404);
      if (saved) await removeStoredFile(before.filePath);
      await AuditLogService.logUpdate({
        condominiumId, user, module: "DOCUMENT", referenceId: id,
        beforeData: { title: before.title, category: before.category, visibility: before.visibility, fileName: before.fileName },
        afterData: { title: document.title, category: document.category, visibility: document.visibility, fileName: document.fileName },
        details: "Documento do condomínio atualizado.", requestContext,
      });
      if (data.visibility !== undefined) await this.notifyVisibility(document);
      return document;
    } catch (error) {
      if (saved) await removeStoredFile(saved.filePath);
      throw error;
    }
  }

  async remove(id, condominiumId, user, requestContext = null) {
    const before = await documentRepository.findById(id, condominiumId);
    if (!before) throw new ApiError("Documento não encontrado.", 404);
    const removed = await documentRepository.softDelete(id, condominiumId);
    if (!removed) throw new ApiError("Documento não encontrado.", 404);
    await AuditLogService.logDelete({
      condominiumId, user, module: "DOCUMENT", referenceId: id,
      beforeData: { title: before.title, category: before.category, visibility: before.visibility, fileName: before.fileName },
      details: "Documento do condomínio removido logicamente.", requestContext,
    });
    return { message: "Documento removido com sucesso." };
  }

  async download(id, condominiumId, role) {
    const document = await this.findById(id, condominiumId, role);
    const dataUrl = await storedFileAsDataUrl(document.filePath, document.mimeType);
    if (!dataUrl) throw new ApiError("Arquivo do documento não foi encontrado no armazenamento.", 404);
    return { fileName: document.fileName, mimeType: document.mimeType, fileSize: document.fileSize, dataUrl };
  }
}

export default new DocumentService();
