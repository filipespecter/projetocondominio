import env from "../src/config/env.js";
import test from 'node:test';
import assert from 'node:assert/strict';
import { WahaConnectionService } from '../src/services/WahaConnectionService.js';
import { WahaProvider } from '../src/services/providers/WahaProvider.js';
import { DualChannelPackageNoticeService } from '../src/services/DualChannelPackageNoticeService.js';
import { unseal, seal } from '../src/utils/MessagingSecrets.js';
import { packageEmail } from '../src/utils/packageEmail.js';
env.JWT_ACCESS_SECRET = "test-only-waha-confirmation-secret-0123456789";
const tenant = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const packageId = '33333333-3333-4333-8333-333333333333';
const user = { id:'admin', name:'Síndico', role:'CONDOMINIUM_ADMIN', condominiumId:tenant };
const registry = { [tenant]:{ condominiumId:tenant, baseUrl:`http://infinitycondo-waha-${tenant}:3000`, apiKey:'a'.repeat(64) } };
function harness({status='WORKING',metadata=tenant,current=null,duplicate=false,response}={}) {
  process.env.MESSAGING_ENCRYPTION_KEY = 'e'.repeat(64);
  let row = current;
  const requests=[],audits=[];
  const db={ wahaProvisioning:{findUnique:async()=>({enabled:true,state:"READY",condominium:{status:"ACTIVE",deletedAt:null}})}, tenantMessagingConfig:{findUnique:async()=>row, findFirst:async()=>duplicate?{}:null,
    upsert:async({create,update})=>{row=row?{...row,...update}:create;return row;},
    update:async({data})=>{row={...row,...data};return row;}, updateMany:async({data})=>{row={...row,...data};return {count:1};}},auditLog:{create:async({data})=>{audits.push(data);}} };
  db.$transaction=async fn=>fn(db);
  const transport=async(url,options)=>{
    requests.push({url,options});
    const data=response ? response(url,options) : url.endsWith('/auth/qr') ? {mimetype:'image/png',data:'aGVsbG8='} : {name:'default',status,config:{metadata:{condominiumId:metadata}},me:{id:'5581999990000@c.us'}};
    return {status:200,ok:true,json:async()=>data};
  };
  return { service:new WahaConnectionService(db,transport,registry), requests,audits,row:()=>row,db };
}
test('WAHA rejeita porteiro em conexão, QR e desconexão antes de consultar rede',async()=>{
 const h=harness();for(const fn of [()=>h.service.start({...user,role:'DOORMAN'}),()=>h.service.status({...user,role:'DOORMAN'},true),()=>h.service.disconnect({...user,role:'DOORMAN'},true)]) await assert.rejects(fn,e=>e.statusCode===403);
 assert.equal(h.requests.length,0);
});
test('WAHA usa instância fixa por condomínio; não aceita sessão de outro tenant',async()=>{
 const h=harness({metadata:other});await assert.rejects(h.service.status(user),e=>e.statusCode===409);assert.equal(h.row(),null);
 await assert.rejects(h.service.instance(other),e=>e.statusCode===503);
 assert.equal(h.requests[0].url,`${registry[tenant].baseUrl}/api/sessions/default`);
});
test('registro WAHA não aceita URL arbitrária mesmo com chave válida',async()=>{
 const h=harness();h.service.registry={[tenant]:{...registry[tenant],baseUrl:'http://169.254.169.254'}};
 await assert.rejects(h.service.instance(tenant),e=>e.statusCode===503);assert.equal(h.requests.length,0);
});
test('WAHA conectado salva vínculo protegido sem retornar chave ou QR',async()=>{
 const h=harness();const result=await h.service.status(user,true);
 assert.equal(result.connected,true);assert.equal(result.phone,'+5581999990000');assert.equal(result.qr,null);
 assert.equal(h.row().onboardingStatus,'WAHA_READY');assert.equal(h.row().enabled,true);
 assert.equal(unseal(h.row().secrets,`whatsapp:${tenant}`).condominiumId,tenant);
 assert.ok(!JSON.stringify(result).includes(registry[tenant].apiKey));assert.equal(h.audits.length,1);
});
test('sessão desconectada desativa WhatsApp sem apagar credencial ou encomenda',async()=>{
 const h=harness({status:'STOPPED',current:{onboardingStatus:'WAHA_READY',secrets:seal({provider:'WAHA',condominiumId:tenant},`whatsapp:${tenant}`)}});
 const result=await h.service.status(user);assert.equal(result.connected,false);assert.equal(h.row().enabled,false);assert.ok(h.row().secrets);assert.equal(h.audits.length,1);
});
test('QR só é retornado na leitura solicitada pelo síndico e não entra na auditoria',async()=>{
 const h=harness({status:'SCAN_QR_CODE'});const ordinary=await h.service.status(user);assert.equal(ordinary.qr,null);assert.equal(h.requests.length,1);
 const qr=await h.service.status(user,true);assert.equal(qr.qr,'data:image/png;base64,aGVsbG8=');assert.equal(h.audits.length,0);
});
test('Meta existente não é substituída sem confirmação explícita',async()=>{
 const h=harness({current:{onboardingStatus:'READY',secrets:'encrypted-meta'}});
 await assert.rejects(h.service.start(user),e=>e.statusCode===409);assert.equal(h.requests.length,0);assert.equal(h.row().secrets,'encrypted-meta');
});
test('transição confirmada preserva configuração Meta protegida após conectar',async()=>{
 const old={onboardingStatus:'READY',secrets:'encrypted-meta',phoneNumberId:'123',enabled:true,channel:'WHATSAPP'};
 const h=harness({current:old});await h.service.start(user,true);
 const protectedConfig=unseal(h.row().secrets,`whatsapp:${tenant}`);assert.equal(protectedConfig.previousMeta.secrets,'encrypted-meta');assert.equal(protectedConfig.provider,'WAHA');
});
test('número já vinculado a outro condomínio impede ativação',async()=>{
 const h=harness({duplicate:true});await assert.rejects(h.service.status(user),e=>e.statusCode===409);assert.equal(h.row(),null);
});
test('WAHA timeout no POST fica incerto sem expor erro ou credenciais',async()=>{
 const h=harness();h.service.transport=async()=>{throw Error('private-secret');};
 await assert.rejects(h.service.request(tenant,'/api/sendImage',{method:'POST',body:{}}),e=>e.statusCode===502&&!e.message.includes('private-secret'));
});
test('provedor WAHA só envia se conectado, com QR e texto numa única mensagem',async()=>{
 const calls=[];const connection={session:async()=>({status:'WORKING'}),request:async(...args)=>{calls.push(args);return args[1].startsWith('/api/contacts/check-exists?')?{numberExists:true,chatId:'5581999990000@c.us'}:{id:'message-1'};}};
 const provider=new WahaProvider(tenant,connection);
 const result=await provider.send({recipient:'81999990000',content:'Mensagem com código 123456',attachments:[{filename:'retirada.png',content:'cG5n'}]});
 assert.equal(calls.length,2);assert.match(calls[0][1],/^\/api\/contacts\/check-exists\?/);assert.equal(calls[1][1],'/api/sendImage');assert.equal(calls[1][2].body.chatId,'5581999990000@c.us');assert.equal(calls[1][2].body.file.data,'cG5n');assert.equal(result.metadata.delivery,'UNCONFIRMED');
 connection.session=async()=>({status:'STOPPED'});await assert.rejects(provider.send({recipient:'81999990000',content:'aviso'}),e=>e.statusCode===503);assert.equal(calls.length,2);
});
function noticeHarness(send=async()=>({queued:true,communication:{status:'SENT'}})) {
 const audits=[],calls=[];
 const data={fingerprint:'stable',pkg:{id:packageId,apartmentId:'apartment-a',status:'RECEIVED',type:'Caixa',description:'Teste',receivedAt:new Date('2026-11-07T10:00:00Z'),apartment:{id:'apartment-a',block:'A',number:'101'}},residents:[{id:'resident-a',userId:'user-a',whatsappOptIn:true,user:{name:'João',email:'joao@example.com',phone:'81999990000'}}],contacts:[]};
 const db={condominium:{findUnique:async()=>({name:'Condomínio Teste'})},auditLog:{create:async({data})=>{audits.push(data);}}};
 const communication={queueAndSend:async input=>{calls.push(input);return send(input);}};
 return {data,audits,calls,db,service:new DualChannelPackageNoticeService(db,communication,async()=>data)};
}
async function confirmed(h, changes={}) {const p=await h.service.preview(user,packageId);return {confirmation:p.confirmation,confirmed:true,mode:'BOTH',emailRecipient:'resident:resident-a',whatsappRecipient:'resident:resident-a',...changes};}
test('aviso padrão é ambos e ambos usam a mesma encomenda sem expor credencial na prévia',async()=>{
 const h=noticeHarness();const preview=await h.service.preview(user,packageId);assert.equal(preview.defaultMode,'BOTH');assert.equal(preview.qrToken,undefined);
 await h.service.confirm(user,packageId,await confirmed(h));assert.deepEqual(h.calls.map(c=>c.channel).sort(),['EMAIL','WHATSAPP']);assert.ok(h.calls.every(c=>c.referenceId===packageId&&c.condominiumId===tenant&&c.metadata.dualChannelV1));
});
test('e-mail é iniciado mesmo enquanto WhatsApp não responde; falha não cancela outro canal',async()=>{
 let release;const barrier=new Promise(resolve=>{release=resolve;});
 const h=noticeHarness(async input=>{if(input.channel==='WHATSAPP'){await barrier;throw Error('desconectado');}return {queued:true,communication:{status:'SENT'}};});
 const task=h.service.confirm(user,packageId,await confirmed(h));
 await new Promise(resolve=>setImmediate(resolve));assert.equal(h.calls.length,2);release();const result=await task;assert.equal(result.results.find(r=>r.channel==='EMAIL').failed,false);assert.equal(result.results.find(r=>r.channel==='WHATSAPP').failed,true);
});
test('somente e-mail e somente WhatsApp respeitam seleção explícita',async()=>{
 for(const mode of ['EMAIL','WHATSAPP']) {const h=noticeHarness();await h.service.confirm(user,packageId,await confirmed(h,{mode}));assert.deepEqual(h.calls.map(c=>c.channel),[mode]);}
});
test('telefone sem consentimento falha visivelmente e preserva envio de e-mail',async()=>{
 const h=noticeHarness();h.data.residents[0].whatsappOptIn=false;
 const result=await h.service.confirm(user,packageId,await confirmed(h));assert.equal(h.calls.length,1);assert.equal(h.calls[0].channel,'EMAIL');assert.equal(result.results.find(r=>r.channel==='WHATSAPP').failed,true);assert.equal(h.audits.filter(a=>a.action==='SEND_FAILED').length,1);
});
test('destinatário externo ao apartamento não pode receber a mensagem',async()=>{
 const h=noticeHarness();const result=await h.service.confirm(user,packageId,await confirmed(h,{mode:'WHATSAPP',whatsappRecipient:'resident:foreign'}));assert.equal(h.calls.length,0);assert.equal(result.results[0].failed,true);
});
test('contato alterado, confirmação ausente e token de outro operador impedem disparo',async()=>{
 const h=noticeHarness();const input=await confirmed(h);h.data.residents[0].user.email='changed@example.com';
 await assert.rejects(h.service.confirm(user,packageId,input),e=>e.statusCode===409);assert.equal(h.calls.length,0);
 await assert.rejects(h.service.confirm(user,packageId,{...input,confirmed:false}),e=>e.statusCode===422);
 await assert.rejects(h.service.confirm({...user,id:'other-admin'},packageId,input));assert.equal(h.calls.length,0);
});
test('auditoria indisponível impede novos disparos antes das chamadas externas',async()=>{
 const h=noticeHarness();const input=await confirmed(h);h.db.auditLog.create=async()=>{throw Error('database unavailable');};await assert.rejects(h.service.confirm(user,packageId,input));assert.equal(h.calls.length,0);
});
test('HTML de e-mail escapa nome e dados da encomenda',()=>{
 const email=packageEmail({condominiumName:'<script>x</script>',recipientName:'<img src=x>',apartmentLabel:'A 101',packageRecord:{type:'Caixa',receivedAt:new Date()},instructions:'Código 123456'});assert.ok(!email.html.includes('<script>'));assert.ok(email.html.includes('&lt;script&gt;'));
});

