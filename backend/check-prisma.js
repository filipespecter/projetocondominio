import prisma from "./src/config/prisma.js";

/**
 * =====================================================
 * VERIFICAÇÃO TEMPORÁRIA DO BANCO
 * =====================================================
 *
 * Confirma:
 *
 * 1. valores atuais do enum CondominiumStatus;
 * 2. valor DEFAULT da coluna Condominium.status.
 */

try {
  const enums =
    await prisma.$queryRawUnsafe(`
      SELECT enumlabel
      FROM pg_enum e
      JOIN pg_type t
        ON e.enumtypid = t.oid
      WHERE t.typname = 'CondominiumStatus'
      ORDER BY e.enumsortorder;
    `);

  const defaultStatus =
    await prisma.$queryRawUnsafe(`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Condominium'
        AND column_name = 'status';
    `);

  console.log(
    "\n===== ENUM CondominiumStatus ====="
  );

  console.table(enums);

  console.log(
    "\n===== DEFAULT Condominium.status ====="
  );

  console.table(defaultStatus);
} catch (error) {
  console.error(
    "Erro ao verificar banco:"
  );

  console.error(error);
} finally {
  await prisma.$disconnect();
}