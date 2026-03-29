import {
  Component, Input, OnChanges, AfterViewInit,
  ElementRef, ViewChild, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeResponse, TreeNode, NodeType } from '../../../core/models/api.models';
import * as d3 from 'd3';

interface D3Node extends d3.HierarchyPointNode<TreeNode> {}

const NODE_COLORS: Record<NodeType, string> = {
  ROOT:          '#1F4E79',
  MAX:           '#5b8def',
  MIN:           '#f25c54',
  PRUNED:        '#545870',
  ASTAR:         '#3ecf8e',
  ASTAR_PHASE:   '#a78bfa',
  ASTAR_RANK:    '#a78bfa',
  MINIMAX_PHASE: '#f5a623',
  RANDOM:        '#8b90a0',
};

@Component({
  selector: 'app-tree-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-panel">
      <div class="tree-header">
        <p class="section-title" style="margin:0">Árbol de Búsqueda</p>
        <div class="tree-tabs">
          <button class="tree-tab" [class.active]="activeTree === 'a'" (click)="switchTree('a')">Agente A</button>
          <button class="tree-tab" [class.active]="activeTree === 'b'" (click)="switchTree('b')">Agente B</button>
        </div>
      </div>

      <div class="truncated-warn" *ngIf="isTruncated">
        ⚠️ Árbol truncado — se muestran los primeros 400 nodos
      </div>

      <div class="tree-meta" *ngIf="nodeCount > 0">
        <span class="mono">{{ nodeCount }} nodos</span>
      </div>

      <!-- Legend -->
      <div class="legend">
        <div class="leg-item" *ngFor="let l of legend">
          <span class="leg-dot" [style.background]="l.color"></span>
          <span>{{ l.label }}</span>
        </div>
      </div>

      <!-- SVG tree -->
      <div class="tree-svg-wrap" #treeWrap>
        <svg #treeSvg></svg>
        <div class="tree-empty" *ngIf="nodeCount === 0">
          Sin datos de árbol.<br><span class="mono">Juega un turno primero.</span>
        </div>
      </div>

      <!-- Tooltip -->
      <div class="tree-tooltip" #tooltip [style.opacity]="tooltipVisible ? 1 : 0">
        <div class="tt-type mono">{{ tooltipData?.node_type }}</div>
        <div class="tt-move">{{ tooltipData?.move }}</div>
        <div class="tt-vals mono" *ngIf="tooltipData">
          <span *ngIf="tooltipData.alpha !== null">α={{ tooltipData.alpha?.toFixed(3) }}</span>
          <span *ngIf="tooltipData.beta !== null">β={{ tooltipData.beta?.toFixed(3) }}</span>
          <span *ngIf="tooltipData.value !== null">v={{ tooltipData.value?.toFixed(3) }}</span>
        </div>
        <div class="tt-pruned" *ngIf="tooltipData?.pruned">✂ Podado</div>
      </div>
    </div>
  `,
  styles: [`
    .tree-panel { display: flex; flex-direction: column; height: 100%; padding: 1rem; gap: 0.6rem; }

    .tree-header { display: flex; align-items: center; justify-content: space-between; }
    .tree-tabs { display: flex; gap: 0.25rem; }
    .tree-tab {
      padding: 0.2rem 0.6rem;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .tree-tab.active { background: var(--accent-subtle); border-color: var(--accent); color: var(--accent); }

    .truncated-warn {
      padding: 0.35rem 0.6rem;
      background: var(--yellow-subtle);
      color: var(--yellow);
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .tree-meta { font-size: 0.72rem; color: var(--text-muted); }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem 0.75rem;
    }
    .leg-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.68rem; color: var(--text-secondary); }
    .leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    .tree-svg-wrap {
      flex: 1;
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      position: relative;
    }

    .tree-svg-wrap svg { width: 100%; height: 100%; }

    .tree-empty {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 0.82rem;
      text-align: center;
      gap: 0.4rem;
    }

    .tree-tooltip {
      position: fixed;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.8rem;
      pointer-events: none;
      z-index: 1000;
      transition: opacity 0.1s;
      min-width: 140px;
      box-shadow: var(--shadow);
    }
    .tt-type { font-size: 0.65rem; color: var(--text-muted); margin-bottom: 0.15rem; }
    .tt-move { font-size: 0.82rem; font-weight: 600; margin-bottom: 0.3rem; }
    .tt-vals { display: flex; gap: 0.5rem; font-size: 0.72rem; color: var(--accent); }
    .tt-pruned { font-size: 0.72rem; color: var(--red); margin-top: 0.15rem; }
  `]
})
export class TreeVisualizerComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() treeData: TreeResponse | null = null;
  @Input() sessionId = '';

  @ViewChild('treeSvg') svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('treeWrap') wrapRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip') tooltipRef!: ElementRef<HTMLDivElement>;

  activeTree: 'a' | 'b' = 'a';
  nodeCount = 0;
  isTruncated = false;
  tooltipVisible = false;
  tooltipData: TreeNode | null = null;

  legend = [
    { label: 'ROOT',    color: NODE_COLORS.ROOT },
    { label: 'MAX',     color: NODE_COLORS.MAX },
    { label: 'MIN',     color: NODE_COLORS.MIN },
    { label: 'PRUNED',  color: NODE_COLORS.PRUNED },
    { label: 'A*',      color: NODE_COLORS.ASTAR },
    { label: 'PHASE',   color: NODE_COLORS.ASTAR_PHASE },
    { label: 'RANDOM',  color: NODE_COLORS.RANDOM },
  ];

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private initialized = false;
  private resizeObserver!: ResizeObserver;

  ngAfterViewInit() {
    this.initSvg();
    this.initialized = true;
    this.resizeObserver = new ResizeObserver(() => this.renderTree());
    this.resizeObserver.observe(this.wrapRef.nativeElement);
    if (this.treeData) this.renderTree();
  }

  ngOnChanges() {
    if (this.initialized) this.renderTree();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  switchTree(which: 'a' | 'b') {
    this.activeTree = which;
    this.renderTree();
  }

  private initSvg() {
    this.svg = d3.select(this.svgRef.nativeElement);
    this.svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          this.g.attr('transform', event.transform);
        })
    );
    this.g = this.svg.append('g');
  }

  private getActiveNodes(): TreeNode[] {
    if (!this.treeData) return [];
    const data = this.activeTree === 'a' ? this.treeData.tree_a : this.treeData.tree_b;
    if (!data) return [];
    this.nodeCount = data.total_nodes;
    this.isTruncated = data.truncated;
    return data.nodes;
  }

  private renderTree() {
    if (!this.initialized || !this.svgRef) return;
    const nodes = this.getActiveNodes();
    this.g.selectAll('*').remove();

    if (nodes.length === 0) {
      this.nodeCount = 0;
      return;
    }

    const wrap = this.wrapRef.nativeElement;
    const W = wrap.clientWidth || 350;
    const H = wrap.clientHeight || 500;

    // Build hierarchy from flat array
    let root: d3.HierarchyNode<TreeNode>;
    try {
      root = d3.stratify<TreeNode>()
        .id(d => String(d.id))
        .parentId(d => d.parent_id !== null ? String(d.parent_id) : null)
        (nodes);
    } catch {
      return; // malformed tree
    }

    const treeLayout = d3.tree<TreeNode>().size([W - 40, H - 60]);
    const hierarchy = treeLayout(root);

    // Links
    this.g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#272b3a')
      .attr('stroke-width', 1.2)
      .selectAll('path')
      .data(hierarchy.links())
      .join('path')
      .attr('d', d3.linkVertical<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.x + 20)
        .y(d => d.y + 30) as any
      );

    // Nodes
    const nodeG = this.g.append('g')
      .selectAll('g')
      .data(hierarchy.descendants())
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x + 20},${d.y + 30})`)
      .style('cursor', 'pointer')
      .on('mouseover', (event: MouseEvent, d: any) => {
        this.tooltipData = d.data;
        this.tooltipVisible = true;
        const tt = this.tooltipRef.nativeElement;
        tt.style.left = (event.clientX + 12) + 'px';
        tt.style.top = (event.clientY - 10) + 'px';
      })
      .on('mousemove', (event: MouseEvent) => {
        const tt = this.tooltipRef.nativeElement;
        tt.style.left = (event.clientX + 12) + 'px';
        tt.style.top = (event.clientY - 10) + 'px';
      })
      .on('mouseout', () => {
        this.tooltipVisible = false;
        this.tooltipData = null;
      });

    // Shapes per node type
    nodeG.each(function(d: any) {
      const sel = d3.select(this);
      const type: NodeType = d.data.node_type;
      const color = NODE_COLORS[type] ?? '#8b90a0';

      if (type === 'ROOT') {
        sel.append('rect')
          .attr('x', -8).attr('y', -8).attr('width', 16).attr('height', 16)
          .attr('rx', 2)
          .attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 1.5);
      } else if (type === 'ASTAR' || type === 'ASTAR_RANK') {
        sel.append('polygon')
          .attr('points', '0,-8 7,4 -7,4')
          .attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 1);
      } else if (type === 'PRUNED') {
        sel.append('line').attr('x1', -5).attr('y1', -5).attr('x2', 5).attr('y2', 5)
          .attr('stroke', color).attr('stroke-width', 2.5);
        sel.append('line').attr('x1', 5).attr('y1', -5).attr('x2', -5).attr('y2', 5)
          .attr('stroke', color).attr('stroke-width', 2.5);
      } else if (type === 'MINIMAX_PHASE' || type === 'ASTAR_PHASE') {
        sel.append('rect')
          .attr('x', -9).attr('y', -5).attr('width', 18).attr('height', 10)
          .attr('rx', 3)
          .attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 1);
      } else {
        // Circle for MAX, MIN, RANDOM, etc.
        const r = type === 'MAX' || type === 'MIN' ? 7 : 5;
        sel.append('circle')
          .attr('r', r)
          .attr('fill', color)
          .attr('stroke', d.data.value !== null ? '#fff' : 'transparent')
          .attr('stroke-width', 1);
      }
    });

    // Labels on large nodes
    nodeG
      .filter((d: any) => ['ROOT','ASTAR_PHASE','MINIMAX_PHASE'].includes(d.data.node_type))
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', 12)
      .attr('font-size', 8)
      .attr('font-family', 'Space Mono')
      .attr('fill', '#8b90a0')
      .text((d: any) => d.data.move?.slice(0, 16) ?? '');

    // Center view
    this.svg.call(
      (d3.zoom() as any).transform,
      d3.zoomIdentity.translate(20, 20)
    );
  }
}
