import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGlobeStore } from '@/store/globeStore';
import { latLonToVector3 } from '@/utils/geo';

const LocationMarker: React.FC = () => {
  const selectedPoint = useGlobeStore((state: any) => state.selectedPoint);
  
  const position = useMemo(() => {
    if (!selectedPoint) return new THREE.Vector3();
    return latLonToVector3(selectedPoint.lat, selectedPoint.lon, 1.0);
  }, [selectedPoint]);

  if (!selectedPoint) return null;

  return (
    <group position={position} lookAt={(new THREE.Vector3()).copy(position).multiplyScalar(2)}>
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.01, 0.1, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

export default React.memo(LocationMarker);
