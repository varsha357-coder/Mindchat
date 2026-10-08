import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  Chat, Message, Profile, StatusItem, NotificationItem, 
  PrivacySettings, ChatStreak, CallRecord, ScheduledMessage, StarredMessageEntry 
} from '../types/database';
import { mockStore } from '../services/mock/mockStore';
import { translationService } from '../services/translation/indicTranslator';
import { getSupabase, isSupabaseConnected } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { analyzeMessageWithAI } from '../services/ai/analyzer';

interface ChatContextType {
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | undefined;
  messages: Message[];
  allMessages: Record<string, Message[]>;
  contacts: Profile[];
  blockedContacts: Profile[];
  statuses: StatusItem[];
  notifications: NotificationItem[];
  privacySettings: PrivacySettings;
  activeStreak?: ChatStreak;
  
  // Starred messages
  starredMessageIds: string[];
  starredMessages: StarredMessageEntry[];
  toggleStar: (messageId: string) => Promise<void>;
  isMessageStarred: (messageId: string) => boolean;

  // Jump/Locate message
  targetMessageId: string | null;
  setTargetMessageId: (id: string | null) => void;
  jumpToMessage: (chatId: string, messageId: string) => void;

  // Calling
  callRecords: CallRecord[];
  createCallRecord: (record: Omit<CallRecord, 'id' | 'created_at'>) => Promise<CallRecord>;
  deleteCallRecord: (id: string) => Promise<void>;

  // Scheduled Messages
  scheduledMessages: ScheduledMessage[];
  scheduleMessage: (
    chatId: string,
    content: string,
    scheduledFor: string,
    timezone: string,
    messageType?: Message['message_type']
  ) => Promise<ScheduledMessage>;
  editScheduledMessage: (id: string, newContent: string) => Promise<void>;
  rescheduleMessage: (id: string, newScheduledFor: string, newTimezone: string) => Promise<void>;
  cancelScheduledMessage: (id: string) => Promise<void>;
  deleteScheduledMessage: (id: string) => Promise<void>;
  sendScheduledMessageNow: (id: string) => Promise<void>;

