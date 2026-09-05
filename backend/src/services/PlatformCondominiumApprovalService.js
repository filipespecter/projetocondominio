import Password from "../utils/Password.js";
import { ApiError } from "../utils/ApiError.js";
import planRepository from "../repositories/PlanRepository.js";
import condominiumRepository from "../repositories/CondominiumRepository.js";
import PlatformApprovalRepository from "../repositories/PlatformApprovalRepository.js";

/**
 * =====================================================
 * PLATFORM CONDOMINIUM APPROVAL SERVICE
 * =====================================================
 *
 * Regra comercial de aprovação da Star Infinity Code.
 */
class PlatformCondominiumApprovalService {
  normalizeUsername(value) {
    const username =
      String(value ?? "")
        .trim()
        .toLowerCase();

    if (
      username.length < 3 ||
      username.length > 50
    ) {
      throw new ApiError(
        "O nome de usuário deve possuir entre 3 e 50 caracteres.",
        400
      );
    }

    if (
      !/^[a-z0-9._-]+$/.test(
        username
      )
    ) {
      throw new ApiError(
        "O nome de usuário pode conter apenas letras, números, ponto, hífen e underline.",
        400
      );
    }

    return username;
  }

  normalizeEmail(value) {
    if (!value) {
      return null;
    }

    return String(value)
      .trim()
      .toLowerCase();
  }

  normalizePhone(value) {
    if (!value) {
      return null;
    }

    const normalized =
      String(value).replace(
        /\D/g,
        ""
      );

    return normalized || null;
  }

  normalizePrice(value) {
    const price =
      Number(value);

    if (
      !Number.isInteger(price) ||
      price < 0
    ) {
      throw new ApiError(
        "O valor mensal deve ser informado em centavos e não pode ser negativo.",
        400
      );
    }

    return price;
  }

  normalizeDueDay(value) {
    const dueDay =
      Number(value);

    if (
      !Number.isInteger(
        dueDay
      ) ||
      dueDay < 1 ||
      dueDay > 31
    ) {
      throw new ApiError(
        "O dia do vencimento deve estar entre 1 e 31.",
        400
      );
    }

    return dueDay;
  }

  normalizeGracePeriod(value) {
    const days = value === undefined || value === null || value === "" ? 5 : Number(value);

    if (!Number.isInteger(days) || days < 0 || days > 30) {
      throw new ApiError(
        "A tolerância após o vencimento deve estar entre 0 e 30 dias.",
        400
      );
    }

    return days;
  }

  lastDayOfMonth(
    year,
    month
  ) {
    return new Date(
      year,
      month + 1,
      0
    ).getDate();
  }

  dateWithDueDay(
    year,
    month,
    dueDay
  ) {
    const safeDay =
      Math.min(
        dueDay,
        this.lastDayOfMonth(
          year,
          month
        )
      );

    const date =
      new Date(
        year,
        month,
        safeDay,
        23,
        59,
        59,
        999
      );

    return date;
  }

  /**
   * Calcula o próximo vencimento.
   *
   * Se o dia deste mês já passou, usa o próximo mês.
   */
  calculateNextDueDate(
    referenceDate,
    dueDay
  ) {
    const now =
      new Date(referenceDate);

    let year =
      now.getFullYear();

    let month =
      now.getMonth();

    let candidate =
      this.dateWithDueDay(
        year,
        month,
        dueDay
      );

    if (
      candidate <= now
    ) {
      month += 1;

      if (month > 11) {
        month = 0;
        year += 1;
      }

      candidate =
        this.dateWithDueDay(
          year,
          month,
          dueDay
        );
    }

    return candidate;
  }

  addBillingCycle(date, billingCycle) {
    const months = {
      MONTHLY: 1,
      QUARTERLY: 3,
      SEMIANNUAL: 6,
      ANNUAL: 12,
    };

    const amount = months[billingCycle];

    if (!amount) {
      throw new ApiError("Ciclo de cobrança inválido.", 400);
    }

    const source = new Date(date);
    const sourceDay = source.getDate();
    const target = new Date(source);
    target.setDate(1);
    target.setMonth(target.getMonth() + amount);
    target.setDate(Math.min(sourceDay, this.lastDayOfMonth(target.getFullYear(), target.getMonth())));

    return target;
  }

