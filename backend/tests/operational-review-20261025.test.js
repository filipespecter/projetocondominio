import test from 'node:test';
import assert from 'node:assert/strict';
import {closureDays,closureSummary,closureDocument,verifyClosureBackup,reviewActor,previousMonth,monthPeriod,archiveCriteria,monthlySummary,monthlyDocument,closeMonth,operationPage,operationEvents,feedState,clearFeed,notifyMonthlyReview} from '../src/services/OperationalReviewService.js';
import {validateStructure,structureMetrics,saveStructure} from '../src/services/CondominiumStructureService.js';
const user={id:'11111111-1111-4111-8111-111111111111',condominiumId:'22222222-2222-4222-8222-222222222222',role:'CONDOMINIUM_ADMIN',name:'Síndico'};
const snapshotId='33333333-3333-4333-8333-333333333333';
const condominium={findUnique:async()=>({timezone:'America/Recife'})};
test('gestão autenticada apenas; arquivamento exclusivo do síndico',()=>{for(const role of ['DOORMAN','RESIDENT','PLATFORM_ADMIN'])assert.throws(()=>reviewActor({...user,role}),e=>e.statusCode===403);assert.throws(()=>reviewActor({...user,role:'MANAGER'},true));assert.throws(()=>reviewActor({...user,condominiumId:null}));reviewActor({...user,role:'MANAGER'});});
test('fechamento usa mês encerrado no fuso do condomínio inclusive virada do ano',async()=>{assert.equal(previousMonth(new Date('2026-01-01T02:00:00Z')),'2025-11');assert.equal(previousMonth(new Date('2026-01-01T04:00:00Z')),'2025-12');const d=await monthPeriod(user,'2026-02',{condominium},new Date('2026-03-02T12:00:00Z'));assert.equal(d.start.toISOString(),'2026-02-01T03:00:00.000Z');assert.equal(d.end.toISOString(),'2026-03-01T02:59:59.999Z');await assert.rejects(monthPeriod(user,'2026-03',{condominium},new Date('2026-03-02')),e=>e.statusCode===422);await assert.rejects(monthPeriod(user,'2026-13',{condominium}),e=>e.statusCode===422);});
test('arquivo seleciona somente concluídos do período; ignora alterações após emissão',()=>{const d={start:new Date('2026-09-01'),end:new Date('2026-09-30')},cutoff=new Date('2026-10-01');for(const kind of ['packages','visitors']){const q=archiveCriteria(user,d,kind,cutoff);assert.equal(q.condominiumId,user.condominiumId);assert.equal(q.deletedAt,null);assert.equal(q.operationalArchivedAt,null);assert.equal(q.updatedAt.lte,cutoff);assert.equal(q.OR.some(c=>['RECEIVED','EXPECTED','INSIDE','WAITING','AUTHORIZED'].includes(c.status)),false);}assert.ok(archiveCriteria(user,d,'packages',cutoff).receivedAt);});
test('listas paginadas e busca nunca perdem filtro de condomínio ou de arquivos',async()=>{const calls=[];const model={findMany:async q=>{calls.push(q);return [];},count:async()=>121};for(const kind of ['packages','visitors']){const r=await operationPage(user,kind,{page:'2',q:'101'},{package:model,visitor:model});assert.equal(r.total,121);const q=calls.at(-1);assert.equal(q.where.condominiumId,user.condominiumId);assert.equal(q.take,50);assert.equal(q.skip,50);assert.ok(q.where.AND);assert.ok(q.where.OR);assert.equal(q.select.passwordHash,undefined);}await assert.rejects(operationPage(user,'bad',{}),e=>e.statusCode===422);await assert.rejects(operationPage(user,'visitors',{page:'NaN'}),e=>e.statusCode===422);});
test('histórico mensal inclui arquivados apenas do condomínio e com período válido',async()=>{let query;const model={findMany:async q=>{query=q;return [];},count:async()=>0};await operationPage(user,'packages',{history:'2026-09'},{condominium,package:model});assert.equal(query.where.condominiumId,user.condominiumId);assert.equal(query.where.operationalArchivedAt,undefined);assert.ok(query.where.AND[0].OR[0].receivedAt.gte);assert.equal(query.where.AND[0].OR[1].receivedAt,null);await assert.rejects(operationPage(user,'packages',{history:'2026-99'}),e=>e.statusCode===422);});
test('histórico de operadores só lê auditoria segura do módulo e tenant solicitados',async()=>{let q;const db={auditLog:{findMany:async x=>{q=x;return [];},count:async()=>0}};await operationEvents(user,'visitors',{},db);assert.equal(q.where.module,'VISITOR');assert.equal(q.where.condominiumId,user.condominiumId);assert.equal(q.select.beforeData,undefined);assert.equal(q.take,25);});
test('resumo mensal não escreve, não exclui, conta encomendas pela data de recebimento',async()=>{const queries=[];const model={count:async q=>{queries.push(q);return 2;}};const db={condominium,package:model,visitor:model,auditLog:{findMany:async()=>[]}};const r=await monthlySummary(user,'2020-09',db);assert.equal(r.summary.packages.total,2);assert.ok(queries[0].where.receivedAt);assert.equal(queries.every(q=>q.where.condominiumId===user.condominiumId),true);});
test('formato inválido retorna erro controlado e não executa exportação',async()=>{await assert.rejects(monthlyDocument(user,{month:'2020-09',format:'EXE'},{}),e=>e.statusCode===422);});
test('arquivamento exige confirmação, documento próprio e mês correspondente antes de qualquer update',async()=>{let updates=0;const db={condominium,auditLog:{findFirst:async()=>({afterData:{month:'2020-08'}})},$transaction:fn=>fn({$executeRaw:async()=>{},package:{updateMany:()=>updates++}})};await assert.rejects(closeMonth(user,{month:'2020-09',snapshotId,confirmed:false},db),e=>e.statusCode===422);await assert.rejects(closeMonth(user,{month:'2020-09',snapshotId,confirmed:true},db,async()=>{}),e=>e.statusCode===409);assert.equal(updates,0);await assert.rejects(closeMonth(user,{month:'2020-09',snapshotId,confirmed:true},db,async()=>{throw Object.assign(new Error('Documento de outro usuário'),{statusCode:404});}),e=>e.statusCode===404);});
test('arquivamento transacional é auditado e repetição do mesmo documento não reaplica updates',async()=>{const rows=[],calls=[];const tx={$executeRaw:async()=>{},package:{updateMany:async q=>{calls.push(q);return {count:2};}},visitor:{updateMany:async q=>{calls.push(q);return {count:3};}},auditLog:{findFirst:async q=>q.where.module==='MONTHLY_DOCUMENT'?{afterData:{month:'2020-09',cutoff:'2020-10-01T12:00:00Z'}}:rows[0]||null,create:async q=>{rows.push({afterData:q.data.afterData});assert.equal(q.data.userId,user.id);return {};}}};const db={condominium,auditLog:tx.auditLog,$transaction:fn=>fn(tx)};const input={month:'2020-09',snapshotId,confirmed:true};const result=await closeMonth(user,input,db,async()=>{},async()=>snapshotId);assert.equal(result.packages,2);assert.equal(result.visitors,3);assert.equal(calls.length,2);for(const q of calls){assert.equal(q.where.condominiumId,user.condominiumId);assert.ok(q.data.operationalArchivedAt);assert.equal(q.data.deletedAt,undefined);}assert.equal((await closeMonth(user,input,db,async()=>{},async()=>snapshotId)).repeated,true);assert.equal(calls.length,2);});
test('limpar feed guarda apenas marcador pessoal e preserva limite mais recente',async()=>{const written=[];const db={auditLog:{findFirst:async q=>{assert.equal(q.where.userId,user.id);assert.equal(q.where.condominiumId,user.condominiumId);return {afterData:{clearedThrough:'2020-09-20T12:00:00.000Z'}};},create:async q=>written.push(q)}};assert.ok((await feedState(user,db)).clearedThrough);const r=await clearFeed(user,'2020-09-01T12:00:00.000Z',db);assert.equal(r.clearedThrough,'2020-09-20T12:00:00.000Z');assert.equal(written[0].data.module,'DASHBOARD_FEED');await assert.rejects(clearFeed(user,'2999-01-01T00:00:00.000Z',db),e=>e.statusCode===422);});
test('notificação mensal tem chave estável, destinatário síndico e não cria exclusões',async()=>{const ids=new Set();const db={condominium:{findMany:async()=>[{id:user.condominiumId,timezone:'America/Recife'}]},package:{count:async()=>1},visitor:{count:async()=>0},notification:{upsert:async q=>{ids.add(q.where.id);assert.equal(q.create.targetRole,'CONDOMINIUM_ADMIN');assert.equal(q.create.module,'MONTHLY_REVIEW');assert.deepEqual(q.update,{});}}};await notifyMonthlyReview(db,new Date('2026-10-25T12:00:00Z'));await notifyMonthlyReview(db,new Date('2026-10-26T12:00:00Z'));assert.equal(ids.size,1);});
test('estrutura rejeita bloco ou andar repetido e calcula dois ocupados em quarenta como 5%',()=>{assert.equal(structureMetrics({total:40},[{status:'OCCUPIED'},{status:'OCCUPIED'}]).occupancyPercent,5);const b={name:'A',floors:[{floor:1,numbers:['101']}]};assert.throws(()=>validateStructure({hasBlocks:true,blocks:[b,{...b,name:'a',floors:[{floor:2,numbers:['201']}]}]}));assert.throws(()=>validateStructure({hasBlocks:true,blocks:[{name:'A',floors:[{floor:1,numbers:['101']},{floor:1,numbers:['102']}]}]}));});
test('edição da estrutura não permite mover unidades existentes de andar silenciosamente',async()=>{let writes=0;const db={$transaction:fn=>fn({$executeRaw:async()=>{},condominium:{findUnique:async()=>({settings:{}}),update:async()=>writes++},apartment:{findMany:async()=>[{block:'A',number:'101',floor:1}]}})};await assert.rejects(saveStructure(user,{hasBlocks:true,blocks:[{name:'A',floors:[{floor:2,numbers:['101']}]}]},db),e=>e.statusCode===409);assert.equal(writes,0);});

