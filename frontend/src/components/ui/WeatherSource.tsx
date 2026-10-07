export function WeatherSource({ updatedAt = 0 }: { updatedAt?: number }) {
  return (
    <p className="data-source">
      <span className="source-dot" />
      Weather data by{' '}
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
        Open-Meteo
      </a>
      {updatedAt > 0 && (
        <>
          {' '}
          · Retrieved{' '}
          {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (your
          time)
        </>
      )}
    </p>
  );
}
