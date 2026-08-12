import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FeedDataService } from '../../../core/services/feed-data.service';
import { FeedCardComponent } from '../feed-card/feed-card.component';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { FeedItem, CosmosImage, MusicTrack } from '../../../core/models/feed-item.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FilterService, FeedFilter } from '../../../core/services/filter.service';
import { SearchService } from '../../../services/search.service';
import { SearchStateService } from '../../../core/services/search-state.service';
@Component({
  selector: 'app-flow-feed',
  standalone: true,
  imports: [CommonModule, FeedCardComponent, SkeletonModule, DialogModule],
  template: `
    <div class="feed-filters">
      <button 
        class="filter-btn"
        [class.active]="currentFilter === 'all'" 
        (click)="setFilter('all')">Todo</button>
      <button 
        class="filter-btn"
        [class.active]="currentFilter === 'images'" 
        (click)="setFilter('images')">Imágenes</button>
      <button 
        class="filter-btn"
        [class.active]="currentFilter === 'music'" 
        (click)="setFilter('music')">Videos</button>
    </div>

    <section class="flow-feed" aria-label="Flow Feed">
      <div class="masonry-grid">
        @for (item of filteredItems; track item.id) {
          @defer (on viewport) {
            <app-feed-card [item]="item" (itemClicked)="openDetail($event)" />
          } @placeholder {
            <div class="card-placeholder">
              <p-skeleton width="100%" height="260px" borderRadius="16px" />
            </div>
          }
        }
      </div>
    </section>

    <p-dialog 
      [header]="dialogHeader()" 
      [(visible)]="dialogVisible" 
      [modal]="true" 
      [style]="{ width: '90vw', maxWidth: '800px' }" 
      [draggable]="false" 
      [resizable]="false"
      [dismissableMask]="true">
      
      @if (selectedItem?.type === 'image') {
        <div class="dialog-content image-content">
          <img [src]="asImage(selectedItem?.data).url" [alt]="asImage(selectedItem?.data).title" style="width: 100%; border-radius: 8px;">
          <p class="dialog-description" style="margin-top: 1rem; color: #f0f4f8;">{{ asImage(selectedItem?.data).title }}</p>
          
          <div class="related-images-section" *ngIf="relatedItems.length > 0">
            <h3 style="color: white; margin-top: 2rem; margin-bottom: 1rem;">Imágenes Relacionadas</h3>
            <div class="related-grid">
              @for (rel of relatedItems; track rel.id) {
                <div class="related-card" (click)="onRelatedClick(rel)">
                  <img [src]="asImage(rel.data).url" [alt]="asImage(rel.data).title" />
                </div>
              }
            </div>
          </div>
        </div>
      }
      
      @if (selectedItem?.type === 'music') {
        <div class="dialog-content music-content">
          <iframe
            [src]="safeEmbed(getEmbedUrl(asTrack(selectedItem?.data).embedUrl))"
            allow="autoplay; encrypted-media"
            allowfullscreen
            style="width: 100%; height: 400px; border: none; border-radius: 8px;"
            title="{{ asTrack(selectedItem?.data).name }}"
          ></iframe>
          <p class="dialog-description" style="margin-top: 1rem; color: #f0f4f8;">{{ asTrack(selectedItem?.data).description }}</p>
        </div>
      }
    </p-dialog>
  `,
  styleUrl: './flow-feed.component.scss',
})
export class FlowFeedComponent implements OnInit, OnDestroy {
  readonly feedService = inject(FeedDataService);
  private sanitizer = inject(DomSanitizer);
  private filterService = inject(FilterService);
  private searchService = inject(SearchService);
  private searchState = inject(SearchStateService);

  private subscriptions = new Subscription();

  dialogVisible = false;
  selectedItem: FeedItem | null = null;
  relatedItems: FeedItem[] = [];
  
  allItems: FeedItem[] = [];
  filteredItems: FeedItem[] = [];
  currentFilter: FeedFilter = 'all';

  ngOnInit() {
    this.allItems = this.feedService.feed();
    console.log('📚 FlowFeedComponent: Feed cargado, items:', this.allItems.length);
    
    this.subscriptions.add(
      this.filterService.filter$.subscribe(filter => {
        this.currentFilter = filter;
        console.log('🔍 FlowFeedComponent: Filter changed to:', filter);
        if (!this.searchState.hasResults()) {
          this.applyFilter();
        }
      })
    );

    this.subscriptions.add(
      this.searchState.results$.subscribe(results => {
        console.log('📦 FlowFeedComponent: Resultados de búsqueda recibidos:', results?.length);
        if (results && results.length > 0) {
          this.filteredItems = results;
        } else {
          console.log('📦 FlowFeedComponent: Sin resultados, restaurando feed normal');
          this.applyFilter();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  setFilter(filter: FeedFilter) {
    this.filterService.setFilter(filter);
  }

  private applyFilter() {
    if (this.currentFilter === 'all') {
      this.filteredItems = this.allItems;
    } else if (this.currentFilter === 'images') {
      this.filteredItems = this.allItems.filter(i => i.type === 'image');
    } else if (this.currentFilter === 'music') {
      this.filteredItems = this.allItems.filter(i => i.type === 'music');
    }
    console.log('🎯 FlowFeedComponent: applyFilter, items mostrados:', this.filteredItems.length);
  }

  onSearchEvent(event: { query: string; filter: 'all' | 'images' | 'music' }): void {
    console.log('🔍 FlowFeedComponent: onSearchEvent recibido:', event);
    if (!event.query || event.query.trim() === '') {
      this.searchState.clearResults();
      return;
    }
    this.searchService.search(event.query, event.filter).subscribe({
      next: (results) => {
        console.log('📦 FlowFeedComponent: Resultados directos del servicio:', results.length);
        this.searchState.setResults(results);
      },
      error: (err) => console.error('❌ FlowFeedComponent: Error en búsqueda directa:', err)
    });
  }

  openDetail(item: FeedItem) {
    if (item.type === 'quote') return;
    
    this.selectedItem = item;
    
    if (item.type === 'image') {
      const category = this.asImage(item.data).category || '';
      this.searchService.search(category, 'images').subscribe(results => {
        this.relatedItems = results.filter(r => r.id !== item.id && r.type === 'image');
        this.dialogVisible = true;
      });
    } else {
      this.relatedItems = [];
      this.dialogVisible = true;
    }
  }

  onRelatedClick(item: FeedItem) {
    this.openDetail(item);
  }

  dialogHeader() {
    if (!this.selectedItem) return '';
    if (this.selectedItem.type === 'image') return this.asImage(this.selectedItem.data).title;
    if (this.selectedItem.type === 'music') return this.asTrack(this.selectedItem.data).name;
    return '';
  }

  asImage(d: unknown): CosmosImage { return d as CosmosImage; }
  asTrack(d: unknown): MusicTrack { return d as MusicTrack; }

  getEmbedUrl(url: string): string {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    return url;
  }

  safeEmbed(url: string | undefined): SafeResourceUrl {
    if (!url) return '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(url + '?autoplay=1&mute=0');
  }
}


