import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameSnapshot, TurnEvent, BoardTile } from '../../../core/models/api.models';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="board-container">
      <p class="section-title">Tablero</p>

      <div class="board-empty" *ngIf="!snapshot || snapshot.board.length === 0">
        <span>Tablero vacío</span>
      </div>

      <div class="board-scroll" *ngIf="snapshot && snapshot.board.length > 0">
        <!-- Left end indicator -->
        <div class="end-badge" *ngIf="snapshot.left_end !== null">
          <span class="mono">{{ snapshot.left_end }}</span>
        </div>

        <!-- Domino chain -->
        <div class="domino-chain">
          <div
            class="domino-tile-board"
            *ngFor="let tile of snapshot.board; let i = index"
            [class.last-played]="i === snapshot.board.length - 1 && isNewTile"
            [class.is-double]="tile.left === tile.right"
          >
            <span class="pip pip-l" [class]="pipClass(tile.left)">{{ tile.left }}</span>
            <span class="pip-div">|</span>
            <span class="pip pip-r" [class]="pipClass(tile.right)">{{ tile.right }}</span>
          </div>
        </div>

        <!-- Right end indicator -->
        <div class="end-badge" *ngIf="snapshot.right_end !== null">
          <span class="mono">{{ snapshot.right_end }}</span>
        </div>
      </div>

      <!-- Last move info -->
      <div class="last-move" *ngIf="lastEvent && lastEvent.type === 'turn'">
        <span class="lm-player" [class]="lastEvent.player === 0 ? 'lm-a' : 'lm-b'">
          {{ lastEvent.player === 0 ? 'A' : 'B' }}
        </span>
        <span class="lm-strategy mono">{{ lastEvent.strategy }}</span>
        <span class="lm-arrow">jugó</span>
        <span class="lm-move mono">{{ lastEvent.move }}</span>
        <span *ngIf="lastEvent.drew_from_pool" class="lm-drew">(robó del pozo)</span>
      </div>
    </div>
  `,
  styles: [`
    .board-container { display: flex; flex-direction: column; gap: 0.75rem; }

    .board-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      color: var(--text-muted);
      background: var(--surface);
      border: 1px dashed var(--border);
      border-radius: var(--radius);
      font-size: 0.85rem;
    }

    .board-scroll {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      overflow-x: auto;
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      min-height: 80px;
    }

    .domino-chain {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-wrap: wrap;
    }

    .domino-tile-board {
      display: inline-flex;
      align-items: center;
      background: #f0f0f0;
      border: 2px solid #ccc;
      border-radius: 4px;
      transition: all 0.3s;
    }

    .domino-tile-board.last-played {
      border-color: var(--accent);
      background: #ddeeff;
      box-shadow: 0 0 0 2px var(--accent), 0 4px 12px rgba(91,141,239,0.4);
      animation: pop 0.3s ease;
    }

    .domino-tile-board.is-double {
      flex-direction: column;
      border-radius: 6px;
    }

    @keyframes pop {
      0% { transform: scale(0.8); opacity: 0.5; }
      60% { transform: scale(1.08); }
      100% { transform: scale(1); opacity: 1; }
    }

    .pip {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 700;
      color: #111;
    }

    .pip-div { color: #bbb; font-size: 0.75rem; }

    .domino-tile-board.is-double .pip-div { display: none; }
    .domino-tile-board.is-double .pip-l { border-bottom: 2px solid #ccc; }

    /* Pip color coding */
    .pip-0 { color: #888; }
    .pip-1 { color: #c0392b; }
    .pip-2 { color: #2980b9; }
    .pip-3 { color: #27ae60; }
    .pip-4 { color: #8e44ad; }
    .pip-5 { color: #e67e22; }
    .pip-6 { color: #2c3e50; font-size: 0.95rem; }

    .end-badge {
      padding: 0.3rem 0.5rem;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.8rem;
      color: var(--accent);
      flex-shrink: 0;
    }

    /* Last move bar */
    .last-move {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      animation: fadeIn 0.2s ease;
    }
    .lm-player {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .lm-a { background: var(--accent-subtle); color: var(--accent); }
    .lm-b { background: var(--red-subtle); color: var(--red); }
    .lm-strategy { color: var(--text-secondary); font-size: 0.78rem; }
    .lm-arrow { color: var(--text-muted); }
    .lm-move { color: var(--text-primary); }
    .lm-drew { color: var(--yellow); font-size: 0.78rem; }
  `]
})
export class BoardComponent implements OnChanges {
  @Input() snapshot: GameSnapshot | null = null;
  @Input() lastEvent: TurnEvent | null = null;

  isNewTile = false;
  private prevBoardLength = 0;

  ngOnChanges() {
    const newLen = this.snapshot?.board.length ?? 0;
    this.isNewTile = newLen > this.prevBoardLength;
    this.prevBoardLength = newLen;
    // Reset animation flag after short delay
    if (this.isNewTile) setTimeout(() => this.isNewTile = false, 500);
  }

  pipClass(val: number): string {
    return `pip-${val}`;
  }
}
