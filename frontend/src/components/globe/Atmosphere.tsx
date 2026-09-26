import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGlobeStore } from '@/store/globeStore';
import atmosphereVert from './shaders/atmosphere.vert?raw';
import atmosphereFrag from './shaders/atmosphere.frag?raw';
import { SUN_DIRECTION, noRaycast } from './textures';

const Atmosphere: React.FC = () => {
  const showAtmosphere = useGlobeStore((state) => state.showAtmosphere);

  const uniforms = useMemo(() => ({
    uSunDirection: { value: SUN_DIRECTION },
  }), []);

  if (!showAtmosphere) return null;

  return (
    <mesh name="atmosphere" raycast={noRaycast} renderOrder={3}>
      <sphereGeometry args={[1.035, 64, 48]} />
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
