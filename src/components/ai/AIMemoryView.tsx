import React, { useState } from 'react';
import { 
  Brain, Search, Plus, Trash2, Edit3, ExternalLink, 
  Calendar, CheckSquare, Clock, AlertCircle, FileText, Sparkles, Filter 
} from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useChat } from '../../contexts/ChatContext';
import { MemoryCategory, AIMemory } from '../../types/database';
import { MindChatAIIcon } from '../common/MindChatLogo';
import { formatFullDateTime } from '../../lib/utils';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const AIMemoryView: React.FC<{ onJumpToChat?: (chatId: string) => void }> = ({ onJumpToChat }) => {
  const { memories, deleteMemory, updateMemory } = useAI();
  const { selectChat } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingMemory, setEditingMemory] = useState<AIMemory | null>(null);

  const categories: { id: string; label: string; icon: any }[] = [
    { id: 'all', label: 'All Memories', icon: Brain },
    { id: 'deadlines', label: 'Deadlines', icon: Clock },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'decisions', label: 'Decisions', icon: Sparkles },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'reminders', label: 'Reminders', icon: AlertCircle },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  const filteredMemories = memories.filter(mem => {
    if (selectedCategory !== 'all' && mem.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        mem.title.toLowerCase().includes(q) ||
        mem.content.toLowerCase().includes(q) ||
        mem.source_chat_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenSource = (chatId: string) => {
    selectChat(chatId);
    if (onJumpToChat) onJumpToChat(chatId);
  };

  const getCategoryColor = (cat: MemoryCategory) => {
    switch (cat) {
      case 'deadlines': return 'bg-amber-500/10 text-amber-500 border-amber-500/25';
      case 'tasks': return 'bg-primary/10 text-primary-light border-primary/25';
      case 'events': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25';
      case 'decisions': return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      default: return 'bg-surface-secondary text-text-secondary border-border';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-y-auto p-6 md:p-8 animate-fade-in select-none">
      {/* Top Banner / Hero */}
      <div className="max-w-6xl mx-auto w-full mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-glow-primary">
                <MindChatAIIcon size={20} animate />
              </div>
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
                AI Memory
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Information extracted from your conversations and approved by you. Never lose deadlines or action items again.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-secondary border border-border text-text-secondary">
              Total Saved: <strong className="text-text-primary">{memories.length}</strong>
            </span>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your memories, titles, or meetings..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 shadow-subtle transition-colors"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map(c => {
              const Icon = c.icon;
              const isActive = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-white shadow-glow-primary'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <Icon size={13} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="max-w-6xl mx-auto w-full flex-1">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-20 bg-surface/40 rounded-3xl border border-border p-8">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary border border-border flex items-center justify-center mx-auto mb-4 text-text-muted">
              <Brain size={32} />
            </div>
            <h3 className="text-base font-bold text-text-primary">No memories found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No saved memories match your search filter.'
                : 'MindChat will automatically detect deadlines and tasks in your chat for you to approve.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMemories.map(mem => (
              <div
                key={mem.id}
                className="group relative p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 shadow-subtle hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Pill + Action Buttons */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryColor(mem.category)}`}>
                      {mem.category}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingMemory(mem)}
                        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary"
                        title="Edit memory"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => deleteMemory(mem.id)}
                        className="p-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10"
                        title="Delete memory"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Content */}
                  <h3 className="text-base font-bold text-text-primary mb-2 leading-snug">
                    {mem.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                    {mem.content}
                  </p>
                </div>

                {/* Footer Metadata & Link to Chat */}
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                  <div className="truncate pr-2">
                    <span className="block text-[10px] uppercase font-semibold text-text-muted">From:</span>
                    <span className="font-medium text-text-primary truncate">{mem.source_chat_name || 'Conversation'}</span>
                  </div>

                  <button
                    onClick={() => handleOpenSource(mem.source_chat_id)}
                    className="flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors shrink-0"
                  >
                    <span>Open Message</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Memory Modal */}
      {editingMemory && (
        <Modal
          isOpen={true}
          onClose={() => setEditingMemory(null)}
          title="Edit AI Memory Item"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Title</label>
              <input
                type="text"
                value={editingMemory.title}
                onChange={e => setEditingMemory({ ...editingMemory, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Content / Details</label>
              <textarea
                rows={3}
                value={editingMemory.content}
                onChange={e => setEditingMemory({ ...editingMemory, content: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingMemory(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  updateMemory(editingMemory.id, editingMemory);
                  setEditingMemory(null);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
