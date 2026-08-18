import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types';
import { formatTime } from '@/utils/format';
import { User, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-primary-600' : 'bg-surface-700'}`}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-accent-cyan" />}
      </div>
      <div className="flex flex-col gap-1">
        <div className={`p-3 rounded-2xl text-sm ${
          isUser 
            ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-tr-sm' 
            : 'glass text-surface-100 rounded-tl-sm'
        }`}>
          {message.content}
        </div>
        <span className={`text-[10px] text-surface-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
};
