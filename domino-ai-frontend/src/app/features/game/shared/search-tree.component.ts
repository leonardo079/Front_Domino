import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TreeNode, TreePayload } from '../../../core/models/api.models';

@Component({
  selector: 'app-search-tree',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h3 class="section-title">Arbol de busqueda (ultimo turno)</h3>
      <div class="columns" *ngIf="tree; else emptyState">
        <section>
          <h4>{{ tree.strategy_a }}</h4>
          <p class="meta">Nodos: {{ tree.tree_a?.nodes?.length ?? 0 }}</p>
          <ul>
            <li *ngFor="let node of previewNodes(tree.tree_a?.nodes)">
              <span [style.padding-left.px]="node.depth * 12">
                {{ node.node_type }}
                <small *ngIf="node.move">{{ node.move }}</small>
                <em *ngIf="node.pruned">pruned</em>
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h4>{{ tree.strategy_b }}</h4>
          <p class="meta">Nodos: {{ tree.tree_b?.nodes?.length ?? 0 }}</p>
          <ul>
            <li *ngFor="let node of previewNodes(tree.tree_b?.nodes)">
              <span [style.padding-left.px]="node.depth * 12">
                {{ node.node_type }}
                <small *ngIf="node.move">{{ node.move }}</small>
                <em *ngIf="node.pruned">pruned</em>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </section>

    <ng-template #emptyState>
      <p class="meta">Sin arbol aun. Inicia la partida para ver decisiones por turno.</p>
    </ng-template>
  `,
  styles: [`.columns{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.meta{color:var(--ink-soft);font-size:.82rem;margin-top:0}ul{margin:0;padding:0;list-style:none;max-height:260px;overflow:auto;border:1px solid var(--border);background:var(--surface);border-radius:.6rem}li{padding:.26rem .4rem;border-bottom:1px dashed var(--border)}li:last-child{border-bottom:0}small{font-family:var(--font-mono);opacity:.75}em{color:var(--warn);font-style:normal;font-size:.75rem;margin-left:.4rem}@media (max-width:960px){.columns{grid-template-columns:1fr;}}`]
})
export class SearchTreeComponent {
  @Input() tree: TreePayload | null = null;

  previewNodes(nodes: TreeNode[] | undefined): TreeNode[] {
    return (nodes ?? []).slice(0, 120);
  }
}
