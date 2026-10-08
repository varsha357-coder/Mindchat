import React, { useState, useEffect } from 'react';
import { Search, UserPlus, ShieldAlert, Ban, Check, MessageSquare, Tag, User, Globe, Sparkles } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Profile } from '../../types/database';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export const ContactsView: React.FC<{ onStartDirectChat: (contact: Profile) => void }> = ({
  onStartDirectChat,
}) => {
  const { contacts, blockedContacts, addContact, blockUser, unblockUser, searchRegisteredUsers, startDirectChat } = useChat();
  const { isBackendConnected } = useAuth();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfileModal, setSelectedProfileModal] = useState<Profile | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [selectedTag, setSelectedTag] = useState('AI/ML');

  // Live search debouncer for registered users
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchRegisteredUsers(q);
        setSearchResults(found);
      } catch (e) {
        console.error('Error searching:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // Combined contacts to display
  const displayList = search.trim() ? searchResults : contacts;

  const handleAddNew = () => {
    if (!newDisplayName.trim()) return;
    const newProfile: Profile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      username: newUsername || newDisplayName.toLowerCase().replace(/\s+/g, '_'),
      display_name: newDisplayName.trim(),
      about: 'Student & Tech Enthusiast',
      online_status: 'online',
      last_seen: new Date().toISOString(),
      preferred_language: 'en',
      ai_analysis_enabled: true,
      tags: [selectedTag, 'Developer'],
      created_at: new Date().toISOString(),
    };
    addContact(newProfile);
    setNewDisplayName('');
    setNewUsername('');
    setShowAddModal(false);
  };

  const handleStartChat = async (user: Profile) => {
    await startDirectChat(user);
    onStartDirectChat(user);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-y-auto p-6 md:p-8 select-none animate-fade-in">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Registered Users & Contacts</h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              {isBackendConnected
                ? 'Search all registered users in Supabase, inspect their profiles, and start real-time private chats.'
                : 'Connect with peers, view custom tags, and start private conversations.'}
            </p>
          </div>

          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} className="mr-1.5" />
            <span>Add Contact</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search registered users by username (@alice) or name..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 shadow-subtle"
          />
          {isSearching && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">
              Searching...
            </span>
          )}
        </div>

        {/* Results title if searching */}
        {search.trim() && (
          <div className="text-xs font-semibold text-text-muted">
            Found {displayList.length} matching {displayList.length === 1 ? 'user' : 'users'} for "{search}"
          </div>
        )}

        {/* Contact / User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayList.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs text-text-muted bg-surface/40 rounded-2xl border border-border">
              {search.trim() ? 'No registered users match your query.' : 'No contacts found.'}
            </div>
          ) : (
            displayList.map(contact => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all flex items-start justify-between shadow-subtle group"
              >
                <div 
                  className="flex items-center gap-3.5 cursor-pointer min-w-0"
                  onClick={() => setSelectedProfileModal(contact)}
                >
                  <img
                    src={contact.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={contact.display_name}
                    className="w-12 h-12 rounded-2xl object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-text-primary hover:text-primary transition-colors truncate">
                        {contact.display_name}
                      </h3>
                      {contact.online_status === 'online' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
                      )}
                    </div>
                    <p className="text-[11px] text-primary/80 font-mono">@{contact.username}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">{contact.about || 'MindChat User'}</p>

                    {/* Capsule tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(contact.tags || []).map(t => (
                        <span key={t} className="profile-tag text-[10px] py-0 px-1.5">
                          [{t}]
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Button
                    variant="ai"
                    size="sm"
                    onClick={() => handleStartChat(contact)}
                    title="Start private real-time chat"
                  >
                    <MessageSquare size={14} className="mr-1" />
                    <span>Chat</span>
                  </Button>
                  <button
                    onClick={() => blockUser(contact.id)}
                    className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Block User"
                  >
                    <Ban size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Blocked Users Section if any */}
        {blockedContacts.length > 0 && (
          <div className="pt-6 border-t border-border">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
              Blocked Users ({blockedContacts.length})
            </h4>
            <div className="space-y-2">
              {blockedContacts.map(bc => (
                <div key={bc.id} className="p-3 rounded-xl bg-surface-secondary/40 border border-border flex items-center justify-between text-xs">
                  <span>{bc.display_name}</span>
                  <Button variant="ghost" size="sm" onClick={() => unblockUser(bc.id)}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Profile Detail Modal */}
        {selectedProfileModal && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedProfileModal(null)}
            title="User Profile"
            size="sm"
          >
            <div className="text-center space-y-4 text-xs select-none">
              <img
                src={selectedProfileModal.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={selectedProfileModal.display_name}
                className="w-20 h-20 rounded-3xl mx-auto object-cover border-2 border-primary/30 shadow-elevated"
              />
              <div>
                <h3 className="text-base font-bold text-text-primary">{selectedProfileModal.display_name}</h3>
                <p className="text-primary font-mono text-xs mt-0.5">@{selectedProfileModal.username}</p>
                <p className="text-text-secondary mt-2">{selectedProfileModal.about || 'MindChat User'}</p>
              </div>

              {selectedProfileModal.tags && selectedProfileModal.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {selectedProfileModal.tags.map(t => (
                    <span key={t} className="profile-tag">
                      [{t}]
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-border flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedProfileModal(null)}
                >
                  Close
                </Button>
                <Button
                  variant="ai"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    handleStartChat(selectedProfileModal);
                    setSelectedProfileModal(null);
                  }}
                >
                  <MessageSquare size={14} className="mr-1" />
                  <span>Start Private Chat</span>
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Add Contact Modal */}
        {showAddModal && (
          <Modal
            isOpen={true}
            onClose={() => setShowAddModal(false)}
            title="Add New Contact"
          >
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-text-secondary mb-1">Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Vikram Verma"
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-semibold text-text-secondary mb-1">Username / ID</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="vikram_v"
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-semibold text-text-secondary mb-1">Select Capsule Tag</label>
                <select
                  value={selectedTag}
                  onChange={e => setSelectedTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="AI/ML">AI/ML</option>
                  <option value="Student">Student</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="Research">Research</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddNew} disabled={!newDisplayName.trim()}>
                  Save Contact
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
