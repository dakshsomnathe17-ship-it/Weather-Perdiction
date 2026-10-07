import { CloudOff, RefreshCw } from 'lucide-react';

export function WeatherState({
  loading,
  error,
  retry,
  label = 'weather',
}: {
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
  label?: string;
}) {
  if (loading)
    return (
      <div className="weather-state loading-state" role="status">
        <span className="loading-orbit" />
        <p>Getting your {label}…</p>
        <small>Looking up conditions for this location</small>
      </div>
    );
  return (
    <div className="weather-state" role={error ? 'alert' : 'status'}>
      <CloudOff size={32} />
      <h3>
        {error
          ? `${label === 'weather' ? 'Weather' : 'Forecast'} is temporarily unavailable`
          : 'No forecast available'}
      </h3>
      <p>
        {error
          ? 'We couldn’t reach the weather service. Please try again.'
          : 'Try another location using the search above.'}
      </p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          <RefreshCw size={15} />
          {label === 'weather' ? 'Retry weather' : 'Retry forecast'}
        </button>
      )}
    </div>
  );
}
