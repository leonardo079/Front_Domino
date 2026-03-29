import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, filter, concatMap, map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { SseService } from '../../../core/services/sse.service';
import { GameStateService } from '../../../core/services/game-state.service';
import { TurnEvent, GameSnapshot, TreeResponse } from '../../../core/models/api.models';
import { BoardComponent } from '../board/board.component';
import { MetricsRealtimeComponent } from '../metrics-realtime/metrics-realtime.component';
import { TreeVisualizerComponent } from '../tree-visualizer/tree-visualizer.component';
import { HumanHandComponent } from '../human-hand/human-hand.component';

@Component({
  selector: 'app-game-view',
  standalone: true,
  imports: [
    CommonModule,
    BoardComponent,
    MetricsRealtimeComponent,
    TreeVisualizerComponent,
    HumanHandComponent,
  ],
  template: `
    <div class="game-view fade-in">

      <!-- Top bar -->
      <div class="game-topbar">
        <div class="topbar-left">
          <button class="btn btn-secondary btn-sm" (click)="router.navigate(['/'])">← Inicio</button>
          <div class="session-id mono">{{ sessionId.slice(0,8) }}…</div>
        </div>

        <div class="topbar-center" *ngIf="snapshot()">
          <div class="vs-display">
            <span class="player-tag" [class]="strategyColor(snapshot()!.strategy_a)">{{ snapshot()!.strategy_a.toUpperCase() }}</span>
            <span class="vs-sep">vs</span>
            <span class="player-tag" [class]="strategyColor(snapshot()!.strategy_b || 'human')">{{ (snapshot()!.strategy_b || 'Human').toUpperCase() }}</span>
          </div>
          <div class="turn-info" *ngIf="lastEvent()">
            <span class="turn-num mono">T{{ lastEvent()!.turn }}</span>
            <span class="badge" [class]="statusBadge()">{{ statusLabel() }}</span>
            <span *ngIf="lastEvent()!.drew_from_pool" class="badge badge-yellow">🎲 Robó del pozo</span>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Speed slider -->
          <div class="speed-ctrl" *ngIf="isStreaming()">
            <label class="speed-lbl mono">{{ delayMs }}ms</label>
            <input type="range" min="0" max="2000" step="100" [value]="delayMs" (change)="onSpeedChange($event)" class="speed-slider" />
          </div>
          <button class="btn btn-secondary btn-sm" (click)="toggleTree()">
            {{ showTree ? '🌳 Ocultar árbol' : '🌳 Ver árbol' }}
          </button>
          <button *ngIf="snapshot()?.status === 'finished'" class="btn btn-primary btn-sm" (click)="goSummary()">
            Ver Resumen →
          </button>
          <button *ngIf="!isStreaming() && snapshot()?.status !== 'finished'" class="btn btn-primary btn-sm" (click)="startStream()">
            ▶ Auto-jugar
          </button>
          <button *ngIf="isStreaming()" class="btn btn-secondary btn-sm" (click)="stopStream()">
            ⏸ Pausar
          </button>
          <button *ngIf="!isStreaming() && snapshot()?.status === 'active'" class="btn btn-secondary btn-sm" (click)="stepOnce()">
            ⏭ Un turno
          </button>
        </div>
      </div>

      <!-- Error bar -->
      <div class="error-bar" *ngIf="error()">⚠️ {{ error() }}</div>

      <!-- Main layout -->
      <div class="game-layout" [class.with-tree]="showTree">

        <!-- Center: Board -->
        <div class="col-board">
          <app-board [snapshot]="snapshot()" [lastEvent]="lastEvent()" />

          <!-- Stats bar -->
          <div class="stats-bar" *ngIf="snapshot()">
            <div class="stat">
              <span class="stat-label">Tablero</span>
              <span class="stat-value mono">{{ snapshot()!.board_length }} fichas</span>
            </div>
            <div class="stat">
              <span class="stat-label">Pozo</span>
              <span class="stat-value mono">{{ snapshot()!.pool_size }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Mano A</span>
              <span class="stat-value mono">{{ snapshot()!.hand_size_a }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Mano B</span>
              <span class="stat-value mono">{{ snapshot()!.hand_size_b }}</span>
            </div>
            <div class="stat" *ngIf="snapshot()!.left_end !== null">
              <span class="stat-label">Extremos</span>
              <span class="stat-value mono">{{ snapshot()!.left_end }} ··· {{ snapshot()!.right_end }}</span>
            </div>
          </div>

          <!-- Human hand -->
          <app-human-hand
            *ngIf="snapshot()?.game_mode === 'agent_vs_human' && snapshot()?.status === 'waiting_human'"
            [snapshot]="snapshot()!"
            [sessionId]="sessionId"
            (movePlayed)="onHumanMove()"
          />

          <!-- Winner screen -->
          <div class="winner-card" *ngIf="snapshot()?.status === 'finished'">
            <div class="winner-emoji">{{ winnerEmoji() }}</div>
            <div class="winner-title">{{ winnerTitle() }}</div>
            <div class="winner-detail mono" *ngIf="lastGameOver">
              Pips A: {{ lastGameOver.pip_sum_a }} · Pips B: {{ lastGameOver.pip_sum_b }} · {{ lastGameOver.total_turns }} turnos
            </div>
            <button class="btn btn-primary" (click)="goSummary()">Ver Resumen →</button>
          </div>
        </div>

        <!-- Right: Metrics -->
        <div class="col-metrics">
          <app-metrics-realtime [sessionId]="sessionId" [events]="allEvents" />
        </div>

        <!-- Far right: Tree -->
        <div class="col-tree" *ngIf="showTree">
          <app-tree-visualizer [treeData]="currentTree" [sessionId]="sessionId" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-view { display: flex; flex-direction: column; height: calc(100vh - 60px); overflow: hidden; }

    /* Top bar */
    .game-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 1.25rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      gap: 1rem;
      flex-shrink: 0;
    }
    .topbar-left { display: flex; align-items: center; gap: 0.75rem; }
    .session-id { font-size: 0.75rem; color: var(--text-muted); }
    .topbar-center { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
    .topbar-right { display: flex; align-items: center; gap: 0.5rem; }

    .vs-display { display: flex; align-items: center; gap: 0.6rem; }
    .player-tag {
      padding: 0.15rem 0.6rem;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 700;
    }
    .tag-hybrid   { background: var(--purple-subtle); color: var(--purple); }
    .tag-manhattan{ background: var(--accent-subtle); color: var(--accent); }
    .tag-euclidean{ background: var(--green-subtle); color: var(--green); }
    .tag-astar    { background: var(--yellow-subtle); color: var(--yellow); }
    .tag-random   { background: var(--surface-hover); color: var(--text-secondary); }
    .tag-human    { background: var(--red-subtle); color: var(--red); }
    .vs-sep { color: var(--text-muted); font-size: 0.75rem; }
    .turn-info { display: flex; align-items: center; gap: 0.4rem; }
    .turn-num { font-size: 0.8rem; color: var(--text-muted); }

    .speed-ctrl { display: flex; align-items: center; gap: 0.4rem; }
    .speed-lbl { font-size: 0.7rem; color: var(--text-secondary); min-width: 40px; text-align: right; }
    .speed-slider { width: 80px; accent-color: var(--accent); }

    .error-bar { padding: 0.5rem 1.25rem; background: var(--red-subtle); color: var(--red); font-size: 0.85rem; flex-shrink: 0; }

    /* Layout */
    .game-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      flex: 1;
      overflow: hidden;
    }
    .game-layout.with-tree { grid-template-columns: 1fr 300px 380px; }

    .col-board { overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
    .col-metrics { overflow-y: auto; border-left: 1px solid var(--border); padding: 1rem; background: var(--bg-secondary); }
    .col-tree { overflow-y: auto; border-left: 1px solid var(--border); }

    /* Stats bar */
    .stats-bar {
      display: flex;
      gap: 1.5rem;
      padding: 0.75rem 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .stat { display: flex; flex-direction: column; gap: 0.1rem; }
    .stat-label { font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase; }
    .stat-value { font-size: 0.9rem; font-weight: 600; }

    /* Winner */
    .winner-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      text-align: center;
    }
    .winner-emoji { font-size: 3rem; }
    .winner-title { font-size: 1.4rem; font-weight: 700; font-family: var(--font-mono); }
    .winner-detail { font-size: 0.8rem; color: var(--text-secondary); }
  `]
})
export class GameViewComponent implements OnInit, OnDestroy {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private sse = inject(SseService);
  private gameState = inject(GameStateService);

