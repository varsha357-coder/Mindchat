import { 
  Profile, Chat, Message, AIMemory, StatusItem, NotificationItem, 
  PrivacySettings, ChatStreak, AIClassification, MessageReaction,
  CallRecord, ScheduledMessage 
} from '../../types/database';
import { 
  CURRENT_USER, DEMO_USERS, SEED_CHATS, SEED_MESSAGES, 
  SEED_MEMORIES, SEED_STATUSES, SEED_NOTIFICATIONS, 
  SEED_STREAKS, DEFAULT_PRIVACY, SEED_CALLS, SEED_SCHEDULED_MESSAGES 
} from './seedData';
import { analyzeMessageWithAI } from '../ai/analyzer';

class MockDataStore extends EventTarget {
  private currentUser: Profile;
  private contacts: Profile[];
  private chats: Chat[];
  private messages: Record<string, Message[]>;
  private memories: AIMemory[];
  private statuses: StatusItem[];
  private notifications: NotificationItem[];
  private streaks: Record<string, ChatStreak>;
  private privacy: PrivacySettings;
  private blockedUserIds: string[] = [];
  private starredMessageIds: string[] = [];
  private callRecords: CallRecord[] = [];
  private scheduledMessages: ScheduledMessage[] = [];

  constructor() {
    super();
    this.currentUser = this.load('mindchat_user', CURRENT_USER);
    this.contacts = this.load('mindchat_contacts', DEMO_USERS);
    this.chats = this.load('mindchat_chats', SEED_CHATS);
    this.messages = this.load('mindchat_messages', SEED_MESSAGES);
    this.memories = this.load('mindchat_memories', SEED_MEMORIES);
    this.statuses = this.load('mindchat_statuses', SEED_STATUSES);
    this.notifications = this.load('mindchat_notifications', SEED_NOTIFICATIONS);
    this.streaks = this.load('mindchat_streaks', SEED_STREAKS);
    this.privacy = this.load('mindchat_privacy', DEFAULT_PRIVACY);
    this.blockedUserIds = this.load('mindchat_blocked', []);
    
    // Seed starred IDs from messages that have is_starred: true
    const defaultStarredIds: string[] = [];
    Object.values(this.messages).forEach(mList => {
      mList.forEach(m => {
        if (m.is_starred) defaultStarredIds.push(m.id);
      });
    });
    this.starredMessageIds = this.load('mindchat_starred_ids', defaultStarredIds);
    this.callRecords = this.load('mindchat_call_records', SEED_CALLS);
    this.scheduledMessages = this.load('mindchat_scheduled_messages', SEED_SCHEDULED_MESSAGES);

    // Set up timer check interval for disappearing & scheduled messages
    this.initTimerEngine();
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return fallback;
  }

  private save(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  private notify(event: string, detail?: any) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
    this.dispatchEvent(new CustomEvent('change'));
  }

  // --- Disappearing & Scheduled Messages Engine ---
  private initTimerEngine() {
    setInterval(() => {
      let changed = false;
      const now = new Date().getTime();

      // 1. Process expiring disappearing messages
      Object.keys(this.messages).forEach(chatId => {
        const chatMsgs = this.messages[chatId];
        chatMsgs.forEach(msg => {
          if (msg.expires_at && !msg.is_expired) {
            const expTime = new Date(msg.expires_at).getTime();
            if (now >= expTime) {
              msg.is_expired = true;
              msg.content = '⏱ This message has expired and disappeared.';
              changed = true;
            }
          }
        });
      });

      if (changed) {
        this.save('mindchat_messages', this.messages);
        this.notify('messages_updated');
      }

      // 2. Process automated server-side/client scheduled deliveries
      let scheduledChanged = false;
      this.scheduledMessages.forEach(item => {
        if (item.status === 'pending') {
          const schedTime = new Date(item.scheduled_for).getTime();
          if (now >= schedTime) {
            item.status = 'delivered';
            item.delivered_at = new Date().toISOString();
            item.updated_at = new Date().toISOString();
            scheduledChanged = true;

            // Deliver message automatically into destination chat
            const deliveredMsg: Message = {
              id: 'msg_sched_' + Math.random().toString(36).substring(2, 9),
              chat_id: item.chat_id,
              sender_id: item.sender_id,
              content: item.content,
              message_type: item.message_type,
              status: 'delivered',
              created_at: item.scheduled_for || new Date().toISOString(),
            };

            if (!this.messages[item.chat_id]) {
              this.messages[item.chat_id] = [];
            }
            this.messages[item.chat_id].push(deliveredMsg);
            changed = true;
          }
        }
      });

      if (scheduledChanged) {
        this.save('mindchat_scheduled_messages', this.scheduledMessages);
        this.save('mindchat_messages', this.messages);
        this.notify('scheduled_updated');
        this.notify('messages_updated');
      }
    }, 1000);
  }

