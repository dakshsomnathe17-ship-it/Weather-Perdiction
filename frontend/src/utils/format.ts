import { format } from 'date-fns';

export const formatTemperature = (temp: number, units: 'metric' | 'imperial' = 'metric'): string => {
  if (units === 'imperial') {
    return `${Math.round((temp * 9/5) + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
};

export const formatWindSpeed = (speed: number, units: 'metric' | 'imperial' = 'metric'): string => {
  if (units === 'imperial') {
    return `${Math.round(speed / 1.609)} mph`;
  }
  return `${Math.round(speed)} km/h`;
};

export const formatPressure = (pressure: number): string => `${Math.round(pressure)} hPa`;
export const formatVisibility = (vis: number): string => `${Math.round(vis / 1000)} km`;

export const formatDate = (date: string | Date, formatStr: string = 'PP'): string => {
  return format(new Date(date), formatStr);
};

export const formatTime = (time: string | Date): string => {
  return format(new Date(time), 'p');
};

export const getWeatherIcon = (code: number): string => {
  // Simple mapping based on standard WMO codes
  if (code === 0) return '☀️';
  if (code >= 1 && code <= 3) return '⛅';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 85 && code <= 86) return '❄️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '☀️';
};

export const getWeatherGradient = (code: number): string => {
  if (code === 0) return 'from-blue-400 to-blue-200';
  if (code >= 1 && code <= 3) return 'from-gray-400 to-blue-300';
  if (code >= 45 && code <= 48) return 'from-gray-300 to-gray-500';
  if (code >= 51 && code <= 67) return 'from-blue-600 to-gray-400';
  if (code >= 71 && code <= 77) return 'from-blue-100 to-white';
  if (code >= 95 && code <= 99) return 'from-gray-700 to-gray-900';
  return 'from-blue-400 to-blue-200';
};

export const getUVLevel = (index: number): { label: string; color: string } => {
  if (index < 3) return { label: 'Low', color: 'text-green-400' };
  if (index < 6) return { label: 'Moderate', color: 'text-yellow-400' };
  if (index < 8) return { label: 'High', color: 'text-orange-400' };
  if (index < 11) return { label: 'Very High', color: 'text-red-400' };
  return { label: 'Extreme', color: 'text-purple-400' };
};

export const getAQILevel = (aqi: number): { label: string; color: string } => {
  if (aqi <= 50) return { label: 'Good', color: 'text-green-400' };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-400' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'text-orange-400' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-400' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'text-purple-400' };
  return { label: 'Hazardous', color: 'text-red-900' };
};

export const degToCompass = (num: number): string => {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[(val % 16)];
};
