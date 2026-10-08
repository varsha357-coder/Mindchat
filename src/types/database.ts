export type OnlineStatus = 'online' | 'offline' | 'dnd' | 'away';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  about: string;
  online_status: OnlineStatus;
  last_seen: string;
  preferred_language: string;
  ai_analysis_enabled: boolean;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

export interface ProfileTag {
  id: string;
  user_id: string;
  tag: string;
  color?: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  profile: Profile;
  nickname?: string;
  is_favorite: boolean;
  is_blocked?: boolean;
  created_at: string;
}

export type ChatType = 'direct' | 'group';

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatar_url?: string;
  created_by?: string;
  default_timer_seconds: number;
  ai_enabled: boolean;
  last_message?: Message;
  unread_count?: number;
  is_pinned?: boolean;
  is_archived?: boolean;
  has_ai_important?: boolean;
  members?: Profile[];
  created_at: string;
  updated_at: string;
}

export type MessageType = 'text' | 'image' | 'document' | 'voice' | 'video' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  status?: MessageStatus;
  reply_to_message_id?: string;
  reply_to?: Message;
  is_starred?: boolean;
  expires_at?: string; // ISO date if timed
  duration_seconds?: number; // Expiration duration
  delete_after_read?: boolean;
  is_expired?: boolean;
  is_translated?: boolean;
  translated_content?: string;
  translated_language?: string;
  ai_classification?: AIClassification;
  reactions?: MessageReaction[];
  attachments?: Attachment[];
  edited_at?: string;
  deleted_at?: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  url?: string;
}

export type MemoryCategory = 'tasks' | 'deadlines' | 'events' | 'decisions' | 'projects' | 'notes' | 'reminders';

export interface AIMemory {
  id: string;
  user_id: string;
  title: string;
  category: MemoryCategory;
  content: string;
  event_timestamp?: string;
  source_chat_id: string;
  source_chat_name?: string;
  source_message_id?: string;
  created_at: string;
  updated_at: string;
}

export type AIClassificationType = 
  | 'casual' 
  | 'important' 
  | 'task' 
  | 'reminder' 
  | 'deadline' 
  | 'event' 
  | 'decision' 
  | 'useful';

export interface AIClassification {
  id: string;
  message_id: string;
  classification: AIClassificationType;
  confidence: number;
  extracted_data?: {
    title?: string;
    event?: string;
    date?: string;
    time?: string;
    priority?: 'high' | 'medium' | 'low';
    action_item?: string;
    person?: string;
  };
  status: 'pending_review' | 'approved' | 'dismissed';
}

export interface StatusItem {
  id: string;
  user_id: string;
  user: Profile;
  content?: string;
  media_url?: string;
  media_type: 'text' | 'image' | 'video';
  audience: 'contacts' | 'everyone' | 'close_friends';
  expires_at: string;
  views_count: number;
  created_at: string;
}

export interface ChatStreak {
  id: string;
  chat_id: string;
  streak_count: number;
  last_interaction_date: string;
  milestone_hit: number;
  is_enabled: boolean;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'message' | 'mention' | 'ai_insight' | 'task' | 'deadline' | 'memory_suggestion';
  title: string;
  content: string;
  source_chat_id?: string;
  source_message_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface PrivacySettings {
  id?: string;
  user_id: string;
  see_profile_photo: 'everyone' | 'contacts' | 'nobody';
  see_online_status: 'everyone' | 'contacts' | 'nobody';
  see_last_seen: 'everyone' | 'contacts' | 'nobody';
  see_about: 'everyone' | 'contacts' | 'nobody';
  see_status: 'everyone' | 'contacts' | 'nobody';
  read_receipts_enabled: boolean;
  streaks_enabled: boolean;
  default_timer_seconds: number;
  ai_chat_analysis_enabled: boolean;
  ai_memory_suggestions_enabled: boolean;
  ai_summaries_enabled: boolean;
  ai_search_enabled: boolean;
}

export interface CallRecord {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'voice' | 'video';
  status: 'completed' | 'missed' | 'rejected' | 'busy';
  duration_seconds: number;
  created_at: string;
  caller?: Profile;
  receiver?: Profile;
}

export interface StarredMessageEntry {
  id: string;
  user_id: string;
  message_id: string;
  chat_id: string;
  created_at: string;
  message?: Message;
  chat_name?: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface ScheduledMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  scheduled_for: string; // ISO string
  timezone: string;
  status: 'pending' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  delivery_error?: string;
  chat_name?: string;
}