test('emissão mensal integra prévia assinada, documento imutável e identifica operadores',async()=>{
 const crypto=await import('node:crypto'),fs=await import('node:fs/promises'),os=await import('node:os'),path=await import('node:path');
 const {default:env}=await import('../src/config/env.js');env.JWT_ACCESS_SECRET||=crypto.randomBytes(32).toString('hex');
 const cwd=process.cwd(),temporary=await fs.mkdtemp(path.join(os.tmpdir(),'ic-monthly-test-'));process.chdir(temporary);
 try{
 const logs=[];const db={condominium:{findUnique:async()=>({name:'Condomínio de teste',timezone:'America/Recife',logoUrl:null,settings:{}})},package:{findMany:async()=>[{type:'Caixa',status:'DELIVERED',receivedAt:new Date('2020-09-02T12:00:00Z'),deliveredAt:new Date('2020-09-02T13:00:00Z'),receivedBy:{name:'Porteiro A'},deliveredBy:{name:'Porteiro B'},apartment:{block:'A',number:'101'}}]},visitor:{findMany:async()=>[{name:'Visita',status:'EXITED',createdAt:new Date('2020-09-03T12:00:00Z'),registeredBy:{name:'Porteiro A'},apartment:{block:'A',number:'101'}}]},auditLog:{findFirst:async q=>logs.find(x=>Object.entries(q.where).every(([k,v])=>v===null?x[k]==null:x[k]===v))||null,upsert:async q=>{logs.push(q.create);return q.create;},create:async q=>{logs.push(q.data);return q.data;}}};
 const result=await monthlyDocument(user,{month:'2020-09',format:'CSV'},db);assert.equal(result.model.title,'FECHAMENTO MENSAL DA PORTARIA');assert.deepEqual(result.model.config.datasets,['packages','visitors']);assert.equal(result.model.logoUrl,null);assert.match(JSON.stringify(result.model.collections),/Porteiro A/);assert.match(JSON.stringify(result.model.collections),/Porteiro B/);assert.equal(logs.filter(x=>x.module==='MONTHLY_DOCUMENT').length,1);assert.ok(result.snapshotId);
 const annual=await closureDocument(user,{mode:'ANNUAL',reference:'2020-09-01',format:'CSV'},db);
 assert.equal(annual.model.title,'FECHAMENTO DA PORTARIA');
 assert.equal(annual.model.config.start,'2020-01-01');
 assert.equal(annual.model.config.end,'2020-12-31');
 }finally{process.chdir(cwd);await fs.rm(temporary,{recursive:true,force:true});}
});

