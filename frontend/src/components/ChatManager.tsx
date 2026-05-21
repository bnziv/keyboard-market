import { Chat } from '@/components/Chat';
import { ConversationsList } from '@/components/ConversationsList';
import { useAuth } from '@/utils/AuthProvider';
import { MessageCircle } from 'lucide-react';
import { useChat } from '@/utils/ChatProvider';

export function ChatManager() {
  const { user } = useAuth();
  const { activeChat, showConversations, startChat, closeChat, toggleConversations } = useChat();

  if (!user) return null;

  return (
    <>
      <button
        onClick={toggleConversations}
        className="fixed bottom-6 right-6 w-12 h-12 flex items-center justify-center rounded-full z-40 transition-opacity hover:opacity-80"
        style={{ background: 'var(--km-ink)', color: 'var(--km-bg)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
      >
        <MessageCircle size={20} />
      </button>
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
          position={{ x: window.innerWidth - 400 - (showConversations ? 320 : 0), y: window.innerHeight - 580 }}
        />
      )}
    </>
  );
}
