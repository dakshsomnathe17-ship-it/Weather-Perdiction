import React from 'react';
import { useLocationSearch } from '@/hooks/useSearch';
import { useWeatherStore } from '@/store/weatherStore';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: results, isLoading } = useLocationSearch(query);
  const { setLocation, addRecentSearch } = useWeatherStore();

  const handleSelect = (location: any) => {
    setLocation(location);
    addRecentSearch(location);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md z-50">
      <div className="relative flex items-center w-full h-12 rounded-full glass-strong px-4 border border-surface-700 focus-within:border-primary-500 transition-colors">
        <Search className="w-5 h-5 text-surface-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for a city..."
          className="w-full bg-transparent border-none outline-none text-white px-3 placeholder:text-surface-400"
        />
        {isLoading && <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />}
      </div>

      <AnimatePresence>
        {isOpen && query.length > 2 && results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-14 left-0 w-full glass-strong rounded-xl overflow-hidden shadow-2xl flex flex-col"
          >
            {results.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(result)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{result.name}</span>
                  <span className="text-xs text-surface-400">
                    {result.state ? `${result.state}, ` : ''}{result.country}
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
