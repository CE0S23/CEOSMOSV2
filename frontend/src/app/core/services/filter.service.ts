import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FeedFilter = 'all' | 'images' | 'music';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private readonly STORAGE_KEY = 'feedFilter';
  
  private filterSubject = new BehaviorSubject<FeedFilter>(this.getStoredFilter());
  filter$ = this.filterSubject.asObservable();

  get currentFilter(): FeedFilter {
    return this.filterSubject.value;
  }

  setFilter(filter: FeedFilter): void {
    localStorage.setItem(this.STORAGE_KEY, filter);
    this.filterSubject.next(filter);
  }

  private getStoredFilter(): FeedFilter {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'images' || stored === 'music') {
      return stored as FeedFilter;
    }
    return 'all';
  }
}
