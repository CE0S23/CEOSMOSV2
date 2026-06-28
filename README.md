# CEOSMOS - Cosmic Ecosystem for Optimized Spaces and Mindful Operating Systems

![Angular](https://img.shields.io/badge/Angular-18.0.0-red?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.0-blue?style=for-the-badge&logo=typescript)
![Angular Material](https://img.shields.io/badge/Angular%20Material-18.0.0-purple?style=for-the-badge&logo=angular)

##  Descripción del Proyecto

**CEOSMOS** es una plataforma web de productividad personalizada diseñada para facilitar el estado de flujo (Flow State) mediante un ecosistema visual inspirador combinado con música diseñada para la concentración. El proyecto tiene como objetivo crear un espacio digital que optimice la experiencia del usuario para trabajo profundo, creatividad y motivación.

###  Objetivo Principal
Crear un ecosistema de productividad que combine:
- **Inspiración Visual**: Feed de imágenes cósmicas y artísticas de alta calidad
- **Música para el Enfoque**: Integración de playlists y música diseñada para concentración
- **Enlaces Externos Curados**: Acceso rápido a herramientas de productividad
- **Interfaz Premium**: Diseño moderno con estética cósmica y animaciones fluidas

---

##  Arquitecturas y Patrones Aplicados

### 1. **Clean Architecture (Arquitectura Limpia)**
El proyecto está diseñado siguiendo los principios de Clean Architecture:

- **Separación de Capas**:
  - **Presentación** (`components/`, `pages/`): Componentes Angular para la UI
  - **Lógica de Negocio** (`services/`): Servicios para manejo de datos y lógica
  - **Dominio** (`shared/`): Interfaces y tipos compartidos entre frontend y backend

- **Independencia de Frameworks**: La lógica de negocio está desacoplada de Angular
- **Testabilidad**: Servicios inyectables que permiten fácil testing

### 2. **Component-Based Architecture (Arquitectura Basada en Componentes)**

El proyecto utiliza la arquitectura de componentes de Angular:

```
app/
├── components/          # Componentes reutilizables
│   ├── external-links-menu/
│   ├── player/
│   ├── search-bar/
│   ├── settings/
│   └── visualizer/
├── pages/              # Páginas/Vistas principales
│   └── home/
└── services/           # Servicios de lógica de negocio
    ├── inspiration.service.ts
    └── search.service.ts
```

### 3. **Module Pattern (Patrón de Módulos)**

- **Lazy Loading**: Implementado en el routing para carga diferida
  ```typescript
  { path: 'home', loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) }
  ```
- **Feature Modules**: Separación por funcionalidades

### 4. **Service Layer Pattern (Patrón de Capa de Servicios)**

Servicios especializados que encapsulan lógica de negocio:

- **`InspirationService`**: Gestión de contenido inspiracional (citas, imágenes, música)
- **`SearchService`**: Búsqueda inteligente con cálculo de relevancia

### 5. **Reactive Programming (Programación Reactiva)**

- **RxJS Observables**: Manejo de flujos de datos asíncronos
- **Reactive Forms**: Formularios reactivos con `ReactiveFormsModule`
- **Signals (Futuro)**: Preparado para gestión de estado reactivo con Signals de Angular

### 6. **SOLID Principles**

#### Single Responsibility (Responsabilidad Única)
- Cada componente y servicio tiene una única responsabilidad
- `SearchService` solo maneja búsquedas
- `InspirationService` solo gestiona contenido inspiracional

#### Open/Closed (Abierto/Cerrado)
- Componentes extensibles sin modificar código existente
- Interfaces bien definidas

#### Dependency Inversion (Inversión de Dependencias)
- Inyección de dependencias en constructores
- Servicios `providedIn: 'root'`

### 7. **Design System Architecture**

Sistema de diseño completo con:

- **Variables CSS Customizables**:
  ```scss
  --cosmos-deep-space: #0a0e27;
  --cosmos-nebula: #1a1f3a;
  --gradient-cosmos: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  ```

- **Utilidades Reutilizables**:
  - `.glassmorphism` - Efectos de vidrio esmerilado
  - `.text-gradient` - Textos con gradientes
  - Animaciones predefinidas (`fadeIn`, `float`, `pulse-glow`)

### 8. **Repository Pattern (en desarrollo)**

Estructura preparada para implementar repositorios que abstraigan el acceso a datos (backend futuro con NestJS 11).

---

##  Stack Tecnológico

### Frontend
- **Framework**: Angular 18.0.0
- **Lenguaje**: TypeScript 5.4.0
- **UI Library**: Angular Material 18.0.0
- **Estilos**: SCSS con sistema de variables CSS
- **Programación Reactiva**: RxJS 7.8.0
- **Forms**: Reactive Forms Module
- **HTTP Client**: HttpClientModule

### Futuro Backend (en roadmap)
- **Framework**: NestJS 11
- **Arquitectura**: Clean Architecture
- **Shared Interfaces**: Tipado compartido entre frontend y backend

### Tooling
- **Build**: Angular CLI
- **Testing**: Jasmine + Karma
- **Linter**: TSLint/ESLint (pendiente configuración)

---

##  Estructura del Proyecto

```
WEBANGULAR/
├── frontend/                    # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # Componentes reutilizables
│   │   │   │   ├── external-links-menu/    # Menú de enlaces externos
│   │   │   │   ├── player/                 # Reproductor de música
│   │   │   │   ├── search-bar/             # Barra de búsqueda inteligente
│   │   │   │   ├── settings/               # Configuración
│   │   │   │   └── visualizer/             # Visualizador (placeholder)
│   │   │   ├── pages/          # Páginas principales
│   │   │   │   └── home/                   # Página principal
│   │   │   ├── services/       # Servicios de lógica de negocio
│   │   │   │   ├── inspiration.service.ts  # Gestión de contenido
│   │   │   │   └── search.service.ts       # Búsqueda inteligente
│   │   │   ├── app.module.ts              # Módulo principal
│   │   │   ├── app-routing.module.ts      # Configuración de rutas
│   │   │   └── app.component.*            # Componente raíz
│   │   ├── assets/             # Recursos estáticos
│   │   ├── environments/       # Configuración de entornos
│   │   ├── styles.scss         # Estilos globales y Design System
│   │   └── index.html          # Punto de entrada HTML
│   ├── angular.json            # Configuración de Angular
│   ├── package.json            # Dependencias del proyecto
│   └── tsconfig.json           # Configuración de TypeScript
├── backend/                     # Backend (pendiente desarrollo)
├── shared/                      # Interfaces compartidas (pendiente)
└── README.md                    # Este archivo
```

---

##  Características Implementadas

### 1. **Sistema de Inspiración Visual**
- **12 imágenes categorizadas**:
  - Espacio (space)
  -  Naturaleza (nature)
  -  Arquitectura (architecture)
  -  Arte (art)
- Fuentes: Unsplash (imágenes de alta calidad)

### 2. **Biblioteca Musical para Enfoque**
- **9 playlists curadas**:
  - Lo-fi Hip Hop
  -  Ondas Alpha (binaural beats)
  -  Música Ambiental/Cósmica
- Integración con YouTube

### 3. **Citas Inspiracionales**
- Sistema de citas categorizadas:
  -  Enfoque (focus)
  -  Creatividad (creativity)
  -  Motivación (motivation)
- Autores: Cal Newport, Albert Einstein, Mihaly Csikszentmihalyi, Nir Eyal

### 4. **Búsqueda Inteligente**
- **Algoritmo de relevancia** con múltiples factores:
  - Coincidencia exacta (peso: 100)
  - Empieza con query (peso: 50)
  - Contiene query (peso: 25)
  - Coincidencia parcial de palabras (peso: 10)
- **Normalización de texto**: 
  - Insensible a mayúsculas
  - Elimina acentos (NFD normalization)
- **Filtros**: Buscar solo en imágenes, música o todo
- **Resultados ordenados** por relevancia

### 5. **Menú de Enlaces Externos**
- **10 enlaces curados** en 4 categorías:
  - **Música**: Lofi Girl, Brain.fm, Noisli
  -  **Imágenes**: Unsplash, Pexels, NASA APOD
  - **Productividad**: Pomofocus, Notion
  -  **Inspiración**: Deep Work, Flow Research Collective
- **Panel tipo overlay** con categorización
- **Diseño visual premium** con iconos Material y colores personalizados

### 6. **Design System Premium**
- **Paleta de colores cósmica**:
  - Deep Space (#0a0e27)
  - Nebula (#1a1f3a)
  - Star Blue (#4a90e2)
  - Aurora (#7b68ee)
  - Galaxy Purple (#9b59b6)
  - Cosmic Pink (#e91e63)

- **Gradientes modernos**:
  - Gradient Cosmos
  - Gradient Nebula
  - Gradient Aurora

- **Efectos visuales**:
  - Glassmorphism (efecto de vidrio esmerilado)
  - Sombras con glow
  - Scrollbar personalizado

- **Animaciones CSS**:
  - `fadeIn`: Entrada suave
  - `float`: Flotación continua
  - `pulse-glow`: Pulso luminoso

### 7. **Routing con Lazy Loading**
- Carga diferida de módulos para optimización
- Redirección automática a `/home`

### 8. **Responsive Design**
- Media queries para adaptación móvil
- Diseño fluido y adaptable


---

## 🌐 Guía de Configuración y Despliegue

Para volver a desplegar el ecosistema completo de CEOSMOS en producción (o configurarlo en local) sin contratiempos, sigue detalladamente los pasos descritos a continuación:

### 1. Base de Datos (Neon PostgreSQL)

Neon provee una base de datos PostgreSQL Serverless. En proyectos que usan ORMs como Prisma, requerimos dos URLs de conexión diferentes: una con "pooling" (para consultas rápidas del servidor) y otra de conexión directa (para migraciones).

1. **Crear Proyecto en Neon**: Crea una cuenta en [Neon.tech](https://neon.tech/) y un nuevo proyecto con PostgreSQL (se recomienda versión 15 o superior).
2. **Obtener credenciales**:
   - En la consola de Neon, ve al dashboard y busca la sección **Connection String**.
   - **DATABASE_URL (Connection Pooling)**: Asegúrate de tener activada la opción **Pooled connection** (agrega el puerto `5432` o `-pooler` en el host). Esta URL gestiona las conexiones simultáneas del backend en producción.
     * Ejemplo: `postgresql://usuario:password@ep-host-name-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - **DIRECT_URL (Conexión Directa)**: Desactiva **Pooled connection** para obtener la conexión directa al nodo. Esta es necesaria para ejecutar migraciones y empujar esquemas sin que el pooler interfiera.
     * Ejemplo: `postgresql://usuario:password@ep-host-name.us-east-1.aws.neon.tech/neondb?sslmode=require`
3. **Sincronización local con Prisma**:
   - Ubícate en la carpeta `ceosmos-api/` y ejecuta:
     ```bash
     npx prisma generate
     npx prisma db push
     ```
     *(Esto creará las tablas necesarias en la base de datos de Neon de forma directa sin necesidad de ejecutar migraciones complejas desde cero)*.

---

### 2. Servicio de Correos (Resend y Verificación de Dominio)

El backend de CEOSMOS utiliza **Resend** como su proveedor de envío de correos electrónicos (para códigos de verificación de cuentas, inicio de sesión y recuperación de contraseña).

1. **Crear Cuenta en Resend**: Regístrate en [Resend.com](https://resend.com) y genera una **API Key** desde la sección *API Keys*.
2. **Configuración de Dominio para Producción (Crucial para correos de verificación)**:
   - **Modo Sandbox (Pruebas)**: Por defecto, Resend te restringe a enviar correos únicamente a la dirección de correo con la que te registraste, utilizando el remitente `onboarding@resend.dev`.
   - **Modo Producción (Envío General)**: Para que cualquier usuario pueda registrarse y recibir correos de verificación en su propia bandeja de entrada, debes verificar tu propio dominio:
     1. En la consola de Resend, ve a **Domains** > **Add Domain**.
     2. Ingresa tu dominio propio (ejemplo: `tudominio.com`).
     3. Resend te proporcionará 3 registros DNS de tipo **TXT** y **MX** (DKIM y SPF).
     4. Agrega estos registros en el panel de control de tu proveedor de dominio (Namecheap, GoDaddy, Cloudflare, etc.).
     5. Una vez verificado (puede tardar de unos minutos a 24 horas), podrás enviar correos desde cualquier dirección de tu dominio, por ejemplo: `CEOSMOS <no-reply@tudominio.com>`.
3. **Variables a configurar**:
   - `RESEND_API_KEY`: La clave de API generada (`re_xxxxxxxxx`).
   - `RESEND_FROM_EMAIL`: `CEOSMOS <no-reply@tudominio.com>` (producción) o `CEOSMOS <onboarding@resend.dev>` (pruebas limitado a tu propio correo).

---

### 3. Backend (Despliegue en Railway)

El backend es una aplicación NestJS que se encuentra en la carpeta `ceosmos-api/`.

1. **Crear Servicio en Railway**:
   - En tu panel de Railway, añade un nuevo servicio apuntando a tu repositorio de GitHub y selecciona el directorio root del backend (`ceosmos-api`).
   - Railway detectará el archivo [`railway.json`](file:///c:/Users/cesar/OneDrive/Escritorio/8°/DesarrolloWEB/WEBANGULAR/ceosmos-api/railway.json) automáticamente para compilar y arrancar la aplicación usando Nixpacks.
2. **Variables de Entorno en Railway**:
   Agrega las siguientes variables en la pestaña **Variables** del servicio de Railway:
   - `DATABASE_URL`: Tu URL con pooling de Neon (`postgresql://...-pooler...`).
   - `DIRECT_URL`: Tu URL de conexión directa de Neon (`postgresql://...`).
   - `FRONTEND_ORIGIN`: La URL final de tu aplicación frontend en Vercel (ejemplo: `https://ceosmos-app.vercel.app`).
   - `RP_ID`: El dominio de tu frontend en Vercel sin protocolo (ejemplo: `ceosmos-app.vercel.app`). Esto es fundamental para la autenticación sin contraseña (WebAuthn).
   - `RP_NAME`: `CEOSMOS`
   - `JWT_SECRET`: Una cadena de texto larga y segura para firmar los tokens JWT (puedes generarla localmente ejecutando `openssl rand -hex 32` en tu terminal).
   - `RESEND_API_KEY`: Tu API Key de Resend.
   - `RESEND_FROM_EMAIL`: El remitente verificado (ejemplo: `CEOSMOS <no-reply@tudominio.com>`).
   - *(Opcional)* `PORT`: **No definir**. Railway inyecta esta variable de entorno de forma automática y el backend está configurado para escuchar dinámicamente en el puerto asignado.

---

### 4. Frontend (Despliegue en Vercel)

El frontend es una aplicación de Angular 18 ubicada en la carpeta `frontend/`.

1. **Crear Proyecto en Vercel**:
   - En el dashboard de Vercel, importa tu repositorio de GitHub.
   - Configura la **Root Directory** seleccionando la carpeta `frontend`.
   - **Framework Preset**: Selecciona `Angular`.
   - **Build Command**: `npm run build` o `ng build`.
   - **Output Directory**: Vercel detectará por defecto `dist/ceosmos-app` gracias a la configuración en [`vercel.json`](file:///c:/Users/cesar/OneDrive/Escritorio/8°/DesarrolloWEB/WEBANGULAR/frontend/vercel.json).
2. **Modificación de Cabeceras de Seguridad (CSP - Muy Importante)**:
   - Para evitar brechas de seguridad y cumplir con las políticas del navegador, el frontend implementa Content Security Policy (CSP).
   - En [`frontend/vercel.json`](file:///c:/Users/cesar/OneDrive/Escritorio/8°/DesarrolloWEB/WEBANGULAR/frontend/vercel.json), localiza la regla `connect-src`:
     ```json
     "connect-src 'self' https://ceosmos-production.up.railway.app;"
     ```
     **Nota crítica**: Si la URL de tu backend de Railway cambia al volver a desplegarlo, **debes actualizar esta URL en `vercel.json`** antes de redesplegar el frontend en Vercel. De lo contrario, el navegador bloqueará todas las peticiones a la API del backend debido a la directiva de seguridad.

---

##  Principios de Diseño

### Estética Premium
- **Tema Cósmico**: Inspirado en el espacio y el cosmos
- **Dark Mode**: Diseño oscuro por defecto para reducir fatiga visual
- **Gradientes Vibrantes**: Uso de gradientes modernos y atractivos
- **Glassmorphism**: Efectos de vidrio esmerilado para profundidad visual

### Tipografía
- **Primaria**: Inter (Google Fonts)
- **Display**: Space Grotesk (para títulos)
- **Antialiasing**: Optimizado para legibilidad

### Micro-animaciones
- Transiciones suaves en todos los elementos interactivos
- Animaciones de entrada/salida
- Efectos hover para feedback visual

---

##  Cómo Ejecutar el Proyecto

### Prerrequisitos
```bash
- Node.js (v16 o superior)
- npm (v7 o superior)
- Angular CLI (opcional pero recomendado)
```

### Instalación

1. **Clonar el repositorio** (si aplica)
```bash
git clone [URL_DEL_REPOSITORIO]
cd WEBANGULAR/frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar el servidor de desarrollo**
```bash
npm start
# o
ng serve
```

4. **Abrir en navegador**
```
http://localhost:4200
```

### Compilación para Producción
```bash
npm run build
# Los archivos compilados estarán en dist/ceosmos-app/
```

### Testing
```bash
npm test
```

---

##  Componentes Principales

### 1. **HomeComponent**
- **Ubicación**: `app/pages/home/`
- **Responsabilidad**: Página principal del ecosistema
- **Funcionalidades**:
  - Carga de citas aleatorias
  - Integración con búsqueda
  - Selección de imágenes y música
  - Apertura de recursos en nueva pestaña

### 2. **ExternalLinksMenuComponent**
- **Ubicación**: `app/components/external-links-menu/`
- **Responsabilidad**: Gestión de enlaces externos
- **Funcionalidades**:
  - Panel overlay con animación
  - Filtrado por categorías
  - 10 enlaces curados
  - Diseño con tarjetas coloridas

### 3. **SearchBarComponent**
- **Ubicación**: `app/components/search-bar/`
- **Responsabilidad**: Búsqueda de contenido
- **Funcionalidades**:
  - Búsqueda en tiempo real
  - Filtros de tipo de contenido
  - Visualización de resultados con relevancia

### 4. **PlayerComponent** (Placeholder)
- **Ubicación**: `app/components/player/`
- **Estado**: En desarrollo
- **Futuro**: Reproducción de música integrada

### 5. **VisualizerComponent** (Placeholder)
- **Ubicación**: `app/components/visualizer/`
- **Estado**: En desarrollo
- **Futuro**: Visualización de audio en tiempo real

### 6. **SettingsComponent**
- **Ubicación**: `app/components/settings/`
- **Responsabilidad**: Configuración de la aplicación

---

##  Servicios Implementados

### InspirationService
**Archivo**: `services/inspiration.service.ts`

**Responsabilidades**:
- Gestión de citas inspiracionales (4 citas)
- Gestión de imágenes cósmicas (12 imágenes)
- Gestión de playlists musicales (9 playlists)

**Métodos principales**:
```typescript
getRandomQuote(): Observable<InspirationQuote>
getQuotesByCategory(category: string): Observable<InspirationQuote[]>
getImages(): Observable<CosmosImage[]>
getImagesByCategory(category: string): Observable<CosmosImage[]>
getPlaylists(): Observable<MusicPlaylist[]>
getPlaylistsByType(type: string): Observable<MusicPlaylist[]>
```

### SearchService
**Archivo**: `services/search.service.ts`

**Responsabilidades**:
- Búsqueda inteligente en todo el contenido
- Cálculo de relevancia de resultados
- Normalización de texto para búsqueda
- Filtrado por tipo de contenido

**Métodos principales**:
```typescript
search(query: string, filter: 'all' | 'images' | 'music'): Observable<SearchResult[]>
```

**Algoritmo de relevancia**:
- Coincidencia exacta: +100 puntos
- Empieza con query: +50 puntos
- Contiene query: +25 puntos
- Coincidencia parcial: +10 puntos

---

##  Roadmap y Futuras Implementaciones

### Fase 1: Frontend (En desarrollo - 70% completado)
- [x] Estructura base de componentes
- [x] Sistema de diseño premium
- [x] Servicio de inspiración
- [x] Búsqueda inteligente
- [x] Menú de enlaces externos
- [ ] Reproductor de música funcional
- [ ] Visualizador de audio
- [ ] Sistema de configuración completo
- [ ] Modo claro/oscuro toggle
- [ ] Internacionalización (i18n)

### Fase 2: Backend con NestJS 11
- [ ] API REST con NestJS
- [ ] Autenticación y autorización (JWT)
- [ ] Gestión de usuarios
- [ ] Favoritos personalizados
- [ ] Historial de reproducción
- [ ] Integración con APIs externas (Unsplash, Spotify)
- [ ] Base de datos (PostgreSQL/MongoDB)

### Fase 3: Funcionalidades Avanzadas
- [ ] PWA (Progressive Web App)
- [ ] Modo offline
- [ ] Sincronización multi-dispositivo
- [ ] Gamificación (racha de productividad)
- [ ] Analytics de uso
- [ ] Recomendaciones basadas en IA
- [ ] Integración con Pomodoro Timer
- [ ] Notas y journaling

### Fase 4: Optimización
- [ ] Server-Side Rendering (SSR) con Angular Universal
- [ ] Optimización de Bundle Size
- [ ] Performance mejoras
- [ ] Accesibilidad (WCAG 2.1)
- [ ] Testing E2E completo
- [ ] CI/CD Pipeline

---

##  Testing

### Estrategia de Testing
- **Unit Tests**: Jasmine + Karma para componentes y servicios
- **E2E Tests** (pendiente): Protractor o Cypress
- **Coverage** (pendiente): Objetivo 80%+

### Ejecutar Tests
```bash
npm test                 # Tests en modo watch
npm run test:headless    # Tests en modo CI
```

---

## 📚 Documentación de Interfaces

### InspirationQuote
```typescript
interface InspirationQuote {
    id: string;
    text: string;
    author: string;
    category: 'focus' | 'creativity' | 'motivation';
}
```

### CosmosImage
```typescript
interface CosmosImage {
    id: string;
    url: string;
    title: string;
    category: 'space' | 'nature' | 'architecture' | 'art';
}
```

### MusicPlaylist
```typescript
interface MusicPlaylist {
    id: string;
    name: string;
    url: string;
    type: 'lofi' | 'alpha' | 'ambient';
    description: string;
}
```

### SearchResult
```typescript
interface SearchResult {
    id: string;
    type: 'image' | 'music';
    title: string;
    description?: string;
    category: string;
    url: string;
    relevance?: number;
}
```

### ExternalLink
```typescript
interface ExternalLink {
    id: string;
    name: string;
    url: string;
    icon: string;
    description: string;
    category: 'music' | 'images' | 'productivity' | 'inspiration';
    color: string;
}
```

---

## Recursos y Referencias

### Libros y Conceptos
- **Deep Work** - Cal Newport: Trabajo profundo y concentración
- **Flow State** - Mihaly Csikszentmihalyi: Estado de flujo óptimo
- **Indistractable** - Nir Eyal: Gestión de la atención

### Tecnologías
- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [RxJS](https://rxjs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

### Inspiración de Diseño
- **Dribbble**: Diseños de productividad
- **Behance**: UI/UX premium
- **Awwwards**: Animaciones web

---

## Contribución

### Estándares de Código
- **Linting**: Seguir reglas de TSLint/ESLint
- **Naming Conventions**: 
  - Componentes: PascalCase
  - Archivos: kebab-case
  - Variables/funciones: camelCase
- **Commit Messages**: Conventional Commits
  ```
  feat: agregar búsqueda por categorías
  fix: corregir filtro de música
  docs: actualizar README
  ```

### Pull Requests
1. Fork del repositorio
2. Crear branch feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

##  Licencia

Este proyecto es privado y de uso educativo/personal.

---

##  Autor

**Proyecto CEOSMOS**
- Versión: 1.0.0
- Última actualización: Febrero 2026

---

##  Agradecimientos

- **Unsplash**: Por las imágenes de alta calidad
- **YouTube Creators**: Por la música de enfoque
- **Angular Team**: Por el increíble framework
- **Material Design**: Por la librería de componentes


---

**CEOSMOS** - *Donde la productividad encuentra el cosmos* 
