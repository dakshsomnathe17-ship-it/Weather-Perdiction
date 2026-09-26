import { MathUtils, Quaternion, Vector3 } from 'three';

export const MIN_DISTANCE = 1.35;
export const MAX_DISTANCE = 12;

export function fitGlobeDistance(aspect: number, fov = 45): number {
  const vertical = MathUtils.degToRad(fov / 2);
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(aspect, 0.1));
  return MathUtils.clamp(1.2 / Math.sin(Math.min(vertical, horizontal)), 3, MAX_DISTANCE);
}

// Follow an arc around the origin, never a chord through the planet (including antipodes).
export function interpolateOrbit(from: Vector3, to: Vector3, progress: number): Vector3 {
  const t = MathUtils.clamp(progress, 0, 1);
  const rotation = new Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
  const partial = new Quaternion().slerp(rotation, t);
  return from.clone().normalize().applyQuaternion(partial)
    .multiplyScalar(MathUtils.lerp(from.length(), to.length(), t));
}

/** Track maximum travel, not only the final down/up distance; reject pinch-to-click too. */
export class GlobeGesture {
  private pointers = new Set<number>();
  private start = { x: 0, y: 0 };
  blocked = false;
  down(id: number, x: number, y: number) {
    if (this.pointers.size === 0) { this.start = { x, y }; this.blocked = false; }
    this.pointers.add(id);
    if (this.pointers.size > 1) this.blocked = true;
  }
  move(id: number, x: number, y: number) {
    if (this.pointers.has(id) && Math.hypot(x - this.start.x, y - this.start.y) > 6) this.blocked = true;
  }
  up(id: number) { this.pointers.delete(id); }
  cancel(id: number) { this.blocked = true; this.up(id); }
}
