import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGlobeStore } from '@/store/globeStore';
import atmosphereVert from './shaders/atmosphere.vert?raw';
import atmosphereFrag from './shaders/atmosphere.frag?raw';

const Atmosphere: React.FC = () => {
  const showAtmosphere = useGlobeStore((state: any) => state.showAtmosphere);

  const uniforms = useMemo(() => ({
    uSunDirection: { value: new THREE.Vector3(10, 5, 10).normalize() },
  }), []);

  if (!showAtmosphere) return null;

  return (
    <mesh name="atmosphere">
      <sphereGeometry args={[1.02, 64, 64]} />
      <shaderMaterial
        vertexShader={atmosphereVert}
        fragmentShader={atmosphereFrag}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export default React.memo(Atmosphere);
