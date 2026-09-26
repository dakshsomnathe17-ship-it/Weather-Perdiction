import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { ACESFilmicToneMapping, Group } from 'three';
import { Cloud, Focus, Minus, Pause, Play, Plus, RotateCcw, Sparkles } from 'lucide-react';
import Earth from './Earth';
import Atmosphere from './Atmosphere';
import CloudLayer from './CloudLayer';
import Stars from './Stars';
import Lighting from './Lighting';
import GlobeControls, { type GlobeControlsHandle } from './GlobeControls';
import WeatherOverlay from './WeatherOverlay';
import LocationMarker from './LocationMarker';
import { useGlobeStore } from '@/store/globeStore';
import { formatCoordinates, isValidCoordinate, worldPointToLatLon } from '@/utils/geo';
import { GlobeGesture } from '@/utils/globeNavigation';
import type { TextureStatus } from './textures';
import './globe.css';

interface GlobeProps {
  onLocationSelect?: (lat: number, lon: number) => void;
  location?: { latitude: number; longitude: number } | null;
  className?: string;
  style?: React.CSSProperties;
}

function RotatingEarth({ earthRef, children }: { earthRef: RefObject<Group | null>; children: React.ReactNode }) {
  const rotating = useGlobeStore((state) => state.isRotating);
  useFrame((_, delta) => {
    if (rotating && earthRef.current) earthRef.current.rotation.y += Math.min(delta, 0.05) * 0.025;
  });
  return <group ref={earthRef} name="earth-system">{children}</group>;
}

class GlobeBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="globe-unavailable" role="alert">
      3D view unavailable. Enable WebGL in your browser or use city search to explore weather.
    </div> : this.props.children;
  }
}

