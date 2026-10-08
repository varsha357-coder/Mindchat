import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Search, Sparkles, MessageSquare, ArrowRight, CornerDownRight } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useChat } from '../../contexts/ChatContext';
import { MindChatAIIcon } from '../common/MindChatLogo';
import { formatTime } from '../../lib/utils';
import { AISearchResultItem } from '../../types/ai';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToMessage: (chatId: string, messageId: string) => void;
}

export const AISearchModal: React.FC<AISearchModalProps> = ({
  isOpen,
  onClose,
  onJumpToMessage,
}) => {
  const { searchNL } = useAI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AISearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const sampleQueries = [
    'When is our project review?',
    'What did Rahul say about the PPT?',
    'Did someone ask about college in Kannada?',
    'Find secret API access key',
  ];

  const handleSearch = (q: string) => {
    setQuery(q);
    const res = searchNL(q);
    setResults(res);
    setHasSearched(true);
  };

  const handleSelectResult = (item: AISearchResultItem) => {
    onJumpToMessage(item.message.chat_id, item.message.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <MindChatAIIcon size={18} animate />
          <span>AI Natural-Language Chat Search</span>
        </div>
      }
      size="lg"
    >
      <div className="space-y-5 select-none">
        <p className="text-xs text-text-secondary leading-relaxed">
          Ask questions in plain English or Indian phrases. MindChat searches across your authorized conversation history.
        </p>

        {/* Input Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            placeholder="Ask a question (e.g. 'When is our project review?')..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary/60 shadow-subtle"
            autoFocus
          />
        </div>

        {/* Sample queries pills */}
        {!hasSearched && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Try asking:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map(sq => (
                <button
                  key={sq}
                  onClick={() => handleSearch(sq)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-surface-secondary/70 border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-colors"
                >
                  "{sq}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            <span className="text-[11px] font-semibold text-text-muted">
              Found {results.length} relevant {results.length === 1 ? 'message' : 'messages'}
            </span>

            {results.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-muted">
                No matching messages found for this query in your authorized conversations.
              </div>
            ) : (
              results.map((res, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectResult(res)}
                  className="p-3.5 rounded-2xl bg-surface-secondary/60 border border-border hover:border-primary/40 cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-text-primary">
                      <MessageSquare size={13} className="text-primary" />
                      <span>{res.chatName}</span>
                      <span className="text-text-muted font-normal">• from {res.senderName}</span>
                    </div>
                    <span className="text-text-muted">{formatTime(res.message.created_at)}</span>
                  </div>

                  <p className="text-xs text-text-primary font-medium line-clamp-2">
                    "{res.matchedSnippet}"
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-secondary font-semibold flex items-center gap-1">
                      <CornerDownRight size={10} />
                      {res.extractedContext}
                    </span>
                    <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Open Message <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
