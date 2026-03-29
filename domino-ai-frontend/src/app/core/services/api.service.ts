import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NewGameRequest, NewGameResponse, GameSnapshot,
  RealtimeMetricsResponse, TreeResponse, StrategyDescription,
  MatchupConfig
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Game endpoints ───────────────────────────────────────────────────────
  createGame(req: NewGameRequest): Observable<NewGameResponse> {
    return this.http.post<NewGameResponse>(`${this.base}/api/game/new`, req);
  }

  getGame(sessionId: string): Observable<GameSnapshot> {
    return this.http.get<GameSnapshot>(`${this.base}/api/game/${sessionId}`);
  }

  stepGame(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/api/game/${sessionId}/step`, {});
  }

  humanMove(sessionId: string, tile_a: number, tile_b: number, side: string): Observable<any> {
    return this.http.post<any>(`${this.base}/api/game/${sessionId}/human-move`, { tile_a, tile_b, side });
  }

  humanPass(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/api/game/${sessionId}/human-pass`, {});
  }

  getHistory(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/api/game/${sessionId}/history`);
  }

  deleteGame(sessionId: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/api/game/${sessionId}`);
  }

  // ── Tree endpoint ────────────────────────────────────────────────────────
  getTree(sessionId: string): Observable<TreeResponse> {
    return this.http.get<TreeResponse>(`${this.base}/api/game/${sessionId}/tree`);
  }

  // ── Metrics endpoints ────────────────────────────────────────────────────
  getRealtimeMetrics(sessionId: string): Observable<RealtimeMetricsResponse> {
    return this.http.get<RealtimeMetricsResponse>(`${this.base}/api/metrics/game/${sessionId}/realtime`);
  }

  getEndgameSummary(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/api/metrics/game/${sessionId}/summary`);
  }

  getStrategies(): Observable<{ strategies: StrategyDescription[] }> {
    return this.http.get<{ strategies: StrategyDescription[] }>(`${this.base}/api/metrics/strategies`);
  }

  // ── Benchmark endpoints ──────────────────────────────────────────────────
  getDefaultMatchups(): Observable<{ matchups: MatchupConfig[] }> {
    return this.http.get<{ matchups: MatchupConfig[] }>(`${this.base}/api/benchmark/matchups`);
  }
}