  // Base Chat Operations
  selectChat: (chatId: string) => void;
  sendMessage: (content: string, options?: {
    messageType?: Message['message_type'];
    durationSeconds?: number;
    deleteAfterRead?: boolean;
    replyToMessageId?: string;
  }) => Promise<Message>;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  translateMessage: (messageId: string, targetLanguage?: string) => Promise<void>;
  createChat: (type: 'direct' | 'group', name?: string, memberIds?: string[], description?: string) => Promise<Chat>;
  startDirectChat: (targetUser: Profile) => Promise<string>;
  searchRegisteredUsers: (query: string) => Promise<Profile[]>;
  toggleArchive: (chatId: string) => void;
  togglePin: (chatId: string) => void;
  setChatTimer: (chatId: string, seconds: number) => void;
  addContact: (contact: Profile) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  addStatus: (content: string, mediaType?: 'text' | 'image' | 'video', mediaUrl?: string) => void;
  markNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isBackendConnected } = useAuth();

  const initialChats = mockStore.getChats();
  const initialChatId = initialChats.length > 0 ? initialChats[0].id : null;

  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<Message[]>(() => {
    return initialChatId ? mockStore.getMessages(initialChatId) : [];
  });
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  const [contacts, setContacts] = useState<Profile[]>(() => mockStore.getContacts());
  const [blockedContacts, setBlockedContacts] = useState<Profile[]>(() => mockStore.getBlockedContacts());
  const [statuses, setStatuses] = useState<StatusItem[]>(() => mockStore.getStatuses());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => mockStore.getNotifications());
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => mockStore.getPrivacySettings());

  // Starred messages state
  const [starredMessageIds, setStarredMessageIds] = useState<string[]>([]);
  const [starredMessages, setStarredMessages] = useState<StarredMessageEntry[]>([]);

  // Message Jump Target
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);

  // Calling records state
  const [callRecords, setCallRecords] = useState<CallRecord[]>(() => mockStore.getCallRecords());

  // Scheduled messages state
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>(() => mockStore.getScheduledMessages());

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeStreak = activeChatId ? mockStore.getStreak(activeChatId) : undefined;

  // --- Real Supabase Sync Operations ---
  const fetchSupabaseChats = async () => {
    const client = getSupabase();
    if (!client || !currentUser.id) return;

    try {
      // 1. Fetch chat memberships for current user
      const { data: memberRows, error: mErr } = await client
        .from('chat_members')
        .select('chat_id, role, is_pinned, is_archived')
        .eq('user_id', currentUser.id);

      if (mErr || !memberRows || memberRows.length === 0) {
        return;
      }

      const chatIds = memberRows.map(m => m.chat_id);

      // 2. Fetch chats
      const { data: chatRows, error: cErr } = await client
        .from('chats')
        .select('*')
        .in('id', chatIds);

      if (cErr || !chatRows) return;

      // 3. Fetch all members of these chats
      const { data: allMemberRows } = await client
        .from('chat_members')
        .select('chat_id, user_id')
        .in('chat_id', chatIds);

      const allUserIds = Array.from(new Set(allMemberRows?.map(r => r.user_id) || []));

      // 4. Fetch profiles of all members
      const { data: profileRows } = await client
        .from('profiles')
        .select('*')
        .in('id', allUserIds);

      const profileMap = new Map((profileRows || []).map(p => [p.id, p as Profile]));

      // 5. Fetch last message for each chat
      const formattedChats: Chat[] = [];

      for (const c of chatRows) {
        const mem = memberRows.find(m => m.chat_id === c.id);
        const thisChatMemberIds = allMemberRows?.filter(r => r.chat_id === c.id).map(r => r.user_id) || [];
        const memberProfiles = thisChatMemberIds.map(uid => profileMap.get(uid)).filter(Boolean) as Profile[];
        const peer = memberProfiles.find(p => p.id !== currentUser.id);

        // Fetch last message
        const { data: lastMsgs } = await client
          .from('messages')
          .select('*')
          .eq('chat_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1);

        formattedChats.push({
          id: c.id,
          type: c.type,
          name: c.type === 'group' ? c.name : (peer?.display_name || 'Direct Chat'),
          description: c.description,
          avatar_url: c.type === 'group' ? c.avatar_url : peer?.avatar_url,
          default_timer_seconds: c.default_timer_seconds || 0,
          ai_enabled: c.ai_enabled ?? true,
          members: memberProfiles,
          last_message: lastMsgs && lastMsgs[0] ? (lastMsgs[0] as Message) : undefined,
          is_pinned: mem?.is_pinned || false,
          is_archived: mem?.is_archived || false,
          created_at: c.created_at,
          updated_at: c.updated_at,
        });
      }

      setChats(formattedChats);
      if (formattedChats.length > 0 && !activeChatId) {
        setActiveChatId(formattedChats[0].id);
      }
    } catch (e) {
      console.error('Error fetching Supabase chats:', e);
    }
  };

  const fetchSupabaseMessages = async (chatId: string) => {
    const client = getSupabase();
    if (!client || !chatId) return;

    try {
      const { data, error } = await client
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const mapped = (data as Message[]).map(m => ({
          ...m,
          is_starred: starredMessageIds.includes(m.id) || m.is_starred,
        }));
        setMessages(mapped);
      }
    } catch (e) {
      console.error('Error fetching messages from Supabase:', e);
    }
  };

  // --- Fetch Starred Messages ---
  const fetchStarredMessages = useCallback(async () => {
    const client = getSupabase();
    if (client && isSupabaseConnected() && currentUser.id) {
      try {
        const { data, error } = await client
          .from('starred_messages')
          .select(`
            id,
            user_id,
            message_id,
            chat_id,
            created_at,
            messages (
              id,
              content,
              sender_id,
              created_at,
              message_type,
              profiles:sender_id (display_name, avatar_url)
            ),
            chats (
              id,
              name,
              type
            )
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const ids = data.map((d: any) => d.message_id);
          setStarredMessageIds(ids);

          const entries: StarredMessageEntry[] = data.map((d: any) => {
            const rawMsg = d.messages;
            const rawChat = d.chats;
            const senderProfile = rawMsg?.profiles;

            return {
              id: d.id,
              user_id: d.user_id,
              message_id: d.message_id,
              chat_id: d.chat_id,
              created_at: d.created_at,
              message: rawMsg ? {
                id: rawMsg.id,
                chat_id: d.chat_id,
                sender_id: rawMsg.sender_id,
                content: rawMsg.content,
                message_type: rawMsg.message_type || 'text',
                is_starred: true,
                created_at: rawMsg.created_at,
              } : undefined,
              chat_name: rawChat?.name || 'Direct Chat',
              sender_name: senderProfile?.display_name || 'User',
              sender_avatar: senderProfile?.avatar_url,
            };
          });
          setStarredMessages(entries);
          return;
        }
      } catch (err) {
        console.warn('Error fetching Supabase starred messages, falling back to local store:', err);
      }
    }

    // Local / Demo Mode fallback
    const localStarred = mockStore.getStarredMessages();
    const ids = localStarred.map(s => s.msg.id);
    setStarredMessageIds(ids);

    const entries: StarredMessageEntry[] = localStarred.map(s => ({
      id: 'star_' + s.msg.id,
      user_id: currentUser.id,
      message_id: s.msg.id,
      chat_id: s.msg.chat_id,
      created_at: s.msg.created_at,
      message: s.msg,
      chat_name: s.chatName,
      sender_name: s.msg.sender_id === currentUser.id ? currentUser.display_name : 'Contact',
    }));
    setStarredMessages(entries);
  }, [currentUser.id, currentUser.display_name]);

  // --- Fetch Call Records ---
  const fetchCallRecords = useCallback(async () => {
    const client = getSupabase();
    if (client && isSupabaseConnected() && currentUser.id) {
      try {
        const { data, error } = await client
          .from('call_records')
          .select(`
            *,
            caller:caller_id (*),
            receiver:receiver_id (*)
          `)
          .or(`caller_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setCallRecords(data as CallRecord[]);
          return;
        }
      } catch (err) {
        console.warn('Error fetching Supabase call records:', err);
      }
    }

    setCallRecords(mockStore.getCallRecords());
  }, [currentUser.id]);

  // --- Fetch Scheduled Messages ---
  const fetchScheduledMessages = useCallback(async () => {
    const client = getSupabase();
    if (client && isSupabaseConnected() && currentUser.id) {
      try {
        // Trigger server-side process_due_scheduled_messages function to execute due deliveries
        try {
          await client.rpc('process_due_scheduled_messages');
        } catch {
          // Ignore if RPC not defined yet
        }

        const { data, error } = await client
          .from('scheduled_messages')
          .select(`
            *,
            chats (name)
          `)
          .eq('sender_id', currentUser.id)
          .order('scheduled_for', { ascending: true });

        if (!error && data) {
          const mapped: ScheduledMessage[] = data.map((d: any) => ({
            ...d,
            chat_name: d.chats?.name || 'Direct Chat',
          }));
          setScheduledMessages(mapped);
          return;
        }
      } catch (err) {
        console.warn('Error fetching Supabase scheduled messages:', err);
      }
    }

    setScheduledMessages(mockStore.getScheduledMessages());
  }, [currentUser.id]);

  // Initial Sync & Realtime Setup
  useEffect(() => {
    if (isSupabaseConnected()) {
      fetchSupabaseChats();
      fetchStarredMessages();
      fetchCallRecords();
      fetchScheduledMessages();
    } else {
      setChats(mockStore.getChats());
      setContacts(mockStore.getContacts());
      setBlockedContacts(mockStore.getBlockedContacts());
      setStatuses(mockStore.getStatuses());
      setNotifications(mockStore.getNotifications());
      setPrivacySettings(mockStore.getPrivacySettings());
      fetchStarredMessages();
      fetchCallRecords();
      fetchScheduledMessages();

      if (activeChatId) {
        setMessages([...mockStore.getMessages(activeChatId)]);
      }
    }
  }, [isBackendConnected, currentUser.id, fetchStarredMessages, fetchCallRecords, fetchScheduledMessages]);

  // Periodic server-side scheduled delivery check (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScheduledMessages();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchScheduledMessages]);

  // Realtime subscription for active chat messages
  useEffect(() => {
    const client = getSupabase();
    if (!client || !isSupabaseConnected() || !activeChatId) return;

    fetchSupabaseMessages(activeChatId);

    const channelName = `realtime-chat-${activeChatId}`;
    const channel = client.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChatId}`,
        },
        payload => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, is_starred: starredMessageIds.includes(newMsg.id) }];
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [activeChatId, isBackendConnected, starredMessageIds]);

  // Fallback store event subscriptions for Local / Demo mode
  useEffect(() => {
    if (isSupabaseConnected()) return;

    const handleUpdate = () => {
      setChats(mockStore.getChats());
      setContacts(mockStore.getContacts());
      setBlockedContacts(mockStore.getBlockedContacts());
      setStatuses(mockStore.getStatuses());
      setNotifications(mockStore.getNotifications());
      setPrivacySettings(mockStore.getPrivacySettings());
      fetchStarredMessages();
      fetchCallRecords();
      fetchScheduledMessages();

      if (activeChatId) {
        setMessages([...mockStore.getMessages(activeChatId)]);
      }

      const all: Record<string, Message[]> = {};
      mockStore.getChats().forEach(c => {
        all[c.id] = mockStore.getMessages(c.id);
      });
      setAllMessages(all);
    };

    mockStore.addEventListener('change', handleUpdate);
    mockStore.addEventListener('messages_updated', handleUpdate);
    mockStore.addEventListener('chats_updated', handleUpdate);
    mockStore.addEventListener('starred_updated', handleUpdate);
    mockStore.addEventListener('calls_updated', handleUpdate);
    mockStore.addEventListener('scheduled_updated', handleUpdate);

    return () => {
      mockStore.removeEventListener('change', handleUpdate);
      mockStore.removeEventListener('messages_updated', handleUpdate);
      mockStore.removeEventListener('chats_updated', handleUpdate);
      mockStore.removeEventListener('starred_updated', handleUpdate);
      mockStore.removeEventListener('calls_updated', handleUpdate);
      mockStore.removeEventListener('scheduled_updated', handleUpdate);
    };
  }, [activeChatId, isBackendConnected, fetchStarredMessages, fetchCallRecords, fetchScheduledMessages]);

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
    if (isSupabaseConnected()) {
      fetchSupabaseMessages(chatId);
    } else {
      setMessages(mockStore.getMessages(chatId));
    }
  };

  const jumpToMessage = (chatId: string, messageId: string) => {
    selectChat(chatId);
    setTargetMessageId(messageId);
  };

  const toggleStar = async (messageId: string) => {
    const isCurrentlyStarred = starredMessageIds.includes(messageId);
    const client = getSupabase();

    if (client && isSupabaseConnected() && currentUser.id) {
      try {
        if (isCurrentlyStarred) {
          // Remove from Supabase starred_messages
          await client
            .from('starred_messages')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('message_id', messageId);
          
          setStarredMessageIds(prev => prev.filter(id => id !== messageId));
        } else {
          // Find chat_id
          const currentMsg = messages.find(m => m.id === messageId);
          const chatId = currentMsg?.chat_id || activeChatId;

          if (chatId) {
            await client
              .from('starred_messages')
              .insert({
                user_id: currentUser.id,
                message_id: messageId,
                chat_id: chatId,
              });
            
            setStarredMessageIds(prev => [...prev, messageId]);
          }
        }
        await fetchStarredMessages();
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: !isCurrentlyStarred } : m));
        return;
      } catch (err) {
        console.error('Error toggling star in Supabase:', err);
      }
    }

    // Local / Demo Mode fallback
    if (activeChatId) {
      mockStore.toggleStarMessage(activeChatId, messageId);
      await fetchStarredMessages();
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: !isCurrentlyStarred } : m));
    }
  };

  const isMessageStarred = (messageId: string): boolean => {
    return starredMessageIds.includes(messageId);
  };

  // --- Calling Handlers ---
  const createCallRecord = async (record: Omit<CallRecord, 'id' | 'created_at'>): Promise<CallRecord> => {
    const client = getSupabase();

    if (client && isSupabaseConnected()) {
      try {
        const { data, error } = await client
          .from('call_records')
          .insert(record)
          .select(`
            *,
            caller:caller_id (*),
            receiver:receiver_id (*)
          `)
          .single();

        if (!error && data) {
          const newRecord = data as CallRecord;
          setCallRecords(prev => [newRecord, ...prev]);
          return newRecord;
        }
      } catch (err) {
        console.error('Error creating call record in Supabase:', err);
      }
    }

    const localRecord = mockStore.addCallRecord(record);
    setCallRecords(mockStore.getCallRecords());
    return localRecord;
  };

  const deleteCallRecord = async (id: string) => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        await client.from('call_records').delete().eq('id', id);
        setCallRecords(prev => prev.filter(c => c.id !== id));
        return;
      } catch (err) {
        console.error('Error deleting call record in Supabase:', err);
      }
    }

    mockStore.deleteCallRecord(id);
    setCallRecords(mockStore.getCallRecords());
  };

  // --- Scheduled Message Handlers ---
  const scheduleMessage = async (
    chatId: string,
    content: string,
    scheduledFor: string,
    timezone: string,
    messageType: Message['message_type'] = 'text'
  ): Promise<ScheduledMessage> => {
    const client = getSupabase();

    if (client && isSupabaseConnected()) {
      try {
        const { data, error } = await client
          .from('scheduled_messages')
          .insert({
            chat_id: chatId,
            sender_id: currentUser.id,
            content,
            message_type: messageType,
            scheduled_for: scheduledFor,
            timezone,
            status: 'pending',
          })
          .select(`
            *,
            chats (name)
          `)
          .single();

        if (!error && data) {
          const mapped: ScheduledMessage = {
            ...data,
            chat_name: data.chats?.name || 'Direct Chat',
          };
          setScheduledMessages(prev => [mapped, ...prev]);
          return mapped;
        }
      } catch (err) {
        console.error('Error scheduling message in Supabase:', err);
      }
    }

    const localSched = mockStore.scheduleMessage(chatId, content, scheduledFor, timezone, messageType);
    setScheduledMessages(mockStore.getScheduledMessages());
    return localSched;
  };

  const editScheduledMessage = async (id: string, newContent: string) => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        await client
          .from('scheduled_messages')
          .update({ content: newContent, updated_at: new Date().toISOString() })
          .eq('id', id);
        
        setScheduledMessages(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
        return;
      } catch (err) {
        console.error('Error editing scheduled message:', err);
      }
    }

    mockStore.editScheduledMessage(id, newContent);
    setScheduledMessages(mockStore.getScheduledMessages());
  };

  const rescheduleMessage = async (id: string, newScheduledFor: string, newTimezone: string) => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        await client
          .from('scheduled_messages')
          .update({
            scheduled_for: newScheduledFor,
            timezone: newTimezone,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        setScheduledMessages(prev => prev.map(s => s.id === id ? {
          ...s,
          scheduled_for: newScheduledFor,
          timezone: newTimezone,
          status: 'pending',
        } : s));
        return;
      } catch (err) {
        console.error('Error rescheduling message:', err);
      }
    }

    mockStore.rescheduleMessage(id, newScheduledFor, newTimezone);
    setScheduledMessages(mockStore.getScheduledMessages());
  };

  const cancelScheduledMessage = async (id: string) => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        await client
          .from('scheduled_messages')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', id);

        setScheduledMessages(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
        return;
      } catch (err) {
        console.error('Error cancelling scheduled message:', err);
      }
    }

    mockStore.cancelScheduledMessage(id);
    setScheduledMessages(mockStore.getScheduledMessages());
  };

  const deleteScheduledMessage = async (id: string) => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        await client.from('scheduled_messages').delete().eq('id', id);
        setScheduledMessages(prev => prev.filter(s => s.id !== id));
        return;
      } catch (err) {
        console.error('Error deleting scheduled message:', err);
      }
    }

    mockStore.deleteScheduledMessage(id);
    setScheduledMessages(mockStore.getScheduledMessages());
  };

  const sendScheduledMessageNow = async (id: string) => {
    const item = scheduledMessages.find(s => s.id === id);
    if (!item) return;

    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        // 1. Deliver message now
        await sendMessage(item.content, { messageType: item.message_type });

        // 2. Update status to delivered
        await client
          .from('scheduled_messages')
          .update({ status: 'delivered', delivered_at: new Date().toISOString() })
          .eq('id', id);

        setScheduledMessages(prev => prev.map(s => s.id === id ? { ...s, status: 'delivered' } : s));
        return;
      } catch (err) {
        console.error('Error sending scheduled message now:', err);
      }
    }

    await mockStore.sendScheduledMessageNow(id);
    setScheduledMessages(mockStore.getScheduledMessages());
  };

  // --- Send Message ---
  const sendMessage = async (content: string, options?: {
    messageType?: Message['message_type'];
    durationSeconds?: number;
    deleteAfterRead?: boolean;
    replyToMessageId?: string;
  }): Promise<Message> => {
    if (!activeChatId) throw new Error('No active chat');

    const duration = options?.durationSeconds || activeChat?.default_timer_seconds || 0;
    const expiresAt = duration > 0 ? new Date(Date.now() + duration * 1000).toISOString() : undefined;

    // AI Classification check
    const aiAnalysis = analyzeMessageWithAI(content);

    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      const msgPayload: any = {
        chat_id: activeChatId,
        sender_id: currentUser.id,
        content,
        message_type: options?.messageType || 'text',
        expires_at: expiresAt,
        delete_after_read: options?.deleteAfterRead || false,
        reply_to_message_id: options?.replyToMessageId || null,
      };

      const { data, error } = await client
        .from('messages')
        .insert(msgPayload)
        .select()
        .single();

      if (error) {
        console.error('Error sending message to Supabase:', error.message);
        throw error;
      }

      const createdMsg = data as Message;

      // Attach AI classification locally for rich UI banner
      if (aiAnalysis.isImportant) {
        createdMsg.ai_classification = {
          id: 'ai_' + createdMsg.id,
          message_id: createdMsg.id,
          classification: aiAnalysis.classification,
          confidence: aiAnalysis.confidence,
          extracted_data: aiAnalysis.extractedData,
          status: 'pending_review',
        };
      }

      setMessages(prev => [...prev, createdMsg]);
      return createdMsg;
    }

    // Demo store fallback
    const msg = await mockStore.sendMessage(activeChatId, content, options);
    setMessages(mockStore.getMessages(activeChatId));
    return msg;
  };

  const startDirectChat = async (targetUser: Profile): Promise<string> => {
    const client = getSupabase();

    if (client && isSupabaseConnected()) {
      try {
        const { data: myMemberships } = await client
          .from('chat_members')
          .select('chat_id')
          .eq('user_id', currentUser.id);

        if (myMemberships && myMemberships.length > 0) {
          const chatIds = myMemberships.map(m => m.chat_id);
          const { data: peerMemberships } = await client
            .from('chat_members')
            .select('chat_id')
            .eq('user_id', targetUser.id)
            .in('chat_id', chatIds);

          if (peerMemberships && peerMemberships.length > 0) {
            const existingId = peerMemberships[0].chat_id;
            await fetchSupabaseChats();
            setActiveChatId(existingId);
            return existingId;
          }
        }

        const { data: newChat, error: cErr } = await client
          .from('chats')
          .insert({
            type: 'direct',
            name: targetUser.display_name,
            avatar_url: targetUser.avatar_url,
            created_by: currentUser.id,
            ai_enabled: true,
          })
          .select()
          .single();

        if (cErr || !newChat) throw cErr;

        await client.from('chat_members').insert([
          { chat_id: newChat.id, user_id: currentUser.id, role: 'owner' },
          { chat_id: newChat.id, user_id: targetUser.id, role: 'member' },
        ]);

        await fetchSupabaseChats();
        setActiveChatId(newChat.id);
        return newChat.id;
      } catch (err) {
        console.error('Error starting direct chat in Supabase:', err);
      }
    }

    const newChat = mockStore.createChat({
      type: 'direct',
      name: targetUser.display_name,
      avatar_url: targetUser.avatar_url,
      default_timer_seconds: 0,
      ai_enabled: true,
      members: [currentUser, targetUser],
      created_by: currentUser.id,
    });
    setActiveChatId(newChat.id);
    return newChat.id;
  };

  const createChat = async (type: 'direct' | 'group', name?: string, memberIds?: string[], description?: string): Promise<Chat> => {
    const client = getSupabase();

    if (client && isSupabaseConnected()) {
      const { data: newChat, error } = await client
        .from('chats')
        .insert({
          type,
          name: name || (type === 'group' ? 'New Group' : 'Direct Chat'),
          description,
          created_by: currentUser.id,
          ai_enabled: true,
        })
        .select()
        .single();

      if (!error && newChat) {
        const memberships = [
          { chat_id: newChat.id, user_id: currentUser.id, role: 'owner' },
          ...(memberIds || []).map(uid => ({ chat_id: newChat.id, user_id: uid, role: 'member' })),
        ];
        await client.from('chat_members').insert(memberships);
        await fetchSupabaseChats();
        setActiveChatId(newChat.id);
        return newChat as Chat;
      }
    }

    const localChat = mockStore.createChat({
      type,
      name: name || (type === 'group' ? 'New Group' : 'Direct Chat'),
      description,
      default_timer_seconds: 0,
      ai_enabled: true,
      created_by: currentUser.id,
    });
    setActiveChatId(localChat.id);
    return localChat;
  };

  const searchRegisteredUsers = async (query: string): Promise<Profile[]> => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .neq('id', currentUser.id)
          .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(20);

        if (!error && data) {
          return data as Profile[];
        }
      } catch (e) {
        console.error('Error searching registered users in Supabase:', e);
      }
    }

    return mockStore.getContacts().filter(c => 
      c.display_name.toLowerCase().includes(q) || 
      c.username.toLowerCase().includes(q)
    );
  };

  const editMessage = (messageId: string, newContent: string) => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      client.from('messages').update({ content: newContent, edited_at: new Date().toISOString() }).eq('id', messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent } : m));
      return;
    }
    if (activeChatId) mockStore.editMessage(activeChatId, messageId, newContent);
  };

  const deleteMessage = (messageId: string) => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      client.from('messages').delete().eq('id', messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      return;
    }
    if (activeChatId) mockStore.deleteMessage(activeChatId, messageId);
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (activeChatId) mockStore.addReaction(activeChatId, messageId, emoji);
  };

  const translateMessage = async (messageId: string, targetLanguage?: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const targetLang = targetLanguage || currentUser.preferred_language || 'en';
    const result = await translationService.translate(msg.content, targetLang);

    if (activeChatId) {
      mockStore.setMessageTranslation(activeChatId, messageId, result.translatedText, targetLang);
    }
    setMessages(prev => prev.map(m => m.id === messageId ? {
      ...m,
      is_translated: true,
      translated_content: result.translatedText,
      translated_language: targetLang,
    } : m));
  };

  const toggleArchive = (chatId: string) => {
    mockStore.toggleArchiveChat(chatId);
  };

  const togglePin = (chatId: string) => {
    mockStore.togglePinChat(chatId);
  };

  const setChatTimer = (chatId: string, seconds: number) => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      client.from('chats').update({ default_timer_seconds: seconds }).eq('id', chatId);
    }
    mockStore.setChatTimer(chatId, seconds);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, default_timer_seconds: seconds } : c));
  };

  const addContact = (contact: Profile) => {
    mockStore.addContact(contact);
    setContacts(prev => [...prev, contact]);
  };

  const blockUser = (userId: string) => {
    mockStore.blockUser(userId);
  };

  const unblockUser = (userId: string) => {
    mockStore.unblockUser(userId);
  };

  const addStatus = (content: string, mediaType: 'text' | 'image' | 'video' = 'text', mediaUrl?: string) => {
    mockStore.addStatus(content, mediaType, mediaUrl);
  };

  const markNotificationRead = (id: string) => {
    mockStore.markNotificationAsRead(id);
  };

  const deleteNotification = (id: string) => {
    mockStore.deleteNotification(id);
  };

  const updatePrivacySettings = (updates: Partial<PrivacySettings>) => {
    mockStore.updatePrivacySettings(updates);
    setPrivacySettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeChat,
        messages,
        allMessages,
        contacts,
        blockedContacts,
        statuses,
        notifications,
        privacySettings,
        activeStreak,
        
        starredMessageIds,
        starredMessages,
        toggleStar,
        isMessageStarred,

        targetMessageId,
        setTargetMessageId,
        jumpToMessage,

        callRecords,
        createCallRecord,
        deleteCallRecord,

        scheduledMessages,
        scheduleMessage,
        editScheduledMessage,
        rescheduleMessage,
        cancelScheduledMessage,
        deleteScheduledMessage,
        sendScheduledMessageNow,

        selectChat,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        translateMessage,
        createChat,
        startDirectChat,
        searchRegisteredUsers,
        toggleArchive,
        togglePin,
        setChatTimer,
        addContact,
        blockUser,
        unblockUser,
        addStatus,
        markNotificationRead,
        deleteNotification,
        updatePrivacySettings,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
