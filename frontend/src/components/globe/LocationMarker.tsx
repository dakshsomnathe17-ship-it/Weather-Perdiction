import React, { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import { useGlobeStore } from '@/store/globeStore';
import { latLonToVector3 } from '@/utils/geo';
import { noRaycast } from './textures';

const LocationMarker: React.FC = () => {
  const point = useGlobeStore((state) => state.selectedPoint);
  const { position, orientation } = useMemo(() => {
    const position = point ? latLonToVector3(point[0], point[1], 1.018) : new Vector3(0, 0, 1);
    return { position, orientation: new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, 1), position.clone().normalize(),
    ) };
  }, [point]);
  if (!point) return null;
  return (
    <group position={position} quaternion={orientation} name="location-marker">
      <mesh raycast={noRaycast}>
        <ringGeometry args={[0.018, 0.025, 32]} />
        <meshBasicMaterial color="#67e8f9" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]} raycast={noRaycast}>
        <sphereGeometry args={[0.012, 16, 12]} />
        <meshBasicMaterial color="white" toneMapped={false} />
      </mesh>
    </group>
  );
};
export default React.memo(LocationMarker);