test('envio real do serviço anexa o mesmo QR nos dois canais sem alterar a credencial', async t=>{
 const [{default:communication},{default:repo},{default:db},{default:credentials},{default:providers},{default:audits},{default:QRCode}] = await Promise.all([
   import('../src/services/CommunicationService.js'),import('../src/repositories/CommunicationLogRepository.js'),import('../src/config/prisma.js'),import('../src/services/PackageCredentialService.js'),import('../src/services/CommunicationProviderService.js'),import('../src/services/AuditLogService.js'),import('qrcode')]);
 const logs={email:{id:'email',condominiumId:tenant,recipientUserId:'user-a',channel:'EMAIL',recipient:'joao@example.com',module:'PACKAGE',referenceId:packageId,status:'PENDING',contentSnapshot:'Encomenda chegou.',metadata:{dualChannelV1:true,pickupCredential:true,recipientName:'João',condominiumName:'Condomínio Teste',apartmentLabel:'A 101',observation:'Retirar no balcão'}},whatsapp:{id:'whatsapp',condominiumId:tenant,recipientUserId:'user-a',channel:'WHATSAPP',recipient:'5581999990000',module:'PACKAGE',referenceId:packageId,status:'PENDING',contentSnapshot:'Encomenda chegou.',metadata:{dualChannelV1:true,pickupCredential:true,recipientName:'João',condominiumName:'Condomínio Teste',apartmentLabel:'A 101',observation:'Retirar no balcão'}}};
 const sent=[];let ensures=0;
 t.mock.method(repo,'findById',async id=>({...logs[id]}));t.mock.method(repo,'markAttempt',async id=>logs[id]);t.mock.method(repo,'markSent',async(id,data)=>{logs[id]={...logs[id],status:'SENT',...data};return logs[id];});
 const originals=[db.package.findFirst,db.resident.findFirst];t.after(()=>{[db.package.findFirst,db.resident.findFirst]=originals;});
 db.package.findFirst=async()=>({id:packageId,condominiumId:tenant,apartmentId:'apartment-a',status:'RECEIVED',type:'Caixa',receivedAt:new Date()});
 db.resident.findFirst=async()=>({apartmentId:'apartment-a',canViewPackages:true,whatsappOptIn:true,user:{status:'ACTIVE',phone:'81999990000',email:'joao@example.com'}});
 t.mock.method(credentials,'ensure',async()=>{ensures++;return {code:'123456',qrToken:'same-secure-existing-pickup-token'};});
 t.mock.method(providers,'send',async value=>{sent.push(value);return {provider:value.channel==='EMAIL'?'RESEND':'WAHA',providerMessageId:'id-'+value.channel};});
 t.mock.method(audits,'createLog',async()=>{});
 await communication.send('email',user);await communication.send('whatsapp',user);
 assert.equal(sent.length,2);assert.equal(ensures,2);
 for (const message of sent) {
   assert.match(message.content, /Unidade: A 101/);
   assert.match(message.content, /Observação da portaria: Retirar no balcão\n\nCódigo de retirada:/);
 }
 assert.match(sent[0].html, /Retirar no balcão/);assert.equal(sent[0].attachments[0].content,sent[1].attachments[0].content);
 const expected=await QRCode.toBuffer('same-secure-existing-pickup-token',{type:'png',width:420,margin:4,errorCorrectionLevel:'M'});
 assert.equal(sent[0].attachments[0].content,expected.toString('base64'));assert.match(sent[0].html,/cid:pickup-qr/);assert.match(sent[1].content,/123456/);
 assert.ok(!JSON.stringify(logs).includes('same-secure-existing-pickup-token'));
 await communication.send('email',user);assert.equal(sent.length,2);
});

