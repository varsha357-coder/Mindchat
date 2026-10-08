import React, { createContext, useContext, useEffect, useState } from 'react';
import { AIMemory, Message } from '../types/database';
import { ChatSummaryOutput, AISearchResultItem } from '../types/ai';
import { mockStore } from '../services/mock/mockStore';
import { summarizeChatMessages } from '../services/ai/summarizer';
import { searchChatsWithNL } from '../services/ai/search';
import { useChat } from './ChatContext';
import { useAuth } from './AuthContext';

interface AIContextType {
  memories: AIMemory[];
  pendingSuggestions: Message[];
  approveMemory: (messageId: string, overrides?: Partial<AIMemory>) => AIMemory | null;
  dismissMemory: (messageId: string) => void;
  deleteMemory: (memoryId: string) => void;
  updateMemory: (memoryId: string, updates: Partial<AIMemory>) => void;
  generateSummary: (chatId: string, periodType?: 'today' | '7_days' | 'custom' | 'entire') => ChatSummaryOutput;
  searchNL: (query: string) => AISearchResultItem[];
  runCleanup: (messageIds: string[]) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memories, setMemories] = useState<AIMemory[]>(() => mockStore.getMemories());
  const { allMessages, chats, contacts } = useChat();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleUpdate = () => {
      setMemories([...mockStore.getMemories()]);
    };

    mockStore.addEventListener('memories_updated', handleUpdate);
    return () => mockStore.removeEventListener('memories_updated', handleUpdate);
  }, []);

  // Compute pending suggestions across all chats
  const pendingSuggestions: Message[] = [];
  Object.values(allMessages).forEach(msgList => {
    msgList.forEach(m => {
      if (m.ai_classification?.status === 'pending_review') {
        pendingSuggestions.push(m);
      }
    });
  });

  const approveMemory = (messageId: string, overrides?: Partial<AIMemory>) => {
    const res = mockStore.approveAIMemory(messageId, overrides);
    setMemories([...mockStore.getMemories()]);
    return res;
  };

  const dismissMemory = (messageId: string) => {
    mockStore.dismissAIMemory(messageId);
  };

  const deleteMemory = (memoryId: string) => {
    mockStore.deleteMemory(memoryId);
  };

  const updateMemory = (memoryId: string, updates: Partial<AIMemory>) => {
    mockStore.updateMemory(memoryId, updates);
  };

  const generateSummary = (chatId: string, periodType: 'today' | '7_days' | 'custom' | 'entire' = 'entire') => {
    const msgs = allMessages[chatId] || [];
    return summarizeChatMessages(msgs, periodType);
  };

  const searchNL = (query: string): AISearchResultItem[] => {
    return searchChatsWithNL(query, chats, allMessages, contacts, currentUser);
  };

  const runCleanup = (messageIds: string[]) => {
    mockStore.executeCleanup(messageIds);
  };

  return (
    <AIContext.Provider
      value={{
        memories,
        pendingSuggestions,
        approveMemory,
        dismissMemory,
        deleteMemory,
        updateMemory,
        generateSummary,
        searchNL,
        runCleanup,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within an AIProvider');
  return context;
};
