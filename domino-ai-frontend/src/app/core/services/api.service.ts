import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BenchmarkEvent,
  GameSnapshot,
  HumanMove,
  MatchupConfig,
  NewGameRequest,
  NewGameResponse,
  RealtimeMetricsResponse,
  StrategyInfo,
  SummaryMetricsResponse,
  TreePayload,
  TurnEvent
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getStrategies(): Observable<{ strategies: StrategyInfo[] }> {
    return this.http.get<{ strategies: StrategyInfo[] }>(`${this.baseUrl}/api/metrics/strategies`);
  }

  createGame(payload: NewGameRequest): Observable<NewGameResponse> {
    return this.http.post<NewGameResponse>(`${this.baseUrl}/api/game/new`, payload);
  }

  getGame(sessionId: string): Observable<GameSnapshot> {
    return this.http.get<GameSnapshot>(`${this.baseUrl}/api/game/${sessionId}`);
  }

  stepGame(sessionId: string): Observable<TurnEvent> {
    return this.http.post<TurnEvent>(`${this.baseUrl}/api/game/${sessionId}/step`, {});
  }

  humanMove(sessionId: string, payload: HumanMove): Observable<TurnEvent> {
    return this.http.post<TurnEvent>(`${this.baseUrl}/api/game/${sessionId}/human-move`, payload);
  }

  humanPass(sessionId: string): Observable<TurnEvent> {
    return this.http.post<TurnEvent>(`${this.baseUrl}/api/game/${sessionId}/human-pass`, {});
  }

  getRealtimeMetrics(sessionId: string): Observable<RealtimeMetricsResponse> {
    return this.http.get<RealtimeMetricsResponse>(`${this.baseUrl}/api/metrics/game/${sessionId}/realtime`);
  }

  getSummaryMetrics(sessionId: string): Observable<SummaryMetricsResponse> {
    return this.http.get<SummaryMetricsResponse>(`${this.baseUrl}/api/metrics/game/${sessionId}/summary`);
  }

  getSearchTree(sessionId: string): Observable<TreePayload> {
    return this.http.get<TreePayload>(`${this.baseUrl}/api/game/${sessionId}/tree`);
  }

  getMatchups(): Observable<{ matchups: MatchupConfig[] }> {
    return this.http.get<{ matchups: MatchupConfig[] }>(`${this.baseUrl}/api/benchmark/matchups`);
  }

  runBenchmarkStream(nGames: number, matchups: MatchupConfig[]): Observable<BenchmarkEvent> {
    return new Observable<BenchmarkEvent>(subscriber => {
      const controller = new AbortController();

      const parseStream = async (): Promise<void> => {
        try {
          const response = await fetch(`${this.baseUrl}/api/benchmark/run`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream'
            },
            body: JSON.stringify({ n_games: nGames, matchups }),
            signal: controller.signal
          });

          if (!response.ok || !response.body) {
            throw new Error(`Error al iniciar benchmark: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const chunk = await reader.read();
            if (chunk.done) {
              break;
            }

            buffer += decoder.decode(chunk.value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() ?? '';

            for (const block of blocks) {
              const dataLine = block
                .split('\n')
                .find(line => line.startsWith('data:'));

              if (!dataLine) {
                continue;
              }

              const rawData = dataLine.replace(/^data:\s*/, '');
              try {
                subscriber.next(JSON.parse(rawData) as BenchmarkEvent);
              } catch {
                // Ignore malformed event blocks and continue parsing stream.
              }
            }
          }

          subscriber.complete();
        } catch (error) {
          if (!controller.signal.aborted) {
            subscriber.error(error);
          }
        }
      };

      void parseStream();

      return () => {
        controller.abort();
      };
    });
  }
}
