import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";
import CommunicationTriggerService from "./CommunicationTriggerService.js";

import noticeRepository from "../repositories/NoticeRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";

import { ApiError } from "../utils/ApiError.js";
import { removeStoredFile, saveFileDataUrl, sanitizeFileName, storedFileAsDataUrl } from "../utils/fileStorage.js";

class NoticeService extends BaseService {
  constructor() {
    super(noticeRepository);
  }

  /**
   * Status permitidos pelo schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "DRAFT",
      "PUBLISHED",
      "ARCHIVED",
    ];

    const normalizedStatus =
      String(status ?? "")
        .trim()
        .toUpperCase();

    if (
      !allowedStatuses.includes(
        normalizedStatus
      )
    ) {
      throw new ApiError(
        "Status de aviso inválido.",
        400
      );
    }

    return normalizedStatus;
  }

  /**
   * Públicos permitidos pelo schema.
   */
  validateAudience(audience) {
    const allowedAudiences = [
      "ALL",
      "RESIDENTS",
      "DOORMEN",
      "MANAGERS",
      "APARTMENT",
    ];

    const normalizedAudience =
      String(audience ?? "")
        .trim()
        .toUpperCase();

    if (
      !allowedAudiences.includes(
        normalizedAudience
      )
    ) {
      throw new ApiError(
        "Público do aviso inválido.",
        400
      );
    }

    return normalizedAudience;
  }

  /**
   * Prioridades permitidas pelo schema.
   */
  validatePriority(priority) {
    const allowedPriorities = [
      "LOW",
      "NORMAL",
      "HIGH",
      "URGENT",
    ];

    const normalizedPriority =
      String(priority ?? "")
        .trim()
        .toUpperCase();

    if (
      !allowedPriorities.includes(
        normalizedPriority
      )
    ) {
      throw new ApiError(
        "Prioridade do aviso inválida.",
        400
      );
    }

    return normalizedPriority;
  }

