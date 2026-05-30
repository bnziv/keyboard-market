import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()) : ['http://localhost:5173'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie ?? '';
    const match = cookieHeader.match(/(?:^|;\s*)jwt=([^;]+)/);
    const token = match?.[1];

    if (!token) {
      client.disconnect();
      return;
    }

    let payload: { sub: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(token);
    } catch {
      client.disconnect();
      return;
    }

    const userId = client.handshake.query.userId as string;
    if (!userId || userId !== payload.sub) {
      client.disconnect();
      return;
    }

    client.join(userId);
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('chat.send')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
    const userId = (client.handshake.query.userId as string);
    if (dto.senderId !== userId) return;
    const saved = await this.chatService.saveMessage(dto);
    this.server.to(dto.senderId).emit('chat.message', saved);
    this.server.to(dto.receiverId).emit('chat.message', saved);
  }
}
