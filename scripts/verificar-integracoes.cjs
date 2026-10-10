/* Diagnóstico somente leitura. Nunca imprime chaves ou envia mensagens/cobranças. */
const {execFileSync} = require('node:child_process');
const production = process.argv.includes('--production');
const args = ['compose', '-f', production ? 'compose.production.yaml' : 'compose.yaml'];
if (production) args.push('-f', 'compose.recovery.production.yaml');
args.push('exec','-T','backend','node','--input-type=module');
const input = `
console.log('CHAVE DE COMUNICACAO: ' + (/^[a-fA-F0-9]{64}$/.test(process.env.MESSAGING_ENCRYPTION_KEY||'') ? 'CONFIGURADA (valor oculto)' : 'AUSENTE ou invalida'));
for (const key of ['EMAIL_API_KEY','EMAIL_FROM','MERCADO_PAGO_ACCESS_TOKEN','MERCADO_PAGO_WEBHOOK_SECRET']) console.log(key + ': ' + (String(process.env[key] ?? '').trim() ? 'CONFIGURADO (valor oculto)' : 'AUSENTE'));
console.log('EMAIL_PROVIDER: ' + (process.env.EMAIL_PROVIDER||'AUSENTE'));
console.log('MERCADO_PAGO_ENABLED: ' + (process.env.MERCADO_PAGO_ENABLED === 'true' ? 'ATIVO' : 'DESATIVADO'));
const {default:prisma} = await import('./src/config/prisma.js');
try {
 const channels = await prisma.tenantMessagingConfig.groupBy({by:['channel','enabled'],_count:{_all:true}});
 console.log('CANAIS POR CONDOMINIO (sem dados pessoais): ' + JSON.stringify(channels));
 const accounts = await prisma.user.groupBy({by:['role'],where:{role:{in:['PLATFORM_OWNER','PLATFORM_ADMIN','PLATFORM_SUPPORT']},status:'ACTIVE',deletedAt:null,condominiumId:null},_count:{_all:true}});
 console.log('CONTAS INTERNAS ATIVAS (sem dados pessoais): ' + JSON.stringify(accounts));
} finally { await prisma.$disconnect(); }
`;
try { process.stdout.write(execFileSync('docker',args,{input,encoding:'utf8',maxBuffer:1024*1024})); }
catch { console.error('Diagnóstico não concluído. Confira os arquivos Compose e o backend ativo.');process.exitCode=1; }
