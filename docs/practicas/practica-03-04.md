# Práctica 3-4: Librerías/Compatibilidad, Buscador Interno y Documentación

## Librerías usadas (extraídas de `package.json`)

### Frontend (`frontend/package.json`)
| Librería | Versión | Soporte escritorio | Smart TV (Tizen/webOS WebKit antiguo) | Wearable (WebView limitado) |
|----------|---------|--------------------|----------------------------------------|-----------------------------|
| `@angular/*` | 18 | Chrome, Edge, Firefox, Safari modernos | ES2022 target: **no compila** en WebKit < 14; sin soporte de signals, control flow `@if/@for`, standalone sin polyfill | Limitado; requiere target ES2015/ES2017 y polyfills |
| Angular Material | 18 | Completo | Animaciones JS pesadas; puede degradarse | No recomendado (bundle grande) |
| PrimeNG | 18 | Completo | CSS + JS moderno (CSS Grid, custom properties); requiere verificar | Bundle pesado, evitar |
| `@simplewebauthn/browser` | 13 | Completo (requiere HTTPS) | **Sin soporte** de `navigator.credentials` en la mayoría de TVs | Sin soporte de autenticadores |
| `rxjs` | 7.8 | Completo | Opera en ES2015+; ok si el resto del target lo permite | Ok en WebView moderno |
| `zone.js` | 0.14 | Completo | Ok | Ok |

### Backend (`ceosmos-api/package.json`)
| Librería | Versión | Nota compatibilidad |
|----------|---------|---------------------|
| `@nestjs/*` | 11 | Node >= 22.12.0 (Motor Nest no corre en navegador) |
| `@prisma/client` + `@prisma/adapter-neon` | 5.22 | Usa `driverAdapters` con Neon serverless |
| `@simplewebauthn/server` | 13 | Server-side; sin dependencias de navegador |
| `bcrypt` | 6 | Native; node-gyp/prebuilds por plataforma |
| `helmet`, `cookie-parser`, `class-validator`, `class-transformer`, `passport`, `passport-jwt`, `@nestjs/jwt`, `@nestjs/throttler` | — | Middlewares Node; no aplica navegador |
| `resend` | 6.9 | SDK de correo (Node) |

### Compatibilidad con Smart TV / Wearables — conclusiones
- **Smart TV (Tizen/webOS)**: motores WebKit antiguos (ES5 parcial, ES6 parcial; sin ES2020 completo). El `target: ES2022` de `tsconfig.json` genera código no ejecutable directamente; para soporte TV habría que bajar el target con `browserslist`/`es2015` y omitir la mayor parte de PrimeNG/Material. Para estas prácticas el requisito se documenta: el layout de TV se demuestra vía `.tv-mode`/`@media (min-width:1920px)` en el navegador, sin cambiar el target global (que rompería la app de escritorio).
- **Wearables**: WebView limitado sin notificaciones push nativas del navegador en la mayoría de casos; sin `Notification API` usable. No se implementan push en el proyecto; se deja documentado el límite. Los breakpoints wearable (≤320px) simplifican la UI a una columna y ocultan banners.

## Desempeño móvil — Lazy loading
- Angular ya usa `loadComponent`/`loadChildren` para **todas** las rutas: `home`, `auth`, `feed`, `profile`, `admin`, `privacidad` y las nuevas de práctica (`/practicas/layout`, `/practicas/dom-demo`, `/practicas/task-manager`). Confirmado en `app.routes.ts` y verificado en la salida de `ng build` (chunks lazy separados).
- No se usa Push/Notification API; no se implementa notificación alguna.

## Buscador interno

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/core/services/site-search.service.ts` | `SiteSearchService`: índice en memoria de secciones del sitio + rutas de práctica, con búsqueda por relevancia y normalización de acentos |
| `frontend/src/app/core/services/site-search.service.spec.ts` | Pruebas unitarias Jasmine |
| `frontend/src/app/practicas/search-bar/search-bar.component.ts/.html/.scss` | `SearchBarComponent`: debounce 250ms, dropdown con teclado (flechas + enter + escape) y clic, navega con `Router.navigate` |
| `frontend/src/app/features/layout/navbar/navbar.component.ts/.html` | Integración: el `SearchBarComponent` reemplaza la búsqueda inline previa |
| `frontend/angular.json`, `frontend/karma.conf.js`, `frontend/src/test.ts`, `frontend/tsconfig.spec.json` | Infraestructura de pruebas Karma/Jasmine (no existía `test` target) |

### Infraestructura de test
El proyecto no tenía target `test` en `angular.json` ni `karma.conf.js`. Se agregaron. Ejecución:
```
cd frontend && ng test --watch=false --browsers=ChromeHeadless
```

### Prueba unitaria ejecutada
Se ejecutó `ng test --browsers=ChromeHeadless --watch=false` (ver salida en evidencia de esta práctica). Casos:
- Término existente ("tareas") → ≥1 resultado.
- Término inexistente ("zzzznoexiste") → arreglo vacío.
- Búsqueda en blanco → arreglo vacío.
