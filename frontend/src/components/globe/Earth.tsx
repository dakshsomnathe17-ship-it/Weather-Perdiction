import React, { useMemo } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import { SUN_DIRECTION, useEarthTexture, type TextureReporter } from './textures';
import earthVert from './shaders/earth.vert?raw';
import earthFrag from './shaders/earth.frag?raw';

type EarthProps = Pick<ThreeElements['mesh'], 'onClick' | 'onDoubleClick' | 'onPointerMove' | 'onPointerOut'> & {
  onTextureStatus?: TextureReporter;
};

const Earth: React.FC<EarthProps> = ({ onTextureStatus, ...events }) => {
  const day = useEarthTexture('earth_day', true, onTextureStatus);
  const night = useEarthTexture('earth_night', true, onTextureStatus);
  const water = useEarthTexture('earth_water', false, onTextureStatus);
  const uniforms = useMemo(() => ({
    uDayTexture: { value: day },
    uNightTexture: { value: night },
    uSpecularMap: { value: water },
    uSunDirection: { value: SUN_DIRECTION },
  }), [day, night, water]);
  return (
    <mesh name="earth" {...events}>
      <sphereGeometry args={[1, 96, 64]} />
      <shaderMaterial vertexShader={earthVert} fragmentShader={earthFrag} uniforms={uniforms} />
    </mesh>
  );
};
export default React.memo(Earth);
