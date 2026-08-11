import { Component, inject, computed } from '@angular/core';
import { SeasonalThemeService, Season, SEASON_PALETTES } from '../../../core/services/seasonal-theme.service';

interface SeasonInfo {
  season: Season;
  label: string;
  emoji: string;
}

@Component({
  selector: 'app-seasonal-widget',
  standalone: true,
  templateUrl: './seasonal-widget.component.html',
  styleUrl: './seasonal-widget.component.scss',
})
export class SeasonalWidgetComponent {
  private readonly themeService = inject(SeasonalThemeService);

  readonly seasons: SeasonInfo[] = [
    { season: 'primavera', label: 'Primavera', emoji: '🌸' },
    { season: 'verano', label: 'Verano', emoji: '☀️' },
    { season: 'otono', label: 'Otoño', emoji: '🍂' },
    { season: 'invierno', label: 'Invierno', emoji: '❄️' },
  ];

  readonly activeSeason = this.themeService.season;
  readonly activePalette = computed(() => SEASON_PALETTES[this.themeService.season()]);
  readonly activeInfo = computed(
    () => this.seasons.find(s => s.season === this.activeSeason())!,
  );
}