test('consulta de entrega valida tenant, mensagem e ACK antes de registrar entregue',async()=>{
 const h=harness({response:url=>url.includes('/messages/')?{id:'provider-message',fromMe:true,ack:2}:{name:'default',status:'WORKING',config:{metadata:{condominiumId:tenant}},me:{id:'5581999990000@c.us'}}});
 let update;
 h.db.communicationLog={findFirst:async({where})=>{assert.equal(where.condominiumId,tenant);return {id:packageId,status:'SENT',provider:'WAHA',providerMessageId:'provider-message',recipient:'5581999990000'};},updateMany:async args=>{update=args;return {count:1};}};
 const result=await h.service.checkDelivery({...user,role:'DOORMAN'},packageId);assert.equal(result.status,'DELIVERED');assert.equal(update.where.condominiumId,tenant);assert.equal(update.where.status,'SENT');assert.ok(h.audits.some(a=>a.action==='DELIVERED'));
});
test('ACK sem entrega e mensagem divergente não marcam entregue nem disparam mensagens',async()=>{
 for(const receipt of [{id:'provider-message',fromMe:true,ack:1},{id:'other-message',fromMe:true,ack:3},{id:'provider-message',fromMe:false,ack:3}]) {
  const h=harness({response:url=>url.includes('/messages/')?receipt:{name:'default',status:'WORKING',config:{metadata:{condominiumId:tenant}}}});let writes=0;
  h.db.communicationLog={findFirst:async()=>({id:packageId,status:'SENT',provider:'WAHA',providerMessageId:'provider-message',recipient:'5581999990000'}),updateMany:async()=>{writes++;}};
  const result=await h.service.checkDelivery(user,packageId);assert.equal(result.status,'SENT');assert.equal(writes,0);assert.ok(h.requests.every(r=>r.options.method==='GET'));
 }
});

