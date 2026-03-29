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
        <span>Extremo izquierdo: <strong>{{ leftEnd }}</strong></span>
        <span>Extremo derecho: <strong>{{ rightEnd }}</strong></span>
      </div>

      <div class="rail" [attr.aria-label]="'Fichas en tablero: ' + tiles.length">
        <article class="tile" *ngFor="let tile of tiles; let idx = index" [class.last]="idx === tiles.length - 1">
          <span>{{ tile.left }}</span>
          <span>{{ tile.right }}</span>
        </article>
      </div>
    </section>
  `,
  styles: [`.board{display:flex;flex-direction:column;gap:.75rem}.board-meta{display:flex;gap:1rem;color:var(--ink-soft);font-size:.84rem}.rail{display:flex;gap:.45rem;overflow:auto;padding:.5rem .2rem}.tile{display:flex;gap:.2rem;align-items:center;padding:.4rem .45rem;border-radius:.55rem;border:1px solid var(--border);background:var(--surface-strong);font-family:var(--font-mono);font-weight:700}.tile span:first-child{border-right:1px solid var(--border);padding-right:.35rem}.tile.last{outline:2px solid var(--accent-soft);}`]
})
export class DominoBoardComponent {
  @Input({ required: true }) tiles: OrientedTile[] = [];
  @Input() leftEnd: number | null = null;
  @Input() rightEnd: number | null = null;
}
