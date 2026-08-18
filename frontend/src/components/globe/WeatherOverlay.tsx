import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGlobeStore } from '@/store/globeStore';
import { latLonToVector3 } from '@/utils/geo';

const WeatherOverlay: React.FC = () => {
  const activeLayers = useGlobeStore((state: any) => state.activeLayers);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { positions, colors, count } = useMemo(() => {
    const pts = [];
    const cls = [];
    
    // Generate grid
    for (let lat = -80; lat <= 80; lat += 5) {
      for (let lon = -180; lon < 180; lon += 5) {
        const pos = latLonToVector3(lat, lon, 1.005);
        pts.push(pos);
        
        // Mock temperature data
        const temp = 30 * Math.cos(lat * Math.PI / 180) + (Math.random() * 10 - 5);
        let color = new THREE.Color();
        if (temp > 20) color.setHex(0xff0000); // Red
        else if (temp > 10) color.setHex(0x00ff00); // Green
        else color.setHex(0x0000ff); // Blue
        
        cls.push(color);
      }
    }
    return { positions: pts, colors: cls, count: pts.length };
  }, []);

  useMemo(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        dummy.position.copy(positions[i]);
        dummy.lookAt(new THREE.Vector3(0, 0, 0));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, colors[i]);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count, positions, colors]);

  if (!activeLayers || activeLayers.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.02, 0.02]} />
      <meshBasicMaterial transparent opacity={0.5} depthWrite={false} vertexColors />
    </instancedMesh>
  );
};

export default React.memo(WeatherOverlay);
