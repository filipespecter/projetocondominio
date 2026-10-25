import test from "node:test";
import assert from "node:assert/strict";
import { intelligence } from "../src/services/IntelligenceService.js";
import { maintenanceSchema, assemblySchema, evidence, evidenceActor } from "../src/services/OperationalEvidenceService.js";
import { searchRecord } from "../src/services/SearchRecordService.js";
const tenant = "22222222-2222-4222-8222-222222222222",
  uid = "11111111-1111-4111-8111-111111111111",
  rid = "33333333-3333-4333-8333-333333333333";
const user = {
  id: uid,
  name: "Gestor",
  role: "CONDOMINIUM_ADMIN",
  condominiumId: tenant
};
const date = new Date("2026-10-10T12:00:00Z");
function fixture(overrides = {}) {
  const data = {
    package: [{
      id: rid,
      status: "DELIVERED",
      receivedAt: date,
      deliveredAt: new Date(+date + 7200000),
      receivedByUserId: uid,
      apartment: {
        block: "A",
        number: "101"
      }
    }],
    visitor: [],
    reservation: [],
    occurrence: [{
      id: rid,
      status: "RESOLVED",
      category: "Hidráulica",
      createdAt: date,
      resolvedAt: new Date(+date + 3600000)
    }],
    auditLog: [],
    authSession: [],
    communicationLog: [],
    contract: [{
      id: rid,
      status: "ACTIVE",
      valueInCents: 10000,
      startDate: date,
      endDate: new Date(Date.now() + 86400000)
    }],
    asset: [],
    notice: [],
    shiftHandover: [],
    resident: [],
    assetMaintenance: [],
    assemblyRecord: [],
    user: [{
      id: uid,
      name: "Gestor",
      role: "CONDOMINIUM_ADMIN"
    }],
    ...overrides
  };
  const db = {};
  for (const [name, rows] of Object.entries(data)) db[name] = {
    count: async () => rows.length,
    findMany: async args => {
      if (name === "package" && args.where.status === "RECEIVED") return [];
      return rows;
    },
    create: async () => ({
      id: rid
    })
  };
  db.condominium = {
    findUnique: async () => ({
      name: "Condomínio",
      timezone: "America/Recife"
    })
  };
  return db;
}
test("BI calcula resolução pelo resolvedAt, mediana de retirada e contratos sem inventar parcelas", async () => {
  const d = await intelligence(user, {
    start: "2026-10-01",
    end: "2026-10-20"
  }, fixture());
  assert.equal(d.occurrences.resolutionTime, 3600);
  assert.equal(d.occurrences.resolutionSample, 1);
  assert.equal(d.packages.withdrawalMedianSeconds, 7200);
  assert.equal(d.administration.contractValueInCents, 10000);
  assert.equal(d.administration.commitments[0].valueInCents, 10000);
});
test("BI não usa updatedAt de ocorrência sem data de resolução", async () => {
  const d = await intelligence(user, {
    start: "2026-10-01",
    end: "2026-10-20"
  }, fixture({
    occurrence: [{
      status: "RESOLVED",
      createdAt: date,
      updatedAt: new Date(+date + 3600000)
    }]
  }));
  assert.equal(d.occurrences.resolutionTime, null);
  assert.equal(d.occurrences.resolutionSample, 0);
});
test("filtros de módulo, status, perfil e operador alteram os conjuntos retornados", async () => {
  const db = fixture();
  let d = await intelligence(user, {
    module: "VISITOR"
  }, db);
  assert.equal(d.packages.total, 0);
  assert.equal(d.details.packages.total, 0);
  d = await intelligence(user, {
    status: "RECEIVED"
  }, db);
  assert.equal(d.packages.total, 0);
  d = await intelligence(user, {
    profile: "DOORMAN"
  }, db);
  assert.equal(d.packages.total, 0);
  await assert.rejects(intelligence({
    ...user,
    role: "MANAGER"
  }, {
    operator: uid
  }, db), e => e.statusCode === 403);
  await assert.rejects(intelligence(user, {
    condominiumId: tenant
  }, db), e => e.statusCode === 422);
});
test("BI pagina detalhes no servidor e exporta todas as linhas filtradas com auditoria", async () => {
  const rows = Array.from({
    length: 30
  }, (_, i) => ({
    id: String(i),
    status: "RECEIVED",
    receivedAt: new Date(+date + i * 1000),
    receivedByUserId: uid
  }));
  const db = fixture({
    package: rows
  });
  let d = await intelligence(user, {
    page: 2
  }, db);
  assert.equal(d.details.packages.total, 30);
  assert.equal(d.details.packages.rows.length, 5);
  let audit;
  db.auditLog.create = async args => {
    audit = args;
  };
  d = await intelligence(user, {
    export: "true"
  }, db);
  assert.equal(d.details.packages.rows.length, 30);
  assert.equal(audit.data.module, "REPORT_EXPORT");
  assert.equal(audit.data.condominiumId, tenant);
});
test("BI recusa coleções acima do limite sem retornar dados parciais", async () => {
  await assert.rejects(intelligence(user, {}, fixture({
    visitor: Array.from({
      length: 10001
    }, () => ({
      status: "WAITING",
      createdAt: date
    }))
  })), e => e.statusCode === 422);
});
test("participação não usa base inconsistente nem conta a mesma unidade duas vezes", async () => {
  const db = fixture({
    notice: [{
      id: rid,
      eventDate: date,
      title: "Assembleia"
    }],
    assemblyRecord: [{
      noticeId: rid,
      apartmentId: uid,
      present: true,
      topic: "A",
      eligibleUnits: 10,
      vote: "YES",
      voteFinalized: true
    }, {
      noticeId: rid,
      apartmentId: uid,
      present: true,
      topic: "B",
      eligibleUnits: 20,
      vote: "NO"
    }]
  });
  const d = await intelligence(user, {}, db);
  const p = d.administration.assemblyParticipation[0];
  assert.equal(p.present, 1);
  assert.equal(p.participationPercent, null);
  assert.equal(p.finalizedVotes, 1);
});
test("manutenção rejeita conclusão futura, anterior e campos injetados", () => {
  assert.equal(maintenanceSchema.safeParse({
    description: "Teste",
    scheduledAt: date.toISOString(),
    completedAt: new Date(+date - 1000).toISOString()
  }).success, false);
  assert.equal(maintenanceSchema.safeParse({
    description: "Teste",
    scheduledAt: date.toISOString(),
    completedAt: new Date(Date.now() + 86400000).toISOString()
  }).success, false);
  assert.equal(maintenanceSchema.safeParse({
    description: "Teste",
    scheduledAt: date.toISOString(),
    condominiumId: tenant
  }).success, false);
});
test("ata rejeita voto de ausente e impõe evidência", () => {
  assert.equal(assemblySchema.safeParse({
    apartmentId: rid,
    present: false,
    topic: "Pauta",
    vote: "YES",
    evidence: "Ata"
  }).success, false);
  assert.equal(assemblySchema.safeParse({
    apartmentId: rid,
    present: true,
    topic: "Pauta",
    evidence: ""
  }).success, false);
  assert.throws(() => evidenceActor({
    ...user,
    role: "DOORMAN"
  }), e => e.statusCode === 403);
});
test("evidência de ativo alheio não pode ser lida nem gravada", async () => {
  let writes = 0;
  const tx = {
    asset: {
      findFirst: async args => {
        assert.equal(args.where.condominiumId, tenant);
        return null;
      }
    },
    assetMaintenance: {
      create: async () => {
        writes++;
      }
    }
  };
  await assert.rejects(evidence({
    $transaction: fn => fn(tx)
  }, user, "maintenance", rid, {
    description: "Teste",
    scheduledAt: date.toISOString()
  }), e => e.statusCode === 404);
  assert.equal(writes, 0);
});
test("detalhe da busca nunca revela encomenda de outro condomínio", async () => {
  let where;
  const db = {
    package: {
      findFirst: async args => {
        where = args.where;
        return null;
      }
    }
  };
  await assert.rejects(searchRecord(db, user, "Encomenda", rid), e => e.statusCode === 404);
  assert.equal(where.condominiumId, tenant);
  await assert.rejects(searchRecord(db, {
    ...user,
    role: "DOORMAN"
  }, "Reserva", rid), e => e.statusCode === 403);
});
test("detalhe de morador aplica apartamento e proprietário da reserva", async () => {
  let where;
  const db = {
    resident: {
      findFirst: async () => ({
        apartmentId: rid,
        canViewPackages: false
      })
    },
    reservation: {
      findFirst: async args => {
        where = args.where;
        return null;
      }
    }
  };
  await assert.rejects(searchRecord(db, {
    ...user,
    role: "RESIDENT"
  }, "Reserva", rid), e => e.statusCode === 404);
  assert.equal(where.apartmentId, rid);
  assert.equal(where.requestedByUserId, uid);
  await assert.rejects(searchRecord(db, {
    ...user,
    role: "RESIDENT"
  }, "Encomenda", rid), e => e.statusCode === 403);
});

