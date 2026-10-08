import { 
  MessageSquare, Phone, Users, Brain, BarChart3, Star, 
  Archive, Bell, User, Settings, Sun, Moon, Database, LogOut 
} from 'lucide-react';
import { MindChatAIIcon } from '../common/MindChatLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

export type ActiveNavTab = 
  | 'chats' 
  | 'calls'
  | 'contacts' 
  | 'memory' 
  | 'insights' 
  | 'starred' 
  | 'archived' 
  | 'notifications' 
  | 'profile' 
  | 'settings';

interface MainNavigationProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenConnectSupabase: () => void;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenProfile,
  onOpenSettings,
  onOpenConnectSupabase,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, callRecords } = useChat();
  const { logout, isBackendConnected } = useAuth();

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;
  const missedCallCount = callRecords.filter(r => r.status === 'missed').length;

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'calls', label: 'Calls', icon: Phone, count: missedCallCount > 0 ? missedCallCount : undefined },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'memory', label: 'AI Memory', icon: Brain, badgeText: '✦' },
    { id: 'insights', label: 'AI Insights', icon: BarChart3 },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadNotifCount },
  ];

  return (
    <aside className="w-18 sm:w-20 md:w-20 bg-surface border-r border-border flex flex-col items-center py-4 select-none shrink-0 z-30">
      {/* Brand Icon Header */}
      <div 
        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/25 via-surface to-secondary/15 border border-primary/30 flex items-center justify-center cursor-pointer shadow-glow-primary hover:scale-105 transition-all mb-6"
        onClick={() => onSelectTab('chats')}
        title="MindChat — Chat freely. Remember what matters."
      >
        <MindChatAIIcon size={24} animate />
      </div>

      {/* Primary Navigation List */}
      <nav className="flex-1 w-full flex flex-col items-center gap-1.5 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as ActiveNavTab)}
              className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/15 text-primary-light border border-primary/35 shadow-glow-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/70'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={20} className={isActive ? 'text-primary' : 'group-hover:scale-110 transition-transform'} />
              
              {/* Active left indicator pill */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
              )}

              {/* Badge for AI or Unread */}
              {item.badgeText && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
                  {item.badgeText}
                </span>
              )}

              {typeof item.count === 'number' && item.count > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions: Theme Toggle, Profile, Settings */}
      <div className="w-full flex flex-col items-center gap-2 pt-3 border-t border-border px-2">
        {/* Dark/Light toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Profile */}
        <button
          onClick={onOpenProfile}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            activeTab === 'profile'
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
          }`}
          title="Profile & Custom Tags"
          aria-label="Profile"
        >
          <User size={18} />
        </button>

        {/* Supabase Backend status trigger */}
        <button
          onClick={onOpenConnectSupabase}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative ${
            isBackendConnected
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-amber-400 hover:bg-amber-500/10'
          }`}
          title={isBackendConnected ? 'Supabase Backend Connected' : 'Connect to Supabase Backend'}
          aria-label="Connect Supabase"
        >
          <Database size={18} />
          <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
          }`} />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            activeTab === 'settings'
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
          }`}
          title="Settings & Privacy"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          title="Sign Out / Log Out"
          aria-label="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
};
