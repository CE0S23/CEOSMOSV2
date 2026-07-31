import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SiteSearchService, SiteSearchResult } from '../../core/services/site-search.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  private readonly siteSearch = inject(SiteSearchService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');
  readonly results = signal<SiteSearchResult[]>([]);
  readonly showDropdown = signal(false);
  readonly activeIndex = signal(-1);

  readonly hasQuery = computed(() => (this.searchControl.value?.trim()?.length ?? 0) > 0);

  @ViewChild('resultsList') private resultsList?: ElementRef<HTMLUListElement>;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(term => {
        const query = term?.trim() ?? '';
        if (query.length < 2) {
          this.results.set([]);
          this.showDropdown.set(false);
          this.activeIndex.set(-1);
          return;
        }
        const matches = this.siteSearch.search(query).slice(0, 8);
        this.results.set(matches);
        this.showDropdown.set(matches.length > 0);
        this.activeIndex.set(-1);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectResult(result: SiteSearchResult): void {
    this.searchControl.setValue('');
    this.results.set([]);
    this.showDropdown.set(false);
    this.router.navigate([result.route]);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.results.set([]);
    this.showDropdown.set(false);
    this.activeIndex.set(-1);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown() || this.results().length === 0) return;

    const total = this.results().length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (this.activeIndex() + 1) % total;
      this.activeIndex.set(next);
      this.scrollToActive(next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (this.activeIndex() - 1 + total) % total;
      this.activeIndex.set(prev);
      this.scrollToActive(prev);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.activeIndex();
      if (idx >= 0 && idx < total) {
        this.selectResult(this.results()[idx]);
      }
    } else if (event.key === 'Escape') {
      this.closeDropdown();
    }
  }

  private scrollToActive(index: number): void {
    const li = this.resultsList?.nativeElement?.children?.[index] as HTMLElement | undefined;
    li?.scrollIntoView({ block: 'nearest' });
  }
}
