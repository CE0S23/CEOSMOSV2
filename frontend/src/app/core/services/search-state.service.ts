import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FeedItem } from '../models/feed-item.model';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private resultsSubject = new BehaviorSubject<FeedItem[]>([]);
  results$: Observable<FeedItem[]> = this.resultsSubject.asObservable();

  private searchingSubject = new BehaviorSubject<boolean>(false);
  searching$: Observable<boolean> = this.searchingSubject.asObservable();

  setResults(results: FeedItem[]): void {
    this.resultsSubject.next(results);
    this.searchingSubject.next(false);
  }

  clearResults(): void {
    this.resultsSubject.next([]);
    this.searchingSubject.next(false);
  }

  setSearching(active: boolean): void {
    this.searchingSubject.next(active);
  }

  hasResults(): boolean {
    return this.resultsSubject.value.length > 0;
  }
}