  // --- Current User & Profile ---
  getCurrentUser(): Profile {
    return this.currentUser;
  }

  updateCurrentUser(updates: Partial<Profile>) {
    this.currentUser = { ...this.currentUser, ...updates, updated_at: new Date().toISOString() };
    this.save('mindchat_user', this.currentUser);
    this.notify('user_updated', this.currentUser);
  }

  addUserTag(tag: string) {
    const currentTags = this.currentUser.tags || [];
    if (!currentTags.includes(tag)) {
      this.updateCurrentUser({ tags: [...currentTags, tag] });
    }
  }

  removeUserTag(tag: string) {
    const currentTags = this.currentUser.tags || [];
    this.updateCurrentUser({ tags: currentTags.filter(t => t !== tag) });
  }

  // --- Contacts ---
  getContacts(): Profile[] {
    return this.contacts.filter(c => !this.blockedUserIds.includes(c.id));
  }

  getBlockedContacts(): Profile[] {
    return this.contacts.filter(c => this.blockedUserIds.includes(c.id));
  }

  addContact(contact: Profile) {
    if (!this.contacts.some(c => c.id === contact.id)) {
      this.contacts.push(contact);
      this.save('mindchat_contacts', this.contacts);
      this.notify('contacts_updated');
    }
  }

  blockUser(userId: string) {
    if (!this.blockedUserIds.includes(userId)) {
      this.blockedUserIds.push(userId);
      this.save('mindchat_blocked', this.blockedUserIds);
      this.notify('contacts_updated');
    }
  }

  unblockUser(userId: string) {
    this.blockedUserIds = this.blockedUserIds.filter(id => id !== userId);
    this.save('mindchat_blocked', this.blockedUserIds);
    this.notify('contacts_updated');
  }

  // --- Chats ---
  getChats(): Chat[] {
    return this.chats.map(chat => {
      const msgs = this.messages[chat.id] || [];
      const validMsgs = msgs.filter(m => !m.deleted_at);
      const lastMsg = validMsgs[validMsgs.length - 1];
      const hasAi = validMsgs.some(m => m.ai_classification?.status === 'pending_review');

      return {
        ...chat,
        last_message: lastMsg,
        has_ai_important: hasAi,
      };
    });
  }

  getChatById(chatId: string): Chat | undefined {
    return this.getChats().find(c => c.id === chatId);
  }

