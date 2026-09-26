import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useGlobeStore } from '@/store/globeStore';
import { noRaycast, useEarthTexture, type TextureReporter } from './textures';

const CloudLayer: React.FC<{ onTextureStatus?: TextureReporter }> = ({ onTextureStatus }) => {
  const mesh = useRef<Mesh>(null);
  const showClouds = useGlobeStore((state) => state.showClouds);
  const isRotating = useGlobeStore((state) => state.isRotating);
  const texture = useEarthTexture('earth_clouds', false, onTextureStatus);
  useFrame((_, delta) => {
    if (mesh.current && isRotating) mesh.current.rotation.y += Math.min(delta, 0.05) * 0.004;
  });
  // Compile with an alpha map from the first frame; adding one to an already
  // compiled material without recompiling would produce a solid gray shell.
  if (!texture) return null;
  return (
    <mesh ref={mesh} name="clouds" visible={showClouds} raycast={noRaycast} renderOrder={1}>
      <sphereGeometry args={[1.009, 64, 48]} />
      {/* The grayscale NASA cloud JPEG supplies alpha, not opaque surface color. */}
      <meshStandardMaterial color="white" alphaMap={texture} transparent opacity={0.6}
        depthWrite={false} roughness={1} />
    </mesh>
  );
};
export default React.memo(CloudLayer);
