-- Práctica 11 · Correcciones de los hallazgos White Box. Migración ADITIVA:
-- no modifica ni borra datos existentes.

-- P11-D01: idempotencia de las sesiones de enfoque (reintentos sin duplicados).
ALTER TABLE "FocusSession" ADD COLUMN "clientId" TEXT;
CREATE UNIQUE INDEX "FocusSession_userId_clientId_key" ON "FocusSession"("userId", "clientId");

-- P11-D04: tope de 4 KB para los metadatos JSONB (solo filas nuevas: NOT VALID).
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_metadata_tamano_check"
  CHECK ("metadata" IS NULL OR octet_length("metadata"::text) <= 4096) NOT VALID;

-- P11-D03: índices por usuario para la biblioteca y las sesiones de autenticación.
CREATE INDEX "MediaItem_userId_createdAt_idx" ON "MediaItem"("userId", "createdAt");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
