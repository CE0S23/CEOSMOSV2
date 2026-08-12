import { Component, Output, EventEmitter } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { FeedItem } from '../../core/models/feed-item.model';
import { SearchStateService } from '../../core/services/search-state.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {
  @Output() searchEvent = new EventEmitter<{ query: string; filter: 'all' | 'images' | 'music' }>();
  
  query = '';
  filter: 'all' | 'images' | 'music' = 'all';

  constructor(
    private searchService: SearchService,
    private searchState: SearchStateService
  ) {}

  onSearch(): void {
    console.log('🔍 SearchBarComponent: onSearch() called with query:', this.query, 'filter:', this.filter);
    
    if (!this.query || this.query.trim() === '') {
      this.searchState.clearResults();
      this.searchEvent.emit({ query: '', filter: this.filter });
      return;
    }

    // Emitir evento para que el feed reaccione
    this.searchEvent.emit({ query: this.query.trim(), filter: this.filter });

    // Llamar al servicio (que ya actualiza el estado compartido)
    this.searchService.search(this.query.trim(), this.filter).subscribe({
      next: (results) => {
        console.log('📦 SearchBarComponent: Resultados recibidos del servicio:', results.length);
        // El servicio ya llama a searchState.setResults, pero por si acaso lo hacemos aquí también
        this.searchState.setResults(results);
      },
      error: (err) => {
        console.error('❌ SearchBarComponent: Error en búsqueda:', err);
        this.searchState.clearResults();
      }
    });
  }

  onFilterChange(filter: 'all' | 'images' | 'music'): void {
    this.filter = filter;
    console.log('🔍 SearchBarComponent: filter changed to:', filter);
    // Si hay query, volver a buscar con el nuevo filtro
    if (this.query && this.query.trim() !== '') {
      this.onSearch();
    }
  }
}
