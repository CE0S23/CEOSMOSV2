# Práctica 1-2: Framework, Distribución de Página y Documentación

## Justificación Técnica del Stack

### Frontend: Angular 18
- **Escalabilidad**: Arquitectura modular con componentes *standalone* (sin NgModules obligatorios), lazy loading nativo vía `loadComponent`/`loadChildren`, y señales (*signals*) para reactividad fina. Permite dividir la app en *chunks* cargados bajo demanda.
- **Mantenibilidad**: TypeScript estricto, CLI con generadores (`ng g component/service/guard/pipe`), pruebas integradas (Jasmine/Karma), y *strict templates* que detectan errores en plantillas en tiempo de compilación.
- **Reversionamiento (Git)**: Código tipado y estructura de carpetas predecible facilitan *diffs* legibles, *code reviews* y *bisect*. El repo `CE0S23/CEOSMOSV2` usa rama única `main` (ver `git branch -a`) con *commits* semánticos (`feat:`, `fix:`, `docs:`, etc.). No hay ramas *feature* persistentes; se integra directo a `main` tras CI.

### Backend: NestJS 11 + Prisma 5 + Neon
- **Escalabilidad horizontal**: Módulos independientes (`AuthModule`, `UsersModule`, `MediaModule`, `SessionsModule`, `MailModule`) con inyección de dependencias. *Guards*, *interceptors*, *pipes* y *filters* reutilizables. *ThrottlerGuard* global para rate-limiting.
- **Tipado *end-to-end***: Prisma Client genera tipos TypeScript desde el esquema; los DTOs de Nest (`class-validator`) validan entrada y comparten tipos con el frontend vía `shared/` o copia manual.
- **Separación de responsabilidades**: Cada módulo expone su *controller* y *service*; lógica de negocio en *services*, validación en DTOs, autenticación en *guards* (`JwtAuthGuard`, `RolesGuard`), excepciones en *filters* (`HttpExceptionFilter`).
- **Neon (PostgreSQL serverless)**: Conexión *pool* vía `@prisma/adapter-neon` evita *cold-starts* y gestiona conexiones en Railway/Vercel sin *connection limits* duros.

### Estrategia de Ramas (Git)
```
git branch -a
* main
  remotes/old-origin/main
  remotes/origin/main
```
- Rama única `main` (protegida en GitHub). *Commits* directos o PRs internos. Versionado semántico con tags `vX.Y.Z` (ver `git tag`).

---

## LayoutShowcaseComponent — `/practicas/layout`

### Rutas de Archivos
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/practicas/layout-showcase/layout-showcase.component.ts` | Componente principal (lazy-loaded) |
| `frontend/src/app/practicas/layout-showcase/layout-showcase.component.html` | Plantilla |
| `frontend/src/app/practicas/layout-showcase/layout-showcase.component.scss` | Estilos con breakpoints |
| `frontend/src/app/practicas/layout-showcase/banner.service.ts` | Servicio de banners/popups (`BannerService`) |
| `frontend/src/app/practicas/layout-showcase/popup-modal.component.ts` | Componente modal/banner reutilizable (template + estilos inline) |
| `frontend/src/app/app.routes.ts` | Ruta `/practicas/layout` añadida |

### Breakpoints y Cambios por Dispositivo

| Breakpoint | Media Query | Cambios Principales |
|------------|-------------|---------------------|
| **Wearable** | `@media (max-width: 320px)` | Una sola columna; sin banners superiores; tipografía reducida (0.8rem); padding 8px; botones a ancho completo; vista simplificada. |
| **Móvil** | `@media (min-width: 321px) and (max-width: 767px)` | Una columna; botones *touch-friendly* apilados; tipografía 1.4rem en títulos. |
| **Tablet** | `@media (min-width: 768px) and (max-width: 1023px)` | Dos columnas en grid de tarjetas; padding mayor. |
| **Escritorio** | Base (≥1024px) | Layout base: grid `auto-fill minmax(280px, 1fr)`; navbar completa. |
| **Smart TV** | `@media (min-width: 1920px)` o clase `.tv-mode` | Alto contraste (`--tv-bg: #000`, `--tv-fg: #fff`, `--tv-accent: #ffd700`); tipografía 1.5-3.5rem; foco visible grueso (4px) para control remoto; zona segura con padding `8vw`. La clase `.tv-mode` se activa con el toggle de la página (`document.body.classList`). |

### BannerService / PopupModalComponent
- `BannerService.showBanner(config: BannerConfig)` → emite *signal* reactivo (`activeBanner`).
- `BannerConfig`: `{ type: 'top-banner' | 'modal', title, message, variant: 'info' | 'warning' | 'success' | 'error', autoCloseMs?, actions?: { label, callback }[] }`.
- `PopupModalComponent` se inserta vía `<app-popup-modal />` dentro del componente que lo necesite. Soporta ESC para cerrar, cierre por *backdrop click* y *auto-close* por tiempo.