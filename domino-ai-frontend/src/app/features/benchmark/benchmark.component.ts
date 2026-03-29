import { Component, OnInit, OnDestroy, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { SseService } from '../../core/services/sse.service';
import { MatchupConfig, MatchupResult, BenchmarkEvent } from '../../core/models/api.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-benchmark',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page fade-in">
      <div class="bench-header">
        <div>
          <h1 class="bench-title mono">Benchmark / Torneo</h1>
          <p class="bench-sub">Compara estrategias en múltiples partidas</p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="router.navigate(['/'])">← Inicio</button>
      </div>

      <!-- Config panel -->
      <div class="card config-card" *ngIf="!isRunning && results.length === 0">
        <p class="section-title">Configuración del Torneo</p>

        <div class="config-row">
          <label class="config-label">Partidas por matchup</label>
          <div class="config-ctrl">
            <input type="range" min="1" max="50" [(ngModel)]="nGames" class="slider" />
            <span class="config-val mono">{{ nGames }}</span>
          </div>
        </div>

        <div class="matchups-list">
          <p class="section-title" style="margin-top:1rem">Matchups Estándar</p>
          <div class="matchup-row" *ngFor="let m of defaultMatchups">
            <span class="badge badge-blue mono">{{ m.agent_a }}</span>
            <span class="mrow-vs">vs</span>
            <span class="badge badge-muted mono">{{ m.agent_b }}</span>
            <span class="mrow-label">{{ m.label }}</span>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" (click)="runBenchmark()" style="margin-top:1.5rem">
          ▶ Iniciar Torneo ({{ nGames }} partidas × {{ defaultMatchups.length }} matchups)
        </button>
      </div>

      <!-- Progress -->
      <div class="card" *ngIf="isRunning">
        <p class="section-title">Ejecutando Torneo…</p>
        <div class="progress-bar-wrap">
          <div class="progress-bar" [style.width]="progressPct + '%'"></div>
        </div>
        <div class="progress-info mono">
          {{ results.length }} / {{ totalMatchups }} matchups completados
        </div>
        <div class="current-matchup" *ngIf="currentMatchupLabel">
          <span class="spinner"></span>
          Ejecutando: <strong>{{ currentMatchupLabel }}</strong>
        </div>
      </div>

      <!-- Results -->
      <div class="results-section" *ngIf="results.length > 0">
        <div class="results-header">
          <h2 class="results-title mono">Resultados</h2>
          <button class="btn btn-secondary btn-sm" (click)="reset()">Nueva prueba</button>
        </div>

        <!-- Win rate chart -->
        <div class="card chart-card-full">
          <p class="section-title">Win Rate por Matchup (%)</p>
          <div class="chart-wrap-full">
            <canvas #winRateCanvas></canvas>
          </div>
        </div>

        <!-- Matchup detail cards -->
        <div class="matchup-results">
          <div class="matchup-card" *ngFor="let r of results">
            <div class="mc-header">
              <span class="badge badge-blue mono">{{ r.agent_a }}</span>
              <span class="mc-vs">vs</span>
              <span class="badge badge-muted mono">{{ r.agent_b }}</span>
              <span class="mc-label">{{ r.label }}</span>
              <div class="mc-spacer"></div>
              <span class="mc-wins">
                {{ r.wins_a }}W · {{ r.draws }}E · {{ r.wins_b }}W
              </span>
            </div>

            <div class="mc-bar-row">
              <div class="mc-bar-a" [style.width]="r.win_rate_a + '%'">
                <span class="mc-bar-label">{{ r.win_rate_a }}%</span>
              </div>
              <div class="mc-bar-b" [style.width]="r.win_rate_b + '%'">
                <span class="mc-bar-label">{{ r.win_rate_b }}%</span>
              </div>
            </div>

            <div class="mc-stats">
              <div class="mc-stat">
                <span class="mc-stat-l">Turnos prom.</span>
                <span class="mc-stat-v mono">{{ r.avg_turns.toFixed(1) }}</span>
              </div>
              <div class="mc-stat" *ngIf="r.metrics_a">
                <span class="mc-stat-l">Tiempo prom. A</span>
                <span class="mc-stat-v mono blue">{{ r.metrics_a.avg_time_ms?.toFixed(2) }}ms</span>
              </div>
              <div class="mc-stat" *ngIf="r.metrics_b">
                <span class="mc-stat-l">Tiempo prom. B</span>
                <span class="mc-stat-v mono red">{{ r.metrics_b.avg_time_ms?.toFixed(2) }}ms</span>
              </div>
              <div class="mc-stat" *ngIf="r.metrics_a">
                <span class="mc-stat-l">Nodos prom. A</span>
                <span class="mc-stat-v mono blue">{{ r.metrics_a.avg_nodes?.toFixed(0) }}</span>
              </div>
              <div class="mc-stat" *ngIf="r.metrics_b">
                <span class="mc-stat-l">Nodos prom. B</span>
                <span class="mc-stat-v mono red">{{ r.metrics_b.avg_nodes?.toFixed(0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="total-time" *ngIf="totalTime > 0">
          Tiempo total del torneo: <strong class="mono">{{ totalTime.toFixed(1) }}s</strong>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bench-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .bench-title { font-size: 1.6rem; margin: 0; }
    .bench-sub { color: var(--text-secondary); margin: 0.25rem 0 0; font-size: 0.9rem; }

    .config-card { max-width: 700px; }
    .config-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .config-label { font-size: 0.9rem; color: var(--text-secondary); }
    .config-ctrl { display: flex; align-items: center; gap: 0.75rem; }
    .slider { width: 180px; accent-color: var(--accent); }
    .config-val { font-size: 1.1rem; min-width: 32px; text-align: right; color: var(--accent); }

    .matchups-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .matchup-row { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; }
    .mrow-vs { color: var(--text-muted); }
    .mrow-label { color: var(--text-secondary); font-size: 0.8rem; }

    /* Progress */
    .progress-bar-wrap { height: 6px; background: var(--surface-hover); border-radius: 3px; overflow: hidden; margin: 0.75rem 0 0.5rem; }
    .progress-bar { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s ease; }
    .progress-info { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
    .current-matchup { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: var(--text-secondary); }

    /* Results */
    .results-section { display: flex; flex-direction: column; gap: 1rem; }
    .results-header { display: flex; align-items: center; justify-content: space-between; }
    .results-title { font-size: 1.2rem; margin: 0; }

    .chart-card-full { }
    .chart-wrap-full { height: 260px; position: relative; }
    .chart-wrap-full canvas { width: 100% !important; height: 100% !important; }

    .matchup-results { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }

    .matchup-card { padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .mc-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .mc-vs { color: var(--text-muted); font-size: 0.8rem; }
    .mc-label { color: var(--text-secondary); font-size: 0.8rem; }
    .mc-spacer { flex: 1; }
    .mc-wins { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); }

    .mc-bar-row { display: flex; height: 28px; border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem; background: var(--surface-hover); }
    .mc-bar-a { background: rgba(91,141,239,0.6); display: flex; align-items: center; justify-content: center; transition: width 0.5s ease; min-width: 0; }
    .mc-bar-b { background: rgba(242,92,84,0.6); display: flex; align-items: center; justify-content: center; transition: width 0.5s ease; min-width: 0; }
    .mc-bar-label { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; color: #fff; white-space: nowrap; padding: 0 0.3rem; }

    .mc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; }
    .mc-stat { display: flex; justify-content: space-between; font-size: 0.75rem; padding: 0.2rem 0; border-bottom: 1px solid var(--border-subtle); }
    .mc-stat-l { color: var(--text-muted); }
    .mc-stat-v { font-weight: 600; }
    .blue { color: var(--accent); }
    .red { color: var(--red); }

    .total-time { text-align: right; font-size: 0.85rem; color: var(--text-secondary); }
  `]
})
export class BenchmarkComponent implements OnInit, OnDestroy, AfterViewInit {
  router = inject(Router);
  private api = inject(ApiService);
  private sse = inject(SseService);
  private destroy$ = new Subject<void>();

  @ViewChild('winRateCanvas') winRateCanvas!: ElementRef;

  nGames = 10;
  defaultMatchups: MatchupConfig[] = [];
  isRunning = false;
  results: MatchupResult[] = [];
  totalMatchups = 0;
  currentMatchupLabel = '';
  totalTime = 0;
  progressPct = 0;

  private winRateChart: Chart | null = null;

  ngOnInit() {
    this.api.getDefaultMatchups().subscribe({
      next: res => this.defaultMatchups = res.matchups,
      error: () => {}
    });
  }

  ngAfterViewInit() {}
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); this.winRateChart?.destroy(); }

  runBenchmark() {
    this.isRunning = true;
    this.results = [];
    this.totalMatchups = this.defaultMatchups.length;
    this.progressPct = 0;

    this.sse.streamBenchmark(this.nGames)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: BenchmarkEvent) => {
          if (event.type === 'start') {
            this.totalMatchups = event.n_matchups;
          }
          if (event.type === 'matchup_start') {
            this.currentMatchupLabel = event.label;
          }
          if (event.type === 'matchup_done') {
            this.results = [...this.results, event as any];
            this.progressPct = Math.round((this.results.length / this.totalMatchups) * 100);
            this.currentMatchupLabel = '';
            setTimeout(() => this.updateWinRateChart(), 50);
          }
          if (event.type === 'benchmark_done') {
            this.isRunning = false;
            this.totalTime = event.total_time_s;
            this.progressPct = 100;
          }
        },
        error: () => { this.isRunning = false; }
      });
  }

  private updateWinRateChart() {
    if (!this.winRateCanvas) return;
    const ctx = this.winRateCanvas.nativeElement.getContext('2d');

    if (this.winRateChart) {
      this.winRateChart.data.labels = this.results.map(r => r.label);
      this.winRateChart.data.datasets[0].data = this.results.map(r => r.win_rate_a);
      this.winRateChart.data.datasets[1].data = this.results.map(r => r.win_rate_b);
      this.winRateChart.update('none');
      return;
    }

    this.winRateChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.results.map(r => r.label),
        datasets: [
          { label: 'Agente A', data: this.results.map(r => r.win_rate_a), backgroundColor: 'rgba(91,141,239,0.75)', borderRadius: 4 },
          { label: 'Agente B', data: this.results.map(r => r.win_rate_b), backgroundColor: 'rgba(242,92,84,0.65)', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8b90a0', font: { size: 11, family: 'Space Mono' } } }
        },
        scales: {
          x: { ticks: { color: '#545870', font: { size: 10 } }, grid: { color: '#1e2130' } },
          y: {
            max: 100, min: 0,
            ticks: { color: '#545870', font: { size: 10 }, callback: (v: any) => v + '%' },
            grid: { color: '#1e2130' }
          }
        }
      }
    });
  }

  reset() { this.results = []; this.winRateChart?.destroy(); this.winRateChart = null; this.totalTime = 0; }
}
