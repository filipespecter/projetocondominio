import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";
import operationalRecordRepository from "../repositories/OperationalRecordRepository.js";
import { ApiError } from "../utils/ApiError.js";

class OperationalRecordService extends BaseService {
  constructor() {
    super(operationalRecordRepository);
  }

  normalizeDate(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) throw new ApiError("Data inválida.", 400);
    date.setHours(0,0,0,0);
    return date;
  }

  calculate(previousReading, currentReading, consumption) {
    if (consumption !== undefined && consumption !== null && consumption !== "") {
      const n = Number(consumption);
      if (!Number.isFinite(n) || n < 0) throw new ApiError("Consumo inválido.", 400);
      return n;
    }
    if (previousReading === null || previousReading === undefined || previousReading === "" || currentReading === null || currentReading === undefined || currentReading === "") return null;
    const previous = Number(previousReading), current = Number(currentReading);
    if (!Number.isFinite(previous) || !Number.isFinite(current) || current < previous) throw new ApiError("A leitura atual não pode ser menor que a anterior.", 400);
    return current - previous;
  }

  async findAll(condominiumId) {
    if (!condominiumId) throw new ApiError("Condomínio não identificado.", 400);
    return operationalRecordRepository.findByCondominium(condominiumId);
  }

  async create(condominiumId, data, user, requestContext=null) {
    if (!condominiumId) throw new ApiError("Condomínio não identificado.", 400);
    if (!user?.id) throw new ApiError("Usuário autenticado não identificado.", 401);
    const previousReading = data.previousReading === null || data.previousReading === undefined || data.previousReading === "" ? null : Number(data.previousReading);
    const currentReading = data.currentReading === null || data.currentReading === undefined || data.currentReading === "" ? null : Number(data.currentReading);
    const record = await operationalRecordRepository.createForCondominium(condominiumId, {
      recordDate: this.normalizeDate(data.recordDate),
      recordTime: String(data.recordTime).trim(),
      responsibleName: String(data.responsibleName).trim(),
      previousReading,
      currentReading,
      consumption: this.calculate(previousReading,currentReading,data.consumption),
      wellStatus: String(data.wellStatus ?? "Desligado").trim(),
      notes: data.notes ? String(data.notes).trim() : null,
      createdByUserId: user.id,
    });
    await AuditLogService.logCreate({ condominiumId, user, module:"OPERATIONAL_RECORD", referenceId:record.id, afterData:record, details:"Registro operacional COMPESA/Poço criado.", requestContext });
    return record;
  }

  async remove(id, condominiumId, user, requestContext=null) {
    const before = await operationalRecordRepository.findById(id, condominiumId);
    if (!before) throw new ApiError("Registro operacional não encontrado.",404);
    const ok = await operationalRecordRepository.softDelete(id, condominiumId);
    if (!ok) throw new ApiError("Não foi possível excluir o registro operacional.",409);
    await AuditLogService.logDelete({ condominiumId, user, module:"OPERATIONAL_RECORD", referenceId:id, beforeData:before, details:"Registro operacional removido.", requestContext });
    return true;
  }
}

export default new OperationalRecordService();
