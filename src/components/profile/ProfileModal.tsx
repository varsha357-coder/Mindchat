import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Tag, Plus, User, Shield, Camera } from 'lucide-react';
import { OnlineStatus } from '../../types/database';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, addTag, removeTag } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [username, setUsername] = useState(currentUser.username);
  const [about, setAbout] = useState(currentUser.about);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>(currentUser.online_status);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    updateProfile({
      display_name: displayName,
      username,
      about,
      online_status: onlineStatus,
    });
    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile & Identity" size="md">
      <div className="space-y-5 text-xs select-none">
        {/* Avatar & Online status header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-secondary/70 border border-border">
          <div className="relative">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.display_name}
              className="w-16 h-16 rounded-2xl object-cover border border-border"
            />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-primary">{currentUser.display_name}</h3>
            <p className="text-text-muted mt-0.5">@{currentUser.username}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2.5 h-2.5 rounded-full ${onlineStatus === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              <select
                value={onlineStatus}
                onChange={e => setOnlineStatus(e.target.value as OnlineStatus)}
                className="bg-surface border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-primary focus:outline-none"
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="dnd">Do Not Disturb</option>
                <option value="offline">Invisible</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div>
          <label className="block font-semibold text-text-secondary mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block font-semibold text-text-secondary mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block font-semibold text-text-secondary mb-1">About / Bio</label>
          <input
            type="text"
            value={about}
            onChange={e => setAbout(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Capsule Tags Management */}
        <div className="p-4 rounded-2xl bg-surface-secondary/40 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary flex items-center gap-1.5">
              <Tag size={14} className="text-primary" />
              <span>Custom Capsule Tags</span>
            </span>
            <span className="text-[10px] text-text-muted">Click tag to remove</span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-8">
            {(currentUser.tags || []).map(t => (
              <span
                key={t}
                onClick={() => removeTag(t)}
                className="profile-tag cursor-pointer hover:bg-danger/20 hover:text-danger hover:border-danger/30 transition-colors"
                title="Remove tag"
              >
                [{t}] ×
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTag();
              }}
              placeholder="Add tag (e.g. [NLP], [Student])..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-primary"
            />
            <Button variant="secondary" size="sm" onClick={handleAddTag}>
              Add Tag
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Profile
          </Button>
        </div>
      </div>
    </Modal>
  );
};
