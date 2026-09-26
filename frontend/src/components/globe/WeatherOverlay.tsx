import React, { useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/store/globeStore';
import { latLonToVector3 } from '@/utils/geo';
import { layerColor } from '@/utils/weatherMap';
import { useMapLayer } from '@/hooks/useMapLayer';
import type { WeatherLayer } from '@/types';
import { noRaycast } from './textures';

function LayerPoints({ layer, index }: { layer: WeatherLayer; index: number }) {
  const { data } = useMapLayer(layer);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const points = data?.points;
  useLayoutEffect(() => {
    if (!mesh.current || !points) return;
    const dummy = new THREE.Object3D();
    points.forEach((point, i) => {
      dummy.position.copy(latLonToVector3(point.lat, point.lon, 1.015 + index * 0.001));
      dummy.lookAt(dummy.position.clone().multiplyScalar(2));
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
      mesh.current!.setColorAt(i, layerColor(layer.id, point.value));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    invalidate();
  }, [points, layer.id, index, invalidate]);
  if (!points?.length) return null;
  return <instancedMesh ref={mesh} args={[undefined, undefined, points.length]} name={`weather-${layer.id}`}
    raycast={noRaycast} renderOrder={2 + index / 10}>
    <circleGeometry args={[0.025, 12]} />
    <meshBasicMaterial transparent opacity={layer.opacity} depthWrite={false} toneMapped={false} />
  </instancedMesh>;
}

const WeatherOverlay: React.FC = () => {
  const layers = useGlobeStore((state) => state.activeLayers);
  return <group name="weather-overlays">{layers.filter((layer) => layer.active).map((layer, index) =>
    <LayerPoints key={layer.id} layer={layer} index={index} />)}</group>;
};
export default React.memo(WeatherOverlay);
