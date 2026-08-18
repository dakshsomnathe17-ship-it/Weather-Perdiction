import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGlobeStore } from '@/store/globeStore';
import { latLonToVector3 } from '@/utils/geo';

const GlobeControls = forwardRef((_props, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isRotating = useGlobeStore((state: any) => state.isRotating);
  const targetPosRef = useRef<THREE.Vector3 | null>(null);

  useImperativeHandle(ref, () => ({
    zoomToLocation: (lat: number, lon: number, altitude = 2.0) => {
      const targetPos = latLonToVector3(lat, lon, altitude);
      targetPosRef.current = targetPos;
    }
  }));

  useFrame((_state, _delta) => {
    if (targetPosRef.current && controlsRef.current) {
      camera.position.lerp(targetPosRef.current, 0.05);
      // If we are close enough, stop lerping
      if (camera.position.distanceTo(targetPosRef.current) < 0.01) {
        targetPosRef.current = null;
      }
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r') {
        targetPosRef.current = new THREE.Vector3(0, 0, 3.5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.08}
      minDistance={1.2}
      maxDistance={15}
      rotateSpeed={0.5}
      autoRotate={isRotating}
      autoRotateSpeed={0.3}
      enablePan={true}
    />
  );
});

GlobeControls.displayName = 'GlobeControls';

export default GlobeControls;
