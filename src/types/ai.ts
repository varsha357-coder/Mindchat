import { AIClassification, AIClassificationType, MemoryCategory, Message } from './database';

export interface AIAnalysisResult {
  classification: AIClassificationType;
  confidence: number;
  isImportant: boolean;
  extractedData?: {
    title?: string;
    event?: string;
    date?: string;
    time?: string;
    priority?: 'high' | 'medium' | 'low';
    action_item?: string;
    person?: string;
    category?: MemoryCategory;
  };
  reasoning?: string;
}

export interface ChatSummaryOutput {
  periodType: 'today' | '7_days' | 'custom' | 'entire';
  dateRange: string;
  mainTopics: string[];
  decisions: string[];
  tasks: { title: string; assignee?: string; due?: string }[];
  deadlines: { title: string; due: string }[];
  actionItems: string[];
  sourceMessageIds: string[];
}

export interface AISearchResultItem {
  message: Message;
  senderName: string;
  chatName: string;
  matchedSnippet: string;
  relevanceScore: number;
  extractedContext?: string;
}

export interface SmartCleanupItem {
  messageId: string;
  senderName: string;
  content: string;
  reason: 'casual_smalltalk' | 'expired_temporary' | 'repeated' | 'low_information';
  timestamp: string;
  selected: boolean;
}
