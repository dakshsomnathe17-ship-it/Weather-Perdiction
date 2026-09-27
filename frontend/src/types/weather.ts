export interface Location { name: string; country: string; state?: string; latitude: number; longitude: number; timezone?: string; bounds?: [number, number, number, number]; displayName?: string; }
export interface CurrentWeather { temperature: number; feels_like: number; humidity: number; pressure?: number; wind_speed: number; wind_direction?: number; cloud_cover?: number; visibility?: number; uv_index?: number; aqi?: number; precipitation?: number; weather_code: number; weather_description: string; sunrise?: string; sunset?: string; is_day?: boolean; }
export interface ForecastDay { date: string; temp_max: number; temp_min: number; weather_code: number; weather_description: string; precipitation_sum: number; wind_speed_max?: number; sunrise?: string; sunset?: string; uv_index_max?: number; }
export interface HourlyForecast { time: string; temperature: number; humidity: number; precipitation: number; weather_code: number; wind_speed: number; cloud_cover: number; }
export interface WeatherData { location: Location; current: CurrentWeather; forecast: ForecastDay[]; hourly: HourlyForecast[]; }
export interface SearchResult extends Location {}
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; }
export interface WeatherLayer { id: string; name: string; icon: string; active: boolean; opacity: number; }
export interface Prediction { temperature: number; rain_probability: number; humidity: number; pressure: number; wind_speed: number; cloud_cover: number; confidence: number; }
