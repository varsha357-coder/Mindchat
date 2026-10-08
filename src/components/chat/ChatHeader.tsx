import React from 'react';
import { 
  Phone, Video, Sparkles, Clock, MoreVertical, 
  Flame, PanelRightOpen, PanelRightClose, ShieldCheck, Users 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../lib/utils';
import { MindChatAIIcon } from '../common/MindChatLogo';

interface ChatHeaderProps {
  onOpenSummary: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onOpenSummary,
  onStartCall,
  isRightPanelOpen,
  onToggleRightPanel,
}) => {
  const { activeChat, setChatTimer, activeStreak } = useChat();
  const { currentUser } = useAuth();

  if (!activeChat) return null;

  const peer = activeChat.type === 'direct'
    ? activeChat.members?.find(m => m.id !== currentUser.id)
    : undefined;

  const displayName = activeChat.type === 'group' 
    ? activeChat.name 
    : (peer?.display_name || activeChat.name || 'Chat');
  
  const avatarUrl = activeChat.type === 'group' ? activeChat.avatar_url : peer?.avatar_url;
  const isOnline = peer?.online_status === 'online';
  const tags = peer?.tags || [];

  const timerOptions = [
    { label: 'Off', seconds: 0 },
    { label: '10s', seconds: 10 },
    { label: '1m', seconds: 60 },
    { label: '1h', seconds: 3600 },
    { label: '24h', seconds: 86400 },
  ];

  return (
    <div className="h-18 px-5 border-b border-border bg-surface/70 backdrop-blur-md flex items-center justify-between shrink-0 select-none z-10">
      {/* Left: Contact/Group Information */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-11 h-11 rounded-2xl object-cover border border-border"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center font-bold text-sm text-text-primary">
              {getInitials(displayName || 'MC')}
            </div>
          )}
          {activeChat.type === 'direct' && isOnline && (
            <span 
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface" 
              title="Online"
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-text-primary truncate">
              {displayName}
            </h3>
            {/* Streaks */}
            {activeStreak && activeStreak.is_enabled && (
              <span 
                className="inline-flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25"
                title={`${activeStreak.streak_count} Day Conversation Streak!`}
              >
                <Flame size={13} className="mr-0.5 fill-amber-500 text-amber-500" />
                {activeStreak.streak_count}d
              </span>
            )}
          </div>

          {/* Status & Profile Tags */}
          <div className="flex items-center gap-2 mt-0.5">
            {activeChat.type === 'group' ? (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Users size={12} />
                <span>{activeChat.members?.length || 4} members</span>
              </span>
            ) : (
              <span className="text-xs text-text-muted">
                {isOnline ? (
                  <span className="text-emerald-500 font-medium">● Online</span>
                ) : (
                  'Offline'
                )}
              </span>
            )}

            {/* Profile capsule tags */}
            {tags.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 overflow-hidden">
                {tags.slice(0, 2).map(tag => (
                  <span key={tag} className="profile-tag text-[10px] py-0 px-1.5">
                    [{tag}]
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Disappearing Timer Dropdown */}
        <div className="relative group">
          <button
            className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-medium ${
              activeChat.default_timer_seconds > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-glow-accent'
                : 'bg-surface-secondary/70 border-border text-text-secondary hover:text-text-primary'
            }`}
            title="Set Disappearing Messages Timer"
          >
            <Clock size={16} />
            <span className="hidden md:inline">
              {activeChat.default_timer_seconds > 0 
                ? `${timerOptions.find(o => o.seconds === activeChat.default_timer_seconds)?.label}`
                : 'Timer'}
            </span>
          </button>

          {/* Timer Hover Menu */}
          <div className="absolute right-0 top-full mt-1.5 w-36 bg-surface border border-border rounded-xl shadow-elevated p-1.5 hidden group-hover:block z-50 animate-fade-in">
            <div className="text-[10px] font-semibold text-text-muted uppercase px-2 py-1">
              Disappearing Timer
            </div>
            {timerOptions.map(opt => (
              <button
                key={opt.seconds}
                onClick={() => setChatTimer(activeChat.id, opt.seconds)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeChat.default_timer_seconds === opt.seconds
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }`}
              >
                {opt.label === 'Off' ? 'Turn Off' : `${opt.label} Expiration`}
              </button>
            ))}
          </div>
        </div>

        {/* AI Chat Summarize Button */}
        <button
          onClick={onOpenSummary}
          className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/25 transition-all shadow-glow-primary flex items-center gap-1.5 text-xs font-semibold"
          title="Summarize this chat with AI"
        >
          <MindChatAIIcon size={16} />
          <span className="hidden sm:inline">Summarize</span>
        </button>

        {/* Voice Call */}
        <button
          onClick={() => onStartCall('voice')}
          className="p-2 rounded-xl bg-surface-secondary/70 hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-border transition-colors"
          title="Voice Call"
          aria-label="Voice call"
        >
          <Phone size={16} />
        </button>

        {/* Video Call */}
        <button
          onClick={() => onStartCall('video')}
          className="p-2 rounded-xl bg-surface-secondary/70 hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-border transition-colors"
          title="Video Call"
          aria-label="Video call"
        >
          <Video size={16} />
        </button>

        {/* Toggle Right Panel */}
        <button
          onClick={onToggleRightPanel}
          className="p-2 rounded-xl bg-surface-secondary/70 hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-border transition-colors"
          title={isRightPanelOpen ? 'Hide details panel' : 'Show details panel'}
          aria-label="Toggle details panel"
        >
          {isRightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>
    </div>
  );
};
