import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TurnEvent } from '../../../core/models/api.models';

@Component({
  selector: 'app-turn-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h3 class="section-title">Log de jugadas</h3>
      <ol>
        <li *ngFor="let ev of events.slice().reverse()">
          <span class="mono">T{{ ev.turn }}</span>
          <strong>J{{ ev.player }}</strong>
          <span>{{ ev.move }}</span>
          <small *ngIf="ev.metrics">{{ ev.metrics.time_ms }}ms / {{ ev.metrics.nodes_expanded }} nodos</small>
        </li>
      </ol>
    </section>
  `,
  styles: [`ol{list-style:none;padding:0;margin:0;max-height:280px;overflow:auto}li{display:flex;align-items:center;gap:.45rem;padding:.4rem .2rem;border-bottom:1px dashed var(--border)}small{margin-left:auto;color:var(--ink-soft);font-size:.75rem}`]
})
export class TurnLogComponent {
  @Input({ required: true }) events: TurnEvent[] = [];
}
