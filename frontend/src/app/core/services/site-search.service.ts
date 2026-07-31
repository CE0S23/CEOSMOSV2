import { Injectable } from '@angular/core';

export interface SiteSearchEntry {
  id: string;
  title: string;
  route: string;
  description: string;
  keywords?: string[];
}

export interface SiteSearchResult extends SiteSearchEntry {
  relevance: number;
}

const SITE_INDEX: SiteSearchEntry[] = [
  { id: 'home', title: 'Inicio', route: '/home', description: 'Landing page de CEOSmos: Deep Work Platform', keywords: ['inicio', 'landing', 'home', 'bienvenida'] },
  { id: 'feed', title: 'Flow Feed', route: '/feed', description: 'Música, imágenes y citas para flujo de trabajo', keywords: ['feed', 'musica', 'imagenes', 'citas', 'flujo', 'contenido'] },
  { id: 'privacidad', title: 'Política de Privacidad', route: '/privacidad', description: 'Política de privacidad del sitio', keywords: ['privacidad', 'politica', 'datos'] },
  { id: 'perfil', title: 'Mi Perfil', route: '/profile', description: 'Perfil de usuario, preferencias y sesiones', keywords: ['perfil', 'usuario', 'preferencias', 'sesiones', 'cuenta'] },
  { id: 'admin', title: 'Panel de Administración', route: '/admin', description: 'Administración de usuarios y roles', keywords: ['admin', 'administracion', 'usuarios', 'roles'] },
  { id: 'layout', title: 'Práctica: Layout / Distribución', route: '/practicas/layout', description: 'Demostración de breakpoints, banners y modo TV', keywords: ['practica', 'layout', 'responsive', 'breakpoints', 'banner', 'tv', 'wearable'] },
  { id: 'dom-demo', title: 'Práctica: Manipulación del DOM', route: '/practicas/dom-demo', description: 'Selección, creación y eliminación de elementos del DOM', keywords: ['practica', 'dom', 'renderer', 'elementos', 'estilos'] },
  { id: 'task-manager', title: 'Práctica: Administrador de Tareas', route: '/practicas/task-manager', description: 'CRUD completo de tareas con persistencia', keywords: ['practica', 'tareas', 'task', 'crud', 'pendientes'] },
  { id: 'auth-login', title: 'Iniciar sesión', route: '/login', description: 'Acceso con correo y contraseña o passkeys', keywords: ['login', 'iniciar', 'sesion', 'acceso', 'passkey'] },
  { id: 'auth-register', title: 'Registrarse', route: '/register', description: 'Crear una cuenta en CEOSmos', keywords: ['registro', 'registrarse', 'crear cuenta', 'signup'] },
];

@Injectable({ providedIn: 'root' })
export class SiteSearchService {
  private readonly index: SiteSearchEntry[] = SITE_INDEX;

  search(query: string): SiteSearchResult[] {
    const term = this.normalize(query.trim());
    if (term.length === 0) return [];

    return this.index
      .map(entry => ({ ...entry, relevance: this.relevance(term, entry) }))
      .filter(r => r.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);
  }

  getIndex(): SiteSearchEntry[] {
    return [...this.index];
  }

  private relevance(term: string, entry: SiteSearchEntry): number {
    const fields = [entry.title, entry.description, entry.route, ...(entry.keywords ?? [])];
    let score = 0;
    fields.forEach((field, idx) => {
      const norm = this.normalize(field);
      if (norm === term) score += 100 - idx * 10;
      else if (norm.startsWith(term)) score += 50 - idx * 5;
      else if (norm.includes(term)) score += 25 - idx * 3;
    });
    return score;
  }

  private normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
