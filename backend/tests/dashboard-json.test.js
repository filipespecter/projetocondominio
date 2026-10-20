import test from "node:test";
import assert from "node:assert/strict";
import { jsonSafe } from "../src/utils/jsonSafe.js";
test("dashboard serializa BigInt de anexos em objetos e listas",()=>{const result=jsonSafe({recent:[{sizeBytes:12345n}],zero:0n});assert.deepEqual(result,{recent:[{sizeBytes:12345}],zero:0});assert.doesNotThrow(()=>JSON.stringify(result));});
test("valores grandes mantêm precisão como texto",()=>{for(const n of [9007199254740993n,-9007199254740993n])assert.equal(jsonSafe({n}).n,n.toString());});
test("datas e campos comuns mantêm formato JSON e origem não é alterada",()=>{const date=new Date("2026-10-19T23:00:00Z"),value={date,n:null,sizeBytes:2n,ok:true};assert.deepEqual(jsonSafe(value),{date:date.toISOString(),n:null,sizeBytes:2,ok:true});assert.equal(value.sizeBytes,2n);});
