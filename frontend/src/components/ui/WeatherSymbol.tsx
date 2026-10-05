import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
} from 'lucide-react';

export function WeatherSymbol({
  code,
  size = 32,
  night = false,
}: {
  code: number;
  size?: number;
  night?: boolean;
}) {
  const Icon =
    code >= 95
      ? CloudLightning
      : code >= 85
        ? Snowflake
        : code >= 80
          ? CloudRain
          : code >= 71
            ? Snowflake
            : code >= 61
              ? CloudRain
              : code >= 51
                ? CloudDrizzle
                : code >= 45
                  ? CloudFog
                  : code === 3
                    ? Cloud
                    : code > 0
                      ? CloudSun
                      : night
                        ? Moon
                        : Sun;
  return (
    <Icon
      size={size}
      strokeWidth={1.5}
      aria-hidden="true"
      className={`weather-symbol ${code <= 2 ? 'fair' : 'cloudy'}`}
    />
  );
}
