import React from 'react';

interface MindChatAIIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const MindChatAIIcon: React.FC<MindChatAIIconProps> = ({ 
  size = 20, 
  className = '', 
  animate = false 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${animate ? 'animate-sparkle' : ''} ${className}`}
    >
      <defs>
        <linearGradient id="mc-ai-glow" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="mc-spark-grad" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      
      {/* Speech-thought orbit outline */}
      <path 
        d="M6 11.5C6 7.9 8.7 5 12 5C15.3 5 18 7.9 18 11.5C18 15.1 15.3 18 12 18C10.7 18 9.5 17.6 8.5 16.9L5 18L5.9 15.1C5.3 14 6 12.8 6 11.5Z" 
        stroke="url(#mc-ai-glow)" 
        strokeWidth="1.6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Neural Synapses */}
      <circle cx="9.5" cy="9.5" r="1.3" fill="#818cf8" />
      <circle cx="14.5" cy="9.5" r="1.3" fill="#06b6d4" />
      <circle cx="12" cy="14" r="1.3" fill="#38bdf8" />
      
      {/* Synapse Linkages */}
      <line x1="9.5" y1="9.5" x2="12" y2="14" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.7" strokeDasharray="1 1" />
      <line x1="14.5" y1="9.5" x2="12" y2="14" stroke="#06b6d4" strokeWidth="0.8" strokeOpacity="0.7" strokeDasharray="1 1" />
      
      {/* Core Intelligence Spark */}
      <path 
        d="M12 9.5L12.6 10.9L14 11.2L12.9 12.2L13.2 13.5L12 12.8L10.8 13.5L11.1 12.2L10 11.2L11.4 10.9L12 9.5Z" 
        fill="url(#mc-spark-grad)" 
      />
    </svg>
  );
};

export const MindChatLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; showTagline?: boolean; className?: string }> = ({ 
  size = 'md', 
  showTagline = false,
  className = ''
}) => {
  const iconSizes = { sm: 26, md: 34, lg: 46 };
  const textSizes = { 
    sm: 'text-base font-bold', 
    md: 'text-xl font-extrabold', 
    lg: 'text-2xl font-extrabold' 
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-gradient-to-br from-primary/20 via-surface to-secondary/10 border border-primary/30 shadow-glow-primary">
        <MindChatAIIcon size={iconSizes[size]} animate />
        <div className="absolute -inset-0.5 rounded-xl bg-primary/20 blur-[6px] -z-10" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`tracking-tight bg-gradient-to-r from-white via-indigo-100 to-cyan-300 dark:from-white dark:via-indigo-200 dark:to-cyan-300 text-transparent bg-clip-text ${textSizes[size]}`}>
            MindChat
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
            AI
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-text-muted font-normal tracking-normal -mt-0.5">
            Chat freely. Remember what matters.
          </p>
        )}
      </div>
    </div>
  );
};
