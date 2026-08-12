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
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SearchService } from '../../services/search.service';
import { SearchStateService } from '../../core/services/search-state.service';

export interface ApiSearchResult {
  id: string;
  type: string;
  title: string;
  description?: string;
  category: string;
  url?: string;
  route?: string;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly searchService = inject(SearchService);
  private readonly searchState = inject(SearchStateService);

  readonly searchControl = new FormControl('');
  readonly results = signal<ApiSearchResult[]>([]);
  readonly showDropdown = signal(false);
  readonly activeIndex = signal(-1);

  readonly hasQuery = computed(() => (this.searchControl.value?.trim()?.length ?? 0) > 0);

  @ViewChild('resultsList') private resultsList?: ElementRef<HTMLUListElement>;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap(term => {
          const query = term?.trim() ?? '';
          if (query.length < 2) {
            return of({ users: [], tasks: [], media: [] });
          }
          return this.http.get<any>(`${environment.apiUrl}/search?q=${encodeURIComponent(query)}`).pipe(
            catchError(() => of({ users: [], tasks: [], media: [] }))
          );
        })
      )
      .subscribe(data => {
        const query = this.searchControl.value?.trim() ?? '';
        if (query.length < 2) {
          this.results.set([]);
          this.showDropdown.set(false);
          this.activeIndex.set(-1);
          return;
        }

        let mapped: ApiSearchResult[] = [];
        
        const users = data.users || [];
        mapped = mapped.concat(users.map((u: any) => ({
            id: u.id,
            type: 'user',
            title: u.username,
            description: u.email,
            category: 'Usuario',
            route: `/admin/usuarios`
        })));

        const tasks = data.tasks || [];
        mapped = mapped.concat(tasks.map((t: any) => ({
            id: t.id,
            type: 'task',
            title: t.title,
            description: t.description || 'Sin descripción',
            category: t.status || 'Tarea',
            route: `/practicas/task-manager`
        })));

        const media = data.media || [];
        mapped = mapped.concat(media.map((m: any) => ({
            id: m.id,
            type: 'media',
            title: m.filename,
            description: m.mimeType,
            category: 'Archivo',
            url: m.url
        })));

        this.results.set(mapped.slice(0, 8));
        this.showDropdown.set(mapped.length > 0);
        this.activeIndex.set(-1);

        // Publicar resultados en el feed a través de SearchService + SearchStateService
        console.log('🔍 NavbarSearchBar: publicando búsqueda al feed, query:', query);
        this.searchService.search(query, 'all').subscribe({
          next: (feedResults) => {
            console.log('📦 NavbarSearchBar: feed actualizado con', feedResults.length, 'resultados');
          },
          error: (err) => console.error('❌ NavbarSearchBar: error publicando al feed', err)
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectResult(result: ApiSearchResult): void {
    this.searchControl.setValue('');
    this.results.set([]);
    this.showDropdown.set(false);
    if (result.route) {
        this.router.navigate([result.route]);
    } else if (result.url) {
        window.open(result.url, '_blank');
    }
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.results.set([]);
    this.showDropdown.set(false);
    this.activeIndex.set(-1);
    // Limpiar resultados del feed
    this.searchState.clearResults();
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
