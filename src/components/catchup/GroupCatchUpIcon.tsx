import React from 'react';
import { UsersRound, Sparkles } from 'lucide-react';

interface GroupCatchUpIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const GroupCatchUpIcon: React.FC<GroupCatchUpIconProps> = ({
  size = 20,
  className = '',
  animate = false,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <UsersRound size={size} className="text-current" />
      <Sparkles
        size={Math.round(size * 0.6)}
        className={`absolute -top-1 -right-1.5 text-teal-400 fill-teal-400/30 ${
          animate ? 'animate-pulse' : ''
        }`}
      />
    </div>
  );
};
