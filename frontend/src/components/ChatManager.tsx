import { Chat } from '@/components/Chat';
import { ConversationsList } from '@/components/ConversationsList';
import { useAuth } from '@/utils/AuthProvider';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useChat } from '@/utils/ChatProvider';

export function ChatManager() {
  const { user } = useAuth();
  const { 
    activeChat, 
    showConversations, 
    startChat, 
    closeChat, 
    toggleConversations 
  } = useChat();

  if (!user) {
    return null;
  }

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-10 right-10 rounded-full h-12 w-12 shadow-lg"
        onClick={toggleConversations}
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
      {showConversations && (
        <ConversationsList
          currentUserId={user.id}
          onSelectConversation={startChat}
          onClose={toggleConversations}
        />
      )}
      {activeChat && (
        <Chat
          currentUserId={user.id}
          otherUserId={activeChat.userId}
          otherUserName={activeChat.username}
          onClose={closeChat}
          position={{ x: window.innerWidth - 420 - (showConversations ? 330 : 0), y: window.innerHeight - 620 }}
        />
      )}
    </>
  );
}