import React, { useEffect } from 'react';
import { useWeatherStore } from '@/store/weatherStore';
import { SearchBar, WeatherCard, ForecastCards, WeatherStats, LayerControl } from '@/components/ui';
import { Globe } from '@/components/globe';

const demoData = {
  location: { name: 'San Francisco', country: 'United States', latitude: 37.7749, longitude: -122.4194 },
  current: { temperature: 18, feels_like: 16, humidity: 72, pressure: 1013, wind_speed: 15, wind_direction: 270, cloud_cover: 45, visibility: 10000, uv_index: 5, precipitation: 0, weather_code: 2, weather_description: 'Partly Cloudy', sunrise: '06:15', sunset: '20:30', is_day: true },
  forecast: Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString(),
      temp_max: 20 + Math.random() * 5,
      temp_min: 12 + Math.random() * 3,
      weather_code: Math.floor(Math.random() * 99),
      weather_description: 'Varied',
      precipitation_sum: 0,
      wind_speed_max: 20,
      sunrise: '06:00',
      sunset: '20:00',
      uv_index_max: 6
    };
  })
};

export const Dashboard: React.FC = () => {
  const { selectedLocation, currentWeather, forecast, setLocation, setWeather, setForecast } = useWeatherStore();

  useEffect(() => {
    if (!selectedLocation) {
      setLocation(demoData.location);
    }
    if (!currentWeather) {
      setWeather(demoData.current);
      setForecast(demoData.forecast, []);
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 relative">
      {/* Globe Container */}
      <div className="w-full lg:w-3/5 h-[50vh] lg:h-full relative rounded-2xl overflow-hidden glass z-10">
        <LayerControl />
        <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">Loading Globe...</div>}>
          <Globe />
        </React.Suspense>
      </div>

      {/* Info Panel */}
      <div className="w-full lg:w-2/5 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide z-20">
        <div className="sticky top-0 z-30 pt-1 pb-4 bg-surface-950/80 backdrop-blur-sm">
          <SearchBar />
        </div>
        
        {currentWeather && selectedLocation && (
          <div className="flex flex-col gap-6 pb-20 lg:pb-0">
            <WeatherCard current={currentWeather} location={selectedLocation} />
            
            <div className="flex flex-col gap-3">
              <h3 className="text-white font-semibold text-lg">7-Day Forecast</h3>
              <ForecastCards forecast={forecast} />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-white font-semibold text-lg">Current Conditions</h3>
              <WeatherStats current={currentWeather} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
