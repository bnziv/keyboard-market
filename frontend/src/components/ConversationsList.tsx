import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/utils/api';

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

export function ConversationsList({
  currentUserId,
  onSelectConversation,
  onClose,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get(
          `/api/chat/conversations/${currentUserId}`,
        );
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
    <div className="fixed flex flex-col w-[300px] h-[520px] right-5 bottom-5 rounded border z-50 bg-km-surface border-km-line shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-km-line flex-shrink-0">
        <span className="font-km-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-km-ink-mute">
          Messages
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded text-km-ink-mute hover:text-km-ink transition-colors bg-transparent border-none cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="font-km-mono text-xs text-km-ink-mute">
              Loading…
            </span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <span className="font-km-mono text-xs text-km-ink-mute">
              No conversations yet
            </span>
          </div>
        ) : (
          <div className="py-2">
            {conversations.map((c) => (
              <button
                key={c.userId}
                onClick={() => onSelectConversation(c.userId, c.username)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left bg-transparent border-none cursor-pointer hover:bg-km-surface-2 transition-colors"
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 text-xs font-semibold border bg-km-gold-soft border-km-gold/33 text-km-gold font-km-mono">
                  {c.username[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 overflow-hidden text-left">
                  <div className="text-sm font-medium truncate text-km-ink">
                    {c.username}
                  </div>
                  {c.lastMessage && (
                    <div className="text-xs truncate mt-0.5 text-km-ink-mute">
                      {c.lastMessage}
                    </div>
                  )}
                </div>
                {c.timestamp && (
                  <span className="flex-shrink-0 font-km-mono text-[10px] text-km-ink-mute">
                    {new Date(c.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
