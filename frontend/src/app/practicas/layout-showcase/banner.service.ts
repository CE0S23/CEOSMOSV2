import { Injectable, signal, computed } from '@angular/core';

export type BannerType = 'top-banner' | 'modal';
export type BannerVariant = 'info' | 'warning' | 'success' | 'error';

export interface BannerAction {
  label: string;
  callback: () => void;
}

export interface BannerConfig {
  type: BannerType;
  title: string;
  message: string;
  variant?: BannerVariant;
  autoCloseMs?: number;
  actions?: BannerAction[];
}

export interface ActiveBanner extends BannerConfig {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly _activeBanner = signal<ActiveBanner | null>(null);
  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly activeBanner = this._activeBanner.asReadonly();
  readonly hasActiveBanner = computed(() => this._activeBanner() !== null);

  showBanner(config: BannerConfig): void {
    this.clearAutoClose();

    const id = crypto.randomUUID();
    this._activeBanner.set({ ...config, id });

    if (config.autoCloseMs && config.autoCloseMs > 0) {
      this.autoCloseTimer = setTimeout(() => this.dismissBanner(id), config.autoCloseMs);
    }
  }

  dismissBanner(id?: string): void {
    const current = this._activeBanner();
    if (id && current?.id !== id) return;
    this.clearAutoClose();
    this._activeBanner.set(null);
  }

  private clearAutoClose(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }
}