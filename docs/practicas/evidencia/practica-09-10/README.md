# Evidencia — Práctica 9-10 (HighlightOnHoverDirective y Changelog Git)

## Compilación frontend

```
$ cd frontend && npx ng build --configuration development
Build at: 2026-07-31T21:23:39.338Z - Hash: 3496df73948e2c93 - Time: 28526ms
```

Chunks lazy (sin nuevo chunk: la directiva viaja en el bundle de cada componente que la usa):
```
src_app_practicas_layout-showcase_layout-showcase_component_ts.js  (81.54 kB)
src_app_practicas_task-manager_task-manager_component_ts.js        (69.83 kB)
```

## Pruebas unitarias

```
$ cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
Chrome Headless 150.0.0.0 (Windows 10): Executed 27 of 27 SUCCESS
TOTAL: 27 SUCCESS   (23 previos + 4 nuevos de HighlightOnHoverDirective)
```

## git status / diff --stat

```
$ git status --short
 M frontend/src/styles.scss
?? frontend/src/app/core/directives/
?? frontend/src/app/practicas/layout-showcase/
?? frontend/src/app/practicas/task-manager/
?? docs/

$ git diff --stat
 frontend/src/styles.scss  |  8 ++++++++      (regla .highlight-on-hover)
```

## Changelog Git — hashes reales verificados

```
$ git rev-parse HEAD
cb0db78f437789e0be26f89330b60d9275e72495

$ git log --oneline -- frontend/src/styles.scss
4a8c731 feat: backend NestJS complete with Neon DB sync, Auth module and Prisma v7

$ git log --oneline -- frontend/src/app/practicas/layout-showcase
(sin salida: directorio nuevo, pendiente de commit)

$ git log --oneline -- frontend/src/app/practicas/task-manager
(sin salida: directorio nuevo, pendiente de commit)
```

## Archivos nuevos/modificados

```
frontend/src/app/core/directives/highlight-on-hover.directive.ts        (nuevo)
frontend/src/app/core/directives/highlight-on-hover.directive.spec.ts   (nuevo)
frontend/src/app/practicas/layout-showcase/layout-showcase.component.{ts,html}  (modificado)
frontend/src/app/practicas/task-manager/task-manager.component.{ts,html}        (modificado)
frontend/src/styles.scss                                             (modificado)
docs/practicas/practica-09-10.md                                     (nuevo)
docs/practicas/evidencia/practica-09-10/README.md                    (nuevo)
```
