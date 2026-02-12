"use client";

import { useRef } from "react";
import { Mesh } from "three";

export default function Ground() {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial color="#95a5b5" roughness={0.85} />
    </mesh>
  );
}
