import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BenchmarkMatchupDone } from '../../core/models/api.models';

// ─── Chart.js loaded from CDN at runtime ────────────────────────────────────
declare const Chart: any;

const PALETTE = {
  blue:   '#378ADD',
  amber:  '#EF9F27',
  teal:   '#1D9E75',
  coral:  '#D85A30',
  purple: '#7F77DD',
  green:  '#639922',
  gray:   '#888780',
};

const MATCHUP_COLORS = [
  PALETTE.blue,
  PALETTE.amber,
  PALETTE.teal,
  PALETTE.coral,
  PALETTE.purple,
];

interface StratSummary {
  strategy: string;
  time: number;
  nodes: number;
  evals: number;
  depth: number;
  winrate: number;
}

interface BarMetric {
  label: string;
  value: number;
  pct: number;
  color: string;
  display: string;
}

interface StratBarGroup {
  strategy: string;
  metrics: BarMetric[];
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-benchmark-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="bm-charts" *ngIf="results.length">

  <!-- KPIs ─────────────────────────────────────────────────────────────────── -->
  <div class="kpi-row">
    <article class="kpi">
      <span class="kpi-label">Matchups</span>
      <strong class="kpi-value">{{ results.length }}</strong>
      <span class="kpi-sub">configuraciones</span>
    </article>
    <article class="kpi">
      <span class="kpi-label">Partidas totales</span>
      <strong class="kpi-value">{{ totalGames }}</strong>
      <span class="kpi-sub">{{ results[0]?.n_games }} por matchup</span>
    </article>
    <article class="kpi">
      <span class="kpi-label">Mayor win rate A</span>
      <strong class="kpi-value">{{ bestResult?.win_rate_a }}%</strong>
      <span class="kpi-sub">{{ bestResult?.agent_a }} vs {{ bestResult?.agent_b }}</span>
    </article>
    <article class="kpi">
      <span class="kpi-label">Turnos promedio</span>
      <strong class="kpi-value">{{ avgTurns }}</strong>
      <span class="kpi-sub">por partida</span>
    </article>
  </div>

  <!-- Win rate stacked bar ──────────────────────────────────────────────────── -->
  <article class="chart-card">
    <h3 class="chart-title">Tasa de victoria por matchup</h3>
    <p class="chart-sub">Distribución de victorias A / empates / victorias B (% de partidas)</p>
    <div class="legend-row">
      <span><i class="dot" style="background:{{ PALETTE.blue }}"></i>Victoria A</span>
      <span><i class="dot" style="background:{{ PALETTE.gray }}"></i>Empate</span>
      <span><i class="dot" style="background:{{ PALETTE.amber }}"></i>Victoria B</span>
    </div>
    <div class="canvas-wrap" style="height:260px">
      <canvas #winrateCanvas></canvas>
    </div>
  </article>

  <!-- Grid 2 cols ────────────────────────────────────────────────────────────── -->
  <div class="two-col">

    <!-- Turnos promedio ───────────────────────────────────────────────────── -->
    <article class="chart-card">
      <h3 class="chart-title">Duración promedio</h3>
      <p class="chart-sub">Turnos por partida según matchup</p>
      <div class="canvas-wrap" style="height:220px">
        <canvas #turnsCanvas></canvas>
      </div>
    </article>

    <!-- Ventaja de pips scatter ───────────────────────────────────────────── -->
    <article class="chart-card">
      <h3 class="chart-title">Ventaja de pips por partida</h3>
      <p class="chart-sub">pips_B − pips_A (positivo = A gana)</p>
      <div class="canvas-wrap" style="height:220px">
        <canvas #pipsCanvas></canvas>
      </div>
    </article>

    <!-- Tabla métricas A ──────────────────────────────────────────────────── -->
    <article class="chart-card">
      <h3 class="chart-title">Eficiencia computacional — Agente A</h3>
      <p class="chart-sub">Promedio por estrategia en los matchups disputados</p>
      <div class="metrics-table">
        <ng-container *ngFor="let group of metricsA">
          <p class="strat-name">{{ group.strategy }}</p>
          <div *ngFor="let m of group.metrics" class="m-row">
            <span class="m-label">{{ m.label }}</span>
            <div class="m-bar-outer">
              <div class="m-bar-inner" [style.width.%]="m.pct" [style.background]="m.color"></div>
            </div>
            <span class="m-val">{{ m.display }}</span>
          </div>
        </ng-container>
      </div>
    </article>

