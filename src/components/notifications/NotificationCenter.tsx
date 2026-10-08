import React, { useState } from 'react';
import { Bell, Sparkles, Calendar, MessageSquare, Check, Trash2, ExternalLink } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { formatTime } from '../../lib/utils';
import { Button } from '../common/Button';

export const NotificationCenter: React.FC<{ onJumpToChat?: (chatId: string) => void }> = ({
  onJumpToChat,
}) => {
  const { notifications, markNotificationRead, deleteNotification, selectChat } = useChat();
  const [filter, setFilter] = useState<string>('all');

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'ai') return n.type === 'ai_insight' || n.type === 'memory_suggestion';
    return true;
  });

  const handleOpenSource = (chatId?: string) => {
    if (chatId) {
      selectChat(chatId);
      if (onJumpToChat) onJumpToChat(chatId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-y-auto p-6 md:p-8 select-none animate-fade-in">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Notification Center</h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Smart updates, deadline reminders, and intelligence alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => notifications.forEach(n => markNotificationRead(n.id))}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2">
          {['all', 'unread', 'ai'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {f === 'ai' ? '✦ AI Insights' : f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-xs text-text-muted">
              No notifications to display.
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  !item.is_read
                    ? 'bg-surface border-primary/40 shadow-subtle'
                    : 'bg-surface/50 border-border opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    {item.type === 'ai_insight' ? (
                      <Sparkles size={16} />
                    ) : item.type === 'deadline' ? (
                      <Calendar size={16} className="text-amber-500" />
                    ) : (
                      <MessageSquare size={16} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-text-primary flex items-center gap-2">
                      {item.title}
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      {item.content}
                    </p>
                    <span className="text-[10px] text-text-muted mt-2 block">
                      {formatTime(item.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.source_chat_id && (
                    <button
                      onClick={() => handleOpenSource(item.source_chat_id)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title="Open source message"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                  {!item.is_read && (
                    <button
                      onClick={() => markNotificationRead(item.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Dismiss"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
