import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ArcGisMapServerImageryProvider, ArcType, Cartesian2, Cartesian3, Cartographic, Color, Credit, Ellipsoid, EllipsoidTerrainProvider, GeographicTilingScheme, ImageryLayer, Math as CesiumMath, Resource, ScreenSpaceEventHandler, ScreenSpaceEventType, UrlTemplateImageryProvider, Viewer, type Entity } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { clamp, locationAltitude, wrapLongitude } from '@/utils/geo';
import type { GlobeHandle, GlobeRendererProps } from './types';
import WeatherOverlay from './WeatherOverlay';

const CesiumEarth = forwardRef<GlobeHandle, GlobeRendererProps>((props, ref) => {
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const current = useRef(props);
  current.current = props;
  const [scene, setScene] = useState<Viewer | null>(null);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useImperativeHandle(ref, () => ({
    flyTo(location, altitude) {
      const v = viewer.current; if (!v || v.isDestroyed()) return;
      const height = altitude ?? locationAltitude(location.bounds, v.canvas.clientWidth / v.canvas.clientHeight);
      v.camera.cancelFlight();
      v.camera.flyTo({ destination: Cartesian3.fromDegrees(location.longitude, location.latitude, height),
        orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 }, duration: reduced() ? 0 : 1.6 });
    },
    zoom(factor) {
      const v = viewer.current; if (!v) return;
      const p = v.camera.positionCartographic;
      v.camera.flyTo({ destination: Cartesian3.fromRadians(p.longitude, p.latitude, clamp(p.height * factor, 250, 35000000)), duration: reduced() ? 0 : 0.4 });
    },
    reset() { const v = viewer.current; if (v) v.camera.flyTo({ destination: Cartesian3.fromDegrees(73.8567, 18.5204, 22000000), orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 }, duration: reduced() ? 0 : 1.2 }); },
    rotate(lon, lat) {
      const v = viewer.current; if (!v) return; const p = v.camera.positionCartographic;
      v.camera.setView({ destination: Cartesian3.fromDegrees(wrapLongitude(CesiumMath.toDegrees(p.longitude) + lon), clamp(CesiumMath.toDegrees(p.latitude) + lat, -89.9, 89.9), p.height) }); v.scene.requestRender();
    },
  }), []);

  useEffect(() => {
    if (!container.current) return;
    let v: Viewer;
    try {
      v = new Viewer(container.current, {
        baseLayer: false, baseLayerPicker: false, geocoder: false, animation: false, timeline: false,
        homeButton: false, sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false,
        selectionIndicator: false, infoBox: false, requestRenderMode: true, maximumRenderTimeChange: Infinity,
        terrainProvider: new EllipsoidTerrainProvider({ ellipsoid: Ellipsoid.WGS84 }),
      });
    } catch { current.current.onFailure(); return; }
    viewer.current = v;
    v.resolutionScale = Math.min(window.devicePixelRatio, 1.5);
    v.scene.globe.enableLighting = false;
    v.scene.globe.showGroundAtmosphere = true;
    v.scene.backgroundColor = Color.fromCssColorString('#020617');
    v.scene.screenSpaceCameraController.minimumZoomDistance = 250;
    v.scene.screenSpaceCameraController.maximumZoomDistance = 35000000;
    v.scene.screenSpaceCameraController.enableTilt = false;
    v.scene.screenSpaceCameraController.enableLook = false;
    v.camera.percentageChanged = 0.02;
    const natural = new UrlTemplateImageryProvider({
      url: `${import.meta.env.BASE_URL}cesium/Assets/Textures/NaturalEarthII/{z}/{x}/{reverseY}.jpg`,
      tilingScheme: new GeographicTilingScheme({ ellipsoid: Ellipsoid.WGS84 }), maximumLevel: 2,
      credit: new Credit('<a href="https://www.naturalearthdata.com/">Natural Earth</a>', true),
    });
    v.imageryLayers.addImageryProvider(natural);
    natural.errorEvent.addEventListener(() => current.current.onImageryStatus('Natural Earth tiles unavailable. Reload to retry.'));
    v.camera.setView({ destination: Cartesian3.fromDegrees(73.8567, 18.5204, 22000000), orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 } });
    v.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    const handler = new ScreenSpaceEventHandler(v.canvas);
    let start: Cartesian2 | null = null, dragged = false, lastHover = 0;
    let lastTap: { time: number; position: Cartesian2 } | null = null;
    const pick = (pixel: Cartesian2) => {
      const world = v.camera.pickEllipsoid(pixel, Ellipsoid.WGS84);
      if (!world) return null;
      const point = Cartographic.fromCartesian(world, Ellipsoid.WGS84);
      return { lat: CesiumMath.toDegrees(point.latitude), lon: CesiumMath.toDegrees(point.longitude) };
    };
    handler.setInputAction((e: { position: Cartesian2 }) => { start = Cartesian2.clone(e.position); dragged = false; }, ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction((e: { endPosition: Cartesian2 }) => {
      if (start && Cartesian2.distance(start, e.endPosition) > 6) dragged = true;
      if (performance.now() - lastHover > 80) { current.current.onHover(pick(e.endPosition)); lastHover = performance.now(); }
    }, ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction((e: { position: Cartesian2 }) => {
      if (!dragged) {
        const point = pick(e.position), now = performance.now();
        const twice = !!lastTap && now - lastTap.time < 350 && Cartesian2.distance(lastTap.position, e.position) < 20;
        if (point) current.current.onPick(point, twice);
        lastTap = { time: now, position: Cartesian2.clone(e.position) };
      }
      start = null;
    }, ScreenSpaceEventType.LEFT_CLICK);
    const touches = new Set<number>();
    const down = (e: PointerEvent) => { touches.add(e.pointerId); if (touches.size > 1) dragged = true; };
    const up = (e: PointerEvent) => touches.delete(e.pointerId);
    const cancel = (e: PointerEvent) => { dragged = true; touches.delete(e.pointerId); };
    const lost = (e: Event) => { e.preventDefault(); current.current.onFailure(); };
    const leave = () => current.current.onHover(null);
    v.canvas.addEventListener('pointerdown', down); v.canvas.addEventListener('pointerup', up); v.canvas.addEventListener('pointercancel', cancel);
    v.canvas.addEventListener('webglcontextlost', lost); v.canvas.addEventListener('pointerleave', leave);
    const updateHeight = () => current.current.onHeight(v.camera.positionCartographic.height);
    const removeChanged = v.camera.changed.addEventListener(updateHeight);
    const removeRenderError = v.scene.renderError.addEventListener(() => current.current.onFailure());
    updateHeight();
    const resize = new ResizeObserver(() => { v.resize(); v.scene.requestRender(); });
    resize.observe(container.current);
    const host = container.current.parentElement;
    const credits = container.current.querySelector<HTMLElement>('.cesium-widget-credits');
    const creditResize = new ResizeObserver(() => host?.style.setProperty('--credit-height', `${Math.max(28, credits?.offsetHeight ?? 0)}px`));
    if (credits) creditResize.observe(credits);
    let onScreen = true;
    const visibility = () => { v.useDefaultRenderLoop = onScreen && !document.hidden; if (v.useDefaultRenderLoop) v.scene.requestRender(); };
    const intersection = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; visibility(); });
    intersection.observe(container.current); document.addEventListener('visibilitychange', visibility);
    setScene(v); current.current.onReady();
    return () => {
      resize.disconnect(); creditResize.disconnect(); host?.style.removeProperty('--credit-height'); intersection.disconnect(); document.removeEventListener('visibilitychange', visibility); removeChanged(); removeRenderError(); handler.destroy();
      v.canvas.removeEventListener('webglcontextlost', lost); v.canvas.removeEventListener('pointerleave', leave);
      v.canvas.removeEventListener('pointerdown', down); v.canvas.removeEventListener('pointerup', up); v.canvas.removeEventListener('pointercancel', cancel);
      viewer.current = null; if (!v.isDestroyed()) v.destroy();
    };
  }, []);

  useEffect(() => {
    if (!scene || scene.isDestroyed()) return;
    let cancelled = false;
    const added: ImageryLayer[] = [];
    const token = import.meta.env.VITE_ARCGIS_ACCESS_TOKEN;
    if (!token || (!props.satellite && !props.labels)) { props.onImageryStatus(''); return; }
    props.onImageryStatus('Loading Esri imagery…');
    const add = async (url: string) => {
      const provider = await ArcGisMapServerImageryProvider.fromUrl(new Resource({ url, queryParameters: { token } }), { enablePickFeatures: false });
      if (cancelled || scene.isDestroyed()) return;
      if (provider.credit) provider.credit.showOnScreen = true;
      provider.errorEvent.addEventListener(() => { if (!cancelled) current.current.onImageryStatus('Esri tiles unavailable here. Natural Earth remains available.'); });
      added.push(scene.imageryLayers.addImageryProvider(provider)); scene.scene.requestRender();
    };
    void (async () => {
      try {
        if (props.satellite) await add(import.meta.env.VITE_ESRI_IMAGERY_URL || 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer');
        if (props.labels) await add(import.meta.env.VITE_ESRI_LABELS_URL || 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer');
        if (!cancelled) current.current.onImageryStatus('');
      } catch { if (!cancelled) current.current.onImageryStatus('Esri unavailable. Check your ArcGIS token; Natural Earth remains available.'); }
    })();
    return () => { cancelled = true; if (!scene.isDestroyed()) { added.forEach((layer) => scene.imageryLayers.remove(layer, true)); scene.scene.requestRender(); } };
  }, [scene, props.satellite, props.labels, props.onImageryStatus]);

  useEffect(() => {
    if (!scene || scene.isDestroyed()) return;
    const entities: Entity[] = [];
    const addPoint = (lat: number, lon: number, color: Color, text?: string) => entities.push(scene.entities.add({
      position: Cartesian3.fromDegrees(lon, lat, 25), point: { pixelSize: 10, color, outlineColor: Color.BLACK, outlineWidth: 2 },
      label: text ? { text, font: '14px sans-serif', fillColor: Color.WHITE, showBackground: true, pixelOffset: new Cartesian2(0, -22) } : undefined,
    }));
    if (props.location) addPoint(props.location.latitude, props.location.longitude, Color.CYAN);
    props.measurement.forEach((point, i) => addPoint(point.lat, point.lon, Color.YELLOW, i === 0 ? 'A' : 'B'));
    if (props.path.length > 1) entities.push(scene.entities.add({ polyline: {
      positions: props.path.map((point) => Cartesian3.fromDegrees(point.lon, point.lat, 100)), width: 3, material: Color.YELLOW, arcType: ArcType.GEODESIC,
    } }));
    scene.scene.requestRender();
    return () => { if (!scene.isDestroyed()) { entities.forEach((entity) => scene.entities.remove(entity)); scene.scene.requestRender(); } };
  }, [scene, props.location, props.measurement, props.path]);
  return <><div ref={container} className="earth-renderer" data-testid="cesium-renderer" />{scene && <WeatherOverlay viewer={scene} />}</>;
});
CesiumEarth.displayName = 'CesiumEarth';
export default CesiumEarth;
