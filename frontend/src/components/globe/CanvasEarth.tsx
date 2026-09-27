import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getMapData } from '@/api/weather';
import { useGlobeStore } from '@/store/globeStore';
import { layerColor } from '@/utils/weatherMap';
import { clamp, locationAltitude, project, unproject, wrapLongitude, type Coordinate } from '@/utils/geo';
import type { GlobeHandle, GlobeRendererProps } from './types';

// A CPU orthographic globe. It shares geographic selection and geodesic tools,
// but deliberately caps zoom because Natural Earth has no street-level detail.
const CanvasEarth = forwardRef<GlobeHandle, GlobeRendererProps>((props, ref) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef(props); current.current = props;
  const view = useRef({ center: { lat: 18.5204, lon: 73.8567 }, zoom: 1 });
  const texture = useRef<ImageData | null>(null);
  const redraw = useRef<() => void>(() => {});
  const animation = useRef(0);
  const layers = useGlobeStore((s) => s.activeLayers).filter((l) => l.active);
  const queries = useQueries({ queries: layers.map((layer) => ({ queryKey: ['weather-map', layer.id], queryFn: ({ signal }: { signal: AbortSignal }) => getMapData(layer.id, signal), staleTime: 600000, retry: 1 })) });
  const weather = useRef<{ point: Coordinate; color: string; opacity: number }[]>([]);
  weather.current = queries.flatMap((q, i) => q.data?.points.map((point) => ({ point, color: layerColor(layers[i].id, point.value), opacity: layers[i].opacity })) ?? []);
  const weatherRevision = layers.map((layer, i) => `${layer.id}:${layer.opacity}:${queries[i].dataUpdatedAt}`).join('|');
  useImperativeHandle(ref, () => ({
    flyTo(location, altitude) {
      cancelAnimationFrame(animation.current);
      const from = { ...view.current.center }, delta = wrapLongitude(location.longitude - from.lon);
      const start = performance.now(), fromZoom = view.current.zoom;
      const aspect = (canvas.current?.clientWidth ?? 1) / Math.max(1, canvas.current?.clientHeight ?? 1);
      const targetZoom = clamp(Math.sqrt(22000000 / Math.max(1500, altitude ?? locationAltitude(location.bounds, aspect))), .75, 4);
      const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900;
      const tick = (now: number) => {
        const t = duration ? clamp((now - start) / duration, 0, 1) : 1, ease = t * t * (3 - 2 * t);
        view.current = { center: { lat: from.lat + (location.latitude - from.lat) * ease, lon: wrapLongitude(from.lon + delta * ease) }, zoom: fromZoom + (targetZoom - fromZoom) * ease };
        redraw.current();
        if (t < 1) animation.current = requestAnimationFrame(tick);
      };
      animation.current = requestAnimationFrame(tick);
    },
    zoom(factor) { cancelAnimationFrame(animation.current); view.current.zoom = clamp(view.current.zoom / factor, .75, 4); redraw.current(); },
    reset() { cancelAnimationFrame(animation.current); view.current = { center: { lat: 18.5204, lon: 73.8567 }, zoom: 1 }; redraw.current(); },
    rotate(lon, lat) { cancelAnimationFrame(animation.current); view.current.center = { lat: clamp(view.current.center.lat + lat, -89.9, 89.9), lon: wrapLongitude(view.current.center.lon + lon) }; redraw.current(); },
  }), []);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext('2d', { willReadFrequently: true });
    if (!context) { current.current.onImageryStatus('Canvas is unavailable. Place search and weather remain available.'); return; }
    let disposed = false, scheduled = 0;
    const draw = () => {
      const w = element.width, h = element.height, radius = Math.min(w, h) * .4 * view.current.zoom;
      const { center } = view.current;
      // Cap the backing store to keep the per-pixel fallback responsive on low-end devices.
      const pixels = context.createImageData(w, h), source = texture.current;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const offset = (y * w + x) * 4;
        const nx = (x - w / 2) / radius, ny = (h / 2 - y) / radius;
        const point = unproject(nx, ny, center);
        let rgb = [2, 6, 23];
        if (point) {
          if (source) {
            const tx = Math.floor((point.lon + 180) / 360 * source.width) % source.width;
            const ty = clamp(Math.floor((90 - point.lat) / 180 * source.height), 0, source.height - 1);
            const i = (ty * source.width + tx) * 4;
            const shade = .7 + .3 * Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
            rgb = [source.data[i] * shade, source.data[i + 1] * shade, source.data[i + 2] * shade];
          } else rgb = [17, 59, 89];
        }
        pixels.data[offset] = rgb[0]; pixels.data[offset + 1] = rgb[1]; pixels.data[offset + 2] = rgb[2]; pixels.data[offset + 3] = 255;
      }
      context.putImageData(pixels, 0, 0);
      context.save(); context.beginPath(); context.arc(w / 2, h / 2, radius, 0, 2 * Math.PI); context.clip();
      const xy = (p: Coordinate) => { const projected = project(p, center); return { x: w / 2 + projected.x * radius, y: h / 2 - projected.y * radius, visible: projected.visible }; };
      context.strokeStyle = '#fde047'; context.lineWidth = 2; context.beginPath(); let penDown = false;
      for (const p of current.current.path) { const q = xy(p); if (!q.visible) { penDown = false; continue; } if (penDown) context.lineTo(q.x, q.y); else context.moveTo(q.x, q.y); penDown = true; }
      context.stroke();
      const dot = (p: Coordinate, color: string, size: number, label?: string) => {
        const q = xy(p); if (!q.visible) return;
        context.fillStyle = color; context.beginPath(); context.arc(q.x, q.y, size, 0, 2 * Math.PI); context.fill();
        if (label) { context.font = 'bold 13px sans-serif'; context.fillStyle = '#fff'; context.fillText(label, q.x + 7, q.y - 7); }
      };
      weather.current.forEach(({ point, color, opacity }) => { context.globalAlpha = opacity; dot(point, color, 5); }); context.globalAlpha = 1;
      const location = current.current.location;
      if (location) dot({ lat: location.latitude, lon: location.longitude }, '#22d3ee', 4);
      current.current.measurement.forEach((p, i) => dot(p, '#fde047', 4, i === 0 ? 'A' : 'B'));
      context.restore();
      context.strokeStyle = '#67e8f944'; context.lineWidth = 2; context.beginPath(); context.arc(w / 2, h / 2, radius, 0, 2 * Math.PI); context.stroke();
    };
    redraw.current = () => { cancelAnimationFrame(scheduled); scheduled = requestAnimationFrame(draw); };
    const resize = new ResizeObserver(() => {
      const box = element.getBoundingClientRect(), scale = Math.min(1, 600 / Math.max(box.width, box.height));
      element.width = Math.max(1, Math.round(box.width * scale)); element.height = Math.max(1, Math.round(box.height * scale)); redraw.current();
    });
    resize.observe(element);
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      const buffer = document.createElement('canvas'); buffer.width = image.width; buffer.height = image.height;
      const ctx = buffer.getContext('2d'); if (!ctx) return;
      ctx.drawImage(image, 0, 0); texture.current = ctx.getImageData(0, 0, image.width, image.height); redraw.current();
    };
    image.onerror = () => { if (!disposed) current.current.onImageryStatus('Natural Earth image unavailable. Showing an untextured globe.'); };
    image.src = `${import.meta.env.BASE_URL}maps/natural-earth.jpg`;
    const pointers = new Map<number, { x: number; y: number }>();
    let down: { x: number; y: number; center: Coordinate } | null = null, blocked = false, pinch = 0, pinchZoom = 1;
    let lastTap = { time: 0, x: 0, y: 0 };
    const pick = (x: number, y: number) => {
      const box = element.getBoundingClientRect(), radius = Math.min(box.width, box.height) * .4 * view.current.zoom;
      return unproject((x - box.left - box.width / 2) / radius, (box.height / 2 - (y - box.top)) / radius, view.current.center);
    };
    const pointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      cancelAnimationFrame(animation.current); element.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) { down = { x: e.clientX, y: e.clientY, center: { ...view.current.center } }; blocked = false; }
      else { blocked = true; const [a, b] = [...pointers.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); pinchZoom = view.current.zoom; }
    };
    const pointerMove = (e: PointerEvent) => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size > 1) {
        const [a, b] = [...pointers.values()]; view.current.zoom = clamp(pinchZoom * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch), .75, 4); redraw.current();
      } else if (down && pointers.size && !pinch) {
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        if (Math.hypot(dx, dy) > 6) blocked = true;
        if (blocked) { const radius = Math.min(element.clientWidth, element.clientHeight) * .4 * view.current.zoom; view.current.center = { lat: clamp(down.center.lat + dy / radius * 60, -89.9, 89.9), lon: wrapLongitude(down.center.lon - dx / radius * 60) }; redraw.current(); }
      }
      current.current.onHover(pick(e.clientX, e.clientY));
    };
    const pointerUp = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      if (!blocked && down && e.type !== 'pointercancel') {
        const p = pick(e.clientX, e.clientY), now = performance.now();
        const twice = now - lastTap.time < 350 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 20;
        if (p) current.current.onPick(p, twice); lastTap = { time: now, x: e.clientX, y: e.clientY };
      }
      pointers.delete(e.pointerId); if (element.hasPointerCapture(e.pointerId)) element.releasePointerCapture(e.pointerId);
      if (pointers.size === 1) {
        const remaining = [...pointers.values()][0];
        down = { x: remaining.x, y: remaining.y, center: { ...view.current.center } };
        pinch = 0; blocked = true;
      } else if (!pointers.size) { down = null; pinch = 0; }
    };
    const wheel = (e: WheelEvent) => { e.preventDefault(); cancelAnimationFrame(animation.current); view.current.zoom = clamp(view.current.zoom * Math.exp(-e.deltaY * .001), .75, 4); redraw.current(); };
    const leave = () => current.current.onHover(null);
    element.addEventListener('pointerdown', pointerDown); element.addEventListener('pointermove', pointerMove); element.addEventListener('pointerup', pointerUp); element.addEventListener('pointercancel', pointerUp); element.addEventListener('pointerleave', leave); element.addEventListener('wheel', wheel, { passive: false });
    current.current.onReady();
    return () => {
      disposed = true; resize.disconnect(); cancelAnimationFrame(scheduled); cancelAnimationFrame(animation.current); image.onload = null; image.onerror = null;
      element.removeEventListener('pointerdown', pointerDown); element.removeEventListener('pointermove', pointerMove); element.removeEventListener('pointerup', pointerUp); element.removeEventListener('pointercancel', pointerUp); element.removeEventListener('pointerleave', leave); element.removeEventListener('wheel', wheel);
    };
  }, []);
  useEffect(() => { redraw.current(); }, [props.location, props.measurement, props.path, weatherRevision]);
  return <canvas ref={canvas} className="earth-renderer" data-testid="canvas-renderer" aria-label="Canvas Earth fallback" />;
});
CanvasEarth.displayName = 'CanvasEarth';
export default CanvasEarth;
