import { Component } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { SearchStateService } from '../../core/services/search-state.service';

@Component({
  selector: 'app-search-bar',
  template: `
    <div class="search-bar">
      <input
        type="text"
        placeholder="Buscar imágenes, videos..."
        [(ngModel)]="query"
        (input)="onSearch()"
        (keyup.enter)="onSearch()"
      />
      <button (click)="onSearch()">Buscar</button>
      <div class="filters">
        <button (click)="setFilter('all')" [class.active]="filter === 'all'">Todo</button>
        <button (click)="setFilter('images')" [class.active]="filter === 'images'">Imágenes</button>
        <button (click)="setFilter('music')" [class.active]="filter === 'music'">Videos</button>
      </div>
    </div>
  `,
  styles: [`
    .search-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
    .search-bar input { flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; }
    .search-bar button { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .search-bar .filters { display: flex; gap: 8px; }
    .search-bar .filters button { background: #f0f0f0; color: #333; }
    .search-bar .filters button.active { background: #007bff; color: white; }
  `]
})
export class SearchBarComponent {
  query = '';
  filter: 'all' | 'images' | 'music' = 'all';

  constructor(
    private searchService: SearchService,
    private searchState: SearchStateService
  ) {}

  onSearch(): void {
    console.log('🔍 SearchBarComponent: onSearch() called with query:', this.query, 'filter:', this.filter);
    
    if (!this.query || this.query.trim() === '') {
      console.log('🔍 SearchBarComponent: query vacía, limpiando resultados');
      this.searchState.clearResults();
      return;
    }

    // Llamada directa al servicio
    this.searchService.search(this.query.trim(), this.filter).subscribe({
      next: (results) => {
        console.log('📦 SearchBarComponent: Resultados del servicio:', results.length, results);
        // El servicio ya publica en el estado, pero lo hacemos de nuevo por si acaso
        this.searchState.setResults(results);
      },
      error: (err) => {
        console.error('❌ SearchBarComponent: Error en búsqueda:', err);
        this.searchState.clearResults();
      }
    });
  }

  setFilter(filter: 'all' | 'images' | 'music'): void {
    this.filter = filter;
    console.log('🔍 SearchBarComponent: filter changed to:', filter);
    // Si hay query, volver a buscar con el nuevo filtro
    if (this.query && this.query.trim() !== '') {
      this.onSearch();
    }
  }
}
