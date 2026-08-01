# Práctica 11-12 — Módulo Administrativo CEOSMOS (usuarios, roles, auditoría)

**Entregable**: módulo administrativo completo con gestión de usuarios, roles/permisos y bitácora de auditoría, más controles de seguridad base (bloqueo por intentos, política de contraseña, protección CSRF y expiración de sesión). Cierre de las 12 prácticas con **4 commits reales** por checkpoint.

## Objetivo

Transformar la plataforma CEOSMOS en un sitio con administración real:

- Backend NestJS con CRUD de usuarios, cambio de rol, permisos por rol y auditoría inmutable.
- Frontend Angular 18 con tres vistas admin: `/admin/usuarios`, `/admin/roles`, `/admin/bitacora`.
- Controles base de seguridad sobre el modelo existente (Auth, Sesiones, JWT en cookie).

## 11. Checkpoints y commits reales

| CP | Contenido | Commit |
|----|-----------|--------|
| 1 | Modelo de datos admin/auditoría y controles base de seguridad | `1d02fef` |
| 2 | Administración de usuarios (alta, edición, baja lógica, activación) | `0583f2a` |
| 3 | Gestión de roles y visualización de permisos | `cca3dc5` |
| 4 | Auditoría, protección CSRF y expiración de sesión | (por cerrar) |

Cada checkpoint se cerró tras validar: `git status`, `git diff --stat`, `ng build --configuration development`, `ng test --watch=false` y `npm run build` (backend), todo en verde.

## CP1 — Modelo de datos y controles base

### Schema Prisma (`ceosmos-api/prisma/schema.prisma`)

- `User` gana: `active Boolean @default(true)`, `failedLoginAttempts Int @default(0)`, `lockedUntil DateTime?`.
- Nuevo modelo `AuditLog` con índices en `userId`, `action` y `timestamp`.
- Nuevo enum `AuditAction { LOGIN, LOGOUT, PASSWORD_CHANGE, USER_CREATE, USER_DELETE, ROLE_CHANGE }`.

### Migración aplicada

La migración `prisma/migrations/20260731170000_add_admin_security_audit/migration.sql` se aplicó sobre Neon usando el mismo adaptador WebSocket de la app (el CLI de Prisma no conecta por TCP local en Windows; ver `cb0db78`), insertando el registro en `_prisma_migrations`. Verificado en BD: columnas, enum, tabla e índices presentes.

### Controles de seguridad

- **Bloqueo de login** (`auth.service.ts`): 5 intentos fallidos → `lockedUntil = now + 15 min` y rechazo de credenciales; el intento exitoso resetea contador y candado; el usuario inactivo (`active:false`) no puede iniciar sesión.
- **Política de contraseña**: mín. 8 caracteres, mayúscula, minúscula, número y **símbolo** (`PASSWORD_PATTERN` en auth y `ADMIN_PASSWORD_PATTERN` en admin, mismas regex en el frontend).
- **Expiración de sesión** (reforzada): JWT 7 días (`expiresIn:'7d'`) + sesión en BD con `expiresAt` (7 días); `jwt.strategy.ts` valida en cada request que la sesión exista y no esté vencida, eliminándola si caducó.

## CP2 — Administración de usuarios

### Backend (`ceosmos-api/src/admin/`)

