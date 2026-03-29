import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface StrategyDetail {
  name: string;
  tag: string;
  color: string;
  fullName: string;
  description: string;
  details: string[];
  complexity: string;
  bestFor: string;
}

@Component({
  selector: 'app-strategies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page fade-in">
      <div class="strat-header">
        <div>
          <h1 class="strat-title mono">Estrategias de IA</h1>
          <p class="strat-sub">Algoritmos de búsqueda implementados en el backend</p>
        </div>
        <button class="btn btn-primary" (click)="router.navigate(['/game/new'])">Nueva Partida →</button>
      </div>

      <!-- Algorithm cards -->
      <div class="strat-grid">
        <div class="strat-card" *ngFor="let s of strategies">
          <div class="sc-top">
            <div class="sc-tag" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.tag }}</div>
            <div class="sc-info">
              <div class="sc-name">{{ s.fullName }}</div>
              <div class="sc-key mono">{{ s.name }}</div>
            </div>
          </div>

          <p class="sc-desc">{{ s.description }}</p>

          <ul class="sc-details">
            <li *ngFor="let d of s.details">{{ d }}</li>
          </ul>

          <div class="sc-meta">
            <div class="sc-meta-item">
              <span class="sc-meta-label">Complejidad</span>
              <span class="sc-meta-val mono">{{ s.complexity }}</span>
            </div>
            <div class="sc-meta-item">
              <span class="sc-meta-label">Mejor para</span>
              <span class="sc-meta-val">{{ s.bestFor }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Metrics explanation -->
      <div class="metrics-explain card" style="margin-top:1.5rem">
        <p class="section-title">Métricas Registradas</p>
        <div class="metrics-grid">
          <div class="metric-item" *ngFor="let m of metrics">
            <div class="metric-name mono">{{ m.key }}</div>
            <div class="metric-desc">{{ m.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .strat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .strat-title { font-size: 1.6rem; margin: 0; }
    .strat-sub { color: var(--text-secondary); margin: 0.25rem 0 0; }

    .strat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }

    .strat-card {
      padding: 1.25rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: border-color 0.15s;
    }
    .strat-card:hover { border-color: var(--text-muted); }

    .sc-top { display: flex; align-items: center; gap: 0.75rem; }
    .sc-tag {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 10px;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .sc-name { font-weight: 600; font-size: 1rem; }
    .sc-key { font-size: 0.75rem; color: var(--text-muted); }

    .sc-desc { color: var(--text-secondary); font-size: 0.875rem; margin: 0; line-height: 1.6; }

    .sc-details {
      margin: 0;
      padding: 0 0 0 1.25rem;
      color: var(--text-secondary);
      font-size: 0.82rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .sc-details li::marker { color: var(--text-muted); }

    .sc-meta { display: flex; gap: 1.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); margin-top: auto; }
    .sc-meta-item { display: flex; flex-direction: column; gap: 0.1rem; }
    .sc-meta-label { font-size: 0.68rem; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase; }
    .sc-meta-val { font-size: 0.82rem; color: var(--text-secondary); }

    /* Metrics section */
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .metric-item { padding: 0.75rem; background: var(--surface-hover); border-radius: var(--radius-sm); }
    .metric-name { font-size: 0.82rem; color: var(--accent); margin-bottom: 0.3rem; }
    .metric-desc { font-size: 0.78rem; color: var(--text-secondary); }
  `]
})
export class StrategiesComponent implements OnInit {
  router = inject(Router);
  private api = inject(ApiService);

  strategies: StrategyDetail[] = [
    {
      name: 'random',
      tag: 'RAND',
      color: '#8b90a0',
      fullName: 'Random Baseline',
      description: 'Selecciona aleatoriamente entre todas las jugadas válidas. Sirve como línea base para comparar el rendimiento de los algoritmos más sofisticados.',
      details: [
        'Sin función heurística',
        'Costo computacional mínimo',
        'O(1) por turno',
        'Útil como referencia de rendimiento',
      ],
      complexity: 'O(1)',
      bestFor: 'Línea base de comparación',
    },
    {
      name: 'manhattan',
      tag: 'MAN',
      color: '#5b8def',
      fullName: 'Minimax + α-β (Manhattan)',
      description: 'Árbol de búsqueda Minimax con poda alfa-beta. La heurística mide la distancia Manhattan entre los extremos del tablero y los pips de las fichas en mano.',
      details: [
        'Profundidad de búsqueda: 4 niveles',
        'Poda α-β reduce el espacio de búsqueda',
        'Minimiza la distancia media entre fichas y extremos',
        'Buena para fichas secuencialmente cercanas',
      ],
      complexity: 'O(b^(d/2)) con α-β',
      bestFor: 'Fichas con valores consecutivos',
    },
    {
      name: 'euclidean',
      tag: 'EUC',
      color: '#3ecf8e',
      fullName: 'Minimax + α-β (Euclidiana)',
      description: 'Idéntica arquitectura al agente Manhattan pero con distancia Euclidiana. Penaliza más fuertemente las fichas con valores muy alejados de los extremos del tablero.',
      details: [
        'Profundidad de búsqueda: 4 niveles',
        'Penaliza diferencias grandes de forma cuadrática',
        'Más sensible a fichas de alto valor aisladas',
        'Comparación directa con Manhattan',
      ],
      complexity: 'O(b^(d/2)) con α-β',
      bestFor: 'Análisis comparativo de métricas de distancia',
    },
    {
      name: 'astar',
      tag: 'A*',
      color: '#f5a623',
      fullName: 'A* Best-First Search',
      description: 'Búsqueda A* pura que explora el espacio de estados por costo f(n) = g(n) + h(n), donde g es el progreso del juego y h es la heurística combinada Manhattan + Euclidiana.',
      details: [
        'Garantiza solución óptima bajo admisibilidad',
        'Heurística = promedio (Manhattan + Euclidiana)',
        'Hasta 2000 nodos expandidos por turno',
        'Mejor en tableros con poca ramificación',
      ],
      complexity: 'O(b^d) sin poda',
      bestFor: 'Búsqueda óptima en espacios acotados',
    },
    {
      name: 'hybrid',
      tag: 'HYB',
      color: '#a78bfa',
      fullName: 'Hybrid A* + Minimax',
      description: 'El agente más sofisticado. Fase 1: A* rankea todas las jugadas válidas por f(n). Fase 2: Minimax + α-β se ejecuta sólo sobre las top-K candidatas, combinando lo mejor de ambos enfoques.',
      details: [
        'Fase A*: filtra y ordena candidatas top-4',
        'Fase Minimax: profundidad 4 sobre el subconjunto',
        'A*-ordering dentro del árbol Minimax',
        'Profundidad adaptativa según el estado del juego',
        'El agente más costoso computacionalmente',
      ],
      complexity: 'O(K × b^(d/2))',
      bestFor: 'Máxima calidad de decisión',
    },
  ];

  metrics = [
    { key: 'time_ms', desc: 'Tiempo en milisegundos que tardó el agente en decidir su jugada.' },
    { key: 'nodes_expanded', desc: 'Número de nodos del árbol de búsqueda visitados durante la decisión.' },
    { key: 'eval_calls', desc: 'Número de veces que se llamó a la función heurística de evaluación.' },
    { key: 'max_depth', desc: 'Profundidad máxima alcanzada en el árbol de búsqueda durante el turno.' },
  ];

  ngOnInit() {
    // Could fetch live descriptions from API here
  }
}
