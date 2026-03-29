import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameSnapshot, TurnEvent } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private _snapshot$ = new BehaviorSubject<GameSnapshot | null>(null);
  private _lastTurnEvent$ = new BehaviorSubject<TurnEvent | null>(null);
  private _isStreaming$ = new BehaviorSubject<boolean>(false);
  private _error$ = new BehaviorSubject<string | null>(null);

  readonly snapshot$ = this._snapshot$.asObservable();
  readonly lastTurnEvent$ = this._lastTurnEvent$.asObservable();
  readonly isStreaming$ = this._isStreaming$.asObservable();
  readonly error$ = this._error$.asObservable();

  setSnapshot(snap: GameSnapshot) { this._snapshot$.next(snap); }
  setTurnEvent(event: TurnEvent) { this._lastTurnEvent$.next(event); }
  setStreaming(val: boolean) { this._isStreaming$.next(val); }
  setError(err: string | null) { this._error$.next(err); }

  get snapshot() { return this._snapshot$.value; }
  get isStreaming() { return this._isStreaming$.value; }

  reset() {
    this._snapshot$.next(null);
    this._lastTurnEvent$.next(null);
    this._isStreaming$.next(false);
    this._error$.next(null);
  }
}
