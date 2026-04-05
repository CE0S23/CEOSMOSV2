import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer>
      <span class="copyright">&copy; 2025 CEOSMOS &mdash; Deep Work Platform</span>
      <nav class="links">
        <a routerLink="/privacidad">Privacidad</a>
        <a href="#">Términos</a>
        <a href="#">Contacto</a>
      </nav>
      <span class="version">v1.0.0</span>
    </footer>
  `,
  styles: [`
    footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1rem 2rem;
      background: #0a0e27;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
    }

    .links {
      display: flex;
      gap: 1.5rem;
    }

    .links a {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      transition: color 0.2s;
    }

    .links a:hover {
      color: #fff;
    }

    .version {
      font-family: monospace;
    }

    @media (max-width: 600px) {
      footer {
        flex-direction: column;
        text-align: center;
      }
    }
  `],
})
export class FooterComponent {}
