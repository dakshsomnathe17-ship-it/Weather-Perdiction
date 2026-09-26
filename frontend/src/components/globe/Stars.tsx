import React from 'react';
import { Stars as DreiStars } from '@react-three/drei';

const Stars: React.FC = () => {
  return (
    <group>
      <DreiStars radius={80} depth={40} count={2200} factor={2} saturation={0} fade speed={0} />
    </group>
  );
};

export default React.memo(Stars);
