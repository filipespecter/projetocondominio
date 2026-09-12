import supplierRepository from "../repositories/SupplierRepository.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

class SupplierService {
  normalizeText(value) { return value === undefined || value === null || String(value).trim() === "" ? null : String(value).trim(); }
  normalizeDocument(value) { const text = this.normalizeText(value); return text ? text.replace(/[^0-9A-Za-z]/g, "").toUpperCase() : null; }
  normalizeEmail(value) { const text = this.normalizeText(value); return text ? text.toLowerCase() : null; }
  normalize(data) {
    const result = {};
    for (const key of ["legalName","entityType","tradeName","contactName","phone","whatsapp","address","serviceType","notes","status"]) if (data[key] !== undefined) result[key] = this.normalizeText(data[key]);
    if (data.document !== undefined) result.document = this.normalizeDocument(data.document);
    if (data.email !== undefined) result.email = this.normalizeEmail(data.email);
    return result;
  }
  async findAll(condominiumId, filters = {}) { return supplierRepository.findByCondominium(condominiumId, filters); }
  async findById(id, condominiumId) { const supplier = await supplierRepository.findById(id, condominiumId); if (!supplier) throw new ApiError("Fornecedor não encontrado.", 404); return supplier; }
  async ensureUniqueDocument(condominiumId, document, ignoredId = null) {
    if (!document) return;
    const existing = await supplierRepository.findByDocument(condominiumId, document);
    if (existing && existing.id !== ignoredId) throw new ApiError("Já existe fornecedor com este documento neste condomínio.", 409);
  }
  async create(condominiumId, data, user, requestContext = null) {
    const normalized = this.normalize(data); normalized.status ||= "ACTIVE";
    await this.ensureUniqueDocument(condominiumId, normalized.document);
    const supplier = await supplierRepository.createForCondominium(condominiumId, normalized);
    await AuditLogService.logCreate({ condominiumId, user, module: "SUPPLIER", referenceId: supplier.id, afterData: supplier, details: "Fornecedor cadastrado.", requestContext });
    return supplier;
  }
  async update(id, condominiumId, data, user, requestContext = null) {
    const before = await this.findById(id, condominiumId);
    const normalized = this.normalize(data);
    if (normalized.document !== undefined) await this.ensureUniqueDocument(condominiumId, normalized.document, id);
    const supplier = await supplierRepository.updateById(id, condominiumId, normalized);
    if (!supplier) throw new ApiError("Fornecedor não encontrado.", 404);
    await AuditLogService.logUpdate({ condominiumId, user, module: "SUPPLIER", referenceId: id, beforeData: before, afterData: supplier, details: "Fornecedor atualizado.", requestContext });
    return supplier;
  }
  async remove(id, condominiumId, user, requestContext = null) {
    const before = await this.findById(id, condominiumId);
    if (before._count?.contracts > 0) throw new ApiError("Fornecedor possui contratos vinculados. Inative-o em vez de excluir.", 409);
    const ok = await supplierRepository.softDelete(id, condominiumId);
    if (!ok) throw new ApiError("Fornecedor não encontrado.", 404);
    await AuditLogService.logDelete({ condominiumId, user, module: "SUPPLIER", referenceId: id, beforeData: before, details: "Fornecedor removido logicamente.", requestContext });
    return { message: "Fornecedor removido com sucesso." };
  }
}
export default new SupplierService();
