import { io, Socket } from 'socket.io-client';
import API_URL from '@/utils/config';

interface ChatMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp?: string;
  read?: boolean;
}

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: Set<(message: ChatMessage) => void> = new Set();

  connect(userId: string) {
    if (this.socket?.connected) return;

    this.socket = io(API_URL || '', {
      query: { userId },
      withCredentials: true,
      reconnectionDelay: 5000,
    });

    this.socket.on('chat.message', (message: ChatMessage) => {
      this.notifyHandlers(message);
    });
  }

  private notifyHandlers(message: ChatMessage) {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  sendMessage(message: ChatMessage) {
    if (!this.socket) return;
    this.socket.emit('chat.send', message);
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.messageHandlers.clear();
    }
  }
}

export const websocketService = new WebSocketService();
