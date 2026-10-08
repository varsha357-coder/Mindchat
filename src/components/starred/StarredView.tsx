import React, { useState } from 'react';
import { Star, Sparkles, MessageSquare, ExternalLink, Trash2, Search, ArrowRight } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { formatTime } from '../../lib/utils';
import { Message } from '../../types/database';

interface StarredViewProps {
  onJumpToMessage: (chatId: string, messageId: string) => void;
}

export const StarredView: React.FC<StarredViewProps> = ({ onJumpToMessage }) => {
  const { starredMessages, toggleStar, allMessages, chats } = useChat();
  const [tab, setTab] = useState<'user' | 'ai'>('user');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect AI-identified important suggestions from messages
  const aiSuggested: { msg: Message; chatName: string }[] = [];
  Object.entries(allMessages).forEach(([chatId, msgs]) => {
    const chat = chats.find(c => c.id === chatId);
    const chatName = chat?.name || 'Chat';
    msgs.forEach(m => {
      if (m.ai_classification?.status === 'approved' || m.ai_classification?.status === 'pending_review') {
        aiSuggested.push({ msg: m, chatName });
      }
    });
  });

  // Filter based on search query
  const filteredUserStarred = starredMessages.filter(entry => {
    const q = searchQuery.toLowerCase();
    const content = entry.message?.content?.toLowerCase() || '';
    const chatName = entry.chat_name?.toLowerCase() || '';
    const sender = entry.sender_name?.toLowerCase() || '';
    return content.includes(q) || chatName.includes(q) || sender.includes(q);
  });

  const filteredAISuggested = aiSuggested.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.msg.content.toLowerCase().includes(q) ||
      item.chatName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-y-auto p-6 md:p-8 select-none animate-fade-in">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
                <Star size={18} className="fill-amber-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Starred Messages</h1>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Your saved bookmarks and highlighted messages. Persisted securely in Supabase.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search starred messages..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border w-fit">
          <button
            onClick={() => setTab('user')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'user'
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Star size={14} className="fill-amber-500 text-amber-500" />
            <span>⭐ Starred Messages ({starredMessages.length})</span>
          </button>

          <button
            onClick={() => setTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'ai'
                ? 'bg-primary/15 text-primary-light border border-primary/30 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles size={14} className="text-primary" />
            <span>✦ AI Identified ({aiSuggested.length})</span>
          </button>
        </div>

        {/* Content stream */}
        <div className="space-y-3">
          {tab === 'user' ? (
            filteredUserStarred.length === 0 ? (
              <div className="text-center py-20 px-4 rounded-3xl bg-surface/40 border border-border/60">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
                  <Star size={24} />
                </div>
                <h3 className="text-base font-bold text-text-primary mb-1">No starred messages yet</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Hover over any message in a chat and tap the Star icon to bookmark it. Your starred messages will be saved here and persist across all devices.
                </p>
              </div>
            ) : (
              filteredUserStarred.map(entry => (
                <div
                  key={entry.id || entry.message_id}
                  onClick={() => onJumpToMessage(entry.chat_id, entry.message_id)}
                  className="p-4 rounded-2xl bg-surface border border-border hover:border-amber-500/40 transition-all flex items-start justify-between shadow-subtle group cursor-pointer hover:bg-surface-secondary/40"
                >
                  <div className="space-y-2 pr-4 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <Star size={12} className="fill-amber-500 text-amber-500 shrink-0" />
                      <span className="font-semibold text-text-primary">{entry.chat_name}</span>
                      {entry.sender_name && <span>• {entry.sender_name}</span>}
                      {entry.message?.created_at && (
                        <span>• {formatTime(entry.message.created_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-primary font-medium leading-relaxed bg-surface-secondary/50 p-2.5 rounded-xl border border-border/40">
                      "{entry.message?.content || 'Starred message'}"
                    </p>
                    <div className="text-[10px] text-text-muted flex items-center gap-1 group-hover:text-primary transition-colors">
                      <span>Click to view in chat and locate message</span>
                      <ArrowRight size={10} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onJumpToMessage(entry.chat_id, entry.message_id)}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Jump to message"
                    >
                      <span>Jump</span>
                      <ExternalLink size={12} />
                    </button>
                    <button
                      onClick={() => toggleStar(entry.message_id)}
                      className="p-1.5 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                      title="Unstar message"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredAISuggested.length === 0 ? (
              <div className="text-center py-20 px-4 rounded-3xl bg-surface/40 border border-border/60">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-text-primary mb-1">No AI-suggested items</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  When you chat, MindChat AI highlights tasks, decisions, and deadlines.
                </p>
              </div>
            ) : (
              filteredAISuggested.map(({ msg, chatName }) => (
                <div
                  key={msg.id}
                  onClick={() => onJumpToMessage(msg.chat_id, msg.id)}
                  className="p-4 rounded-2xl bg-surface border border-primary/25 hover:border-primary/50 transition-all flex items-start justify-between shadow-subtle group cursor-pointer hover:bg-surface-secondary/40"
                >
                  <div className="space-y-1.5 pr-4 flex-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-primary flex items-center gap-1">
                        ✦ AI Identified
                      </span>
                      <span className="text-text-muted">• {chatName}</span>
                      <span className="text-text-muted">• {formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-xs text-text-primary font-medium leading-relaxed bg-surface-secondary/50 p-2.5 rounded-xl border border-border/40">
                      "{msg.content}"
                    </p>
                    {msg.ai_classification?.extracted_data?.title && (
                      <div className="text-[11px] text-primary-light font-semibold pt-0.5">
                        Extracted: {msg.ai_classification.extracted_data.title}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onJumpToMessage(msg.chat_id, msg.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <span>Jump</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
