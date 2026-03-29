import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { GameSnapshot, HumanMove } from '../../../core/models/api.models';

interface HandTile {
  a: number;
  b: number;
  pips: number;
  isPlayable: boolean;
  validSides: Array<'left' | 'right'>;
}

@Component({
  selector: 'app-human-hand',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="human-hand fade-in">
      <div class="hand-header">
        <span class="hand-title">🧑‍💻 Tu mano</span>
        <span class="hand-hint" *ngIf="hand.length > 0 && playableTiles.length > 0">
          Selecciona una ficha verde para jugar
        </span>
        <span class="hand-hint warn" *ngIf="hand.length > 0 && playableTiles.length === 0 && snapshot.pool_size > 0">
          Sin jugadas — robando del pozo...
        </span>
      </div>

      <div class="tiles-row">
        <div
          class="human-tile"
          *ngFor="let tile of hand"
          [class.playable]="tile.isPlayable"
          [class.selected]="isSelected(tile)"
          [class.unplayable]="!tile.isPlayable"
          (click)="selectTile(tile)"
          [title]="tile.isPlayable ? 'Clic para jugar' : 'No encaja en el tablero'"
        >
          <span class="hp-left pip-{{ tile.a }}">{{ tile.a }}</span>
          <span class="hp-div">|</span>
          <span class="hp-right pip-{{ tile.b }}">{{ tile.b }}</span>
        </div>
      </div>

      <!-- Side selection popup -->
      <div class="side-select" *ngIf="selectedTile">
        <div class="side-prompt">¿Dónde jugar <strong class="mono">[{{selectedTile.a}}|{{selectedTile.b}}]</strong>?</div>
        <div class="side-buttons">
          <button
            class="btn btn-secondary"
            *ngIf="selectedTile.validSides.includes('left')"
            (click)="playMove('left')"
          >← Izquierda ({{ snapshot.left_end }})</button>
          <button
            class="btn btn-secondary"
            *ngIf="selectedTile.validSides.includes('right')"
            (click)="playMove('right')"
          >Derecha ({{ snapshot.right_end }}) →</button>
          <button class="btn btn-secondary" (click)="selectedTile = null">Cancelar</button>
        </div>
      </div>

      <!-- Pass button -->
      <div class="pass-section" *ngIf="playableTiles.length === 0 && snapshot.pool_size === 0">
        <p class="pass-hint">Sin jugadas disponibles y el pozo está vacío.</p>
        <button class="btn btn-secondary" (click)="pass()" [disabled]="loading">
          {{ loading ? 'Pasando...' : '⏭ Pasar turno' }}
        </button>
      </div>

      <!-- Error -->
      <div class="hand-error" *ngIf="errorMsg">⚠️ {{ errorMsg }}</div>
    </div>
  `,
  styles: [`
    .human-hand {
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      border-top: 2px solid var(--yellow);
    }

    .hand-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .hand-title { font-weight: 600; font-size: 0.9rem; }
    .hand-hint { font-size: 0.78rem; color: var(--text-muted); }
    .hand-hint.warn { color: var(--yellow); }

    .tiles-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }

    .human-tile {
      display: inline-flex;
      align-items: stretch;
      background: #f0f0f0;
      border: 2px solid #ccc;
      border-radius: 5px;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 1rem;
      color: #111;
      transition: all 0.15s;
      overflow: hidden;
    }

    .human-tile.playable {
      border-color: #3ecf8e;
      background: #edfaf4;
      cursor: pointer;
      box-shadow: 0 0 0 1px #3ecf8e;
    }
    .human-tile.playable:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(62,207,142,0.35);
    }
    .human-tile.selected {
      border-color: var(--accent);
      background: #e8efff;
      box-shadow: 0 0 0 2px var(--accent);
    }
    .human-tile.unplayable { opacity: 0.45; cursor: not-allowed; }

    .hp-left { padding: 0.35rem 0.55rem; border-right: 2px solid #ccc; }
    .hp-div { display: none; }
    .hp-right { padding: 0.35rem 0.55rem; }

    .pip-0 { color: #888; }
    .pip-1 { color: #c0392b; }
    .pip-2 { color: #2980b9; }
    .pip-3 { color: #27ae60; }
    .pip-4 { color: #8e44ad; }
    .pip-5 { color: #e67e22; }
    .pip-6 { color: #2c3e50; }

    .side-select {
      padding: 0.75rem;
      background: var(--surface-hover);
      border-radius: var(--radius-sm);
      margin-bottom: 0.5rem;
      animation: fadeIn 0.15s ease;
    }
    .side-prompt { font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary); }
    .side-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .pass-section { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; }
    .pass-hint { font-size: 0.8rem; color: var(--text-muted); margin: 0; }

    .hand-error {
      padding: 0.4rem 0.6rem;
      background: var(--red-subtle);
      color: var(--red);
      border-radius: 4px;
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }
  `]
})
export class HumanHandComponent {
  @Input() snapshot!: GameSnapshot;
  @Input() sessionId = '';
  @Output() movePlayed = new EventEmitter<void>();

  private api = inject(ApiService);

  selectedTile: HandTile | null = null;
  loading = false;
  errorMsg = '';

  get hand(): HandTile[] {
    if (!this.snapshot?.human_hand) return [];
    const validMoves = this.snapshot.human_valid_moves ?? [];

    return this.snapshot.human_hand.map(t => {
      const sides = validMoves
        .filter(m => (m.tile.a === t.a && m.tile.b === t.b) || (m.tile.a === t.b && m.tile.b === t.a))
        .map(m => m.side as 'left' | 'right');
      return { ...t, isPlayable: sides.length > 0, validSides: sides };
    });
  }

  get playableTiles(): HandTile[] {
    return this.hand.filter(t => t.isPlayable);
  }

  isSelected(tile: HandTile): boolean {
    return this.selectedTile?.a === tile.a && this.selectedTile?.b === tile.b;
  }

  selectTile(tile: HandTile) {
    if (!tile.isPlayable) return;
    this.errorMsg = '';
    if (tile.validSides.length === 1) {
      this.selectedTile = tile;
      this.playMove(tile.validSides[0]);
    } else {
      this.selectedTile = tile;
    }
  }

  playMove(side: 'left' | 'right') {
    if (!this.selectedTile) return;
    this.loading = true;
    this.errorMsg = '';
    this.api.humanMove(this.sessionId, this.selectedTile.a, this.selectedTile.b, side)
      .subscribe({
        next: () => {
          this.selectedTile = null;
          this.loading = false;
          this.movePlayed.emit();
        },
        error: err => {
          this.loading = false;
          this.errorMsg = err?.error?.detail ?? 'Jugada inválida';
          this.selectedTile = null;
        }
      });
  }

  pass() {
    this.loading = true;
    this.api.humanPass(this.sessionId).subscribe({
      next: () => { this.loading = false; this.movePlayed.emit(); },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.detail ?? 'No se puede pasar';
      }
    });
  }
}
