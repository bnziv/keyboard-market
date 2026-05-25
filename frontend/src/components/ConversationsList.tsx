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

export function ConversationsList({ currentUserId, onSelectConversation, onClose }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get(`/api/chat/conversations/${currentUserId}`);
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
    <div
      className="fixed flex flex-col rounded border z-50"
      style={{
        width: '300px',
        height: '520px',
        right: '20px',
        bottom: '20px',
        background: 'var(--km-surface)',
        borderColor: 'var(--km-line)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--km-line)' }}
      >
        <span
          className="text-xs font-semibold uppercase"
          style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', letterSpacing: '0.15em', fontSize: '10px' }}
        >
          Messages
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded"
          style={{ color: 'var(--km-ink-mute)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--km-ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--km-ink-mute)')}
        >
          <X size={15} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-xs" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}>
              Loading…
            </span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-xs" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}>
              No conversations yet
            </span>
          </div>
        ) : (
          <div className="py-2">
            {conversations.map(c => (
              <button
                key={c.userId}
                onClick={() => onSelectConversation(c.userId, c.username)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--km-surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 text-xs font-semibold border"
                  style={{
                    background: 'var(--km-gold-soft)',
                    borderColor: 'rgba(212,178,76,0.33)',
                    color: 'var(--km-gold)',
                    fontFamily: 'var(--km-font-mono)',
                  }}
                >
                  {c.username[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 overflow-hidden text-left">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--km-ink)' }}>
                    {c.username}
                  </div>
                  {c.lastMessage && (
                    <div className="text-xs truncate mt-0.5" style={{ color: 'var(--km-ink-mute)' }}>
                      {c.lastMessage}
                    </div>
                  )}
                </div>
                {c.timestamp && (
                  <span
                    className="flex-shrink-0 text-xs"
                    style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px' }}
                  >
                    {new Date(c.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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
