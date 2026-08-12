import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { InspirationService, CosmosImage, MusicPlaylist } from './inspiration.service';

export interface SearchResult {
    id: string;
    type: 'image' | 'music';
    title: string;
    description?: string;
    category: string;
    url: string;
    relevance?: number;
}

@Injectable({
    providedIn: 'root'
})
export class SearchService {

    constructor(private inspirationService: InspirationService) { }

    /**
     * Buscar en todo el contenido (imágenes y música)
     * @param query - Término de búsqueda
     * @param filter - Filtro de tipo de contenido
     */
    search(query: string, filter: 'all' | 'images' | 'music' = 'all'): Observable<SearchResult[]> {
        const normalizedQuery = this.normalizeString(query);

        if (filter === 'images') {
            return this.searchImages(normalizedQuery);
        } else if (filter === 'music') {
            return this.searchMusic(normalizedQuery);
        } else {
            // Buscar en ambos tipos de contenido
            return combineLatest([
                this.searchImages(normalizedQuery),
                this.searchMusic(normalizedQuery)
            ]).pipe(
                map(([images, music]) => {
                    const combined = [...images, ...music];
                    // Ordenar por relevancia
                    return combined.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
                })
            );
        }
    }

    /**
     * Buscar solo en imágenes
     */
    private searchImages(query: string): Observable<SearchResult[]> {
        return this.inspirationService.getImages().pipe(
            map(images => this.filterAndMapImages(images, query))
        );
    }

    /**
     * Buscar solo en música
     */
    private searchMusic(query: string): Observable<SearchResult[]> {
        return this.inspirationService.getPlaylists().pipe(
            map(playlists => this.filterAndMapPlaylists(playlists, query))
        );
    }

    /**
     * Filtrar y mapear imágenes a SearchResult
     */
    private filterAndMapImages(images: CosmosImage[], query: string): SearchResult[] {
        return images
            .map(image => ({
                ...image,
                relevance: this.calculateRelevance(query, image.title, image.category)
            }))
            .filter(image => image.relevance > 0)
            .map(image => ({
                id: image.id,
                type: 'image' as const,
                title: image.title,
                category: this.translateImageCategory(image.category),
                url: image.url,
                relevance: image.relevance
            }));
    }

    /**
     * Filtrar y mapear playlists a SearchResult
     */
    private filterAndMapPlaylists(playlists: MusicPlaylist[], query: string): SearchResult[] {
        return playlists
            .map(playlist => ({
                ...playlist,
                relevance: this.calculateRelevance(query, playlist.name, playlist.type, playlist.description)
            }))
            .filter(playlist => playlist.relevance > 0)
            .map(playlist => ({
                id: playlist.id,
                type: 'music' as const,
                title: playlist.name,
                description: playlist.description,
                category: this.translateMusicType(playlist.type),
                url: playlist.url,
                relevance: playlist.relevance
            }));
    }

    /**
     * Calcular la relevancia de un item basado en la query
     */
    private calculateRelevance(query: string, ...fields: string[]): number {
        if (!query || query.trim() === '') return 1;

        let relevance = 0;

        fields.forEach((field, index) => {
            if (!field) return;

            const normalizedField = this.normalizeString(field);

            // Coincidencia exacta (mayor peso)
            if (normalizedField === query) {
                relevance += 100 - (index * 10);
            }
            // Empieza con la query
            else if (normalizedField.startsWith(query)) {
                relevance += 50 - (index * 5);
            }
            // Contiene la query
            else if (normalizedField.includes(query)) {
                relevance += 25 - (index * 3);
            }
            // Coincidencia parcial con palabras
            else {
                const queryWords = query.split(' ');
                const fieldWords = normalizedField.split(' ');

                queryWords.forEach(queryWord => {
                    fieldWords.forEach(fieldWord => {
                        if (fieldWord.includes(queryWord) || queryWord.includes(fieldWord)) {
                            relevance += 10 - (index * 2);
                        }
                    });
                });
            }
        });

        return relevance;
    }

    /**
     * Normalizar string para búsqueda (lowercase, sin acentos)
     */
    private normalizeString(str: string): string {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Traducir categorías de imágenes a español
     */
    private translateImageCategory(category: string): string {
        const translations: { [key: string]: string } = {
            'space': 'Espacio',
            'nature': 'Naturaleza',
            'architecture': 'Arquitectura',
            'art': 'Arte'
        };
        return translations[category] || category;
    }

    /**
     * Traducir tipos de música a español
     */
    private translateMusicType(type: string): string {
        const translations: { [key: string]: string } = {
            'lofi': 'Lo-fi',
            'alpha': 'Ondas Alpha',
            'ambient': 'Ambiental'
        };
        return translations[type] || type;
    }
}
