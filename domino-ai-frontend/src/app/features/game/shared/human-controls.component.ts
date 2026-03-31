import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HumanPlayableMove, HumanTile } from '../../../core/models/api.models';
import { OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-human-controls',
  standalone: true,
  imports: [CommonModule],
 template: `
    <section class="card" *ngIf="tiles.length">
      <h3 class="section-title">Tu mano</h3>
      <p class="hint">{{ helperText }}</p>

      <div class="tiles" aria-label="Fichas del jugador humano">
        <button
          *ngFor="let t of tiles"
          type="button"
          class="tile-btn"
          [class.selected]="selectedKey === tileKey(t)"
          (click)="selectTile(t)">
          <span>{{ t.a }}</span><span>{{ t.b }}</span>
        </button>
      </div>

      <div class="moves">
        <button
          *ngFor="let move of activeMoves"
          type="button"
          class="btn btn-secondary btn-sm"
          (click)="play.emit({ tile: selected!, side: move.side })">
          {{ move.side === 'left' ? '← Jugar Izquierda' : 'Jugar Derecha →' }}
        </button>

        <button type="button" class="btn btn-danger btn-sm" (click)="pass.emit()" [disabled]="validMoves.length > 0">
          {{ actionButtonLabel }}
        </button>
      </div>
    </section>
  `,
styles: [`.hint{color:var(--ink-soft);font-size:.85rem;margin-top:0}.tiles{display:flex;flex-wrap:wrap;gap:.45rem}.tile-btn{display:flex;gap:.2rem;align-items:center;border:1px solid #c8b89a;padding:.35rem .45rem;border-radius:.5rem;background:#f5ede0;font-family:var(--font-mono);font-weight:700;cursor:pointer;color:#2b2318;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:border-color .2s,transform .15s,box-shadow .2s}.tile-btn span:first-child{border-right:1px solid #c8b89a;padding-right:.3rem}.tile-btn:hover{border-color:#e8a844;background:#fff8f0;transform:translateY(-3px);box-shadow:0 6px 16px rgba(0,0,0,.4)}.tile-btn.selected{outline:2px solid #e8a844;background:#fff3d6;color:#7a4a00}.moves{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem}`]})
export class HumanControlsComponent {
  @Input() tiles: HumanTile[] = [];
  @Input() validMoves: HumanPlayableMove[] = [];
  @Input() poolSize = 0;

  @Output() play = new EventEmitter<{ tile: HumanTile; side: 'left' | 'right' }>();
  @Output() pass = new EventEmitter<void>();

  selected: HumanTile | null = null;
  get activeMoves(): HumanPlayableMove[] {
    if (!this.selected) return [];
    return this.validMoves.filter(move => this.matchTile(this.selected!, move.tile));
  }
  get selectedKey(): string | null {
    return this.selected ? this.tileKey(this.selected) : null;
  }

  get actionButtonLabel(): string {
    if (this.validMoves.length > 0) {
      return 'Pasar';
    }
    return this.poolSize > 0 ? 'Robar del pozo' : 'Pasar';
  }

  get helperText(): string {
    if (this.validMoves.length > 0) {
      return 'Selecciona una ficha y un lado para jugar.';
    }
    return this.poolSize > 0
      ? 'No tienes jugadas. Pulsa "Robar del pozo" para tomar fichas automaticamente.'
      : 'No hay jugadas ni pozo disponible. Puedes pasar el turno.';
  }

  tileKey(tile: Pick<HumanTile, 'a' | 'b'>): string {
    return `${Math.min(tile.a, tile.b)}-${Math.max(tile.a, tile.b)}`;
  }

  selectTile(tile: HumanTile): void {
    this.selected = tile;
  }

  matchTile(tileA: Pick<HumanTile, 'a' | 'b'>, tileB: Pick<HumanTile, 'a' | 'b'>): boolean {
    return this.tileKey(tileA) === this.tileKey(tileB);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tiles']) {
      this.selected = null;
    }
  }
}
