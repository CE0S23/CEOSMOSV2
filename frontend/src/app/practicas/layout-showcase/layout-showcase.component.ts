import { Component, inject, signal } from '@angular/core';
import { BannerService } from './banner.service';
import { PopupModalComponent } from './popup-modal.component';

interface ShowcaseCard {
  id: number;
  title: string;
  description: string;
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-layout-showcase',
  standalone: true,
  imports: [PopupModalComponent],
  templateUrl: './layout-showcase.component.html',
  styleUrl: './layout-showcase.component.scss',
})
export class LayoutShowcaseComponent {
  private readonly bannerService = inject(BannerService);

  readonly tvMode = signal(false);

  readonly cards = signal<ShowcaseCard[]>([
    { id: 1, title: 'Deep Work', description: 'Enfoque profundo sin interrupciones para sesiones de productividad.', icon: '🌌', accent: '#7b68ee' },
    { id: 2, title: 'Flow Feed', description: 'Música y contenido curado para mantener el flujo de trabajo.', icon: '🎵', accent: '#4a90e2' },
    { id: 3, title: 'Tareas', description: 'Administra tus pendientes con prioridades y estados.', icon: '✅', accent: '#4ecdc4' },
    { id: 4, title: 'Galaxia de Ideas', description: 'Inspiración visual para proyectos creativos.', icon: '💡', accent: '#9b59b6' },
    { id: 5, title: 'Auditoría', description: 'Bitácora de acciones y roles para administradores.', icon: '📋', accent: '#e91e63' },
    { id: 6, title: 'Seguridad', description: 'Autenticación con passkeys y protección CSRF.', icon: '🔐', accent: '#fbbf24' },
  ]);

  readonly tvModeLabel = this.tvMode.asReadonly();

  toggleTvMode(): void {
    const next = !this.tvMode();
    this.tvMode.set(next);
    document.body.classList.toggle('tv-mode', next);
  }

  showTopBanner(): void {
    this.bannerService.showBanner({
      type: 'top-banner',
      title: 'Aviso del sistema',
      message: 'Este es un banner superior de tipo aviso, visible desde cualquier parte de la app.',
      variant: 'info',
      autoCloseMs: 6000,
    });
  }

  showModal(): void {
    this.bannerService.showBanner({
      type: 'modal',
      title: 'Modal de ejemplo',
      message: 'Este modal se abre mediante el BannerService y puede contener acciones personalizadas.',
      variant: 'warning',
      actions: [
        { label: 'Aceptar', callback: () => console.log('Modal aceptado') },
        { label: 'Cancelar', callback: () => console.log('Modal cancelado') },
      ],
    });
  }

  showSuccess(): void {
    this.bannerService.showBanner({
      type: 'top-banner',
      title: 'Operación exitosa',
      message: 'Los cambios se guardaron correctamente.',
      variant: 'success',
      autoCloseMs: 4000,
    });
  }

  showError(): void {
    this.bannerService.showBanner({
      type: 'modal',
      title: 'Error crítico',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      variant: 'error',
    });
  }
}