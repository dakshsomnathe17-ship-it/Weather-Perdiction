import React from 'react';
import { useUiStore } from '@/store/uiStore';
import { GlassCard } from '../ui/GlassCard';
import { Bell, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { activePage, units, setUnits } = useUiStore();

  const getPageTitle = () => {
    switch (activePage) {
      case '/': return 'Global Dashboard';
      case '/forecast': return 'Detailed Forecast';
      case '/analytics': return 'Weather Analytics';
      case '/ml': return 'AI Predictions';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="h-20 w-full flex items-center justify-between px-8 z-30 relative">
      <h1 className="text-2xl font-bold text-white hidden md:block">{getPageTitle()}</h1>
      
      <div className="flex items-center gap-4 ml-auto">
        <GlassCard padding="p-1" className="flex items-center rounded-full">
          <button 
            onClick={() => setUnits('metric')}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${units === 'metric' ? 'bg-primary-500 text-white' : 'text-surface-400 hover:text-white'}`}
          >
            °C
          </button>
          <button 
            onClick={() => setUnits('imperial')}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${units === 'imperial' ? 'bg-primary-500 text-white' : 'text-surface-400 hover:text-white'}`}
          >
            °F
          </button>
        </GlassCard>

        <button className="w-10 h-10 rounded-full glass flex items-center justify-center text-surface-300 hover:text-white hover:border-primary-500/50 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-accent-violet p-[2px]">
          <div className="w-full h-full rounded-full bg-surface-900 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
