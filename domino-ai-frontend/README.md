# Dominó AI — Frontend Angular

Frontend SPA para visualizar partidas de dominó con agentes de IA en tiempo real.

## Stack
- **Angular 17+** (standalone components + signals)
- **Chart.js 4** — gráficas de métricas en tiempo real y post-partida
- **D3.js 7** — visualización del árbol de búsqueda
- **RxJS 7** — streams SSE como Observables
- **SCSS** — dark theme con CSS variables

## Estructura del proyecto

```
src/app/
├── core/
│   ├── models/api.models.ts          # Interfaces TypeScript ↔ API
│   └── services/
│       ├── api.service.ts            # Wrapper HttpClient REST
│       ├── sse.service.ts            # EventSource → Observable
│       └── game-state.service.ts     # BehaviorSubject estado global
├── features/
│   ├── home/                         # Landing page + modo selector
│   ├── game/
│   │   ├── new-game/                 # Formulario crear partida
│   │   ├── game-view/                # Vista principal (tablero + métricas + árbol)
│   │   ├── board/                    # Renderizado de fichas orientadas
│   │   ├── metrics-realtime/         # 4 gráficas Chart.js vía SSE
│   │   ├── tree-visualizer/          # D3.js árbol de búsqueda
│   │   ├── human-hand/               # Modo humano: selección interactiva
│   │   └── game-summary/             # 4 gráficas post-partida + radar
│   ├── benchmark/                    # Torneo SSE + win rate chart
│   └── strategies/                   # Documentación de algoritmos
└── app.routes.ts                     # Rutas lazy-loaded
```

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el backend (en otra terminal)
cd domino_agent
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Iniciar el frontend
npm start
# → http://localhost:4200
```

## Variables de entorno

Edita `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'   // URL del backend
};
```

## Rutas

| Ruta | Componente |
|------|-----------|
| `/` | HomeComponent — landing, selector de modo |
| `/game/new` | NewGameComponent — configurar partida |
| `/game/:id` | GameViewComponent — tablero + SSE + árbol |
| `/game/:id/summary` | GameSummaryComponent — análisis post-partida |
| `/benchmark` | BenchmarkComponent — torneo + win rates |
| `/strategies` | StrategiesComponent — documentación de algoritmos |

## Conexión con la API

### SSE (tiempo real)
```ts
// GameViewComponent usa SseService
this.sse.streamGame(sessionId, delayMs).subscribe(event => {
  // event.type === 'turn' | 'game_over'
  this.updateBoard(event);
  this.updateMetrics(event);
  this.fetchTree(); // GET /api/game/:id/tree
});
```

### Cleanup de subscripciones
Todos los componentes con SSE usan `takeUntil(this.destroy$)` y llaman a
`destroy$.next()` en `ngOnDestroy()`.

## Características implementadas

- ✅ Tablero con fichas orientadas, animación de última jugada, color por valor de pip
- ✅ 4 gráficas en tiempo real (tiempo, nodos, evals, profundidad) con ventana deslizante de 50 turnos
- ✅ Árbol de búsqueda D3.js con zoom/pan, formas por tipo de nodo, tooltips
- ✅ 4 gráficas post-partida (costos, acumulados, radar)
- ✅ Modo Humano vs IA con fichas interactivas, highlight de jugadas válidas
- ✅ Benchmark con SSE — gráfica de win rate actualizada por matchup
- ✅ Control de velocidad (0–2000ms) con reconexión automática del SSE
- ✅ Indicador de árbol truncado cuando supera 400 nodos
- ✅ Log de turnos en tiempo real
