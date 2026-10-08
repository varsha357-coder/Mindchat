import React, { useState } from 'react';
import { 
  Calendar, Clock, Edit2, Trash2, XCircle, Send, CheckCircle2, 
  AlertCircle, X, RefreshCw, Globe, ChevronRight 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { ScheduledMessage } from '../../types/database';
import { formatTime } from '../../lib/utils';

interface ScheduledMessagesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduledMessagesManagerModal: React.FC<ScheduledMessagesManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    scheduledMessages, 
    editScheduledMessage, 
    rescheduleMessage, 
    cancelScheduledMessage, 
    deleteScheduledMessage, 
    sendScheduledMessageNow, 
    activeChat 
  } = useChat();

  const [filterChatOnly, setFilterChatOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledMessage | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const [reschedulingItem, setReschedulingItem] = useState<ScheduledMessage | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newTimezone, setNewTimezone] = useState('Asia/Kolkata');

  if (!isOpen) return null;

  const displayList = filterChatOnly && activeChat
    ? scheduledMessages.filter(s => s.chat_id === activeChat.id)
    : scheduledMessages;

  const pendingList = displayList.filter(s => s.status === 'pending');
  const pastList = displayList.filter(s => s.status !== 'pending');

  const handleStartEdit = (item: ScheduledMessage) => {
    setEditingItem(item);
    setEditContent(item.content);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editContent.trim()) return;
    await editScheduledMessage(editingItem.id, editContent.trim());
    setEditingItem(null);
  };

  const handleStartReschedule = (item: ScheduledMessage) => {
    setReschedulingItem(item);
    const d = new Date(item.scheduled_for);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    setNewDate(`${yyyy}-${mm}-${dd}`);
    setNewTime(`${hh}:${min}`);
    setNewTimezone(item.timezone || 'Asia/Kolkata');
  };

  const handleSaveReschedule = async () => {
    if (!reschedulingItem || !newDate || !newTime) return;
    const [year, month, day] = newDate.split('-').map(Number);
    const [hours, minutes] = newTime.split(':').map(Number);
    const target = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (target.getTime() <= Date.now()) {
      alert('Selected time must be in the future.');
      return;
    }

    await rescheduleMessage(reschedulingItem.id, target.toISOString(), newTimezone);
    setReschedulingItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-elevated overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface-secondary/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Scheduled Messages Queue</h2>
              <p className="text-xs text-text-secondary">
                Delivered automatically via server-side database job when the scheduled time arrives.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-2.5 bg-surface border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterChatOnly(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                !filterChatOnly
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              All Scheduled ({scheduledMessages.length})
            </button>
            {activeChat && (
              <button
                onClick={() => setFilterChatOnly(true)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterChatOnly
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                This Chat ({scheduledMessages.filter(s => s.chat_id === activeChat.id).length})
              </button>
            )}
          </div>
          <span className="text-[11px] text-text-muted">
            ⚡ Runs offline & server-side
          </span>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {pendingList.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-surface-secondary/30 border border-border/50">
              <Calendar size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-text-primary">No pending scheduled messages</h4>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Use the schedule button in the chat input to schedule messages for future delivery.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Pending Delivery ({pendingList.length})
              </h3>
              {pendingList.map(item => {
                const schedDate = new Date(item.scheduled_for);
                const isDue = schedDate.getTime() <= Date.now();

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all space-y-3 shadow-subtle group"
                  >
                    {/* Item Top row: Chat & Target Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px]">
                          {item.chat_name || 'Direct Chat'}
                        </span>
                        <span className="text-text-muted">•</span>
                        <span className="text-[11px] text-text-secondary flex items-center gap-1">
                          <Globe size={11} />
                          {item.timezone}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
                        <Clock size={13} />
                        <span>
                          {schedDate.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {schedDate.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Message preview */}
                    <div className="p-3 rounded-xl bg-surface-secondary text-xs text-text-primary leading-relaxed font-medium">
                      "{item.content}"
                    </div>

                    {/* Action buttons: Edit, Reschedule, Cancel, Delete, Send Now */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Scheduled Server Job</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Edit Content */}
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] font-semibold text-text-primary flex items-center gap-1 transition-colors"
                          title="Edit message text"
                        >
                          <Edit2 size={11} />
                          <span>Edit</span>
                        </button>

                        {/* Reschedule Date/Time */}
                        <button
                          onClick={() => handleStartReschedule(item)}
                          className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] font-semibold text-text-primary flex items-center gap-1 transition-colors"
                          title="Reschedule delivery date/time"
                        >
                          <Calendar size={11} />
                          <span>Reschedule</span>
                        </button>

                        {/* Send Now */}
                        <button
                          onClick={() => sendScheduledMessageNow(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Send message right now"
                        >
                          <Send size={11} />
                          <span>Send Now</span>
                        </button>

                        {/* Cancel */}
                        <button
                          onClick={() => cancelScheduledMessage(item.id)}
                          className="px-2 py-1 rounded-lg hover:bg-warning/10 text-text-muted hover:text-warning text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Cancel scheduled delivery"
                        >
                          <XCircle size={12} />
                          <span>Cancel</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteScheduledMessage(item.id)}
                          className="p-1 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                          title="Delete scheduled message"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past / Delivered / Cancelled List */}
          {pastList.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Delivered / Cancelled History ({pastList.length})
              </h3>
              {pastList.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-surface/50 border border-border/60 text-xs flex items-center justify-between opacity-75"
                >
                  <div className="space-y-0.5 truncate pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        item.status === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-text-muted/10 text-text-muted'
                      }`}>
                        {item.status}
                      </span>
                      <span className="font-semibold text-text-primary">{item.chat_name}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary truncate">
                      "{item.content}"
                    </p>
                  </div>
                  <button
                    onClick={() => deleteScheduledMessage(item.id)}
                    className="p-1 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger shrink-0"
                    title="Delete log"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inline Edit Modal Backdrop if active */}
        {editingItem && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-5 shadow-elevated space-y-3">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Edit2 size={14} className="text-primary" />
                <span>Edit Scheduled Message</span>
              </h4>
              <textarea
                rows={3}
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 resize-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:bg-surface-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Reschedule Modal Backdrop if active */}
        {reschedulingItem && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-5 shadow-elevated space-y-3">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Calendar size={14} className="text-secondary" />
                <span>Reschedule Delivery Time</span>
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">
                    New Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setReschedulingItem(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:bg-surface-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReschedule}
                  className="px-4 py-1.5 rounded-lg bg-secondary text-white text-xs font-bold hover:bg-secondary-hover shadow-sm"
                >
                  Update Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
