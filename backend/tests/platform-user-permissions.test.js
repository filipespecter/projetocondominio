import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ApiError } from "../src/utils/ApiError.js";
const source = fs.readFileSync(new URL("../src/services/PlatformUserService.js", import.meta.url), "utf8").replace(/^import .*;$/gm, "").replace("export default new PlatformUserService();", "new PlatformUserService();");
const service = vm.runInNewContext(source, { ApiError });
for (const actorRole of ["PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT", "CONDOMINIUM_ADMIN"]) {
  for (const targetRole of ["PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT", "CONDOMINIUM_ADMIN"]) {
    test(`${actorRole} criando ${targetRole}`, () => {
      const allowed = ["PLATFORM_OWNER", "PLATFORM_ADMIN"].includes(actorRole) && ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"].includes(targetRole);
      const action = () => service.validateCanCreatePlatformUser({role: actorRole}, targetRole);
      if (allowed) assert.doesNotThrow(action);
      else assert.throws(action, e => e.statusCode === 403);
    });
  }
}
test("admin continua sem poder alterar outro admin ou owner", () => {
  for (const role of ["PLATFORM_ADMIN", "PLATFORM_OWNER"]) assert.throws(() => service.validateCanManageTarget({role:"PLATFORM_ADMIN"}, {role}), e => e.statusCode === 403);
});
