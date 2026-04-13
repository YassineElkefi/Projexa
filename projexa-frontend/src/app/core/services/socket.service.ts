import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket!: Socket;
  private connected = false;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.connected && this.socket?.connected) return;

    this.socket = io(environment.apiUrl, {
      auth: { token: this.authService.getAccessToken() },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => (this.connected = true));
    this.socket.on('disconnect', () => (this.connected = false));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.connected = false;
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  on<T>(event: string): Observable<T> {
    return new Observable(observer => {
      this.socket?.on(event, (data: T) => observer.next(data));
      return () => this.socket?.off(event);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}