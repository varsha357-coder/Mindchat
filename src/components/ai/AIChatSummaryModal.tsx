import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MindChatAIIcon } from '../common/MindChatLogo';
import { useAI } from '../../contexts/AIContext';
import { useChat } from '../../contexts/ChatContext';
import { 
  CheckCircle, Calendar, Clock, Sparkles, 
  ExternalLink, ListChecks, FileText 
} from 'lucide-react';
import { ChatSummaryOutput } from '../../types/ai';

interface AIChatSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatSummaryModal: React.FC<AIChatSummaryModalProps> = ({ isOpen, onClose }) => {
  const { activeChat, activeChatId } = useChat();
  const { generateSummary } = useAI();

  const [period, setPeriod] = useState<'today' | '7_days' | 'entire'>('entire');
  const [summary, setSummary] = useState<ChatSummaryOutput | null>(() => {
    return activeChatId ? generateSummary(activeChatId, 'entire') : null;
  });

  const handlePeriodChange = (p: 'today' | '7_days' | 'entire') => {
    setPeriod(p);
    if (activeChatId) {
      setSummary(generateSummary(activeChatId, p));
    }
  };

  if (!activeChat) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <MindChatAIIcon size={18} animate />
          <span>AI Chat Summary — {activeChat.name || 'Conversation'}</span>
        </div>
      }
      size="lg"
    >
      <div className="space-y-6 select-none">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-secondary border border-border">
          {(['entire', '7_days', 'today'] as const).map(p => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-surface text-primary shadow-sm border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p === 'entire' ? 'Entire Conversation' : p === '7_days' ? 'Last 7 Days' : 'Today'}
            </button>
          ))}
        </div>

        {summary && (
          <div className="space-y-5 animate-fade-in text-xs">
            {/* Main Topics */}
            <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border space-y-2">
              <span className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                <FileText size={14} className="text-primary" />
                <span>Main Topics Discussed</span>
              </span>
              <ul className="space-y-1.5 pl-5 list-disc text-text-secondary">
                {summary.mainTopics.map((topic, i) => (
                  <li key={i} className="leading-relaxed font-medium text-text-primary">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            {/* Decisions Finalized */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 space-y-2">
              <span className="font-bold text-primary-light flex items-center gap-1.5 text-xs">
                <Sparkles size={14} />
                <span>Decisions Finalized</span>
              </span>
              <ul className="space-y-1 pl-4 list-disc text-text-primary">
                {summary.decisions.map((dec, i) => (
                  <li key={i} className="leading-relaxed">
                    {dec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Upcoming Deadlines */}
            {summary.deadlines.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <span className="font-bold text-amber-500 flex items-center gap-1.5 text-xs">
                  <Calendar size={14} />
                  <span>Important Deadlines</span>
                </span>
                <div className="space-y-1.5">
                  {summary.deadlines.map((dl, i) => (
                    <div key={i} className="flex items-center justify-between font-medium text-text-primary">
                      <span>• {dl.title}</span>
                      <span className="font-bold text-amber-500">{dl.due}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks & Action Items */}
            <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border space-y-2">
              <span className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                <ListChecks size={14} className="text-secondary" />
                <span>Action Items & Tasks</span>
              </span>
              <div className="space-y-2">
                {summary.actionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-text-secondary">
                    <CheckCircle size={14} className="text-secondary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Summary
          </Button>
        </div>
      </div>
    </Modal>
  );
};
