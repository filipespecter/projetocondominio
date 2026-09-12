import prisma from "../config/prisma.js";
import residentRepository from "../repositories/ResidentRepository.js";
import serviceProviderRepository from "../repositories/ServiceProviderRepository.js";
import ServiceProviderService from "./ServiceProviderService.js";
import ProviderAccessService from "./ProviderAccessService.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";
import { ApiError } from "../utils/ApiError.js";

class PrivateServiceRequestService {
  include() {
    return {
      apartment: { select: { id: true, block: true, number: true } },
      resident: {
        select: {
          id: true,
          residentType: true,
          isPrimary: true,
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
      },
      requester: { select: { id: true, name: true, email: true, phone: true } },
      reviewedBy: { select: { id: true, name: true, role: true } },
      serviceProvider: { select: { id: true, name: true, companyName: true, document: true, phone: true, serviceType: true, status: true } },
      providerAccess: {
        include: {
          serviceProvider: true,
          apartment: { select: { id: true, block: true, number: true } },
        },
      },
    };
  }

  parseDate(value) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new ApiError("Data do serviço inválida.", 422);
    return date;
  }

  async getResident(user) {
    if (!user?.id || !user?.condominiumId || user.role !== "RESIDENT") {
      throw new ApiError("Apenas moradores podem criar solicitações de serviço particular.", 403);
    }
    const resident = await residentRepository.findByUserId(user.id, user.condominiumId);
    if (!resident) throw new ApiError("Perfil de morador não encontrado.", 404);
    return resident;
  }

  async findById(id, condominiumId) {
    const item = await prisma.privateServiceRequest.findFirst({
      where: { id, condominiumId, deletedAt: null },
      include: this.include(),
    });
    if (!item) throw new ApiError("Solicitação de serviço não encontrada.", 404);
    return item;
  }

  async list(user, filters = {}) {
    if (!user?.condominiumId) throw new ApiError("Condomínio não identificado.", 400);
    const where = { condominiumId: user.condominiumId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.apartmentId) where.apartmentId = filters.apartmentId;
    if (user.role === "RESIDENT") where.requesterUserId = user.id;
    else if (!["CONDOMINIUM_ADMIN", "MANAGER"].includes(user.role)) throw new ApiError("Você não possui acesso às solicitações de serviço.", 403);

    return prisma.privateServiceRequest.findMany({
      where,
      include: this.include(),
      orderBy: [{ status: "asc" }, { scheduledDate: "asc" }, { createdAt: "desc" }],
    });
  }

  async create(user, data, requestContext = null) {
    const resident = await this.getResident(user);
    const scheduledDate = this.parseDate(data.scheduledDate);
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (scheduledDate < today) throw new ApiError("A data do serviço não pode estar no passado.", 422);

    const request = await prisma.privateServiceRequest.create({
      data: {
        condominiumId: user.condominiumId,
        residentId: resident.id,
        apartmentId: resident.apartmentId,
        requesterUserId: user.id,
        providerName: data.providerName.trim(),
        providerDocument: data.providerDocument || null,
        providerPhone: data.providerPhone || null,
        providerCompany: data.providerCompany || null,
        serviceType: data.serviceType.trim(),
        description: data.description.trim(),
        scheduledDate,
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime || null,
        notes: data.notes || null,
      },
      include: this.include(),
    });

    const apartmentLabel = [resident.apartment?.block, resident.apartment?.number].filter(Boolean).join(" / ") || resident.apartment?.number || "apartamento";
    const notification = {
      title: "Nova solicitação de serviço em apartamento",
      message: `${user.name ?? "Morador"} informou ${data.providerName} para ${data.serviceType} no ${apartmentLabel}.`,
      type: "PRIVATE_SERVICE_REQUEST",
      origin: "RESIDENT",
      module: "PRIVATE_SERVICE",
      referenceId: request.id,
      apartmentLabel,
      priority: "NORMAL",
    };
    await Promise.allSettled([
      NotificationService.createForRole(user.condominiumId, "CONDOMINIUM_ADMIN", notification),
      NotificationService.createForRole(user.condominiumId, "MANAGER", notification),
    ]);

    await AuditLogService.logCreate({
      condominiumId: user.condominiumId,
      user,
      module: "PRIVATE_SERVICE",
      referenceId: request.id,
      afterData: {
        apartmentId: request.apartmentId,
        providerName: request.providerName,
        serviceType: request.serviceType,
        scheduledDate: request.scheduledDate,
        scheduledStartTime: request.scheduledStartTime,
        status: request.status,
      },
      details: "Morador enviou solicitação de serviço particular para análise da gestão.",
      requestContext,
    });

    return request;
  }

