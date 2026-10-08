import React, { useState } from 'react';
import { Search, Plus, Sparkles, Filter, Users } from 'lucide-react';
import { ChatListItem } from './ChatListItem';
import { useChat } from '../../contexts/ChatContext';
import { MindChatAIIcon } from '../common/MindChatLogo';

interface ChatListProps {
  onOpenAISearch: () => void;
  onOpenNewChat: () => void;
}

type FilterTab = 'all' | 'unread' | 'groups' | 'important';

export const ChatList: React.FC<ChatListProps> = ({ onOpenAISearch, onOpenNewChat }) => {
  const { chats, activeChatId, selectChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredChats = chats.filter(chat => {
    // Check archive
    if (chat.is_archived) return false;

    // Filter by tab
    if (activeFilter === 'unread' && (!chat.unread_count || chat.unread_count === 0)) return false;
    if (activeFilter === 'groups' && chat.type !== 'group') return false;
    if (activeFilter === 'important' && !chat.has_ai_important) return false;

    // Filter by text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = chat.name?.toLowerCase().includes(q);
      const matchMsg = chat.last_message?.content.toLowerCase().includes(q);
      return matchName || matchMsg;
    }

    return true;
  });

  // Sort pinned first
  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="w-80 md:w-88 h-full bg-surface/50 border-r border-border flex flex-col shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary tracking-tight">Messages</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              {chats.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* AI Natural-Language Search Button */}
            <button
              onClick={onOpenAISearch}
              className="p-2 rounded-xl bg-primary/10 text-primary-light hover:bg-primary/20 border border-primary/25 transition-all shadow-glow-primary group"
              title="AI Natural Language Search ('When is our review?')"
              aria-label="AI Search"
            >
              <MindChatAIIcon size={18} animate />
            </button>

            {/* New Conversation Button */}
            <button
              onClick={onOpenNewChat}
              className="p-2 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-text-primary border border-border transition-all"
              title="Start New Chat or Group"
              aria-label="New chat"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-secondary/70 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-secondary/60 text-text-secondary hover:text-text-primary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'unread'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-secondary/60 text-text-secondary hover:text-text-primary'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveFilter('groups')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              activeFilter === 'groups'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-secondary/60 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users size={12} />
            <span>Groups</span>
          </button>
          <button
            onClick={() => setActiveFilter('important')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              activeFilter === 'important'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-secondary/60 text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>✦ Important</span>
          </button>
        </div>
      </div>

      {/* Chat List Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedChats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-xs text-text-muted">No conversations found</p>
          </div>
        ) : (
          sortedChats.map(chat => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={chat.id === activeChatId}
              onSelect={() => selectChat(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
