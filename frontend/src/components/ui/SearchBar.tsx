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
  const results = useLocationSearch(submitted);
  const { setLocation, addRecentSearch } = useWeatherStore();
  const select = React.useCallback((location: SearchResult) => {
    pendingQuery.current = null;
    setLocation(location); addRecentSearch(location); setQuery(location.name); setOpen(false);
  }, [setLocation, addRecentSearch]);
  React.useEffect(() => {
    if (!open || pendingQuery.current !== submitted || results.isFetching || !results.data) return;
    pendingQuery.current = null;
    // A unique result can show weather immediately; ambiguous names need a choice.
    if (results.data.length === 1) select(results.data[0]);
  }, [open, submitted, results.data, results.isFetching, select]);
  return <div className="relative w-full z-50">
    <form onSubmit={(e) => { e.preventDefault(); if (query.trim().length >= 2) { pendingQuery.current = query.trim(); if (submitted === query.trim() && results.isError) void results.refetch(); setSubmitted(query.trim()); setOpen(true); } }} className="flex items-center gap-2 rounded-xl glass-strong p-2">
      <input aria-label="Search places" placeholder="City, landmark or address" maxLength={160} value={query} onChange={(e) => { pendingQuery.current = null; setQuery(e.target.value); setOpen(false); }}
        className="min-w-0 flex-1 bg-transparent px-2 py-2 text-white outline-none" />
      <button type="submit" aria-label="Search" disabled={query.trim().length < 2 || results.isFetching} className="rounded-lg bg-primary-600 p-2 text-white disabled:opacity-40">
        {results.isFetching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
      </button>
    </form>
    <p className="text-[10px] text-slate-400 mt-1">Press Enter for the map and local weather · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">© OpenStreetMap contributors</a></p>
    {open && <div className="absolute top-full mt-2 w-full glass-strong rounded-xl max-h-80 overflow-auto p-2 shadow-2xl">
      {results.isFetching && <p role="status" className="p-2 text-sm">Searching places…</p>}
      {results.isError && <p role="alert" className="p-2 text-sm">Search unavailable. Start the weather backend or try again later.</p>}
      {!results.isFetching && !results.isError && results.data?.length === 0 && <p role="status" className="p-2 text-sm">No places found. Try a more specific name.</p>}
      {!results.isFetching && !results.isError && (results.data?.length ?? 0) > 1 && <p className="p-2 text-xs text-slate-300">Choose a place to show its map and weather.</p>}
      {results.data?.map((location, i) => <button key={`${location.latitude}:${location.longitude}:${i}`} onClick={() => select(location)} className="flex gap-3 p-3 w-full text-left rounded-lg hover:bg-slate-800">
        <MapPin className="w-4 h-4 mt-1 shrink-0 text-cyan-300" /><span><span className="block text-sm text-white">{location.name}</span><span className="block text-xs text-slate-400">{location.displayName ?? location.country}</span><span className="block text-xs text-cyan-300 mt-1">Show map &amp; weather</span></span>
      </button>)}
      <button className="text-xs text-slate-400 underline p-2" onClick={() => { pendingQuery.current = null; setOpen(false); }}>Close results</button>
    </div>}
  </div>;
};
