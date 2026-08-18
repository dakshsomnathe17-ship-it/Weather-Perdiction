import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/store/globeStore';

// Procedural realistic fractal cloud texture fallback
function generateProceduralCloudTexture(width: number, height: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Simple 2D perlin-like noise with multiple octaves
  function noise(x: number, y: number): number {
    const s1 = Math.sin(x * 0.015) * Math.cos(y * 0.015);
    const s2 = Math.sin(x * 0.035 + 1.2) * Math.cos(y * 0.035 + 0.8) * 0.5;
    const s3 = Math.sin(x * 0.07 + 2.1) * Math.cos(y * 0.07 + 3.4) * 0.25;
    const s4 = Math.sin(x * 0.15 + 4.5) * Math.cos(y * 0.15 + 1.9) * 0.125;
    return (s1 + s2 + s3 + s4) / 1.875;
  }

  for (let y = 0; y < height; y++) {
    // Latitude band modulation (more clouds near equator & mid-latitudes, less in subtropics)
    const lat = (y / height) * Math.PI - Math.PI / 2;
    const latFactor = Math.abs(Math.sin(lat * 3.0)) * 0.6 + 0.4;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const n = (noise(x, y) + 1.0) * 0.5; // [0, 1]
      const density = Math.max(0.0, (n * latFactor - 0.42) / 0.58);

      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.floor(density * 210);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const CLOUD_URLS = [
  'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_2048.png',
  'https://unpkg.com/three-globe/example/img/clouds.png',
];

const CloudLayer: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const showClouds = useGlobeStore((state: any) => state.showClouds);
  const isRotating = useGlobeStore((state: any) => state.isRotating);

  const [cloudTexture, setCloudTexture] = useState<THREE.Texture>(() =>
    generateProceduralCloudTexture(1024, 512)
  );

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let loaded = false;

    const tryLoad = (idx: number) => {
      if (idx >= CLOUD_URLS.length) return;
      loader.load(
        CLOUD_URLS[idx],
        (tex) => {
          if (!loaded) {
            loaded = true;
            tex.colorSpace = THREE.SRGBColorSpace;
            setCloudTexture(tex);
          }
        },
        undefined,
        () => {
          tryLoad(idx + 1);
        }
      );
    };

    tryLoad(0);
  }, []);

  useFrame((_state, delta) => {
    if (isRotating && meshRef.current) {
      // Differential rotation relative to the Earth surface
      meshRef.current.rotation.y += 0.019 * delta;
    }
  });

  if (!showClouds) return null;

  return (
    <mesh ref={meshRef} name="clouds">
      <sphereGeometry args={[1.006, 64, 64]} />
      <meshStandardMaterial
        map={cloudTexture}
        transparent={true}
        opacity={0.7}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
};

export default React.memo(CloudLayer);