test('os cinco períodos são calendários, incluindo semana de segunda a domingo e ano bissexto',()=>{
 const cases=[
  ['WEEKLY','2024-02-26','2024-03-03'],
  ['MONTHLY','2024-02-01','2024-02-29'],
  ['QUARTERLY','2024-01-01','2024-03-31'],
  ['SEMIANNUAL','2024-01-01','2024-06-30'],
  ['ANNUAL','2024-01-01','2024-12-31']
 ];
 for(const [mode,start,end] of cases){const days=closureDays({mode,reference:'2024-02-29'});assert.equal(days.start,start);assert.equal(days.end,end);}
 assert.throws(()=>closureDays({mode:'MONTHLY',reference:'2024-02-30'}),e=>e.statusCode===422);
});
test('backup ausente impede arquivamento mesmo com documento e confirmação válidos',async()=>{
 let writes=0;
 const db={condominium,auditLog:{findFirst:async q=>q.where.module==='MONTHLY_DOCUMENT'?{afterData:{month:'2020-09',cutoff:'2020-10-01T12:00:00Z'}}:null},backupRecord:{findFirst:async q=>{assert.equal(q.where.status,'VERIFIED');assert.equal(q.where.startedAt.gte.toISOString(),'2020-10-01T12:00:00.000Z');return null;}},$transaction:async()=>{writes++;}};
 await assert.rejects(closeMonth(user,{month:'2020-09',snapshotId,confirmed:true},db,async()=>{}),e=>e.statusCode===409);
 assert.equal(writes,0);
 await assert.rejects(closureSummary(user,{mode:'ANNUAL',reference:'2999-01-01'},db),e=>e.statusCode===422);
});
test('unidades agrupam antes da paginação; detalhe segue limitado ao condomínio e apartamento',async()=>{
 const calls=[],ap='44444444-4444-4444-8444-444444444444';
 const db={package:{groupBy:async q=>{calls.push(q);return [{apartmentId:ap,status:'RECEIVED',_count:{_all:78}}];},count:async()=>2,findMany:async q=>{calls.push(q);return [];}},apartment:{findMany:async q=>{assert.equal(q.where.condominiumId,user.condominiumId);return [{id:ap,block:'A',number:'101'}];}}};
 const groups=await operationPage(user,'packages',{view:'units',q:'101'},db);assert.equal(groups.units[0].count,78);assert.equal(groups.total,78);assert.equal(groups.items.length,0);
 await operationPage(user,'packages',{apartmentId:ap,page:'2'},db);
 assert.equal(calls[0].where.condominiumId,user.condominiumId);assert.equal(calls[1].where.condominiumId,user.condominiumId);assert.equal(calls[1].where.apartmentId,ap);assert.equal(calls[1].skip,50);
});

