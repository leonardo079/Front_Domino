import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <nav class="navbar">
        <div class="navbar-brand">
          <span class="domino-icon">🁣</span>
          <span class="brand-text">Dominó <span class="brand-accent">AI</span></span>
        </div>
        <ul class="navbar-links">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Inicio</a></li>
          <li><a routerLink="/game/new" routerLinkActive="active">Nueva Partida</a></li>
          <li><a routerLink="/benchmark" routerLinkActive="active">Benchmark</a></li>
          <li><a routerLink="/strategies" routerLinkActive="active">Estrategias</a></li>
        </ul>
      </nav>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 60px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: 1.2rem;
      color: var(--text-primary);
      text-decoration: none;
    }
    .domino-icon { font-size: 1.5rem; }
    .brand-accent { color: var(--accent); }
    .navbar-links {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 0.25rem;
    }
    .navbar-links a {
      display: block;
      padding: 0.4rem 0.9rem;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s;
    }
    .navbar-links a:hover { color: var(--text-primary); background: var(--surface-hover); }
    .navbar-links a.active { color: var(--accent); background: var(--accent-subtle); }
    .main-content { flex: 1; }
  `]
})
export class AppComponent {}