  createChat(chat: Omit<Chat, 'id' | 'created_at' | 'updated_at'>): Chat {
    const newChat: Chat = {
      ...chat,
      id: 'chat_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.chats.unshift(newChat);
    this.messages[newChat.id] = [];
    this.save('mindchat_chats', this.chats);
    this.save('mindchat_messages', this.messages);
    this.notify('chats_updated');
    return newChat;
  }

  toggleArchiveChat(chatId: string) {
    this.chats = this.chats.map(c => c.id === chatId ? { ...c, is_archived: !c.is_archived } : c);
    this.save('mindchat_chats', this.chats);
    this.notify('chats_updated');
  }

  togglePinChat(chatId: string) {
    this.chats = this.chats.map(c => c.id === chatId ? { ...c, is_pinned: !c.is_pinned } : c);
    this.save('mindchat_chats', this.chats);
    this.notify('chats_updated');
  }

  setChatTimer(chatId: string, seconds: number) {
    this.chats = this.chats.map(c => c.id === chatId ? { ...c, default_timer_seconds: seconds } : c);
    this.save('mindchat_chats', this.chats);
    this.notify('chats_updated');
  }

  // --- Messages ---
  getMessages(chatId: string): Message[] {
    return (this.messages[chatId] || []).filter(m => !m.deleted_at);
  }

  async sendMessage(chatId: string, content: string, options?: {
    messageType?: Message['message_type'];
    durationSeconds?: number;
    deleteAfterRead?: boolean;
    replyToMessageId?: string;
  }): Promise<Message> {
    const chat = this.chats.find(c => c.id === chatId);
    const duration = options?.durationSeconds ?? chat?.default_timer_seconds ?? 0;
    
    let expiresAt: string | undefined = undefined;
    if (duration > 0) {
      expiresAt = new Date(Date.now() + duration * 1000).toISOString();
    }

    const replyMsg = options?.replyToMessageId 
      ? this.getMessages(chatId).find(m => m.id === options.replyToMessageId) 
      : undefined;

    const newMessage: Message = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      chat_id: chatId,
      sender_id: this.currentUser.id,
      content,
      message_type: options?.messageType || 'text',
      status: 'sent',
      reply_to_message_id: options?.replyToMessageId,
      reply_to: replyMsg,
      duration_seconds: duration > 0 ? duration : undefined,
      expires_at: expiresAt,
      delete_after_read: options?.deleteAfterRead || false,
      created_at: new Date().toISOString(),
    };

    // AI Analysis check
    if (this.privacy.ai_chat_analysis_enabled && chat?.ai_enabled !== false) {
      const aiAnalysis = analyzeMessageWithAI(content);
      if (aiAnalysis.isImportant) {
        newMessage.ai_classification = {
          id: 'ai_cls_' + Math.random().toString(36).substring(2, 9),
          message_id: newMessage.id,
          classification: aiAnalysis.classification,
          confidence: aiAnalysis.confidence,
          extracted_data: aiAnalysis.extractedData,
          status: 'pending_review',
        };

        // Also add AI notification
        this.addNotification({
          type: 'ai_insight',
          title: '✦ Potentially Important Detected',
          content: `AI detected ${aiAnalysis.classification.toUpperCase()} in message: "${content.substring(0, 50)}..."`,
          source_chat_id: chatId,
          source_message_id: newMessage.id,
        });
      }
    }

    if (!this.messages[chatId]) {
      this.messages[chatId] = [];
    }
    this.messages[chatId].push(newMessage);
    this.save('mindchat_messages', this.messages);

    // Update streak for active conversation
    this.recordInteractionForStreak(chatId);

    // Mark as delivered then read shortly after
    setTimeout(() => {
      newMessage.status = 'delivered';
      this.save('mindchat_messages', this.messages);
      this.notify('messages_updated');
    }, 600);

    setTimeout(() => {
      newMessage.status = 'read';
      this.save('mindchat_messages', this.messages);
      this.notify('messages_updated');
    }, 1500);

    this.notify('messages_updated');

    // Peer automatic reply simulation for realistic demo experience
    this.simulatePeerReplyIfDemo(chatId, content);

    return newMessage;
  }

  private simulatePeerReplyIfDemo(chatId: string, userMessage: string) {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat || chat.type === 'group') return;

    // Direct peer is the other member
    const peer = chat.members?.find(m => m.id !== this.currentUser.id);
    if (!peer) return;

    const lower = userMessage.toLowerCase();
    let replyText = '';
    let isKannada = false;

    if (lower.includes('review') || lower.includes('project') || lower.includes('ppt')) {
      replyText = "Got it! I am finalizing the slides and test metrics now. See you tomorrow!";
    } else if (lower.includes('college') || lower.includes('class') || lower.includes('when')) {
      replyText = "ಹೌದು, ನಾನು ಲ್ಯಾಬ್‌ನಲ್ಲಿದ್ದೇನೆ (Yes, I am in the lab). Let me know when you reach!";
      isKannada = true;
    } else if (lower.includes('hello') || lower.includes('hey') || lower.includes('hi')) {
      replyText = `Hey there! Working on the MindChat build. How is your progress?`;
    }