const Globe: React.FC<GlobeProps> = ({ onLocationSelect, location, className = '', style }) => {
  const controls = useRef<GlobeControlsHandle>(null);
  const earth = useRef<Group>(null);
  const host = useRef<HTMLDivElement>(null);
  const gesture = useRef(new GlobeGesture());
  const lastTap = useRef({ time: 0, x: 0, y: 0 });
  const [hover, setHover] = useState<{ lat: number; lon: number } | null>(null);
  const lastHover = useRef(0);
  const [textures, setTextures] = useState<Record<string, TextureStatus>>({});
  const [visible, setVisible] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const { selectedPoint, isRotating, toggleRotation, setRotating, showClouds, showAtmosphere, toggleClouds, toggleAtmosphere } = useGlobeStore();
  const reportTexture = useCallback((name: string, status: TextureStatus) => {
    setTextures((current) => ({ ...current, [name]: status }));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReducedMotion(media.matches); if (media.matches) setRotating(false); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [setRotating]);

  useEffect(() => {
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    if (host.current) observer.observe(host.current);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    if (!location || !isValidCoordinate(location.latitude, location.longitude)) return;
    const point = useGlobeStore.getState().selectedPoint;
    if (point?.[0] === location.latitude && point[1] === location.longitude) return;
    useGlobeStore.getState().setSelectedPoint([location.latitude, location.longitude]);
    // Search results focus the globe. A click already set the same point, so it stays put.
    controls.current?.zoomToLocation(location.latitude, location.longitude, 3.2);
  }, [location?.latitude, location?.longitude]);

  const select = (event: ThreeEvent<MouseEvent>, focus = false) => {
    event.stopPropagation();
    if (event.button !== 0 || gesture.current.blocked || event.delta > 6) return;
    const { lat, lon } = worldPointToLatLon(event.point, event.object);
    useGlobeStore.getState().setSelectedPoint([lat, lon]);
    setRotating(false);
    onLocationSelect?.(lat, lon);
    const now = performance.now();
    const doubleTap = now - lastTap.current.time < 350 && Math.hypot(event.clientX - lastTap.current.x, event.clientY - lastTap.current.y) < 20;
    lastTap.current = { time: now, x: event.clientX, y: event.clientY };
    if (focus || doubleTap) controls.current?.zoomToLocation(lat, lon);
  };
  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const actions: Record<string, () => void> = {
      '+': () => controls.current?.zoom(0.8), '=': () => controls.current?.zoom(0.8),
      '-': () => controls.current?.zoom(1.25), r: () => controls.current?.reset(),
      ' ': toggleRotation,
      ArrowLeft: () => controls.current?.rotate(-0.2, 0), ArrowRight: () => controls.current?.rotate(0.2, 0),
      ArrowUp: () => controls.current?.rotate(0, -0.15), ArrowDown: () => controls.current?.rotate(0, 0.15),
      Enter: () => { if (selectedPoint) controls.current?.zoomToLocation(...selectedPoint); },
    };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  };
  const failedTextures = Object.values(textures).some((value) => value === 'unavailable');
  const loading = Object.keys(textures).length < 4 || Object.values(textures).some((value) => value === 'loading');
  const coordinate = hover ?? (selectedPoint ? { lat: selectedPoint[0], lon: selectedPoint[1] } : null);
  return (
    <div ref={host} className={`globe-view ${className}`} style={style} tabIndex={0}
      role="region" aria-label="Interactive Earth" aria-describedby="globe-help" onKeyDown={keyDown}
      onPointerDownCapture={(e) => {
        if (!(e.target instanceof HTMLCanvasElement)) return;
        host.current?.focus({ preventScroll: true });
        gesture.current.down(e.pointerId, e.clientX, e.clientY);
        setRotating(false);
      }}
      onPointerMoveCapture={(e) => gesture.current.move(e.pointerId, e.clientX, e.clientY)}
      onPointerUpCapture={(e) => gesture.current.up(e.pointerId)}
      onPointerCancelCapture={(e) => gesture.current.cancel(e.pointerId)}
      onLostPointerCapture={(e) => gesture.current.up(e.pointerId)}>
      <GlobeBoundary>
        <Canvas camera={{ fov: 45, near: 0.05, far: 200, position: [0, 0, 3.5] }} dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
          frameloop={!visible || contextLost ? 'never' : isRotating ? 'always' : 'demand'}
          fallback={<div className="globe-unavailable">3D view requires WebGL. City search is still available.</div>}
          onCreated={({ gl }) => { gl.setClearColor('#020617'); }}>
          <Lighting />
          <Stars />
          <RotatingEarth earthRef={earth}>
            <Earth onTextureStatus={reportTexture} onClick={(e) => select(e)} onDoubleClick={(e) => select(e, true)}
              onPointerMove={(e) => {
                if (performance.now() - lastHover.current < 80) return;
                lastHover.current = performance.now();
                setHover(worldPointToLatLon(e.point, e.object));
              }} onPointerOut={() => setHover(null)} />
            <Atmosphere />
            <CloudLayer onTextureStatus={reportTexture} />
            <WeatherOverlay />
            <LocationMarker />
          </RotatingEarth>
          <GlobeControls ref={controls} earthRef={earth} reducedMotion={reducedMotion} />
          <ContextStatus onLost={setContextLost} />
        </Canvas>
      </GlobeBoundary>
      {contextLost && <div className="globe-unavailable" role="alert">3D view interrupted. <button onClick={() => window.location.reload()}>Reload view</button></div>}
      <div className="globe-toolbar" aria-label="Globe controls">
        <button aria-label={isRotating ? 'Pause rotation' : 'Resume rotation'} title="Auto rotation" onClick={toggleRotation}>{isRotating ? <Pause /> : <Play />}</button>
        <button aria-label="Zoom in" onClick={() => controls.current?.zoom(0.8)}><Plus /></button>
        <button aria-label="Zoom out" onClick={() => controls.current?.zoom(1.25)}><Minus /></button>
        <button aria-label="Reset view" title="Reset view (R)" onClick={() => controls.current?.reset()}><RotateCcw /></button>
        <button aria-label="Focus selected location" disabled={!selectedPoint} onClick={() => selectedPoint && controls.current?.zoomToLocation(...selectedPoint)}><Focus /></button>
        <button aria-label="Show clouds" aria-pressed={showClouds} onClick={toggleClouds}><Cloud /></button>
        <button aria-label="Show atmosphere" aria-pressed={showAtmosphere} onClick={toggleAtmosphere}><Sparkles /></button>
      </div>
      <div className="globe-hud">
        <div className="globe-coordinates" data-testid="globe-coordinates">{coordinate ? `${hover ? 'Pointer' : 'Selected'} · ${formatCoordinates(coordinate.lat, coordinate.lon)}` : 'Select a place on Earth'}</div>
        <div id="globe-help">Drag to rotate · Scroll / pinch to zoom · Double-click / double-tap to focus</div>
        <span className="sr-only">Focus the globe for arrow keys to rotate, plus and minus to zoom, R to reset, Space to pause, and Enter to focus the selection.</span>
        <div className="globe-credit"><a href={`${import.meta.env.BASE_URL}textures/ATTRIBUTION.md`} target="_blank" rel="noreferrer">Imagery: NASA Earth Observatory / NOAA · Credits</a><span>Historical imagery · illustrative lighting</span></div>
        {(failedTextures || loading) && <div role="status">{failedTextures ? 'Some imagery is unavailable. Reload to retry.' : 'Loading Earth imagery…'}</div>}
      </div>
    </div>
  );
};

// Keep listener ownership inside Canvas so remounting does not leak event handlers.
function ContextStatus({ onLost }: { onLost: (lost: boolean) => void }) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost(true); };
    const restored = () => { onLost(false); invalidate(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    gl.domElement.addEventListener('webglcontextrestored', restored);
    return () => { gl.domElement.removeEventListener('webglcontextlost', lost); gl.domElement.removeEventListener('webglcontextrestored', restored); };
  }, [gl, invalidate, onLost]);
  return null;
}
export default Globe;