  async approve(
    condominiumId,
    data,
    platformAdmin,
    requestContext = null
  ) {
    if (
      !platformAdmin?.id ||
      ![
        "PLATFORM_OWNER",
        "PLATFORM_ADMIN",
      ].includes(
        platformAdmin.role
      )
    ) {
      throw new ApiError(
        "Administrador da plataforma não identificado.",
        403
      );
    }

    const condominium =
      await condominiumRepository
        .findById(
          condominiumId
        );

    if (!condominium) {
      throw new ApiError(
        "Condomínio não encontrado.",
        404
      );
    }

    if (
      condominium.status !==
      "PENDING"
    ) {
      throw new ApiError(
        "Somente solicitações PENDING podem ser aprovadas.",
        409
      );
    }

    const plan =
      await planRepository.findById(
        data.planId
      );

    if (
      !plan ||
      !plan.active ||
      plan.deletedAt
    ) {
      throw new ApiError(
        "Plano não encontrado ou indisponível.",
        400
      );
    }

    const username =
      this.normalizeUsername(
        data.username
      );

    if (
      !data.password ||
      String(
        data.password
      ).length < 8
    ) {
      throw new ApiError(
        "A senha temporária deve possuir pelo menos 8 caracteres.",
        400
      );
    }

    if (
      data.password !==
      data.passwordConfirmation
    ) {
      throw new ApiError(
        "A confirmação da senha não corresponde.",
        400
      );
    }

    const priceInCents =
      this.normalizePrice(
        data.priceInCents ??
        plan.monthlyPriceInCents
      );

    const billingCycle =
      data.billingCycle ??
      plan.billingCycle;

    const approvedAt = new Date();
    const currentPeriodStart = approvedAt;
    const dueDay = approvedAt.getDate();
    const nextDueDate = this.addBillingCycle(approvedAt, billingCycle);
    const currentPeriodEnd = nextDueDate;
    const gracePeriodDays = this.normalizeGracePeriod(data.gracePeriodDays);

    const initialStatus =
      data.initialStatus ===
      "TRIAL"
        ? "TRIAL"
        : "ACTIVE";

    const trialEndsAt =
      initialStatus ===
      "TRIAL"
        ? (
            data.trialEndsAt
              ? new Date(
                  data.trialEndsAt
                )
              : nextDueDate
          )
        : null;

    if (
      trialEndsAt &&
      Number.isNaN(
        trialEndsAt.getTime()
      )
    ) {
      throw new ApiError(
        "Data final do período de teste inválida.",
        400
      );
    }

    const adminName =
      String(
        data.adminName ??
        condominium.contactName ??
        condominium.name
      ).trim();

    const adminEmail =
      this.normalizeEmail(
        data.adminEmail ??
        condominium.email
      );

    const adminPhone =
      this.normalizePhone(
        data.adminPhone ??
        condominium.phone
      );

    const billingContactName =
      String(
        data.billingContactName ??
        condominium.contactName ??
        adminName
      ).trim();

    const billingEmail =
      this.normalizeEmail(
        data.billingEmail ??
        condominium.email ??
        adminEmail
      );

    const billingPhone =
      this.normalizePhone(
        data.billingPhone ??
        condominium.phone ??
        adminPhone
      );

    if (!billingEmail) {
      throw new ApiError(
        "O e-mail financeiro é obrigatório para aprovação.",
        400
      );
    }

    if (!billingPhone) {
      throw new ApiError(
        "O WhatsApp financeiro é obrigatório para aprovação.",
        400
      );
    }

    const passwordHash =
      await Password.hash(
        String(
          data.password
        )
      );

    return PlatformApprovalRepository
      .approve({
        condominiumId:
          condominium.id,

        platformAdminUserId:
          platformAdmin.id,

        platformAdminName:
          platformAdmin.name ??
          "PLATFORM_ADMIN",

        username,
        passwordHash,

        adminName,
        adminEmail,
        adminPhone,

        planId:
          plan.id,

        subscriptionStatus:
          initialStatus,

        condominiumStatus:
          initialStatus,

        billingCycle,
        priceInCents,

        billingContactName,
        billingEmail,
        billingPhone,

        dueDay,

        gracePeriodDays,

        currentPeriodStart,
        currentPeriodEnd,
        nextDueDate,
        trialEndsAt,
        approvedAt,

        requestId:
          requestContext?.requestId ??
          null,

        ipAddress:
          requestContext?.ipAddress ??
          null,

        userAgent:
          requestContext?.userAgent ??
          null,
      });
  }

  async reject(
    condominiumId,
    data,
    platformAdmin,
    requestContext = null
  ) {
    if (
      !platformAdmin?.id ||
      ![
        "PLATFORM_OWNER",
        "PLATFORM_ADMIN",
      ].includes(
        platformAdmin.role
      )
    ) {
      throw new ApiError(
        "Administrador da plataforma não identificado.",
        403
      );
    }

    const reason =
      String(
        data?.rejectionReason ??
        ""
      ).trim();

    if (
      reason.length < 5
    ) {
      throw new ApiError(
        "Informe o motivo da rejeição com pelo menos 5 caracteres.",
        400
      );
    }

    return PlatformApprovalRepository
      .reject({
        condominiumId,

        platformAdminUserId:
          platformAdmin.id,

        platformAdminName:
          platformAdmin.name ??
          "PLATFORM_ADMIN",

        rejectionReason:
          reason,

        rejectedAt:
          new Date(),

        requestId:
          requestContext?.requestId ??
          null,

        ipAddress:
          requestContext?.ipAddress ??
          null,

        userAgent:
          requestContext?.userAgent ??
          null,
      });
  }
}

export default new PlatformCondominiumApprovalService();
