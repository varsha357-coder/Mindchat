import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Globe, X, Send, AlertCircle, Check, Sparkles } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContent?: string;
  onSuccess?: () => void;
}

// Major global and Indian timezones
const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - UTC+5:30)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT - UTC-5/UTC-4)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT - UTC-8/UTC-7)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST - UTC+0/UTC+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET - UTC+1)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - UTC+4)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST - UTC+10)' },
];

export const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({
  isOpen,
  onClose,
  defaultContent = '',
  onSuccess,
}) => {
  const { activeChat, scheduleMessage } = useChat();

  const [content, setContent] = useState(defaultContent);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('00:00'); // 12:00 AM default
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch {
      return 'Asia/Kolkata';
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(defaultContent);
      setError(null);

      // Default date: Tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
      setSelectedTime('00:00'); // 12:00 AM (e.g. Birthday midnight)
    }
  }, [isOpen, defaultContent]);

  if (!isOpen) return null;

  // Calculate target ISO string
  const calculateTargetDate = (): Date | null => {
    if (!selectedDate || !selectedTime) return null;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    // Construct local Date
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  };

  const targetDate = calculateTargetDate();
  const now = new Date();
  const isFuture = targetDate ? targetDate.getTime() > now.getTime() : false;

  // Format countdown preview
  let countdownText = '';
  if (targetDate && isFuture) {
    const diffMs = targetDate.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(diffHrs / 24);
    const remHrs = diffHrs % 24;

    if (days > 0) {
      countdownText = `Delivers in ${days} day${days > 1 ? 's' : ''} and ${remHrs} hr${remHrs !== 1 ? 's' : ''}`;
    } else if (diffHrs > 0) {
      countdownText = `Delivers in ${diffHrs} hr${diffHrs > 1 ? 's' : ''} and ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    } else {
      countdownText = `Delivers in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    }
  }

  const handleQuickPreset = (preset: 'midnight' | 'morning' | 'tomorrow' | 'nextWeek') => {
    const d = new Date();
    if (preset === 'midnight') {
      // Midnight (12:00 AM) next day
      d.setDate(d.getDate() + 1);
      setSelectedTime('00:00');
    } else if (preset === 'morning') {
      // Tomorrow 9:00 AM
      d.setDate(d.getDate() + 1);
      setSelectedTime('09:00');
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (preset === 'nextWeek') {
      d.setDate(d.getDate() + 7);
      setSelectedTime('10:00');
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat) return;

    if (!content.trim()) {
      setError('Please enter a message to schedule.');
      return;
    }

    if (!targetDate || !isFuture) {
      setError('Selected time must be in the future.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await scheduleMessage(
        activeChat.id,
        content.trim(),
        targetDate.toISOString(),
        timezone,
        'text'
      );

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to schedule message.');
    }
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Schedule Message</h2>
              <p className="text-xs text-text-secondary">
                Delivers automatically via server-side database job even if you are offline.
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

        {/* Form Body */}
        <form onSubmit={handleSchedule} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Chat Preview */}
          <div className="text-xs text-text-secondary bg-surface-secondary/70 px-3.5 py-2 rounded-xl border border-border flex items-center justify-between">
            <span>Scheduling for: <strong className="text-text-primary">{activeChat?.name || 'Current Chat'}</strong></span>
            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              Server-Job
            </span>
          </div>

          {/* Message Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary block">
              Message Content
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="e.g. Happy Birthday! Wishing you a fantastic year ahead! 🎂🎉"
              className="w-full p-3 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none"
              required
            />
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
              Quick Shortcuts
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset('midnight')}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] text-text-primary transition-colors flex items-center gap-1"
              >
                <span>🎂 12:00 AM (Midnight)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('morning')}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] text-text-primary transition-colors flex items-center gap-1"
              >
                <span>🌅 Tomorrow 9:00 AM</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('nextWeek')}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] text-text-primary transition-colors flex items-center gap-1"
              >
                <span>📅 Next Week 10:00 AM</span>
              </button>
            </div>
          </div>

          {/* Date and Time Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Calendar size={13} className="text-primary" />
                <span>Delivery Date</span>
              </label>
              <input
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Clock size={13} className="text-secondary" />
                <span>Exact Time (24h or AM/PM)</span>
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-colors"
                required
              />
            </div>
          </div>

          {/* Timezone Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Globe size={13} className="text-primary-light" />
              <span>Sender Timezone</span>
            </label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-colors"
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Preview Callout */}
          {targetDate && (
            <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
              isFuture
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-danger/10 border-danger/30 text-danger'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold">
                {isFuture ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>
                  {isFuture
                    ? `Will be delivered automatically on: ${targetDate.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })} at ${targetDate.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Selected date and time is in the past! Please choose a future time.'}
                </span>
              </div>
              {countdownText && (
                <p className="text-[11px] text-emerald-300 font-medium pl-5">
                  ⏱ {countdownText}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFuture || isSubmitting || !content.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Calendar size={14} />
              <span>{isSubmitting ? 'Scheduling...' : 'Schedule Delivery'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
