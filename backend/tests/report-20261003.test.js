import test from "node:test";
import assert from "node:assert/strict";
import { enforcePasswordChange } from "../src/middlewares/passwordChangeGuard.js";
test("senha temporária bloqueia operação direta e acesso à Central", () => {
  for (const path of ["/api/v1/apartments", "/api/v1/platform/users", "/api/v1/auth/me/extra"]) {
    assert.throws(() => enforcePasswordChange({mustChangePassword:true}, {method:"GET",originalUrl:path}), e => e.statusCode === 403);
  }
});
test("senha temporária permite apenas me, troca e logout com método correto", () => {
  for (const [method,originalUrl] of [["GET","/api/v1/auth/me?x=1"],["PATCH","/api/v1/auth/change-password"],["POST","/api/v1/auth/logout/"]]) {
    assert.doesNotThrow(() => enforcePasswordChange({mustChangePassword:true},{method,originalUrl}));
  }
  assert.throws(() => enforcePasswordChange({mustChangePassword:true},{method:"POST",originalUrl:"/api/v1/auth/change-password"}));
});
test("senha definitiva permite operação normal", () => {
  assert.doesNotThrow(() => enforcePasswordChange({mustChangePassword:false},{method:"POST",originalUrl:"/api/v1/reservations"}));
});
