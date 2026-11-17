import test from "node:test";
import assert from "node:assert/strict";
import { WahaProvider } from "../src/services/providers/WahaProvider.js";
import { WahaConnectionService } from "../src/services/WahaConnectionService.js";
const tenant = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";
function fixture(lookup) {
  const calls = [];
  const connection = { session: async id => { assert.equal(id, tenant); return { status: "WORKING" }; }, request: async (id, path, options) => {
    assert.equal(id, tenant); calls.push({ path, options });
    if (path.startsWith("/api/contacts/check-exists?")) { if (lookup instanceof Error) throw lookup; return lookup; }
    return { id: "provider-message" };
  } };
  return { provider: new WahaProvider(tenant, connection), calls };
}
test("WAHA resolve telefone sem alterar cadastro e envia uma imagem ao chatId LID retornado", async () => {
  const h = fixture({ numberExists: true, chatId: "123456789012345@lid" });
  const result = await h.provider.send({ recipient: "(81) 99999-0000", content: "Mensagem", attachments: [{ filename: "retirada.png", content: "cG5n" }] });
  assert.equal(h.calls.length, 2); const query = new URL("http://local" + h.calls[0].path);
  assert.equal(query.searchParams.get("phone"), "5581999990000"); assert.equal(query.searchParams.get("session"), "default");
  assert.equal(h.calls[1].path, "/api/sendImage"); assert.equal(h.calls[1].options.body.chatId, "123456789012345@lid");
  assert.equal(h.calls[1].options.body.file.data, "cG5n"); assert.equal(h.calls[1].options.body.caption, "Mensagem");
  assert.equal(result.metadata.wahaChatId, "123456789012345@lid"); assert.equal(result.metadata.delivery, "UNCONFIRMED");
});
test("WAHA aceita identificador canônico c.us sem remover ou inventar dígitos", async () => {
  const h = fixture({ numberExists: true, chatId: "558188880000@c.us" });
  await h.provider.send({ recipient: "5581988880000", content: "Mensagem" });
  assert.equal(h.calls[1].path, "/api/sendText"); assert.equal(h.calls[1].options.body.chatId, "558188880000@c.us");
});
test("WAHA não dispara quando número não existe ou identificador é inválido", async () => {
  for (const lookup of [{ numberExists: false }, {}, { numberExists: "true", chatId: "123456@lid" }, { numberExists: true, chatId: "123456@g.us" }, { numberExists: true, chatId: "https://example.com" }, { numberExists: true, chatId: "../123@c.us" }]) {
    const h = fixture(lookup); await assert.rejects(h.provider.send({ recipient: "81999990000", content: "Mensagem" }), error => error.statusCode === 422);
    assert.equal(h.calls.length, 1); assert.ok(h.calls.every(c => !c.options?.method));
  }
});
test("falha na consulta é anterior ao disparo e não vaza detalhes do provedor", async () => {
  const h = fixture(new Error("private-api-key"));
  await assert.rejects(h.provider.send({ recipient: "81999990000", content: "Mensagem" }), error => error.statusCode === 503 && !error.message.includes("private-api-key"));
  assert.equal(h.calls.length, 1);
});
test("falha depois do POST continua incerta e não gera segunda tentativa automática", async () => {
  let posts = 0;
  const provider = new WahaProvider(tenant, { session: async () => ({ status: "WORKING" }), request: async (_id, _path, options) => {
    if (!options) return { numberExists: true, chatId: "123456789@lid" };
    posts++; const error = new Error("Falha externa"); error.statusCode = 502; throw error;
  } });
  await assert.rejects(provider.send({ recipient: "81999990000", content: "Mensagem" }), error => error.statusCode === 502); assert.equal(posts, 1);
});
test("consulta de entrega usa o mesmo chatId enviado e mantém escopo e auditoria", async () => {
  const paths = [], writes = [], audits = [];
  const row = { id: messageId, status: "SENT", provider: "WAHA", recipient: "5581999990000", providerMessageId: "provider-message", metadata: { providerResponse: { wahaChatId: "123456789012345@lid" } } };
  const db = { communicationLog: { findFirst: async ({ where }) => { assert.equal(where.condominiumId, tenant); return row; }, updateMany: async args => { writes.push(args); return { count: 1 }; } }, auditLog: { create: async args => { audits.push(args); } } };
  db.$transaction = async fn => fn(db);
  const service = new WahaConnectionService(db); service.session = async () => ({ status: "WORKING" });
  service.request = async (id, path) => { assert.equal(id, tenant); paths.push(path); return { id: "provider-message", fromMe: true, ack: 2 }; };
  const result = await service.checkDelivery({ id: messageId, role: "DOORMAN", condominiumId: tenant }, messageId);
  assert.equal(result.status, "DELIVERED"); assert.match(paths[0], /123456789012345%40lid/); assert.equal(writes[0].where.condominiumId, tenant); assert.equal(audits.length, 1);
});

test("resultado incerto só é reconciliado com recibo exato e confirmação de entrega",async()=>{
 const row={id:messageId,status:"FAILED",attemptCount:2,recipient:"5581999990000",metadata:{requiresReview:true,wahaReviewReceipt:{id:"provider-known",chatId:"123456789@lid"}}};
 const paths=[],updates=[];
 const db={communicationLog:{findFirst:async()=>row,updateMany:async args=>{updates.push(args);return {count:1};}},auditLog:{create:async()=>{}}};
 db.$transaction=async fn=>fn(db);
 const service=new WahaConnectionService(db);
 service.session=async()=>({status:"WORKING"});
 let ack=1;
 service.request=async (_id,path)=>{paths.push(path);return {id:"provider-known",fromMe:true,ack};};
 const actor={id:messageId,role:"DOORMAN",condominiumId:tenant};
 assert.equal((await service.checkDelivery(actor,messageId)).status,"FAILED");assert.equal(updates.length,0);
 ack=2;
 assert.equal((await service.checkDelivery(actor,messageId)).status,"DELIVERED");
 assert.match(paths[0],/123456789%40lid.*provider-known/);assert.equal(updates[0].where.attemptCount,2);
 row.metadata={requiresReview:true};paths.length=0;
 assert.match((await service.checkDelivery(actor,messageId)).message,/permanece bloqueado/);assert.equal(paths.length,0);
});
