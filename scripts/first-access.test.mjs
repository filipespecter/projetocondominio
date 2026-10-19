import test from 'node:test';
import assert from 'node:assert/strict';
import { completeFirstAccess } from '../src/utils/completeFirstAccess.js';
const data={portalType:'sindico',username:'teste',currentPassword:'temporaria',newPassword:'NovaSenha!2026',newPasswordConfirmation:'NovaSenha!2026'};
test('erro de senha não inicia outro login; nova tentativa pode concluir',async()=>{
 const calls=[];let fail=true;const auth={changePassword:async()=>{calls.push('change');if(fail)throw Object.assign(new Error('Senha atual incorreta. Tente novamente.'),{status:400});},login:async v=>{assert.equal(v.password,data.newPassword);calls.push('login');},me:async()=>{calls.push('me');return {id:1};}};
 await assert.rejects(completeFirstAccess(auth,data),e=>e.status===400&&!e.passwordChanged);assert.deepEqual(calls,['change']);fail=false;
 assert.deepEqual(await completeFirstAccess(auth,data),{id:1});assert.deepEqual(calls,['change','change','login','me']);
});
test('login após troca precisa funcionar antes de consultar a sessão',async()=>{
 let me=false;const auth={changePassword:async()=>{},login:async()=>{throw Error('offline');},me:async()=>{me=true;}};
 await assert.rejects(completeFirstAccess(auth,data),e=>e.passwordChanged===true);assert.equal(me,false);
});
test('falha de me após troca mantém indicação de senha já alterada',async()=>{
 await assert.rejects(completeFirstAccess({changePassword:async()=>{},login:async()=>{},me:async()=>{throw Error('offline');}},data),e=>e.passwordChanged===true);
});
