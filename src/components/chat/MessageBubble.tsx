import React, { useState, useEffect } from 'react';
import { Message, Profile } from '../../types/database';
import { formatTime, formatTimerCountdown } from '../../lib/utils';
import { 
  Check, CheckCheck, Clock, Star, Languages, 
  Trash2, Copy, CornerUpLeft, Sparkles, CheckCircle2, Bookmark,
  Loader2, AlertCircle, X, ChevronDown, CheckCheck as DoubleCheck 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAI } from '../../contexts/AIContext';
import { MindChatAIIcon } from '../common/MindChatLogo';
import { INDIAN_LANGUAGES } from '../../types/translation';

interface MessageBubbleProps {
  message: Message;
  sender?: Profile;
  isSender: boolean;
  isHighlighted?: boolean;
  onReply: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  isSender,
  isHighlighted = false,
  onReply,
}) => {
  const { toggleStar, isMessageStarred, deleteMessage, addReaction, translateMessage, retrySendMessage } = useChat();
  const { approveMemory, dismissMemory } = useAI();
  const { currentUser } = useAuth();

  const [copied, setCopied] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Translation local UX states
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [showInlineLangSwitcher, setShowInlineLangSwitcher] = useState(false);
  const [showDismissTranslation, setShowDismissTranslation] = useState(false);

  const isStarred = isMessageStarred(message.id) || message.is_starred || false;

  // Live countdown timer for expiring messages
  useEffect(() => {
    if (!message.expires_at || message.is_expired) {
      setSecondsLeft(null);
      return;
    }

    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((new Date(message.expires_at!).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [message.expires_at, message.is_expired]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTranslate = async (langCode: string) => {
    setIsTranslating(true);
    setTranslationError(null);
    setShowLanguagePicker(false);
    setShowInlineLangSwitcher(false);

    try {
      await translateMessage(message.id, langCode);
    } catch (err: any) {
      setTranslationError(err?.message || 'Translation failed. Tap to retry.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleQuickTranslate = () => {
    // If not translated yet, translate to English or preferred language
    const currentPref = currentUser.preferred_language || 'en';
    const target = currentPref === 'en' ? 'kn' : 'en';
    handleTranslate(target);
  };

  const hasAIImportant = message.ai_classification?.status === 'pending_review';
  const isAIApproved = message.ai_classification?.status === 'approved';
  const ext = message.ai_classification?.extracted_data;

  const currentTranslatedLangObj = INDIAN_LANGUAGES.find(
    l => l.code === (message.translated_language || 'en')
  );

  return (
    <div 
      id={`msg-${message.id}`}
      className={`group flex flex-col my-2 select-text transition-all duration-300 ${
        isSender ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender name for group chats if incoming */}
      {!isSender && sender && (
        <span className="text-[11px] font-semibold text-text-muted mb-1 ml-2">
          {sender.display_name}
        </span>
      )}

      <div className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
        {/* Reply context quote if present */}
        {message.reply_to && (
          <div className="mb-1 p-2 rounded-xl bg-surface-secondary/70 border-l-2 border-primary text-xs text-text-muted truncate max-w-full">
            <span className="font-semibold text-primary block text-[10px]">Reply:</span>
            {message.reply_to.content}
          </div>
        )}

        {/* Message Bubble Box */}
        <div
          className={`relative px-4 py-3 rounded-2xl border transition-all duration-300 shadow-sm ${
            isSender
              ? 'bg-[var(--bubble-outgoing)] border-[var(--bubble-outgoing-border)] text-text-primary rounded-br-sm'
              : 'bg-[var(--bubble-incoming)] border-[var(--bubble-incoming-border)] text-text-primary rounded-bl-sm'
          } ${hasAIImportant ? 'ring-1 ring-primary/40' : ''} ${
            isHighlighted 
              ? 'ring-2 ring-amber-400 bg-amber-400/20 shadow-glow-amber scale-[1.01]' 
              : ''
          }`}
        >
          {/* Ephemeral Timer Indicator */}
          {secondsLeft !== null && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md mb-2 border border-amber-500/20 w-fit timer-pulse">
              <Clock size={12} />
              <span>⏱ {formatTimerCountdown(secondsLeft)}</span>
            </div>
          )}

          {/* Expired Message Notice */}
          {message.is_expired ? (
            <div className="flex items-center gap-1.5 text-xs italic text-text-muted">
              <Clock size={13} className="opacity-70" />
              <span>⏱ This message has expired and disappeared.</span>
            </div>
          ) : (
            /* Original Content */
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}

          {/* Translation In-Progress Spinner */}
          {isTranslating && (
            <div className="mt-2.5 pt-2 border-t border-border/70 text-xs bg-surface-secondary/60 -mx-2 px-2.5 py-2 rounded-lg flex items-center gap-2 text-secondary animate-pulse">
              <Loader2 size={13} className="animate-spin" />
              <span className="font-semibold text-[11px]">Translating message across Indian languages...</span>
            </div>
          )}

          {/* Translation Error Banner */}
          {translationError && (
            <div className="mt-2.5 pt-2 border-t border-border/70 text-xs bg-danger/10 text-danger -mx-2 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px]">
                <AlertCircle size={12} />
                <span>{translationError}</span>
              </div>
              <button
                onClick={() => handleTranslate(message.translated_language || 'en')}
                className="font-bold underline text-[11px] hover:text-danger-hover"
              >
                Retry
              </button>
            </div>
          )}

          {/* Translated Content Display Below Original Message */}
          {message.is_translated && message.translated_content && !isTranslating && !showDismissTranslation && (
            <div className="mt-2.5 pt-2 border-t border-border/70 text-xs bg-surface-secondary/70 -mx-2 px-2.5 py-2 rounded-xl space-y-1 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary uppercase tracking-wider">
                  <Languages size={12} />
                  <span>
                    Translated ({currentTranslatedLangObj?.name || message.translated_language?.toUpperCase() || 'EN'})
                  </span>
                </div>

                {/* Inline Controls: Switch Language & Dismiss */}
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button
                      onClick={() => setShowInlineLangSwitcher(!showInlineLangSwitcher)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface hover:bg-surface-elevated text-text-secondary flex items-center gap-1 transition-colors"
                      title="Switch translation language"
                    >
                      <span>{currentTranslatedLangObj?.code.toUpperCase()}</span>
                      <ChevronDown size={10} />
                    </button>

                    {showInlineLangSwitcher && (
                      <div className="absolute right-0 bottom-full mb-1 w-48 bg-surface border border-border rounded-xl shadow-elevated p-1 max-h-48 overflow-y-auto z-50">
                        <div className="text-[10px] font-bold text-text-muted px-2 py-1 uppercase">
                          Translate to
                        </div>
                        {INDIAN_LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => handleTranslate(lang.code)}
                            className="w-full text-left px-2 py-1 rounded-lg text-xs hover:bg-surface-secondary flex items-center justify-between"
                          >
                            <span>{lang.name}</span>
                            <span className="text-[10px] text-text-muted">{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowDismissTranslation(true)}
                    className="p-0.5 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
                    title="Hide translation"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Translation Text */}
              <p className="text-text-primary text-xs leading-relaxed font-medium">
                {message.translated_content}
              </p>
            </div>
          )}

          {/* AI Important Banner inside message if flagged */}
          {hasAIImportant && ext && (
            <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-primary-light">
                  <MindChatAIIcon size={14} animate />
                  <span>✦ Potentially Important</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                  {message.ai_classification?.classification}
                </span>
              </div>

              <div className="text-text-primary font-medium">
                "{ext.title || ext.action_item || message.content}"
              </div>

              {(ext.date || ext.time) && (
                <div className="text-[11px] text-text-secondary flex items-center gap-2">
                  <span>📅 {ext.date}</span>
                  {ext.time && <span>⏰ {ext.time}</span>}
                </div>
              )}

              {/* Review Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => approveMemory(message.id)}
                  className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-[11px] shadow-sm transition-all"
                >
                  Save to Memory
                </button>
                <button
                  onClick={() => dismissMemory(message.id)}
                  className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-secondary text-text-secondary font-medium text-[11px] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* AI Approved Saved Badge */}
          {isAIApproved && (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 w-fit">
              <CheckCircle2 size={11} />
              <span>✦ Saved to AI Memory</span>
            </div>
          )}

          {/* Failed Message Error & Retry Banner */}
          {message.status === 'failed' && (
            <div className="mt-2 pt-1.5 border-t border-danger/30 text-[11px] text-danger flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <AlertCircle size={13} className="shrink-0" />
                <span className="truncate">{message.error || 'Failed to send to database'}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  retrySendMessage(message.id);
                }}
                className="font-bold underline text-danger hover:text-danger-hover shrink-0 cursor-pointer text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Footer: Time + Status Ticks + Star */}
          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-text-muted select-none">
            {isStarred && (
              <Star size={11} className="fill-amber-400 text-amber-400" />
            )}
            <span>{formatTime(message.created_at)}</span>

            {isSender && (
              <span className="flex items-center">
                {message.status === 'sending' ? (
                  <span className="flex items-center gap-1 text-[10px] text-text-muted" title="Sending...">
                    <Clock size={11} className="animate-spin text-primary" />
                    <span>Sending</span>
                  </span>
                ) : message.status === 'failed' ? (
                  <span className="text-danger flex items-center" title="Failed to send">
                    <AlertCircle size={13} />
                  </span>
                ) : message.status === 'read' ? (
                  <span title="Read">
                    <CheckCheck size={14} className="text-secondary" />
                  </span>
                ) : message.status === 'delivered' ? (
                  <span title="Delivered">
                    <CheckCheck size={14} className="text-text-muted" />
                  </span>
                ) : (
                  <span title="Sent">
                    <Check size={14} className="text-text-muted" />
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions List */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 -mb-1 px-1">
            {message.reactions.map(r => (
              <span
                key={r.id}
                onClick={() => addReaction(message.id, r.emoji)}
                className="text-xs bg-surface border border-border px-1.5 py-0.5 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"
              >
                {r.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Hover Action Bar */}
        <div
          className={`absolute top-0 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 p-1 rounded-xl bg-surface border border-border shadow-elevated z-20 transition-all ${
            isSender ? 'right-2' : 'left-2'
          }`}
        >
          {/* Quick Reaction Emojis */}
          {['❤️', '👍', '🎯', '🔥'].map(emoji => (
            <button
              key={emoji}
              onClick={() => addReaction(message.id, emoji)}
              className="p-1 hover:bg-surface-secondary rounded-lg text-xs hover:scale-125 transition-transform"
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}

          <span className="w-px h-3 bg-border mx-0.5" />

          {/* Star Message */}
          <button
            onClick={() => toggleStar(message.id)}
            className={`p-1 hover:bg-surface-secondary rounded-lg text-text-secondary hover:text-amber-400 transition-colors ${
              isStarred ? 'text-amber-400' : ''
            }`}
            title={isStarred ? 'Unstar message' : 'Star message (Save to Starred)'}
          >
            <Star size={13} className={isStarred ? 'fill-amber-400 text-amber-400' : ''} />
          </button>

          {/* Translate Button */}
          <div className="relative">
            <button
              onClick={() => setShowLanguagePicker(!showLanguagePicker)}
              className="p-1 hover:bg-surface-secondary rounded-lg text-text-secondary hover:text-secondary transition-colors"
              title="Translate (Kannada, Telugu, Hindi, Tamil, English, etc.)"
            >
              <Languages size={13} />
            </button>

            {/* Language picker menu */}
            {showLanguagePicker && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-elevated p-1.5 max-h-56 overflow-y-auto z-50 animate-fade-in">
                <div className="text-[10px] font-bold text-text-muted px-2 py-1 uppercase tracking-wider">
                  Select Language
                </div>
                {INDIAN_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleTranslate(lang.code)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-surface-secondary flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium text-text-primary">{lang.name}</span>
                    <span className="text-[10px] text-text-muted">{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply */}
          <button
            onClick={() => onReply(message)}
            className="p-1 hover:bg-surface-secondary rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            title="Reply"
          >
            <CornerUpLeft size={13} />
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-surface-secondary rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            title={copied ? 'Copied!' : 'Copy text'}
          >
            <Copy size={13} />
          </button>

          {/* Delete (if sender) */}
          {isSender && (
            <button
              onClick={() => deleteMessage(message.id)}
              className="p-1 hover:bg-danger/20 rounded-lg text-text-secondary hover:text-danger transition-colors"
              title="Delete message"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
