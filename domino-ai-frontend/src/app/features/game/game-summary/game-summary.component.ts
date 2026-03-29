import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-game-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page fade-in">
      <div class="summary-header">
        <button class="btn btn-secondary btn-sm" (click)="router.navigate(['/game', sessionId])">← Partida</button>
        <h1 class="summary-title mono">Resumen Post-Partida</h1>
        <button class="btn btn-primary btn-sm" (click)="router.navigate(['/game/new'])">Nueva partida</button>
      </div>

      <div class="loading-block" *ngIf="loading">
        <span class="spinner"></span> Cargando análisis...
      </div>

      <div class="error-block" *ngIf="error">⚠️ {{ error }}</div>

      <div class="summary-content" *ngIf="summary && !loading">

        <!-- Winner banner -->
        <div class="winner-banner" [class]="winnerClass()">
          <div class="wb-emoji">{{ winnerEmoji() }}</div>
          <div class="wb-info">
            <div class="wb-title">{{ winnerTitle() }}</div>
            <div class="wb-detail mono">
              {{ summary.total_turns }} turnos ·
              Pips A: {{ summary.pip_sum_a }} · Pips B: {{ summary.pip_sum_b }}
            </div>
          </div>
          <div class="wb-strategies">
            <span class="badge badge-blue mono">{{ summary.strategy_a }}</span>
            <span class="vs-txt">vs</span>
            <span class="badge badge-muted mono">{{ summary.strategy_b }}</span>
          </div>
        </div>

        <!-- Stats cards -->
        <div class="stats-grid">
          <div class="stat-card" *ngFor="let stat of summaryStats()">
            <div class="sc-label">{{ stat.label }}</div>
            <div class="sc-row">
              <div class="sc-val blue">{{ stat.a }}</div>
              <div class="sc-val red">{{ stat.b }}</div>
            </div>
            <div class="sc-strategies">
              <span class="mono" style="color:var(--accent)">A</span>
              <span class="mono" style="color:var(--red)">B</span>
            </div>
          </div>
        </div>

        <!-- Charts 2x2 grid -->
        <div class="charts-grid">
          <div class="chart-card" *ngFor="let c of chartDefs; let i = index">
            <p class="section-title">{{ c.title }}</p>
            <div class="chart-wrap">
              <canvas #chartCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Truncated notice for tree -->
        <div class="bottom-actions">
          <button class="btn btn-secondary" (click)="router.navigate(['/game', sessionId])">
            Ver Partida
          </button>
          <button class="btn btn-primary" (click)="router.navigate(['/game/new'])">
            Nueva Partida →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .summary-title { margin: 0; font-size: 1.4rem; }

    .loading-block { display: flex; align-items: center; gap: 0.75rem; padding: 3rem; justify-content: center; color: var(--text-secondary); }
    .error-block { padding: 1rem; background: var(--red-subtle); color: var(--red); border-radius: var(--radius); }

    .summary-content { display: flex; flex-direction: column; gap: 1.25rem; }

    /* Winner banner */
    .winner-banner {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }
    .winner-banner.winner-a { background: linear-gradient(135deg, rgba(91,141,239,0.12), rgba(91,141,239,0.05)); border-color: var(--accent); }
    .winner-banner.winner-b { background: linear-gradient(135deg, rgba(242,92,84,0.12), rgba(242,92,84,0.05)); border-color: var(--red); }
    .winner-banner.winner-draw { background: var(--surface); }
    .wb-emoji { font-size: 2.5rem; }
    .wb-info { flex: 1; }
    .wb-title { font-size: 1.3rem; font-weight: 700; font-family: var(--font-mono); margin-bottom: 0.25rem; }
    .wb-detail { font-size: 0.8rem; color: var(--text-secondary); }
    .wb-strategies { display: flex; align-items: center; gap: 0.5rem; }
    .vs-txt { color: var(--text-muted); font-size: 0.8rem; }

    /* Stats cards */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
    .stat-card {
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .sc-label { font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase; margin-bottom: 0.5rem; }
    .sc-row { display: flex; gap: 1rem; margin-bottom: 0.2rem; }
    .sc-val { font-size: 1.1rem; font-weight: 700; font-family: var(--font-mono); flex: 1; }
    .blue { color: var(--accent); }
    .red { color: var(--red); }
    .sc-strategies { display: flex; gap: 1rem; font-size: 0.7rem; }

    /* Charts */
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .chart-card {
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .chart-wrap { height: 200px; position: relative; }
    .chart-wrap canvas { width: 100% !important; height: 100% !important; }

    .bottom-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

    @media (max-width: 700px) { .charts-grid { grid-template-columns: 1fr; } }
  `]
})
export class GameSummaryComponent implements OnInit, AfterViewInit, OnDestroy {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  @ViewChildren('chartCanvas') canvasEls!: QueryList<ElementRef>;

  sessionId = '';
  summary: any = null;
  loading = true;
  error = '';
  private charts: Chart[] = [];
  private viewReady = false;

  chartDefs = [
    { title: 'Comparación de Costos Promedio', key: 'cost_comparison' },
    { title: 'Tiempo Acumulado (ms)', key: 'cumulative_time_ms' },
    { title: 'Nodos Acumulados', key: 'cumulative_nodes' },
    { title: 'Radar Multidimensional', key: 'radar' },
  ];

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;
    this.api.getEndgameSummary(this.sessionId).subscribe({
      next: data => {
        this.summary = data;
        this.loading = false;
        setTimeout(() => this.buildCharts(), 100);
      },
      error: () => { this.loading = false; this.error = 'Error al cargar el resumen'; }
    });
  }

  ngAfterViewInit() { this.viewReady = true; }

  ngOnDestroy() { this.charts.forEach(c => c.destroy()); }

  private buildCharts() {
    if (!this.summary || !this.canvasEls) return;
    const charts = this.summary.endgame_charts;
    const canvases = this.canvasEls.toArray();
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    // 0: Cost comparison grouped bar
    if (canvases[0]) {
      const cc = charts.cost_comparison;
      const keys = ['avg_time_ms', 'avg_nodes', 'avg_evals', 'avg_depth'];
      const labels = ['Tiempo ms', 'Nodos', 'Evals', 'Profundidad'];
      this.charts.push(new Chart(canvases[0].nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: this.summary.strategy_a, data: keys.map(k => cc.strategy_a[k] ?? 0), backgroundColor: 'rgba(91,141,239,0.7)', borderRadius: 4 },
            { label: this.summary.strategy_b, data: keys.map(k => cc.strategy_b[k] ?? 0), backgroundColor: 'rgba(242,92,84,0.7)', borderRadius: 4 },
          ]
        },
        options: this.barOpts()
      }));
    }

    // 1: Cumulative time area
    if (canvases[1]) {
      const ct = charts.cumulative_time_ms;
      this.charts.push(new Chart(canvases[1].nativeElement, {
        type: 'line',
        data: {
          labels: ct.series_a?.map((p: any) => `T${p.turn}`) ?? [],
          datasets: [
            { label: this.summary.strategy_a, data: ct.series_a?.map((p: any) => p.value) ?? [], borderColor: '#5b8def', backgroundColor: 'rgba(91,141,239,0.15)', fill: true, tension: 0.3, pointRadius: 0 },
            { label: this.summary.strategy_b, data: ct.series_b?.map((p: any) => p.value) ?? [], borderColor: '#f25c54', backgroundColor: 'rgba(242,92,84,0.1)', fill: true, tension: 0.3, pointRadius: 0 },
          ]
        },
        options: this.lineOpts()
      }));
    }

    // 2: Cumulative nodes area
    if (canvases[2]) {
      const cn = charts.cumulative_nodes;
      this.charts.push(new Chart(canvases[2].nativeElement, {
        type: 'line',
        data: {
          labels: cn.series_a?.map((p: any) => `T${p.turn}`) ?? [],
          datasets: [
            { label: this.summary.strategy_a, data: cn.series_a?.map((p: any) => p.value) ?? [], borderColor: '#5b8def', backgroundColor: 'rgba(91,141,239,0.15)', fill: true, tension: 0.3, pointRadius: 0 },
            { label: this.summary.strategy_b, data: cn.series_b?.map((p: any) => p.value) ?? [], borderColor: '#f25c54', backgroundColor: 'rgba(242,92,84,0.1)', fill: true, tension: 0.3, pointRadius: 0 },
          ]
        },
        options: this.lineOpts()
      }));
    }

    // 3: Radar
    if (canvases[3]) {
      const rd = charts.radar;
      const axes = rd.axes as string[];
      const axLabels: Record<string, string> = { avg_time_ms: 'Tiempo', avg_nodes: 'Nodos', avg_evals: 'Evals', avg_depth: 'Profundidad', total_turns: 'Turnos' };
      // Normalize
      const maxVals = axes.map((k: string) => Math.max(rd.strategy_a[k] ?? 0, rd.strategy_b[k] ?? 0, 1));
      this.charts.push(new Chart(canvases[3].nativeElement, {
        type: 'radar',
        data: {
          labels: axes.map((k: string) => axLabels[k] ?? k),
          datasets: [
            { label: this.summary.strategy_a, data: axes.map((k: string, i: number) => (rd.strategy_a[k] ?? 0) / maxVals[i]), borderColor: '#5b8def', backgroundColor: 'rgba(91,141,239,0.2)', pointBackgroundColor: '#5b8def' },
            { label: this.summary.strategy_b, data: axes.map((k: string, i: number) => (rd.strategy_b[k] ?? 0) / maxVals[i]), borderColor: '#f25c54', backgroundColor: 'rgba(242,92,84,0.15)', pointBackgroundColor: '#f25c54' },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8b90a0', font: { size: 11, family: 'Space Mono' } } }
          },
          scales: {
            r: {
              ticks: { color: '#545870', font: { size: 9 }, backdropColor: 'transparent' },
              grid: { color: '#272b3a' },
              pointLabels: { color: '#8b90a0', font: { size: 10 } }
            }
          }
        }
      }));
    }
  }

  private barOpts(): any {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8b90a0', font: { size: 10, family: 'Space Mono' } } } },
      scales: {
        x: { ticks: { color: '#545870', font: { size: 10 } }, grid: { color: '#1e2130' } },
        y: { ticks: { color: '#545870', font: { size: 10 } }, grid: { color: '#1e2130' } }
      }
    };
  }

  private lineOpts(): any {
    return {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { labels: { color: '#8b90a0', font: { size: 10, family: 'Space Mono' } } } },
      scales: {
        x: { display: false },
        y: { ticks: { color: '#545870', font: { size: 10 } }, grid: { color: '#1e2130' } }
      }
    };
  }

  summaryStats() {
    if (!this.summary) return [];
    const sa = this.summary.endgame_charts?.cost_comparison?.strategy_a ?? {};
    const sb = this.summary.endgame_charts?.cost_comparison?.strategy_b ?? {};
    return [
      { label: 'Tiempo Prom. (ms)', a: (sa.avg_time_ms ?? 0).toFixed(2), b: (sb.avg_time_ms ?? 0).toFixed(2) },
      { label: 'Nodos Prom.', a: (sa.avg_nodes ?? 0).toFixed(0), b: (sb.avg_nodes ?? 0).toFixed(0) },
      { label: 'Evals Prom.', a: (sa.avg_evals ?? 0).toFixed(0), b: (sb.avg_evals ?? 0).toFixed(0) },
      { label: 'Profundidad Prom.', a: (sa.avg_depth ?? 0).toFixed(1), b: (sb.avg_depth ?? 0).toFixed(1) },
      { label: 'Pips finales', a: String(this.summary.pip_sum_a ?? 0), b: String(this.summary.pip_sum_b ?? 0) },
      { label: 'Turnos Totales', a: String(this.summary.total_turns ?? 0), b: '—' },
    ];
  }

  winnerClass() {
    const w = this.summary?.winner;
    if (w === 0) return 'winner-banner winner-a';
    if (w === 1) return 'winner-banner winner-b';
    return 'winner-banner winner-draw';
  }
  winnerEmoji() {
    const w = this.summary?.winner;
    return w === -1 ? '🤝' : w === 0 ? '🏆' : '🥇';
  }
  winnerTitle() {
    const s = this.summary;
    if (!s) return '';
    if (s.winner === -1) return 'Empate';
    if (s.winner === 0) return `Gana ${s.strategy_a.toUpperCase()}`;
    return `Gana ${(s.strategy_b || 'Human').toUpperCase()}`;
  }
}
