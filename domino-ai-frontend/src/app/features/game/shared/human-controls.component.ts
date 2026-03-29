import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HumanPlayableMove, HumanTile } from '../../../core/models/api.models';

@Component({
  selector: 'app-human-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card" *ngIf="tiles.length">
      <h3 class="section-title">Tu mano</h3>
      <p class="hint">Selecciona una ficha y un lado para jugar.</p>

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
          *ngFor="let move of validMoves"
          type="button"
          class="btn btn-secondary btn-sm"
          [disabled]="!selected || !matchTile(selected, move.tile)"
          (click)="play.emit({ tile: selected!, side: move.side })">
          Jugar {{ move.side }}
        </button>

        <button type="button" class="btn btn-danger btn-sm" (click)="pass.emit()" [disabled]="validMoves.length > 0">
          Pasar
        </button>
      </div>
    </section>
  `,
  styles: [`.hint{color:var(--ink-soft);font-size:.85rem;margin-top:0}.tiles{display:flex;flex-wrap:wrap;gap:.45rem}.tile-btn{display:flex;gap:.2rem;align-items:center;border:1px solid var(--border);padding:.35rem .45rem;border-radius:.5rem;background:var(--surface-strong);font-family:var(--font-mono);font-weight:700;cursor:pointer}.tile-btn span:first-child{border-right:1px solid var(--border);padding-right:.3rem}.tile-btn.selected{outline:2px solid var(--accent-strong)}.moves{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem}`]
})
export class HumanControlsComponent {
  @Input() tiles: HumanTile[] = [];
  @Input() validMoves: HumanPlayableMove[] = [];

  @Output() play = new EventEmitter<{ tile: HumanTile; side: 'left' | 'right' }>();
  @Output() pass = new EventEmitter<void>();

  selected: HumanTile | null = null;

  get selectedKey(): string | null {
    return this.selected ? this.tileKey(this.selected) : null;
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
}
