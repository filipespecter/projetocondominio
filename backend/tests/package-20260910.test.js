import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { onboardingSchema } from "../src/validators/onboardingValidator.js";
import { createDocumentSchema } from "../src/validators/documentValidator.js";
import { createVisitorInvitationSchema, visitorInvitationTokenSchema } from "../src/validators/visitorValidator.js";
import { createAssetSchema } from "../src/validators/assetValidator.js";
import { createSupplierSchema } from "../src/validators/supplierValidator.js";
import { createContractSchema } from "../src/validators/contractValidator.js";
import { createNoticeSchema } from "../src/validators/noticeValidator.js";
import PickupCredential from "../src/utils/PickupCredential.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const source = (relativePath) => readFile(path.resolve(backendRoot, relativePath), "utf8");
const UUID_A = "123e4567-e89b-42d3-a456-426614174000";

function onboardingPayload() {
  return {
    condominium: { name: "Condomínio Auditoria", email: "" },
    contact: { name: "Responsável", email: "responsavel@example.com", phone: "81999999999" },
  };
}

test("onboarding aceita e-mail opcional vazio e normaliza para null", () => {
  const result = onboardingSchema.safeParse(onboardingPayload());
  assert.equal(result.success, true);
  assert.equal(result.data.condominium.email, null);
});

test("documentos validam arquivo real e visibilidade", () => {
  const result = createDocumentSchema.safeParse({
    title: "Regimento interno",
    category: "REGIMENTO_INTERNO",
    visibility: "RESIDENTS",
    fileName: "regimento.pdf",
    fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQ=",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.visibility, "RESIDENTS");
});

test("convite de visitante exige janela cronológica válida", () => {
  const invalid = createVisitorInvitationSchema.safeParse({
    name: "Visitante",
    validFrom: "2026-09-11T12:00:00-03:00",
    validUntil: "2026-09-11T11:00:00-03:00",
  });
  assert.equal(invalid.success, false);
});

test("convite de visitante limita validade a 30 dias", () => {
  const invalid = createVisitorInvitationSchema.safeParse({
    name: "Visitante",
    validFrom: "2026-09-11T12:00:00-03:00",
    validUntil: "2026-10-20T12:00:00-03:00",
  });
  assert.equal(invalid.success, false);
});

test("credencial QR usa token aleatório e hash SHA-256", () => {
  const one = PickupCredential.generateToken();
  const two = PickupCredential.generateToken();
  assert.notEqual(one, two);
  assert.ok(one.length >= 20);
  const hash = PickupCredential.hash(one);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(PickupCredential.safeEqualHash(hash, one), true);
  assert.equal(PickupCredential.safeEqualHash(hash, two), false);
  assert.equal(visitorInvitationTokenSchema.safeParse({ token: one }).success, true);
});

test("ativo aceita vínculo opcional e status operacional", () => {
  const result = createAssetSchema.safeParse({ name: "Nobreak portaria", category: "Energia" });
  assert.equal(result.success, true);
  assert.equal(result.data.status, "OPERATIONAL");
});

test("fornecedor aceita e-mail opcional vazio sem erro", () => {
  const result = createSupplierSchema.safeParse({ legalName: "Fornecedor Teste", email: "" });
  assert.equal(result.success, true);
  assert.equal(result.data.email, null);
});

test("contrato rejeita vencimento anterior ao início", () => {
  const result = createContractSchema.safeParse({
    supplierId: UUID_A,
    serviceType: "Manutenção",
    description: "Contrato de manutenção",
    startDate: "2026-10-10",
    endDate: "2026-10-01",
  });
  assert.equal(result.success, false);
});

test("aviso normal continua válido sem campos de assembleia", () => {
  const result = createNoticeSchema.safeParse({ title: "Aviso normal", message: "Mensagem do aviso." });
  assert.equal(result.success, true);
  assert.equal(result.data.type, "NOTICE");
});

test("assembleia exige pauta, data, hora e local", () => {
  const invalid = createNoticeSchema.safeParse({ title: "Assembleia", message: "Convocação", type: "ASSEMBLY" });
  assert.equal(invalid.success, false);
  const valid = createNoticeSchema.safeParse({
    title: "Assembleia Geral",
    message: "Convocação dos moradores",
    type: "ASSEMBLY",
    agenda: "Prestação de contas",
    eventDate: "2026-10-10",
    eventTime: "19:00",
    eventLocation: "Salão de festas",
    audience: "RESIDENTS",
  });
  assert.equal(valid.success, true);
});

test("novos repositórios filtram registros por condominiumId", async () => {
  for (const file of ["DocumentRepository.js", "AssetRepository.js", "SupplierRepository.js", "ContractRepository.js"]) {
    const text = await source(`src/repositories/${file}`);
    assert.match(text, /condominiumId/, file);
    assert.match(text, /deletedAt:\s*null/, file);
  }
});

test("rotas dos novos módulos aplicam autenticação e autorização", async () => {
  const documentRoute = await source("src/routes/document.routes.js");
  assert.match(documentRoute, /routes\.use\(authMiddleware\)/);
  assert.match(documentRoute, /authorizeRoles\("CONDOMINIUM_ADMIN",\s*"MANAGER"\)/);

  for (const file of ["asset.routes.js", "supplier.routes.js", "contract.routes.js"]) {
    const text = await source(`src/routes/${file}`);
    assert.match(text, /authMiddleware/, file);
    assert.match(text, /authorizeRoles\([\s\S]*CONDOMINIUM_ADMIN[\s\S]*MANAGER/, file);
  }
});

test("QR de visitante é integrado ao Visitor e valida tenant antes do consumo", async () => {
  const schema = await source("prisma/schema.prisma");
  assert.match(schema, /model\s+Visitor[\s\S]*invitationTokenHash\s+String\?/);
  assert.doesNotMatch(schema, /model\s+VisitorInvitation\s*\{/);

  const repository = await source("src/repositories/VisitorRepository.js");
  assert.match(repository, /invitationTokenHash/);
  assert.match(repository, /condominiumId/);
  assert.match(repository, /updateMany/);

  const service = await source("src/services/VisitorService.js");
  assert.match(service, /PickupCredential\.hash/);
  assert.match(service, /USED/);
  assert.match(service, /EXPIRED/);
  assert.match(service, /CANCELED/);
});

test("novos módulos estão montados atrás dos guardas operacionais", async () => {
  const routes = await source("src/routes/index.js");
  for (const endpoint of ["/v1/documents", "/v1/assets", "/v1/suppliers", "/v1/contracts"]) {
    const escaped = endpoint.replaceAll("/", "\\/");
    assert.match(routes, new RegExp(`${escaped}[\\s\\S]{0,120}operationalGuards`), endpoint);
  }
});
