import "dotenv/config";

import prisma from "../src/config/prisma.js";
import Password from "../src/utils/Password.js";

/**
 * =====================================================
 * SEED ADMINISTRATIVO - STAR INFINITY CODE
 * =====================================================
 *
 * Cria SOMENTE o PLATFORM_OWNER da plataforma.
 *
 * Não cria:
 * - condomínio fictício;
 * - CONDOMINIUM_ADMIN fictício;
 * - dados de teste.
 *
 * O PLATFORM_OWNER:
 * - possui condominiumId = null;
 * - administra solicitações PENDING;
 * - aprova/rejeita condomínios;
 * - cria/libera credenciais dos clientes.
 */

const PLATFORM_ADMIN_NAME =
  process.env.PLATFORM_ADMIN_NAME;

const PLATFORM_ADMIN_USERNAME =
  process.env.PLATFORM_ADMIN_USERNAME;

const PLATFORM_ADMIN_EMAIL =
  process.env.PLATFORM_ADMIN_EMAIL;

const PLATFORM_ADMIN_PASSWORD =
  process.env.PLATFORM_ADMIN_PASSWORD;

function validateEnvironment() {
  const missing = [];

  if (!PLATFORM_ADMIN_NAME) {
    missing.push("PLATFORM_ADMIN_NAME");
  }

  if (!PLATFORM_ADMIN_USERNAME) {
    missing.push("PLATFORM_ADMIN_USERNAME");
  }

  if (!PLATFORM_ADMIN_EMAIL) {
    missing.push("PLATFORM_ADMIN_EMAIL");
  }

  if (!PLATFORM_ADMIN_PASSWORD) {
    missing.push("PLATFORM_ADMIN_PASSWORD");
  }

  if (missing.length > 0) {
    throw new Error(
      `Variáveis obrigatórias ausentes: ${missing.join(", ")}`
    );
  }

  if (PLATFORM_ADMIN_PASSWORD.length < 8) {
    throw new Error(
      "PLATFORM_ADMIN_PASSWORD deve possuir pelo menos 8 caracteres."
    );
  }
}

function normalizeUsername(value) {
  return String(value)
    .trim()
    .toLowerCase();
}

function normalizeEmail(value) {
  return String(value)
    .trim()
    .toLowerCase();
}

