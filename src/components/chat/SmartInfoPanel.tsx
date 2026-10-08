import React from 'react';
import { 
  X, Brain, Sparkles, Star, Calendar, FileText, 
  ShieldCheck, Lock, Clock, Plus, Tag, ExternalLink 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAI } from '../../contexts/AIContext';
import { getInitials, formatTime } from '../../lib/utils';
import { MindChatAIIcon } from '../common/MindChatLogo';

interface SmartInfoPanelProps {
  onClose: () => void;
  onOpenSummary: () => void;
  onSelectMemory: (id: string) => void;
}

export const SmartInfoPanel: React.FC<SmartInfoPanelProps> = ({
  onClose,
  onOpenSummary,
  onSelectMemory,
}) => {
  const { activeChat, messages } = useChat();
  const { currentUser } = useAuth();
  const { memories } = useAI();

  if (!activeChat) return null;

  const peer = activeChat.type === 'direct'
    ? activeChat.members?.find(m => m.id !== currentUser.id)
    : undefined;

  const displayName = activeChat.type === 'group' 
    ? activeChat.name 
    : (peer?.display_name || activeChat.name || 'Chat');
  
  const avatarUrl = activeChat.type === 'group' ? activeChat.avatar_url : peer?.avatar_url;
  const tags = peer?.tags || ['AI/ML', 'Student', 'Developer'];

  // Filter memories belonging to this chat
  const chatMemories = memories.filter(m => m.source_chat_id === activeChat.id);

  // Starred messages in this chat
  const starredMessages = messages.filter(m => m.is_starred);

  return (
    <div className="w-80 md:w-88 h-full bg-surface border-l border-border flex flex-col shrink-0 overflow-y-auto animate-fade-in select-none">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-sm text-text-primary">Chat Details</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Contact Profile Summary */}
        <div className="text-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-3xl mx-auto object-cover border border-border shadow-subtle mb-3"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl mx-auto bg-gradient-to-tr from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center font-bold text-xl text-text-primary shadow-subtle mb-3">
              {getInitials(displayName || 'MC')}
            </div>
          )}

          <h3 className="font-bold text-base text-text-primary">{displayName}</h3>
          <p className="text-xs text-text-secondary mt-1">{peer?.about || 'Group chat'}</p>

          {/* Capsule Tags */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {tags.map(tag => (
              <span key={tag} className="profile-tag">
                [{tag}]
              </span>
            ))}
          </div>
        </div>

        {/* AI Memory Quick Card */}
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-primary-light">
              <MindChatAIIcon size={16} animate />
              <span>AI Memories from this chat</span>
            </div>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
              {chatMemories.length}
            </span>
          </div>

          {chatMemories.length === 0 ? (
            <p className="text-xs text-text-muted italic">
              No memories approved from this chat yet.
            </p>
          ) : (
            <div className="space-y-2">
              {chatMemories.slice(0, 3).map(mem => (
                <div
                  key={mem.id}
                  onClick={() => onSelectMemory(mem.id)}
                  className="p-2.5 rounded-xl bg-surface/80 border border-border hover:border-primary/40 cursor-pointer transition-colors text-xs"
                >
                  <div className="font-semibold text-text-primary truncate">{mem.title}</div>
                  <div className="text-[10px] text-text-muted mt-0.5 flex items-center justify-between">
                    <span className="capitalize">{mem.category}</span>
                    <span>{formatTime(mem.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onOpenSummary}
            className="w-full py-2 rounded-xl bg-surface hover:bg-surface-secondary text-primary font-semibold text-xs border border-primary/25 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>Generate Full AI Summary</span>
          </button>
        </div>

        {/* Starred Messages Section */}
        {starredMessages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span>Starred Messages ({starredMessages.length})</span>
              </span>
            </div>
            <div className="space-y-2">
              {starredMessages.slice(0, 3).map(sm => (
                <div key={sm.id} className="p-2.5 rounded-xl bg-surface-secondary/70 border border-border text-xs">
                  <p className="text-text-primary truncate">{sm.content}</p>
                  <span className="text-[10px] text-text-muted mt-1 block">{formatTime(sm.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy & Disappearing Settings info */}
        <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border space-y-2.5 text-xs text-text-secondary">
          <div className="font-semibold text-text-primary flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-success" />
            <span>MindChat Privacy Guarantee</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Messages are analyzed locally and server-side using secure isolation. Casual data is never stored into AI Memory without manual approval.
          </p>
        </div>
      </div>
    </div>
  );
};
