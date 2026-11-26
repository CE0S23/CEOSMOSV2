-- 1.4.0: bloquear/desbloquear usuarios queda en la bitácora.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_STATUS_CHANGE';
