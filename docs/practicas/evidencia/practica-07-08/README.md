# Evidencia — Práctica 7-8 (Menú por Puntero y Tema Estacional)

## Compilación frontend

```
$ cd frontend && npx ng build --configuration development
Build at: 2026-07-31T21:04:02.187Z - Hash: de4505844ba000da - Time: 14844ms
```

Chunks lazy nuevos generados:
```
src_app_practicas_seasonal-theme_seasonal-theme_component_ts.js  (34.55 kB)
src_app_practicas_pointer-menu_pointer-menu_component_ts.js      (33.42 kB)
```

## Pruebas unitarias

```
$ cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
Chrome Headless 150.0.0.0 (Windows 10): Executed 23 of 23 SUCCESS
TOTAL: 23 SUCCESS   (9 previos + 5 TasksService + 9 nuevos SeasonalTheme)
```

## Rutas registradas (app.routes.ts)

```
/practicas/pointer-menu     -> PointerMenuComponent (lazy)
/practicas/seasonal-theme   -> SeasonalThemeComponent (lazy)
```

## Archivos nuevos

```
frontend/src/app/core/services/seasonal-theme.service.ts        (+ .spec.ts)
frontend/src/app/practicas/pointer-menu/pointer-menu.component.{ts,html,scss}
frontend/src/app/practicas/seasonal-theme/seasonal-theme.component.{ts,html,scss}
docs/practicas/practica-07-08.md
docs/practicas/evidencia/practica-07-08/README.md
```

## git status / diff --stat

```
$ git status
frontend/src/app/app.routes.ts                             (M)
frontend/src/app/core/services/seasonal-theme.service.ts   (??)
frontend/src/app/core/services/seasonal-theme.service.spec.ts (??)
frontend/src/app/practicas/pointer-menu/...                 (??)
frontend/src/app/practicas/seasonal-theme/...               (??)
docs/practicas/practica-07-08.md                            (??)
docs/practicas/evidencia/practica-07-08/README.md           (??)
```

*(Completar con la salida real de `git status` y `git diff --stat` al momento de la entrega.)*
