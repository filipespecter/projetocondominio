-- BLOCO 10.1-B
-- Hierarquia interna da Central Star Infinity Code.
-- O OWNER é o criador geral; ADMIN é N2; SUPPORT é suporte.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PLATFORM_OWNER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PLATFORM_SUPPORT';
