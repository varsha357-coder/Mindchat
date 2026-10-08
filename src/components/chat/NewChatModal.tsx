import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Users, User, Check, MessageSquare } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { contacts, createChat, selectChat, startDirectChat } = useChat();
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const handleToggleContact = (id: string) => {
    if (chatType === 'direct') {
      setSelectedContactIds([id]);
    } else {
      setSelectedContactIds(prev =>
        prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      );
    }
  };

  const handleCreate = async () => {
    if (chatType === 'direct') {
      if (selectedContactIds.length === 0) return;
      const targetUser = contacts.find(c => c.id === selectedContactIds[0]);
      if (targetUser) {
        await startDirectChat(targetUser);
      }
    } else {
      if (!groupName.trim()) return;
      const newChat = await createChat('group', groupName.trim(), selectedContactIds);
      selectChat(newChat.id);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Conversation"
      size="md"
    >
      <div className="space-y-5 text-xs select-none">
        {/* Type Selector */}
        <div className="flex gap-2 p-1 rounded-xl bg-surface-secondary border border-border">
          <button
            onClick={() => {
              setChatType('direct');
              setSelectedContactIds([]);
            }}
            className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              chatType === 'direct'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <User size={15} />
            <span>Direct Chat</span>
          </button>
          <button
            onClick={() => {
              setChatType('group');
              setSelectedContactIds([]);
            }}
            className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              chatType === 'group'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users size={15} />
            <span>New Group</span>
          </button>
        </div>

        {/* Group Name input if group */}
        {chatType === 'group' && (
          <div>
            <label className="block font-semibold text-text-secondary mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. AI Capstone Presentation Group"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Contact selection */}
        <div>
          <label className="block font-semibold text-text-secondary mb-2">
            {chatType === 'direct' ? 'Select Contact' : 'Select Group Members'}
          </label>
          <div className="max-h-56 overflow-y-auto space-y-1.5">
            {contacts.map(c => {
              const isSelected = selectedContactIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => handleToggleContact(c.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-text-primary font-semibold'
                      : 'bg-surface-secondary/50 border-border text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={c.display_name}
                      className="w-8 h-8 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-text-primary">{c.display_name}</div>
                      <div className="text-[10px] text-text-muted">{c.about}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="ai"
            size="sm"
            disabled={chatType === 'direct' ? selectedContactIds.length === 0 : !groupName.trim()}
            onClick={handleCreate}
          >
            Create {chatType === 'group' ? 'Group' : 'Chat'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
