import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type TextureStatus = 'loading' | 'ready' | 'unavailable';
export type TextureReporter = (name: string, status: TextureStatus) => void;
export const SUN_DIRECTION = new THREE.Vector3(-3, 2, 5).normalize();
export const noRaycast = () => {};

// Bundled, attributed NASA imagery. Masks stay linear; color maps are sRGB.
// Each effect owns its textures, including late loads after StrictMode cleanup.
export function useEarthTexture(name: string, color: boolean, report?: TextureReporter) {
  const { gl, invalidate } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let disposed = false;
    report?.(name, 'loading');
    const fallback = new THREE.DataTexture(new Uint8Array(
      name === 'earth_day' ? [12, 28, 48, 255] : [0, 0, 0, 255]
    ), 1, 1);
    fallback.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    fallback.needsUpdate = true;
    setTexture(fallback);
    const loaded = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}textures/${name}.jpg`,
      (next) => {
        if (disposed) { next.dispose(); return; }
        next.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        next.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        next.needsUpdate = true;
        setTexture(next);
        report?.(name, 'ready');
        invalidate();
      },
      undefined,
      () => { if (!disposed) report?.(name, 'unavailable'); },
    );
    return () => { disposed = true; fallback.dispose(); loaded.dispose(); };
  }, [name, color, gl, invalidate, report]);
  return texture;
}
