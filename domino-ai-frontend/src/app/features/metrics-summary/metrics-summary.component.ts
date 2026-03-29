import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SummaryMetricsResponse } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-metrics-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-summary.component.html',
  styleUrl: './metrics-summary.component.scss'
})
export class MetricsSummaryComponent implements OnChanges {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  @Input() sessionId = '';
  @Input() embedded = false;

  loading = false;
  error = '';
  summary: SummaryMetricsResponse | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionId']?.currentValue) {
      void this.loadSummary(changes['sessionId'].currentValue as string);
      return;
    }

    if (!this.sessionId) {
      const idFromRoute = this.route.snapshot.paramMap.get('id');
      if (idFromRoute) {
        this.sessionId = idFromRoute;
        void this.loadSummary(this.sessionId);
      }
    }
  }

  async loadSummary(id: string): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      this.summary = await firstValueFrom(this.api.getSummaryMetrics(id));
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo cargar el resumen.';
    } finally {
      this.loading = false;
    }
  }

  entries(record: unknown): [string, unknown][] {
    if (!record || typeof record !== 'object') {
      return [];
    }
    return Object.entries(record as Record<string, unknown>);
  }
}
