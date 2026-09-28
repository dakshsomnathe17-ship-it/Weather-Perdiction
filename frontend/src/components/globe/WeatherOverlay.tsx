import { useEffect } from 'react';
import { Cartesian3, Color, PointPrimitiveCollection, type Viewer } from 'cesium';
import { useGlobeStore } from '@/store/globeStore';
import { useMapLayer } from '@/hooks/useMapLayer';
import { layerColor } from '@/utils/weatherMap';
import type { WeatherLayer } from '@/types';

function LayerPoints({ layer, viewer }: { layer: WeatherLayer; viewer: Viewer }) {
  const { data } = useMapLayer(layer);
  useEffect(() => {
    if (viewer.isDestroyed() || !data?.points.length) return;
    const collection = viewer.scene.primitives.add(new PointPrimitiveCollection());
    data.points.forEach((point) => collection.add({ position: Cartesian3.fromDegrees(point.lon, point.lat, 1000),
      pixelSize: 14, color: Color.fromCssColorString(layerColor(layer.id, point.value)).withAlpha(layer.opacity) }));
    viewer.scene.requestRender();
    return () => { if (!viewer.isDestroyed()) { viewer.scene.primitives.remove(collection); viewer.scene.requestRender(); } };
  }, [viewer, data, layer.id, layer.opacity]);
  return null;
}
export default function WeatherOverlay({ viewer }: { viewer: Viewer }) {
  const layers = useGlobeStore((s) => s.activeLayers);
  return <>{layers.filter((layer) => layer.active).map((layer) => <LayerPoints key={layer.id} layer={layer} viewer={viewer} />)}</>;
}