    <!-- Tabla métricas B ──────────────────────────────────────────────────── -->
    <article class="chart-card">
      <h3 class="chart-title">Eficiencia computacional — Agente B</h3>
      <p class="chart-sub">Promedio por estrategia en los matchups disputados</p>
      <div class="metrics-table">
        <ng-container *ngFor="let group of metricsB">
          <p class="strat-name">{{ group.strategy }}</p>
          <div *ngFor="let m of group.metrics" class="m-row">
            <span class="m-label">{{ m.label }}</span>
            <div class="m-bar-outer">
              <div class="m-bar-inner" [style.width.%]="m.pct" [style.background]="m.color"></div>
            </div>
            <span class="m-val">{{ m.display }}</span>
          </div>
        </ng-container>
      </div>
    </article>

  </div>

  <!-- Radar ─────────────────────────────────────────────────────────────────── -->
  <article class="chart-card">
    <h3 class="chart-title">Radar comparativo de estrategias</h3>
    <p class="chart-sub">Cada eje normalizado al máximo observado — win rate (mayor=mejor), resto (mayor=más costoso)</p>
    <div class="canvas-wrap" style="height:340px">
      <canvas #radarCanvas></canvas>
    </div>
  </article>

</div>
  `,
  styles: [`
    .bm-charts {
      display: grid;
      gap: 1.1rem;
      margin-top: .25rem;
      animation: fadeUp .35s ease both;
    }

