import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, Shield, Globe, Tag, Brain, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MindChatAIIcon } from '../common/MindChatLogo';
import { INDIAN_LANGUAGES } from '../../types/translation';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, addTag, removeTag, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(currentUser.display_name || 'You');
  const [about, setAbout] = useState(currentUser.about || 'Chatting with MindChat');
  const [newTagInput, setNewTagInput] = useState('');
  const [preferredLang, setPreferredLang] = useState(currentUser.preferred_language || 'en');
  const [aiEnabled, setAiEnabled] = useState(true);

  const suggestedTags = ['AI/ML', 'Student', 'Developer', 'Designer', 'Researcher', 'Founder', 'Cloud'];

  const handleNext = () => {
    if (step === 1) {
      updateProfile({ display_name: displayName, about });
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      completeOnboarding(preferredLang, aiEnabled);
      onClose();
    }
  };

  const handleSkip = () => {
    completeOnboarding('en', true);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} size="lg">
      <div className="text-center pb-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === i
                  ? 'w-8 bg-primary shadow-glow-primary'
                  : step > i
                  ? 'w-4 bg-primary/40'
                  : 'w-4 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Profile Setup */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in text-left">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3 text-primary">
                <User size={28} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Welcome to MindChat</h2>
              <p className="text-xs text-text-secondary mt-1">Let's set up how you appear to others in your conversations.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:border-primary focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">About / Bio</label>
              <input
                type="text"
                value={about}
                onChange={e => setAbout(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:border-primary focus:outline-none"
                placeholder="Status or short bio"
              />
            </div>
          </div>
        )}

        {/* Step 2: Capsule Tags */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in text-left">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center mx-auto mb-3 text-secondary">
                <Tag size={28} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Choose Your Capsule Tags</h2>
              <p className="text-xs text-text-secondary mt-1">
                MindChat displays clean profile capsules like [AI/ML] [Developer] beside your name.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Active Tags:</label>
              <div className="flex flex-wrap gap-2 min-h-10 p-3 rounded-xl bg-surface-secondary/50 border border-border">
                {(currentUser.tags || []).map(t => (
                  <span
                    key={t}
                    onClick={() => removeTag(t)}
                    className="profile-tag cursor-pointer hover:bg-danger/20 hover:text-danger hover:border-danger/40 transition-colors"
                    title="Click to remove"
                  >
                    [{t}] ×
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Suggested Tags:</label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface hover:border-primary/50 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTagInput.trim()) {
                    addTag(newTagInput.trim());
                    setNewTagInput('');
                  }
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
                placeholder="Type custom tag and press Add..."
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (newTagInput.trim()) {
                    addTag(newTagInput.trim());
                    setNewTagInput('');
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preferred Translation Language */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in text-left">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center mx-auto mb-3 text-secondary">
                <Globe size={28} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Preferred Translation Language</h2>
              <p className="text-xs text-text-secondary mt-1">
                MindChat translates between Indian languages at the tap of a button.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {INDIAN_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setPreferredLang(lang.code)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    preferredLang === lang.code
                      ? 'border-primary bg-primary/10 text-primary-light font-semibold shadow-glow-primary'
                      : 'border-border bg-surface-secondary/40 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="font-semibold text-text-primary">{lang.name}</div>
                  <div className="text-[11px] opacity-75">{lang.nativeName}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: AI Consent */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in text-left">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-3 text-primary">
                <Shield size={28} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">AI Chat Analysis Consent</h2>
              <p className="text-xs text-text-secondary mt-1">
                MindChat never reads or stores your memories without your permission.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border text-xs text-text-secondary leading-relaxed space-y-2">
              <div className="font-semibold text-text-primary flex items-center gap-2">
                <MindChatAIIcon size={16} />
                <span>How MindChat AI Works:</span>
              </div>
              <p>• Analyzes messages only to identify: <strong>Tasks, Deadlines, Events, and Decisions</strong>.</p>
              <p>• Highlights potentially useful information for your review.</p>
              <p>• <strong>Never automatically saves memories permanently.</strong> You approve every item.</p>
              <p>• Can be toggled on or off anytime in Settings.</p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Button
                variant={aiEnabled ? 'ai' : 'outline'}
                onClick={() => setAiEnabled(true)}
                className="flex-1 py-3"
              >
                <Check size={16} className="mr-1.5" />
                Enable AI Analysis
              </Button>
              <Button
                variant={!aiEnabled ? 'secondary' : 'outline'}
                onClick={() => setAiEnabled(false)}
                className="flex-1 py-3"
              >
                Keep AI Off
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: The AI Memory Workflow */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in text-left">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-indigo-600/20 to-secondary/20 border border-primary/40 flex items-center justify-center mx-auto mb-3 text-primary">
                <Brain size={28} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">The Core Philosophy</h2>
              <p className="text-xs text-text-secondary mt-1">
                "Chat freely. Remember what matters."
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-primary/30 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary-light flex items-center justify-center font-bold text-[11px]">1</span>
                <span><strong>Normal Chat:</strong> You converse naturally with friends, peers, or groups.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary-light flex items-center justify-center font-bold text-[11px]">2</span>
                <span><strong>AI Detection:</strong> Important dates & deliverables are tagged with ✦.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-[11px]">3</span>
                <span><strong>User Review:</strong> You tap [Save to Memory] or [Dismiss].</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-[11px]">4</span>
                <span><strong>AI Memory:</strong> Organized into Tasks, Deadlines, and Events forever.</span>
              </div>
            </div>

            <div className="text-center py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                AI understands. You decide.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip Setup
          </Button>
          <Button variant="ai" size="md" onClick={handleNext}>
            <span>{step === 5 ? 'Get Started' : 'Continue'}</span>
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
