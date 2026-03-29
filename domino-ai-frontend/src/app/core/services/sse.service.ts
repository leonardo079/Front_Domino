import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TurnEvent, BenchmarkEvent } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SseService {
  private readonly base = environment.apiUrl;

  streamGame(sessionId: string, delayMs = 300): Observable<TurnEvent> {
    return new Observable(observer => {
      const url = `${this.base}/api/game/${sessionId}/stream?delay_ms=${delayMs}`;
      const es = new EventSource(url);

      es.onmessage = (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data) as TurnEvent;
          observer.next(event);
          if (event.is_terminal || event.type === 'game_over') {
            observer.complete();
            es.close();
          }
        } catch (err) {
          observer.error(err);
          es.close();
        }
      };

      es.onerror = (e) => {
        observer.error(e);
        es.close();
      };

      return () => es.close();
    });
  }

  streamBenchmark(nGames: number, matchups?: any[]): Observable<BenchmarkEvent> {
    return new Observable(observer => {
      const url = `${this.base}/api/benchmark/run`;
      const body = JSON.stringify({ n_games: nGames, matchups: matchups ?? null });

      // Use fetch for POST SSE (EventSource only supports GET)
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      }).then(response => {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const pump = (): void => {
          reader.read().then(({ done, value }) => {
            if (done) { observer.complete(); return; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.slice(6)) as BenchmarkEvent;
                  observer.next(event);
                  if (event.type === 'benchmark_done') observer.complete();
                } catch {}
              }
            }
            pump();
          }).catch(err => observer.error(err));
        };

        pump();
      }).catch(err => observer.error(err));
    });
  }
}
