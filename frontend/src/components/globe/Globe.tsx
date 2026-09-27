import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Focus, Globe2, Map, Maximize, Minimize, Minus, Plus, Ruler, Tags, X } from 'lucide-react';
import CanvasEarth from './CanvasEarth';
import type { GlobeHandle } from './types';
import type { Location } from '@/types';
import { formatCoordinates, geodesicPath, surfaceDistance, type Coordinate } from '@/utils/geo';
import './globe.css';

const CesiumEarth = lazy(() => import('./CesiumEarth'));
class GlobeBoundary extends React.Component<{ children: React.ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
interface GlobeProps { onLocationSelect?: (lat: number, lon: number) => void; location?: Location | null; className?: string; style?: React.CSSProperties; children?: React.ReactNode; }

export default function Globe({ onLocationSelect, location = null, className = '', style, children }: GlobeProps) {
  const root = useRef<HTMLDivElement>(null);
  const renderer = useRef<GlobeHandle>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewStatus, setViewStatus] = useState('');
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<Coordinate | null>(null);
  const [height, setHeight] = useState(22000000);
  const [satellite, setSatellite] = useState(false);
  const [satelliteReady, setSatelliteReady] = useState(false);
  const [labels, setLabels] = useState(false);
  const [imageryStatus, setImageryStatus] = useState('');
  const [measuring, setMeasuring] = useState(false);
  const [measurement, setMeasurement] = useState<Coordinate[]>([]);
  const lastPick = useRef<Coordinate | null>(null);
  const handledLocation = useRef(location);
  const hasRenderedCesium = useRef(false);
  const path = useMemo(() => measurement.length === 2 ? geodesicPath(measurement[0], measurement[1]) : [], [measurement]);
  const distance = measurement.length === 2 ? surfaceDistance(measurement[0], measurement[1]) : null;
  const onCesiumReady = useCallback(() => { hasRenderedCesium.current = true; setReady(true); }, []);
  const onCanvasReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { if (hasRenderedCesium.current) handledLocation.current = null; lastPick.current = null; setFallback(true); setReady(false); setImageryStatus(''); setSatelliteReady(false); }, []);
  const onPick = useCallback((point: Coordinate, focus = false) => {
    if (measuring) {
      if (!focus) setMeasurement((points) => {
        if (points.length && surfaceDistance(points[points.length - 1], point) < 1) return points;
        return points.length === 2 ? [point] : [...points, point];
      });
      return;
    }
    lastPick.current = point;
    onLocationSelect?.(point.lat, point.lon);
    if (focus) renderer.current?.flyTo({ name: 'Selected location', country: '', latitude: point.lat, longitude: point.lon });
  }, [measuring, onLocationSelect]);

  useEffect(() => {
    const changed = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  const toggleFullscreen = async () => {
    try {
      setViewStatus('');
      if (document.fullscreenElement === root.current) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch { setViewStatus('Full screen is unavailable in this browser.'); }
  };

  useEffect(() => {
    if (!ready || !location || handledLocation.current === location) return;
    handledLocation.current = location;
    if (lastPick.current?.lat === location.latitude && lastPick.current.lon === location.longitude) return;
    renderer.current?.flyTo(location);
  }, [location, ready]);

  const coordinate = hover ?? (location ? { lat: location.latitude, lon: location.longitude } : null);
  const hasEsri = Boolean(import.meta.env.VITE_ARCGIS_ACCESS_TOKEN);
  const props = { location, measurement, path, satellite, labels, onPick, onHover: setHover, onHeight: setHeight, onFailure, onImageryStatus: setImageryStatus, onSatelliteReady: setSatelliteReady };
  return <div ref={root} className={`globe-view ${className}`} style={style} tabIndex={0} role="region" aria-label="Interactive Earth" aria-describedby="globe-help"
    onPointerDownCapture={(e) => { if (e.target instanceof HTMLCanvasElement) e.currentTarget.focus({ preventScroll: true }); }}
    onKeyDown={(e) => {
      if (e.target !== e.currentTarget) return;
      const actions: Record<string, () => void> = {
        '+': () => renderer.current?.zoom(.7), '=': () => renderer.current?.zoom(.7), '-': () => renderer.current?.zoom(1.4),
        r: () => renderer.current?.reset(), ArrowLeft: () => renderer.current?.rotate(-10, 0), ArrowRight: () => renderer.current?.rotate(10, 0),
        ArrowUp: () => renderer.current?.rotate(0, 10), ArrowDown: () => renderer.current?.rotate(0, -10),
      };
      if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
    }}>
    {fallback ? <CanvasEarth ref={renderer} {...props} onReady={onCanvasReady} /> : <GlobeBoundary onFailure={onFailure}>
      <Suspense fallback={<div className="globe-loading" role="status">Opening Earth…</div>}><CesiumEarth ref={renderer} {...props} onReady={onCesiumReady} /></Suspense>
    </GlobeBoundary>}
    {children}
    <div className="globe-toolbar globe-tools" aria-label="Map tools">
      {document.fullscreenEnabled && <button aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'} aria-pressed={fullscreen} onClick={toggleFullscreen}>{fullscreen ? <Minimize /> : <Maximize />}</button>}
      <button aria-label="Measure distance" aria-pressed={measuring} onClick={() => { setMeasuring(!measuring); setMeasurement([]); }}><Ruler /></button>
      <button aria-label="Satellite imagery" aria-pressed={satellite && !fallback} disabled={!hasEsri || fallback} title={hasEsri ? 'Esri World Imagery' : 'Add an ArcGIS token to enable satellite imagery'} onClick={() => setSatellite(!satellite)}><Map /></button>
      <button aria-label="Place names and borders" aria-pressed={labels && !fallback} disabled={!hasEsri || fallback} title={hasEsri ? 'Esri reference labels' : 'Add an ArcGIS token to enable labels'} onClick={() => setLabels(!labels)}><Tags /></button>
    </div>
    <div className="globe-toolbar globe-navigation" aria-label="Globe controls">
      <button aria-label="Reset view" title="Earth overview (R)" onClick={() => renderer.current?.reset()}><Globe2 /></button>
      <button aria-label="Focus selected location" title="Focus selected location" disabled={!location} onClick={() => location && renderer.current?.flyTo(location)}><Focus /></button>
      <span className="globe-toolbar-divider" />
      <button aria-label="Zoom in" title="Zoom in (+)" onClick={() => renderer.current?.zoom(.7)}><Plus /></button>
      <button aria-label="Zoom out" title="Zoom out (−)" onClick={() => renderer.current?.zoom(1.4)}><Minus /></button>
    </div>
    {measuring && <div className="distance-panel" role="status">
      <strong>Surface distance</strong><button aria-label="Clear measurement" onClick={() => setMeasurement([])}><X size={14} /></button>
      <p>{measurement.length === 0 ? 'Select a starting point on Earth.' : measurement.length === 1 ? 'Select the second point.' : 'Select again to start a new measurement.'}</p>
      {measurement.map((p, i) => <div key={i}>{i === 0 ? 'A' : 'B'} · {formatCoordinates(p.lat, p.lon)}</div>)}
      {distance !== null && <output data-testid="surface-distance">{distance < 1000 ? `${distance.toFixed(0)} m` : `${(distance / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} km`} <small>· WGS84</small></output>}
    </div>}
    <div className="globe-hud">
      <div className="globe-coordinates" data-testid="globe-coordinates">{coordinate ? `${hover ? 'Pointer' : 'Selected'} · ${formatCoordinates(coordinate.lat, coordinate.lon)}` : 'Select a place on Earth'}</div>
      <div id="globe-help">Drag to rotate · Scroll / pinch to zoom · Double-click to focus</div>
      <div data-testid="map-status">{fallback ? 'Canvas fallback · global map' : satelliteReady && hasEsri ? 'Esri World Imagery' : 'Natural Earth · global map'} · {fallback ? 'Limited zoom detail' : `${Math.round(height / 1000).toLocaleString()} km altitude`}</div>
      {imageryStatus && <div role="status">{imageryStatus}</div>}
      {viewStatus && <div role="status">{viewStatus}</div>}
      {!fallback && !satelliteReady && height < 1000000 && <div>Global imagery · no street-level detail</div>}
      <span className="sr-only">Arrow keys rotate, plus and minus zoom, and R resets the view.</span>
    </div>
    {fallback && <div className="fallback-credit"><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth · public domain</a></div>}
  </div>;
}
