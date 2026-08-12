import { Component, inject } from '@angular/core';
import { FeedDataService } from '../../../core/services/feed-data.service';
import { FeedCardComponent } from '../feed-card/feed-card.component';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { FeedItem, CosmosImage, MusicTrack } from '../../../core/models/feed-item.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-flow-feed',
  standalone: true,
  imports: [FeedCardComponent, SkeletonModule, DialogModule],
  template: `
    <section class="flow-feed" aria-label="Flow Feed">
      <div class="masonry-grid">
        @for (item of feedService.feed(); track item.id) {
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
        </div>
      }
      
      @if (selectedItem?.type === 'music') {
        <div class="dialog-content music-content">
          <iframe
            [src]="safeEmbed(asTrack(selectedItem?.data).embedUrl)"
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
export class FlowFeedComponent {
  readonly feedService = inject(FeedDataService);
  private sanitizer = inject(DomSanitizer);

  dialogVisible = false;
  selectedItem: FeedItem | null = null;

  openDetail(item: FeedItem) {
    if (item.type === 'quote') return;
    this.selectedItem = item;
    this.dialogVisible = true;
  }

  dialogHeader() {
    if (!this.selectedItem) return '';
    if (this.selectedItem.type === 'image') return this.asImage(this.selectedItem.data).title;
    if (this.selectedItem.type === 'music') return this.asTrack(this.selectedItem.data).name;
    return '';
  }

  asImage(d: unknown): CosmosImage { return d as CosmosImage; }
  asTrack(d: unknown): MusicTrack { return d as MusicTrack; }

  safeEmbed(url: string | undefined): SafeResourceUrl {
    if (!url) return '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(url + '?autoplay=1&mute=0');
  }
}

