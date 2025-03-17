import SockJS from 'sockjs-client';
import { Client, Message, Frame } from '@stomp/stompjs';

interface ChatMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp?: string;
  read?: boolean;
}

class WebSocketService {
  private client: Client | null = null;
  private messageHandlers: Set<(message: ChatMessage) => void> = new Set();

  connect(userId: string) {
    if (this.client?.active) {
      return;
    }

    const socket = new SockJS('http://localhost:8080/ws');
    this.client = new Client({
      webSocketFactory: () => socket,
      debug: (str: string) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      // console.log('Connected to WebSocket');
      this.subscribeToPersonalMessages(userId);
    };

    this.client.onStompError = (frame: Frame) => {
      console.error('STOMP error', frame);
    };

    this.client.activate();
  }

  private subscribeToPersonalMessages(userId: string) {
    if (!this.client) return;

    this.client.subscribe(`/user/${userId}/topic/messages`, (message: Message) => {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      // console.log('Received message:', chatMessage);
      this.notifyHandlers(chatMessage);
    });
  }

  private notifyHandlers(message: ChatMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  sendMessage(message: ChatMessage) {
    if (!this.client) return;

    // Add timestamp to the message
    const messageWithTimestamp = {
      ...message,
      timestamp: new Date().toISOString()
    };

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(messageWithTimestamp),
    });

    // We'll let the server send the message back to us
    // This ensures consistency and proper ID assignment
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.messageHandlers.clear();
    }
  }
}

export const websocketService = new WebSocketService();
