import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CalendarDays, 
  LineChart, 
  BrainCircuit, 
  Settings, 
  MessageSquare,
  CloudSun,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, collapseSidebar, setPage, toggleChat } = useUiStore();
  const location = useLocation();

  React.useEffect(() => {
    setPage(location.pathname);
  }, [location.pathname, setPage]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/forecast', label: 'Forecast', icon: CalendarDays },
    { path: '/analytics', label: 'Analytics', icon: LineChart },
    { path: '/ml', label: 'AI Predictions', icon: BrainCircuit },
  ];

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      className="h-full glass-strong border-r border-surface-700/50 flex flex-col relative z-40 shrink-0"
    >
      <div className="h-20 flex items-center justify-center border-b border-surface-700/50 px-4">
        <CloudSun className="w-8 h-8 text-primary-400 shrink-0" />
        {!sidebarCollapsed && (
          <motion.span 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="ml-3 text-xl font-bold gradient-text whitespace-nowrap"
          >
            WeatherAI
          </motion.span>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 glow' 
                  : 'text-surface-400 hover:text-white hover:bg-surface-800/50 border border-transparent'
              }`}
            >
              <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
              {!sidebarCollapsed && (
                <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={toggleChat}
            className="flex items-center px-3 py-3 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/50 border border-transparent transition-all"
          >
            <MessageSquare className="w-6 h-6 shrink-0" />
            {!sidebarCollapsed && <span className="ml-3 font-medium whitespace-nowrap">AI Assistant</span>}
          </button>
          <Link
            to="/settings"
            className={`flex items-center px-3 py-3 rounded-xl transition-all ${
              location.pathname === '/settings'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 glow' 
                : 'text-surface-400 hover:text-white hover:bg-surface-800/50 border border-transparent'
            }`}
          >
            <Settings className="w-6 h-6 shrink-0" />
            {!sidebarCollapsed && <span className="ml-3 font-medium whitespace-nowrap">Settings</span>}
          </Link>
        </div>
      </nav>

      <button
        onClick={collapseSidebar}
        className="h-14 border-t border-surface-700/50 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </motion.aside>
  );
};
