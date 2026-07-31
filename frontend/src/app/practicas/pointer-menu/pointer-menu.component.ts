import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { SeasonalThemeService, Season } from '../../core/services/seasonal-theme.service';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  hint?: string;
  action: () => void;
}

@Component({
  selector: 'app-pointer-menu',
  standalone: true,
  templateUrl: './pointer-menu.component.html',
  styleUrl: './pointer-menu.component.scss',
})
export class PointerMenuComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly themeService = inject(SeasonalThemeService);

  readonly menuOpen = signal(false);
  readonly menuX = signal(0);
  readonly menuY = signal(0);
  readonly activeIndex = signal(-1);
  readonly lastPosition = signal<string>('');

  readonly items = computed<MenuItem[]>(() => [
    {
      id: 'season',
      label: 'Cambiar tema estacional',
      icon: '🌍',
      action: () => this.cycleSeason(),
    },
    {
      id: 'dom',
      label: 'Ir a práctica DOM',
      icon: '🧩',
      action: () => this.navigate('/practicas/dom-demo'),
    },
    {
      id: 'tasks',
      label: 'Ir a Task Manager',
      icon: '✅',
      action: () => this.navigate('/practicas/task-manager'),
    },
    {
      id: 'home',
      label: 'Ir al inicio',
      icon: '🏠',
      action: () => this.navigate('/home'),
    },
  ]);

  @ViewChild('menu') private menuRef?: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.themeService.setAuto();
  }

  ngOnDestroy(): void {
    this.themeService.reset();
  }

  onContextMenu(event: MouseEvent, zone: string): void {
    event.preventDefault();
    this.openAt(event.clientX, event.clientY);
    this.lastPosition.set(`${zone} (${Math.round(event.clientX)}, ${Math.round(event.clientY)})`);
  }

  openAt(x: number, y: number): void {
    this.menuX.set(x);
    this.menuY.set(y);
    this.activeIndex.set(-1);
    this.menuOpen.set(true);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.activeIndex.set(-1);
  }

  select(item: MenuItem): void {
    item.action();
    this.closeMenu();
  }

  private navigate(route: string): void {
    void this.router.navigate([route]);
  }

  private cycleSeason(): void {
    const next = this.themeService.cycleNext();
    this.lastPosition.set(`Tema estacional: ${this.seasonLabel(next)}`);
  }

  seasonLabel(season: Season): string {
    const map: Record<Season, string> = {
      primavera: 'Primavera',
      verano: 'Verano',
      otono: 'Otoño',
      invierno: 'Invierno',
    };
    return map[season];
  }

  currentSeason(): string {
    return this.seasonLabel(this.themeService.season());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.menuRef?.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.closeMenu();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent): void {
    const clickedInside = this.menuRef?.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.menuOpen()) return;

    const total = this.items().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.set((this.activeIndex() + 1) % total);
      this.scrollToActive(this.activeIndex());
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set((this.activeIndex() - 1 + total) % total);
      this.scrollToActive(this.activeIndex());
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.activeIndex();
      if (idx >= 0 && idx < total) {
        this.select(this.items()[idx]);
      }
    } else if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  private scrollToActive(index: number): void {
    const li = this.menuRef?.nativeElement?.querySelectorAll('li')[index] as HTMLElement | undefined;
    li?.scrollIntoView({ block: 'nearest' });
  }
}
