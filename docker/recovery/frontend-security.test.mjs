import test from "node:test";
import assert from "node:assert/strict";
test("produção usa /api e chamadas simultâneas compartilham um refresh", async () => {
  const {readFile} = await import("node:fs/promises");
  const source = await readFile(new URL("../../src/Services/api.js", import.meta.url), "utf8");
  const moduleText = source.replaceAll("import.meta.env", "({PROD:true})") + "\nexport {tryRefreshToken};";
  const client = await import(`data:text/javascript;base64,${Buffer.from(moduleText).toString("base64")}`);
  assert.equal(client.API_BASE_URL, "/api");
  const savedFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return {ok:true,headers:{get:()=>"application/json"},json:async()=>({success:true,data:{accessToken:"proof"}})};
  };
  try {
    const tokens = await Promise.all(Array.from({length:10},()=>client.tryRefreshToken()));
    assert.equal(requests, 1);
    assert.deepEqual(tokens, Array(10).fill("proof"));
  } finally { globalThis.fetch = savedFetch; }
});
