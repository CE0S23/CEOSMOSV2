import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './features/layout/navbar/navbar.component';
import { FooterComponent } from './features/layout/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <header>
      <app-navbar />
    </header>
    <main>
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }
  `],
})
export class AppComponent {}
