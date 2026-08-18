import React from 'react';

export const SuggestedQuestions: React.FC<{ questions: string[], onSelect: (q: string) => void }> = ({ questions, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {questions.map((q, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(q)}
          className="text-xs py-2 px-3 rounded-full glass border border-primary-500/20 text-surface-200 hover:text-white hover:bg-primary-500/20 hover:border-primary-500/50 transition-all text-left"
        >
          {q}
        </button>
      ))}
    </div>
  );
};
