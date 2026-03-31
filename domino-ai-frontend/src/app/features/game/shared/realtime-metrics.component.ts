// ════════════════════════════════════════════════════════════════
// realtime-metrics.component.ts — drop-in replacement (style only)
// ════════════════════════════════════════════════════════════════
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MetricPoint, RealtimeMetricsResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-realtime-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card" *ngIf="metrics; else emptyState">
      <h3 class="section-title">Métricas en tiempo real</h3>

      <div class="grid">
        <article class="metric" *ngFor="let key of chartKeys">
          <header>
            <strong>{{ key | titlecase }}</strong>
            <div class="vals">
              <span class="val-a">A: {{ latestValue(key, 'a') }}</span>
              <span class="val-b">B: {{ latestValue(key, 'b') }}</span>
            </div>
          </header>

          <svg viewBox="0 0 220 110" role="img" [attr.aria-label]="'Gráfica de ' + key">
            <defs>
              <linearGradient [id]="'ga-' + key" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#5b9cf6" stop-opacity=".25"/>
                <stop offset="100%" stop-color="#5b9cf6" stop-opacity="0"/>
              </linearGradient>
              <linearGradient [id]="'gb-' + key" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#e8a844" stop-opacity=".25"/>
                <stop offset="100%" stop-color="#e8a844" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- Grid lines -->
            <line x1="32" y1="90" x2="208" y2="90" stroke="#2a3045" stroke-width="1"/>
            <line x1="32" y1="53" x2="208" y2="53" stroke="#2a3045" stroke-width="1" stroke-dasharray="4 3"/>
            <line x1="32" y1="16" x2="208" y2="16" stroke="#2a3045" stroke-width="1" stroke-dasharray="4 3"/>
            <line x1="32" y1="16" x2="32"  y2="90" stroke="#2a3045" stroke-width="1"/>

            <!-- Axis labels -->
            <text x="28" y="92" class="lbl" text-anchor="end">0</text>
            <text x="28" y="56" class="lbl" text-anchor="end">{{ maxValue(key) / 2 | number:'1.0-0' }}</text>
            <text x="28" y="20" class="lbl" text-anchor="end">{{ maxValue(key) | number:'1.0-0' }}</text>

            <!-- Area fills -->
            <polygon [attr.points]="toArea(getSeries(key, 'a'))" [attr.fill]="'url(#ga-' + key + ')'"></polygon>
            <polygon [attr.points]="toArea(getSeries(key, 'b'))" [attr.fill]="'url(#gb-' + key + ')'"></polygon>

            <!-- Lines -->
            <polyline [attr.points]="toPolyline(getSeries(key, 'a'))" class="line-a"></polyline>
            <polyline [attr.points]="toPolyline(getSeries(key, 'b'))" class="line-b"></polyline>
          </svg>

          <p class="legend">
            <span class="dot a"></span><span>Agente A</span>
            <span class="dot b"></span><span>Agente B</span>
          </p>
        </article>
      </div>
    </section>

    <ng-template #emptyState>
      <section class="card">
        <h3 class="section-title">Métricas en tiempo real</h3>
        <p class="muted">Las series se llenarán cuando empiece la partida.</p>
      </section>
    </ng-template>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: .85rem; }

    .metric {
      border: 1px solid var(--border);
      border-radius: .8rem;
      padding: .85rem;
      background: var(--bg-alt);
      display: grid;
      gap: .55rem;
      transition: border-color .2s;
    }
    .metric:hover { border-color: var(--border-light); }

    header { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }

    strong { font-size: .85rem; color: var(--ink-strong); font-family: var(--font-body); font-weight: 600; }

    .vals { display: flex; gap: .5rem; font-family: var(--font-mono); font-size: .72rem; }
    .val-a { color: var(--agent-a); }
    .val-b { color: var(--agent-b); }

    svg { width: 100%; height: 130px; border: 1px solid var(--border); border-radius: .5rem; background: var(--surface); }

    .lbl { fill: var(--ink-soft); font-size: 7px; font-family: var(--font-mono); }

    .line-a { fill: none; stroke: var(--agent-a); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .line-b { fill: none; stroke: var(--agent-b); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .legend { margin: 0; display: flex; align-items: center; gap: .35rem; color: var(--ink-soft); font-size: .72rem; font-family: var(--font-mono); }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .dot.a { background: var(--agent-a); }
    .dot.b { background: var(--agent-b); }

    .muted { color: var(--ink-soft); font-size: .9rem; margin: 0; }
  `]
})
export class RealtimeMetricsComponent {
  @Input() metrics: RealtimeMetricsResponse | null = null;

  readonly chartKeys = ['time_ms', 'nodes_expanded', 'eval_calls', 'max_depth'];

  getSeries(key: string, side: 'a' | 'b'): MetricPoint[] {
    if (!this.metrics?.realtime_charts[key]) return [];
    return side === 'a'
      ? this.metrics.realtime_charts[key].series_a
      : this.metrics.realtime_charts[key].series_b;
  }

  latestValue(key: string, side: 'a' | 'b'): string {
    const series = this.getSeries(key, side);
    const last = series.at(-1);
    return last ? `${Math.round(last.value * 100) / 100}` : '-';
  }

  maxValue(key: string): number {
    const values = [
      ...this.getSeries(key, 'a').map(p => p.value),
      ...this.getSeries(key, 'b').map(p => p.value),
    ];
    return Math.max(1, ...values);
  }

  toPolyline(series: MetricPoint[]): string {
    if (!series.length) return '';
    const windowed = series.slice(-20);
    const max = Math.max(...windowed.map(p => p.value), 1);
    return windowed
      .map((p, i) => {
        const x = 32 + (i / Math.max(windowed.length - 1, 1)) * 176;
        const y = 90 - (p.value / max) * 74;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  toArea(series: MetricPoint[]): string {
    if (!series.length) return '';
    const windowed = series.slice(-20);
    const max = Math.max(...windowed.map(p => p.value), 1);
    const pts = windowed.map((p, i) => {
      const x = 32 + (i / Math.max(windowed.length - 1, 1)) * 176;
      const y = 90 - (p.value / max) * 74;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const firstX = 32;
    const lastX = 32 + 176;
    return `${firstX},90 ${pts.join(' ')} ${lastX},90`;
  }
}


// ════════════════════════════════════════════════════════════════
// search-tree.component.ts — drop-in replacement (style only)
// ════════════════════════════════════════════════════════════════
import { CommonModule as CM2 } from '@angular/common';
import { Component as Comp2, Input as Inp2 } from '@angular/core';
import { TreeNode, TreePayload } from '../../../core/models/api.models';

@Component({
  selector: 'app-search-tree',
  standalone: true,
  imports: [CM2],
  template: `
    <section class="card">
      <h3 class="section-title">Árbol de búsqueda (último turno)</h3>

      <div class="columns" *ngIf="tree; else emptyState">
        <section class="tree-panel">
          <header>
            <span class="agent-tag a">A</span>
            <span class="strat-name">{{ tree.strategy_a }}</span>
            <span class="node-count">{{ tree.tree_a?.nodes?.length ?? 0 }} nodos</span>
          </header>
          <ul>
            <li *ngFor="let node of previewNodes(tree.tree_a?.nodes)">
              <span [style.padding-left.px]="node.depth * 10" class="node-line">
                <span class="node-type" [class.pruned]="node.pruned">{{ node.node_type }}</span>
                <span class="node-move" *ngIf="node.move">{{ node.move }}</span>
                <span class="pruned-badge" *ngIf="node.pruned">✂ pruned</span>
              </span>
            </li>
          </ul>
        </section>

        <section class="tree-panel">
          <header>
            <span class="agent-tag b">B</span>
            <span class="strat-name">{{ tree.strategy_b }}</span>
            <span class="node-count">{{ tree.tree_b?.nodes?.length ?? 0 }} nodos</span>
          </header>
          <ul>
            <li *ngFor="let node of previewNodes(tree.tree_b?.nodes)">
              <span [style.padding-left.px]="node.depth * 10" class="node-line">
                <span class="node-type" [class.pruned]="node.pruned">{{ node.node_type }}</span>
                <span class="node-move" *ngIf="node.move">{{ node.move }}</span>
                <span class="pruned-badge" *ngIf="node.pruned">✂ pruned</span>
              </span>
            </li>
          </ul>
        </section>
      </div>

      <ng-template #emptyState>
        <p class="empty">Sin árbol aún. Inicia la partida para ver decisiones por turno.</p>
      </ng-template>
    </section>
  `,
  styles: [`
    .columns { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }

    .tree-panel { display: grid; gap: .5rem; }

    header {
      display: flex;
      align-items: center;
      gap: .45rem;
      padding-bottom: .4rem;
      border-bottom: 1px solid var(--border);
    }

    .agent-tag {
      width: 22px; height: 22px;
      border-radius: .35rem;
      display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 700; font-family: var(--font-mono);
      flex-shrink: 0;
    }
    .agent-tag.a { background: rgba(91,156,246,.18); color: var(--agent-a); }
    .agent-tag.b { background: rgba(232,168,68,.18); color: var(--agent-b); }

    .strat-name { font-size: .82rem; font-weight: 600; color: var(--ink-mid); flex: 1; }

    .node-count {
      font-family: var(--font-mono);
      font-size: .68rem;
      color: var(--ink-soft);
      background: var(--surface-strong);
      border: 1px solid var(--border);
      border-radius: .35rem;
      padding: .1rem .4rem;
    }

    ul { margin: 0; padding: 0; list-style: none; max-height: 240px; overflow: auto;
         border: 1px solid var(--border); background: var(--bg-alt); border-radius: .65rem; }

    li { border-bottom: 1px solid var(--border); }
    li:last-child { border-bottom: 0; }

    .node-line {
      display: flex;
      align-items: center;
      gap: .35rem;
      padding: .24rem .4rem;
      font-size: .74rem;
      font-family: var(--font-mono);
    }

    .node-type { color: var(--ink-soft); }
    .node-type.pruned { opacity: .45; }

    .node-move { color: var(--ink-mid); }

    .pruned-badge {
      color: var(--warn);
      font-size: .65rem;
      background: var(--warn-soft);
      border: 1px solid rgba(224,125,69,.25);
      border-radius: .3rem;
      padding: .05rem .3rem;
    }

    .empty { color: var(--ink-soft); font-size: .85rem; margin: 0; }

    @media (max-width: 960px) { .columns { grid-template-columns: 1fr; } }
  `]
})
export class SearchTreeComponent {
  @Input() tree: TreePayload | null = null;

  previewNodes(nodes: TreeNode[] | undefined): TreeNode[] {
    return (nodes ?? []).slice(0, 120);
  }
}


// ════════════════════════════════════════════════════════════════
// human-controls.component.ts — drop-in replacement (style only)
// ════════════════════════════════════════════════════════════════
import { CommonModule as CM3 } from '@angular/common';
import { Component as Comp3, EventEmitter, Input as Inp3, Output, OnChanges, SimpleChanges } from '@angular/core';
import { HumanPlayableMove, HumanTile } from '../../../core/models/api.models';

@Component({
  selector: 'app-human-controls',
  standalone: true,
  imports: [CM3],
  template: `
    <section class="card human-panel" *ngIf="tiles.length">
      <h3 class="section-title">Tu mano</h3>
      <p class="hint">{{ helperText }}</p>

      <div class="tiles" aria-label="Fichas del jugador humano">
        <button
          *ngFor="let t of tiles"
          type="button"
          class="tile-btn"
          [class.selected]="selectedKey === tileKey(t)"
          (click)="selectTile(t)">
          <span>{{ t.a }}</span>
          <span class="tile-div"></span>
          <span>{{ t.b }}</span>
        </button>
      </div>

      <div class="moves" *ngIf="selected">
        <button
          *ngFor="let move of activeMoves"
          type="button"
          class="btn btn-primary btn-sm"
          (click)="play.emit({ tile: selected!, side: move.side })">
          ← {{ move.side === 'left' ? 'Izquierda' : 'Derecha' }} →
        </button>
      </div>

      <div class="pass-row">
        <button type="button" class="btn btn-danger btn-sm" (click)="pass.emit()" [disabled]="validMoves.length > 0">
          {{ actionButtonLabel }}
        </button>
      </div>
    </section>
  `,
  styles: [`
    .human-panel { display: grid; gap: .75rem; }

    .hint { color: var(--ink-soft); font-size: .83rem; margin: 0; }

    .tiles { display: flex; flex-wrap: wrap; gap: .45rem; }

    .tile-btn {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1px solid #c8b89a;
      border-radius: .6rem;
      background: #f5ede0;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: .95rem;
      cursor: pointer;
      color: #2b2318;
      overflow: hidden;
      transition: border-color .2s, transform .15s, box-shadow .2s;
      padding: 0;
      box-shadow: 0 2px 6px rgba(0,0,0,.35);
    }

    .tile-btn span:not(.tile-div) { padding: .4rem .55rem; }

    .tile-btn .tile-div {
      width: 1px;
      height: 100%;
      align-self: stretch;
      background: #c8b89a;
      display: block;
      padding: 0;
    }

    .tile-btn:hover {
      border-color: var(--accent-strong);
      background: #fff8f0;
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0,0,0,.4), 0 0 0 2px var(--accent-glow);
    }

    .tile-btn.selected {
      border-color: var(--accent-strong);
      background: #fff3d6;
      box-shadow: 0 0 0 2px var(--accent-strong), 0 6px 16px var(--accent-glow);
    }

    .tile-btn.selected span:not(.tile-div) { color: #7a4a00; }

    .moves { display: flex; flex-wrap: wrap; gap: .4rem; }

    .pass-row { display: flex; }
  `]
})
export class HumanControlsComponent implements OnChanges {
  @Input() tiles: HumanTile[] = [];
  @Input() validMoves: HumanPlayableMove[] = [];
  @Input() poolSize = 0;

  @Output() play = new EventEmitter<{ tile: HumanTile; side: 'left' | 'right' }>();
  @Output() pass = new EventEmitter<void>();

  selected: HumanTile | null = null;

  get activeMoves(): HumanPlayableMove[] {
    if (!this.selected) return [];
    return this.validMoves.filter(move => this.matchTile(this.selected!, move.tile));
  }

  get selectedKey(): string | null {
    return this.selected ? this.tileKey(this.selected) : null;
  }

  get actionButtonLabel(): string {
    if (this.validMoves.length > 0) return 'Pasar';
    return this.poolSize > 0 ? 'Robar del pozo' : 'Pasar';
  }

  get helperText(): string {
    if (this.validMoves.length > 0) return 'Selecciona una ficha y un lado para jugar.';
    return this.poolSize > 0
      ? 'No tienes jugadas. Pulsa "Robar del pozo" para tomar fichas automáticamente.'
      : 'No hay jugadas ni pozo disponible. Puedes pasar el turno.';
  }

  tileKey(tile: Pick<HumanTile, 'a' | 'b'>): string {
    return `${Math.min(tile.a, tile.b)}-${Math.max(tile.a, tile.b)}`;
  }

  selectTile(tile: HumanTile): void { this.selected = tile; }

  matchTile(tileA: Pick<HumanTile, 'a' | 'b'>, tileB: Pick<HumanTile, 'a' | 'b'>): boolean {
    return this.tileKey(tileA) === this.tileKey(tileB);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tiles']) this.selected = null;
  }
}