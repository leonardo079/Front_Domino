import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { StrategyName, GameMode } from '../../../core/models/api.models';

interface StrategyOption {
  value: StrategyName;
  label: string;
  tag: string;
  desc: string;
  color: string;
}

@Component({
  selector: 'app-new-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-narrow fade-in">
      <div class="page-header">
        <button class="btn btn-secondary btn-sm" (click)="router.navigate(['/'])">← Volver</button>
        <h1 class="page-title">Nueva Partida</h1>
      </div>

      <!-- Mode toggle -->
      <div class="card section">
        <p class="section-title">Modo de Juego</p>
        <div class="mode-toggle">
          <button class="mode-btn" [class.active]="gameMode === 'agent_vs_agent'" (click)="gameMode = 'agent_vs_agent'">
            ⚔️ Agente vs Agente
          </button>
          <button class="mode-btn" [class.active]="gameMode === 'agent_vs_human'" (click)="gameMode = 'agent_vs_human'">
            🧑‍💻 Tú vs IA
          </button>
        </div>
      </div>

      <!-- Strategy A -->
      <div class="card section">
        <p class="section-title">{{ gameMode === 'agent_vs_human' ? 'Estrategia de la IA' : 'Agente A (Jugador 0)' }}</p>
        <div class="strategy-grid">
          <div class="strategy-option"
               *ngFor="let s of strategies"
               [class.selected]="strategyA === s.value"
               (click)="strategyA = s.value">
            <div class="s-tag" [style.background]="s.color + '22'" [style.color]="s.color">{{s.tag}}</div>
            <div class="s-name">{{s.label}}</div>
            <div class="s-desc">{{s.desc}}</div>
          </div>
        </div>
      </div>

      <!-- Strategy B (only agent_vs_agent) -->
      <div class="card section" *ngIf="gameMode === 'agent_vs_agent'">
        <p class="section-title">Agente B (Jugador 1)</p>
        <div class="strategy-grid">
          <div class="strategy-option"
               *ngFor="let s of strategies"
               [class.selected]="strategyB === s.value"
               (click)="strategyB = s.value">
            <div class="s-tag" [style.background]="s.color + '22'" [style.color]="s.color">{{s.tag}}</div>
            <div class="s-name">{{s.label}}</div>
            <div class="s-desc">{{s.desc}}</div>
          </div>
        </div>
      </div>

      <!-- Speed -->
      <div class="card section">
        <p class="section-title">Velocidad de Reproducción</p>
        <div class="speed-row">
          <span class="speed-label mono">{{delayMs}} ms</span>
          <input type="range" class="speed-slider" min="0" max="2000" step="100" [(ngModel)]="delayMs" />
          <div class="speed-marks">
            <span>Instantáneo</span><span>Lento</span>
          </div>
        </div>
      </div>

      <div *ngIf="error" class="error-msg">⚠️ {{ error }}</div>

      <button class="btn btn-primary btn-lg start-btn" (click)="start()" [disabled]="loading">
        <span *ngIf="loading" class="spinner"></span>
        <span *ngIf="!loading">▶ Iniciar Partida</span>
        <span *ngIf="loading">Creando sesión...</span>
      </button>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .page-title { font-family: var(--font-mono); font-size: 1.5rem; margin: 0; }

    .section { margin-bottom: 1rem; }

    .mode-toggle { display: flex; gap: 0.5rem; }
    .mode-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      background: var(--surface-hover);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .mode-btn.active { background: var(--accent-subtle); border-color: var(--accent); color: var(--accent); }
    .mode-btn:hover:not(.active) { color: var(--text-primary); }

    .strategy-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.65rem;
    }
    .strategy-option {
      padding: 0.9rem;
      background: var(--surface-hover);
      border: 2px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s;
    }
    .strategy-option:hover { border-color: var(--border); }
    .strategy-option.selected { border-color: var(--accent); background: var(--accent-subtle); }
    .s-tag {
      display: inline-block;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
    }
    .s-name { font-weight: 600; font-size: 0.85rem; margin-bottom: 0.2rem; }
    .s-desc { color: var(--text-secondary); font-size: 0.75rem; line-height: 1.4; }

    .speed-row { display: flex; flex-direction: column; gap: 0.5rem; }
    .speed-label { font-size: 1rem; color: var(--accent); }
    .speed-slider {
      width: 100%;
      accent-color: var(--accent);
    }
    .speed-marks { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); }

    .error-msg {
      padding: 0.75rem 1rem;
      background: var(--red-subtle);
      color: var(--red);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .start-btn { width: 100%; justify-content: center; margin-top: 0.5rem; }
  `]
})
export class NewGameComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  gameMode: GameMode = 'agent_vs_agent';
  strategyA: StrategyName = 'hybrid';
  strategyB: StrategyName = 'random';
  delayMs = 300;
  loading = false;
  error: string | null = null;

  strategies: StrategyOption[] = [
    { value: 'random',    label: 'Random',    tag: 'RAND', desc: 'Jugada aleatoria entre las válidas.', color: '#8b90a0' },
    { value: 'manhattan', label: 'Manhattan', tag: 'MAN',  desc: 'Minimax + α-β + distancia Manhattan.', color: '#5b8def' },
    { value: 'euclidean', label: 'Euclidean', tag: 'EUC',  desc: 'Minimax + α-β + distancia Euclidiana.', color: '#3ecf8e' },
    { value: 'astar',     label: 'A* Search', tag: 'A*',   desc: 'Búsqueda best-first heurística combinada.', color: '#f5a623' },
    { value: 'hybrid',    label: 'Hybrid',    tag: 'HYB',  desc: 'A* filtra candidatas → Minimax top-K.', color: '#a78bfa' },
  ];

  ngOnInit() {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    if (mode === 'agent_vs_human') this.gameMode = 'agent_vs_human';
  }

  start() {
    this.error = null;
    this.loading = true;
    const req: any = {
      strategy_a: this.strategyA,
      game_mode: this.gameMode,
    };
    if (this.gameMode === 'agent_vs_agent') req.strategy_b = this.strategyB;

    this.api.createGame(req).subscribe({
      next: (res) => {
        this.router.navigate(['/game', res.session_id], {
          queryParams: { delay: this.delayMs }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || 'Error al crear la partida';
      }
    });
  }
}