Endpoints en `AdminUsersController` (`/admin/users`, todos `JwtAuthGuard` + `RolesGuard` + `@Roles('ADMIN')`):

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/users` | Lista usuarios activos (sin `deletedAt`) |
| POST | `/admin/users` | Alta con password fuerte y email único |
| PATCH | `/admin/users/:id` | Edición de email/username |
| PATCH | `/admin/users/:id/role` | Cambio de rol |
| PATCH | `/admin/users/:id/status` | Activar/desactivar |
| PATCH | `/admin/users/:id/password` | Reset de contraseña (cierra sesiones) |
| DELETE | `/admin/users/:id` | Baja lógica (`active:false` + `deletedAt`) y logout de sesiones |

Protecciones: un admin no puede darse de baja a sí mismo ni autodesasignarse el rol ADMIN (evita quedar sin administradores).

### Frontend (`frontend/src/app/features/admin/admin-users/`)

- `AdminUsersComponent` standalone con `ReactiveFormsModule` y 3 modales (crear, editar, cambiar contraseña), validaciones de política de contraseña y estados de carga/error.
- `adminGuard` protege las rutas `/admin/*` y el header filtra el usuario actual (no se auto-administra).

## CP3 — Roles y permisos

- `GET /admin/roles` devuelve `ROLES_PERMISSIONS`: `ADMIN` (11 permisos, incl. `admin.audit.view`) y `USER` (3 básicos).
- `AdminRolesComponent` en `/admin/roles`: selector de rol por usuario (deshabilitado para el propio admin) + tarjetas de solo lectura con `keyvalue` y etiquetas en español.
- `permissionLabel()` traduce los códigos de permiso a texto legible.

## CP4 — Auditoría, CSRF y expiración de sesión

### Auditoría (backend)

- `ceosmos-api/src/common/audit/`:
  - `AuditLogService` (módulo `@Global`): `log()` con try/catch (nunca rompe la operación principal), `getClientIp()` con `X-Forwarded-For` y `query()` paginada con filtros `userId/action/from/to`.
  - `@Audit('ACTION')` (decorator `AUDIT_ACTION_KEY`) + `AuditInterceptor` global (`APP_INTERCEPTOR` en `app.module.ts`) que escribe el log con el `userId` del JWT y el `targetId` del `:id` de la ruta como metadata.
- Acciones auditadas: `LOGIN`, `LOGOUT` y `PASSWORD_CHANGE` en `auth.controller.ts` (login/reset incluyen el `req.auditUserId` para no depender del JWT) y `USER_CREATE`, `ROLE_CHANGE`, `USER_DELETE`, `PASSWORD_CHANGE` en el módulo admin.
- `AdminAuditLogController`: `GET /admin/audit-log` con paginación y filtros (`AuditLogQueryDto`).

### Bitácora (frontend)

- `AdminBitacoraComponent` en `/admin/bitacora`: tabla paginada con fecha, acción, usuario, IP y detalles (metadata en `<details>`), filtros por acción/ID de usuario/fechas, y navegación admin compartida (Usuarios · Roles · Bitácora).
- `getAuditLogs()` en `admin.service.ts` con modelo `AuditLogPage`/`AuditLogEntry`.

### Protección CSRF (doble cookie + header custom)

Como la cookie de sesión es `httpOnly` y `sameSite:'none'` (cross-origin Vercel/Railway), el CSRF se resuelve con doble envío:

- Login/WebAuthn emiten además una cookie `csrfToken` **no httpOnly** (`generateCsrfToken()`).
- El interceptor HTTP de Angular lee esa cookie y la manda como header `x-csrf-token` en todo request mutante (POST/PUT/PATCH/DELETE).
- `csrfMiddleware` (`common/csrf/csrf.middleware.ts`) rechaza con 403 cualquier request mutante cuyo header no coincida con la cookie, salvo rutas públicas de auth.
- CORS permite el header `x-csrf-token`.

### Diagrama de auditoría

```
Frontend (Angular) ── POST /admin/users ──► AuditInterceptor (APP_INTERCEPTOR)
        │  x-csrf-token header                  │
        │                                       ▼
        └── Cookie csrfToken ───────────► csrfMiddleware (valida doble cookie)
                                            │
                                            ▼
                                   AdminUsersController
                                            │
                                            ▼
                                    AdminService / Prisma
                                            │  @Audit('USER_CREATE')
                                            ▼
                                       AuditLogService.log()
                                            │
                                            ▼
                                   AuditLog (tabla Neon)
```

## Estado de la rama

```
$ git rev-parse HEAD
(4 commits de esta práctica: 1d02fef, 0583f2a, cca3dc5 y el de cierre)
```

## Cómo probar en local

```
# backend
cd ceosmos-api && npm run start:dev   # API en :3000 (Neon + adaptador WS)

# frontend
cd frontend && npx ng serve           # SPA en :4200
```

- Login con cuenta ADMIN → `/admin/usuarios` (crear/editar/baja/activar/cambiar password), `/admin/roles` (cambiar rol, ver permisos), `/admin/bitacora` (ver logs de LOGIN, ROLE_CHANGE, etc.).
- Probar 5 intentos fallidos → cuenta bloqueada 15 min.
- Forzar una petición mutante sin header `x-csrf-token` → 403.
