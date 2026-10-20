import test from 'node:test';
import assert from 'node:assert/strict';
import { enforceLoginLock } from '../src/utils/loginLock.js';
test('bloqueio ativo não renova prazo ou escreve no banco',async()=>{const now=new Date('2026-10-19T23:00:00Z'),until=new Date('2026-10-19T23:05:00Z');let writes=0;await assert.rejects(enforceLoginLock({id:'x',lockedUntil:until},{user:{updateMany:async()=>{writes++;}}},now),e=>e.statusCode===429&&e.details.lockedUntil===until);assert.equal(writes,0);});
test('bloqueio expirado zera contador com condição contra concorrência',async()=>{const now=new Date('2026-10-19T23:05:00Z');let args;await enforceLoginLock({id:'x',lockedUntil:now},{user:{updateMany:async v=>{args=v;}}},now);assert.deepEqual(args,{where:{id:'x',lockedUntil:{lte:now}},data:{failedLoginAttempts:0,lockedUntil:null}});});
test('conta sem bloqueio não escreve no banco',async()=>{await enforceLoginLock({id:'x',lockedUntil:null},{},new Date());await enforceLoginLock(null,{});});
