import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FeedItem } from '../models/feed-item.model';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private resultsSubject = new BehaviorSubject<FeedItem[]>([]);
  results$: Observable<FeedItem[]> = this.resultsSubject.asObservable();

  setResults(results: FeedItem[]): void {
    this.resultsSubject.next(results);
  }

  clearResults(): void {
    this.resultsSubject.next([]);
  }
  
  hasResults(): boolean {
    return this.resultsSubject.value.length > 0;
  }
}
