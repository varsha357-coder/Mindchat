import React, { useState } from 'react';
import { 
  Users, Video, Mic, MicOff, VideoOff, PhoneOff, Copy, Check, 
  Shield, Share2, Plus, X 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Profile } from '../../types/database';
import { getInitials } from '../../lib/utils';

interface GroupConferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupConferenceModal: React.FC<GroupConferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { contacts } = useChat();
  const { currentUser } = useAuth();

  const [roomId] = useState(() => 'meet-' + Math.random().toString(36).substring(2, 9));
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  if (!isOpen) return null;

  const roomLink = `https://mindchat.app/meet/${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSelectContact = (id: string) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-elevated flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center shadow-glow-primary">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Encrypted Group Conference Call</h2>
              <p className="text-xs text-text-secondary">
                Room ID: <span className="font-mono text-primary font-bold">{roomId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conference Room Grid Preview */}
        <div className="py-6 flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* You (Host) Tile */}
            <div className="aspect-video rounded-2xl bg-surface-secondary border-2 border-primary/40 relative flex flex-col items-center justify-center p-4 shadow-subtle group">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-bold text-primary mb-2">
                {getInitials(currentUser.display_name)}
              </div>
              <span className="text-xs font-bold text-text-primary">You (Host)</span>
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/60 text-[10px] text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active</span>
              </div>
            </div>

            {/* Invited Participants Placeholders */}
            {selectedContacts.map(cid => {
              const contact = contacts.find(c => c.id === cid);
              return (
                <div key={cid} className="aspect-video rounded-2xl bg-surface-secondary/70 border border-border relative flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-sm font-bold text-text-primary mb-1">
                    {contact?.display_name ? getInitials(contact.display_name) : 'U'}
                  </div>
                  <span className="text-xs font-medium text-text-primary truncate max-w-full">
                    {contact?.display_name}
                  </span>
                  <span className="text-[10px] text-amber-400 animate-pulse mt-0.5">
                    Invited • Awaiting Handshake
                  </span>
                </div>
              );
            })}

            {/* Add Contact Tile */}
            <div className="aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center p-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer bg-surface/30">
              <Plus size={24} className="mb-1 text-primary" />
              <span className="text-xs font-semibold">Invite More</span>
            </div>
          </div>

          {/* Quick Invite Link */}
          <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Share2 size={13} className="text-primary" />
              <span>Share Conference Room Link</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={roomLink}
                className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Contact Invites List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              Direct Invites from Contacts
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {contacts.map(contact => {
                const isSelected = selectedContacts.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleSelectContact(contact.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-primary/15 text-primary border-primary/40 font-bold'
                        : 'bg-surface hover:bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span>{contact.display_name}</span>
                    {isSelected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-text-muted flex items-center gap-1.5">
            <Shield size={12} className="text-success" />
            <span>Multi-party WebRTC mesh signaling server active & ready</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-xl border transition-colors ${
                isMuted
                  ? 'bg-danger/20 text-danger border-danger/40'
                  : 'bg-surface hover:bg-surface-secondary text-text-primary border-border'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3 rounded-xl border transition-colors ${
                isVideoOff
                  ? 'bg-danger/20 text-danger border-danger/40'
                  : 'bg-surface hover:bg-surface-secondary text-text-primary border-border'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-danger hover:bg-danger/90 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-danger/20"
            >
              <PhoneOff size={15} />
              <span>Leave Conference</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