  sessionId = '';
  delayMs = 300;
  showTree = false;

  snapshot = signal<GameSnapshot | null>(null);
  lastEvent = signal<TurnEvent | null>(null);
  isStreaming = signal(false);
  error = signal<string | null>(null);
  allEvents: TurnEvent[] = [];
  currentTree: TreeResponse | null = null;
  lastGameOver: any = null;

  private destroy$ = new Subject<void>();
  private sseSubscription?: Subscription;
  private isProcessingAiTurn = false;

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;
    this.delayMs = +(this.route.snapshot.queryParamMap.get('delay') ?? 300);
    this.loadSnapshot();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopStream();
  }

  loadSnapshot() {
    this.api.getGame(this.sessionId).subscribe({
      next: snap => {
        this.snapshot.set(snap);
        if (snap.status === 'active' && snap.game_mode === 'agent_vs_agent') {
          this.startStream();
        }
        if (snap.status === 'active' && snap.game_mode === 'agent_vs_human') {
          this.advanceAiTurn();
        }
      },
      error: () => this.error.set('No se encontró la sesión')
    });
  }

  startStream() {
    if (this.isStreaming()) return;
    this.isStreaming.set(true);
    this.error.set(null);

    this.sseSubscription = this.sse.streamGame(this.sessionId, this.delayMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: event => this.handleTurnEvent(event),
        error: err => {
          this.isStreaming.set(false);
          if (err) this.error.set('Se interrumpió la conexión SSE');
        },
        complete: () => this.isStreaming.set(false)
      });
  }

  stopStream() {
    this.sseSubscription?.unsubscribe();
    this.isStreaming.set(false);
  }

  stepOnce() {
    this.api.stepGame(this.sessionId).subscribe({
      next: event => this.handleTurnEvent(event),
      error: err => this.error.set(err?.error?.detail || 'Error al ejecutar turno')
    });
  }

  handleTurnEvent(event: TurnEvent) {
    if (event.type === 'game_over') {
      this.lastGameOver = event;
      this.api.getGame(this.sessionId).subscribe(snap => this.snapshot.set(snap));
      return;
    }
    this.lastEvent.set(event);
    this.allEvents = [...this.allEvents, event];
    this.api.getGame(this.sessionId).subscribe(snap => this.snapshot.set(snap));
    this.fetchTree();
  }

  fetchTree() {
    this.api.getTree(this.sessionId).subscribe({
      next: tree => this.currentTree = tree,
      error: () => {}
    });
  }

  onHumanMove() {
    this.api.getGame(this.sessionId).subscribe(snap => {
      this.snapshot.set(snap);
      if (snap.status === 'active') this.advanceAiTurn();
    });
  }

  advanceAiTurn() {
    if (this.isProcessingAiTurn) return;
    this.isProcessingAiTurn = true;
    this.api.stepGame(this.sessionId).subscribe({
      next: event => {
        this.isProcessingAiTurn = false;
        this.handleTurnEvent(event);
        this.api.getGame(this.sessionId).subscribe(snap => {
          this.snapshot.set(snap);
          if (snap.status === 'active' && snap.game_mode === 'agent_vs_human') {
            this.advanceAiTurn();
          }
        });
      },
      error: () => { this.isProcessingAiTurn = false; }
    });
  }

  onSpeedChange(evt: Event) {
    this.delayMs = +(evt.target as HTMLInputElement).value;
    if (this.isStreaming()) { this.stopStream(); this.startStream(); }
  }

  toggleTree() { this.showTree = !this.showTree; }
  goSummary() { this.router.navigate(['/game', this.sessionId, 'summary']); }

  strategyColor(name: string) {
    const map: Record<string, string> = {
      hybrid: 'tag-hybrid', manhattan: 'tag-manhattan',
      euclidean: 'tag-euclidean', astar: 'tag-astar',
      random: 'tag-random', human: 'tag-human'
    };
    return map[name] ?? 'tag-random';
  }

  statusLabel() {
    const s = this.snapshot()?.status;
    if (s === 'finished') return 'Terminada';
    if (s === 'waiting_human') return 'Tu turno';
    if (this.isStreaming()) return 'En curso';
    return 'Pausada';
  }

  statusBadge() {
    const s = this.snapshot()?.status;
    if (s === 'finished') return 'badge badge-muted';
    if (s === 'waiting_human') return 'badge badge-yellow';
    return this.isStreaming() ? 'badge badge-green' : 'badge badge-muted';
  }

  winnerEmoji() {
    const w = this.snapshot()?.winner;
    if (w === -1) return '🤝';
    if (w === 0) return '🏆';
    if (w === 1) return '🥇';
    return '🏁';
  }

  winnerTitle() {
    const snap = this.snapshot();
    if (!snap) return '';
    if (snap.winner === -1) return 'Empate';
    if (snap.winner === 0) return `Gana ${snap.strategy_a.toUpperCase()}`;
    return `Gana ${(snap.strategy_b || 'Human').toUpperCase()}`;
  }
}
