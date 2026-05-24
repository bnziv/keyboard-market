import { useEffect, useState, useRef } from 'react';
import { websocketService } from '@/services/websocketService';
import { X, Send } from 'lucide-react';
import api from '@/utils/api';

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

const CHAT_WIDTH = 380;
const CHAT_HEIGHT = 560;
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
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setWindowPosition({
        x: Math.min(Math.max(e.clientX - dragOffset.x, SCREEN_MARGIN), window.innerWidth - CHAT_WIDTH - SCREEN_MARGIN),
        y: Math.min(Math.max(e.clientY - dragOffset.y, SCREEN_MARGIN), window.innerHeight - CHAT_HEIGHT - SCREEN_MARGIN),
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
    const loadChatHistory = async () => {
      try {
        const response = await api.get(`/api/chat/history`, {
          params: { userId1: currentUserId, userId2: otherUserId },
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
    websocketService.connect(currentUserId);

    const unsubscribe = websocketService.onMessage((message) => {
      if (
        (message.senderId === currentUserId && message.receiverId === otherUserId) ||
        (message.senderId === otherUserId && message.receiverId === currentUserId)
      ) {
        setMessages((prev) => {
          const exists = prev.some(
            m => m.id === message.id ||
              (m.content === message.content && m.senderId === message.senderId && m.timestamp === message.timestamp)
          );
          return exists ? prev : [...prev, message];
        });
        scrollToBottom();
      }
    });

    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, [currentUserId, otherUserId]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      setWindowPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - CHAT_WIDTH - SCREEN_MARGIN),
        y: Math.min(prev.y, window.innerHeight - CHAT_HEIGHT - SCREEN_MARGIN),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    websocketService.sendMessage({ senderId: currentUserId, receiverId: otherUserId, content: newMessage.trim() });
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <style>{`.no-select { user-select: none; -webkit-user-select: none; }`}</style>
      <div
        className="fixed flex flex-col rounded border z-50"
        style={{
          left: `${windowPosition.x}px`,
          top: `${windowPosition.y}px`,
          width: `${CHAT_WIDTH}px`,
          height: `${CHAT_HEIGHT}px`,
          background: 'var(--km-surface)',
          borderColor: 'var(--km-line)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div
          className="chat-header flex items-center justify-between px-4 py-3 border-b flex-shrink-0 cursor-grab"
          style={{ borderColor: 'var(--km-line)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 text-xs font-semibold border"
              style={{
                background: 'var(--km-gold-soft)',
                borderColor: 'rgba(212,178,76,0.33)',
                color: 'var(--km-gold)',
                fontFamily: 'var(--km-font-mono)',
              }}
            >
              {otherUserName[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--km-ink)' }}>
              {otherUserName}
            </span>
          </div>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="text-xs" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}>
                Loading messages…
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <span className="text-xs" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}>
                No messages yet. Start the conversation!
              </span>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || `${message.senderId}-${message.timestamp}-${index}`}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[72%] rounded px-3 py-2"
                  style={
                    message.senderId === currentUserId
                      ? { background: 'var(--km-bg-sub)', color: 'var(--km-ink)' }
                      : { background: 'var(--km-surface-2)', color: 'var(--km-ink)', borderColor: 'var(--km-line)' }
                  }
                >
                  <p className="text-sm break-words" style={{ lineHeight: 1.5 }}>{message.content}</p>
                  {message.timestamp && (
                    <div
                      className="mt-1 text-right"
                      style={{ fontSize: '10px', fontFamily: 'var(--km-font-mono)', opacity: 0.5 }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-t flex-shrink-0"
          style={{ borderColor: 'var(--km-line)' }}
        >
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 rounded px-3 py-2 text-sm outline-none border"
            style={{
              background: 'var(--km-bg-sub)',
              borderColor: 'var(--km-line)',
              color: 'var(--km-ink)',
              fontFamily: 'var(--km-font-body)',
            }}
          />
          <button
            onClick={handleSend}
            className="w-9 h-9 flex items-center justify-center rounded transition-opacity hover:opacity-80 flex-shrink-0 border"
            style={{ background: 'var(--km-bg-sub)', color: 'var(--km-ink)', borderColor: 'var(--km-line)', cursor: 'pointer' }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
