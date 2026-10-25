import test from "node:test";
import assert from "node:assert/strict";
import { idleMinutes, sessionDeadline, enforceIdle } from "../src/utils/sessionIdle.js";
import { mean, median, percentage, variation, secondsBetween, period } from "../src/utils/indicatorMath.js";
import { handoverSchema, handoverActor, acknowledgeHandover, writeHandover } from "../src/services/HandoverService.js";
import { globalSearch } from "../src/services/GlobalSearchService.js";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  condominiumId: "22222222-2222-4222-8222-222222222222",
  role: "DOORMAN"
};
test("sessão expira com 30 minutos sem interação; refresh não conta", async () => {
  const session = {
    id: "s",
    createdAt: new Date("2026-10-20T12:00Z"),
    lastInteractionAt: new Date("2026-10-20T12:00Z"),
    lastUsedAt: new Date("2026-10-20T12:29Z"),
    expiresAt: new Date("2026-10-27T12:00Z")
  };
  let update;
  const db = {
    authSession: {
      updateMany: async args => {
        update = args;
      }
    }
  };
  assert.equal(sessionDeadline(session, {
    idleTimeoutMinutes: 30
  }), Date.parse("2026-10-20T12:30Z"));
  await enforceIdle(session, {
    idleTimeoutMinutes: 30
  }, db, new Date("2026-10-20T12:29Z"));
  assert.equal(update, undefined);
  await assert.rejects(enforceIdle(session, {
    idleTimeoutMinutes: 30
  }, db, new Date("2026-10-20T12:30Z")), e => e.statusCode === 401 && e.details.code === "IDLE_TIMEOUT");
  assert.equal(update.data.revokeReason, "IDLE_TIMEOUT");
});
test("prazo absoluto não é ampliado pela interação", () => {
  assert.equal(idleMinutes(999), 30);
  const session = {
    expiresAt: new Date("2026-10-20T13:00Z"),
    lastInteractionAt: new Date("2026-10-20T12:59Z")
  };
  assert.equal(sessionDeadline(session, {
    idleTimeoutMinutes: 60
  }), Date.parse("2026-10-20T13:00Z"));
});
test("média, mediana, percentuais e períodos vazios preservam significado", () => {
  assert.equal(mean([]), null);
  assert.equal(median([]), null);
  assert.equal(median([10, 1, 2, 3]), 2.5);
  assert.equal(median([10, 1, 2]), 2);
  assert.equal(percentage(0, 0), null);
  assert.equal(variation(5, 0), null);
  assert.equal(variation(15, 10), 50);
  assert.equal(secondsBetween("2026-10-20T12:00Z", "2026-10-20T12:01Z"), 60);
  assert.equal(secondsBetween("2026-10-20T12:00Z", "2026-10-20T11:59Z"), null);
  assert.throws(() => period({
    start: "2026-12-01",
    end: "2026-10-01"
  }));
  assert.throws(() => period({
    start: "2026-01-01",
    end: "2026-12-01"
  }));
});
test("passagem exige operador do condomínio e ignora identidades fornecidas pelo navegador", () => {
  assert.throws(() => handoverActor({
    ...user,
    role: "RESIDENT"
  }), e => e.statusCode === 403);
  assert.throws(() => handoverActor({
    ...user,
    condominiumId: null
  }), e => e.statusCode === 403);
  assert.equal(handoverSchema.safeParse({
    title: "Aviso",
    notes: "Observação",
    createdByUserId: "outro"
  }).success, false);
});
test("ciência de passagem de outro condomínio não é registrada", async () => {
  let where,
    writes = 0;
  const tx = {
    shiftHandover: {
      findFirst: async args => {
        where = args.where;
        return null;
      }
    },
    shiftHandoverAck: {
      upsert: async () => {
        writes++;
      }
    }
  };
  await assert.rejects(acknowledgeHandover({
    $transaction: fn => fn(tx)
  }, user, "33333333-3333-4333-8333-333333333333"), e => e.statusCode === 404);
  assert.equal(where.condominiumId, user.condominiumId);
  assert.equal(writes, 0);
});
test("autor não confirma ciência de sua própria passagem", async () => {
  const db = {
    $transaction: fn => fn({
      shiftHandover: {
        findFirst: async () => ({
          createdByUserId: user.id
        })
      }
    })
  };
  await assert.rejects(acknowledgeHandover(db, user, "33333333-3333-4333-8333-333333333333"), e => e.statusCode === 409);
});
test("passagem registra auditoria e autor a partir da sessão", async () => {
  const calls = [];
  const tx = {
    shiftHandover: {
      create: async args => {
        calls.push(args);
        return {
          id: "new"
        };
      }
    },
    auditLog: {
      create: async args => calls.push(args)
    }
  };
  await writeHandover({
    $transaction: fn => fn(tx)
  }, user, {
    title: "Encomenda",
    notes: "Pacote requer atenção"
  });
  assert.equal(calls[0].data.createdByUserId, user.id);
  assert.equal(calls[0].data.condominiumId, user.condominiumId);
  assert.equal(calls[1].data.module, "SHIFT_HANDOVER");
});
test("busca de porteiro limita resultados no servidor e não consulta reservas administrativas", async () => {
  const calls = [];
  const model = () => ({
    findMany: async args => {
      calls.push(args);
      return [];
    }
  });
  await globalSearch({
    apartment: model(),
    package: model(),
    visitor: model(),
    resident: model(),
    occurrence: model(),
    reservation: {
      findMany: () => {
        throw Error("acesso indevido");
      }
    }
  }, user, "101");
  assert.equal(calls.length, 5);
  for (const args of calls) {
    assert.equal(args.where.condominiumId, user.condominiumId);
    assert.equal(args.take, 5);
    assert.equal(args.where.deletedAt, null);
  }
});
test("busca de morador restringe apartamento e suas próprias reservas", async () => {
  const calls = [];
  const db = {
    resident: {
      findFirst: async () => ({
        apartmentId: "ap",
        canViewPackages: false
      })
    },
    package: {
      findMany: () => {
        throw Error("sem permissão");
      }
    },
    reservation: {
      findMany: async args => {
        calls.push(args);
        return [];
      }
    }
  };
  await globalSearch(db, {
    ...user,
    role: "RESIDENT"
  }, "101");
  assert.equal(calls[0].where.apartmentId, "ap");
  assert.equal(calls[0].where.requestedByUserId, user.id);
  assert.equal(calls[0].where.condominiumId, user.condominiumId);
});
test("busca rejeita consulta vazia e perfil sem condomínio", async () => {
  await assert.rejects(globalSearch({}, user, "a"), e => e.statusCode === 422);
  await assert.rejects(globalSearch({}, {
    ...user,
    role: "PLATFORM_OWNER",
    condominiumId: null
  }, "101"), e => e.statusCode === 403);
});
import { signNotice, verifyNotice } from "../src/utils/noticeConfirmation.js";
import { intelligence } from "../src/services/IntelligenceService.js";
test("confirmação é vinculada ao operador, condomínio, encomenda e prazo", () => {
  const secret = "test-only-secret",
    expected = {
      userId: "a",
      condominiumId: "c",
      id: "p"
    },
    token = signNotice({
      ...expected,
      expires: 1000
    }, secret);
  assert.equal(verifyNotice(token, expected, secret, 999).id, "p");
  for (const context of [{
    ...expected,
    userId: "b"
  }, {
    ...expected,
    condominiumId: "outro"
  }, {
    ...expected,
    id: "outro"
  }]) assert.throws(() => verifyNotice(token, context, secret, 999));
  assert.throws(() => verifyNotice(token, expected, secret, 1000));
  assert.throws(() => verifyNotice(token + "x", expected, secret, 999));
  assert.throws(() => verifyNotice(token, expected, "other-secret", 999));
});
test("BI usa condomínio da sessão em todas as consultas e separa segurança de operação", async () => {
  const calls = [];
  const model = name => ({
    findMany: async args => {
      calls.push([name, args]);
      if (name === "auditLog") return [{
        module: "AUTH",
        action: "LOGIN",
        userId: "a",
        userRole: "DOORMAN",
        createdAt: new Date("2026-10-20T12:00Z")
      }, {
        module: "PACKAGE",
        action: "CREATE",
        userId: "a",
        userRole: "DOORMAN",
        createdAt: new Date("2026-10-20T12:00Z")
      }];
      return [];
    },
    count: async args => {
      calls.push([name, args]);
      return 0;
    },
    groupBy: async args => {
      calls.push([name, args]);
      return [];
    }
  });
  const db = Object.fromEntries(["package", "visitor", "reservation", "occurrence", "auditLog", "authSession", "communicationLog", "contract", "asset", "notice", "assetMaintenance", "assemblyRecord", "shiftHandover", "resident", "user"].map(n => [n, model(n)]));
  db.condominium = {
    findUnique: async () => ({
      name: "Condomínio de teste"
    })
  };
  db.resident.count = async () => 0;
  const result = await intelligence({
    ...user,
    role: "MANAGER"
  }, {
    start: "2026-10-01",
    end: "2026-10-20"
  }, db);
  assert.equal(result.adoption.operations, 1);
  assert.deepEqual(result.sessions, []);
  assert.deepEqual(result.security, []);
  assert.equal(result.communications.confirmedDeliveryPercent, null);
  assert.equal(result.packages.withdrawalMedianSeconds, null);
  for (const [name, args] of calls) {
    assert.equal(name === "authSession" ? args.where.user.condominiumId : args.where.condominiumId, user.condominiumId);
  }
  await assert.rejects(intelligence(user, {}, db), e => e.statusCode === 403);
});
test("período respeita o fuso do condomínio e rejeita dias inexistentes", () => {
  assert.equal(period({
    start: "2026-10-01",
    end: "2026-10-01"
  }, new Date(), "America/Recife").start.toISOString(), "2026-10-01T03:00:00.000Z");
  assert.equal(period({
    start: "2026-10-01",
    end: "2026-10-01"
  }, new Date(), "America/Manaus").start.toISOString(), "2026-10-01T04:00:00.000Z");
  assert.throws(() => period({
    start: "2026-02-30",
    end: "2026-03-01"
  }));
});
