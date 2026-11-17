import test from "node:test";
import assert from "node:assert/strict";
import provider from "../src/services/providers/MercadoPagoProvider.js";

for (const host of ["https://localhost:5443", "https://example.com"]) {
  test("checkout usa o catálogo da credencial e trata URLs locais: " + host, async t => {
    const previous = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = host;
    t.after(() => previous === undefined ? delete process.env.FRONTEND_URL : process.env.FRONTEND_URL = previous);
    t.mock.method(provider, "request", async path => {
      assert.equal(path, "/v1/payment_methods");
      return ["credit_card", "debit_card", "ticket", "account_money", "prepaid_card", "ticket"].map(payment_type_id => ({ payment_type_id }));
    });
    const body = await provider.cardOrderBody({id:"charge",amountInCents:40000});
    assert.deepEqual(body.config.payment_method.not_allowed_types, ["account_money","debit_card","prepaid_card","ticket"]);
    assert.equal(body.config.online?.success_url, host.includes("localhost") ? undefined : host + "/dashboard/financeiro#assinatura");
    assert.equal(body.total_amount, "400.00");
  });
}