  /**
   * Normaliza uma data opcional.
   */
  normalizeOptionalDate(value, fieldName) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const date =
      value instanceof Date
        ? new Date(value)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(
        `${fieldName} inválida.`,
        400
      );
    }

    return date;
  }

  normalizeOptionalText(value) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    return String(value).trim();
  }

  validateType(type) {
    const normalized = String(type ?? "NOTICE").trim().toUpperCase();
    if (!["NOTICE", "ASSEMBLY"].includes(normalized)) {
      throw new ApiError("Tipo de aviso inválido.", 400);
    }
    return normalized;
  }

  normalizeEventDate(value) {
    if (value === undefined || value === null || value === "") return null;
    const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new ApiError("Data da assembleia inválida.", 422);
    }
    return date;
  }

  validateAssemblyData(data) {
    if (this.validateType(data?.type) !== "ASSEMBLY") return;

    const required = [
      [data.agenda, "A pauta é obrigatória para assembleias."],
      [data.eventDate, "A data é obrigatória para assembleias."],
      [data.eventTime, "O horário é obrigatório para assembleias."],
      [data.eventLocation, "O local é obrigatório para assembleias."],
    ];

    for (const [value, message] of required) {
      if (!value || String(value).trim() === "") {
        throw new ApiError(message, 422);
      }
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(data.eventTime))) {
      throw new ApiError("O horário da assembleia é inválido.", 422);
    }

    this.normalizeEventDate(data.eventDate);
  }

  async saveAttachments(files = []) {
    const saved = [];
    try {
      for (const file of files) {
        const storage = await saveFileDataUrl(file.dataUrl, "notice-attachments", {
          maxBytes: 1536 * 1024,
        });
        saved.push({
          fileName: sanitizeFileName(file.fileName),
          filePath: storage.filePath,
          mimeType: storage.mimeType,
          fileSize: storage.fileSize,
        });
      }
      return saved;
    } catch (error) {
      await Promise.allSettled(saved.map((item) => removeStoredFile(item.filePath)));
      throw error;
    }
  }

  async removeAttachments(attachments) {
    if (!Array.isArray(attachments)) return;
    await Promise.allSettled(
      attachments
        .filter((item) => item?.filePath)
        .map((item) => removeStoredFile(item.filePath))
    );
  }

  /**
   * Valida os dados obrigatórios.
   */
  validateNoticeData(data) {
    if (!data?.title) {
      throw new ApiError(
        "O título do aviso é obrigatório.",
        400
      );
    }

    if (!data?.message) {
      throw new ApiError(
        "A mensagem do aviso é obrigatória.",
        400
      );
    }

    if (data.status) {
      this.validateStatus(data.status);
    }

    if (data.audience) {
      this.validateAudience(data.audience);
    }

    if (data.priority) {
      this.validatePriority(data.priority);
    }
  }

  /**
   * Confere se um apartamento existe e pertence
   * ao condomínio.
   */
  async validateApartment(
    apartmentId,
    condominiumId
  ) {
    if (!apartmentId) {
      throw new ApiError(
        "O apartamento é obrigatório para este público.",
        400
      );
    }

    const apartment =
      await apartmentRepository.findById(
        apartmentId,
        condominiumId
      );

    if (!apartment) {
      throw new ApiError(
        "Apartamento não encontrado.",
        404
      );
    }

    if (apartment.status === "INACTIVE") {
      throw new ApiError(
        "Não é possível direcionar um aviso a um apartamento inativo.",
        400
      );
    }

    return apartment;
  }

  /**
   * Busca um aviso pelo ID.
   */
  async findById(id, condominiumId) {
    const notice =
      await noticeRepository.findById(
        id,
        condominiumId
      );

    if (!notice) {
      throw new ApiError(
        "Aviso não encontrado.",
        404
      );
    }

    return notice;
  }

  /**
   * Lista todos os avisos do condomínio.
   */
  async findAll(condominiumId, filters = {}) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return noticeRepository
      .findByCondominium(
        condominiumId,
        filters
      );
  }

  /**
   * Lista avisos publicados.
   */
  async findPublished(condominiumId, filters = {}) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return noticeRepository.findPublished(
      condominiumId,
      filters
    );
  }

  /**
   * Lista avisos por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    const normalizedStatus =
      this.validateStatus(status);

    return noticeRepository.findByStatus(
      condominiumId,
      normalizedStatus
    );
  }

  /**
   * Lista avisos por público.
   */
  async findByAudience(
    condominiumId,
    audience
  ) {
    const normalizedAudience =
      this.validateAudience(audience);

    return noticeRepository.findByAudience(
      condominiumId,
      normalizedAudience
    );
  }

  /**
   * Envia as notificações correspondentes
   * ao público do aviso.
   */
  async findByCategory(condominiumId, category) {
    if (!condominiumId) throw new ApiError("Condomínio não identificado.", 400);
    const value = String(category ?? "").trim();
    if (!value) throw new ApiError("A categoria é obrigatória.", 400);
    return noticeRepository.findByCategory(condominiumId, value);
  }

  async findByApartment(apartmentId, condominiumId) {
    if (!condominiumId) throw new ApiError("Condomínio não identificado.", 400);
    if (!apartmentId) throw new ApiError("Apartamento não identificado.", 400);
    return noticeRepository.findByApartment(apartmentId, condominiumId);
  }

  async notifyAudience(notice) {
    await CommunicationTriggerService
      .notifyNotice({
        notice,
      });

    const notificationData = {
      title: notice.title,
      message: notice.message,
      type: notice.type === "ASSEMBLY" ? "ASSEMBLY" : "NOTICE",
      origin: "MANAGER",
      module: "NOTICE",
      referenceId: notice.id,
      priority: notice.priority,
    };

    switch (notice.audience) {
      case "RESIDENTS":
        return NotificationService
          .createForActiveRoleUsers(
            notice.condominiumId,
            "RESIDENT",
            notificationData
          );

      case "DOORMEN":
        return NotificationService
          .createForActiveRoleUsers(
            notice.condominiumId,
            "DOORMAN",
            notificationData
          );

      case "MANAGERS": {
        const managerResult =
          await NotificationService
            .createForActiveRoleUsers(
              notice.condominiumId,
              "MANAGER",
              notificationData
            );

        const adminResult =
          await NotificationService
            .createForActiveRoleUsers(
              notice.condominiumId,
              "CONDOMINIUM_ADMIN",
              notificationData
            );

        return {
          count:
            managerResult.count +
            adminResult.count,
        };
      }

      case "APARTMENT": {
        if (!notice.apartmentId) {
          throw new ApiError(
            "O aviso direcionado precisa possuir um apartamento.",
            400
          );
        }

        const residents =
          await residentRepository
            .findByApartment(
              notice.apartmentId,
              notice.condominiumId
            );

        const recipientUserIds =
          residents
            .filter(
              (resident) =>
                resident.user &&
                resident.user.status ===
                  "ACTIVE"
            )
            .map(
              (resident) =>
                resident.userId
            );

        return NotificationService
          .createForUsers(
            notice.condominiumId,
            recipientUserIds,
            {
              ...notificationData,

              apartmentLabel:
                notice.apartment
                  ? `${notice.apartment.block} - ${notice.apartment.number}`
                  : null,
            }
          );
      }

      case "ALL": {
        const roles = [
          "CONDOMINIUM_ADMIN",
          "MANAGER",
          "DOORMAN",
          "RESIDENT",
        ];

        const results =
          await Promise.all(
            roles.map((role) =>
              NotificationService
                .createForActiveRoleUsers(
                  notice.condominiumId,
                  role,
                  notificationData
                )
            )
          );

        return {
          count: results.reduce(
            (total, result) =>
              total + result.count,
            0
          ),
        };
      }

      default:
        throw new ApiError(
          "Público do aviso inválido.",
          400
        );
    }
  }

  /**
   * Cria um aviso.
   */
  async create(
    condominiumId,
    authenticatedUser,
    data,
    requestContext = null
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Autor do aviso não identificado.",
        401
      );
    }

    this.validateNoticeData(data);

    const type = this.validateType(data.type ?? "NOTICE");
    this.validateAssemblyData({ ...data, type });

    const status =
      data.status
        ? this.validateStatus(
            data.status
          )
        : "PUBLISHED";

    const audience =
      data.audience
        ? this.validateAudience(
            data.audience
          )
        : "ALL";

    const priority =
      data.priority
        ? this.validatePriority(
            data.priority
          )
        : "NORMAL";

    let apartmentId = null;

    if (audience === "APARTMENT") {
      const apartment =
        await this.validateApartment(
          data.apartmentId,
          condominiumId
        );

      apartmentId = apartment.id;
    } else if (data.apartmentId) {
      throw new ApiError(
        "O apartamento somente deve ser informado quando o público for APARTMENT.",
        400
      );
    }

    const expiresAt =
      this.normalizeOptionalDate(
        data.expiresAt,
        "Data de expiração"
      );

    if (
      expiresAt &&
      expiresAt <= new Date()
    ) {
      throw new ApiError(
        "A data de expiração deve ser futura.",
        400
      );
    }

    const attachmentFiles = data.attachmentFiles ?? [];
    const attachments = await this.saveAttachments(attachmentFiles);

    let notice;
    try {
      notice = await noticeRepository.createForCondominium(
        condominiumId,
        authenticatedUser.id,
        {
          apartmentId,
          title: String(data.title).trim(),
          message: String(data.message).trim(),
          category: this.normalizeOptionalText(data.category),
          type,
          agenda: this.normalizeOptionalText(data.agenda),
          eventDate: this.normalizeEventDate(data.eventDate),
          eventTime: this.normalizeOptionalText(data.eventTime),
          eventLocation: this.normalizeOptionalText(data.eventLocation),
          eventModality: this.normalizeOptionalText(data.eventModality),
          attachments: attachments.length ? attachments : null,
          priority,
          audience,
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
          expiresAt,
        }
      );
    } catch (error) {
      await this.removeAttachments(attachments);
      throw error;
    }

    if (notice.status === "PUBLISHED") {
      await this.notifyAudience(notice);
    }

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: notice.type === "ASSEMBLY" ? "ASSEMBLY" : "NOTICE",
      referenceId: notice.id,
      afterData: notice,
      details:
        notice.type === "ASSEMBLY"
          ? (notice.status === "PUBLISHED" ? "Assembleia criada e publicada." : "Rascunho de assembleia criado.")
          : (notice.status === "PUBLISHED" ? "Aviso criado e publicado." : "Rascunho de aviso criado."),
      requestContext,
    });

    return notice;
  }

  /**
   * Atualiza os dados de um aviso.
   *
   * Alterações de status devem utilizar os métodos
   * publish, moveToDraft ou archive.
   */
  async update(
    id,
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status === "ARCHIVED") {
      throw new ApiError(
        "Avisos arquivados não podem ser editados.",
        409
      );
    }

    const targetType = this.validateType(data.type ?? before.type ?? "NOTICE");
    const mergedForValidation = { ...before, ...data, type: targetType };
    this.validateAssemblyData(mergedForValidation);

    let replacementAttachments = null;

    const updateData = {
      ...data,
      type: targetType,
    };

    delete updateData.attachmentFiles;

    if (data.eventDate !== undefined) {
      updateData.eventDate = this.normalizeEventDate(data.eventDate);
    }

    for (const key of ["agenda", "eventTime", "eventLocation", "eventModality"]) {
      if (data[key] !== undefined) updateData[key] = this.normalizeOptionalText(data[key]);
    }

    if (data.title !== undefined) {
      if (!data.title) {
        throw new ApiError(
          "O título do aviso é obrigatório.",
          400
        );
      }

      updateData.title =
        String(data.title).trim();
    }

    if (data.message !== undefined) {
      if (!data.message) {
        throw new ApiError(
          "A mensagem do aviso é obrigatória.",
          400
        );
      }

      updateData.message =
        String(data.message).trim();
    }

    if (data.category !== undefined) {
      updateData.category =
        this.normalizeOptionalText(
          data.category
        );
    }

    if (data.priority !== undefined) {
      updateData.priority =
        this.validatePriority(
          data.priority
        );
    }

    let targetAudience =
      data.audience !== undefined
        ? this.validateAudience(
            data.audience
          )
        : before.audience;

    if (data.audience !== undefined) {
      updateData.audience =
        targetAudience;
    }

    if (targetAudience === "APARTMENT") {
      const apartmentId =
        data.apartmentId ??
        before.apartmentId;

      const apartment =
        await this.validateApartment(
          apartmentId,
          condominiumId
        );

      updateData.apartmentId =
        apartment.id;
    } else {
      updateData.apartmentId = null;
    }

    if (data.expiresAt !== undefined) {
      updateData.expiresAt =
        this.normalizeOptionalDate(
          data.expiresAt,
          "Data de expiração"
        );

      if (
        updateData.expiresAt &&
        updateData.expiresAt <=
          new Date()
      ) {
        throw new ApiError(
          "A data de expiração deve ser futura.",
          400
        );
      }
    }

    if (data.attachmentFiles !== undefined) {
      replacementAttachments = await this.saveAttachments(data.attachmentFiles ?? []);
      updateData.attachments = replacementAttachments.length ? replacementAttachments : null;
    }

    delete updateData.status;
    delete updateData.publishedAt;
    delete updateData.authorUserId;
    delete updateData.condominiumId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;
    delete updateData.author;
    delete updateData.apartment;

    let updated;
    try {
      updated = await noticeRepository.updateById(
        id,
        condominiumId,
        updateData
      );

      if (!updated) {
        throw new ApiError("Aviso não encontrado.", 404);
      }
    } catch (error) {
      if (replacementAttachments !== null) {
        await this.removeAttachments(replacementAttachments);
      }
      throw error;
    }

    if (replacementAttachments !== null) {
      await this.removeAttachments(before.attachments);
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: updated.type === "ASSEMBLY" ? "ASSEMBLY" : "NOTICE",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details: updated.type === "ASSEMBLY" ? "Assembleia atualizada." : "Aviso atualizado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Publica um aviso em rascunho.
   */
  async publish(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "DRAFT") {
      throw new ApiError(
        "Somente avisos em rascunho podem ser publicados.",
        409
      );
    }

    if (
      before.expiresAt &&
      new Date(before.expiresAt) <=
        new Date()
    ) {
      throw new ApiError(
        "Não é possível publicar um aviso expirado.",
        409
      );
    }

    if (
      before.audience ===
        "APARTMENT" &&
      !before.apartmentId
    ) {
      throw new ApiError(
        "O aviso precisa estar vinculado a um apartamento.",
        400
      );
    }

    this.validateAssemblyData(before);

    const notice =
      await noticeRepository.publish(
        id,
        condominiumId
      );

    if (!notice) {
      throw new ApiError(
        "Aviso não encontrado.",
        404
      );
    }

    await this.notifyAudience(notice);

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: notice.type === "ASSEMBLY" ? "ASSEMBLY" : "NOTICE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          notice.status,
        details:
          notice.type === "ASSEMBLY" ? "Assembleia publicada." : "Aviso publicado.",
        requestContext,
      });

    return notice;
  }

  /**
   * Retorna um aviso publicado para rascunho.
   *
   * Nenhuma nova notificação será enviada até que
   * ele seja publicado novamente.
   */
  async moveToDraft(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "PUBLISHED") {
      throw new ApiError(
        "Somente avisos publicados podem voltar para rascunho.",
        409
      );
    }

    const notice =
      await noticeRepository.moveToDraft(
        id,
        condominiumId
      );

    if (!notice) {
      throw new ApiError(
        "Aviso não encontrado.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "NOTICE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          notice.status,
        details:
          "Aviso movido para rascunho.",
        requestContext,
      });

    return notice;
  }

  /**
   * Arquiva um aviso.
   */
  async archive(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status === "ARCHIVED") {
      throw new ApiError(
        "O aviso já está arquivado.",
        409
      );
    }

    const notice =
      await noticeRepository.archive(
        id,
        condominiumId
      );

    if (!notice) {
      throw new ApiError(
        "Aviso não encontrado.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "NOTICE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          notice.status,
        details:
          "Aviso arquivado.",
        requestContext,
      });

    return notice;
  }

  /**
   * Exclusão lógica.
   */
  async remove(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    const deleted =
      await noticeRepository.softDelete(
        id,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover o aviso.",
        400
      );
    }

    await this.removeAttachments(before.attachments);

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "NOTICE",
      referenceId: id,
      beforeData: before,
      details:
        "Aviso removido logicamente.",
      requestContext,
    });

    return {
      message:
        "Aviso removido com sucesso.",
    };
  }

  /**
   * Estatísticas para dashboard e BI.
   */
  async statistics(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    const [
      total,
      published,
      draft,
      archived,
    ] = await Promise.all([
      noticeRepository
        .countByCondominium(
          condominiumId
        ),

      noticeRepository.countPublished(
        condominiumId
      ),

      noticeRepository.countByStatus(
        condominiumId,
        "DRAFT"
      ),

      noticeRepository.countByStatus(
        condominiumId,
        "ARCHIVED"
      ),
    ]);

    return {
      total,
      published,
      draft,
      archived,
    };
  }
  /**
   * Resolve a unidade do morador autenticado e devolve
   * somente avisos publicados destinados a ele.
   */
  async findVisibleForUser(
    condominiumId,
    authenticatedUser,
    filters = {}
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }

    if (
      [
        "CONDOMINIUM_ADMIN",
        "MANAGER",
      ].includes(
        authenticatedUser.role
      )
    ) {
      return this.findAll(
        condominiumId
      );
    }

    let apartmentId = null;

    if (
      authenticatedUser.role ===
      "RESIDENT"
    ) {
      const resident =
        await residentRepository
          .findByUserId(
            authenticatedUser.id,
            condominiumId
          );

      if (!resident) {
        throw new ApiError(
          "Perfil de morador não encontrado.",
          404
        );
      }

      apartmentId =
        resident.apartmentId;
    }

    return noticeRepository
      .findVisibleForUser({
        condominiumId,
        role:
          authenticatedUser.role,
        apartmentId,
        type: filters.type ?? null,
      });
  }

  async findVisibleById(
    id,
    condominiumId,
    authenticatedUser
  ) {
    if (
      [
        "CONDOMINIUM_ADMIN",
        "MANAGER",
      ].includes(
        authenticatedUser?.role
      )
    ) {
      return this.findById(
        id,
        condominiumId
      );
    }

    let apartmentId = null;

    if (
      authenticatedUser?.role ===
      "RESIDENT"
    ) {
      const resident =
        await residentRepository
          .findByUserId(
            authenticatedUser.id,
            condominiumId
          );

      if (!resident) {
        throw new ApiError(
          "Perfil de morador não encontrado.",
          404
        );
      }

      apartmentId =
        resident.apartmentId;
    }

    const notice =
      await noticeRepository
        .findVisibleById({
          id,
          condominiumId,
          role:
            authenticatedUser?.role,
          apartmentId,
        });

    if (!notice) {
      throw new ApiError(
        "Aviso não encontrado ou indisponível para este usuário.",
        404
      );
    }

    return notice;
  }

  async downloadAttachment(id, index, condominiumId, authenticatedUser) {
    const notice = await this.findVisibleById(id, condominiumId, authenticatedUser);
    const attachments = Array.isArray(notice.attachments) ? notice.attachments : [];
    const attachment = attachments[Number(index)];

    if (!attachment?.filePath) {
      throw new ApiError("Anexo não encontrado.", 404);
    }

    const dataUrl = await storedFileAsDataUrl(attachment.filePath, attachment.mimeType);
    if (!dataUrl) {
      throw new ApiError("Arquivo do anexo não foi encontrado no armazenamento.", 404);
    }

    return {
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      dataUrl,
    };
  }

}

export default new NoticeService();