test('personalização respeita a confirmação e o limite; HTML não interpreta a observação', async () => {
 const h=noticeHarness();
 const input=await confirmed(h,{observation:'  <b>Retirar no balcão</b>  '});
 await assert.rejects(h.service.confirm(user,packageId,{...input,confirmed:false}),e=>e.statusCode===422);
 await assert.rejects(h.service.confirm(user,packageId,{...input,observation:'x'.repeat(401)}),e=>e.statusCode===422);
 assert.equal(h.calls.length,0);
 await h.service.confirm(user,packageId,input);
 assert.equal(h.calls.length,2);
 assert.ok(h.calls.every(call=>call.metadata.observation==='<b>Retirar no balcão</b>'));
 const email=packageEmail({packageRecord:h.data.pkg,observation:h.calls[0].metadata.observation,instructions:'Apresente o código.'});
 assert.match(email.html,/&lt;b&gt;Retirar no balcão&lt;\/b&gt;/);
 assert.ok(!email.html.includes('<b>Retirar no balcão</b>'));
});
test('observação da retirada é opcional e limitada, sem substituir a credencial', async () => {
 const {confirmPickupSchema}=await import('../src/validators/packageValidator.js');
 const input={method:'CODE',value:'123456',isPrimary:true,pickupNote:'  Retirada no balcão.  '};
 assert.equal(confirmPickupSchema.parse(input).pickupNote,'Retirada no balcão.');
 assert.equal(confirmPickupSchema.safeParse({...input,pickupNote:'x'.repeat(401)}).success,false);
 assert.equal(confirmPickupSchema.safeParse({...input,value:undefined}).success,false);
});
