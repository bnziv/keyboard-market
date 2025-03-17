import { useEffect, useState, useRef } from 'react';
import { websocketService } from '../services/websocketService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { X } from 'lucide-react';
import axios from 'axios';
import API_URL from '@/utils/config';

interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp?: string;
  read?: boolean;
}

interface ChatProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
  position?: { x: number; y: number };
}

const CHAT_WIDTH = 400;
const CHAT_HEIGHT = 600;
const SCREEN_MARGIN = 20;

export function Chat({ currentUserId, otherUserId, otherUserName, onClose, position }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowPosition, setWindowPosition] = useState(position || { x: 20, y: 20 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.chat-header')) {
      setIsDragging(true);
      document.body.classList.add('no-select');
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.min(
        Math.max(e.clientX - dragOffset.x, SCREEN_MARGIN),
        window.innerWidth - CHAT_WIDTH - SCREEN_MARGIN
      );
      const newY = Math.min(
        Math.max(e.clientY - dragOffset.y, SCREEN_MARGIN),
        window.innerHeight - CHAT_HEIGHT - SCREEN_MARGIN
      );
      
      setWindowPosition({
        x: newX,
        y: newY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove('no-select');
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    // Load chat history
    const loadChatHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/history`, {
          params: {
            userId1: currentUserId,
            userId2: otherUserId
          }
        });
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();

    // Connect to WebSocket
    websocketService.connect(currentUserId);

    // Subscribe to new messages
    const unsubscribe = websocketService.onMessage((message) => {
      // Only add messages that are part of this conversation
      if ((message.senderId === currentUserId && message.receiverId === otherUserId) ||
          (message.senderId === otherUserId && message.receiverId === currentUserId)) {
        setMessages((prevMessages) => {
          // Check if message already exists to prevent duplicates
          const messageExists = prevMessages.some(
            m => m.id === message.id || 
            (m.content === message.content && 
             m.senderId === message.senderId && 
             m.timestamp === message.timestamp)
          );
          if (messageExists) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
        scrollToBottom();
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, [currentUserId, otherUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      senderId: currentUserId,
      receiverId: otherUserId,
      content: newMessage.trim(),
    };

    websocketService.sendMessage(message);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, newMessage]);

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - CHAT_WIDTH - SCREEN_MARGIN),
        y: Math.min(prev.y, window.innerHeight - CHAT_HEIGHT - SCREEN_MARGIN)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <style>
        {`
        .no-select {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        `}
      </style>
      <Card 
        className="fixed flex flex-col h-[600px] w-[400px] shadow-lg z-50"
        style={{
          left: `${windowPosition.x}px`,
          top: `${windowPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="chat-header flex items-center justify-between p-4 border-b cursor-grab">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${otherUserName}&backgroundType=gradientLinear`} />
                <AvatarFallback>{otherUserName[0]}</AvatarFallback>
            </Avatar>
            <span className="ml-3 font-medium">{otherUserName}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              <span>No messages yet. Start the conversation!</span>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || `${message.senderId}-${message.timestamp}-${index}`}
                className={`flex ${
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  {message.timestamp && (
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </Card>
    </>
  );
}
