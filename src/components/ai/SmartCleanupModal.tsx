import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Trash2, AlertTriangle, CheckSquare, Square, Sparkles } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useChat } from '../../contexts/ChatContext';

interface SmartCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CleanupItem {
  id: string;
  sender: string;
  text: string;
  reason: string;
  chatName: string;
}

export const SmartCleanupModal: React.FC<SmartCleanupModalProps> = ({ isOpen, onClose }) => {
  const { runCleanup } = useAI();
  const { chats, allMessages } = useChat();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  // Synthesize candidate cleanup messages from chat history
  const candidateItems: CleanupItem[] = [];

  Object.entries(allMessages).forEach(([chatId, msgs]) => {
    const chat = chats.find(c => c.id === chatId);
    msgs.forEach(m => {
      if (m.is_expired) {
        candidateItems.push({
          id: m.id,
          sender: 'You',
          text: '⏱ Expired ephemeral message',
          reason: 'Expired Temporary',
          chatName: chat?.name || 'Chat',
        });
      } else if (
        m.content.toLowerCase().startsWith('hi') || 
        m.content.toLowerCase().startsWith('ok') || 
        m.content.toLowerCase().startsWith('cool') ||
        m.content.length < 15
      ) {
        candidateItems.push({
          id: m.id,
          sender: m.sender_id === 'usr_me_001' ? 'You' : 'Peer',
          text: m.content,
          reason: 'Casual Greeting / Small Talk',
          chatName: chat?.name || 'Chat',
        });
      }
    });
  });

  // Fallback demo items to match prompt's "127 messages" concept
  const items = candidateItems.length > 0 ? candidateItems : [
    { id: 'cl_1', sender: 'Rahul', text: 'ok cool', reason: 'Casual Small Talk', chatName: 'Rahul' },
    { id: 'cl_2', sender: 'You', text: 'Hey are you free?', reason: 'Expired Check-in', chatName: 'Varsha' },
    { id: 'cl_3', sender: 'Bhumika', text: '👍', reason: 'Reaction only', chatName: 'Bhumika' },
    { id: 'cl_4', sender: 'You', text: 'Got it thanks!', reason: 'Short acknowledgement', chatName: 'College Group' },
  ];

  const handleToggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleDelete = () => {
    runCleanup(Array.from(selectedIds));
    setShowConfirm(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-secondary" />
          <span>Smart Chat Cleanup</span>
        </div>
      }
      size="lg"
    >
      <div className="space-y-4">
        {/* Warning / Philosophy Header */}
        <div className="p-3.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-secondary flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-text-primary">
              MindChat never deletes messages automatically.
            </p>
            <p className="mt-0.5">
              Review each item below. Only selected messages will be permanently cleaned up after your explicit confirmation.
            </p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
          >
            {selectedIds.size === items.length ? (
              <CheckSquare size={16} className="text-primary" />
            ) : (
              <Square size={16} />
            )}
            <span>Select All ({items.length})</span>
          </button>

          <span className="text-xs text-text-muted">
            {selectedIds.size} of {items.length} selected
          </span>
        </div>

        {/* Message List */}
        <div className="max-h-64 overflow-y-auto space-y-2 p-1">
          {items.map(item => {
            const isChecked = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  isChecked
                    ? 'bg-primary/10 border-primary/40 text-text-primary'
                    : 'bg-surface-secondary/40 border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-primary focus:ring-0 shrink-0"
                  />
                  <div className="truncate">
                    <span className="font-semibold text-text-primary mr-1.5">{item.sender}:</span>
                    <span>"{item.text}"</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted">
                    {item.reason}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Keep Everything
          </Button>

          <Button
            variant="danger"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 size={14} className="mr-1.5" />
            <span>Delete Selected ({selectedIds.size})</span>
          </Button>
        </div>

        {/* Secondary Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="p-6 rounded-2xl bg-surface border border-border max-w-sm w-full text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <h4 className="font-bold text-base text-text-primary">Confirm Deletion</h4>
              <p className="text-xs text-text-secondary">
                Are you sure you want to delete {selectedIds.size} selected messages? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={handleDelete}>
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
