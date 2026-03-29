import { Component, Input, OnChanges, OnDestroy, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnEvent } from '../../../core/models/api.models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface MetricSeries {
  labels: string[];
  dataA: number[];
  dataB: number[];
}

const COLORS = {
  a: { line: '#5b8def', bg: 'rgba(91,141,239,0.15)' },
  b: { line: '#f25c54', bg: 'rgba(242,92,84,0.15)' },
};
const WINDOW = 50; // sliding window

@Component({
  selector: 'app-metrics-realtime',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metrics-rt">
      <p class="section-title">Métricas en Tiempo Real</p>

      <div class="legend">
        <span class="leg-item"><span class="leg-dot" style="background:#5b8def"></span> Agente A</span>
        <span class="leg-item"><span class="leg-dot" style="background:#f25c54"></span> Agente B</span>
      </div>

      <div class="chart-block" *ngFor="let chart of chartConfigs">
        <div class="chart-label">{{ chart.label }}</div>
        <div class="chart-wrap">
          <canvas #chartCanvas></canvas>
        </div>
      </div>

      <!-- Turn log -->
      <div class="turn-log">
        <p class="section-title" style="margin-top:.5rem">Log de Turnos</p>
        <div class="log-scroll">
          <div class="log-entry" *ngFor="let e of recentEvents; trackBy: trackByTurn">
            <span class="log-turn mono">T{{e.turn}}</span>
            <span class="log-player" [class]="e.player === 0 ? 'lp-a' : 'lp-b'">{{e.player===0?'A':'B'}}</span>
            <span class="log-move mono">{{e.move}}</span>
            <span class="log-time mono" *ngIf="e.metrics">{{e.metrics.time_ms.toFixed(1)}}ms</span>
          </div>
          <div class="log-empty" *ngIf="recentEvents.length === 0">Sin turnos aún</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-rt { display: flex; flex-direction: column; gap: 0.75rem; }

    .legend { display: flex; gap: 1rem; margin-bottom: 0.25rem; }
    .leg-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--text-secondary); }
    .leg-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

    .chart-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem; }
    .chart-label { font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase; margin-bottom: 0.4rem; }
    .chart-wrap { height: 90px; }
    .chart-wrap canvas { width: 100% !important; height: 100% !important; }

    .turn-log { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem; }
    .log-scroll { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.2rem; }
    .log-entry {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      animation: fadeIn 0.15s ease;
    }
    .log-entry:hover { background: var(--surface-hover); }
    .log-turn { color: var(--text-muted); min-width: 28px; }
    .log-player {
      width: 16px; height: 16px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.6rem; font-weight: 700;
    }
    .lp-a { background: var(--accent-subtle); color: var(--accent); }
    .lp-b { background: var(--red-subtle); color: var(--red); }
    .log-move { flex: 1; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .log-time { color: var(--yellow); min-width: 48px; text-align: right; }
    .log-empty { font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem; }
  `]
})
export class MetricsRealtimeComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() sessionId = '';
  @Input() events: TurnEvent[] = [];

  @ViewChildren('chartCanvas') canvasElements!: QueryList<ElementRef>;

  chartConfigs = [
    { key: 'time_ms', label: 'Tiempo de Decisión (ms)', type: 'line' },
    { key: 'nodes_expanded', label: 'Nodos Expandidos', type: 'line' },
    { key: 'eval_calls', label: 'Llamadas Heurísticas', type: 'bar' },
    { key: 'max_depth', label: 'Profundidad Máxima', type: 'line' },
  ];

  charts: (Chart | null)[] = [];
  series: MetricSeries[] = this.chartConfigs.map(() => ({ labels: [], dataA: [], dataB: [] }));
  recentEvents: TurnEvent[] = [];

  ngAfterViewInit() {
    this.initCharts();
  }

  ngOnChanges() {
    if (this.events.length === 0) return;
    const last = this.events[this.events.length - 1];
    if (last.type !== 'turn' || !last.metrics) return;

    this.recentEvents = [...this.events].reverse().slice(0, 30);
    this.updateSeries(last);
    this.refreshCharts();
  }

  ngOnDestroy() {
    this.charts.forEach(c => c?.destroy());
  }

  private initCharts() {
    const canvases = this.canvasElements.toArray();
    this.charts = canvases.map((ref, i) => {
      const cfg = this.chartConfigs[i];
      const ctx = ref.nativeElement.getContext('2d');
      return new Chart(ctx, this.buildConfig(cfg.key, cfg.type));
    });
  }

  private updateSeries(event: TurnEvent) {
    const label = `T${event.turn}`;
    const m = event.metrics!;

    this.chartConfigs.forEach((cfg, i) => {
      const s = this.series[i];
      const val = (m as any)[cfg.key] ?? 0;

      if (event.player === 0) {
        s.labels.push(label);
        s.dataA.push(val);
        // fill B with null if lengths differ
        if (s.dataB.length < s.dataA.length) s.dataB.push(0);
      } else {
        s.dataB.push(val);
        if (s.labels.length < s.dataB.length) s.labels.push(label);
        if (s.dataA.length < s.dataB.length) s.dataA.push(0);
      }

      // Sliding window
      if (s.labels.length > WINDOW) {
        s.labels = s.labels.slice(-WINDOW);
        s.dataA = s.dataA.slice(-WINDOW);
        s.dataB = s.dataB.slice(-WINDOW);
      }
    });
  }

  private refreshCharts() {
    this.charts.forEach((chart, i) => {
      if (!chart) return;
      const s = this.series[i];
      chart.data.labels = [...s.labels];
      chart.data.datasets[0].data = [...s.dataA];
      chart.data.datasets[1].data = [...s.dataB];
      chart.update('none');
    });
  }

  private buildConfig(key: string, type: string): ChartConfiguration {
    return {
      type: type as any,
      data: {
        labels: [],
        datasets: [
          {
            label: 'A',
            data: [],
            borderColor: COLORS.a.line,
            backgroundColor: type === 'bar' ? COLORS.a.bg : COLORS.a.bg,
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: type === 'line',
            stepped: key === 'max_depth' ? 'after' : false,
          } as any,
          {
            label: 'B',
            data: [],
            borderColor: COLORS.b.line,
            backgroundColor: COLORS.b.bg,
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: type === 'line',
            stepped: key === 'max_depth' ? 'after' : false,
          } as any,
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            display: false,
            grid: { display: false }
          },
          y: {
            display: true,
            position: 'right',
            ticks: {
              font: { size: 9, family: 'Space Mono' },
              color: '#545870',
              maxTicksLimit: 4,
            },
            grid: { color: '#1e2130' }
          }
        }
      }
    };
  }

  trackByTurn(_: number, e: TurnEvent) { return e.turn; }
}
