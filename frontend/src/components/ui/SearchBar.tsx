import React from 'react';
import { useLocationSearch } from '@/hooks/useSearch';
import { useWeatherStore } from '@/store/weatherStore';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { SearchResult } from '@/types';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const [submitted, setSubmitted] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const pendingQuery = React.useRef<string | null>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const results = useLocationSearch(submitted);
  const { setLocation, addRecentSearch } = useWeatherStore();
  const select = React.useCallback(
    (location: SearchResult) => {
      pendingQuery.current = null;
      setLocation(location);
      addRecentSearch(location);
      setQuery(location.name);
      setOpen(false);
    },
    [setLocation, addRecentSearch],
  );
  React.useEffect(() => {
    if (!open || pendingQuery.current !== submitted || results.isFetching || !results.data) return;
    pendingQuery.current = null;
    // A unique result can show weather immediately; ambiguous names need a choice.
    if (results.data.length === 1) select(results.data[0]);
  }, [open, submitted, results.data, results.isFetching, select]);
  React.useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        pendingQuery.current = null;
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <div
      className="search-wrap"
      ref={root}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          pendingQuery.current = null;
          setOpen(false);
          root.current?.querySelector('input')?.focus();
        }
      }}
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length >= 2) {
            pendingQuery.current = query.trim();
            if (submitted === query.trim() && results.isError) void results.refetch();
            setSubmitted(query.trim());
            setOpen(true);
          }
        }}
        className="search-form"
      >
        <Search size={18} className="search-leading" aria-hidden="true" />
        <input
          aria-label="Search places"
          aria-describedby="search-hint"
          aria-controls={open ? 'search-results' : undefined}
          autoComplete="off"
          placeholder="Search a city or place"
          maxLength={160}
          value={query}
          onChange={(e) => {
            pendingQuery.current = null;
            setQuery(e.target.value);
            setOpen(false);
          }}
        />
        <button
          type="submit"
          aria-label="Search"
          disabled={query.trim().length < 2 || results.isFetching}
        >
          {results.isFetching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </form>
      <p id="search-hint" className="search-hint">
        Press Enter to search ·{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          © OpenStreetMap contributors
        </a>
      </p>
      {open && (
        <div id="search-results" className="search-results">
          {results.isFetching && (
            <p role="status" className="p-2 text-sm">
              Searching places…
            </p>
          )}
          {results.isError && (
            <p role="alert" className="p-2 text-sm">
              We couldn’t search right now. Please try again.
            </p>
          )}
          {!results.isFetching && !results.isError && results.data?.length === 0 && (
            <p role="status" className="p-2 text-sm">
              No places found. Try a more specific name.
            </p>
          )}
          {!results.isFetching && !results.isError && (results.data?.length ?? 0) > 1 && (
            <p className="p-2 text-xs text-slate-300">
              Choose a place to show its map and weather.
            </p>
          )}
          {!results.isFetching &&
            !results.isError &&
            results.data?.map((location, i) => (
              <button
                key={`${location.latitude}:${location.longitude}:${i}`}
                onClick={() => select(location)}
                className="flex gap-3 p-3 w-full text-left rounded-lg hover:bg-slate-800"
              >
                <MapPin className="w-4 h-4 mt-1 shrink-0 text-cyan-300" />
                <span>
                  <span className="block text-sm text-white">{location.name}</span>
                  <span className="block text-xs text-slate-400">
                    {location.displayName ?? location.country}
                  </span>
                  <span className="block text-xs text-cyan-300 mt-1">Show map &amp; weather</span>
                </span>
              </button>
            ))}
          <button
            className="text-xs text-slate-400 underline p-2"
            onClick={() => {
              pendingQuery.current = null;
              setOpen(false);
            }}
          >
            Close results
          </button>
        </div>
      )}
    </div>
  );
};
