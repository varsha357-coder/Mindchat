import React from 'react';
import { Chat } from '../../types/database';
import { formatTime, getInitials } from '../../lib/utils';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Pin, Flame } from 'lucide-react';

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, isSelected, onSelect }) => {
  const { activeChatId } = useChat();
  const { currentUser } = useAuth();

  // Find peer user if direct chat
  const peer = chat.type === 'direct' 
    ? chat.members?.find(m => m.id !== currentUser.id) 
    : undefined;

  const displayName = chat.type === 'group' ? chat.name : (peer?.display_name || chat.name || 'Chat');
  const avatarUrl = chat.type === 'group' ? chat.avatar_url : peer?.avatar_url;
  const isOnline = peer?.online_status === 'online';

  const lastMsg = chat.last_message;
  const lastTime = lastMsg ? formatTime(lastMsg.created_at) : '';

  // Demo streak
  const streakDays = chat.id === 'chat_varsha_dm' ? 12 : undefined;

  return (
    <div
      onClick={onSelect}
      className={`relative px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 select-none flex items-center gap-3 border ${
        isSelected
          ? 'bg-surface-elevated/90 border-primary/30 shadow-subtle'
          : 'hover:bg-surface-secondary/60 border-transparent'
      }`}
    >
      {/* Avatar Container with Online Indicator */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-12 h-12 rounded-2xl object-cover border border-border"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center font-bold text-sm text-text-primary">
            {getInitials(displayName || 'MC')}
          </div>
        )}

        {/* Online Indicator */}
        {chat.type === 'direct' && isOnline && (
          <span 
            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface shadow-sm"
            title="Online"
          />
        )}
      </div>

      {/* Chat Metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="font-semibold text-sm text-text-primary truncate">
              {displayName}
            </h4>
            {streakDays && (
              <span 
                className="inline-flex items-center text-[11px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-md border border-amber-500/20"
                title={`${streakDays} Day Conversation Streak!`}
              >
                <Flame size={12} className="mr-0.5 fill-amber-500 text-amber-500" />
                {streakDays}
              </span>
            )}
            {chat.is_pinned && (
              <Pin size={11} className="text-text-muted shrink-0 rotate-45" />
            )}
          </div>
          <span className="text-[11px] text-text-muted shrink-0">
            {lastTime}
          </span>
        </div>

        {/* Last message content & Badges */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-text-secondary truncate min-w-0">
            {lastMsg ? (
              lastMsg.is_expired ? (
                <span className="italic text-text-muted">⏱ Expired message</span>
              ) : (
                lastMsg.content
              )
            ) : (
              <span className="italic text-text-muted">No messages yet</span>
            )}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* AI Important Flag */}
            {chat.has_ai_important && (
              <span 
                className="w-4 h-4 rounded-full bg-primary/20 text-primary-light flex items-center justify-center text-[10px] font-bold border border-primary/30"
                title="AI detected potentially important information"
              >
                ✦
              </span>
            )}

            {/* Unread message badge */}
            {chat.unread_count && chat.unread_count > 0 ? (
              <span className="min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {chat.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
