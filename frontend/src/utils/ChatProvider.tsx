import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  activeChat: { userId: string; username: string } | null;
  showConversations: boolean;
  startChat: (userId: string, username: string) => void;
  closeChat: () => void;
  toggleConversations: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeChat, setActiveChat] = useState<{ userId: string; username: string } | null>(null);
  const [showConversations, setShowConversations] = useState(false);

  const startChat = (userId: string, username: string) => {
    setActiveChat({ userId, username });
  };

  const closeChat = () => {
    setActiveChat(null);
  };

  const toggleConversations = () => {
    setShowConversations(prev => !prev);
  };

  return (
    <ChatContext.Provider value={{
      activeChat,
      showConversations,
      startChat,
      closeChat,
      toggleConversations,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}