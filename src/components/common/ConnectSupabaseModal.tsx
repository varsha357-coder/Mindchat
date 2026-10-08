import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { 
  getSavedSupabaseConfig, 
  setSupabaseCredentials, 
  clearSupabaseCredentials, 
  testSupabaseConnection,
  isSupabaseConnected 
} from '../../lib/supabase';

interface ConnectSupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectSupabaseModal: React.FC<ConnectSupabaseModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getSavedSupabaseConfig();
  const isConnected = isSupabaseConnected();

  const [url, setUrl] = useState(currentConfig.url || '');
  const [key, setKey] = useState(currentConfig.key || '');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestAndConnect = async () => {
    if (!url.trim() || !key.trim()) {
      setTestResult({ success: false, message: 'Please enter both the Supabase Project URL and the Anon API Key.' });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const result = await testSupabaseConnection(url.trim(), key.trim());
      setTestResult(result);

      if (result.success) {
        setSupabaseCredentials(url.trim(), key.trim());
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setUrl('');
    setKey('');
    setTestResult({ success: true, message: 'Reverted to MindChat Reactive Local / Demo Store.' });
  };

  const copyMigrationPath = () => {
    navigator.clipboard.writeText(`supabase/migrations/20260101000000_mindchat_schema.sql`);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Database size={18} className="text-primary" />
          <span>Connect MindChat to Live Supabase Backend</span>
        </div>
      }
      size="lg"
    >
      <div className="space-y-6 text-xs select-none">
        {/* Status banner */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <div className="flex items-center gap-2.5">
            {isConnected ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <AlertCircle size={18} className="text-amber-400" />
            )}
            <div>
              <div className="font-bold text-sm text-text-primary">
                {isConnected ? 'Supabase Backend Connected' : 'Running in Local / Demo Mode'}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {isConnected
                  ? `Connected to: ${currentConfig.url.replace('https://', '').split('.')[0]}`
                  : 'Connect your Supabase project to enable real multi-user authentication & real-time chatting across devices.'}
              </div>
            </div>
          </div>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface border border-border text-text-secondary hover:text-danger hover:border-danger/40 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Input fields */}
        <div className="space-y-3.5">
          <div>
            <label className="block font-semibold text-text-secondary mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-text-secondary mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-primary font-mono text-xs"
            />
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs leading-relaxed ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-danger/10 border-danger/30 text-danger'
            }`}>
              {testResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ai"
              size="md"
              onClick={handleTestAndConnect}
              isLoading={loading}
              className="w-full sm:w-auto"
            >
              <Sparkles size={14} className="mr-1.5" />
              <span>Verify & Connect Backend</span>
            </Button>
          </div>
        </div>

        {/* Quick Instructions Card */}
        <div className="p-5 rounded-2xl bg-surface-secondary/50 border border-border space-y-3">
          <div className="flex items-center justify-between font-bold text-text-primary">
            <span>Setup Instructions (Free Supabase Tier)</span>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>supabase.com</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <ol className="list-decimal pl-4 space-y-2 text-text-secondary leading-relaxed">
            <li>
              Go to <strong>supabase.com</strong>, sign in and click <strong>"New project"</strong>.
            </li>
            <li>
              In your project, click on <strong>"SQL Editor"</strong> in the left sidebar, paste the MindChat schema migration SQL, and click <strong>"Run"</strong>.
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={copyMigrationPath}
                  className="px-2 py-1 rounded-lg bg-surface border border-border text-primary font-semibold flex items-center gap-1 text-[11px]"
                >
                  {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedSql ? 'Path Copied!' : 'Migration file: supabase/migrations/...'}</span>
                </button>
              </div>
            </li>
            <li>
              Go to <strong>Project Settings → API</strong>.
            </li>
            <li>
              Copy the <strong>Project URL</strong> and <strong>anon / public API key</strong> into the boxes above and click <strong>"Verify & Connect Backend"</strong>.
            </li>
          </ol>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
