import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationMessage {
  id: number;
  text: string;
  type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  private readonly _message$ = new BehaviorSubject<NotificationMessage | null>(null);
  readonly message$ = this._message$.asObservable();

  show(text: string, type: NotificationType = 'info'): void {
    this._message$.next({ id: ++this.nextId, text, type });
    setTimeout(() => this.clear(), 4000);
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  error(text: string): void {
    this.show(text, 'error');
  }

  info(text: string): void {
    this.show(text, 'info');
  }

  clear(): void {
    this._message$.next(null);
  }
}
