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
        if (!response) return [];
        
        // Handle array or object with 'results' property
        const rawItems = Array.isArray(response) ? response : (Array.isArray(response.results) ? response.results : []);
        
        return rawItems.map((item: any, index: number) => {
            const isMusic = !!item.embedUrl || item.type === 'music';
            
            if (isMusic) {
                const musicData: MusicTrack = {
                    id: item.id || `music-${index}`,
                    name: item.name || item.title || 'Música',
                    embedUrl: item.embedUrl || item.url || '',
                    type: item.type || 'lofi',
                    description: item.description || ''
                };
                return {
                    id: `feed-trk-${musicData.id}`,
                    type: 'music',
                    data: musicData
                } as FeedItem;
            } else {
                const imageData: CosmosImage = {
                    id: item.id || `img-${index}`,
                    url: item.url || item.imageUrl || '',
                    title: item.title || item.name || 'Imagen',
                    category: item.category || 'art',
                    height: item.height || (Math.floor(Math.random() * (400 - 200 + 1)) + 200) // fallback height
                };
                return {
                    id: `feed-img-${imageData.id}`,
                    type: 'image',
                    data: imageData
                } as FeedItem;
            }
        });
    }
}


