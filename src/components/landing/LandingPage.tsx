import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, Languages, Clock, Brain, Search, 
  ArrowRight, MessageSquare, CheckCircle, Zap, Lock, ChevronRight 
} from 'lucide-react';
import { MindChatLogo, MindChatAIIcon } from '../common/MindChatLogo';
import { Button } from '../common/Button';
import { INDIAN_LANGUAGES } from '../../types/translation';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: (isSignUp?: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenAuth }) => {
  const [selectedDemoLang, setSelectedDemoLang] = useState('kn');

  const demoPhrases: Record<string, { original: string; trans: string; langName: string }> = {
    kn: {
      langName: 'Kannada',
      original: 'ನಾಳೆ ನಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್ ರಿವ್ಯೂ 10 ಗಂಟೆಗೆ ಇದೆ.',
      trans: 'Tomorrow our project review is at 10:00 AM.',
    },
    hi: {
      langName: 'Hindi',
      original: 'कल हमारी प्रेजेंटेशन सुबह 10 बजे सेमिनार हॉल में है।',
      trans: 'Tomorrow our presentation is at 10 AM in the Seminar Hall.',
    },
    te: {
      langName: 'Telugu',
      original: 'రేపు ఉదయం 10 గంటలకు మా ప్రాజెక్ట్ రివ్యూ ఉంది.',
      trans: 'Our project review is tomorrow morning at 10:00 AM.',
    },
    ta: {
      langName: 'Tamil',
      original: 'நாளை காலை 10 மணிக்கு எங்கள் புராஜெக்ட் ரிவ்யூ உள்ளது.',
      trans: 'Tomorrow at 10 AM is our project review.',
    },
  };

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary/30 relative overflow-hidden mindchat-bg">
      {/* Ambient gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-secondary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <MindChatLogo size="md" showTagline={false} />
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">How it Works</a>
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#languages" className="hover:text-text-primary transition-colors">Indian Languages</a>
            <a href="#privacy" className="hover:text-text-primary transition-colors">Privacy</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onOpenAuth(false)}>
              Sign In
            </Button>
            <Button variant="ai" size="sm" onClick={onEnterApp} className="group">
              <span>Launch Live App</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        {/* Philosophy Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-primary/30 shadow-glow-primary mb-8 animate-fade-in">
          <MindChatAIIcon size={16} animate />
          <span className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-primary-light to-secondary text-transparent bg-clip-text">
            Original AI Messaging Platform
          </span>
          <span className="text-border">|</span>
          <span className="text-xs text-text-secondary">AI understands. You decide.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-text-primary max-w-5xl mx-auto leading-[1.12]">
          Chat freely. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-primary-light to-cyan-400 text-transparent bg-clip-text">
            Remember what matters.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          An intelligent messaging platform that extracts deadlines, tasks, and decisions into your private AI memory, translates across 13 Indian languages, and keeps privacy in your hands.
        </p>

        {/* Hero Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button variant="ai" size="lg" onClick={onEnterApp} className="h-13 px-8 text-base shadow-lg shadow-primary/25">
            <Sparkles size={18} className="mr-2 text-amber-300" />
            Explore Live Platform
          </Button>
          <Button variant="outline" size="lg" onClick={() => onOpenAuth(true)} className="h-13 px-8 text-base">
            Create Free Account
          </Button>
        </div>

        {/* Live Philosophy Flow Visualization */}
        <div className="mt-16 p-6 rounded-2xl bg-surface/70 border border-border backdrop-blur-md shadow-elevated max-w-4xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
            The MindChat Intelligence Architecture
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-xs">
            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border flex flex-col items-center">
              <MessageSquare size={18} className="text-primary mb-1" />
              <span className="font-semibold text-text-primary">Normal Chat</span>
              <span className="text-[11px] text-text-muted mt-0.5">Real-time messaging</span>
            </div>
            <div className="hidden sm:flex justify-center text-text-muted">
              <ChevronRight size={18} />
            </div>
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex flex-col items-center">
              <MindChatAIIcon size={18} className="mb-1" />
              <span className="font-semibold text-primary-light">AI Understands</span>
              <span className="text-[11px] text-text-muted mt-0.5">Extracts intent & date</span>
            </div>
            <div className="hidden sm:flex justify-center text-text-muted">
              <ChevronRight size={18} />
            </div>
            <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/30 flex flex-col items-center">
              <ShieldCheck size={18} className="text-secondary mb-1" />
              <span className="font-semibold text-secondary">You Approve</span>
              <span className="text-[11px] text-text-muted mt-0.5">Saved to AI Memory</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Core Innovations</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary mt-2">
            Built for what modern messaging forgot
          </h2>
          <p className="text-text-secondary mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Stop searching through 10,000 old chats to find what time the review was scheduled.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Memory */}
          <div className="p-7 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all shadow-subtle group">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-5 group-hover:scale-105 transition-transform">
              <Brain size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">AI Memory Layer</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              When someone mentions "Project review tomorrow at 10 AM", MindChat detects the deadline. You review with one click, and it is saved into categorized AI Memory.
            </p>
            <div className="mt-5 pt-4 border-t border-border flex items-center text-xs font-semibold text-primary">
              ✦ Never lose an action item again
            </div>
          </div>

          {/* Card 2: 13 Indian Languages */}
          <div className="p-7 rounded-2xl bg-surface border border-border hover:border-secondary/40 transition-all shadow-subtle group">
            <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary mb-5 group-hover:scale-105 transition-transform">
              <Languages size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Indian Language Translation</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Full conversational translation across 13 languages including Kannada, Hindi, Telugu, Tamil, Malayalam, Bengali, and Marathi with both original and translated text preserved.
            </p>
            <div className="mt-5 pt-4 border-t border-border flex items-center text-xs font-semibold text-secondary">
              🌐 Multilingual by default
            </div>
          </div>

          {/* Card 3: Disappearing Timers */}
          <div className="p-7 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all shadow-subtle group">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-5 group-hover:scale-105 transition-transform">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Granular Message Timers</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Set ephemeral timers (10 seconds, 1 minute, 1 hour, 24 hours) or "Delete after read". Live countdown indicator shows exactly when casual messages expire.
            </p>
            <div className="mt-5 pt-4 border-t border-border flex items-center text-xs font-semibold text-accent">
              ⏱ 00:42 Real expiration purge
            </div>
          </div>

          {/* Card 4: Natural Language Search */}
          <div className="p-7 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all shadow-subtle group">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-5 group-hover:scale-105 transition-transform">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Natural-Language Search</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Ask questions like: "When is our project review?" or "What did Rahul say about the assignment?". AI finds the exact message in authorized chats.
            </p>
            <div className="mt-5 pt-4 border-t border-border flex items-center text-xs font-semibold text-primary">
              🔍 Ask questions, not keywords
            </div>
          </div>

          {/* Card 5: Smart Cleanup */}
          <div className="p-7 rounded-2xl bg-surface border border-border hover:border-secondary/40 transition-all shadow-subtle group">
            <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary mb-5 group-hover:scale-105 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Smart Chat Cleanup</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              AI highlights casual messages, repetitive greetings, and expired notes. You review and confirm before any message is deleted.
            </p>
            <div className="mt-5 pt-4 border-t border-border flex items-center text-xs font-semibold text-secondary">
              🧹 Declutter without anxiety
            </div>
          </div>

          {/* Card 6: Privacy by Design */}
          <div className="p-7 rounded-2xl bg-surface border border-border hover:border-mint/40 transition-all shadow-subtle group">
            <div className="w-12 h-12 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center text-success mb-5 group-hover:scale-105 transition-transform">
              <Lock size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Privacy & RLS Security</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Row Level Security policies enforce strict isolation. AI analysis is completely optional and never stores memories without your explicit manual approval.
            </p>
            <div className="mt-5 pt-4 border-t border-border flex items-center text-xs font-semibold text-success">
              🛡 "AI understands. You decide."
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Indian Language Translation Showcase */}
      <section id="languages" className="py-20 px-4 sm:px-6 bg-surface/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Inclusive by Design</span>
            <h2 className="text-3xl font-extrabold text-text-primary mt-2">
              Conversations in your native tongue
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Try the live interactive demo across Indian languages:
            </p>
          </div>

          {/* Language selector buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {Object.keys(demoPhrases).map(langKey => {
              const lang = INDIAN_LANGUAGES.find(l => l.code === langKey);
              const isActive = selectedDemoLang === langKey;
              return (
                <button
                  key={langKey}
                  onClick={() => setSelectedDemoLang(langKey)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-secondary text-white shadow-glow-secondary' 
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {lang?.name} ({lang?.nativeName})
                </button>
              );
            })}
          </div>

          {/* Demo Message Card */}
          <div className="max-w-xl mx-auto p-6 rounded-2xl bg-surface border border-border shadow-elevated">
            <div className="flex items-center justify-between text-xs text-text-muted mb-3">
              <span className="font-semibold text-text-primary">Varsha</span>
              <span>10:42 AM</span>
            </div>
            <div className="text-base font-medium text-text-primary mb-3">
              {demoPhrases[selectedDemoLang].original}
            </div>
            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-secondary/30">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary mb-1">
                <Languages size={14} />
                <span>Translation ({demoPhrases[selectedDemoLang].langName} → English)</span>
              </div>
              <p className="text-sm text-text-primary">
                {demoPhrases[selectedDemoLang].trans}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-br from-primary/15 via-surface to-secondary/15 border border-primary/30 shadow-elevated">
          <MindChatAIIcon size={40} animate className="mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
            Ready to experience messaging that actually remembers?
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto mt-4 text-base">
            No WhatsApp clones. No message clutter. An intelligent communication system crafted from the ground up.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button variant="ai" size="lg" onClick={onEnterApp} className="h-13 px-8 text-base shadow-glow-primary">
              Launch MindChat Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MindChatAIIcon size={18} />
            <span className="font-bold text-text-primary">MindChat</span>
            <span>— Chat freely. Remember what matters.</span>
          </div>
          <div>
            Built with React, TypeScript, Supabase PostgreSQL, and MindChat Neural Engine.
          </div>
        </div>
      </footer>
    </div>
  );
};
