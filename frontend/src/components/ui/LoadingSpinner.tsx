import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin`} />
      {text && <span className="text-sm text-surface-200 font-medium">{text}</span>}
    </div>
  );
};
