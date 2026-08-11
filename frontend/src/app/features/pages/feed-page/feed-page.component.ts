import { Component, inject, signal } from '@angular/core';
import { FeedDataService } from '../../../core/services/feed-data.service';
import { FlowFeedComponent } from '../../feed/flow-feed/flow-feed.component';
import { InspirationQuote } from '../../../core/models/feed-item.model';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { SeasonalWidgetComponent } from '../../../shared/components/seasonal-widget/seasonal-widget.component';

type FeedFilter = 'all' | 'image' | 'music';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [FlowFeedComponent, ChipModule, ButtonModule, SeasonalWidgetComponent],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.scss',
})
export class FeedPageComponent {
  private readonly feedData = inject(FeedDataService);

  activeFilter = signal<FeedFilter>('all');
  currentQuote = signal<InspirationQuote>(this.feedData.randomQuote());

  readonly filters: { label: string; value: FeedFilter }[] = [
    { label: 'Todo', value: 'all' },
    { label: 'Imagenes', value: 'image' },
    { label: 'Musica', value: 'music' },
  ];

  refreshQuote(): void {
    this.currentQuote.set(this.feedData.refreshQuote());
  }
}
