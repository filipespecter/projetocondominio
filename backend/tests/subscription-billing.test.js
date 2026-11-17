import test from "node:test";
import assert from "node:assert/strict";
import {billingDate,materializeDueCharge,createCycleCharge} from "../src/services/SubscriptionBillingService.js";
const newDate=d=>new Date(d+"T00:00:00Z");
const s={id:"sub",condominiumId:"condo",billingCycle:"MONTHLY",priceInCents:40000,currentPeriodStart:newDate("2026-02-01"),nextDueDate:newDate("2026-03-01"),condominium:{timezone:"America/Recife"},plan:{monthlyPriceInCents:45000}};
function harness() {
 const sub=structuredClone(s), charges=[], notices=[],events=[];
 const tx={$queryRaw:async()=>events.push("lock"),subscription:{findFirst:async()=>sub,update:async({data})=>Object.assign(sub,data)},
  charge:{findFirst:async({where})=>charges.find(c=>c.condominiumId===where.condominiumId&&c.dueDate>=where.dueDate.gte&&c.dueDate<where.dueDate.lt),
   create:async({data})=>{const c={...data,id:"charge"};charges.push(c);return c;}},
  notification:{create:async({data})=>notices.push(data)},auditLog:{create:async()=>events.push("audit")}};
 return {sub,charges,events,notices,tx,db:{$transaction:fn=>fn(tx)}};
}
test("ciclo respeita 30 dias no primeiro período e notifica pelo valor contratado",async()=>{
 const h=harness();
 assert.equal(billingDate(h.sub).toISOString(),newDate("2026-03-03").toISOString());
 assert.equal(await materializeDueCharge("condo",new Date("2026-03-03T01:00:00Z"),h.db),null);
 assert.equal((await materializeDueCharge("condo",new Date("2026-03-03T04:00:00Z"),h.db)).created,true);
 assert.equal(h.charges[0].amountInCents,40000);
 assert.equal(h.charges[0].metadata.discountInCents,5000);
 assert.equal(h.notices[0].targetRole,"CONDOMINIUM_ADMIN");
 assert.equal(h.sub.nextDueDate.toISOString(),newDate("2026-04-01").toISOString());
});
test("antecipação e geração automática reutilizam a mensalidade e não duplicam audit ou aviso",async()=>{
 const h=harness();
 await createCycleCharge(h.tx,h.sub,billingDate(h.sub),{id:"owner",role:"PLATFORM_OWNER"});
 const cycle=await materializeDueCharge("condo",new Date("2026-03-03T04:00:00Z"),h.db);
 assert.equal(cycle.created,false);
 assert.equal(cycle.charge.id,h.charges[0].id);
 assert.equal(h.charges.length,1);
 assert.equal(h.notices.length,1);
 assert.equal(h.events.filter(e=>e==="audit").length,1);
 assert.equal(await materializeDueCharge("condo",new Date("2026-03-03T04:30:00Z"),h.db),null);
});
