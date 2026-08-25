import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { onboardingSchema } from "../src/validators/onboardingValidator.js";
import { validatePlatformApproval } from "../src/validators/platformCondominiumApprovalValidator.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const projectRoot = path.resolve(backendRoot, "..");

async function source(relativePath) {
  return readFile(path.resolve(projectRoot, relativePath), "utf8");
}

function validOnboarding() {
  return {
    condominium: {
      name: "Condomínio Teste",
      email: "condominio@example.com",
      phone: "81999999999",
      city: "Recife",
      state: "PE",
    },
    contact: {
      name: "Responsável Teste",
      email: "responsavel@example.com",
      phone: "81988888888",
    },
  };
}

function runMiddleware(middleware, body) {
  return new Promise((resolve) => {
    const req = { body };
    middleware(req, {}, (error) => resolve({ error, body: req.body }));
  });
}

test("onboarding aceita condomínio + contato", () => {
  const result = onboardingSchema.safeParse(validOnboarding());
  assert.equal(result.success, true);
});

test("onboarding público rejeita credenciais", () => {
  const payload = validOnboarding();
  payload.administrator = {
    name: "Admin",
    username: "admin",
    password: "Senha123!",
  };
  const result = onboardingSchema.safeParse(payload);
  assert.equal(result.success, false);
});

test("aprovação exige credenciais e vencimento válidos", async () => {
  const payload = {
    username: "sindico.teste",
    password: "SenhaTeste123!",
    passwordConfirmation: "SenhaTeste123!",
    planId: "123e4567-e89b-12d3-a456-426614174000",
    dueDay: 10,
    initialStatus: "ACTIVE",
    billingCycle: "MONTHLY",
    adminName: "Síndico Teste",
    adminEmail: "sindico@example.com",
    adminPhone: "81999999999",
    billingContactName: "Síndico Teste",
    billingEmail: "financeiro@example.com",
    billingPhone: "81999999999",
  };
  const result = await runMiddleware(validatePlatformApproval, payload);
  assert.equal(result.error, undefined);
});

test("aprovação rejeita senha divergente", async () => {
  const result = await runMiddleware(validatePlatformApproval, {
    username: "sindico.teste",
    password: "SenhaTeste123!",
    passwordConfirmation: "OutraSenha123!",
    planId: "123e4567-e89b-12d3-a456-426614174000",
    dueDay: 10,
  });
  assert.ok(result.error);
});

test("onboarding backend mantém solicitação PENDING e não cria User", async () => {
  const text = await source("backend/src/services/OnboardingService.js");
  assert.match(text, /status:\s*"PENDING"/);
  assert.doesNotMatch(text, /transaction\.user\.create\s*\(/);
});

test("aprovação cria CONDOMINIUM_ADMIN ativo e força troca da senha", async () => {
  const text = await source("backend/src/repositories/PlatformApprovalRepository.js");
  assert.match(text, /role:\s*"CONDOMINIUM_ADMIN"/);
  assert.match(text, /status:\s*"ACTIVE"/);
  assert.match(text, /mustChangePassword:\s*true/);
});

test("controladores operacionais derivam condominiumId da sessão", async () => {
  const files = [
    "backend/src/controllers/ReservationController.js",
    "backend/src/controllers/PackageController.js",
    "backend/src/controllers/VisitorController.js",
    "backend/src/controllers/OccurrenceController.js",
    "backend/src/controllers/NoticeController.js",
  ];
  for (const file of files) {
    const text = await source(file);
    assert.match(text, /req\.user\.condominiumId/, file);
  }
});

test("rotas críticas exigem autenticação", async () => {
  const files = [
    "backend/src/routes/reservation.routes.js",
    "backend/src/routes/package.routes.js",
    "backend/src/routes/visitor.routes.js",
    "backend/src/routes/occurrence.routes.js",
    "backend/src/routes/notice.routes.js",
  ];
  for (const file of files) {
    const text = await source(file);
    assert.match(text, /\.use\(\s*authMiddleware\s*\)/s, file);
  }
});

test("encomenda usa hash para credencial de retirada", async () => {
  const schema = await source("backend/prisma/schema.prisma");
  assert.match(schema, /pickupTokenHash\s+String\?/);
  assert.match(schema, /pickupCodeHash\s+String\?/);
  assert.match(schema, /pickupUsedAt\s+DateTime\?/);
});

test("reserva contém validação de conflito e limite diário", async () => {
  const text = await source("backend/src/services/ReservationService.js");
  assert.match(text, /validateConflict\s*\(/);
  assert.match(text, /validateDailyLimit\s*\(/);
  assert.match(text, /"PENDING"/);
  assert.match(text, /"APPROVED"/);
});

test("frontend de aprovação envia credenciais, plano e vencimento", async () => {
  const text = await source("src/pages/platform/PlatformCondominiums.jsx");
  for (const field of ["username", "password", "passwordConfirmation", "planId", "dueDay", "billingEmail", "billingPhone"]) {
    assert.match(text, new RegExp(field), field);
  }
});

test("cadastro público usa contact e não envia administrator", async () => {
  const text = await source("src/pages/CadastroCondominio.jsx");
  assert.match(text, /registerCondominium\(\{\s*condominium,\s*contact,/s);
  assert.doesNotMatch(text, /registerCondominium\(\{\s*condominium,\s*administrator,/s);
});
