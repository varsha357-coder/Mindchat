import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, RefreshCw, Copy, Check, ExternalLink, Calendar, 
  Clock, CheckCircle2, AlertCircle, FileText, Sparkles, 
  ListTodo, ShieldCheck, ChevronRight, MessageSquare, ArrowLeft,
  UsersRound, Filter, HelpCircle, Layers, ArrowUpRight
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Chat, Message, Profile } from '../../types/database';
import { 
  CatchUpFilterPeriod, 
  GroupCatchUpSummary, 
  GroupCatchUpSourceMessage 
} from '../../types/catchup';
import { 
  generateGroupCatchUpSummary, 
  persistCatchUpSummary, 
  getCachedCatchUpSummary 
} from '../../services/ai/groupCatchUpService';
import { GroupCatchUpIcon } from './GroupCatchUpIcon';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatTime, getInitials } from '../../lib/utils';

interface AIGroupCatchUpViewProps {
  onOpenChat: (chatId: string) => void;
  onJumpToMessage: (chatId: string, messageId: string) => void;
}

export const AIGroupCatchUpView: React.FC<AIGroupCatchUpViewProps> = ({
  onOpenChat,
  onJumpToMessage,
}) => {
  const { chats, allMessages, contacts, selectChat } = useChat();
  const { currentUser } = useAuth();

  // 1. Filter only group conversations where current user is a member
  const groupChats = useMemo(() => {
    return chats.filter(c => {
      if (c.type !== 'group') return false;
      if (!c.members || c.members.length === 0) return true;
      return c.members.some(m => m.id === currentUser.id);
    });
  }, [chats, currentUser.id]);

  // Selected Group State
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    return groupChats.length > 0 ? groupChats[0].id : null;
  });

  // Ensure valid selection if groups change
  useEffect(() => {
    if (groupChats.length > 0 && (!selectedGroupId || !groupChats.some(g => g.id === selectedGroupId))) {
      setSelectedGroupId(groupChats[0].id);
    }
  }, [groupChats, selectedGroupId]);

  const selectedGroup = groupChats.find(g => g.id === selectedGroupId);

  // Search Filter for Group List
  const [searchQuery, setSearchQuery] = useState('');
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return groupChats;
    return groupChats.filter(g => 
      (g.name || '').toLowerCase().includes(q) || 
      (g.description || '').toLowerCase().includes(q)
    );
  }, [groupChats, searchQuery]);

  // Filter Period State
  const [activePeriod, setActivePeriod] = useState<CatchUpFilterPeriod>('since_last_visit');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Summary State
  const [summary, setSummary] = useState<GroupCatchUpSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInsufficientData, setIsInsufficientData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState(false);

  // Active Detail Tab in Interactive Inspector: null | 'messages' | 'decisions' | 'tasks' | 'questions'
  const [activeDetailTab, setActiveDetailTab] = useState<'messages' | 'decisions' | 'tasks' | 'questions' | null>(null);

  // Mobile navigation toggle (List vs Detail)
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // Calculate if each group has new messages
  const groupStatusMap = useMemo(() => {
    const map = new Map<string, { hasNewMessages: boolean; unreadCount: number; lastMessageSnippet: string; lastMessageTime: string }>();
    groupChats.forEach(g => {
      const msgs = allMessages[g.id] || [];
      const unreadCount = g.unread_count || msgs.filter(m => m.status !== 'read' && m.sender_id !== currentUser.id).length;
      const lastMsg = msgs[msgs.length - 1] || g.last_message;
      const hasNewMessages = unreadCount > 0;
      map.set(g.id, {
        hasNewMessages,
        unreadCount,
        lastMessageSnippet: lastMsg ? lastMsg.content : 'No messages yet',
        lastMessageTime: lastMsg ? formatTime(lastMsg.created_at) : '',
      });
    });
    return map;
  }, [groupChats, allMessages, currentUser.id]);

  // Load or generate summary
  const loadSummaryForGroup = useCallback((
    chat: Chat, 
    period: CatchUpFilterPeriod, 
    forceFresh = false,
    customDates?: { start: string; end: string }
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsInsufficientData(false);

    const chatMsgs = allMessages[chat.id] || [];

    // Check cache first if not forcing a fresh generation
    if (!forceFresh && period !== 'custom') {
      const cached = getCachedCatchUpSummary(chat.id, period, chatMsgs);
      if (cached) {
        setSummary(cached);
        setIsLoading(false);
        return;
      }
    }

    // Small timeout for smooth skeleton transition
    setTimeout(() => {
      try {
        const result = generateGroupCatchUpSummary(
          chat,
          chatMsgs,
          currentUser,
          {
            periodType: period,
            customStartDate: customDates?.start || customStart,
            customEndDate: customDates?.end || customEnd,
            forceFresh,
          },
          contacts
        );

        if (result.success && result.summary) {
          setSummary(result.summary);
          persistCatchUpSummary(result.summary);
        } else if (result.isInsufficientData) {
          setIsInsufficientData(true);
          setSummary(null);
          setErrorMessage(result.error || 'Not enough conversation data to generate a meaningful summary.');
        } else {
          setErrorMessage(result.error || 'Failed to generate summary.');
          setSummary(null);
        }
      } catch (err) {
        console.error('[AIGroupCatchUp] Generation error:', err);
        setErrorMessage('An unexpected error occurred while analyzing group messages.');
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    }, 280);
  }, [allMessages, currentUser, contacts, customStart, customEnd]);

  // Trigger generation when selected group or active period changes
  useEffect(() => {
    if (!selectedGroup) return;
    if (activePeriod === 'custom' && (!customStart || !customEnd)) {
      setShowCustomModal(true);
      return;
    }
    loadSummaryForGroup(selectedGroup, activePeriod, false);
  }, [selectedGroupId, activePeriod, loadSummaryForGroup]);

  // Copy full summary to clipboard
  const handleCopySummary = async () => {
    if (!summary || !summary.summary_lines) return;
    const textToCopy = [
      `📌 MindChat AI Group Catch-Up: ${summary.chat_name}`,
      `🗓️ Period: ${summary.date_range_label} (${summary.message_count} messages)`,
      '',
      ...summary.summary_lines.map((l, i) => `${i + 1}. ${l}`),
      '',
      'Generated with MindChat AI'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2200);
    } catch {
      // Fallback
    }
  };

  // Switch to chat view
  const handleOpenOriginalChat = () => {
    if (selectedGroup) {
      selectChat(selectedGroup.id);
      onOpenChat(selectedGroup.id);
    }
  };

  // Jump to specific message
  const handleJumpToMessage = (messageId: string) => {
    if (selectedGroup) {
      onJumpToMessage(selectedGroup.id, messageId);
    }
  };

  // Custom date submit
  const handleApplyCustomRange = () => {
    if (!customStart) return;
    setShowCustomModal(false);
    if (selectedGroup) {
      loadSummaryForGroup(selectedGroup, 'custom', true, { start: customStart, end: customEnd });
    }
  };

  return (
    <div className="flex-1 flex h-full min-w-0 bg-background overflow-hidden relative select-none">
      {/* ======================================================== */}
      {/* LEFT COLUMN: GROUP SELECTOR PANEL                        */}
      {/* ======================================================== */}
      <aside className={`w-full md:w-80 lg:w-96 bg-surface border-r border-border flex flex-col h-full shrink-0 z-10 transition-all ${
        mobileShowDetail ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/20 to-teal-500/20 border border-primary/30 flex items-center justify-center text-primary shadow-subtle">
                <GroupCatchUpIcon size={20} animate />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-text-primary tracking-tight">AI Group Catch-Up</h2>
                <p className="text-[11px] text-text-secondary">5–7 Line Executive Digests</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-bold text-primary">
              {groupChats.length} {groupChats.length === 1 ? 'Group' : 'Groups'}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your groups..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Group List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted space-y-2">
              <UsersRound size={32} className="mx-auto text-text-muted/60" />
              <p className="font-semibold text-text-secondary">
                {searchQuery ? 'No matching groups found' : 'No group conversations found'}
              </p>
              <p className="text-[11px]">
                {searchQuery 
                  ? 'Try a different search term.' 
                  : 'You are not a member of any group conversations yet. Create or join a group to start receiving AI Catch-Up digests.'}
              </p>
            </div>
          ) : (
            filteredGroups.map(group => {
              const status = groupStatusMap.get(group.id);
              const isSelected = selectedGroupId === group.id;
              const hasNew = status?.hasNewMessages;
              const memberCount = group.members?.length || 2;

              return (
                <div
                  key={group.id}
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setMobileShowDetail(true);
                  }}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border relative flex items-center gap-3 group ${
                    isSelected
                      ? 'bg-primary/10 border-primary/35 shadow-sm'
                      : 'bg-surface hover:bg-surface-secondary/70 border-border/70 hover:border-border'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {group.avatar_url ? (
                      <img
                        src={group.avatar_url}
                        alt={group.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-border shadow-subtle"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center text-xs shadow-subtle">
                        {getInitials(group.name || 'Group')}
                      </div>
                    )}

                    {/* New message glowing dot */}
                    {hasNew && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-400 ring-2 ring-surface shadow-glow-primary animate-pulse" />
                    )}
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${
                        isSelected ? 'text-primary' : 'text-text-primary group-hover:text-primary transition-colors'
                      }`}>
                        {group.name}
                      </h4>
                      {status?.lastMessageTime && (
                        <span className="text-[10px] text-text-muted shrink-0">
                          {status.lastMessageTime}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[11px] text-text-secondary truncate max-w-[160px]">
                        {status?.lastMessageSnippet}
                      </p>
                      
                      {/* Unread badge */}
                      {status && status.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-primary text-white font-bold text-[10px] shrink-0">
                          {status.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Indicator if new messages to summarize */}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      <span className="text-text-muted">
                        {memberCount} members
                      </span>
                      {hasNew ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded-md">
                          <Sparkles size={10} />
                          <span>New to summarize</span>
                        </span>
                      ) : (
                        <span className="text-text-muted/80">Up to date</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={14} className={`shrink-0 text-text-muted transition-transform ${
                    isSelected ? 'translate-x-0.5 text-primary' : 'opacity-40 group-hover:opacity-100'
                  }`} />
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: INTERACTIVE GROUP SUMMARY WORKSPACE         */}
      {/* ======================================================== */}
      <main className={`flex-1 flex flex-col h-full min-w-0 bg-background/50 overflow-hidden ${
        mobileShowDetail ? 'flex' : 'hidden md:flex'
      }`}>
        {!selectedGroup ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted select-none">
            <div className="w-16 h-16 rounded-3xl bg-surface border border-border shadow-elevated flex items-center justify-center mb-4 text-primary">
              <GroupCatchUpIcon size={36} animate />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Select a Group Conversation</h3>
            <p className="text-xs text-text-secondary max-w-sm mt-1">
              Choose any of your group chats on the left to instantly generate a 5–7 line executive catch-up summary.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            {/* Top Group Banner */}
            <div className="p-4 sm:p-6 border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowDetail(false)}
                    className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-border"
                    title="Back to group list"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  {selectedGroup.avatar_url ? (
                    <img
                      src={selectedGroup.avatar_url}
                      alt={selectedGroup.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-border shadow-subtle shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center text-sm shadow-subtle shrink-0">
                      {getInitials(selectedGroup.name || 'Group')}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
                        {selectedGroup.name}
                      </h1>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-bold text-teal-400 flex items-center gap-1">
                        <Sparkles size={10} />
                        <span>AI Catch-Up</span>
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                      {selectedGroup.description || `${selectedGroup.members?.length || 2} members collaborating`}
                    </p>
                  </div>
                </div>

                {/* Primary Action: Read Original Chat */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenOriginalChat}
                    className="text-xs"
                    title="Open full chat stream"
                  >
                    <MessageSquare size={13} className="mr-1.5" />
                    <span>Read Original Chat</span>
                  </Button>
                </div>
              </div>

              {/* Time Period Filter Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-text-secondary mr-1 flex items-center gap-1">
                    <Filter size={12} />
                    <span>Period:</span>
                  </span>

                  {[
                    { id: 'since_last_visit', label: 'Since Last Visit' },
                    { id: 'unread', label: 'Unread Messages' },
                    { id: 'last_24h', label: 'Last 24 Hours' },
                    { id: 'last_7d', label: 'Last 7 Days' },
                    { id: 'custom', label: 'Custom Range' },
                    { id: 'entire', label: 'Entire Conversation' },
                  ].map(tab => {
                    const isActive = activePeriod === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (tab.id === 'custom') {
                            setShowCustomModal(true);
                          } else {
                            setActivePeriod(tab.id as CatchUpFilterPeriod);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-primary text-white shadow-subtle'
                            : 'bg-surface-secondary/70 text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-border/60'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Scope Metadata Chip */}
                {summary && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-secondary border border-border text-[11px] text-text-secondary">
                    <Clock size={11} className="text-primary" />
                    <span>{summary.date_range_label}</span>
                    <span>•</span>
                    <span className="font-semibold text-text-primary">{summary.message_count} messages</span>
                  </div>
                )}
              </div>

              {/* Freshness Banner if new messages arrived */}
              {summary?.has_newer_messages && (
                <div className="px-4 py-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-xs text-teal-300 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-teal-400 shrink-0" />
                    <span>
                      <strong>{summary.newer_message_count || 1} new messages</strong> arrived since this summary was generated.
                    </span>
                  </div>
                  <Button
                    variant="ai"
                    size="sm"
                    onClick={() => loadSummaryForGroup(selectedGroup, activePeriod, true)}
                    className="h-7 text-[11px] px-2.5"
                  >
                    <RefreshCw size={11} className="mr-1" />
                    <span>Refresh Summary</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Main Content Body */}
            <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-6">
              {/* LOADING SKELETON */}
              {isLoading && (
                <div className="space-y-4 animate-pulse p-6 rounded-3xl bg-surface border border-border">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="h-5 bg-surface-secondary rounded-lg w-48" />
                    <div className="h-4 bg-surface-secondary rounded-lg w-28" />
                  </div>
                  <div className="space-y-3 pt-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-surface-secondary shrink-0 mt-0.5" />
                        <div className="h-4 bg-surface-secondary rounded-lg flex-1" style={{ width: `${80 - i * 5}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INSUFFICIENT DATA EMPTY STATE */}
              {!isLoading && isInsufficientData && (
                <div className="p-8 text-center rounded-3xl bg-surface border border-border/80 shadow-subtle space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Not enough conversation data to generate a meaningful summary.
                  </h3>
                  <p className="text-xs text-text-secondary max-w-md mx-auto">
                    There are not enough messages in the selected time range ({activePeriod.replace(/_/g, ' ')}). Try switching to <strong>Entire Conversation</strong> or wait for further team discussions.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActivePeriod('entire')}
                    >
                      View Entire Conversation Summary
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleOpenOriginalChat}
                    >
                      Open Group Chat
                    </Button>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {!isLoading && errorMessage && !isInsufficientData && (
                <div className="p-6 rounded-3xl bg-danger/10 border border-danger/30 text-center space-y-3">
                  <AlertCircle size={24} className="mx-auto text-danger" />
                  <p className="text-xs font-semibold text-danger">{errorMessage}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadSummaryForGroup(selectedGroup, activePeriod, true)}
                  >
                    <RefreshCw size={12} className="mr-1.5" />
                    <span>Retry Analysis</span>
                  </Button>
                </div>
              )}

              {/* SUCCESSFUL 5–7 LINE SUMMARY CARD */}
              {!isLoading && summary && (
                <div className="space-y-6 animate-fade-in">
                  <div className="rounded-3xl bg-surface border border-border shadow-elevated p-6 space-y-5">
                    {/* Summary Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                          <Sparkles size={15} />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-text-primary">Executive Summary</h3>
                          <p className="text-[11px] text-text-secondary">Synthesized into 5–7 actionable bullet points</p>
                        </div>
                      </div>

                      {/* Version & Freshness status */}
                      <span className="text-[10px] text-text-muted self-start sm:self-auto">
                        Generated {formatTime(summary.created_at)}
                      </span>
                    </div>

                    {/* The 5–7 Lines Digest */}
                    <div className="space-y-3">
                      {summary.summary_lines.map((line, idx) => {
                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-surface-secondary/40 hover:bg-surface-secondary/80 border border-border/70 hover:border-primary/40 transition-all flex items-start gap-3.5 group cursor-pointer"
                            onClick={() => {
                              // If there's a relevant source message, jump to it
                              const srcMsg = summary.source_messages[idx] || summary.source_messages[0];
                              if (srcMsg) handleJumpToMessage(srcMsg.id);
                            }}
                            title="Click to locate original message in chat"
                          >
                            {/* Line Number Badge */}
                            <span className="w-6 h-6 rounded-xl bg-primary/15 border border-primary/30 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>

                            {/* Line Content */}
                            <div className="flex-1 text-xs text-text-primary leading-relaxed font-medium">
                              {line}
                            </div>

                            {/* Jump to chat anchor icon */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-primary hover:bg-primary/10 shrink-0">
                              <ArrowUpRight size={14} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* INTERACTIVE ACTION BAR (Requirement 5)                   */}
                  {/* ======================================================== */}
                  <div className="p-4 rounded-3xl bg-surface border border-border flex flex-wrap items-center justify-between gap-3 shadow-subtle">
                    {/* Left: Quick inspection toggles */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={activeDetailTab === 'messages' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveDetailTab(activeDetailTab === 'messages' ? null : 'messages')}
                        className="text-xs"
                      >
                        <FileText size={13} className="mr-1.5" />
                        <span>View Source Messages ({summary.source_messages.length})</span>
                      </Button>

                      <Button
                        variant={activeDetailTab === 'decisions' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveDetailTab(activeDetailTab === 'decisions' ? null : 'decisions')}
                        className="text-xs"
                      >
                        <ShieldCheck size={13} className="mr-1.5" />
                        <span>Show Decisions ({summary.decisions.length})</span>
                      </Button>

                      <Button
                        variant={activeDetailTab === 'tasks' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveDetailTab(activeDetailTab === 'tasks' ? null : 'tasks')}
                        className="text-xs"
                      >
                        <ListTodo size={13} className="mr-1.5" />
                        <span>Tasks & Deadlines ({summary.tasks.length + summary.deadlines.length})</span>
                      </Button>
                    </div>

                    {/* Right: Summary utilities */}
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopySummary}
                        className="text-xs"
                        title="Copy summary to clipboard"
                      >
                        {copiedState ? (
                          <>
                            <Check size={13} className="mr-1.5 text-success" />
                            <span className="text-success font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} className="mr-1.5" />
                            <span>Copy Summary</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ai"
                        size="sm"
                        onClick={() => loadSummaryForGroup(selectedGroup, activePeriod, true)}
                        className="text-xs"
                        title="Regenerate fresh analysis"
                      >
                        <RefreshCw size={13} className="mr-1.5" />
                        <span>Regenerate</span>
                      </Button>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* EXPANDABLE DEEP-DIVE INSPECTION PANELS                   */}
                  {/* ======================================================== */}

                  {/* 1. SOURCE MESSAGES INSPECTOR */}
                  {activeDetailTab === 'messages' && (
                    <div className="p-6 rounded-3xl bg-surface border border-border shadow-elevated space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-primary" />
                          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                            Source Messages Used For Key Points
                          </h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveDetailTab(null)}
                          className="h-6 text-[10px] px-2"
                        >
                          Close
                        </Button>
                      </div>

                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {summary.source_messages.map(src => (
                          <div
                            key={src.id}
                            className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border/80 flex items-start justify-between gap-3 hover:border-primary/40 transition-all group"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              {src.sender_avatar ? (
                                <img
                                  src={src.sender_avatar}
                                  alt={src.sender_name}
                                  className="w-8 h-8 rounded-xl object-cover border border-border shrink-0 mt-0.5"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                  {getInitials(src.sender_name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-text-primary">{src.sender_name}</span>
                                  <span className="text-[10px] text-text-muted">{formatTime(src.timestamp)}</span>
                                </div>
                                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                  "{src.content}"
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleJumpToMessage(src.id)}
                              className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                              title="Locate this message in original chat"
                            >
                              <span>Jump to chat</span>
                              <ExternalLink size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. CONFIRMED DECISIONS INSPECTOR */}
                  {activeDetailTab === 'decisions' && (
                    <div className="p-6 rounded-3xl bg-surface border border-border shadow-elevated space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-emerald-400" />
                          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                            Confirmed Group Decisions
                          </h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveDetailTab(null)}
                          className="h-6 text-[10px] px-2"
                        >
                          Close
                        </Button>
                      </div>

                      {summary.decisions.length === 0 ? (
                        <p className="text-xs text-text-muted py-4 text-center">
                          No confirmed decisions were explicitly recorded during this period. Suggestions and questions were excluded to maintain accuracy.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {summary.decisions.map(dec => (
                            <div
                              key={dec.id}
                              className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                                    <CheckCircle2 size={10} />
                                    <span>Confirmed</span>
                                  </span>
                                  {dec.decided_by && (
                                    <span className="text-[11px] text-text-secondary font-medium">
                                      Decided by {dec.decided_by}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-text-primary font-medium mt-1">
                                  {dec.decision}
                                </p>
                              </div>

                              {dec.source_message_id && (
                                <button
                                  onClick={() => handleJumpToMessage(dec.source_message_id!)}
                                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                                >
                                  <span>View message</span>
                                  <ArrowUpRight size={11} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. TASKS & DEADLINES INSPECTOR */}
                  {activeDetailTab === 'tasks' && (
                    <div className="p-6 rounded-3xl bg-surface border border-border shadow-elevated space-y-5 animate-fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <ListTodo size={16} className="text-primary" />
                          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                            Action Items, Assignments & Deadlines
                          </h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveDetailTab(null)}
                          className="h-6 text-[10px] px-2"
                        >
                          Close
                        </Button>
                      </div>

                      {/* Tasks */}
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-text-secondary uppercase">Tasks & Assignments</h5>
                        {summary.tasks.length === 0 ? (
                          <p className="text-xs text-text-muted italic">No specific tasks discussed in this range.</p>
                        ) : (
                          summary.tasks.map(t => (
                            <div
                              key={t.id}
                              className="p-3 rounded-2xl bg-surface-secondary/50 border border-border flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                <span className="font-semibold text-text-primary truncate">{t.title}</span>
                                {t.assignee && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                                    @{t.assignee}
                                  </span>
                                )}
                              </div>
                              {t.source_message_id && (
                                <button
                                  onClick={() => handleJumpToMessage(t.source_message_id!)}
                                  className="text-[11px] text-primary hover:underline shrink-0"
                                >
                                  Locate
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Deadlines */}
                      <div className="space-y-2 pt-2 border-t border-border">
                        <h5 className="text-[11px] font-bold text-text-secondary uppercase">Deadlines & Milestones</h5>
                        {summary.deadlines.length === 0 ? (
                          <p className="text-xs text-text-muted italic">No strict calendar deadlines mentioned.</p>
                        ) : (
                          summary.deadlines.map(d => (
                            <div
                              key={d.id}
                              className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Calendar size={14} className="text-amber-400 shrink-0" />
                                <span className="font-semibold text-text-primary truncate">{d.title}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] shrink-0">
                                {d.due_date}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Custom Range Picker Modal */}
      {showCustomModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCustomModal(false)}
          title="Custom Catch-Up Date Range"
          size="sm"
        >
          <div className="space-y-4 text-xs select-none">
            <p className="text-text-secondary">
              Select start and end dates to summarize conversation activity within a specific window.
            </p>
            <div>
              <label className="block font-semibold text-text-secondary mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-semibold text-text-secondary mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setShowCustomModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyCustomRange}
                disabled={!customStart}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
