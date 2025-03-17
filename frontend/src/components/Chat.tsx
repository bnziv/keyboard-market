import { useEffect, useState, useRef } from 'react';
import { websocketService } from '../services/websocketService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Avatar } from './ui/avatar';
import axios from 'axios';

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
}

export function Chat({ currentUserId, otherUserId, otherUserName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load chat history
    const loadChatHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/chat/history`, {
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

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-2xl mx-auto">
      <div className="flex items-center p-4 border-b">
        <Avatar className="h-10 w-10">
          <div className="rounded-full bg-muted h-full w-full flex items-center justify-center">
            {otherUserName[0].toUpperCase()}
          </div>
        </Avatar>
        <span className="ml-3 font-medium">{otherUserName}</span>
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
  );
}