test("backup com checksum divergente não autoriza limpeza",async()=>{
 const fs=await import("node:fs/promises"),os=await import("node:os"),path=await import("node:path"),crypto=await import("node:crypto");
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),"ic-closure-backup-")),previous=process.env.BACKUP_DIRECTORY;
 process.env.BACKUP_DIRECTORY=temporary;
 try{
   const file=path.join(temporary,"test.dump"),checksum=crypto.createHash("sha256").update("copia de teste").digest("hex");
   await fs.writeFile(file,"copia de teste");
   const db={backupRecord:{findFirst:async()=>({id:snapshotId,storageKey:file,checksumSha256:checksum})}};
   assert.equal(await verifyClosureBackup(db,new Date()),snapshotId);
   await fs.writeFile(file,"conteudo alterado");
   await assert.rejects(verifyClosureBackup(db,new Date()),e=>e.statusCode===409);
 }finally{
   if(previous===undefined)delete process.env.BACKUP_DIRECTORY;else process.env.BACKUP_DIRECTORY=previous;
   await fs.rm(temporary,{recursive:true,force:true});
 }
});

test('painel de encomendas usa o recebimento real e mantém contadores do condomínio mesmo com busca',async()=>{
 const ap='44444444-4444-4444-8444-444444444444',receivedAt=new Date('2026-11-12T12:00:00Z'),calls=[];
 const db={condominium,apartment:{findMany:async()=>[{id:ap,number:'101'}]},package:{
  groupBy:async q=>{assert.equal(q.where.condominiumId,user.condominiumId);return [{apartmentId:ap,status:'RECEIVED',_count:{_all:2},_max:{receivedAt}}];},
  count:async q=>{calls.push(q.where);return q.where.status==='DELIVERED'?8:24;}
 }};
 const r=await operationPage(user,'packages',{view:'units',overviewMetrics:'true',overdue:'true',q:'101'},db);
 assert.deepEqual(r.metrics,{pending:24,deliveredToday:8});
 assert.equal(r.units[0].pending,2);assert.equal(r.units[0].lastReceivedAt,receivedAt);
 const threshold=Date.now()-3*86400000;
 assert.equal(calls[0].AND[0].status,'RECEIVED');
 assert.ok(Math.abs(+calls[0].AND[0].receivedAt.lt-threshold)<1000);
 assert.equal(calls[2].condominiumId,user.condominiumId);
 assert.equal(calls[2].OR,undefined);
 assert.equal(+calls[2].deliveredAt.lte-+calls[2].deliveredAt.gte,86400000-1);
});
test('status por canal do detalhe expõe só o resumo da encomenda no condomínio',async()=>{
 const ap='44444444-4444-4444-8444-444444444444';
 const db={condominium,package:{findMany:async q=>{assert.equal(q.where.apartmentId,ap);assert.equal(q.where.condominiumId,user.condominiumId);assert.deepEqual(q.where.status,{in:['DELIVERED','CANCELED']});return [{id:'pkg'}];},count:async()=>1},communicationLog:{
  findMany:async q=>{assert.equal(q.where.condominiumId,user.condominiumId);assert.deepEqual(q.where.referenceId.in,['pkg']);assert.equal(q.select.recipient,undefined);return [{referenceId:'pkg',channel:'WHATSAPP',status:'FAILED',metadata:{requiresReview:true,secret:'internal'}}];}
 }};
 const r=await operationPage(user,'packages',{apartmentId:ap,noticeSummary:'true',history:'2026-11',completed:'true'},db);
 assert.deepEqual(r.items[0].notices,[{channel:'WHATSAPP',status:'FAILED',uncertain:true}]);
});
