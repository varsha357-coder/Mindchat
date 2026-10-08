import React, { useState } from 'react';
import { 
  Phone, Video, Users, PhoneIncoming, PhoneOutgoing, PhoneMissed, 
  Trash2, MessageSquare, Search, Plus, Grid, Shield, ArrowUpRight, 
  ArrowDownLeft, Clock, Calendar 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { CallRecord, Profile } from '../../types/database';
import { formatTime, formatTimerCountdown, getInitials } from '../../lib/utils';
import { GroupConferenceModal } from './GroupConferenceModal';

interface CallsViewProps {
  onStartCall: (type: 'voice' | 'video', contact?: Profile) => void;
  onOpenChatWithContact?: (contact: Profile) => void;
}

export const CallsView: React.FC<CallsViewProps> = ({
  onStartCall,
  onOpenChatWithContact,
}) => {
  const { callRecords, deleteCallRecord, contacts } = useChat();
  const { currentUser } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'all' | 'missed' | 'incoming' | 'outgoing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [dialedDigits, setDialedDigits] = useState('');
  const [showConferenceModal, setShowConferenceModal] = useState(false);
  const [selectedCallTarget, setSelectedCallTarget] = useState<Profile | null>(null);

  // Filter records
  const filteredRecords = callRecords.filter(record => {
    const isCaller = record.caller_id === currentUser.id;
    const isReceiver = record.receiver_id === currentUser.id;
    const peer = isCaller ? record.receiver : record.caller;
    const peerName = peer?.display_name?.toLowerCase() || '';

    // Search filter
    if (searchQuery.trim() && !peerName.includes(searchQuery.toLowerCase().trim())) {
      return false;
    }

    if (activeFilter === 'missed') {
      return record.status === 'missed' || record.status === 'rejected';
    }
    if (activeFilter === 'incoming') {
      return isReceiver;
    }
    if (activeFilter === 'outgoing') {
      return isCaller;
    }
    return true;
  });

  const missedCount = callRecords.filter(r => r.status === 'missed').length;

  const handleDialDigit = (digit: string) => {
    setDialedDigits(prev => prev + digit);
  };

  const handleBackspace = () => {
    setDialedDigits(prev => prev.slice(0, -1));
  };

  const handleStartCallWithTarget = (type: 'voice' | 'video', target?: Profile) => {
    const contactToCall = target || contacts[0];
    onStartCall(type, contactToCall);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-y-auto p-6 md:p-8 select-none animate-fade-in">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header & Primary Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-glow-primary">
                <Phone size={18} />
              </div>
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Calls & Conferences</h1>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Dial contacts, review call logs, or launch encrypted voice & video conferences.
            </p>
          </div>

          {/* Three Main Action Buttons: Voice Call, Video Call, and Group Conference Call */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleStartCallWithTarget('voice')}
              className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-text-primary text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
              title="Start a Voice Call"
            >
              <Phone size={14} className="text-primary" />
              <span>Voice Call</span>
            </button>

            <button
              onClick={() => handleStartCallWithTarget('video')}
              className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
              title="Start a Video Call"
            >
              <Video size={14} />
              <span>Video Call</span>
            </button>

            <button
              onClick={() => setShowConferenceModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold flex items-center gap-2 shadow-glow-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Start a Group Conference Call"
            >
              <Users size={14} />
              <span>Group Conference Call</span>
            </button>

            <button
              onClick={() => setShowKeypad(!showKeypad)}
              className={`p-2 rounded-xl border transition-colors ${
                showKeypad
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface hover:bg-surface-secondary text-text-secondary border-border'
              }`}
              title="Toggle Dialpad"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Dialpad Accordion / Drawer if open */}
        {showKeypad && (
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-elevated max-w-sm mx-auto space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Quick Keypad Dialer</span>
              <button onClick={() => setShowKeypad(false)} className="text-xs text-text-muted hover:text-text-primary">Close</button>
            </div>

            {/* Display Digits */}
            <div className="h-12 px-4 rounded-2xl bg-surface-secondary border border-border flex items-center justify-between text-lg font-mono font-bold text-text-primary">
              <span>{dialedDigits || 'Enter digits...'}</span>
              {dialedDigits && (
                <button onClick={handleBackspace} className="text-xs text-text-muted hover:text-danger">⌫</button>
              )}
            </div>

            {/* Dialpad Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                <button
                  key={digit}
                  onClick={() => handleDialDigit(digit)}
                  className="h-12 rounded-2xl bg-surface hover:bg-surface-secondary border border-border text-base font-bold text-text-primary hover:border-primary/50 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleStartCallWithTarget('voice');
                  setShowKeypad(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-success text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-success/90 transition-all"
              >
                <Phone size={14} />
                <span>Call Voice</span>
              </button>
              <button
                onClick={() => {
                  handleStartCallWithTarget('video');
                  setShowKeypad(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-hover transition-all"
              >
                <Video size={14} />
                <span>Call Video</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Pills and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface border border-border w-fit">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All Calls ({callRecords.length})
            </button>
            <button
              onClick={() => setActiveFilter('missed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeFilter === 'missed'
                  ? 'bg-danger/15 text-danger border border-danger/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>Missed</span>
              {missedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center">
                  {missedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('incoming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'incoming'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Incoming
            </button>
            <button
              onClick={() => setActiveFilter('outgoing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'outgoing'
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Outgoing
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by contact name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Dial-style Call List */}
        <div className="space-y-2.5">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-3xl bg-surface/40 border border-border/60">
              <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-border flex items-center justify-center mx-auto mb-3 text-text-muted">
                <Phone size={24} />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1">No call records found</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Use Voice Call or Video Call to connect with contacts. All call activities are securely logged in Supabase.
              </p>
            </div>
          ) : (
            filteredRecords.map(record => {
              const isOutgoing = record.caller_id === currentUser.id;
              const isMissed = record.status === 'missed' || record.status === 'rejected';
              const peer = isOutgoing ? record.receiver : record.caller;
              const peerName = peer?.display_name || 'Contact';
              const peerAvatar = peer?.avatar_url;

              // Format date
              const callDate = new Date(record.created_at);
              const isToday = new Date().toDateString() === callDate.toDateString();
              const dateStr = isToday
                ? `Today, ${callDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                : `${callDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${callDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;

              // Duration text
              const durationStr = isMissed 
                ? 'Missed Call' 
                : record.duration_seconds > 0 
                  ? formatTimerCountdown(record.duration_seconds) 
                  : 'Not Answered';

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex items-center justify-between shadow-subtle group hover:bg-surface-secondary/40"
                >
                  {/* Left: Contact Info + Direction Icon */}
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {peerAvatar ? (
                        <img
                          src={peerAvatar}
                          alt={peerName}
                          className="w-12 h-12 rounded-2xl object-cover border border-border shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center shadow-sm">
                          {getInitials(peerName)}
                        </div>
                      )}

                      {/* Direction / Status Badge Over Avatar */}
                      <span className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow-sm ${
                        isMissed
                          ? 'bg-danger'
                          : isOutgoing
                            ? 'bg-primary'
                            : 'bg-success'
                      }`}>
                        {isMissed ? (
                          <PhoneMissed size={10} />
                        ) : isOutgoing ? (
                          <ArrowUpRight size={10} />
                        ) : (
                          <ArrowDownLeft size={10} />
                        )}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-0.5 truncate min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm truncate ${
                          isMissed ? 'text-danger' : 'text-text-primary'
                        }`}>
                          {peerName}
                        </span>

                        {/* Call Type Icon */}
                        {record.call_type === 'video' ? (
                          <span className="p-1 rounded-md bg-secondary/10 text-secondary" title="Video Call">
                            <Video size={12} />
                          </span>
                        ) : (
                          <span className="p-1 rounded-md bg-surface-secondary text-text-muted" title="Voice Call">
                            <Phone size={12} />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span className={`font-medium ${isMissed ? 'text-danger font-semibold' : 'text-text-secondary'}`}>
                          {durationStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Voice Call Back */}
                    <button
                      onClick={() => handleStartCallWithTarget('voice', peer)}
                      className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-text-primary hover:text-primary transition-colors border border-border"
                      title="Call back (Voice)"
                    >
                      <Phone size={14} />
                    </button>

                    {/* Video Call Back */}
                    <button
                      onClick={() => handleStartCallWithTarget('video', peer)}
                      className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                      title="Call back (Video)"
                    >
                      <Video size={14} />
                    </button>

                    {/* Open Direct Chat */}
                    {peer && onOpenChatWithContact && (
                      <button
                        onClick={() => onOpenChatWithContact(peer)}
                        className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors border border-border"
                        title="Send Message"
                      >
                        <MessageSquare size={14} />
                      </button>
                    )}

                    {/* Delete Call Record */}
                    <button
                      onClick={() => deleteCallRecord(record.id)}
                      className="p-2.5 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                      title="Delete Call Log"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Group Conference Call Modal */}
      <GroupConferenceModal
        isOpen={showConferenceModal}
        onClose={() => setShowConferenceModal(false)}
      />
    </div>
  );
};
