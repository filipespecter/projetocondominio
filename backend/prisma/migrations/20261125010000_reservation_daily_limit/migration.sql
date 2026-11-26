-- Garante no banco a regra "1 reserva ativa por morador por dia",
-- inclusive quando chegam pedidos simultâneos (clique duplo, dois aparelhos).
-- Vale para reservas criadas a partir desta versão: registros antigos
-- duplicados (se existirem) não impedem a migração.
CREATE UNIQUE INDEX "Reservation_one_active_per_user_day"
  ON "Reservation" ("condominiumId", "requestedByUserId", "reservationDate")
  WHERE "deletedAt" IS NULL
    AND "status" IN ('PENDING', 'APPROVED')
    AND "createdAt" >= TIMESTAMP '2026-11-25 00:00:00';
