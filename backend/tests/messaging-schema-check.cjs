// Diagnóstico somente de leitura, após prisma migrate deploy em Homolog.
(async()=>{
  const {default:prisma}=await import("../src/config/prisma.js");
  try {
    await prisma.apartmentContact.count();
    await prisma.messagingConnectionAttempt.count();
    await prisma.tenantMessagingConfig.findFirst({select:{condominiumId:true,wabaId:true,onboardingStatus:true,templateStatus:true,webhookSubscribed:true}});
    if(!/^[a-fA-F0-9]{64}$/.test(process.env.MESSAGING_ENCRYPTION_KEY||"")) throw new Error("Chave de comunicação ausente ou inválida; preserve a chave existente.");
    console.log("CONTATOS_MIGRACAO_E_CHAVE_OK — consulta sem alteração de registros.");
  } finally {await prisma.$disconnect();}
})().catch(()=>{console.error("VERIFICACAO_NAO_CONCLUIDA: confira migration, conexão do banco e configuração privada da chave.");process.exitCode=1;});
