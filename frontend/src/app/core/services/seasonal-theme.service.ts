import { Injectable, signal, computed } from '@angular/core';

export type Season = 'primavera' | 'verano' | 'otono' | 'invierno';

export interface SeasonPalette {
  aurora: string;
  starBlue: string;
  galaxyPurple: string;
  cosmicPink: string;
  gradientCosmos: string;
  gradientNebula: string;
  shadowGlow: string;
}

export const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  primavera: {
    aurora: '#5eead4',
    starBlue: '#34d399',
    galaxyPurple: '#a7f3d0',
    cosmicPink: '#f472b6',
    gradientCosmos: 'linear-gradient(135deg, #34d399 0%, #14b8a6 100%)',
    gradientNebula: 'linear-gradient(135deg, #86efac 0%, #5eead4 50%, #f472b6 100%)',
    shadowGlow: '0 0 20px rgba(52, 211, 153, 0.3)',
  },
  verano: {
    aurora: '#fbbf24',
    starBlue: '#f59e0b',
    galaxyPurple: '#fcd34d',
    cosmicPink: '#fb7185',
    gradientCosmos: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    gradientNebula: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #fb7185 100%)',
    shadowGlow: '0 0 20px rgba(245, 158, 11, 0.3)',
  },
  otono: {
    aurora: '#fb923c',
    starBlue: '#ea580c',
    galaxyPurple: '#fdba74',
    cosmicPink: '#b45309',
    gradientCosmos: 'linear-gradient(135deg, #ea580c 0%, #92400e 100%)',
    gradientNebula: 'linear-gradient(135deg, #fdba74 0%, #fb923c 50%, #b45309 100%)',
    shadowGlow: '0 0 20px rgba(234, 88, 12, 0.3)',
  },
  invierno: {
    aurora: '#93c5fd',
    starBlue: '#3b82f6',
    galaxyPurple: '#bfdbfe',
    cosmicPink: '#818cf8',
    gradientCosmos: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    gradientNebula: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 50%, #818cf8 100%)',
    shadowGlow: '0 0 20px rgba(59, 130, 246, 0.3)',
  },
};

const VARIABLE_MAP: Record<keyof SeasonPalette, string> = {
  aurora: '--cosmos-aurora',
  starBlue: '--cosmos-star-blue',
  galaxyPurple: '--cosmos-galaxy-purple',
  cosmicPink: '--cosmos-cosmic-pink',
  gradientCosmos: '--gradient-cosmos',
  gradientNebula: '--gradient-nebula',
  shadowGlow: '--shadow-glow',
};

export function seasonForMonth(month: number): Season {
  if (month === 11 || month === 0 || month === 1) return 'invierno';
  if (month === 2 || month === 3 || month === 4) return 'primavera';
  if (month === 5 || month === 6 || month === 7) return 'verano';
  return 'otono';
}

@Injectable({ providedIn: 'root' })
export class SeasonalThemeService {
  private readonly _season = signal<Season>(seasonForMonth(new Date().getMonth()));
  private readonly _mode = signal<'auto' | 'manual'>('auto');

  readonly season = this._season.asReadonly();
  readonly mode = this._mode.asReadonly();
  readonly palette = computed(() => SEASON_PALETTES[this._season()]);

  private appliedVars: string[] = [];

  constructor() {
    this.apply();
  }

  applySeason(season: Season): void {
    this._season.set(season);
    this._mode.set('manual');
    this.apply();
  }

  setAuto(): void {
    this._season.set(seasonForMonth(new Date().getMonth()));
    this._mode.set('auto');
    this.apply();
  }

  cycleNext(): Season {
    const order: Season[] = ['primavera', 'verano', 'otono', 'invierno'];
    const idx = order.indexOf(this._season());
    const next = order[(idx + 1) % order.length];
    this.applySeason(next);
    return next;
  }

  reset(): void {
    this.appliedVars.forEach(v => document.documentElement.style.removeProperty(v));
    this.appliedVars = [];
  }

  private apply(): void {
    this.reset();
    const palette = this.palette();
    (Object.keys(palette) as (keyof SeasonPalette)[]).forEach(key => {
      document.documentElement.style.setProperty(VARIABLE_MAP[key], palette[key]);
      this.appliedVars.push(VARIABLE_MAP[key]);
    });
    document.documentElement.setAttribute('data-season', this._season());
  }
}
