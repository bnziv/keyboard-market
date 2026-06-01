import { Chat } from '@/components/Chat';
import { ConversationsList } from '@/components/ConversationsList';
import { useAuth } from '@/utils/AuthProvider';
import { useChat } from '@/utils/ChatProvider';

export function ChatManager() {
  const { user } = useAuth();
  const {
    activeChat,
    showConversations,
    startChat,
    closeChat,
    toggleConversations,
  } = useChat();

  if (!user) return null;

  return (
    <>
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
          position={{
            x: window.innerWidth - 400 - (showConversations ? 320 : 0),
            y: window.innerHeight - 580,
          }}
        />
      )}
    </>
  );
}
