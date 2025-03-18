import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';
import API_URL from '@/utils/config';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Conversation {
  userId: string;
  username: string;
  lastMessage?: string;
  timestamp?: string;
}

interface ConversationsListProps {
  currentUserId: string;
  onSelectConversation: (userId: string, username: string) => void;
  onClose: () => void;
}

export function ConversationsList({ currentUserId, onSelectConversation, onClose }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/conversations/${currentUserId}`);
        setConversations(response.data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUserId]);

  return (
    <>
        <Card className="fixed flex flex-col h-[600px] w-[300px] shadow-lg z-50 right-5 bottom-5">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">Messages</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span>Loading conversations...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <span>No conversations yet</span>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.userId}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                onClick={() => onSelectConversation(conversation.userId, conversation.username)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${conversation.username}&backgroundType=gradientLinear`} />
                  <AvatarFallback>{conversation.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium">{conversation.username}</p>
                  {conversation.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                  )}
                </div>
                {conversation.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(conversation.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
            </div>
          )}
        </ScrollArea>
        </Card>
    </>
  );
}
