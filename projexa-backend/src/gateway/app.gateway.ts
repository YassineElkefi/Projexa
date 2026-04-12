import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL, credentials: true } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
      const user = await this.usersService.findById(payload.sub);
      if (!user) return client.disconnect();

      client.data.user = user;
      this.connectedUsers.set(user.id, client.id);
      client.join(`user:${user.id}`);
      console.log(`User ${user.email} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.connectedUsers.delete(client.data.user.id);
      console.log(`User ${client.data.user.email} disconnected`);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: { room: string; content: string }, @ConnectedSocket() client: Socket) {
    this.server.to(data.room).emit('message', {
      from: client.data.user?.email,
      content: data.content,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    return { joined: room };
  }

  // Send notification to a specific user
  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}