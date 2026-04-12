import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;

  constructor(private authService: AuthService) {}

  connect(): void {
    this.socket = io(environment.apiUrl, {
      auth: { token: this.authService.getAccessToken() },
      transports: ['websocket'],
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
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
}