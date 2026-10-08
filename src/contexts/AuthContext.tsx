import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../types/database';
import { mockStore } from '../services/mock/mockStore';
import { getSupabase, isSupabaseConnected } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  showOnboarding: boolean;
  isBackendConnected: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, displayName: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  completeOnboarding: (preferredLanguage?: string, enableAI?: boolean) => void;
  setShowOnboarding: (val: boolean) => void;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile>(() => mockStore.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // If Supabase is connected, we will verify via getSession()
    if (isSupabaseConnected()) return false;
    return localStorage.getItem('mindchat_authenticated') !== 'false';
  });
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('mindchat_onboarded') === 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(isSupabaseConnected());
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync Supabase Auth session & profile
  const syncSupabaseUser = async () => {
    const client = getSupabase();
    if (!client) {
      setIsBackendConnected(false);
      return;
    }

    setIsBackendConnected(true);
    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (error) {
        console.warn('Supabase getSession error:', error.message);
        return;
      }

      if (session?.user) {
        const userId = session.user.id;
        // Fetch profile
        const { data: profile, error: pErr } = await client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          setCurrentUser(profile as Profile);
          setIsAuthenticated(true);
          localStorage.setItem('mindchat_authenticated', 'true');
        } else {
          // Profile might not exist yet if trigger hasn't fired
          const newProfile: Partial<Profile> = {
            id: userId,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'You',
            avatar_url: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            about: 'Chatting with MindChat',
            online_status: 'online',
            last_seen: new Date().toISOString(),
            preferred_language: 'en',
            ai_analysis_enabled: true,
            tags: ['AI/ML', 'FullStack'],
          };
          await client.from('profiles').upsert(newProfile);
          setCurrentUser(newProfile as Profile);
          setIsAuthenticated(true);
          localStorage.setItem('mindchat_authenticated', 'true');
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Error syncing Supabase user:', e);
    }
  };

  useEffect(() => {
    syncSupabaseUser();

    // Listen to Supabase auth state change
    const client = getSupabase();
    let authSubscription: any = null;

    if (client) {
      const { data } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (session?.user) {
            await syncSupabaseUser();
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          localStorage.setItem('mindchat_authenticated', 'false');
          setCurrentUser(mockStore.getCurrentUser());
        }
      });
      authSubscription = data.subscription;
    }

    // Listen to local credentials update event
    const handleConfigChange = () => {
      setIsBackendConnected(isSupabaseConnected());
      syncSupabaseUser();
    };

    const handleUserUpdate = () => {
      if (!isSupabaseConnected()) {
        setCurrentUser({ ...mockStore.getCurrentUser() });
      }
    };

    window.addEventListener('supabase_config_changed', handleConfigChange);
    mockStore.addEventListener('user_updated', handleUserUpdate);

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
      window.removeEventListener('supabase_config_changed', handleConfigChange);
      mockStore.removeEventListener('user_updated', handleUserUpdate);
    };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const client = getSupabase();

    if (client && isSupabaseConnected()) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (error) {
          setAuthError(error.message);
          return { success: false, error: error.message };
        }

        if (data.session) {
          await syncSupabaseUser();
          setIsAuthenticated(true);
          return { success: true };
        }
        return { success: false, error: 'Sign in failed. Please check credentials.' };
      } catch (err: any) {
        setAuthError(err.message);
        return { success: false, error: err.message };
      }
    }

    // Local / Demo Mode fallback
    const username = email.split('@')[0] || 'User';
    mockStore.updateCurrentUser({ username, online_status: 'online' });
    setIsAuthenticated(true);
    localStorage.setItem('mindchat_authenticated', 'true');
    return { success: true };
  };

  const signup = async (
    email: string,
    pass: string,
    displayName: string,
    username?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const client = getSupabase();

    if (client && isSupabaseConnected()) {
      try {
        const uname = username?.trim() || displayName.toLowerCase().replace(/\s+/g, '_') || email.split('@')[0];
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              display_name: displayName.trim(),
              username: uname,
            },
          },
        });

        if (error) {
          setAuthError(error.message);
          return { success: false, error: error.message };
        }

        if (data.user) {
          // Insert profile immediately in case trigger is deferred
          const newProfile = {
            id: data.user.id,
            username: uname,
            display_name: displayName.trim(),
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            about: 'Chatting with MindChat',
            online_status: 'online',
            last_seen: new Date().toISOString(),
            preferred_language: 'en',
            ai_analysis_enabled: true,
          };

          await client.from('profiles').upsert(newProfile);
          await syncSupabaseUser();
          setIsAuthenticated(true);
          setShowOnboarding(true);
          return { success: true };
        }

        return { success: false, error: 'Please check your email to confirm registration.' };
      } catch (err: any) {
        setAuthError(err.message);
        return { success: false, error: err.message };
      }
    }

    // Local / Demo Mode fallback
    const uname = username?.trim() || email.split('@')[0] || 'User';
    mockStore.updateCurrentUser({
      username: uname,
      display_name: displayName || uname,
      online_status: 'online',
    });
    setIsAuthenticated(true);
    localStorage.setItem('mindchat_authenticated', 'true');
    setShowOnboarding(true);
    return { success: true };
  };

  const logout = async () => {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        // Set offline status in Supabase before signout
        if (currentUser.id) {
          await client.from('profiles').update({ online_status: 'offline', last_seen: new Date().toISOString() }).eq('id', currentUser.id);
        }
        await client.auth.signOut();
      } catch (e) {
        console.warn('Error during Supabase signOut:', e);
      }
    } else {
      mockStore.updateCurrentUser({ online_status: 'offline' });
    }

    setIsAuthenticated(false);
    localStorage.setItem('mindchat_authenticated', 'false');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const client = getSupabase();
    if (client && isSupabaseConnected() && currentUser.id) {
      try {
        await client.from('profiles').update(updates).eq('id', currentUser.id);
      } catch (e) {
        console.error('Error updating Supabase profile:', e);
      }
    }
    mockStore.updateCurrentUser(updates);
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const addTag = (tag: string) => {
    const currentTags = currentUser.tags || [];
    if (!currentTags.includes(tag)) {
      updateProfile({ tags: [...currentTags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = currentUser.tags || [];
    updateProfile({ tags: currentTags.filter(t => t !== tag) });
  };

  const completeOnboarding = (preferredLanguage?: string, enableAI?: boolean) => {
    const updates: Partial<Profile> = {};
    if (preferredLanguage) updates.preferred_language = preferredLanguage;
    if (enableAI !== undefined) updates.ai_analysis_enabled = enableAI;

    updateProfile(updates);
    setIsOnboarded(true);
    setShowOnboarding(false);
    localStorage.setItem('mindchat_onboarded', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isOnboarded,
        showOnboarding,
        isBackendConnected,
        authError,
        login,
        signup,
        logout,
        updateProfile,
        addTag,
        removeTag,
        completeOnboarding,
        setShowOnboarding,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
