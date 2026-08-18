import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ACESFilmicToneMapping } from 'three';
import Earth from './Earth';
import Atmosphere from './Atmosphere';
import CloudLayer from './CloudLayer';
import Stars from './Stars';
import Lighting from './Lighting';
import GlobeControls from './GlobeControls';
import WeatherOverlay from './WeatherOverlay';
import LocationMarker from './LocationMarker';
import { useGlobeStore } from '@/store/globeStore';

interface GlobeProps {
  onLocationSelect?: (lat: number, lon: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

const Globe: React.FC<GlobeProps> = ({ onLocationSelect: _onLocationSelect, className, style }) => {
  const controlsRef = useRef<any>(null);
  const isRotating = useGlobeStore((state: any) => state.isRotating);

  const handlePointerDown = (e: any) => {
    if (e.object.name === 'earth') {
      const { point: _point } = e;
    }
  };

  return (
    <div className={className} style={{ width: '100%', height: '100%', background: '#020617', ...style }}>
      <Canvas
        camera={{ fov: 45, near: 0.01, far: 1000, position: [0, 0, 3.5] }}
        gl={{
          antialias: true,
          alpha: true,
          logarithmicDepthBuffer: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        frameloop={isRotating ? 'always' : 'demand'}
      >
        <Suspense fallback={null}>
          <Lighting />
          <Stars />
          <group onPointerDown={handlePointerDown}>
            <Earth />
            <Atmosphere />
            <CloudLayer />
            <WeatherOverlay />
            <LocationMarker />
          </group>
          <GlobeControls ref={controlsRef} />
          <EffectComposer>
            <Bloom intensity={0.45} luminanceThreshold={0.85} luminanceSmoothing={0.7} mipmapBlur />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Globe;
