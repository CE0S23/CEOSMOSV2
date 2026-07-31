# Práctica 7-8 — Menú por Puntero y Tema Estacional

**Entregable**: `frontend/src/app/practicas/pointer-menu/` (menú contextual que sigue al puntero) y `frontend/src/app/practicas/seasonal-theme/` (tema que cambia según la estación). Backend sin cambios en esta práctica.

## 7. Menú por Puntero (`PointerMenuComponent`)

- Ruta lazy: `/practicas/pointer-menu`.
- Abre un menú en las coordenadas reales del puntero (`clientX`/`clientY`) al hacer `contextmenu` sobre una zona.
- Items: navegación a las otras prácticas y ciclo de tema estacional.
- Navegación por teclado: flechas (↑/↓), Enter para elegir, Esc para cerrar.
- Cierre con click o `contextmenu` fuera del menú.
- Restricción Angular 18: no se usan arrow functions en plantillas; la lógica vive en métodos del componente (`onContextMenu`, `navigateTo`, `cycleTheme`).

## 8. Tema Estacional (`SeasonalThemeService` + `SeasonalThemeComponent`)

- Ruta lazy: `/practicas/seasonal-theme`.
- `SeasonalThemeService` (`frontend/src/app/core/services/seasonal-theme.service.ts`):
  - `Season` = `'primavera' | 'verano' | 'otono' | 'invierno'`.
  - `SEASON_PALETTES` define por estación las variables CSS `--cosmos-aurora`, `--cosmos-star-blue`, `--cosmos-galaxy-purple`, `--cosmos-cosmic-pink`, `--gradient-cosmos`, `--gradient-nebula` y `--shadow-glow`.
  - `seasonForMonth(month)`: dic–feb invierno, mar–may primavera, jun–ago verano, sep–nov otoño.
  - Modos `auto` (según fecha real) y `manual` (vista previa). `setAuto()`, `applySeason()`, `cycleNext()`, `reset()`.
  - Aplica el tema sobrescribiendo las custom properties en `:root` con `document.documentElement.style.setProperty` y marcando `data-season` en el `<html>`.
- `SeasonalThemeComponent`: tarjetas de las 4 estaciones (vista previa con click), botón para volver a modo automático, y preview de la paleta aplicada. En `ngOnDestroy` llama a `reset()` para no contaminar el resto de la app.
- El componente usa signals (`signal`/`computed`) y evita arrow functions en el HTML; el `.find()` de la estación activa se resolvió con un `computed` (`activeInfo`) porque el template parser de Angular 18 no admite expresiones de función en los bindings.

## Tests

`ng test` pasó de **14 → 23 SUCCESS**: se agregaron specs de `SeasonalThemeService` (mapeo de meses → estación, `applySeason`/`setAuto`/`cycleNext`, variables CSS aplicadas en `:root`, `reset` sin fugas entre tests).

## Cómo probar en local

```
cd frontend && npx ng serve
# Abrir http://localhost:4200/practicas/pointer-menu   (clic derecho sobre la zona)
# Abrir http://localhost:4200/practicas/seasonal-theme (clic en cada estación)
```
