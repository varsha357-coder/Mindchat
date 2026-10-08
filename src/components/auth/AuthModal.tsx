import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { MindChatLogo } from '../common/MindChatLogo';
import { AlertCircle, CheckCircle, Database } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSignUpDefault?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isSignUpDefault = false,
}) => {
  const { login, signup, authError, setAuthError, isBackendConnected } = useAuth();
  const [isSignUp, setIsSignUp] = useState(isSignUpDefault);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setAuthError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setLocalError('Please enter your display name.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const res = await signup(
          email.trim(),
          password,
          displayName.trim(),
          username.trim() || displayName.toLowerCase().replace(/\s+/g, '_')
        );
        if (res.success) {
          onClose();
        } else if (res.error) {
          setLocalError(res.error);
        }
      } else {
        const res = await login(email.trim(), password);
        if (res.success) {
          onClose();
        } else if (res.error) {
          setLocalError(res.error);
        }
      }
    } catch (err: any) {
      setLocalError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, demoName: string) => {
    setLoading(true);
    setLocalError(null);
    try {
      await login(demoEmail, 'password123');
      onClose();
    } catch (e: any) {
      setLocalError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-4 text-center select-none">
        <div className="mx-auto w-fit mb-1">
          <MindChatLogo size="md" showTagline />
        </div>

        <div>
          <h3 className="text-lg font-bold text-text-primary">
            {isSignUp ? 'Create MindChat Account' : 'Sign In to MindChat'}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {isBackendConnected 
              ? 'Connected to live Supabase PostgreSQL backend'
              : 'Local Demo Mode active'}
          </p>
        </div>

        {/* Backend mode indicator */}
        <div className={`py-1.5 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 border ${
          isBackendConnected
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            : 'bg-primary/10 text-primary border-primary/25'
        }`}>
          <Database size={12} />
          <span>{isBackendConnected ? 'Supabase Authentication' : 'Local Sandbox Mode'}</span>
        </div>

        {/* Error message banner */}
        {(localError || authError) && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs text-left flex items-start gap-2 animate-fade-in">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{localError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left text-xs">
          {isSignUp && (
            <>
              <div>
                <label className="block font-semibold text-text-secondary mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. alice_s"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-text-secondary mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alice@mindchat.ai"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
              required
            />
          </div>

          <Button type="submit" variant="ai" size="md" className="w-full mt-3" isLoading={loading}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        {/* Quick Demo Accounts for fast testing */}
        <div className="pt-2 border-t border-border">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Quick 1-Click Test Accounts
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn('alice@mindchat.ai', 'Alice')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border text-text-secondary hover:text-text-primary text-[11px] font-medium transition-colors"
            >
              Sign in as Alice
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('bob@mindchat.ai', 'Bob')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border text-text-secondary hover:text-text-primary text-[11px] font-medium transition-colors"
            >
              Sign in as Bob
            </button>
          </div>
        </div>

        <div className="text-xs text-text-muted pt-1">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setLocalError(null);
                }}
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setLocalError(null);
                }}
                className="text-primary font-semibold hover:underline"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
};
