# Evidencia — Práctica 5-6 (DOM y Task Manager CRUD)

## Migraciones aplicadas y estado de la DB

```
$ node tls-proxy.js 5433   # proxy TLS local (Neon IPv4)
TLS proxy: 127.0.0.1:5433 -> 3.227.221.118:5432

$ node run-migrate-local.js migrate status
2 migrations found in prisma/migrations
Database schema is up to date!
```

Tablas verificadas con cliente pg directo:
`EmailToken, MediaItem, Passkey, Preferences, Session, Task, User, _prisma_migrations`

Migraciones registradas:
```
20260731150000_add_task_model        (enums TaskStatus/TaskPriority, tabla Task, índice, FK)
20260731150001_add_completed_at_to_task  (columna completedAt)
```

## Workaround de conectividad (Neon + Windows + Prisma CLI)

**Problema**: el hostname `ep-green-hall-anvbwgw9.c-6.us-east-1.aws.neon.tech` resuelve a IPv6 (AAAA) no alcanzable y IPv4 (A) alcanzable. El motor Rust de Prisma CLI elige IPv6 → `P1001 Can't reach database server`. El cliente Node (`pg`, `@neondatabase/serverless`) funciona por IPv4.

**Soluciones probadas y resultado**:
1. IP literal → `P1010 User neondb_owner was denied access` (Neon requiere hostname para enrutar).
2. `hostaddr=` en la URL → sigue `P1001` (el motor Rust no respeta el parámetro).
3. **Proxy TLS local (solución final)**: `tls-proxy.js` escucha en `127.0.0.1:5433`, responde al `SSLRequest` de PostgreSQL con `'S'`, termina TLS con certificado autofirmado y reenvía por IPv4 a Neon con SNI real. Requiere `channel_binding=disable` en la URL porque el motor Prisma usa `SCRAM-SHA-256-PLUS` y el binding sobre el cert autofirmado local no coincide con el de Neon.
4. `prisma migrate diff --from-schema-datamodel schema-old.prisma --to-schema-datamodel prisma/schema.prisma --script` genera el SQL sin conexión (usado para crear las migraciones).

Estos scripts (`tls-proxy.js`, `run-migrate-local.js`) son temporales y no forman parte del producto; el runtime de la app usa el adaptador Neon de Node que no padece el problema.

## Compilación backend

```
$ cd ceosmos-api && npx nest build
(OK, sin errores — TasksModule registrado en app.module.ts)
```

## Compilación frontend

```
$ cd frontend && npx ng build
Build at: 2026-07-31T20:38:50.267Z - Hash: c64477f3a79d684c - Time: 33256ms
(OK — solo warnings de budget preexistentes: login.component.scss y bundle inicial)
```

Chunks lazy generados:
```
src_app_practicas_dom-demo_dom-demo_component_ts.js        (37.54 kB)
src_app_practicas_task-manager_task-manager_component_ts.js (69.49 kB)
```

## Pruebas unitarias

```
$ cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
TOTAL: 14 SUCCESS   (9 previos + 5 nuevos de TasksService)
```

## API en ejecución

```
$ node dist/main.js
CEOSMOS API running on port 8080
Mapped {/api/tasks, GET} route
Mapped {/api/tasks, POST} route
Mapped {/api/tasks/:id, PATCH} route
Mapped {/api/tasks/:id, DELETE} route
```

```
$ curl -i http://localhost:8080/api/tasks
HTTP/1.1 401 Unauthorized   (protegido por JwtAuthGuard, sin sesión)
```
