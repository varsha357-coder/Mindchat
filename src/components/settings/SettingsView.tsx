import React, { useState } from 'react';
import { 
  Shield, Brain, Globe, Clock, Lock, Bell, 
  Trash2, Download, Check, Database, Sparkles 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { INDIAN_LANGUAGES } from '../../types/translation';
import { Button } from '../common/Button';
import { getBackendStatus } from '../../lib/supabase';
import { MindChatAIIcon } from '../common/MindChatLogo';
import { ConnectSupabaseModal } from '../common/ConnectSupabaseModal';

export const SettingsView: React.FC = () => {
  const { privacySettings, updatePrivacySettings } = useChat();
  const { currentUser, updateProfile, isBackendConnected } = useAuth();
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const backendStatus = getBackendStatus();

  const handleExportData = () => {
    const data = {
      user: currentUser,
      privacy: privacySettings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindchat-export-${currentUser.username}.json`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-y-auto p-6 md:p-8 select-none animate-fade-in">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-border">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Settings & Privacy</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Configure who can see your information, adjust AI analysis, and choose language preferences.
          </p>
        </div>

        {/* Backend & Deployment Mode Indicator */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-text-primary flex items-center gap-2">
              <Database size={16} className="text-primary" />
              <span>Platform Backend Infrastructure</span>
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              isBackendConnected
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
            }`}>
              ● {isBackendConnected ? 'Supabase Connected' : 'Local Sandbox Mode'}
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Running mode: <strong>{backendStatus.providerName}</strong>. Real-time PostgreSQL, Row Level Security, and user accounts.
          </p>
          <div className="pt-1">
            <Button variant="secondary" size="sm" onClick={() => setIsConnectOpen(true)}>
              <Database size={14} className="mr-1.5 text-primary" />
              <span>{isBackendConnected ? 'Configure Supabase Keys' : 'Connect to Live Supabase Backend'}</span>
            </Button>
          </div>
        </div>

        {/* Preferred Indian Translation Language */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
            <Globe size={18} className="text-secondary" />
            <span>Preferred Translation Language</span>
          </div>
          <p className="text-xs text-text-secondary">
            Incoming messages in other languages can be translated to your preferred Indian language at the touch of a button.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INDIAN_LANGUAGES.map(lang => {
              const isSelected = currentUser.preferred_language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => updateProfile({ preferred_language: lang.code })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? 'border-secondary bg-secondary/10 text-secondary font-semibold shadow-glow-secondary'
                      : 'border-border bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <div className="font-bold text-text-primary">{lang.name}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{lang.nativeName}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Philosophy & Consent Controls */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
              <MindChatAIIcon size={18} animate />
              <span>AI Analysis & Memory Safeguards</span>
            </div>
            <span className="text-[11px] text-primary font-bold">AI understands. You decide.</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Toggle 1: AI Analysis */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary/50 border border-border">
              <div>
                <div className="font-semibold text-xs text-text-primary">AI Chat Analysis</div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Allows MindChat to identify tasks, deadlines, and dates in your conversations.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.ai_chat_analysis_enabled}
                onChange={e => updatePrivacySettings({ ai_chat_analysis_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Toggle 2: Memory Suggestions */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary/50 border border-border">
              <div>
                <div className="font-semibold text-xs text-text-primary">AI Memory Suggestions</div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Shows ✦ Save to Memory banners on important messages.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.ai_memory_suggestions_enabled}
                onChange={e => updatePrivacySettings({ ai_memory_suggestions_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Toggle 3: Natural Language Search */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary/50 border border-border">
              <div>
                <div className="font-semibold text-xs text-text-primary">Natural Language Search</div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Allows asking questions ("When is the review?") across authorized chats.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.ai_search_enabled}
                onChange={e => updatePrivacySettings({ ai_search_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Messaging & Ephemeral Controls */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
            <Clock size={18} className="text-amber-500" />
            <span>Messaging & Ephemeral Defaults</span>
          </div>

          <div className="space-y-3">
            {/* Read Receipts */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary/50 border border-border">
              <div>
                <div className="font-semibold text-xs text-text-primary">Read Receipts (✓✓)</div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Let peers see when you've read their messages.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.read_receipts_enabled}
                onChange={e => updatePrivacySettings({ read_receipts_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Chat Streaks */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary/50 border border-border">
              <div>
                <div className="font-semibold text-xs text-text-primary">Chat Streaks (🔥)</div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Track consecutive active daily conversations without message spam.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.streaks_enabled}
                onChange={e => updatePrivacySettings({ streaks_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Account Privacy Controls */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
            <Lock size={18} className="text-success" />
            <span>Account Visibility</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-secondary/50 border border-border">
              <label className="block font-semibold text-text-secondary mb-1">Who can see my profile photo</label>
              <select
                value={privacySettings.see_profile_photo}
                onChange={e => updatePrivacySettings({ see_profile_photo: e.target.value as any })}
                className="w-full bg-surface border border-border rounded-lg p-2 text-text-primary"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary/50 border border-border">
              <label className="block font-semibold text-text-secondary mb-1">Who can see my Online status</label>
              <select
                value={privacySettings.see_online_status}
                onChange={e => updatePrivacySettings({ see_online_status: e.target.value as any })}
                className="w-full bg-surface border border-border rounded-lg p-2 text-text-primary"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Actions */}
        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-text-primary">Export My Conversation Data</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Download your profile, settings, and memory records in portable JSON format.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportData}>
            <Download size={14} className="mr-1.5" />
            <span>Export Data</span>
          </Button>
        </div>
      </div>

      <ConnectSupabaseModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
      />
    </div>
  );
};
