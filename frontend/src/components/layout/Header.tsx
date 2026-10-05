import { MapPin } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useWeatherStore } from '@/store/weatherStore';
import { SearchBar } from '@/components/ui/SearchBar';
import { formatCoordinates } from '@/utils/geo';

export function UnitSwitch() {
  const { units, setUnits } = useUiStore();
  return (
    <div className="unit-switch" role="group" aria-label="Weather units">
      <button
        aria-label="Celsius, kilometres"
        aria-pressed={units === 'metric'}
        onClick={() => setUnits('metric')}
      >
        °C
      </button>
      <button
        aria-label="Fahrenheit, miles"
        aria-pressed={units === 'imperial'}
        onClick={() => setUnits('imperial')}
      >
        °F
      </button>
    </div>
  );
}

export function Header() {
  const location = useWeatherStore((s) => s.selectedLocation);
  return (
    <header className="app-header">
      <div className="header-location">
        <MapPin size={18} />
        <div>
          <strong>{location?.name ?? 'Choose a location'}</strong>
          <span data-testid="selected-location">
            {location
              ? `${location.name} · ${formatCoordinates(location.latitude, location.longitude)}`
              : 'Search to see local weather'}
          </span>
        </div>
      </div>
      <SearchBar />
      <UnitSwitch />
    </header>
  );
}
