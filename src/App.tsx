import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { AIProvider } from './contexts/AIContext';

import { LandingPage } from './components/landing/LandingPage';
import { MainNavigation, ActiveNavTab } from './components/sidebar/MainNavigation';
import { ChatList } from './components/sidebar/ChatList';
import { ChatArea } from './components/chat/ChatArea';
import { CallsView } from './components/calling/CallsView';
import { AIMemoryView } from './components/ai/AIMemoryView';
import { AIInsightsDashboard } from './components/ai/AIInsightsDashboard';
import { ContactsView } from './components/contacts/ContactsView';
import { StarredView } from './components/starred/StarredView';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { SettingsView } from './components/settings/SettingsView';

import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { CallModal } from './components/calling/CallModal';
import { StatusModal } from './components/status/StatusModal';
import { AIChatSummaryModal } from './components/ai/AIChatSummaryModal';
import { AISearchModal } from './components/ai/AISearchModal';
import { SmartCleanupModal } from './components/ai/SmartCleanupModal';
import { NewChatModal } from './components/chat/NewChatModal';
import { ConnectSupabaseModal } from './components/common/ConnectSupabaseModal';

import { Profile } from './types/database';
import { Sparkles, Database, LogIn } from 'lucide-react';
import { MindChatAIIcon } from './components/common/MindChatLogo';

const MindChatAppContent: React.FC = () => {
  const { currentUser, isAuthenticated, showOnboarding, setShowOnboarding } = useAuth();
  const { selectChat, activeChat, contacts, jumpToMessage, startDirectChat } = useChat();

  const [showLanding, setShowLanding] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('chats');

  // Modal States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthSignUp, setIsAuthSignUp] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [customCallPeer, setCustomCallPeer] = useState<Profile | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isConnectSupabaseOpen, setIsConnectSupabaseOpen] = useState(false);

  // Calling contact target
  const callPeer: Profile = customCallPeer || (activeChat?.members?.find(m => m.id !== currentUser.id) || contacts[0]) as Profile;

  const handleStartCall = (type: 'voice' | 'video', contact?: Profile) => {
    if (contact) {
      setCustomCallPeer(contact);
    } else {
      setCustomCallPeer(null);
    }
    setCallType(type);
    setIsCallOpen(true);
  };

  const handleJumpToMessage = (chatId: string, messageId: string) => {
    jumpToMessage(chatId, messageId);
    setActiveTab('chats');
  };

  if (showLanding && !isAuthenticated) {
    return (
      <>
        <LandingPage
          onEnterApp={() => setShowLanding(false)}
          onOpenAuth={(isSignUp = false) => {
            setIsAuthSignUp(isSignUp);
            setIsAuthOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
            if (isAuthenticated) setShowLanding(false);
          }}
          isSignUpDefault={isAuthSignUp}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary mindchat-bg">
      {/* 1. Main Navigation Sidebar */}
      <MainNavigation
        activeTab={activeTab}
        onSelectTab={tab => setActiveTab(tab)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
        onOpenConnectSupabase={() => setIsConnectSupabaseOpen(true)}
      />

      {/* 2. Chat List Column (Shown during 'chats' tab) */}
      {activeTab === 'chats' && (
        <ChatList
          onOpenAISearch={() => setIsSearchOpen(true)}
          onOpenNewChat={() => setIsNewChatOpen(true)}
        />
      )}

      {/* 3. Main Center Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top subtle mode & status pill */}
        <div className="h-8 px-4 bg-surface/50 border-b border-border flex items-center justify-between text-[11px] text-text-muted select-none shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <button
              onClick={() => setIsConnectSupabaseOpen(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-text-primary transition-colors"
              title="Click to configure Supabase backend"
            >
              <Database size={12} className="text-primary" />
              <span className="font-semibold text-[11px]">
                {isAuthenticated ? 'Backend Active' : 'Connect Backend'}
              </span>
            </button>
            <span className="text-border">|</span>
            <span className="hidden sm:inline">"Chat freely. Remember what matters."</span>
          </div>

          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  setIsAuthSignUp(false);
                  setIsAuthOpen(true);
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary-hover flex items-center gap-1 transition-colors"
              >
                <LogIn size={12} />
                <span>Sign In / Sign Up</span>
              </button>
            ) : (
              <span className="text-[11px] text-text-secondary">
                Signed in as <strong className="text-text-primary">@{currentUser.username}</strong>
              </span>
            )}
            <button
              onClick={() => setIsStatusOpen(true)}
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>Statuses</span>
            </button>
            <button
              onClick={() => setShowLanding(true)}
              className="hover:text-text-primary transition-colors"
            >
              Landing Page
            </button>
          </div>
        </div>

        {/* View Routing */}
        <div className="flex-1 flex min-h-0 min-w-0">
          {activeTab === 'chats' && (
            <ChatArea
              onOpenSummary={() => setIsSummaryOpen(true)}
              onStartCall={handleStartCall}
              onSelectMemory={() => setActiveTab('memory')}
            />
          )}

          {activeTab === 'calls' && (
            <CallsView
              onStartCall={handleStartCall}
              onOpenChatWithContact={async contact => {
                await startDirectChat(contact);
                setActiveTab('chats');
              }}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsView
              onStartDirectChat={async contact => {
                await startDirectChat(contact);
                setActiveTab('chats');
              }}
            />
          )}

          {activeTab === 'memory' && (
            <AIMemoryView
              onJumpToChat={cid => {
                selectChat(cid);
                setActiveTab('chats');
              }}
            />
          )}

          {activeTab === 'insights' && (
            <AIInsightsDashboard
              onOpenCleanup={() => setIsCleanupOpen(true)}
              onOpenMemory={() => setActiveTab('memory')}
            />
          )}

          {activeTab === 'starred' && (
            <StarredView onJumpToMessage={handleJumpToMessage} />
          )}

          {activeTab === 'archived' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-text-muted">
              <h3 className="text-base font-bold text-text-primary mb-1">Archived Conversations</h3>
              <p>No conversations are currently archived.</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter
              onJumpToChat={cid => {
                selectChat(cid);
                setActiveTab('chats');
              }}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* Global Modals */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        isSignUpDefault={isAuthSignUp}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {callPeer && (
        <CallModal
          isOpen={isCallOpen}
          onClose={() => {
            setIsCallOpen(false);
            setCustomCallPeer(null);
          }}
          contact={callPeer}
          callType={callType}
        />
      )}

      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
      />

      <AIChatSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
      />

      <AISearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onJumpToMessage={handleJumpToMessage}
      />

      <SmartCleanupModal
        isOpen={isCleanupOpen}
        onClose={() => setIsCleanupOpen(false)}
      />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <ConnectSupabaseModal
        isOpen={isConnectSupabaseOpen}
        onClose={() => setIsConnectSupabaseOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <AIProvider>
            <MindChatAppContent />
          </AIProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