    if (replyText) {
      setTimeout(() => {
        const peerMsg: Message = {
          id: 'msg_peer_' + Math.random().toString(36).substring(2, 9),
          chat_id: chatId,
          sender_id: peer.id,
          content: replyText,
          message_type: 'text',
          status: 'delivered',
          is_translated: isKannada,
          translated_content: isKannada ? 'Yes, I am in the lab. Let me know when you reach!' : undefined,
          translated_language: isKannada ? 'kn' : undefined,
          created_at: new Date().toISOString(),
        };

        if (this.messages[chatId]) {
          this.messages[chatId].push(peerMsg);
          this.save('mindchat_messages', this.messages);
          this.notify('messages_updated');
        }
      }, 2500);
    }
  }

  editMessage(chatId: string, messageId: string, newContent: string) {
    const chatMsgs = this.messages[chatId] || [];
    const msg = chatMsgs.find(m => m.id === messageId);
    if (msg) {
      msg.content = newContent;
      msg.edited_at = new Date().toISOString();
      this.save('mindchat_messages', this.messages);
      this.notify('messages_updated');
    }
  }

  deleteMessage(chatId: string, messageId: string) {
    const chatMsgs = this.messages[chatId] || [];
    const msg = chatMsgs.find(m => m.id === messageId);
    if (msg) {
      msg.deleted_at = new Date().toISOString();
      this.save('mindchat_messages', this.messages);
      this.notify('messages_updated');
    }
  }

  toggleStarMessage(chatId: string, messageId: string) {
    const isCurrentlyStarred = this.starredMessageIds.includes(messageId);
    if (isCurrentlyStarred) {
      this.starredMessageIds = this.starredMessageIds.filter(id => id !== messageId);
    } else {
      this.starredMessageIds.push(messageId);
    }
    this.save('mindchat_starred_ids', this.starredMessageIds);

    // Update in messages object
    const chatMsgs = this.messages[chatId] || [];
    const msg = chatMsgs.find(m => m.id === messageId);
    if (msg) {
      msg.is_starred = !isCurrentlyStarred;
      this.save('mindchat_messages', this.messages);
    }

    this.notify('starred_updated');
    this.notify('messages_updated');
  }

  isMessageStarred(messageId: string): boolean {
    return this.starredMessageIds.includes(messageId);
  }

  getStarredMessages(): { msg: Message; chat: Chat; chatName: string }[] {
    const results: { msg: Message; chat: Chat; chatName: string }[] = [];
    const starSet = new Set(this.starredMessageIds);

    Object.entries(this.messages).forEach(([chatId, msgs]) => {
      const chat = this.chats.find(c => c.id === chatId) || ({ id: chatId, name: 'Chat' } as Chat);
      const chatName = chat.name || (chat.members?.find(m => m.id !== this.currentUser.id)?.display_name) || 'Chat';
      msgs.forEach(m => {
        if (starSet.has(m.id) || m.is_starred) {
          results.push({ msg: { ...m, is_starred: true }, chat, chatName });
        }
      });
    });

    return results;
  }

  addReaction(chatId: string, messageId: string, emoji: string) {
    const chatMsgs = this.messages[chatId] || [];
    const msg = chatMsgs.find(m => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = [];
      const existing = msg.reactions.find(r => r.user_id === this.currentUser.id && r.emoji === emoji);
      if (existing) {
        msg.reactions = msg.reactions.filter(r => r !== existing);
      } else {
        msg.reactions.push({
          id: 'rx_' + Math.random().toString(36).substring(2, 9),
          message_id: messageId,
          user_id: this.currentUser.id,
          emoji,
        });
      }
      this.save('mindchat_messages', this.messages);
      this.notify('messages_updated');
    }
  }

  setMessageTranslation(chatId: string, messageId: string, translated: string, langCode: string) {
    const chatMsgs = this.messages[chatId] || [];
    const msg = chatMsgs.find(m => m.id === messageId);
    if (msg) {
      msg.is_translated = true;
      msg.translated_content = translated;
      msg.translated_language = langCode;
      this.save('mindchat_messages', this.messages);
      this.notify('messages_updated');
    }
  }

  // --- AI Memory Actions ---
  getMemories(): AIMemory[] {
    return this.memories;
  }

  approveAIMemory(messageId: string, overrides?: Partial<AIMemory>): AIMemory | null {
    // Locate the message across chats
    let foundMsg: Message | null = null;
    let foundChat: Chat | null = null;

    for (const cid of Object.keys(this.messages)) {
      const match = this.messages[cid].find(m => m.id === messageId);
      if (match) {
        foundMsg = match;
        foundChat = this.chats.find(c => c.id === cid) || null;
        break;
      }
    }

    if (!foundMsg || !foundMsg.ai_classification) return null;

    foundMsg.ai_classification.status = 'approved';

    const ext = foundMsg.ai_classification.extracted_data;
    const newMemory: AIMemory = {
      id: 'mem_' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentUser.id,
      title: overrides?.title || ext?.title || 'Important Note',
      category: overrides?.category || (foundMsg.ai_classification.classification === 'deadline' ? 'deadlines' : 'tasks'),
      content: overrides?.content || ext?.action_item || foundMsg.content,
      event_timestamp: overrides?.event_timestamp || new Date(Date.now() + 86400000).toISOString(),
      source_chat_id: foundMsg.chat_id,
      source_chat_name: foundChat?.name || 'Chat',
      source_message_id: foundMsg.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.memories.unshift(newMemory);
    this.save('mindchat_memories', this.memories);
    this.save('mindchat_messages', this.messages);
    this.notify('memories_updated');
    this.notify('messages_updated');

    return newMemory;
  }

  dismissAIMemory(messageId: string) {
    for (const cid of Object.keys(this.messages)) {
      const match = this.messages[cid].find(m => m.id === messageId);
      if (match && match.ai_classification) {
        match.ai_classification.status = 'dismissed';
        this.save('mindchat_messages', this.messages);
        this.notify('messages_updated');
        break;
      }
    }
  }

  deleteMemory(memoryId: string) {
    this.memories = this.memories.filter(m => m.id !== memoryId);
    this.save('mindchat_memories', this.memories);
    this.notify('memories_updated');
  }

  updateMemory(memoryId: string, updates: Partial<AIMemory>) {
    this.memories = this.memories.map(m => m.id === memoryId ? { ...m, ...updates, updated_at: new Date().toISOString() } : m);
    this.save('mindchat_memories', this.memories);
    this.notify('memories_updated');
  }

  // --- Smart Cleanup ---
  executeCleanup(messageIdsToDelete: string[]) {
    const idSet = new Set(messageIdsToDelete);
    Object.keys(this.messages).forEach(cid => {
      this.messages[cid] = this.messages[cid].filter(m => !idSet.has(m.id));
    });
    this.save('mindchat_messages', this.messages);
    this.notify('messages_updated');
  }

  // --- Streaks ---
  getStreak(chatId: string): ChatStreak | undefined {
    return this.streaks[chatId];
  }

  private recordInteractionForStreak(chatId: string) {
    if (!this.privacy.streaks_enabled) return;
    const today = new Date().toISOString().split('T')[0];
    const current = this.streaks[chatId] || {
      id: 'strk_' + Math.random().toString(36).substring(2, 9),
      chat_id: chatId,
      streak_count: 1,
      last_interaction_date: today,
      milestone_hit: 0,
      is_enabled: true,
    };

    if (current.last_interaction_date !== today) {
      current.streak_count += 1;
      current.last_interaction_date = today;

      // Check milestones
      if (current.streak_count >= 100) current.milestone_hit = 100;
      else if (current.streak_count >= 30) current.milestone_hit = 30;
      else if (current.streak_count >= 7) current.milestone_hit = 7;
    }

    this.streaks[chatId] = current;
    this.save('mindchat_streaks', this.streaks);
    this.notify('streaks_updated');
  }

  // --- Statuses ---
  getStatuses(): StatusItem[] {
    const now = new Date().getTime();
    return this.statuses.filter(s => new Date(s.expires_at).getTime() > now);
  }

  addStatus(content: string, mediaType: 'text' | 'image' | 'video' = 'text', mediaUrl?: string) {
    const newStatus: StatusItem = {
      id: 'stat_' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentUser.id,
      user: this.currentUser,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
      audience: 'contacts',
      expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
      views_count: 0,
      created_at: new Date().toISOString(),
    };
    this.statuses.unshift(newStatus);
    this.save('mindchat_statuses', this.statuses);
    this.notify('statuses_updated');
  }

  // --- Notifications ---
  getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'user_id' | 'is_read' | 'created_at'>) {
    const newNotif: NotificationItem = {
      ...notif,
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentUser.id,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    this.save('mindchat_notifications', this.notifications);
    this.notify('notifications_updated');
  }

  markNotificationAsRead(id: string) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    this.save('mindchat_notifications', this.notifications);
    this.notify('notifications_updated');
  }

  deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.save('mindchat_notifications', this.notifications);
    this.notify('notifications_updated');
  }

  // --- Privacy Settings ---
  getPrivacySettings(): PrivacySettings {
    return this.privacy;
  }

  updatePrivacySettings(updates: Partial<PrivacySettings>) {
    this.privacy = { ...this.privacy, ...updates };
    this.save('mindchat_privacy', this.privacy);
    this.notify('privacy_updated');
  }

  // --- Calling Records ---
  getCallRecords(): CallRecord[] {
    return this.callRecords.map(c => {
      const caller = c.caller || (c.caller_id === this.currentUser.id ? this.currentUser : this.contacts.find(ct => ct.id === c.caller_id));
      const receiver = c.receiver || (c.receiver_id === this.currentUser.id ? this.currentUser : this.contacts.find(ct => ct.id === c.receiver_id));
      return { ...c, caller, receiver };
    });
  }

  addCallRecord(record: Omit<CallRecord, 'id' | 'created_at'>): CallRecord {
    const caller = record.caller_id === this.currentUser.id ? this.currentUser : this.contacts.find(c => c.id === record.caller_id);
    const receiver = record.receiver_id === this.currentUser.id ? this.currentUser : this.contacts.find(c => c.id === record.receiver_id);
    
    const newRecord: CallRecord = {
      ...record,
      id: 'call_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      caller,
      receiver,
    };
    this.callRecords.unshift(newRecord);
    this.save('mindchat_call_records', this.callRecords);
    this.notify('calls_updated', newRecord);
    return newRecord;
  }

  deleteCallRecord(id: string) {
    this.callRecords = this.callRecords.filter(c => c.id !== id);
    this.save('mindchat_call_records', this.callRecords);
    this.notify('calls_updated');
  }

  // --- Scheduled Messages ---
  getScheduledMessages(chatId?: string): ScheduledMessage[] {
    if (chatId) {
      return this.scheduledMessages.filter(s => s.chat_id === chatId);
    }
    return this.scheduledMessages;
  }

  scheduleMessage(
    chatId: string,
    content: string,
    scheduledFor: string,
    timezone: string,
    messageType: Message['message_type'] = 'text'
  ): ScheduledMessage {
    const chat = this.chats.find(c => c.id === chatId);
    const chatName = chat?.name || (chat?.members?.find(m => m.id !== this.currentUser.id)?.display_name) || 'Direct Chat';

    const newScheduled: ScheduledMessage = {
      id: 'sched_' + Math.random().toString(36).substring(2, 9),
      chat_id: chatId,
      sender_id: this.currentUser.id,
      content,
      message_type: messageType,
      scheduled_for: scheduledFor,
      timezone,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      chat_name: chatName,
    };

    this.scheduledMessages.unshift(newScheduled);
    this.save('mindchat_scheduled_messages', this.scheduledMessages);
    this.notify('scheduled_updated', newScheduled);
    return newScheduled;
  }

  editScheduledMessage(id: string, newContent: string) {
    const item = this.scheduledMessages.find(s => s.id === id);
    if (item && item.status === 'pending') {
      item.content = newContent;
      item.updated_at = new Date().toISOString();
      this.save('mindchat_scheduled_messages', this.scheduledMessages);
      this.notify('scheduled_updated');
    }
  }

  rescheduleMessage(id: string, newScheduledFor: string, newTimezone: string) {
    const item = this.scheduledMessages.find(s => s.id === id);
    if (item && item.status === 'pending') {
      item.scheduled_for = newScheduledFor;
      item.timezone = newTimezone;
      item.updated_at = new Date().toISOString();
      this.save('mindchat_scheduled_messages', this.scheduledMessages);
      this.notify('scheduled_updated');
    }
  }

  cancelScheduledMessage(id: string) {
    const item = this.scheduledMessages.find(s => s.id === id);
    if (item) {
      item.status = 'cancelled';
      item.updated_at = new Date().toISOString();
      this.save('mindchat_scheduled_messages', this.scheduledMessages);
      this.notify('scheduled_updated');
    }
  }

  deleteScheduledMessage(id: string) {
    this.scheduledMessages = this.scheduledMessages.filter(s => s.id !== id);
    this.save('mindchat_scheduled_messages', this.scheduledMessages);
    this.notify('scheduled_updated');
  }

  async sendScheduledMessageNow(id: string) {
    const item = this.scheduledMessages.find(s => s.id === id);
    if (!item || item.status !== 'pending') return;

    item.status = 'delivered';
    item.delivered_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();
    this.save('mindchat_scheduled_messages', this.scheduledMessages);

    await this.sendMessage(item.chat_id, item.content, {
      messageType: item.message_type,
    });
    this.notify('scheduled_updated');
  }
}

export const mockStore = new MockDataStore();
