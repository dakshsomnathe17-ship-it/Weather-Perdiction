import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ArcGisMapServerImageryProvider, ArcType, Cartesian2, Cartesian3, Cartographic, Color, Credit, CreditDisplay, DirectionalLight, Ellipsoid, EllipsoidTerrainProvider, GeographicTilingScheme, ImageryLayer, Math as CesiumMath, OpenStreetMapImageryProvider, PerspectiveFrustum, Resource, ScreenSpaceEventHandler, ScreenSpaceEventType, UrlTemplateImageryProvider, Viewer, type Entity } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { clamp, locationAltitude, wrapLongitude } from '@/utils/geo';
import type { GlobeHandle, GlobeRendererProps } from './types';
import WeatherOverlay from './WeatherOverlay';

function homeDestination(v: Viewer) {
  const frustum = v.camera.frustum as PerspectiveFrustum;
  const aspect = v.canvas.clientWidth / Math.max(1, v.canvas.clientHeight);
  // Fit the entire globe to 82% of the shorter viewport edge, including portrait screens.
  const halfAngle = Math.atan(.82 * Math.tan((frustum.fovy ?? Math.PI / 3) / 2) * Math.min(1, aspect));
  const height = Ellipsoid.WGS84.maximumRadius * (1 / Math.sin(halfAngle) - 1);
  return Cartesian3.fromDegrees(73.8567, 18.5204, height);
}

