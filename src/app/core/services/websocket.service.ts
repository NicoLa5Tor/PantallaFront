import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface WebsocketMessage {
  topic: string;
  payload: unknown;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: WebSocket | null = null;
  private statusSubject = new BehaviorSubject<'idle' | 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting'>('idle');
  private messagesSubject = new Subject<WebsocketMessage>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private manualClose = false;
  private lastTopic = '';
  private lastUrl = environment.websocketUrl;

  readonly status$ = this.statusSubject.asObservable();
  readonly messages$ = this.messagesSubject.asObservable();

  connect(topic: string, url: string = environment.websocketUrl): void {
    this.lastTopic = topic;
    this.lastUrl = url;
    this.manualClose = false;
    this.clearReconnectTimer();
    this.openSocket();
  }

  private openSocket(): void {
    this.disconnect(true);
    this.statusSubject.next('connecting');

    this.socket = new WebSocket(this.lastUrl);

    this.socket.onopen = () => {
      this.statusSubject.next('open');
      this.reconnectAttempt = 0;
      this.socket?.send(JSON.stringify({ action: 'subscribe', topic: this.lastTopic }));
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebsocketMessage;
        this.messagesSubject.next(data);
      } catch {
      this.messagesSubject.next({ topic: this.lastTopic, payload: event.data });
      }
    };

    this.socket.onerror = () => {
      this.statusSubject.next('error');
      this.scheduleReconnect();
    };

    this.socket.onclose = () => {
      this.statusSubject.next('closed');
      this.scheduleReconnect();
    };
  }

  disconnect(silent = false): void {
    if (!silent) {
      this.manualClose = true;
      this.clearReconnectTimer();
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      if (!silent) {
        this.statusSubject.next('closed');
      }
    }
  }

  getMessages(): Observable<WebsocketMessage> {
    return this.messages$;
  }

  private scheduleReconnect(): void {
    if (this.manualClose) {
      return;
    }
    this.clearReconnectTimer();
    this.reconnectAttempt += 1;
    const baseDelay = Math.min(1000 * 2 ** (this.reconnectAttempt - 1), 30000);
    const jitter = Math.floor(Math.random() * 500);
    const delay = baseDelay + jitter;

    this.statusSubject.next('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      if (!this.manualClose) {
        this.openSocket();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
