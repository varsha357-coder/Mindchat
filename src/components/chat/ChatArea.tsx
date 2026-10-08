import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Message } from '../../types/database';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { SmartInfoPanel } from './SmartInfoPanel';
import { ScheduledMessagesManagerModal } from './ScheduledMessagesManagerModal';
import { MessageSquare, Sparkles, Calendar } from 'lucide-react';
import { MindChatAIIcon } from '../common/MindChatLogo';

interface ChatAreaProps {
  onOpenSummary: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onSelectMemory: (id: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  onOpenSummary,
  onStartCall,
  onSelectMemory,
}) => {
  const { 
    activeChat, 
    messages, 
    sendMessage, 
    contacts, 
    targetMessageId, 
    setTargetMessageId,
    scheduledMessages 
  } = useChat();
  const { currentUser } = useAuth();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message unless jumping to target message
  useEffect(() => {
    if (!targetMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, targetMessageId]);

  // Jump and highlight target message
  useEffect(() => {
    if (!targetMessageId) return;

    const scrollTimer = setTimeout(() => {
      const el = document.getElementById('msg-' + targetMessageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    const clearTimer = setTimeout(() => {
      setTargetMessageId(null);
    }, 3500);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [targetMessageId, messages, setTargetMessageId]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-background/50">
        <div className="w-16 h-16 rounded-3xl bg-surface border border-border shadow-elevated flex items-center justify-center mb-4 text-primary">
          <MindChatAIIcon size={36} animate />
        </div>
        <h3 className="text-xl font-bold text-text-primary">MindChat Active Workspace</h3>
        <p className="text-xs text-text-secondary max-w-sm mt-2 leading-relaxed">
          Select a conversation from the left to start messaging. AI automatically identifies tasks, deadlines, and decisions for your review.
        </p>
      </div>
    );
  }

  const handleSendMessage = (text: string, options?: { durationSeconds?: number }) => {
    sendMessage(text, {
      durationSeconds: options?.durationSeconds,
      replyToMessageId: replyingTo?.id,
    });
    setReplyingTo(null);
  };

  const pendingScheduledThisChat = scheduledMessages.filter(
    s => s.chat_id === activeChat.id && s.status === 'pending'
  );

  return (
    <div className="flex-1 flex h-full min-w-0 bg-background/40 overflow-hidden relative">
      {/* Central Chat Stream */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header */}
        <ChatHeader
          onOpenSummary={onOpenSummary}
          onStartCall={onStartCall}
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        />

        {/* Scheduled Message Banner if pending for this conversation */}
        {pendingScheduledThisChat.length > 0 && (
          <div className="px-4 py-2 bg-secondary/10 border-b border-secondary/20 flex items-center justify-between text-xs text-secondary animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-secondary" />
              <span>
                <strong>{pendingScheduledThisChat.length}</strong> scheduled message{pendingScheduledThisChat.length > 1 ? 's' : ''} in queue for this chat.
              </span>
            </div>
            <button
              onClick={() => setShowScheduledModal(true)}
              className="text-xs font-bold underline hover:text-secondary-hover"
            >
              View & Edit
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
          {/* Welcome chat header notice */}
          <div className="text-center py-4 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary/70 border border-border text-[11px] text-text-secondary">
              <MindChatAIIcon size={13} />
              <span>MindChat Encrypted Session • AI Analysis Active</span>
            </div>
          </div>

          {messages.map(msg => {
            const isSender = msg.sender_id === currentUser.id;
            const sender = isSender 
              ? currentUser 
              : contacts.find(c => c.id === msg.sender_id) || activeChat.members?.find(m => m.id === msg.sender_id);

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                sender={sender}
                isSender={isSender}
                isHighlighted={msg.id === targetMessageId}
                onReply={m => setReplyingTo(m)}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSend={handleSendMessage}
        />
      </div>

      {/* Optional Smart Info Panel on Right */}
      {isRightPanelOpen && (
        <SmartInfoPanel
          onClose={() => setIsRightPanelOpen(false)}
          onOpenSummary={onOpenSummary}
          onSelectMemory={onSelectMemory}
        />
      )}

      {/* Scheduled Messages Manager Modal */}
      <ScheduledMessagesManagerModal
        isOpen={showScheduledModal}
        onClose={() => setShowScheduledModal(false)}
      />
    </div>
  );
};
