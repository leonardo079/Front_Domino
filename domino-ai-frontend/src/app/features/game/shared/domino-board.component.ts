// ════════════════════════════════════════════════════════════════
// domino-board.component.ts  — drop-in replacement (style only)
// ════════════════════════════════════════════════════════════════
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { OrientedTile } from '../../../core/models/api.models';

@Component({
  selector: 'app-domino-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card board" aria-label="Tablero de domino">
      <h3 class="section-title">Tablero</h3>
      <div class="board-meta" *ngIf="leftEnd !== null && rightEnd !== null">
        <span class="end-badge left">⬡ {{ leftEnd }}</span>
        <span class="tile-count">{{ tiles.length }} fichas</span>
        <span class="end-badge right">{{ rightEnd }} ⬡</span>
      </div>

      <div class="rail" [attr.aria-label]="'Fichas en tablero: ' + tiles.length">
        <article class="tile" *ngFor="let tile of tiles; let idx = index"
                 [class.last]="idx === tiles.length - 1"
                 [class.first]="idx === 0">
          <span class="pip">{{ tile.left }}</span>
          <span class="divider"></span>
          <span class="pip">{{ tile.right }}</span>
        </article>
        <div class="rail-empty" *ngIf="!tiles.length">Sin fichas en tablero aún.</div>
      </div>
    </section>
  `,
  styles: [`
    .board { display: flex; flex-direction: column; gap: .8rem; }

    .board-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: .78rem;
      color: var(--ink-soft);
      font-family: var(--font-mono);
    }

    .end-badge {
      background: var(--accent-soft);
      color: var(--accent-strong);
      border: 1px solid rgba(232,168,68,.3);
      border-radius: .4rem;
      padding: .2rem .5rem;
      font-weight: 600;
      font-size: .78rem;
    }

    .tile-count {
      color: var(--ink-soft);
      font-size: .74rem;
    }

    .rail {
      display: flex;
      gap: .35rem;
      overflow-x: auto;
      padding: .6rem .2rem;
    }

    .tile {
      display: flex;
      align-items: center;
      gap: 0;
      flex-shrink: 0;
      border: 1px solid var(--border);
      border-radius: .55rem;
      background: var(--surface-strong);
      overflow: hidden;
      transition: border-color .2s, transform .2s;
    }

    .tile:hover { border-color: var(--border-light); transform: translateY(-2px); }

    .pip {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: .95rem;
      color: var(--ink-strong);
      padding: .4rem .55rem;
    }

    .divider {
      width: 1px;
      height: 100%;
      background: var(--border);
      align-self: stretch;
    }

    .tile.first .pip:first-child { color: var(--agent-a); }
    .tile.last { border-color: var(--accent-strong); box-shadow: 0 0 0 2px var(--accent-soft); }
    .tile.last .pip { color: var(--accent-strong); }

    .rail-empty {
      color: var(--ink-soft);
      font-size: .84rem;
      padding: .5rem;
    }
  `]
})
export class DominoBoardComponent {
  @Input({ required: true }) tiles: OrientedTile[] = [];
  @Input() leftEnd: number | null = null;
  @Input() rightEnd: number | null = null;
}


// ════════════════════════════════════════════════════════════════
// turn-log.component.ts — drop-in replacement (style only)
// ════════════════════════════════════════════════════════════════
import { CommonModule as CM2 } from '@angular/common';
import { Component as Comp2, Input as Inp2 } from '@angular/core';
import { TurnEvent } from '../../../core/models/api.models';

@Component({
  selector: 'app-turn-log',
  standalone: true,
  imports: [CM2],
  template: `
    <section class="card turn-log">
      <h3 class="section-title">Log de jugadas</h3>
      <ol>
        <li *ngFor="let ev of events.slice().reverse()">
          <span class="t-badge">T{{ ev.turn }}</span>
          <span class="player" [class.p0]="ev.player === 0" [class.p1]="ev.player === 1">J{{ ev.player }}</span>
          <span class="move">{{ ev.move }}</span>
          <small *ngIf="ev.metrics" class="meta">{{ ev.metrics.time_ms }}ms · {{ ev.metrics.nodes_expanded }} nodos</small>
        </li>
        <li class="empty" *ngIf="!events.length">Sin jugadas aún.</li>
      </ol>
    </section>
  `,
  styles: [`
    ol { list-style: none; padding: 0; margin: 0; max-height: 280px; overflow: auto; }

    li {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .45rem .2rem;
      border-bottom: 1px solid var(--border);
      font-size: .83rem;
    }
    li:last-child { border-bottom: 0; }

    .t-badge {
      font-family: var(--font-mono);
      font-size: .72rem;
      color: var(--ink-soft);
      background: var(--surface-strong);
      border: 1px solid var(--border);
      border-radius: .35rem;
      padding: .1rem .4rem;
      flex-shrink: 0;
    }

    .player {
      font-family: var(--font-mono);
      font-size: .78rem;
      font-weight: 700;
      padding: .1rem .45rem;
      border-radius: .35rem;
      flex-shrink: 0;
    }
    .player.p0 { background: rgba(91,156,246,.15); color: var(--agent-a); }
    .player.p1 { background: rgba(232,168,68,.15); color: var(--agent-b); }

    .move { color: var(--ink-mid); flex: 1; font-family: var(--font-mono); font-size: .8rem; }

    .meta {
      margin-left: auto;
      color: var(--ink-soft);
      font-size: .7rem;
      font-family: var(--font-mono);
      flex-shrink: 0;
    }

    .empty { color: var(--ink-soft); font-size: .84rem; padding: .6rem .2rem; }
  `]
})
export class TurnLogComponent {
  @Input({ required: true }) events: TurnEvent[] = [];
}