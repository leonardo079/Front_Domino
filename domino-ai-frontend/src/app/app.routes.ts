import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'game/agent-vs-agent',
    loadComponent: () =>
      import('./features/game/agent-vs-agent/agent-vs-agent.component').then(m => m.AgentVsAgentComponent)
  },
  {
    path: 'game/agent-vs-human',
    loadComponent: () =>
      import('./features/game/agent-vs-human/agent-vs-human.component').then(m => m.AgentVsHumanComponent)
  },
  {
    path: 'game/:id/summary',
    loadComponent: () =>
      import('./features/metrics-summary/metrics-summary.component').then(m => m.MetricsSummaryComponent)
  },
  {
    path: 'benchmark',
    loadComponent: () =>
      import('./features/benchmark/benchmark.component').then(m => m.BenchmarkComponent)
  },
  { path: '**', redirectTo: '' }
];
