import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FeedItem, CosmosImage, MusicTrack } from '../core/models/feed-item.model';
import { FeedDataService } from '../core/services/feed-data.service';

@Injectable({
    providedIn: 'root'
})
export class SearchService {

    constructor(
        private http: HttpClient,
        private feedDataService: FeedDataService
    ) { }

    search(query: string, filter: 'all' | 'images' | 'music' = 'all'): Observable<FeedItem[]> {
        if (!query || query.trim() === '') {
            return of([]);
        }

        let params = new HttpParams();
        params = params.set('q', query.trim());
        
        if (filter !== 'all') {
            params = params.set('type', filter === 'images' ? 'image' : 'music');
        }

        return this.http.get<any>('/api/search', { params }).pipe(
            map(response => {
                const media = response?.media;
                if (media && Array.isArray(media) && media.length > 0) {
                    return media.map((item: any) => {
                        const type = this.inferType(item);
                        const data = this.buildData(item, type);
                        return {
                            id: item.id || `search-${Math.random()}`,
                            type,
                            data
                        } as FeedItem;
                    });
                }
                console.warn('SearchService: Backend sin resultados, usando fallback local');
                return this.localSearch(query.trim(), filter);
            }),
            catchError(error => {
                console.error('SearchService: Error en la petición, usando fallback local', error);
                return of(this.localSearch(query.trim(), filter));
            })
        );
    }

    private localSearch(query: string, filter: 'all' | 'images' | 'music'): FeedItem[] {
        const allItems = this.feedDataService.getFeedSnapshot();
        
        let filtered = allItems;
        if (filter === 'images') {
            filtered = filtered.filter(item => item.type === 'image');
        } else if (filter === 'music') {
            filtered = filtered.filter(item => item.type === 'music');
        }

        const lowerQuery = query.toLowerCase();
        return filtered.filter(item => {
            const data = item.data;
            if (item.type === 'image') {
                const title = (data as CosmosImage).title?.toLowerCase() || '';
                const category = (data as CosmosImage).category?.toLowerCase() || '';
                return title.includes(lowerQuery) || category.includes(lowerQuery);
            } else if (item.type === 'music') {
                const name = (data as MusicTrack).name?.toLowerCase() || '';
                const description = (data as MusicTrack).description?.toLowerCase() || '';
                const type = (data as MusicTrack).type?.toLowerCase() || '';
                return name.includes(lowerQuery) || description.includes(lowerQuery) || type.includes(lowerQuery);
            }
            return false;
        });
    }

    private inferType(item: any): 'image' | 'music' {
        if (item.type) {
            return item.type === 'music' ? 'music' : 'image';
        }
        if (item.embedUrl) return 'music';
        if (item.url) return 'image';
        return 'image';
    }

    private buildData(item: any, type: 'image' | 'music'): any {
        if (type === 'image') {
            return {
                id: item.id || `img-${Date.now()}`,
                url: item.url || item.imageUrl || item.src || '',
                title: item.title || item.name || 'Imagen',
                category: item.category || 'general',
                height: item.height || 300
            };
        } else {
            return {
                id: item.id || `trk-${Date.now()}`,
                name: item.name || item.title || 'Track',
                embedUrl: item.embedUrl || item.url || '',
                type: item.type || 'lofi',
                description: item.description || ''
            };
        }
    }
}
