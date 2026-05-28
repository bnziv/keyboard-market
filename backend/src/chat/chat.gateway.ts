import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(userId);
    }
  }

  @SubscribeMessage('chat.send')
  async handleMessage(@MessageBody() dto: SendMessageDto) {
    const saved = await this.chatService.saveMessage(dto);
    this.server.to(dto.senderId).emit('chat.message', saved);
    this.server.to(dto.receiverId).emit('chat.message', saved);
  }
}
