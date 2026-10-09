import { Message, Profile } from './database';

export type CatchUpFilterPeriod = 
  | 'since_last_visit' 
  | 'unread' 
  | 'last_24h' 
  | 'last_7d' 
  | 'custom' 
  | 'entire';

export interface GroupCatchUpSourceMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  timestamp: string;
  category?: 'topic' | 'update' | 'decision' | 'task' | 'deadline' | 'question' | 'next_step';
}

export interface GroupCatchUpTaskItem {
  id: string;
  title: string;
  assignee?: string;
  deadline?: string;
  source_message_id?: string;
  is_completed?: boolean;
}

export interface GroupCatchUpDecisionItem {
  id: string;
  decision: string;
  decided_by?: string;
  context?: string;
  source_message_id?: string;
  is_confirmed: boolean; // Confirmed vs suggestion
}

export interface GroupCatchUpDeadlineItem {
  id: string;
  title: string;
  due_date: string;
  source_message_id?: string;
}

export interface GroupCatchUpSummary {
  id: string;
  chat_id: string;
  chat_name: string;
  chat_avatar_url?: string;
  requested_by: string;
  period_type: CatchUpFilterPeriod;
  date_range_label: string;
  start_date?: string;
  end_date?: string;
  message_count: number;
  last_included_message_id?: string;
  last_included_timestamp?: string;
  
  // Exactly 5 to 7 simple, meaningful lines
  summary_lines: string[];
  
  // Structured extractions for interactive breakdown
  main_topics: string[];
  key_updates: string[];
  decisions: GroupCatchUpDecisionItem[];
  tasks: GroupCatchUpTaskItem[];
  deadlines: GroupCatchUpDeadlineItem[];
  unresolved_questions: string[];
  next_steps: Array<{
    action: string;
    responsible?: string;
    source_message_id?: string;
  }>;
  
  // Linked source messages for citations and jump-to-chat
  source_messages: GroupCatchUpSourceMessage[];
  
  // Cache and freshness status
  created_at: string;
  updated_at: string;
  version: number;
  has_newer_messages?: boolean;
  newer_message_count?: number;
}
