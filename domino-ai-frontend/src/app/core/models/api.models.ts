// ── Per-turn metrics ──────────────────────────────────────────────────────────
export interface TurnMetrics {
  strategy: string;
  turn: number;
  time_ms: number;
  nodes_expanded: number;
  eval_calls: number;
  max_depth: number;
  move_chosen: string;
}

// ── SSE Turn Event ─────────────────────────────────────────────────────────────
export interface TurnEvent {
  type: 'turn' | 'game_over' | 'error';
  turn: number;
  player: 0 | 1;
  strategy: string;
  move: string;
  drew_from_pool: boolean;
  board_length: number;
  hand_size_a: number;
  hand_size_b: number;
  pool_size: number;
  left_end: number | null;
  right_end: number | null;
  board_str: string;
  metrics: TurnMetrics | null;
  is_terminal: boolean;
}

export interface GameOverEvent {
  type: 'game_over';
  winner: 0 | 1 | -1 | null;
  winner_name: string;
  total_turns: number;
  pip_sum_a: number;
  pip_sum_b: number;
  summary_a: StrategySummary;
  summary_b: StrategySummary;
}

// ── Board tile ────────────────────────────────────────────────────────────────
export interface BoardTile {
  left: number;
  right: number;
}

// ── Game Snapshot ─────────────────────────────────────────────────────────────
export interface HumanMove {
  tile: { a: number; b: number };
  side: 'left' | 'right';
}

export interface GameSnapshot {
  session_id: string;
  strategy_a: string;
  strategy_b: string;
  game_mode: string;
  status: 'active' | 'waiting_human' | 'finished';
  turn: number;
  winner: 0 | 1 | -1 | null;
  board: BoardTile[];
  board_str: string;
  left_end: number | null;
  right_end: number | null;
  hand_size_a: number;
  hand_size_b: number;
  pool_size: number;
  current_player: 0 | 1;
  pass_count: number;
  is_terminal: boolean;
  pip_sum_a: number;
  pip_sum_b: number;
  human_hand?: Array<{ a: number; b: number; pips: number }>;
  human_valid_moves?: HumanMove[];
}

// ── Tree Visualization ────────────────────────────────────────────────────────
export type NodeType =
  | 'ROOT' | 'MAX' | 'MIN' | 'PRUNED'
  | 'ASTAR' | 'ASTAR_PHASE' | 'ASTAR_RANK' | 'MINIMAX_PHASE' | 'RANDOM';

export interface TreeNode {
  id: number;
  parent_id: number | null;
  depth: number;
  node_type: NodeType;
  move: string;
  alpha: number | null;
  beta: number | null;
  value: number | null;
  pruned: boolean;
}

export interface TreeData {
  total_nodes: number;
  truncated: boolean;
  nodes: TreeNode[];
}

export interface TreeResponse {
  session_id: string;
  strategy_a: string;
  strategy_b: string;
  game_mode: string;
  turn: number;
  tree_a: TreeData | null;
  tree_b: TreeData | null;
}

// ── Strategy ──────────────────────────────────────────────────────────────────
export interface StrategyDescription {
  name: string;
  description: string;
}

export interface StrategySummary {
  strategy: string;
  turns: number;
  avg_time_ms: number;
  max_time_ms: number;
  total_time_ms: number;
  avg_nodes: number;
  total_nodes: number;
  avg_evals: number;
  total_evals: number;
  avg_depth: number;
  max_depth_ever: number;
}

// ── Benchmark ─────────────────────────────────────────────────────────────────
export interface MatchupConfig {
  tag: string;
  agent_a: string;
  agent_b: string;
  label: string;
}

export interface MatchupResult {
  tag: string;
  label: string;
  agent_a: string;
  agent_b: string;
  n_games: number;
  wins_a: number;
  wins_b: number;
  draws: number;
  win_rate_a: number;
  win_rate_b: number;
  avg_turns: number;
  turns_per_game: number[];
  score_advantage_per_game: number[];
  metrics_a: StrategySummary;
  metrics_b: StrategySummary;
}

export interface BenchmarkStartEvent {
  type: 'start';
  run_id: string;
  n_matchups: number;
  n_games: number;
}

export interface BenchmarkMatchupStartEvent {
  type: 'matchup_start';
  index: number;
  tag: string;
  label: string;
}

export interface BenchmarkMatchupDoneEvent extends MatchupResult {
  type: 'matchup_done';
  index: number;
}

export interface BenchmarkDoneEvent {
  type: 'benchmark_done';
  run_id: string;
  total_time_s: number;
  results: MatchupResult[];
}

export type BenchmarkEvent =
  | BenchmarkStartEvent
  | BenchmarkMatchupStartEvent
  | BenchmarkMatchupDoneEvent
  | BenchmarkDoneEvent;

// ── Metrics chart data ────────────────────────────────────────────────────────
export interface SeriesPoint {
  turn: number;
  value: number;
}

export interface ChartSeriesData {
  description: string;
  chart_type: string;
  update?: string;
  series_a?: SeriesPoint[];
  series_b?: SeriesPoint[];
  series?: SeriesPoint[];
}

export interface RealtimeCharts {
  time_ms: ChartSeriesData;
  nodes_expanded: ChartSeriesData;
  eval_calls: ChartSeriesData;
  max_depth: ChartSeriesData;
}

export interface GameProgressCharts {
  hand_sizes: ChartSeriesData;
  board_length: ChartSeriesData;
  pool_size: ChartSeriesData;
}

export interface RealtimeMetricsResponse {
  session_id: string;
  strategy_a: string;
  strategy_b: string;
  current_turn: number;
  status: string;
  realtime_charts: RealtimeCharts;
  game_progress_charts: GameProgressCharts;
}

// ── New Game Request ──────────────────────────────────────────────────────────
export type StrategyName = 'random' | 'manhattan' | 'euclidean' | 'astar' | 'hybrid';
export type GameMode = 'agent_vs_agent' | 'agent_vs_human';

export interface NewGameRequest {
  strategy_a: StrategyName;
  strategy_b?: StrategyName;
  game_mode: GameMode;
}

export interface NewGameResponse {
  session_id: string;
  game_mode: string;
  strategy_a: string;
  strategy_b: string;
  status: string;
  initial_state: GameSnapshot;
}
