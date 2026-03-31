import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { BenchmarkEvent, BenchmarkMatchupDone, MatchupConfig } from '../../core/models/api.models';
import { BenchmarkChartsComponent } from './benchmark-charts.component';

@Component({
  selector: 'app-benchmark',
  standalone: true,
  imports: [CommonModule, FormsModule, BenchmarkChartsComponent],
  templateUrl: './benchmark.component.html',
  styleUrl: './benchmark.component.scss'
})
export class BenchmarkComponent implements OnDestroy {
  private readonly api = inject(ApiService);

  nGames = 10;
  loading = false;
  running = false;
  error = '';

  matchups: MatchupConfig[] = [];
  selectedTags = new Set<string>();

  events: BenchmarkEvent[] = [];
  results: BenchmarkMatchupDone[] = [];
  runId = '';
  totalTime = 0;

  private streamSub: Subscription | null = null;

  constructor() {
    void this.loadMatchups();
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
  }

  async loadMatchups(): Promise<void> {
    const response = await firstValueFrom(this.api.getMatchups());
    this.matchups = response.matchups;
    this.selectedTags = new Set(this.matchups.map(m => m.tag));
  }

  toggleMatchup(tag: string, checked: boolean): void {
    if (checked) {
      this.selectedTags.add(tag);
      return;
    }
    this.selectedTags.delete(tag);
  }

  runBenchmark(): void {
    if (this.selectedTags.size === 0) {
      this.error = 'Selecciona al menos un matchup.';
      return;
    }

    this.error = '';
    this.running = true;
    this.loading = true;
    this.events = [];
    this.results = [];
    this.totalTime = 0;

    const selected = this.matchups.filter(m => this.selectedTags.has(m.tag));

    this.streamSub?.unsubscribe();
    this.streamSub = this.api.runBenchmarkStream(this.nGames, selected).subscribe({
      next: event => this.handleEvent(event),
      error: () => {
        this.running = false;
        this.loading = false;
        this.error = 'Benchmark interrumpido. Verifica que el backend este activo.';
      },
      complete: () => {
        this.running = false;
        this.loading = false;
      }
    });
  }

  private handleEvent(event: BenchmarkEvent): void {
    this.events.push(event);

    if (event.type === 'start') {
      this.runId = event.run_id;
    }

    if (event.type === 'matchup_done') {
      // Crear nueva referencia del array para que ngOnChanges se dispare
      this.results = [...this.results, event];
    }

    if (event.type === 'benchmark_done') {
      this.totalTime = event.total_time_s;
      this.results = [...event.results];
    }
  }
}