import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ai';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-glow-primary border border-primary-light/20',
    secondary: 'bg-surface-secondary hover:bg-surface-elevated text-text-primary border border-border',
    outline: 'bg-transparent hover:bg-surface-secondary text-text-primary border border-border',
    ghost: 'bg-transparent hover:bg-surface-secondary/70 text-text-secondary hover:text-text-primary',
    danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30',
    ai: 'bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white shadow-glow-primary hover:shadow-glow-secondary border border-indigo-400/30',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-base px-6 py-3 h-12 gap-2.5',
    icon: 'h-9 w-9 p-0 flex items-center justify-center',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};