const CesiumEarth = forwardRef<GlobeHandle, GlobeRendererProps>((props, ref) => {
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const atHome = useRef(true);
  const current = useRef(props);
  current.current = props;
  const [scene, setScene] = useState<Viewer | null>(null);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useImperativeHandle(ref, () => ({
    flyTo(location, altitude) {
      const v = viewer.current; if (!v || v.isDestroyed()) return;
      atHome.current = false;
      const height = altitude ?? locationAltitude(location.bounds, v.canvas.clientWidth / v.canvas.clientHeight);
      v.camera.cancelFlight();
      v.camera.flyTo({ destination: Cartesian3.fromDegrees(location.longitude, location.latitude, height),
        orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 }, duration: reduced() ? 0 : 1.6 });
    },
    zoom(factor) {
      const v = viewer.current; if (!v) return;
      atHome.current = false;
      const p = v.camera.positionCartographic;
      v.camera.flyTo({ destination: Cartesian3.fromRadians(p.longitude, p.latitude, clamp(p.height * factor, 250, 35000000)), duration: reduced() ? 0 : 0.4 });
    },
    reset() { const v = viewer.current; if (v) { atHome.current = true; v.camera.flyTo({ destination: homeDestination(v), orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 }, duration: reduced() ? 0 : 1.2 }); } },
    rotate(lon, lat) {
      const v = viewer.current; if (!v) return; const p = v.camera.positionCartographic;
      atHome.current = false;
      v.camera.setView({ destination: Cartesian3.fromDegrees(wrapLongitude(CesiumMath.toDegrees(p.longitude) + lon), clamp(CesiumMath.toDegrees(p.latitude) + lat, -89.9, 89.9), p.height) }); v.scene.requestRender();
    },
  }), []);

  useEffect(() => {
    if (!container.current) return;
    // No ion services/assets are used. Replace only the optional engine logo;
    // provider credits remain visible and ion providers can still add their own credit.
    const previousCredit = CreditDisplay.cesiumCredit;
    const emptyCredit = new Credit('');
    CreditDisplay.cesiumCredit = emptyCredit;
    let v: Viewer;
    try {
      v = new Viewer(container.current, {
        baseLayer: false, baseLayerPicker: false, geocoder: false, animation: false, timeline: false,
        homeButton: false, sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false,
        blurActiveElementOnCanvasFocus: false,
        selectionIndicator: false, infoBox: false, requestRenderMode: true, maximumRenderTimeChange: Infinity,
        terrainProvider: new EllipsoidTerrainProvider({ ellipsoid: Ellipsoid.WGS84 }),
      });
    } catch { CreditDisplay.cesiumCredit = previousCredit; current.current.onFailure(); return; }
    viewer.current = v;
    v.resolutionScale = Math.min(window.devicePixelRatio, 1.5);
    v.scene.globe.enableLighting = true;
    v.scene.globe.showGroundAtmosphere = false;
    v.scene.globe.lightingFadeOutDistance = 200000;
    v.scene.globe.lightingFadeInDistance = 3000000;
    v.scene.backgroundColor = Color.fromCssColorString('#030609');
    if (v.scene.skyBox) v.scene.skyBox.show = false;
    if (v.scene.sun) v.scene.sun.show = false;
    if (v.scene.moon) v.scene.moon.show = false;
    if (v.scene.skyAtmosphere) v.scene.skyAtmosphere.brightnessShift = -.25;
    v.scene.fog.enabled = false;
    // Camera-relative illumination keeps places readable as the user explores.
    const light = new DirectionalLight({ direction: new Cartesian3(1, 0, 0) });
    const lightOffset = new Cartesian3();
    v.scene.light = light;
    const removeLight = v.scene.preRender.addEventListener(() => {
      Cartesian3.multiplyByScalar(v.camera.rightWC, .55, lightOffset);
      Cartesian3.add(v.camera.directionWC, lightOffset, light.direction);
      Cartesian3.multiplyByScalar(v.camera.upWC, -.25, lightOffset);
      Cartesian3.add(light.direction, lightOffset, light.direction);
      Cartesian3.normalize(light.direction, light.direction);
    });
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
    const naturalLayer = v.imageryLayers.addImageryProvider(natural);
    naturalLayer.brightness = .95;
    naturalLayer.contrast = 1.15;
    naturalLayer.saturation = 1.12;
    naturalLayer.gamma = .9;
    natural.errorEvent.addEventListener(() => current.current.onImageryStatus('Natural Earth tiles unavailable. Reload to retry.'));
    v.camera.setView({ destination: homeDestination(v), orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 } });
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
    const down = (e: PointerEvent) => { atHome.current = false; touches.add(e.pointerId); if (touches.size > 1) dragged = true; };
    const wheel = () => { atHome.current = false; };
    const up = (e: PointerEvent) => touches.delete(e.pointerId);
    const cancel = (e: PointerEvent) => { dragged = true; touches.delete(e.pointerId); };
    const lost = (e: Event) => { e.preventDefault(); current.current.onFailure(); };
    const leave = () => current.current.onHover(null);
    v.canvas.addEventListener('pointerdown', down); v.canvas.addEventListener('pointerup', up); v.canvas.addEventListener('pointercancel', cancel);
    v.canvas.addEventListener('webglcontextlost', lost); v.canvas.addEventListener('pointerleave', leave);
    v.canvas.addEventListener('wheel', wheel, { passive: true });
    const updateHeight = () => current.current.onHeight(v.camera.positionCartographic.height);
    const removeChanged = v.camera.changed.addEventListener(updateHeight);
    const removeRenderError = v.scene.renderError.addEventListener(() => current.current.onFailure());
    updateHeight();
    const resize = new ResizeObserver(() => {
      v.resize();
      if (atHome.current) v.camera.setView({ destination: homeDestination(v), orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 } });
      v.scene.requestRender();
    });
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
      resize.disconnect(); creditResize.disconnect(); host?.style.removeProperty('--credit-height'); intersection.disconnect(); document.removeEventListener('visibilitychange', visibility); removeChanged(); removeRenderError(); removeLight(); handler.destroy();
      v.canvas.removeEventListener('wheel', wheel);
      v.canvas.removeEventListener('webglcontextlost', lost); v.canvas.removeEventListener('pointerleave', leave);
      v.canvas.removeEventListener('pointerdown', down); v.canvas.removeEventListener('pointerup', up); v.canvas.removeEventListener('pointercancel', cancel);
      viewer.current = null; if (!v.isDestroyed()) v.destroy();
      if (CreditDisplay.cesiumCredit === emptyCredit) CreditDisplay.cesiumCredit = previousCredit;
    };
  }, []);

  useEffect(() => {
    if (!scene || scene.isDestroyed() || !props.streetMap) { props.onStreetState('off'); return; }
    // Only request the viewport being explored; browser HTTP caching is left intact.
    const provider = new OpenStreetMapImageryProvider({
      url: import.meta.env.VITE_STREET_MAP_URL || 'https://tile.openstreetmap.org/',
      maximumLevel: 19,
      credit: new Credit(import.meta.env.VITE_STREET_MAP_CREDIT || '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>', true),
    });
    provider.enablePickFeatures = false;
    const layer = scene.imageryLayers.addImageryProvider(provider, 1);
    let failed = false;
    props.onStreetState('loading');
    const removeError = provider.errorEvent.addEventListener(() => {
      failed = true; layer.show = false;
      current.current.onStreetState('error'); scene.scene.requestRender();
    });
    const removeProgress = scene.scene.globe.tileLoadProgressEvent.addEventListener((pending: number) => {
      if (!failed && pending === 0) current.current.onStreetState('ready');
    });
    scene.scene.requestRender();
    return () => {
      removeError(); removeProgress();
      if (!scene.isDestroyed()) { scene.imageryLayers.remove(layer, true); scene.scene.requestRender(); }
      props.onStreetState('off');
    };
  }, [scene, props.streetMap, props.onStreetState]);

  useEffect(() => {
    if (!scene || scene.isDestroyed()) return;
    let cancelled = false;
    const added: ImageryLayer[] = [];
    const token = import.meta.env.VITE_ARCGIS_ACCESS_TOKEN;
    props.onSatelliteReady(false);
    if (!token || (!props.satellite && !props.labels)) { props.onImageryStatus(''); return; }
    props.onImageryStatus('Loading Esri imagery…');
    const failed = new Set<'satellite' | 'labels'>();
    const report = () => current.current.onImageryStatus(failed.size
      ? `Esri ${[...failed].join(' and ')} unavailable. Natural Earth remains available.` : '');
    const add = async (kind: 'satellite' | 'labels', url: string) => {
      const provider = await ArcGisMapServerImageryProvider.fromUrl(new Resource({ url, queryParameters: { token } }), { enablePickFeatures: false });
      if (cancelled || scene.isDestroyed()) return;
      if (provider.credit) provider.credit.showOnScreen = true;
      provider.errorEvent.addEventListener(() => { if (!cancelled) { failed.add(kind); if (kind === 'satellite') current.current.onSatelliteReady(false); report(); } });
      added.push(scene.imageryLayers.addImageryProvider(provider)); scene.scene.requestRender();
      if (kind === 'satellite') current.current.onSatelliteReady(true);
    };
    const requested: Array<['satellite' | 'labels', string]> = [];
    if (props.satellite) requested.push(['satellite', import.meta.env.VITE_ESRI_IMAGERY_URL || 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer']);
    if (props.labels) requested.push(['labels', import.meta.env.VITE_ESRI_LABELS_URL || 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer']);
    void Promise.all(requested.map(async ([kind, url]) => {
      try { await add(kind, url); }
      catch { if (!cancelled) { failed.add(kind); if (kind === 'satellite') current.current.onSatelliteReady(false); } }
    })).then(() => { if (!cancelled) report(); });
    return () => { cancelled = true; props.onSatelliteReady(false); if (!scene.isDestroyed()) { added.forEach((layer) => scene.imageryLayers.remove(layer, true)); scene.scene.requestRender(); } };
  }, [scene, props.satellite, props.labels, props.onImageryStatus, props.onSatelliteReady]);

  useEffect(() => {
    if (!scene || scene.isDestroyed()) return;
    const entities: Entity[] = [];
    const addPoint = (lat: number, lon: number, color: Color, text?: string) => entities.push(scene.entities.add({
      position: Cartesian3.fromDegrees(lon, lat, 25), point: { pixelSize: 10, color, outlineColor: Color.BLACK, outlineWidth: 2 },
      label: text ? { text, font: '14px sans-serif', fillColor: Color.WHITE, showBackground: true, pixelOffset: new Cartesian2(0, -22) } : undefined,
    }));
    props.measurement.forEach((point, i) => addPoint(point.lat, point.lon, Color.YELLOW, i === 0 ? 'A' : 'B'));
    if (props.path.length > 1) entities.push(scene.entities.add({ polyline: {
      positions: props.path.map((point) => Cartesian3.fromDegrees(point.lon, point.lat, 100)), width: 3, material: Color.YELLOW, arcType: ArcType.GEODESIC,
    } }));
    scene.scene.requestRender();
    return () => { if (!scene.isDestroyed()) { entities.forEach((entity) => scene.entities.remove(entity)); scene.scene.requestRender(); } };
  }, [scene, props.measurement, props.path]);
  return <><div ref={container} className="earth-renderer" data-testid="cesium-renderer" />{scene && <WeatherOverlay viewer={scene} />}</>;
});
CesiumEarth.displayName = 'CesiumEarth';
export default CesiumEarth;
