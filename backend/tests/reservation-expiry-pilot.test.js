import test from "node:test";
import assert from "node:assert/strict";
import { expirePendingReservations } from "../src/services/ReservationExpiryService.js";

test("o job audita e notifica somente as reservas que conseguiu expirar", async () => {
  const row = { id: "reservation", condominiumId: "tenant", requestedByUserId: "resident" };
  const calls = [];
  const db = { $transaction: fn => fn({
    $queryRaw: async () => [row],
    auditLog: { createMany: async ({ data }) => calls.push(["audit", data[0].referenceId]) },
    notification: { createMany: async ({ data }) => calls.push(["notify", data[0].condominiumId, data[0].recipientUserId]) },
  }) };
  assert.equal(await expirePendingReservations(undefined, db), 1);
  assert.deepEqual(calls, [["audit", "reservation"], ["notify", "tenant", "resident"]]);
});
