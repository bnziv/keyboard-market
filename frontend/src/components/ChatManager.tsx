import { useState } from 'react';
import { Chat } from './Chat';
import { ConversationsList } from './ConversationsList';
import { useAuth } from '@/utils/AuthProvider';
import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';

export function ChatManager() {
  const [activeChat, setActiveChat] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  const { user } = useAuth();
  const [showConversations, setShowConversations] = useState(true);

  const handleSelectConversation = (userId: string, username: string) => {
    setActiveChat({ userId, username });
  };

  const handleCloseChat = () => {
    setActiveChat(null);
  };

  const onToggleConversations = () => {
    setShowConversations(!showConversations);
  };

  if (!user) {
    return null;
  }

  return (
    <>
    <Button
        variant="default"
        size="icon"
        className="fixed bottom-10 right-10 rounded-full h-12 w-12 shadow-lg"
        onClick={onToggleConversations}
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
      {showConversations && user && (
        <ConversationsList
          currentUserId={user?.id}
          onSelectConversation={handleSelectConversation}
          onClose={onToggleConversations}
        />
      )}
      {activeChat && user && (
        <Chat
          currentUserId={user?.id}
          otherUserId={activeChat.userId}
          otherUserName={activeChat.username}
          onClose={handleCloseChat}
          position={{ x: window.innerWidth - 420 - (showConversations ? 330 : 0), y: window.innerHeight - 620 }}
        />
      )}
    </>
  );
}