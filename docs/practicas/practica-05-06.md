# Práctica 5-6: Manipulación del DOM y Administrador de Tareas (CRUD)

## Objetivo
Implementar una demostración de manipulación directa del DOM en Angular y un administrador de tareas completo (CRUD) con backend NestJS + Prisma/Neon y frontend Angular.

## 1. Modelo de datos: `Task`

Se agregó el modelo `Task` al esquema Prisma (`ceosmos-api/prisma/schema.prisma`):

- Enums `TaskStatus` (`PENDIENTE`, `COMPLETADA`) y `TaskPriority` (`BAJA`, `MEDIA`, `ALTA`).
- Campos: `id` (uuid), `userId` (FK → `User`), `title`, `description?`, `status`, `priority`, `dueDate?`, `completedAt?`, `createdAt`, `updatedAt`.
- Relación `tasks Task[]` en `User` con borrado en cascada.
- Índice compuesto `@@index([userId, status])` para filtrar por usuario y estado.

### Migraciones
Se generaron y aplicaron 2 migraciones Prisma (la DB fue creada originalmente con `db push`, por lo que se registró el historial de migraciones desde cero):

| Migración | Contenido |
|-----------|-----------|
| `20260731150000_add_task_model` | `CREATE TYPE` de enums, tabla `Task`, índice y FK |
| `20260731150001_add_completed_at_to_task` | `ALTER TABLE "Task" ADD COLUMN "completedAt"` |

## Nota de entorno — Prisma CLI + Neon en Windows (IPv6)

**Síntoma**: `prisma migrate`/`migrate status` falla con `P1001 Can't reach database server` aunque la app (que usa el adaptador Node `@prisma/adapter-neon`) conecta sin problema.

**Causa raíz**: el hostname de Neon (`ep-*.aws.neon.tech`) resuelve a IPv6 (AAAA) no alcanzable y a IPv4 (A) alcanzable. El motor Rust de la CLI de Prisma elige IPv6; el cliente Node (`pg`, `@neondatabase/serverless`) usa IPv4.

**Workaround usado (para reproducir en otra máquina)**:
1. Resolver el hostname a IPv4 (`nslookup` / `dns.lookup`).
2. Levantar un proxy TCP local en `127.0.0.1:5433` que termine TLS con certificado autofirmado y reenvíe por IPv4 a Neon con el SNI real. Debe responder al `SSLRequest` de PostgreSQL con `'S'` y encadenar el `ClientHello` que llegue en el mismo paquete.
3. Apuntar `DATABASE_URL`/`DIRECT_URL` a `127.0.0.1:5433` y agregar `&channel_binding=disable` (el motor de Prisma usa `SCRAM-SHA-256-PLUS` y el binding contra el cert local autofirmado no coincide con el de Neon → `P1010`/error de canal).
4. Para generar SQL sin conexión: `prisma migrate diff --from-schema-datamodel <schema-viejo> --to-schema-datamodel prisma/schema.prisma --script`.

El resultado verificado fue `migrate status → "Database schema is up to date!"`. Estos scripts son solo de desarrollo; no forman parte del producto y se eliminaron del repo.

## 2. Backend: módulo `TasksModule` (`ceosmos-api/src/tasks/`)

| Archivo | Descripción |
|---------|-------------|
| `dto/tasks.dto.ts` | `CreateTaskDto`, `UpdateTaskDto`, `GetTasksQueryDto` con validación `class-validator` (`IsIn` para status/priority, `IsDateString` para dueDate, límites de longitud) |
| `tasks.service.ts` | Lógica CRUD: filtros por status/priority, ordenamiento, `completedAt` automático al marcar como completada, verificaciones de pertenencia (`ForbiddenException`) y existencia (`NotFoundException`) |
| `tasks.controller.ts` | `GET /api/tasks` (filtros), `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`. Protegido con `JwtAuthGuard` |
| `tasks.module.ts` | Registro del módulo |

Endpoints (verificados: `nest build` OK, API arranca y `GET /api/tasks` responde 401 sin sesión):

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tasks?status=&priority=` | Lista tareas del usuario (filtros opcionales) |
| POST | `/api/tasks` | Crea una tarea |
| PATCH | `/api/tasks/:id` | Actualiza título, descripción, estado, prioridad, fecha |
| DELETE | `/api/tasks/:id` | Elimina una tarea (solo del propio usuario) |

## 3. Frontend: manipulación del DOM (`/practicas/dom-demo`)

`frontend/src/app/practicas/dom-demo/dom-demo.component.ts/.html/.scss` demuestra:

- **Render de lista con signals + `@for`** (árbol de Angular).
- **API nativa del DOM**: `document.createElement` + `appendChild` sobre el mismo contenedor `#listContainer` vía `ViewChild/ElementRef`, creando `<li>` fuera del árbol de Angular con su propio `addEventListener('click')`.
- **Delegación de eventos**: listener global de `keydown` en `document` registrado/removido en runtime, con limpieza en `ngOnDestroy`.
- Bitácora en vivo de cada operación.

## 4. Frontend: Task Manager (`/practicas/task-manager`)

`frontend/src/app/practicas/task-manager/task-manager.component.ts/.html/.scss`:

- Servicio `TasksService` (`frontend/src/app/core/services/tasks.service.ts`) con `getTasks/createTask/updateTask/deleteTask` + modelo `Task` en `frontend/src/app/core/models/task.model.ts`.
- CRUD completo contra `api/tasks`: crear, editar en línea (formulario + modo edición por fila), completar/pendiente (toggle), eliminar.
- Filtros por estado (`TODAS`, `PENDIENTE`, `COMPLETADA`), contador de pendientes, badges de prioridad.
- Estados de carga y error.

### Rutas agregadas (`frontend/src/app/app.routes.ts`)

```
/practicas/dom-demo      → DomDemoComponent (lazy)
/practicas/task-manager  → TaskManagerComponent (lazy)
```

## 5. Pruebas

Se agregó `frontend/src/app/core/services/tasks.service.spec.ts` (5 casos: creación, filtros, CRUD HTTP con `HttpClientTestingModule`).

Ejecución:
```
cd frontend && ng test --watch=false --browsers=ChromeHeadless
```

Resultado: **TOTAL: 14 SUCCESS** (5 de TasksService + 9 previos).

## 6. Compilación verificada
- `cd ceosmos-api && npx nest build` → OK
- `cd frontend && npx ng build` → OK (solo warnings de budget preexistentes)
- `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless` → 14/14
- `prisma migrate status` → "Database schema is up to date!"