test("quadros do BI usam os mesmos totais e agrupamentos dos relatórios", async () => {
  const d = await intelligence(user, {start:"2026-10-01",end:"2026-10-22"}, fixture());
  assert.equal(d.schemaVersion,2);
  assert.equal(d.dashboard.received,d.packages.total);
  assert.equal(d.dashboard.deliveredFromPeriod,1);
  assert.equal(d.dashboard.withdrawalPercent,100);
  assert.equal(d.dashboard.resolutionPercent,100);
  assert.equal(d.dashboard.metricGroups.withdrawal.rows[0].total,d.packages.withdrawalMeanSeconds);
  for(const [unit,name] of [["daily","daily"],["weekly","weekly"],["monthly","monthly"]]) {
    assert.deepEqual(d.dashboard[unit].map(x=>({name:x.name,total:x.packages})),d.packages[name]);
    assert.deepEqual(d.dashboard[unit].map(x=>({name:x.name,total:x.visitors})),d.visitors[name]);
    assert.equal(d.dashboard[unit].reduce((n,x)=>n+x.reservations,0),d.reservations.total);
  }
});
test("passagem de serviço no BI restringe condomínio e não conta ciência do autor", async () => {
  const db=fixture({shiftHandover:[{id:rid,title:"Pendência",createdAt:date,priority:"HIGH",createdByUserId:uid,resolvedAt:null,acknowledgements:[{userId:uid,acknowledgedAt:date}]}]});
  const original=db.shiftHandover.findMany;
  db.shiftHandover.findMany=async args=>{assert.equal(args.where.condominiumId,tenant);assert.ok(args.where.createdAt.gte);assert.equal(args.take,10001);return original(args);};
  const d=await intelligence(user,{start:"2026-10-01",end:"2026-10-22"},db);
  assert.deepEqual(d.handovers,{total:1,pending:1,resolved:0,acknowledged:0,highPriorityPending:1});
  assert.equal(d.details.handovers.total,1);
  assert.equal(d.details.handovers.rows[0].createdByUserId,undefined);
  assert.equal(d.dashboard.daily.reduce((n,x)=>n+x.handovers,0),1);
});
test("BI sem dados mantém tempos indisponíveis; gerente não recebe sessões individualizadas", async () => {
  const db=fixture({package:[],occurrence:[]});
  const original=db.resident.count;
  db.resident.count=async args=>{assert.equal(args.where.condominiumId,tenant);assert.equal(args.where.deletedAt,null);return original(args);};
  const d=await intelligence({...user,role:"MANAGER"},{start:"2026-10-01",end:"2026-10-22"},db);
  assert.equal(d.dashboard.withdrawalPercent,null);
  assert.equal(d.dashboard.resolutionPercent,null);
  assert.equal(d.dashboard.metricGroups.withdrawal.rows[0].total,null);
  assert.equal(d.sessionSummary,null);
  assert.equal(d.details.sessions.rows.length,0);
  assert.equal(d.dashboard.daily.every(x=>x.sessions===0),true);
});
