import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FeedDataService } from '../../../core/services/feed-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { SearchBarComponent } from '../../../practicas/search-bar/search-bar.component';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SidebarModule, ButtonModule, AvatarModule, BadgeModule, OverlayPanelModule, SearchBarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  private readonly feedData = inject(FeedDataService);
  readonly auth = inject(AuthService);

  sidebarOpen = signal(false);

  navLinks: NavLink[] = [
    { label: 'Feed', path: '/feed', icon: '⚡' },
    { label: 'Inicio', path: '/home', icon: '🏠' },
    { label: 'Privacidad', path: '/privacidad', icon: '🔒' },
  ];

  externalLinks = [
    { label: 'Lofi Girl', url: 'https://www.youtube.com/c/LofiGirl', icon: 'pi pi-youtube', color: '#ff6b6b' },
    { label: 'Brain.fm', url: 'https://www.brain.fm/', icon: 'pi pi-headphones', color: '#4ecdc4' },
    { label: 'Unsplash', url: 'https://unsplash.com/', icon: 'pi pi-camera', color: '#a8e6cf' },
    { label: 'Pomofocus', url: 'https://pomofocus.io/', icon: 'pi pi-clock', color: '#ff7675' },
    { label: 'Deep Work', url: 'https://www.calnewport.com/books/deep-work/', icon: 'pi pi-book', color: '#a29bfe' }
  ];

  ngOnInit(): void {}
}

