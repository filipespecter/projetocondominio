// Run explicitly after migrate deploy in the existing isolated Homolog. All fixtures roll back.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import prisma from "../src/config/prisma.js";
import { evidence, completeMaintenance } from "../src/services/OperationalEvidenceService.js";
import { intelligence } from "../src/services/IntelligenceService.js";
import { globalSearch } from "../src/services/GlobalSearchService.js";
import { writeHandover, acknowledgeHandover } from "../src/services/HandoverService.js";
import { searchRecord } from "../src/services/SearchRecordService.js";
const url = new URL(process.env.DATABASE_URL || "http://invalid");
if (url.hostname !== "postgres" || url.pathname !== "/infinitycondo_homolog" || process.env.NODE_ENV === "production" || process.env.JOBS_ENABLED !== "false" || process.env.WHATSAPP_ENABLED !== "false" || process.env.MERCADO_PAGO_ENABLED !== "false") throw Error("Teste exige exclusivamente Homolog isolada e integrações desativadas.");
const rollback = new Error("ROLLBACK_EXPECTED");
let checks = 0;
try {
  await prisma.$transaction(async tx => {
    const db = new Proxy(tx, {
      get: (target, key) => key === "$transaction" ? fn => fn(db) : Reflect.get(target, key)
    });
    const a = await tx.condominium.create({
        data: {
          code: `QA-${randomUUID()}`,
          name: "Validação transacional A"
        }
      }),
      b = await tx.condominium.create({
        data: {
          code: `QA-${randomUUID()}`,
          name: "Validação transacional B"
        }
      });
    const user = await tx.user.create({
      data: {
        condominiumId: a.id,
        name: "Operador de validação",
        username: randomUUID(),
        passwordHash: "not-a-login-hash",
        role: "CONDOMINIUM_ADMIN"
      }
    });
    const actor = {
        ...user
      },
      unit = await tx.apartment.create({
        data: {
          condominiumId: a.id,
          block: "A",
          number: "101"
        }
      }),
      other = await tx.apartment.create({
        data: {
          condominiumId: b.id,
          block: "B",
          number: "101"
        }
      });
    const asset = await tx.asset.create({
      data: {
        condominiumId: a.id,
        name: "Equipamento QA",
        category: "Validação"
      }
    });
    const now = new Date(),
      past = new Date(+now - 3600000);
    const row = await evidence(db, actor, "maintenance", asset.id, {
      description: "Manutenção de validação transacional",
      scheduledAt: past.toISOString()
    });
    checks++;
    await completeMaintenance(db, actor, row.id, {
      completedAt: now.toISOString(),
      costInCents: 1000
    });
    checks++;
    await assert.rejects(evidence(db, {
      ...actor,
      condominiumId: b.id
    }, "maintenance", asset.id), e => e.statusCode === 404);
    checks++;
    const notice = await tx.notice.create({
      data: {
        condominiumId: a.id,
        authorUserId: user.id,
        title: "Assembleia QA",
        message: "Validação",
        type: "ASSEMBLY",
        eventDate: now
      }
    });
    await evidence(db, actor, "assembly", notice.id, {
      apartmentId: unit.id,
      present: true,
      topic: "Pauta QA",
      vote: "YES",
      voteFinalized: true,
      evidence: "Ata de teste transacional",
      eligibleUnits: 1
    });
    checks++;
    await assert.rejects(evidence(db, actor, "assembly", notice.id, {
      apartmentId: other.id,
      present: true,
      topic: "Pauta QA",
      evidence: "Teste isolado"
    }), e => e.statusCode === 404);
    checks++;
    const pkg = await tx.package.create({
      data: {
        condominiumId: a.id,
        apartmentId: unit.id,
        type: "Caixa",
        description: "Validação QA",
        receivedAt: past,
        receivedByUserId: user.id
      }
    });
    const found = await globalSearch(db, actor, "Validação");
    assert(found.some(x => x.id === pkg.id));
    checks++;
    await assert.rejects(searchRecord(db, {
      ...actor,
      condominiumId: b.id
    }, "Encomenda", pkg.id), e => e.statusCode === 404);
    checks++;
    const detail = await searchRecord(db, actor, "Encomenda", pkg.id);
    assert.equal(detail.record.id, pkg.id);
    checks++;
    const second = await tx.user.create({
      data: {
        condominiumId: a.id,
        name: "Próximo operador QA",
        username: randomUUID(),
        passwordHash: "not-a-login-hash",
        role: "DOORMAN"
      }
    });
    const handover = await writeHandover(db, actor, {
      title: "Pendência QA",
      notes: "Conferir encomenda de validação"
    });
    await acknowledgeHandover(db, second, handover.id);
    await acknowledgeHandover(db, second, handover.id);
    assert.equal(await tx.shiftHandoverAck.count({
      where: {
        handoverId: handover.id,
        userId: second.id
      }
    }), 1);
    checks++;
    const result = await intelligence(actor, {}, db);
    assert.equal(result.packages.total, 1);
    assert.equal(result.administration.maintenanceCompleted, 1);
    assert.equal(result.administration.assemblyParticipation[0].participationPercent, 100);
    checks++;
    const filtered = await intelligence(actor, {
      module: "VISITOR"
    }, db);
    assert.equal(filtered.packages.total, 0);
    checks++;
    const exported = await intelligence(actor, {
      export: "true"
    }, db);
    assert.equal(exported.details.packages.rows.length, 1);
    checks++;
    const explain = await tx.$queryRaw`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT id FROM "Package" WHERE "condominiumId"=${a.id}::uuid AND "receivedAt">=${past}`;
    console.log("PLANO_HOMOLOG_PACKAGE", JSON.stringify(explain));
    throw rollback;
  }, {
    timeout: 30000
  });
  throw Error("Transação deveria ter sido revertida.");
} catch (e) {
  if (e !== rollback) throw e;
  console.log(`HOMOLOG_INTEGRATION_OK: ${checks} verificações; fixtures revertidas, sem envio externo.`);
} finally {
  await prisma.$disconnect();
}