async function main() {
  validateEnvironment();

  console.log("");
  console.log("==========================================");
  console.log("InfinityCondo - PLATFORM_OWNER");
  console.log("Star Infinity Code");
  console.log("==========================================");
  console.log("");

  const username =
    normalizeUsername(
      PLATFORM_ADMIN_USERNAME
    );

  const email =
    normalizeEmail(
      PLATFORM_ADMIN_EMAIL
    );

  const existingAdministrator =
    await prisma.user.findFirst({
      where: {
        condominiumId: null,
        username,
        role: {
          in: [
            "PLATFORM_OWNER",
            "PLATFORM_ADMIN",
          ],
        },
        deletedAt: null,
      },
    });

  const passwordHash =
    await Password.hash(
      PLATFORM_ADMIN_PASSWORD
    );

  let administrator;

  if (existingAdministrator) {
    administrator =
      await prisma.user.update({
        where: {
          id: existingAdministrator.id,
        },

        data: {
          name:
            String(
              PLATFORM_ADMIN_NAME
            ).trim(),

          email,

          passwordHash,

          role:
            "PLATFORM_OWNER",

          status:
            "ACTIVE",

          mustChangePassword:
            false,

          failedLoginAttempts:
            0,

          lockedUntil:
            null,

          deletedAt:
            null,
        },

        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
          condominiumId: true,
        },
      });

    console.log(
      "PLATFORM_ADMIN existente atualizado com sucesso."
    );
  } else {
    administrator =
      await prisma.user.create({
        data: {
          condominiumId:
            null,

          name:
            String(
              PLATFORM_ADMIN_NAME
            ).trim(),

          username,

          email,

          phone:
            null,

          passwordHash,

          role:
            "PLATFORM_OWNER",

          status:
            "ACTIVE",

          mustChangePassword:
            false,
        },

        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
          condominiumId: true,
        },
      });

    console.log(
      "PLATFORM_ADMIN criado com sucesso."
    );
  }

  await prisma.auditLog.create({
    data: {
      condominiumId:
        null,

      userId:
        administrator.id,

      userName:
        administrator.name,

      userRole:
        administrator.role,

      action:
        existingAdministrator
          ? "UPDATE"
          : "CREATE",

      module:
        "PLATFORM_OWNER",

      referenceId:
        administrator.id,

      details:
        existingAdministrator
          ? "PLATFORM_ADMIN atualizado através do seed administrativo."
          : "PLATFORM_ADMIN inicial criado através do seed administrativo.",

      afterData: {
        id:
          administrator.id,

        username:
          administrator.username,

        email:
          administrator.email,

        role:
          administrator.role,

        status:
          administrator.status,
      },
    },
  });

  console.log("");
  console.log(
    `Nome: ${administrator.name}`
  );
  console.log(
    `Usuário: ${administrator.username}`
  );
  console.log(
    `E-mail: ${administrator.email}`
  );
  console.log(
    `Perfil: ${administrator.role}`
  );
  console.log(
    `Condomínio: ${
      administrator.condominiumId ??
      "nenhum (proprietário da plataforma)"
    }`
  );
  console.log("");
  const plans = [
    { name:"Plano Básico", code:"BASICO", description:"Operação essencial do condomínio.", monthlyPriceInCents:25000, billingCycle:"MONTHLY", active:true, displayOrder:1 },
    { name:"Plano Completo", code:"COMPLETO", description:"Operação completa com financeiro, BI, comprovantes e automações premium.", monthlyPriceInCents:35000, billingCycle:"MONTHLY", active:true, displayOrder:2 },
  ];
  const savedPlans = {};
  for (const plan of plans) {
    savedPlans[plan.code] = await prisma.plan.upsert({ where:{code:plan.code}, update:{...plan,deletedAt:null}, create:plan });
  }

  const featureDefinitions = [
    ["EXPENSES","Controle de despesas","Cadastro, categorias e gestão financeira básica"],
    ["EXPENSE_EXPORT","Exportação financeira","PDF e planilha do financeiro"],
    ["PACKAGE_PROOF","Comprovante de encomenda","Foto opcional na retirada"],
    ["ADVANCED_REPORTS","Relatórios avançados","Relatórios e exportações avançadas"],
    ["BI_DASHBOARD","BI e indicadores","Dashboards e análises avançadas"],
    ["WHATSAPP","WhatsApp automático","Comunicações automáticas por WhatsApp"],
  ];
  const savedFeatures = {};
  for (const [code,name,description] of featureDefinitions) {
    savedFeatures[code] = await prisma.feature.upsert({ where:{code}, update:{name,description,active:true,deletedAt:null}, create:{code,name,description,active:true,valueType:"BOOLEAN"} });
  }
  const completeFeatures = Object.keys(savedFeatures);
  const basicFeatures = [];
  for (const [planCode, enabledCodes] of [["BASICO",basicFeatures],["COMPLETO",completeFeatures]]) {
    for (const [featureCode, feature] of Object.entries(savedFeatures)) {
      await prisma.planFeature.upsert({
        where:{planId_featureId:{planId:savedPlans[planCode].id,featureId:feature.id}},
        update:{enabled:enabledCodes.includes(featureCode)},
        create:{planId:savedPlans[planCode].id,featureId:feature.id,enabled:enabledCodes.includes(featureCode)},
      });
    }
  }
  console.log("Planos Básico/Completo e matriz de recursos garantidos.");

  console.log(
    "Senha não exibida por segurança."
  );
  console.log(
    "Use as credenciais configuradas no arquivo .env."
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "Erro ao criar PLATFORM_ADMIN:"
    );
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