  async cancel(user, id, requestContext = null) {
    if (user.role !== "RESIDENT") throw new ApiError("Apenas o morador solicitante pode cancelar esta solicitação.", 403);
    const request = await this.findById(id, user.condominiumId);
    if (request.requesterUserId !== user.id) throw new ApiError("Você não pode cancelar solicitação de outro morador.", 403);
    if (request.status !== "PENDING") throw new ApiError("Somente solicitações pendentes podem ser canceladas pelo morador.", 409);

    const updated = await prisma.privateServiceRequest.update({
      where: { id },
      data: { status: "CANCELED", reviewedAt: new Date() },
      include: this.include(),
    });
    await AuditLogService.logUpdate({
      condominiumId: user.condominiumId,
      user,
      module: "PRIVATE_SERVICE",
      referenceId: id,
      beforeData: { status: request.status },
      afterData: { status: updated.status },
      details: "Morador cancelou solicitação de serviço particular.",
      requestContext,
    });
    return updated;
  }

  ensureManager(user) {
    if (!user?.condominiumId || !["CONDOMINIUM_ADMIN", "MANAGER"].includes(user.role)) {
      throw new ApiError("Apenas a gestão do condomínio pode analisar solicitações de serviço.", 403);
    }
  }

  async approve(user, id, data = {}, requestContext = null) {
    this.ensureManager(user);
    const request = await this.findById(id, user.condominiumId);
    if (request.status !== "PENDING") throw new ApiError("Esta solicitação já foi analisada.", 409);

    let provider;
    if (data.existingServiceProviderId) {
      provider = await serviceProviderRepository.findById(data.existingServiceProviderId, user.condominiumId);
      if (!provider) throw new ApiError("Prestador selecionado não pertence a este condomínio.", 404);
      if (provider.status !== "ACTIVE") throw new ApiError("O prestador selecionado não está ativo.", 409);
    } else {
      if (request.providerDocument) {
        const existingByDocument = await serviceProviderRepository.findByDocument(
          user.condominiumId,
          request.providerDocument
        );
        if (existingByDocument?.status === "ACTIVE") provider = existingByDocument;
      }

      if (!provider) provider = await ServiceProviderService.create(
        user.condominiumId,
        {
          name: request.providerName,
          companyName: request.providerCompany,
          document: request.providerDocument,
          phone: request.providerPhone,
          email: null,
          serviceType: request.serviceType,
          notes: `Criado a partir da solicitação do apartamento ${request.apartment?.number ?? ""}. ${request.notes ?? ""}`.trim(),
          status: "ACTIVE",
        },
        user,
        requestContext
      );
    }

    const access = await ProviderAccessService.create(
      user.condominiumId,
      {
        serviceProviderId: provider.id,
        apartmentId: request.apartmentId,
        serviceDescription: `${request.serviceType} — ${request.description}`,
        scheduledDate: request.scheduledDate.toISOString().slice(0, 10),
        scheduledStartTime: request.scheduledStartTime,
        scheduledEndTime: request.scheduledEndTime,
        notes: request.notes || `Solicitado por ${request.requester?.name ?? "morador"}.`,
      },
      user,
      requestContext
    );

    const updated = await prisma.privateServiceRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
        reviewNotes: data.reviewNotes || null,
        serviceProviderId: provider.id,
        providerAccessId: access.id,
      },
      include: this.include(),
    });

    await NotificationService.createForUser(user.condominiumId, request.requesterUserId, {
      title: "Serviço particular aprovado",
      message: `${request.providerName} foi autorizado para o apartamento ${request.apartment?.number ?? ""} em ${request.scheduledDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })} às ${request.scheduledStartTime}.`,
      type: "PRIVATE_SERVICE_APPROVED",
      origin: "MANAGER",
      module: "PRIVATE_SERVICE",
      referenceId: request.id,
      priority: "NORMAL",
    }).catch(() => null);

    await AuditLogService.logUpdate({
      condominiumId: user.condominiumId,
      user,
      module: "PRIVATE_SERVICE",
      referenceId: id,
      beforeData: { status: request.status },
      afterData: { status: updated.status, serviceProviderId: provider.id, providerAccessId: access.id },
      details: "Gestão aprovou solicitação particular e gerou acesso de prestador vinculado ao apartamento.",
      requestContext,
    });

    return updated;
  }

  async reject(user, id, data, requestContext = null) {
    this.ensureManager(user);
    const request = await this.findById(id, user.condominiumId);
    if (request.status !== "PENDING") throw new ApiError("Esta solicitação já foi analisada.", 409);

    const updated = await prisma.privateServiceRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
        reviewNotes: data.reviewNotes,
      },
      include: this.include(),
    });

    await NotificationService.createForUser(user.condominiumId, request.requesterUserId, {
      title: "Solicitação de serviço não aprovada",
      message: data.reviewNotes,
      type: "PRIVATE_SERVICE_REJECTED",
      origin: "MANAGER",
      module: "PRIVATE_SERVICE",
      referenceId: request.id,
      priority: "NORMAL",
    }).catch(() => null);

    await AuditLogService.logUpdate({
      condominiumId: user.condominiumId,
      user,
      module: "PRIVATE_SERVICE",
      referenceId: id,
      beforeData: { status: request.status },
      afterData: { status: updated.status, reviewNotes: updated.reviewNotes },
      details: "Gestão rejeitou solicitação de serviço particular.",
      requestContext,
    });
    return updated;
  }
}

export default new PrivateServiceRequestService();
