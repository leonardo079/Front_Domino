import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  GameSnapshot,
  HumanTile,
  RealtimeMetricsResponse,
  StrategyInfo,
  SummaryMetricsResponse,
  TreePayload,
  TurnEvent
} from '../../../core/models/api.models';
import { DominoBoardComponent } from '../shared/domino-board.component';
import { HumanControlsComponent } from '../shared/human-controls.component';
import { RealtimeMetricsComponent } from '../shared/realtime-metrics.component';
import { SearchTreeComponent } from '../shared/search-tree.component';
import { TurnLogComponent } from '../shared/turn-log.component';

@Component({
  selector: 'app-agent-vs-human',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DominoBoardComponent,
    HumanControlsComponent,
    RealtimeMetricsComponent,
    SearchTreeComponent,
    TurnLogComponent
  ],
  templateUrl: './agent-vs-human.component.html',
  styleUrl: './agent-vs-human.component.scss'
})
export class AgentVsHumanComponent implements OnDestroy {
  private readonly api = inject(ApiService);

  strategies: StrategyInfo[] = [];
  selectedAI: StrategyInfo['name'] = 'hybrid';

  sessionId = '';
  loading = false;
  runningAI = false;
  error = '';

  snapshot: GameSnapshot | null = null;
  metrics: RealtimeMetricsResponse | null = null;
  tree: TreePayload | null = null;
  events: TurnEvent[] = [];
  summary: SummaryMetricsResponse | null = null;

  private aiTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.loadStrategies();
  }

  ngOnDestroy(): void {
    if (this.aiTimer) {
      clearTimeout(this.aiTimer);
    }
  }

  get humanTiles(): HumanTile[] {
    return this.snapshot?.human_hand ?? [];
  }

  get canHumanPlay(): boolean {
    return this.snapshot?.status === 'waiting_human';
  }

  async loadStrategies(): Promise<void> {
    const response = await firstValueFrom(this.api.getStrategies());
    this.strategies = response.strategies;
  }

  async startGame(): Promise<void> {
    this.error = '';
    this.events = [];
    this.summary = null;
    this.loading = true;

    try {
      const game = await firstValueFrom(this.api.createGame({
        strategy_a: this.selectedAI,
        game_mode: 'agent_vs_human'
      }));

      this.sessionId = game.session_id;
      await this.refreshAll();
      await this.advanceAiTurns();
    } catch (error) {
      this.error = this.errorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async playHuman(payload: { tile: HumanTile; side: 'left' | 'right' }): Promise<void> {
    if (!this.sessionId || !this.canHumanPlay) {
      return;
    }

    try {
      const event = await firstValueFrom(
        this.api.humanMove(this.sessionId, {
          tile_a: payload.tile.a,
          tile_b: payload.tile.b,
          side: payload.side
        })
      );
      this.events.push(event);
      await this.refreshAll();

      if (this.snapshot?.status !== 'finished') {
        // Yield the UI thread before triggering AI chain to keep interaction fluid.
        this.aiTimer = setTimeout(() => {
          void this.advanceAiTurns();
        }, 0);
      }
    } catch (error) {
      this.error = this.errorMessage(error);
    }
  }

  async passHuman(): Promise<void> {
    if (!this.sessionId || !this.canHumanPlay) {
      return;
    }

    try {
      const event = await firstValueFrom(this.api.humanPass(this.sessionId));
      this.events.push(event);
      await this.refreshAll();
      this.aiTimer = setTimeout(() => {
        void this.advanceAiTurns();
      }, 0);
    } catch (error) {
      this.error = this.errorMessage(error);
    }
  }

  private async advanceAiTurns(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    this.runningAI = true;
    try {
      while (this.snapshot && this.snapshot.status === 'active' && this.snapshot.current_player === 0) {
        const event = await firstValueFrom(this.api.stepGame(this.sessionId));
        this.events.push(event);
        await this.refreshAll();

        if (event.is_terminal) {
          break;
        }
      }

      if (this.snapshot?.status === 'finished') {
        await this.loadSummary();
      }
    } catch (error) {
      this.error = this.errorMessage(error);
    } finally {
      this.runningAI = false;
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
      await this.loadSummary();
    }
  }

  private async loadSummary(): Promise<void> {
    if (!this.sessionId) {
      return;
    }
    this.summary = await firstValueFrom(this.api.getSummaryMetrics(this.sessionId));
  }

  private errorMessage(value: unknown): string {
    if (value instanceof Error) {
      return value.message;
    }
    return 'No fue posible completar la accion.';
  }
}
