import crypto from "node:crypto";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * ONBOARDING SERVICE
 * =====================================================
 *
 * Responsável pelo cadastro público inicial de uma
 * solicitação de condomínio no InfinityCondo.
 *
 * REGRA DE NEGÓCIO:
 *
 * 1. O cliente informa os dados do condomínio e do
 *    responsável pelo contato;
 * 2. O condomínio é criado com status PENDING;
 * 3. Nenhum usuário é criado neste momento;
 * 4. Nenhuma senha é definida no onboarding público;
 * 5. O acesso somente poderá ser liberado posteriormente
 *    pelo PLATFORM_ADMIN da Star Infinity Code;
 * 6. A solicitação é registrada em auditoria.
 *
 * A criação do condomínio e da auditoria acontece dentro
 * de uma única transação Prisma. Se algo falhar, nenhuma
 * informação parcial permanece cadastrada.
 */
class OnboardingService {
  normalizeOptionalText(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    return String(value).trim();
  }

  normalizeEmail(email) {
    if (!email) {
      return null;
    }

    return String(email)
      .trim()
      .toLowerCase();
  }

  normalizeDocument(document) {
    if (!document) {
      return null;
    }

    const normalized =
      String(document).replace(/\D/g, "");

    return normalized || null;
  }

  normalizePhone(phone) {
    if (!phone) {
      return null;
    }

    const normalized =
      String(phone).replace(/\D/g, "");

    return normalized || null;
  }

  normalizePostalCode(postalCode) {
    if (!postalCode) {
      return null;
    }

    const normalized =
      String(postalCode).replace(/\D/g, "");

    return normalized || null;
  }

  generateCondominiumCode() {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let randomPart = "";

    for (let index = 0; index < 6; index += 1) {
      const randomIndex =
        crypto.randomInt(
          characters.length
        );

      randomPart += characters[randomIndex];
    }

    return `INF-${randomPart}`;
  }

  async generateUniqueCondominiumCode(
    transaction
  ) {
    const maximumAttempts = 10;

    for (
      let attempt = 0;
      attempt < maximumAttempts;
      attempt += 1
    ) {
      const code =
        this.generateCondominiumCode();

      const existing =
        await transaction.condominium.findFirst({
          where: {
            code,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

      if (!existing) {
        return code;
      }
    }

    throw new ApiError(
      "Não foi possível gerar o código do condomínio. Tente novamente.",
      500
    );
  }

  async validateDocumentAvailability(
    transaction,
    document
  ) {
    if (!document) {
      return;
    }

    const existing =
      await transaction.condominium.findFirst({
        where: {
          document,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (existing) {
      throw new ApiError(
        "Já existe uma solicitação ou condomínio cadastrado com este documento.",
        409
      );
    }
  }

  /**
   * Executa o onboarding público.
   *
   * Formato esperado:
   *
   * condominium:
   * - name
   * - legalName
   * - document
   * - email
   * - phone
   * - postalCode
   * - addressLine
   * - addressNumber
   * - addressExtra
   * - neighborhood
   * - city
   * - state
   *
   * contact:
   * - name
   * - email (opcional; se ausente usa condominium.email)
   * - phone (opcional; se ausente usa condominium.phone)
   *
   * Compatibilidade temporária:
   * se o frontend ainda enviar "administrator", seus dados
   * de contato poderão ser lidos apenas como responsável.
   * Username e password são ignorados e nenhum User é criado.
   */
  async register(data) {
    const condominiumData =
      data?.condominium;

    const contactData =
      data?.contact ??
      data?.responsible ??
      data?.administrator ??
      {};

    if (!condominiumData?.name) {
      throw new ApiError(
        "Nome do condomínio obrigatório.",
        400
      );
    }

    if (!contactData?.name) {
      throw new ApiError(
        "Nome do responsável obrigatório.",
        400
      );
    }

    const normalizedDocument =
      this.normalizeDocument(
        condominiumData.document
      );

    const condominiumEmail =
      this.normalizeEmail(
        condominiumData.email ??
        contactData.email
      );

    const condominiumPhone =
      this.normalizePhone(
        condominiumData.phone ??
        contactData.phone
      );

    const contactName =
      this.normalizeOptionalText(
        contactData.name
      );

    const result =
      await prisma.$transaction(
        async (transaction) => {
          await this.validateDocumentAvailability(
            transaction,
            normalizedDocument
          );

          const condominiumCode =
            await this.generateUniqueCondominiumCode(
              transaction
            );

          const condominium =
            await transaction.condominium.create({
              data: {
                code: condominiumCode,

                name:
                  String(
                    condominiumData.name
                  ).trim(),

                legalName:
                  this.normalizeOptionalText(
                    condominiumData.legalName
                  ),

                document:
                  normalizedDocument,

                email:
                  condominiumEmail,

                phone:
                  condominiumPhone,

                contactName,

                postalCode:
                  this.normalizePostalCode(
                    condominiumData.postalCode
                  ),

                addressLine:
                  this.normalizeOptionalText(
                    condominiumData.addressLine
                  ),

                addressNumber:
                  this.normalizeOptionalText(
                    condominiumData.addressNumber
                  ),

                addressExtra:
                  this.normalizeOptionalText(
                    condominiumData.addressExtra
                  ),

                neighborhood:
                  this.normalizeOptionalText(
                    condominiumData.neighborhood
                  ),

                city:
                  this.normalizeOptionalText(
                    condominiumData.city
                  ),

                state:
                  condominiumData.state
                    ? String(
                        condominiumData.state
                      )
                        .trim()
                        .toUpperCase()
                    : null,

                timezone:
                  "America/Recife",

                status:
                  "PENDING",

                trialEndsAt:
                  null,

                activatedAt:
                  null,

                suspendedAt:
                  null,

                canceledAt:
                  null,
              },

              select: {
                id: true,
                code: true,
                name: true,
                legalName: true,
                document: true,
                email: true,
                phone: true,
                contactName: true,
                postalCode: true,
                addressLine: true,
                addressNumber: true,
                addressExtra: true,
                neighborhood: true,
                city: true,
                state: true,
                timezone: true,
                status: true,
                trialEndsAt: true,
                createdAt: true,
              },
            });

          await transaction.auditLog.create({
            data: {
              condominiumId:
                condominium.id,

              userId:
                null,

              userName:
                condominium.contactName,

              userRole:
                null,

              action:
                "CREATE",

              module:
                "CONDOMINIUM_ONBOARDING",

              referenceId:
                condominium.id,

              details:
                "Solicitação pública de cadastro de condomínio criada e aguardando análise da Star Infinity Code.",

              afterData: {
                condominiumId:
                  condominium.id,

                condominiumCode:
                  condominium.code,

                condominiumName:
                  condominium.name,

                contactName:
                  condominium.contactName,

                email:
                  condominium.email,

                phone:
                  condominium.phone,

                status:
                  condominium.status,
              },
            },
          });

          return {
            condominium: {
              id:
                condominium.id,

              code:
                condominium.code,

              name:
                condominium.name,

              contactName:
                condominium.contactName,

              status:
                condominium.status,

              createdAt:
                condominium.createdAt,
            },

            accessReleased:
              false,

            message:
              "Solicitação enviada com sucesso. O cadastro está aguardando análise da Star Infinity Code.",
          };
        }
      );

    return result;
  }
}

export default new OnboardingService();
