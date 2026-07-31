# Práctica 9-10 — Directiva de Highlight por Hover y Changelog Git

**Entregable**: directiva reutilizable `HighlightOnHoverDirective` aplicada sobre contenido real ya existente del sitio, y documentación de práctica 10 sobre el changelog de Git (hashes reales de `git log --oneline`).

## 9. Directiva `HighlightOnHoverDirective`

### Ubicación

`frontend/src/app/core/directives/highlight-on-hover.directive.ts` (standalone, reutilizable).

### Comportamiento

- Selector `[appHighlightOnHover]` con listener de `pointerenter` / `pointerleave` (eventos de puntero modernos, cubren mouse + táctil).
- Al entrar, agrega la clase CSS `highlight-on-hover` al elemento anfitrión; al salir, la elimina.
- Input `highlightClass` para personalizar el nombre de la clase (por defecto `highlight-on-hover`).
- Usa `Renderer2.addClass/removeClass`, segura para SSR y zonas de Angular.
- El efecto visual por defecto vive en el design system (`frontend/src/styles.scss`): sombra `--shadow-glow`, escala sutil `scale(1.01)` y `translateY(-3px)`, cambio de `border-color` a `--cosmos-aurora`, con transición CSS de 0.25s.

### Aplicación sobre contenido existente

| Lugar | Elemento | Archivo |
|-------|----------|---------|
| `/practicas/layout` (LayoutShowcase) | tarjetas `.card` del grid dinámico | `frontend/src/app/practicas/layout-showcase/layout-showcase.component.html` (atributo `appHighlightOnHover`) |
| `/practicas/task-manager` (TaskManager) | items `.tm-item` de la lista de tareas | `frontend/src/app/practicas/task-manager/task-manager.component.html` (atributo `appHighlightOnHover`) |

Ambos componentes son standalone; la directiva se registró en su array `imports`.

### Restricción Angular 18

No se usan arrow functions ni bindings complejos en plantillas; la directiva encapsula todo el comportamiento de "destacar" y el HTML existente solo agrega el atributo.

### Pruebas

`frontend/src/app/core/directives/highlight-on-hover.directive.spec.ts`:
- Agrega `highlight-on-hover` al disparar `pointerenter`.
- La elimina al disparar `pointerleave`.
- No toca la clase sin interacción.
- Respeta `highlightClass` personalizado (`glow-card`).

## 10. Changelog de Git

### Metodología

El changelog se genera sobre **hashes reales** de `git log --oneline` por archivo. No se inventan identificadores de commit. Los archivos que aún no tienen commits (trabajo sin commitear) se listan explícitamente como *pendientes de commit*.

### Estado de la rama

```
$ git rev-parse HEAD
f8ec4f92d0484704a4be091394023b5b552441e0   (rama main)

$ git log -1 --format="%h %ad %s" --date=short
f8ec4f9 2026-07-31 feat(practica-09-10): directiva de highlight por puntero sobre contenido real
```

### Archivos modificados en esta práctica y su historial real

#### `frontend/src/styles.scss` (modificado — historial real)

```
$ git log --oneline -- frontend/src/styles.scss
f8ec4f9 feat(practica-09-10): directiva de highlight por puntero sobre contenido real
4a8c731 feat: backend NestJS complete with Neon DB sync, Auth module and Prisma v7
```

#### `frontend/src/app/practicas/layout-showcase/*` (modificado — historial real)

```
$ git log --oneline -- frontend/src/app/practicas/layout-showcase
f8ec4f9 feat(practica-09-10): directiva de highlight por puntero sobre contenido real
5cfacae feat(practica-01-02): layout showcase con banners/popups y breakpoints responsivos
```

#### `frontend/src/app/practicas/task-manager/*` (modificado — historial real)

```
$ git log --oneline -- frontend/src/app/practicas/task-manager
f8ec4f9 feat(practica-09-10): directiva de highlight por puntero sobre contenido real
b9f980a feat(practica-05-06): DOM demo y administrador de tareas con API real
```

#### `frontend/src/app/core/directives/*` (nuevo — historial real)

```
$ git log --oneline -- frontend/src/app/core/directives
f8ec4f9 feat(practica-09-10): directiva de highlight por puntero sobre contenido real
```

#### `frontend/src/app/core/services/seasonal-theme.service.ts` (referencia cruzada — historial real)

```
$ git log --oneline -- frontend/src/app/core/services/seasonal-theme.service.ts
edf2799 feat(practica-07-08): menu por puntero y tema estacional
```

### Verificación de que no se inventan hashes

Todos los hashes citados salen directamente del comando `git log --oneline` (ver la sección "Metodología"). Esta práctica se cerró con **5 commits reales** (uno por par de prácticas) y un tag semver `v1.5.0` (5 pares completados → versión menor 5).

### Comandos útiles de la práctica

```bash
git log --oneline -- <archivo>          # hashes reales que tocan un archivo
git log --oneline -15                   # historial reciente de la rama
git status --short                      # distinguir modificados (M) de nuevos (??)
git diff --stat                         # resumen de cambios por archivo
```

## Cómo probar en local

```
cd frontend && npx ng serve
# Pasar el puntero sobre las tarjetas de http://localhost:4200/practicas/layout
# Pasar el puntero sobre los items de http://localhost:4200/practicas/task-manager
```