    /* ── KPIs ── */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: .7rem;
    }

    .kpi {
      background: var(--surface-strong);
      border: 1px solid var(--border);
      border-radius: .85rem;
      padding: .9rem 1rem;
      display: grid;
      gap: .15rem;
      transition: border-color .2s, transform .2s;
    }
    .kpi:hover { border-color: var(--border-light); transform: translateY(-2px); }

    .kpi-label {
      font-size: .65rem;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: .12em;
      color: var(--ink-soft);
    }
    .kpi-value {
      font-size: 1.5rem;
      font-family: var(--font-mono);
      font-weight: 600;
      color: var(--ink-strong);
      line-height: 1.1;
    }
    .kpi-sub {
      font-size: .7rem;
      color: var(--ink-soft);
      font-family: var(--font-mono);
    }

    /* ── Cards ── */
    .chart-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.1rem;
      display: grid;
      gap: .6rem;
      transition: border-color .2s;
    }
    .chart-card:hover { border-color: var(--border-light); }

    .chart-title {
      margin: 0;
      font-size: .95rem;
      font-weight: 600;
      color: var(--ink-strong);
    }
    .chart-sub {
      margin: 0;
      font-size: .78rem;
      color: var(--ink-soft);
    }

    /* ── Legend ── */
    .legend-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      font-size: .75rem;
      color: var(--ink-soft);
      font-family: var(--font-mono);
    }
    .legend-row span {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* ── Canvas wrapper ── */
    .canvas-wrap {
      position: relative;
      width: 100%;
    }

    /* ── Two-col grid ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.1rem;
    }

    /* ── Metrics bars ── */
    .metrics-table { display: grid; gap: .2rem; }

    .strat-name {
      margin: .5rem 0 .15rem;
      font-size: .8rem;
      font-weight: 600;
      color: var(--ink-mid);
      font-family: var(--font-mono);
      padding-bottom: .2rem;
      border-bottom: 1px solid var(--border);
    }
    .strat-name:first-child { margin-top: 0; }

    .m-row {
      display: grid;
      grid-template-columns: 90px 1fr 48px;
      align-items: center;
      gap: 6px;
      font-size: .75rem;
    }
    .m-label { color: var(--ink-soft); font-family: var(--font-mono); white-space: nowrap; }
    .m-bar-outer {
      height: 10px;
      background: var(--surface-strong);
      border: 1px solid var(--border);
      border-radius: 99px;
      overflow: hidden;
    }
    .m-bar-inner { height: 100%; border-radius: 99px; transition: width .5s ease; }
    .m-val {
      text-align: right;
      color: var(--ink-mid);
      font-family: var(--font-mono);
      font-size: .72rem;
    }

    @media (max-width: 900px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .two-col  { grid-template-columns: 1fr; }
    }
  `],
})
export class BenchmarkChartsComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() results: BenchmarkMatchupDone[] = [];

  @ViewChildren('winrateCanvas') winrateCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('turnsCanvas')   turnsCanvases!:   QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('pipsCanvas')    pipsCanvases!:    QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('radarCanvas')   radarCanvases!:   QueryList<ElementRef<HTMLCanvasElement>>;

  readonly PALETTE = PALETTE;

  // ── Derived state ──────────────────────────────────────────────────────────

  get totalGames(): number {
    return this.results.reduce((s, r) => s + r.n_games, 0);
  }

  get bestResult(): BenchmarkMatchupDone | null {
    if (!this.results.length) return null;
    return this.results.reduce((a, b) => b.win_rate_a > a.win_rate_a ? b : a);
  }

  get avgTurns(): number {
    if (!this.results.length) return 0;
    return Math.round(this.results.reduce((s, r) => s + r.avg_turns, 0) / this.results.length);
  }

  metricsA: StratBarGroup[] = [];
  metricsB: StratBarGroup[] = [];

  // ── Chart instances (to destroy on update) ─────────────────────────────────
  private charts: any[] = [];
  private chartJsReady = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    this.loadChartJs().then(() => {
      this.chartJsReady = true;
      if (this.results.length) {
        this.buildAll();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results'] && this.chartJsReady && this.results.length) {
      // Give Angular one tick to render canvas elements
      setTimeout(() => this.buildAll(), 0);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  // ── Chart.js dynamic load ──────────────────────────────────────────────────

  private loadChartJs(): Promise<void> {
    return new Promise(resolve => {
      if (typeof (window as any).Chart !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  // ── Build all charts ───────────────────────────────────────────────────────

  private buildAll(): void {
    this.destroyCharts();
    this.computeMetricBars();

    const winrateEl  = this.winrateCanvases.first?.nativeElement;
    const turnsEl    = this.turnsCanvases.first?.nativeElement;
    const pipsEl     = this.pipsCanvases.first?.nativeElement;
    const radarEl    = this.radarCanvases.first?.nativeElement;

    if (winrateEl)  this.charts.push(this.buildWinRate(winrateEl));
    if (turnsEl)    this.charts.push(this.buildTurns(turnsEl));
    if (pipsEl)     this.charts.push(this.buildPips(pipsEl));
    if (radarEl)    this.charts.push(this.buildRadar(radarEl));
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c?.destroy?.());
    this.charts = [];
  }

  // ── Axis colors (reads CSS variable at runtime) ───────────────────────────

  private textColor(): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--ink-soft').trim() || '#6370a0';
  }

  private gridColor(): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--border').trim() || '#2a3045';
  }

  private baseScales() {
    const tc = this.textColor();
    const gc = this.gridColor();
    return {
      x: { ticks: { color: tc, font: { size: 11 } }, grid: { color: gc } },
      y: { ticks: { color: tc, font: { size: 11 } }, grid: { color: gc } },
    };
  }

  // ── Win rate stacked bar ───────────────────────────────────────────────────

  private buildWinRate(canvas: HTMLCanvasElement): any {
    const tc = this.textColor();
    const gc = this.gridColor();
    const labels = this.results.map(r => r.label.length > 24 ? r.label.slice(0, 24) + '…' : r.label);

    return new (window as any).Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Victoria A',
            data: this.results.map(r => r.win_rate_a),
            backgroundColor: PALETTE.blue,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Empate',
            data: this.results.map(r => Math.round(r.draws / r.n_games * 1000) / 10),
            backgroundColor: PALETTE.gray,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Victoria B',
            data: this.results.map(r => r.win_rate_b),
            backgroundColor: PALETTE.amber,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { padding: 8, cornerRadius: 6 },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: tc, font: { size: 11 }, autoSkip: false, maxRotation: 20 },
            grid: { color: gc },
          },
          y: {
            stacked: true,
            max: 100,
            ticks: { callback: (v: number) => v + '%', color: tc, font: { size: 11 } },
            grid: { color: gc },
          },
        },
      },
    });
  }

  // ── Turns bar ──────────────────────────────────────────────────────────────

  private buildTurns(canvas: HTMLCanvasElement): any {
    return new (window as any).Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.results.map(r => `${r.agent_a}\nvs\n${r.agent_b}`),
        datasets: [{
          label: 'Turnos promedio',
          data: this.results.map(r => Math.round(r.avg_turns)),
          backgroundColor: this.results.map((_, i) => MATCHUP_COLORS[i % MATCHUP_COLORS.length]),
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { padding: 8, cornerRadius: 6 },
        },
        scales: {
          ...this.baseScales(),
          y: {
            ...this.baseScales().y,
            beginAtZero: true,
          },
          x: {
            ...this.baseScales().x,
            ticks: { ...this.baseScales().x.ticks, autoSkip: false },
          },
        },
      },
    });
  }

  // ── Pips scatter ───────────────────────────────────────────────────────────

  private buildPips(canvas: HTMLCanvasElement): any {
    return new (window as any).Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: this.results.map((r, i) => ({
          label: r.label,
          data: (r.score_advantage_per_game ?? []).map((v: number, j: number) => ({ x: j + 1, y: v })),
          backgroundColor: MATCHUP_COLORS[i % MATCHUP_COLORS.length] + 'BB',
          pointRadius: 5,
          pointHoverRadius: 7,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: this.textColor(), font: { size: 10 }, boxWidth: 10, boxHeight: 10, padding: 10 },
          },
          tooltip: { padding: 8, cornerRadius: 6 },
        },
        scales: {
          x: {
            title: { display: true, text: 'Partida #', color: this.textColor(), font: { size: 11 } },
            ticks: { color: this.textColor(), font: { size: 11 } },
            grid: { color: this.gridColor() },
          },
          y: {
            title: { display: true, text: 'Ventaja (pips)', color: this.textColor(), font: { size: 11 } },
            ticks: { color: this.textColor(), font: { size: 11 } },
            grid: { color: this.gridColor() },
          },
        },
      },
    });
  }

  // ── Radar ──────────────────────────────────────────────────────────────────

  private buildRadar(canvas: HTMLCanvasElement): any {
    const tc = this.textColor();
    const gc = this.gridColor();

    const summarized = this.computeRadarData();
    const radarColors = [
      PALETTE.blue, PALETTE.amber, PALETTE.teal, PALETTE.coral, PALETTE.purple, PALETTE.green,
    ];

    return new (window as any).Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Win rate %', 'Tiempo ms', 'Nodos', 'Evals', 'Profundidad'],
        datasets: summarized.map((s, i) => ({
          label: s.strategy,
          data: [
            Math.round(s.winrateNorm),
            Math.round(s.timeNorm),
            Math.round(s.nodesNorm),
            Math.round(s.evalsNorm),
            Math.round(s.depthNorm),
          ],
          backgroundColor: radarColors[i % radarColors.length] + '22',
          borderColor:     radarColors[i % radarColors.length],
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: radarColors[i % radarColors.length],
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: tc, font: { size: 11 }, boxWidth: 10, boxHeight: 10, padding: 14 },
          },
          tooltip: { padding: 8, cornerRadius: 6 },
        },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: {
              stepSize: 25,
              color: tc,
              font: { size: 10 },
              backdropColor: 'transparent',
            },
            grid: { color: gc },
            pointLabels: { color: tc, font: { size: 11 } },
            angleLines: { color: gc },
          },
        },
      },
    });
  }

  // ── Data computation ───────────────────────────────────────────────────────

  private computeMetricBars(): void {
    this.metricsA = this.buildMetricGroups('a');
    this.metricsB = this.buildMetricGroups('b');
  }

  private buildMetricGroups(side: 'a' | 'b'): StratBarGroup[] {
    const map: Record<string, { count: number; time: number; nodes: number; evals: number; depth: number }> = {};

    this.results.forEach(r => {
      const strat = side === 'a' ? r.agent_a : r.agent_b;
      const m = side === 'a' ? r.metrics_a : r.metrics_b;
      if (!map[strat]) { map[strat] = { count: 0, time: 0, nodes: 0, evals: 0, depth: 0 }; }
      map[strat].count++;
      map[strat].time  += (m as any)['avg_time_ms'] ?? 0;
      map[strat].nodes += (m as any)['avg_nodes']   ?? 0;
      map[strat].evals += (m as any)['avg_evals']   ?? 0;
      map[strat].depth += (m as any)['avg_depth']   ?? 0;
    });

    const rows = Object.entries(map).map(([strat, v]) => ({
      strat,
      time:  Math.round(v.time  / v.count * 10) / 10,
      nodes: Math.round(v.nodes / v.count),
      evals: Math.round(v.evals / v.count),
      depth: Math.round(v.depth / v.count * 10) / 10,
    }));

    const maxTime  = Math.max(...rows.map(r => r.time),  1);
    const maxNodes = Math.max(...rows.map(r => r.nodes), 1);
    const maxEvals = Math.max(...rows.map(r => r.evals), 1);
    const maxDepth = Math.max(...rows.map(r => r.depth), 1);

    const metaDefs = [
      { key: 'time',  label: 'Tiempo ms', max: maxTime,  color: PALETTE.blue },
      { key: 'nodes', label: 'Nodos',     max: maxNodes, color: PALETTE.teal },
      { key: 'evals', label: 'Evals',     max: maxEvals, color: PALETTE.amber },
      { key: 'depth', label: 'Profund.',  max: maxDepth, color: PALETTE.purple },
    ];

    return rows.map(r => ({
      strategy: r.strat,
      metrics: metaDefs.map(m => {
        const val = (r as any)[m.key] as number;
        return {
          label:   m.label,
          value:   val,
          pct:     Math.round(val / m.max * 100),
          color:   m.color,
          display: val >= 1000 ? (val / 1000).toFixed(1) + 'k'
                               : Number.isInteger(val) ? String(val) : val.toFixed(1),
        };
      }),
    }));
  }

  private computeRadarData(): Array<{
    strategy: string;
    winrateNorm: number; timeNorm: number; nodesNorm: number; evalsNorm: number; depthNorm: number;
  }> {
    const strats = [...new Set([...this.results.map(r => r.agent_a), ...this.results.map(r => r.agent_b)])];

    const acc: Record<string, { count: number; time: number; nodes: number; evals: number; depth: number; wr: number }> = {};
    strats.forEach(s => { acc[s] = { count: 0, time: 0, nodes: 0, evals: 0, depth: 0, wr: 0 }; });

    this.results.forEach(r => {
      const mA = r.metrics_a as any;
      const mB = r.metrics_b as any;

      acc[r.agent_a].count++;
      acc[r.agent_a].time  += mA['avg_time_ms'] ?? 0;
      acc[r.agent_a].nodes += mA['avg_nodes']   ?? 0;
      acc[r.agent_a].evals += mA['avg_evals']   ?? 0;
      acc[r.agent_a].depth += mA['avg_depth']   ?? 0;
      acc[r.agent_a].wr    += r.win_rate_a;

      acc[r.agent_b].count++;
      acc[r.agent_b].time  += mB['avg_time_ms'] ?? 0;
      acc[r.agent_b].nodes += mB['avg_nodes']   ?? 0;
      acc[r.agent_b].evals += mB['avg_evals']   ?? 0;
      acc[r.agent_b].depth += mB['avg_depth']   ?? 0;
      acc[r.agent_b].wr    += r.win_rate_b;
    });

    const avg = (obj: any, key: string) => obj.count > 0 ? obj[key] / obj.count : 0;

    const rows = strats.map(s => ({
      strategy: s,
      time:    avg(acc[s], 'time'),
      nodes:   avg(acc[s], 'nodes'),
      evals:   avg(acc[s], 'evals'),
      depth:   avg(acc[s], 'depth'),
      wr:      avg(acc[s], 'wr'),
    }));

    const maxTime  = Math.max(...rows.map(r => r.time),  1);
    const maxNodes = Math.max(...rows.map(r => r.nodes), 1);
    const maxEvals = Math.max(...rows.map(r => r.evals), 1);
    const maxDepth = Math.max(...rows.map(r => r.depth), 1);

    return rows.map(r => ({
      strategy:    r.strategy,
      winrateNorm: r.wr,                           // ya es 0-100
      timeNorm:    r.time  / maxTime  * 100,
      nodesNorm:   r.nodes / maxNodes * 100,
      evalsNorm:   r.evals / maxEvals * 100,
      depthNorm:   r.depth / maxDepth * 100,
    }));
  }
}