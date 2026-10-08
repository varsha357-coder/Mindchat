import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, Clock, Calendar, Smile, Mic, X, 
  Sparkles, Image as ImageIcon, FileText, Check, ChevronRight 
} from 'lucide-react';
import { Message } from '../../types/database';
import { useChat } from '../../contexts/ChatContext';
import { ScheduleMessageModal } from './ScheduleMessageModal';
import { ScheduledMessagesManagerModal } from './ScheduledMessagesManagerModal';

interface MessageInputProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
  onSend: (text: string, options?: { durationSeconds?: number }) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  replyingTo,
  onCancelReply,
  onSend,
}) => {
  const { activeChat, scheduledMessages } = useChat();
  const [text, setText] = useState('');
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduledQueueModal, setShowScheduledQueueModal] = useState(false);
  const [activeTimer, setActiveTimer] = useState<number>(activeChat?.default_timer_seconds || 0);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setActiveTimer(activeChat?.default_timer_seconds || 0);
  }, [activeChat?.default_timer_seconds]);

  const thisChatPendingScheduled = scheduledMessages.filter(
    s => s.chat_id === activeChat?.id && s.status === 'pending'
  );

  const handleSend = () => {
    if (!text.trim() && !isRecording) return;

    if (isRecording) {
      onSend('🎤 Voice Message (0:14) [Audio preview simulation]', {
        durationSeconds: activeTimer > 0 ? activeTimer : undefined,
      });
      setIsRecording(false);
      return;
    }

    onSend(text.trim(), {
      durationSeconds: activeTimer > 0 ? activeTimer : undefined,
    });
    setText('');
    onCancelReply();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const timerOptions = [
    { label: 'Off', seconds: 0 },
    { label: '10s', seconds: 10 },
    { label: '1m', seconds: 60 },
    { label: '1h', seconds: 3600 },
    { label: '24h', seconds: 86400 },
  ];

  return (
    <div className="p-4 border-t border-border bg-surface/80 backdrop-blur-md relative select-none">
      {/* Replying banner */}
      {replyingTo && (
        <div className="mb-2 p-2.5 rounded-xl bg-surface-secondary border border-border flex items-center justify-between text-xs animate-fade-in">
          <div className="truncate min-w-0 pr-2">
            <span className="font-semibold text-primary block text-[10px]">Replying to message:</span>
            <span className="text-text-secondary truncate">{replyingTo.content}</span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary"
            aria-label="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Ephemeral Timer indicator tag if set */}
      {activeTimer > 0 && (
        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/25 text-[11px] font-semibold">
          <Clock size={12} />
          <span>This message will disappear in {timerOptions.find(o => o.seconds === activeTimer)?.label}</span>
          <button onClick={() => setActiveTimer(0)} className="hover:text-amber-300 ml-1">×</button>
        </div>
      )}

      {/* Scheduled message queue alert pill */}
      {thisChatPendingScheduled.length > 0 && (
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/25 text-[11px] font-semibold animate-fade-in">
          <Calendar size={12} />
          <span>
            {thisChatPendingScheduled.length} message{thisChatPendingScheduled.length > 1 ? 's' : ''} scheduled for this chat
          </span>
          <button
            onClick={() => setShowScheduledQueueModal(true)}
            className="underline hover:text-secondary-hover ml-1 font-bold"
          >
            Manage / Edit
          </button>
        </div>
      )}

      {/* Voice recording simulated indicator */}
      {isRecording && (
        <div className="mb-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping" />
            <span className="font-semibold">Recording voice message... 00:04</span>
          </div>
          <button
            onClick={() => setIsRecording(false)}
            className="text-xs font-semibold px-2 py-0.5 rounded bg-surface text-text-primary"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex items-end gap-2">
        {/* Attachment menu trigger */}
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            title="Attach file or photo"
            aria-label="Attach"
          >
            <Paperclip size={18} />
          </button>

          {showAttachMenu && (
            <div className="absolute left-0 bottom-full mb-2 w-48 bg-surface border border-border rounded-2xl shadow-elevated p-1.5 z-50 animate-fade-in space-y-0.5">
              <button
                onClick={() => {
                  onSend('📎 Shared Image: capstone_architecture_diagram.png [Preview Available]', {});
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <ImageIcon size={16} className="text-primary" />
                <span>Photo or Image</span>
              </button>
              <button
                onClick={() => {
                  onSend('📄 Shared Document: final_seminar_deck_v2.pdf [5.4 MB]', {});
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <FileText size={16} className="text-secondary" />
                <span>Document / PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Schedule Message Modal Trigger */}
        <button
          onClick={() => setShowScheduleModal(true)}
          className="p-2.5 rounded-xl text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
          title="Schedule Message (e.g. 12:00 AM Birthday, reminders)"
          aria-label="Schedule message"
        >
          <Calendar size={18} />
        </button>

        {/* Message Disappearing Timer selector */}
        <div className="relative">
          <button
            onClick={() => setShowTimerPicker(!showTimerPicker)}
            className={`p-2.5 rounded-xl transition-colors ${
              activeTimer > 0
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
            title="Set Disappearing Timer for this message"
            aria-label="Message timer"
          >
            <Clock size={18} />
          </button>

          {showTimerPicker && (
            <div className="absolute left-0 bottom-full mb-2 w-40 bg-surface border border-border rounded-2xl shadow-elevated p-1.5 z-50 animate-fade-in">
              <div className="text-[10px] font-bold text-text-muted px-2.5 py-1 uppercase">
                Disappearing Timer
              </div>
              {timerOptions.map(opt => (
                <button
                  key={opt.seconds}
                  onClick={() => {
                    setActiveTimer(opt.seconds);
                    setShowTimerPicker(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                    activeTimer === opt.seconds
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <span>{opt.label === 'Off' ? 'No Expiration' : `${opt.label} Timer`}</span>
                  {activeTimer === opt.seconds && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Area */}
        <div className="flex-1 min-h-11 max-h-36 relative bg-surface-secondary rounded-2xl border border-border focus-within:border-primary/50 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={e => {
              setText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (AI understands dates & tasks)"
            className="w-full py-2.5 px-3.5 bg-transparent resize-none text-sm text-text-primary placeholder:text-text-muted focus:outline-none max-h-32"
          />
        </div>

        {/* Voice Note Simulation or Send */}
        {text.trim() ? (
          <button
            onClick={handleSend}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white shadow-glow-primary hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
            title="Send Message"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-11 h-11 rounded-2xl transition-all flex items-center justify-center shrink-0 border ${
              isRecording
                ? 'bg-danger text-white border-danger shadow-lg shadow-danger/20'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary border-border hover:bg-surface-elevated'
            }`}
            title="Record Voice Note"
            aria-label="Voice Note"
          >
            <Mic size={18} />
          </button>
        )}
      </div>

      {/* Schedule Message Creation Modal */}
      <ScheduleMessageModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        defaultContent={text}
        onSuccess={() => {
          setText('');
        }}
      />

      {/* Scheduled Queue Manager Modal */}
      <ScheduledMessagesManagerModal
        isOpen={showScheduledQueueModal}
        onClose={() => setShowScheduledQueueModal(false)}
      />
    </div>
  );
};
