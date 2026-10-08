import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Plus, Eye, Clock, X, Send, Sparkles } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatTime, getInitials } from '../../lib/utils';
import { StatusItem } from '../../types/database';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose }) => {
  const { statuses, addStatus } = useChat();
  const { currentUser } = useAuth();

  const [activeStatus, setActiveStatus] = useState<StatusItem | null>(null);
  const [newStatusText, setNewStatusText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handlePostStatus = () => {
    if (!newStatusText.trim()) return;
    addStatus(newStatusText.trim(), 'text');
    setNewStatusText('');
    setIsCreating(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MindChat Ephemeral Status"
      size="md"
    >
      <div className="space-y-6 select-none">
        {/* Creator Banner */}
        <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.display_name}
                className="w-11 h-11 rounded-2xl object-cover border border-border"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                +
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">My Status</div>
              <div className="text-[11px] text-text-muted">Expires in 24 hours</div>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? 'Cancel' : 'Post Status'}
          </Button>
        </div>

        {/* Create Input Box */}
        {isCreating && (
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-3 animate-fade-in">
            <textarea
              rows={2}
              value={newStatusText}
              onChange={e => setNewStatusText(e.target.value)}
              placeholder="What's happening? (Disappears in 24h)"
              className="w-full p-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-primary resize-none"
            />
            <div className="flex justify-end">
              <Button variant="ai" size="sm" onClick={handlePostStatus} disabled={!newStatusText.trim()}>
                <Send size={13} className="mr-1.5" />
                <span>Share 24h Status</span>
              </Button>
            </div>
          </div>
        )}

        {/* Status Feed List */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
            Recent Contact Updates
          </span>

          <div className="space-y-2">
            {statuses.map(st => (
              <div
                key={st.id}
                onClick={() => setActiveStatus(st)}
                className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-0.5 rounded-2xl border-2 border-primary">
                    <img
                      src={st.user?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                      alt={st.user?.display_name || 'User'}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{st.user?.display_name}</h4>
                    <p className="text-xs text-text-secondary truncate max-w-xs mt-0.5">"{st.content}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                  <Clock size={12} />
                  <span>{formatTime(st.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fullscreen Status Story Preview */}
        {activeStatus && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="relative max-w-sm w-full h-[460px] rounded-3xl bg-gradient-to-b from-primary/30 via-surface to-background border border-primary/30 p-6 flex flex-col justify-between text-white shadow-elevated">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeStatus.user?.avatar_url}
                    alt={activeStatus.user?.display_name}
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold">{activeStatus.user?.display_name}</div>
                    <div className="text-[10px] text-slate-300">{formatTime(activeStatus.created_at)}</div>
                  </div>
                </div>
                <button onClick={() => setActiveStatus(null)} className="p-1 rounded-lg hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              <div className="my-auto text-center px-4">
                <p className="text-lg font-medium leading-relaxed">
                  "{activeStatus.content}"
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10">
                <span className="flex items-center gap-1.5">
                  <Eye size={14} />
                  <span>{activeStatus.views_count} views</span>
                </span>
                <span className="text-[11px]">Expires in 24 hours</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
