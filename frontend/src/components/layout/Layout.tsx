import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatPanel } from '../chat/ChatPanel';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-950">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <ChatPanel />
    </div>
  );
};
