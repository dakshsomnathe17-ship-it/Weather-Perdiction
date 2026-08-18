import React from 'react';

const Lighting: React.FC = () => {
  return (
    <>
      <directionalLight position={[10, 5, 10]} intensity={2.0} color="#ffffff" />
      <ambientLight intensity={0.06} color="#404060" />
      <hemisphereLight args={['#1e40af', '#020617', 0.1]} />
    </>
  );
};

export default React.memo(Lighting);
