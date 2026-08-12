import { Component, input, output, signal } from '@angular/core';
import { FeedItem, CosmosImage, MusicTrack, InspirationQuote } from '../../../core/models/feed-item.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-feed-card',
  standalone: true,
  imports: [SkeletonModule, TagModule, ButtonModule],
  template: `
    @if (item().type === 'image') {
      <article class="card card-image" [style.height.px]="asImage(item().data).height ?? 280" (click)="itemClicked.emit(item())">
        <img
          [src]="asImage(item().data).url"
          [alt]="asImage(item().data).title"
          class="card-img"
          loading="lazy"
          (load)="imgLoaded.set(true)"
          [class.hidden]="!imgLoaded()"
        />
        @if (!imgLoaded()) {
          <p-skeleton width="100%" height="100%" styleClass="card-skeleton" />
        }
        <div class="card-overlay">
          <p-tag [value]="asImage(item().data).category" severity="secondary" />
          <span class="card-title">{{ asImage(item().data).title }}</span>
        </div>
        <div class="card-actions-overlay">
          <p-button icon="pi pi-bookmark" rounded="true" text="true" (onClick)="$event.stopPropagation()" aria-label="Guardar" />
          <p-button icon="pi pi-eye" rounded="true" text="true" (onClick)="$event.stopPropagation()" aria-label="Ver" />
        </div>
      </article>
    }

    @if (item().type === 'music') {
      <article class="card card-music" (click)="itemClicked.emit(item())">
        <div class="music-header">
          <span class="music-type-badge" [attr.data-type]="asTrack(item().data).type">
            {{ asTrack(item().data).type }}
          </span>
          <h3 class="music-name">{{ asTrack(item().data).name }}</h3>
          <p class="music-desc">{{ asTrack(item().data).description }}</p>
        </div>
        @if (isPlaying()) {
          <iframe
            class="music-embed"
            [src]="safeEmbed(asTrack(item().data).embedUrl)"
            allow="autoplay; encrypted-media"
            allowfullscreen
            loading="lazy"
            title="{{ asTrack(item().data).name }}"
          ></iframe>
        } @else {
          <button class="play-btn" (click)="isPlaying.set(true)" [attr.aria-label]="'Reproducir ' + asTrack(item().data).name">
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Reproducir
          </button>
        }
      </article>
    }

    @if (item().type === 'quote') {
      <article class="card card-quote" (click)="itemClicked.emit(item())">
        <svg class="quote-mark" viewBox="0 0 40 40" fill="none">
          <path d="M10 20c0-5.5 4.5-10 10-10V5C9.4 5 1 13.4 1 24v11h16V20H10zm22 0c0-5.5 4.5-10 10-10V5c-10.6 0-19 8.4-19 19v11h16V20h-7z" fill="currentColor" opacity="0.15"/>
        </svg>
        <blockquote class="quote-text">{{ asQuote(item().data).text }}</blockquote>
        <cite class="quote-author">— {{ asQuote(item().data).author }}</cite>
        <span class="quote-cat">{{ asQuote(item().data).category }}</span>
      </article>
    }
  `,
  styleUrl: './feed-card.component.scss',
})
export class FeedCardComponent {
  item = input.required<FeedItem>();
  itemClicked = output<FeedItem>();

  imgLoaded = signal(false);
  isPlaying = signal(false);

  constructor(private sanitizer: DomSanitizer) {}

  asImage(d: unknown): CosmosImage { return d as CosmosImage; }
  asTrack(d: unknown): MusicTrack { return d as MusicTrack; }
  asQuote(d: unknown): InspirationQuote { return d as InspirationQuote; }

  safeEmbed(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url + '?autoplay=1&mute=0');
  }
}
