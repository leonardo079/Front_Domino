import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  GameSnapshot,
  RealtimeMetricsResponse,
  StrategyInfo,
  SummaryMetricsResponse,
  TreePayload,
  TurnEvent
} from '../../../core/models/api.models';
import { DominoBoardComponent } from '../shared/domino-board.component';
import { RealtimeMetricsComponent } from '../shared/realtime-metrics.component';
import { SearchTreeComponent } from '../shared/search-tree.component';
import { TurnLogComponent } from '../shared/turn-log.component';

@Component({
  selector: 'app-agent-vs-agent',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DominoBoardComponent,
    RealtimeMetricsComponent,
    SearchTreeComponent,
    TurnLogComponent
  ],
  templateUrl: './agent-vs-agent.component.html',
  styleUrl: './agent-vs-agent.component.scss'
})
export class AgentVsAgentComponent implements OnDestroy {
  private readonly api = inject(ApiService);

  strategies: StrategyInfo[] = [];

  selectedA: StrategyInfo['name'] = 'manhattan';
  selectedB: StrategyInfo['name'] = 'hybrid';
  delayMs = 400;

  sessionId = '';
  loading = false;
  running = false;
  error = '';

  snapshot: GameSnapshot | null = null;
  metrics: RealtimeMetricsResponse | null = null;
  tree: TreePayload | null = null;
  events: TurnEvent[] = [];
  summary: SummaryMetricsResponse | null = null;

  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.loadStrategies();
  }

  ngOnDestroy(): void {
    this.stopLoop();
  }

  async loadStrategies(): Promise<void> {
    const response = await firstValueFrom(this.api.getStrategies());
    this.strategies = response.strategies;
  }

  async startGame(): Promise<void> {
    this.error = '';
    this.summary = null;
    this.events = [];
    this.loading = true;

    try {
      const game = await firstValueFrom(this.api.createGame({
        strategy_a: this.selectedA,
        strategy_b: this.selectedB,
        game_mode: 'agent_vs_agent'
      }));

      this.sessionId = game.session_id;
      await this.refreshAll();
      this.running = true;
      this.scheduleNextStep();
    } catch (error) {
      this.error = this.errorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  pauseGame(): void {
    this.running = false;
    this.stopLoop();
  }

  resumeGame(): void {
    if (!this.sessionId || this.snapshot?.status === 'finished') {
      return;
    }
    this.running = true;
    this.scheduleNextStep();
  }

  private scheduleNextStep(): void {
    this.stopLoop();
    this.loopTimer = setTimeout(() => {
      void this.nextStep();
    }, this.delayMs);
  }

  private async nextStep(): Promise<void> {
    if (!this.running || !this.sessionId) {
      return;
    }

    try {
      const event = await firstValueFrom(this.api.stepGame(this.sessionId));
      this.events.push(event);
      await this.refreshAll();

      if (event.is_terminal) {
        this.running = false;
        await this.loadSummary();
        return;
      }

      this.scheduleNextStep();
    } catch (error) {
      this.running = false;
      this.error = this.errorMessage(error);
    }
  }

  private async refreshAll(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    const [snapshot, metrics, tree] = await Promise.all([
      firstValueFrom(this.api.getGame(this.sessionId)),
      firstValueFrom(this.api.getRealtimeMetrics(this.sessionId)),
      firstValueFrom(this.api.getSearchTree(this.sessionId))
    ]);

    this.snapshot = snapshot;
    this.metrics = metrics;
    this.tree = tree;

    if (snapshot.status === 'finished') {
      this.running = false;
      await this.loadSummary();
    }
  }

  private async loadSummary(): Promise<void> {
    if (!this.sessionId) {
      return;
    }
    this.summary = await firstValueFrom(this.api.getSummaryMetrics(this.sessionId));
  }

  private stopLoop(): void {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  private errorMessage(value: unknown): string {
    if (value instanceof Error) {
      return value.message;
    }
    return 'No fue posible completar la accion.';
  }
}
