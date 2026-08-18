import React, { useState, useRef, useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { ChatMessage } from './ChatMessage';
import { SuggestedQuestions } from './SuggestedQuestions';
import { X, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatPanel: React.FC = () => {
  const { chatOpen, toggleChat } = useUiStore();
  const { messages, suggestedQuestions, addMessage, isLoading, setLoading } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    addMessage({ role: 'user', content: text });
    setInput('');
    setLoading(true);

    // Mock API response
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `I'm an AI assistant in demo mode. You asked: "${text}". The weather prediction models suggest it will be a pleasant day!`
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={toggleChat}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[400px] md:w-[420px] glass-strong border-l border-surface-700/50 z-50 flex flex-col shadow-2xl"
          >
            <div className="h-20 border-b border-surface-700/50 flex items-center justify-between px-6 shrink-0 bg-surface-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">AI Assistant</h3>
                  <span className="text-xs text-accent-cyan flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
              <button onClick={toggleChat} className="p-2 rounded-full hover:bg-surface-800 text-surface-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center mt-8">
                  <Bot className="w-16 h-16 text-surface-700 mb-4" />
                  <p className="text-surface-300 font-medium max-w-[80%] mb-8">
                    Ask me anything about weather forecasts, historical data, or our ML models.
                  </p>
                  <SuggestedQuestions questions={suggestedQuestions} onSelect={handleSend} />
                </div>
              ) : (
                messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
              )}
              
              {isLoading && (
                <div className="flex gap-2 p-3 w-16 glass rounded-2xl rounded-tl-sm mt-2">
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-surface-700/50 bg-surface-900/50">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder="Ask a question..."
                  className="w-full bg-surface-800/80 text-white rounded-full pl-4 pr-12 py-3 border border-surface-600 focus:border-primary-500 outline-none transition-colors"
                />
                <button 
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 rounded-full bg-primary-600 text-white disabled:bg-surface-700 disabled:text-surface-500 transition-colors"
                >
                  <Send className="w-4 h-4 -ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
