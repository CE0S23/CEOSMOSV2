import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchService, SearchResult } from '../../services/search.service';

@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
    searchControl = new FormControl('');
    searchResults: SearchResult[] = [];
    isSearching = false;
    showResults = false;
    selectedFilter: 'all' | 'images' | 'music' = 'all';

    @Output() resultSelected = new EventEmitter<SearchResult>();

    constructor(private searchService: SearchService) { }

    ngOnInit(): void {
        // Escuchar cambios en el input con debounce para evitar búsquedas excesivas
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            const safeQuery = query || '';
            this.performSearch(safeQuery.trim());
        });
    }

    performSearch(query: string): void {
        this.isSearching = true;
        this.searchService.search(query, this.selectedFilter).subscribe((results: SearchResult[]) => {
            this.searchResults = results;
            this.showResults = true;
            this.isSearching = false;
        });
    }

    selectResult(result: SearchResult): void {
        this.resultSelected.emit(result);
        this.showResults = false;
        this.searchControl.setValue('');
    }

    clearResults(): void {
        this.searchResults = [];
        this.showResults = false;
        this.isSearching = false;
    }

    setFilter(filter: 'all' | 'images' | 'music'): void {
        this.selectedFilter = filter;
        const currentQuery = this.searchControl.value || '';
        this.performSearch(currentQuery.trim());
    }

    clearSearch(): void {
        this.searchControl.setValue('');
        this.clearResults();
    }

    getResultIcon(type: string): string {
        switch (type) {
            case 'image':
                return 'image';
            case 'music':
                return 'music_note';
            default:
                return 'search';
        }
    }

    getResultTypeLabel(type: string): string {
        switch (type) {
            case 'image':
                return 'Imagen';
            case 'music':
                return 'Música';
            default:
                return 'Resultado';
        }
    }
}
