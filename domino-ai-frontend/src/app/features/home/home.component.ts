import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home">
      <div class="hero">
        <div class="hero-content fade-in">
          <div class="hero-eyebrow">Inteligencia Artificial · Análisis Comparativo</div>
          <h1 class="hero-title">
            <span class="title-domino">Dominó</span>
            <span class="title-ai">AI</span>
          </h1>
          <p class="hero-desc">
            Visualiza y compara algoritmos de búsqueda inteligente jugando al dominó doble-6.
            Minimax, A* y algoritmos híbridos en tiempo real.
          </p>

          <div class="mode-cards">
            <div class="mode-card" (click)="goNew('agent_vs_agent')">
              <div class="mode-icon">⚔️</div>
              <div class="mode-info">
                <div class="mode-name">Agente vs Agente</div>
                <div class="mode-desc">Dos estrategias se enfrentan. Observa las métricas en tiempo real.</div>
              </div>
              <div class="mode-arrow">→</div>
            </div>

            <div class="mode-card" (click)="goNew('agent_vs_human')">
              <div class="mode-icon">🧑‍💻</div>
              <div class="mode-info">
                <div class="mode-name">Tú vs IA</div>
                <div class="mode-desc">Juega contra uno de los agentes y analiza sus decisiones.</div>
              </div>
              <div class="mode-arrow">→</div>
            </div>

            <div class="mode-card" (click)="goBenchmark()">
              <div class="mode-icon">📊</div>
              <div class="mode-info">
                <div class="mode-name">Benchmark / Torneo</div>
                <div class="mode-desc">Ejecuta torneos de múltiples partidas. Compara win rates y costos.</div>
              </div>
              <div class="mode-arrow">→</div>
            </div>
          </div>
        </div>

        <div class="hero-board fade-in">
          <div class="demo-board">
            <div class="demo-tile" *ngFor="let tile of demoTiles">
              <span class="pip-l">{{tile[0]}}</span>
              <span class="pip-r">{{tile[1]}}</span>
            </div>
          </div>
          <div class="demo-label">Tablero de ejemplo</div>
        </div>
      </div>

      <div class="features page">
        <p class="section-title">Algoritmos Implementados</p>
        <div class="feature-grid">
          <div class="feature-card" *ngFor="let s of strategies">
            <div class="feature-badge" [style.background]="s.color + '22'" [style.color]="s.color">{{s.tag}}</div>
            <div class="feature-name">{{s.name}}</div>
            <div class="feature-desc">{{s.desc}}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home { min-height: calc(100vh - 60px); }

    .hero {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 3rem;
      align-items: center;
      padding: 4rem 3rem;
      max-width: 1300px;
      margin: 0 auto;
    }

    .hero-eyebrow {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent);
      margin-bottom: 1rem;
    }

    .hero-title {
      font-family: var(--font-mono);
      font-size: clamp(3rem, 6vw, 5rem);
      font-weight: 700;
      line-height: 1;
      margin: 0 0 1.25rem;
      letter-spacing: -0.02em;
    }
    .title-domino { color: var(--text-primary); }
    .title-ai {
      display: inline-block;
      margin-left: 0.3em;
      color: var(--accent);
      position: relative;
    }
    .title-ai::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 0;
      width: 100%;
      height: 3px;
      background: var(--accent);
      border-radius: 2px;
    }

    .hero-desc {
      color: var(--text-secondary);
      font-size: 1.05rem;
      max-width: 520px;
      margin: 0 0 2.5rem;
      line-height: 1.7;
    }

    .mode-cards { display: flex; flex-direction: column; gap: 0.75rem; }

    .mode-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.2s;
    }
    .mode-card:hover {
      border-color: var(--accent);
      background: var(--surface-hover);
      transform: translateX(4px);
    }
    .mode-icon { font-size: 1.5rem; flex-shrink: 0; }
    .mode-info { flex: 1; }
    .mode-name { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.15rem; }
    .mode-desc { color: var(--text-secondary); font-size: 0.82rem; }
    .mode-arrow { color: var(--text-muted); font-size: 1.1rem; transition: transform 0.15s; }
    .mode-card:hover .mode-arrow { transform: translateX(4px); color: var(--accent); }

    /* Demo board */
    .hero-board { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .demo-board {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      max-width: 380px;
      justify-content: center;
    }
    .demo-tile {
      display: inline-flex;
      align-items: stretch;
      background: #f5f5f5;
      border-radius: 3px;
      border: 2px solid #ccc;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.85rem;
      color: #111;
    }
    .pip-l { padding: 0.25rem 0.4rem; border-right: 2px solid #ccc; }
    .pip-r { padding: 0.25rem 0.4rem; }
    .demo-label { font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); }

    /* Features */
    .features { padding-top: 0; padding-bottom: 3rem; }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
    .feature-card {
      padding: 1.1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .feature-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .feature-name { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; }
    .feature-desc { color: var(--text-secondary); font-size: 0.8rem; line-height: 1.5; }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; }
      .hero-board { display: none; }
    }
  `]
})
export class HomeComponent {
  constructor(private router: Router) {}

  demoTiles = [[6,6],[6,5],[5,4],[4,3],[3,2],[2,1],[1,0],[0,0]];

  strategies = [
    { tag: 'RAND', name: 'Random', desc: 'Baseline: selecciona una jugada válida al azar.', color: '#8b90a0' },
    { tag: 'MAN', name: 'Manhattan', desc: 'Minimax + poda α-β con heurística de distancia Manhattan.', color: '#5b8def' },
    { tag: 'EUC', name: 'Euclidean', desc: 'Minimax + poda α-β con heurística de distancia Euclidiana.', color: '#3ecf8e' },
    { tag: 'A*', name: 'A* Search', desc: 'Búsqueda best-first con heurística combinada.', color: '#f5a623' },
    { tag: 'HYB', name: 'Hybrid', desc: 'A* para filtrar candidatas → Minimax + α-β sobre top-K.', color: '#a78bfa' },
  ];

  goNew(mode: string) {
    this.router.navigate(['/game/new'], { queryParams: { mode } });
  }
  goBenchmark() { this.router.navigate(['/benchmark']); }
}
