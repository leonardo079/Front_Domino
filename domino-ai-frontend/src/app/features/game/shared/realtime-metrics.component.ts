import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MetricPoint, RealtimeMetricsResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-realtime-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card" *ngIf="metrics; else emptyState">
      <h3 class="section-title">Metricas en tiempo real</h3>

      <div class="grid">
        <article class="metric" *ngFor="let key of chartKeys">
          <header>
            <strong>{{ key }}</strong>
            <small>{{ latestValue(key, 'a') }} / {{ latestValue(key, 'b') }}</small>
          </header>

          <svg viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
            <polyline [attr.points]="toPolyline(getSeries(key, 'a'))" class="line-a"></polyline>
            <polyline [attr.points]="toPolyline(getSeries(key, 'b'))" class="line-b"></polyline>
          </svg>
        </article>
      </div>
    </section>

    <ng-template #emptyState>
      <section class="card">
        <h3 class="section-title">Metricas en tiempo real</h3>
        <p class="muted">Las series se llenaran cuando empiece la partida.</p>
      </section>
    </ng-template>
  `,
  styles: [`.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem}.metric{border:1px solid var(--border);border-radius:.7rem;padding:.6rem;background:var(--surface)}header{display:flex;justify-content:space-between;gap:.5rem}strong{text-transform:capitalize;font-size:.85rem}small{font-family:var(--font-mono);color:var(--ink-soft)}svg{width:100%;height:55px;margin-top:.5rem;background:var(--surface-strong);border-radius:.45rem}.line-a{fill:none;stroke:var(--accent-strong);stroke-width:1.3}.line-b{fill:none;stroke:var(--warn);stroke-width:1.3}.muted{color:var(--ink-soft);font-size:.9rem}`]
})
export class RealtimeMetricsComponent {
  @Input() metrics: RealtimeMetricsResponse | null = null;

  readonly chartKeys = ['time_ms', 'nodes_expanded', 'eval_calls', 'max_depth'];

  getSeries(key: string, side: 'a' | 'b'): MetricPoint[] {
    if (!this.metrics?.realtime_charts[key]) {
      return [];
    }
    return side === 'a'
      ? this.metrics.realtime_charts[key].series_a
      : this.metrics.realtime_charts[key].series_b;
  }

  latestValue(key: string, side: 'a' | 'b'): string {
    const series = this.getSeries(key, side);
    const last = series.at(-1);
    return last ? `${Math.round(last.value * 100) / 100}` : '-';
  }

  toPolyline(series: MetricPoint[]): string {
    if (!series.length) {
      return '';
    }

    const windowed = series.slice(-20);
    const values = windowed.map(p => p.value);
    const max = Math.max(...values, 1);

    return windowed
      .map((p, idx) => {
        const x = (idx / Math.max(windowed.length - 1, 1)) * 100;
        const y = 24 - (p.value / max) * 22;
        return `${x},${y}`;
      })
      .join(' ');
  }
}
