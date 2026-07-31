import { Component, inject, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerService } from './banner.service';

@Component({
  selector: 'app-popup-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (banner()?.type === 'top-banner') {
      <div class="top-banner" [class]="variant()" role="alert" aria-live="polite">
        <div class="banner-content">
          <strong>{{ banner()?.title }}</strong>
          <span>{{ banner()?.message }}</span>
        </div>
        <button class="banner-close" (click)="dismiss()" aria-label="Cerrar aviso">✕</button>
      </div>
    }

    @if (banner()?.type === 'modal') {
      <div class="modal-backdrop" (click)="dismiss()" aria-hidden="true"></div>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" (click)="$event.stopPropagation()">
        <header class="modal-header" [class]="variant()">
          <h2 id="modal-title">{{ banner()?.title }}</h2>
          <button class="modal-close" (click)="dismiss()" aria-label="Cerrar modal">✕</button>
        </header>
        <div class="modal-body">
          <p>{{ banner()?.message }}</p>
        </div>
        @if (actions().length > 0) {
          <footer class="modal-footer">
            @for (action of actions(); track action.label; let first = $first) {
              <button class="btn" [class.btn-primary]="first" (click)="executeAction(action)">
                {{ action.label }}
              </button>
            }
          </footer>
        }
      </div>
    }
  `,
  styles: [`
    .top-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      animation: slideDown 0.3s ease-out;
      font-size: 0.9rem;
    }

    .top-banner.info { background: linear-gradient(90deg, #1e3a5f, #2a5298); border-bottom: 1px solid #3a7bd5; color: #cfe3ff; }
    .top-banner.success { background: linear-gradient(90deg, #1b4d3e, #2e7d4a); border-bottom: 1px solid #4ade80; color: #bbf7d0; }
    .top-banner.warning { background: linear-gradient(90deg, #5f4b1e, #9a7b2a); border-bottom: 1px solid #fbbf24; color: #fef3c7; }
    .top-banner.error { background: linear-gradient(90deg, #5f1e1e, #9a2a2a); border-bottom: 1px solid #f87171; color: #fee2e2; }

    .banner-content { display: flex; flex-direction: column; gap: 2px; }
    .banner-content strong { font-weight: 600; }
    .banner-content span { opacity: 0.9; font-size: 0.85rem; }

    .banner-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    .banner-close:hover { opacity: 1; }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1001;
      animation: fadeIn 0.2s ease-out;
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1002;
      min-width: 320px;
      max-width: 90vw;
      max-height: 80vh;
      background: var(--cosmos-nebula);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), var(--shadow-glow);
      overflow: hidden;
      animation: scaleIn 0.25s ease-out;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .modal-header.info { border-left: 4px solid #3a7bd5; }
    .modal-header.success { border-left: 4px solid #4ade80; }
    .modal-header.warning { border-left: 4px solid #fbbf24; }
    .modal-header.error { border-left: 4px solid #f87171; }
    .modal-header h2 { font-size: 1.1rem; font-weight: 600; }
    .modal-close {
      background: none;
      border: none;
      color: var(--cosmos-stardust);
      font-size: 1.3rem;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    .modal-close:hover { opacity: 1; }

    .modal-body { padding: 20px; overflow-y: auto; }
    .modal-body p { margin: 0; line-height: 1.6; color: var(--cosmos-moonlight); }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    .btn-primary {
      background: var(--gradient-cosmos);
      color: white;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: var(--shadow-glow); }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: var(--cosmos-stardust);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }

    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
      to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    @media (max-width: 480px) {
      .top-banner { padding: 10px 16px; font-size: 0.85rem; }
      .modal { margin: 16px; max-width: calc(100vw - 32px); }
    }
  `],
})
export class PopupModalComponent {
  private readonly bannerService = inject(BannerService);

  readonly banner = this.bannerService.activeBanner;
  readonly variant = computed(() => this.bannerService.activeBanner()?.variant ?? 'info');
  readonly actions = computed(() => this.bannerService.activeBanner()?.actions ?? []);

  dismiss(): void {
    this.bannerService.dismissBanner();
  }

  executeAction(action: { label: string; callback: () => void }): void {
    action.callback();
    this.dismiss();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.banner()) this.dismiss();
  }
}