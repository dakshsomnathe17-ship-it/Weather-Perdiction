import React from 'react';
import { SUN_DIRECTION } from './textures';

const Lighting: React.FC = () => {
  return (
    <>
      <directionalLight position={SUN_DIRECTION.clone().multiplyScalar(10)} intensity={2.2} color="#ffffff" />
      <ambientLight intensity={0.06} color="#404060" />
      <hemisphereLight args={['#1e40af', '#020617', 0.1]} />
    </>
  );
};

export default React.memo(Lighting);
