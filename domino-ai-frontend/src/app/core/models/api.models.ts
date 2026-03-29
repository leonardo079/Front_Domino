export type StrategyName = 'random' | 'manhattan' | 'euclidean' | 'astar' | 'hybrid';
export type GameMode = 'agent_vs_agent' | 'agent_vs_human';

export interface Tile {
  a: number;
  b: number;
}

export interface OrientedTile {
  left: number;
  right: number;
}

export interface TurnMetrics {
  strategy: string;
  turn: number;
  time_ms: number;
  nodes_expanded: number;
  eval_calls: number;
  max_depth: number;
  move_chosen: string;
}

export interface TurnEvent {
  type: 'turn' | 'game_over' | 'error';
  turn: number;
  player: number;
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

export interface GameSummaryEvent {
  type: 'game_over';
  winner: number | null;
  winner_name: string;
  total_turns: number;
  pip_sum_a: number;
  pip_sum_b: number;
  summary_a: Record<string, number | string>;
  summary_b: Record<string, number | string>;
}

export interface HumanMove {
  tile_a: number;
  tile_b: number;
  side: 'left' | 'right';
}

export interface HumanPlayableMove {
  tile: Tile;
  side: 'left' | 'right';
}

export interface HumanTile {
  a: number;
  b: number;
  pips: number;
}

export interface GameSnapshot {
  session_id: string;
  strategy_a: string;
  strategy_b: string;
  game_mode: GameMode;
  status: 'active' | 'waiting_human' | 'finished';
  turn: number;
  winner: number | null;
  board: OrientedTile[];
  board_str: string;
  left_end: number | null;
  right_end: number | null;
  hand_size_a: number;
  hand_size_b: number;
  pool_size: number;
  current_player: number;
  pass_count: number;
  is_terminal: boolean;
  pip_sum_a: number;
  pip_sum_b: number;
  human_hand?: HumanTile[];
  human_valid_moves?: HumanPlayableMove[];
}

export interface NewGameRequest {
  strategy_a: StrategyName;
  strategy_b?: StrategyName;
  game_mode: GameMode;
}

export interface NewGameResponse {
  session_id: string;
  game_mode: GameMode;
  strategy_a: string;
  strategy_b: string;
  status: string;
  initial_state: GameSnapshot;
}

export interface StrategyInfo {
  name: StrategyName;
  description: string;
}

export interface MetricPoint {
  turn: number;
  value: number;
}

export interface RealtimeMetricsResponse {
  session_id: string;
  strategy_a: string;
  strategy_b: string;
  current_turn: number;
  status: string;
  realtime_charts: Record<string, {
    description: string;
    chart_type: string;
    update: string;
    series_a: MetricPoint[];
    series_b: MetricPoint[];
  }>;
  game_progress_charts: Record<string, {
    description: string;
    chart_type: string;
    update: string;
    series_a?: MetricPoint[];
    series_b?: MetricPoint[];
    series?: MetricPoint[];
  }>;
}

export interface SummaryMetricsResponse {
  session_id: string;
  strategy_a: string;
  strategy_b: string;
  status: string;
  winner: number | null;
  total_turns: number;
  pip_sum_a: number;
  pip_sum_b: number;
  endgame_charts: Record<string, unknown>;
}

export interface TreeNode {
  id: number;
  parent_id: number | null;
  depth: number;
  node_type: string;
  move: string | null;
  alpha: number | null;
  beta: number | null;
  value: number | null;
  pruned: boolean;
}

export interface TreePayload {
  session_id: string;
  strategy_a: string;
  strategy_b: string;
  game_mode: string;
  turn: number;
  tree_a: { nodes: TreeNode[] } | null;
  tree_b: { nodes: TreeNode[] } | null;
}

export interface MatchupConfig {
  tag: string;
  label: string;
  agent_a: StrategyName;
  agent_b: StrategyName;
}

export interface BenchmarkStartEvent {
  type: 'start';
  run_id: string;
  n_matchups: number;
  n_games: number;
}

export interface BenchmarkMatchupDone {
  type: 'matchup_done';
  index: number;
  tag: string;
  label: string;
  agent_a: StrategyName;
  agent_b: StrategyName;
  n_games: number;
  wins_a: number;
  wins_b: number;
  draws: number;
  win_rate_a: number;
  win_rate_b: number;
  avg_turns: number;
  turns_per_game: number[];
  score_advantage_per_game: number[];
  metrics_a: Record<string, number | string>;
  metrics_b: Record<string, number | string>;
}

export interface BenchmarkDoneEvent {
  type: 'benchmark_done';
  run_id: string;
  total_time_s: number;
  results: BenchmarkMatchupDone[];
}

export type BenchmarkEvent =
  | BenchmarkStartEvent
  | BenchmarkMatchupDone
  | BenchmarkDoneEvent
  | { type: 'matchup_start'; index: number; tag: string; label: string };
