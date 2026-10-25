
import test from "node:test";
import assert from "node:assert/strict";
import residents from "../src/services/ResidentService.js";
import contacts from "../src/services/ApartmentContactService.js";
import users from "../src/services/UserService.js";
import repository from "../src/repositories/ResidentRepository.js";
import audit from "../src/services/AuditLogService.js";

const payload = {
  apartmentId: "unit-a",
  residentType: "TENANT",
  name: "Inquilino",
  username: "inquilino",
  email: "inquilino@example.com",
  phone: "81999990000",
  password: "test-only-password"
};


test("todos os tipos permitem cadastro sem contatos prévios", async t => {
  let checks = 0;
  const created = [];

  t.mock.method(residents, "validateApartment", async () => {});
  t.mock.method(contacts, "requireComplete", async () => {
    checks++;
    throw Error("Contatos não devem bloquear o cadastro");
  });
  t.mock.method(users, "createForCondominium", async () => ({
    id: "user-a"
  }));
  t.mock.method(repository, "createForCondominium", async (tenant, data) => {
    created.push({ tenant, data });
    return { id: "resident-a", ...data };
  });
  t.mock.method(residents, "syncApartmentOccupancy", async () => {});
  t.mock.method(audit, "logCreate", async () => {});

  for (const residentType of ["OWNER", "DEPENDENT", "OTHER"]) {
    const result = await residents.create(
      "tenant-a",
      { ...payload, residentType },
      { id: "admin", role: "CONDOMINIUM_ADMIN" }
    );
    assert.equal(result.residentType, residentType);
  }

  assert.equal(checks, 0);
  assert.equal(created.length, 3);
  for (const { tenant, data } of created) {
    assert.equal(tenant, "tenant-a");
    assert.equal(data.apartmentId, "unit-a");
    assert.equal(data.whatsappOptIn, false);
  }
});
test("inquilino pode ser criado sem contatos prévios", async t => {
  t.mock.method(residents, "validateApartment", async () => {});
  t.mock.method(contacts, "requireComplete", async () => {
    throw Error("Contatos não devem bloquear o cadastro");
  });
  t.mock.method(users, "createForCondominium", async () => ({
    id: "user-a"
  }));
  t.mock.method(repository, "createForCondominium", async (tenant, data) => {
    assert.equal(tenant, "tenant-a");
    assert.equal(data.apartmentId, "unit-a");
    assert.equal(data.whatsappOptIn, false);
    return { id: "resident-a", ...data };
  });
  t.mock.method(residents, "syncApartmentOccupancy", async () => {});
  t.mock.method(audit, "logCreate", async () => {});

  const result = await residents.create(
    "tenant-a", payload, { id: "admin", role: "CONDOMINIUM_ADMIN" }
  );
  assert.equal(result.residentType, "TENANT");
});

test("apartamento inválido impede cadastro antes de criar usuário", async t => {
  let writes = 0;
  t.mock.method(residents, "validateApartment", async () => {
    const error = Error("Apartamento não encontrado");
    error.statusCode = 404;
    throw error;
  });
  t.mock.method(users, "createForCondominium", async () => {
    writes++;
  });

  await assert.rejects(
    residents.create("tenant-a", payload, { id: "admin" }),
    error => error.statusCode === 404
  );
  assert.equal(writes, 0);
});