import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export async function subscriptionAccessMiddleware(
  req,
  res,
  next
) {
  try {
    if (!req.user) {
      return next(
        new ApiError(
          "Usuário não autenticado.",
          401
        )
      );
    }

    if (
      req.user.role ===
      "PLATFORM_ADMIN"
    ) {
      return next();
    }

    const condominiumId =
      req.user
        .condominiumId ??
      req.condominiumId ??
      null;

    if (!condominiumId) {
      return next(
        new ApiError(
          "Condomínio não identificado.",
          403
        )
      );
    }

    const condominium =
      await prisma
        .condominium
        .findFirst({
          where: {
            id:
              condominiumId,
            deletedAt:
              null,
          },
          select: {
            id: true,
            status: true,
            subscriptions: {
              where: {
                status: {
                  in: [
                    "TRIAL",
                    "ACTIVE",
                    "OVERDUE",
                    "SUSPENDED",
                  ],
                },
              },
              orderBy: {
                createdAt:
                  "desc",
              },
              take: 1,
              select: {
                id: true,
                status: true,
                gracePeriodDays:
                  true,
                nextDueDate:
                  true,
                suspendedAt:
                  true,
              },
            },
          },
        });

    if (!condominium) {
      return next(
        new ApiError(
          "Condomínio não encontrado.",
          403
        )
      );
    }

    if (
      [
        "SUSPENDED",
        "CANCELED",
        "REJECTED",
        "PENDING",
      ].includes(
        condominium.status
      )
    ) {
      return next(
        new ApiError(
          condominium.status ===
          "SUSPENDED"
            ? "Acesso suspenso. Regularize a situação financeira para continuar utilizando o InfinityCondo."
            : "Este condomínio não possui acesso operacional liberado.",
          403
        )
      );
    }

    const subscription =
      condominium
        .subscriptions?.[0] ??
      null;

    if (!subscription) {
      return next(
        new ApiError(
          "Nenhuma assinatura válida foi encontrada para este condomínio.",
          403
        )
      );
    }

    if (
      subscription.status ===
      "SUSPENDED"
    ) {
      return next(
        new ApiError(
          "Assinatura suspensa por inadimplência.",
          403
        )
      );
    }

    req.subscriptionContext = {
      id:
        subscription.id,
      status:
        subscription.status,
      gracePeriodDays:
        subscription
          .gracePeriodDays,
      nextDueDate:
        subscription
          .nextDueDate,
      suspendedAt:
        subscription
          .suspendedAt,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

export default subscriptionAccessMiddleware;
