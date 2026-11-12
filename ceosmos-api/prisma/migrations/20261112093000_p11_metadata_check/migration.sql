-- Práctica 11 · Corrección de la regresión detectada al verificar P11-D04 en el S24.
-- La API limita metadata a 4096 bytes de JSON compacto, pero el CHECK anterior medía
-- metadata::text, que PostgreSQL escribe con un espacio tras cada ',' y ':'; un cuerpo
-- válido para la API (3.8 KB) violaba el CHECK y respondía 500.
-- El límite de negocio queda en la API; la BD conserva una red de seguridad de 8 KB
-- (la forma de texto de JSONB nunca supera el doble del JSON compacto).
ALTER TABLE "FocusSession" DROP CONSTRAINT "FocusSession_metadata_tamano_check";
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_metadata_tamano_check"
  CHECK ("metadata" IS NULL OR octet_length("metadata"::text) <= 8192) NOT VALID;
