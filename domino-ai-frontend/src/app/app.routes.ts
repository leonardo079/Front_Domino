import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'game/new',
    loadComponent: () =>
      import('./features/game/new-game/new-game.component').then(m => m.NewGameComponent)
  },
  {
    path: 'game/:id',
    loadComponent: () =>
      import('./features/game/game-view/game-view.component').then(m => m.GameViewComponent)
  },
  {
    path: 'game/:id/summary',
    loadComponent: () =>
      import('./features/game/game-summary/game-summary.component').then(m => m.GameSummaryComponent)
  },
  {
    path: 'benchmark',
    loadComponent: () =>
      import('./features/benchmark/benchmark.component').then(m => m.BenchmarkComponent)
  },
  {
    path: 'strategies',
    loadComponent: () =>
      import('./features/strategies/strategies.component').then(m => m.StrategiesComponent)
  },
  { path: '**', redirectTo: '' }
];
