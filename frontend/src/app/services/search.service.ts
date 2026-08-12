import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FeedItem, CosmosImage, MusicTrack } from '../core/models/feed-item.model';

@Injectable({
    providedIn: 'root'
})
export class SearchService {

    constructor(private http: HttpClient) { }

    /**
     * Buscar contenido a través de la API
     * @param query - Término de búsqueda
     * @param filter - Filtro de tipo de contenido
     */
    search(query: string, filter: 'all' | 'images' | 'music' = 'all'): Observable<FeedItem[]> {
        let params = new HttpParams();
        
        if (query && query.trim() !== '') {
            params = params.set('q', query.trim());
        }
        
        if (filter !== 'all') {
            params = params.set('type', filter === 'images' ? 'image' : 'music');
        }

        return this.http.get<any>('/api/search', { params }).pipe(
            map(response => this.mapToFeedItems(response)),
            catchError(error => {
                console.error('Error searching via API:', error);
                return of([]);
            })
        );
    }

    private mapToFeedItems(response: any): FeedItem[] {
        // 1. Intentar con 'media'
        let items = response?.media;
        if (items && Array.isArray(items)) {
            return items.map((item: any) => {
                const type = this.inferType(item);
                const data = this.buildData(item, type);
                return {
                    id: item.id || `search-${Math.random()}`,
                    type,
                    data
                } as FeedItem;
            });
        }

        // 2. Fallback: arreglo directo
        if (Array.isArray(response)) {
            return response.map((item: any) => {
                const type = this.inferType(item);
                const data = this.buildData(item, type);
                return {
                    id: item.id || `search-${Math.random()}`,
                    type,
                    data
                } as FeedItem;
            });
        }

        // 3. Fallback: propiedad 'results'
        if (response?.results && Array.isArray(response.results)) {
            return response.results.map((item: any) => {
                const type = this.inferType(item);
                const data = this.buildData(item, type);
                return {
                    id: item.id || `search-${Math.random()}`,
                    type,
                    data
                } as FeedItem;
            });
        }

        console.warn('SearchService: No se reconoce la estructura de la respuesta', response);
        return [];
    }

    private inferType(item: any): 'image' | 'music' {
        return (!!item.embedUrl || item.type === 'music') ? 'music' : 'image';
    }

    private buildData(item: any, type: 'image' | 'music'): any {
        if (type === 'music') {
            return {
                id: item.id || `music-${Math.random()}`,
                name: item.name || item.title || 'Música',
                embedUrl: item.embedUrl || item.url || '',
                type: item.type || 'lofi',
                description: item.description || ''
            } as MusicTrack;
        } else {
            return {
                id: item.id || `img-${Math.random()}`,
                url: item.url || item.imageUrl || '',
                title: item.title || item.name || 'Imagen',
                category: item.category || 'art',
                height: item.height || (Math.floor(Math.random() * (400 - 200 + 1)) + 200)
            } as CosmosImage;
        }
    }
}


