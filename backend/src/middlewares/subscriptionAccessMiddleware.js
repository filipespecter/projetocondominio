import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

function isSchemaDriftError(error) {
  return ["P2021", "P2022"].includes(error?.code);
}

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
      [
        "PLATFORM_OWNER",
        "PLATFORM_ADMIN",
        "PLATFORM_SUPPORT",
      ].includes(req.user.role)
    ) {
      return next();
    }

    const condominiumId =
      req.user.condominiumId ??
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

    // Consulta deliberadamente mínima. Este middleware roda antes de todos os
    // módulos operacionais; portanto ele não deve depender de colunas auxiliares
    // de cobrança para liberar telas como apartamentos, moradores e documentos.
    const condominium =
      await prisma.condominium.findFirst({
        where: {
          id: condominiumId,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
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
      ].includes(condominium.status)
    ) {
      return next(
        new ApiError(
          condominium.status === "SUSPENDED"
            ? "Acesso suspenso. Regularize a situação financeira para continuar utilizando o InfinityCondo."
            : "Este condomínio não possui acesso operacional liberado.",
          403
        )
      );
    }

    const subscription =
      await prisma.subscription.findFirst({
        where: {
          condominiumId,
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
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!subscription) {
      return next(
        new ApiError(
          "Nenhuma assinatura válida foi encontrada para este condomínio.",
          403
        )
      );
    }

    if (subscription.status === "SUSPENDED") {
      return next(
        new ApiError(
          "Assinatura suspensa por inadimplência.",
          403
        )
      );
    }

    req.subscriptionContext = {
      id: subscription.id,
      status: subscription.status,
    };

    return next();
  } catch (error) {
    if (isSchemaDriftError(error)) {
      return next(
        new ApiError(
          "A estrutura do banco de dados precisa ser sincronizada antes de liberar os módulos operacionais.",
          503,
          {
            code: "DATABASE_SCHEMA_OUT_OF_SYNC",
            prismaCode: error.code,
          }
        )
      );
    }

    return next(error);
  }
}

export default subscriptionAccessMiddleware;
