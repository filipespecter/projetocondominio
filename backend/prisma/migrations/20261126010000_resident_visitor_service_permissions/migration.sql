-- Novas permissões do morador: convidar visitantes e solicitar prestadores.
-- Padrão "liberado" (true), igual às permissões já existentes: nada muda
-- para os moradores atuais até o síndico desmarcar.
ALTER TABLE "Resident" ADD COLUMN "canInviteVisitors" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Resident" ADD COLUMN "canRequestServices" BOOLEAN NOT NULL DEFAULT true;
