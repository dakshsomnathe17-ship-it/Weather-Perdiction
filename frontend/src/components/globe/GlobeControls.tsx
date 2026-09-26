import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Group, MathUtils, PerspectiveCamera, Spherical, Vector3 } from 'three';
import { useGlobeStore } from '@/store/globeStore';
import { isValidCoordinate, latLonToVector3 } from '@/utils/geo';
import { fitGlobeDistance, interpolateOrbit, MIN_DISTANCE, MAX_DISTANCE } from '@/utils/globeNavigation';

export interface GlobeControlsHandle {
  zoomToLocation: (lat: number, lon: number, distance?: number) => void;
  zoom: (factor: number) => void;
  reset: () => void;
  rotate: (azimuth: number, polar: number) => void;
}
interface Props { earthRef: RefObject<Group | null>; reducedMotion: boolean; }

const GlobeControls = forwardRef<GlobeControlsHandle, Props>(({ earthRef, reducedMotion }, ref) => {
  const { camera, size, invalidate } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const flight = useRef<{ from: Vector3; to: Vector3; elapsed: number } | null>(null);
  const fit = fitGlobeDistance(size.width / Math.max(1, size.height), (camera as PerspectiveCamera).fov);
  const begin = useCallback((position: Vector3) => {
    useGlobeStore.getState().setRotating(false);
    const orbit = controls.current;
    if (!orbit) return;
    // Flush pending damping before the flight, so old drag momentum cannot fight it.
    orbit.enableDamping = false;
    orbit.update();
    orbit.enableDamping = true;
    const spherical = new Spherical().setFromVector3(position);
    spherical.radius = MathUtils.clamp(spherical.radius, MIN_DISTANCE, MAX_DISTANCE);
    spherical.makeSafe();
    const to = new Vector3().setFromSpherical(spherical);
    if (reducedMotion) {
      camera.position.copy(to);
      orbit.update();
      flight.current = null;
    } else {
      flight.current = { from: camera.position.clone(), to, elapsed: 0 };
    }
    invalidate();
  }, [camera, invalidate, reducedMotion]);

  useImperativeHandle(ref, () => ({
    zoomToLocation(lat, lon, distance = 2.2) {
      if (!earthRef.current || !isValidCoordinate(lat, lon)) return;
      earthRef.current.updateWorldMatrix(true, false);
      const point = earthRef.current.localToWorld(latLonToVector3(lat, lon, 1));
      begin(point.normalize().multiplyScalar(distance));
    },
    zoom(factor) { begin(camera.position.clone().multiplyScalar(factor)); },
    reset() { begin(new Vector3(0, 0, fit)); },
    rotate(azimuth, polar) {
      const spherical = new Spherical().setFromVector3(camera.position);
      spherical.theta += azimuth;
      spherical.phi = MathUtils.clamp(spherical.phi + polar, 0.01, Math.PI - 0.01);
      begin(new Vector3().setFromSpherical(spherical));
    },
  }), [begin, camera, earthRef, fit]);

  // Preserve the viewing direction when resizing; return to a useful full-globe distance.
  useEffect(() => {
    flight.current = null;
    camera.position.setLength(fit);
    controls.current?.update();
    invalidate();
  }, [camera, fit, invalidate]);

  useFrame((_, delta) => {
    const current = flight.current;
    if (!current || !controls.current) return;
    current.elapsed += Math.min(delta, 0.05);
    const progress = Math.min(1, current.elapsed / 0.9);
    const eased = progress * progress * (3 - 2 * progress);
    camera.position.copy(interpolateOrbit(current.from, current.to, eased));
    controls.current.update();
    if (progress === 1) flight.current = null;
    else invalidate(); // Continue flights even with demand rendering while paused.
  });

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08}
    minDistance={MIN_DISTANCE} maxDistance={MAX_DISTANCE} rotateSpeed={0.5} zoomSpeed={0.7}
    enablePan={false} autoRotate={false}
    onStart={() => { flight.current = null; useGlobeStore.getState().setRotating(false); }} />;
});
GlobeControls.displayName = 'GlobeControls';
export default GlobeControls;
