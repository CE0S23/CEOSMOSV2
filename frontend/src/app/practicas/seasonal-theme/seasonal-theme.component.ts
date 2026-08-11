import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { SeasonalThemeService, Season, SEASON_PALETTES, VARIABLE_MAP, SeasonPalette } from '../../core/services/seasonal-theme.service';

interface SeasonInfo {
  season: Season;
  label: string;
  emoji: string;
  description: string;
}

@Component({
  selector: 'app-seasonal-theme',
  standalone: true,
  templateUrl: './seasonal-theme.component.html',
  styleUrl: './seasonal-theme.component.scss',
})
export class SeasonalThemeComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(SeasonalThemeService);
  private appliedVars: string[] = [];

  readonly seasons = signal<SeasonInfo[]>([
    { season: 'primavera', label: 'Primavera', emoji: '🌸', description: 'Verdes frescos y rosas suaves (mar–may)' },
    { season: 'verano', label: 'Verano', emoji: '☀️', description: 'Ámbar y naranjas cálidos (jun–ago)' },
    { season: 'otono', label: 'Otoño', emoji: '🍂', description: 'Tonos tierra y fuego (sep–nov)' },
    { season: 'invierno', label: 'Invierno', emoji: '❄️', description: 'Azules gélidos y lavanda (dic–feb)' },
  ]);

  readonly activeSeason = this.themeService.season;
  readonly mode = this.themeService.mode;
  readonly activePalette = computed(() => SEASON_PALETTES[this.themeService.season()]);
  readonly activeInfo = computed(
    () => this.seasons().find(s => s.season === this.activeSeason())!,
  );

  constructor() {
    effect(() => {
      this.applyToRoot(this.activePalette(), this.activeSeason());
    });
  }

  ngOnInit(): void {
    this.themeService.setAuto();
  }

  ngOnDestroy(): void {
    this.appliedVars.forEach(v => document.documentElement.style.removeProperty(v));
    this.appliedVars = [];
  }

  private applyToRoot(palette: SeasonPalette, season: Season): void {
    this.appliedVars.forEach(v => document.documentElement.style.removeProperty(v));
    this.appliedVars = [];
    (Object.keys(palette) as (keyof SeasonPalette)[]).forEach(key => {
      document.documentElement.style.setProperty(VARIABLE_MAP[key], palette[key]);
      this.appliedVars.push(VARIABLE_MAP[key]);
    });
    document.documentElement.setAttribute('data-season', season);
  }

  selectSeason(season: Season): void {
    this.themeService.applySeason(season);
  }

  useAuto(): void {
    this.themeService.setAuto();
  }
}
