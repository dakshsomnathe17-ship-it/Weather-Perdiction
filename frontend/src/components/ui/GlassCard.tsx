import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, hover = false, glow = false, padding = 'p-6' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'glass',
        padding,
        hover && 'hover:border-primary-400/30 hover:shadow-[0_0_20px_rgba(96,165,250,0.05)] transition-all duration-300',
        glow && 'glow',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
