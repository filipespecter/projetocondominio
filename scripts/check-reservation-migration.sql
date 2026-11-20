BEGIN READ ONLY;
WITH active AS (
  SELECT "id", "condominiumId", "commonAreaId", "reservationDate", "startTime", "endTime",
    ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "startTime" < "endTime") AS valid
  FROM "Reservation" WHERE "deletedAt" IS NULL AND "status" IN ('APPROVED','PENDING')
)
SELECT
  (SELECT count(*) FROM active WHERE valid IS NOT TRUE) AS invalid_active_slots,
  (SELECT count(*) FROM active a JOIN active b ON a.id < b.id
    AND a."condominiumId"=b."condominiumId" AND a."commonAreaId"=b."commonAreaId"
    AND a."reservationDate"=b."reservationDate" AND a."startTime"<b."endTime"
    AND b."startTime"<a."endTime" WHERE a.valid AND b.valid) AS overlapping_pairs,
  EXISTS (SELECT 1 FROM pg_extension WHERE extname='btree_gist') AS btree_gist_installed,
  EXISTS (SELECT 1 FROM pg_available_extensions WHERE name='btree_gist') AS btree_gist_available,
  has_database_privilege(current_database(), 'CREATE') AS role_has_database_create;
COMMIT;
