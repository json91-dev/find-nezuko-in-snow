"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SnowstormProps {
  count?: number;
  playerPosition: THREE.Vector3;
}

// Main blizzard layer
function BlizzardLayer({
  count,
  playerPosition,
}: {
  count: number;
  playerPosition: THREE.Vector3;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const [particles] = useState(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = Math.random() * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;

      velocities[i3] = (Math.random() - 0.5) * 2;
      velocities[i3 + 1] = -3 - Math.random() * 2;
      velocities[i3 + 2] = (Math.random() - 0.5) * 2;
    }

    return { positions, velocities };
  });

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += particles.velocities[i3] * delta;
      positions[i3 + 1] += particles.velocities[i3 + 1] * delta;
      positions[i3 + 2] += particles.velocities[i3 + 2] * delta;

      const distX = positions[i3] - playerPosition.x;
      const distZ = positions[i3 + 2] - playerPosition.z;
      const horizontalDist = Math.sqrt(distX * distX + distZ * distZ);

      if (positions[i3 + 1] < 0 || horizontalDist > 30) {
        positions[i3] = playerPosition.x + (Math.random() - 0.5) * 50;
        positions[i3 + 1] = 20 + Math.random() * 10;
        positions[i3 + 2] = playerPosition.z + (Math.random() - 0.5) * 50;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#ffffff"
        size={0.15}
        sizeAttenuation
        depthWrite={false}
        opacity={0.85}
      />
    </points>
  );
}

// Slow gentle snow layer
function GentleSnowLayer({
  count,
  playerPosition,
}: {
  count: number;
  playerPosition: THREE.Vector3;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const [particles] = useState(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count); // for sine sway

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 60;
      positions[i3 + 1] = Math.random() * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 60;

      velocities[i3] = (Math.random() - 0.5) * 0.3;
      velocities[i3 + 1] = -0.5 - Math.random() * 1.0; // slow fall
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;

      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, velocities, phases };
  });

  useFrame(({ clock }, delta) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Gentle sine wave sway
      const sway = Math.sin(time * 0.5 + particles.phases[i]) * 0.3;

      positions[i3] += (particles.velocities[i3] + sway * delta) * delta * 2;
      positions[i3 + 1] += particles.velocities[i3 + 1] * delta;
      positions[i3 + 2] += particles.velocities[i3 + 2] * delta;

      const distX = positions[i3] - playerPosition.x;
      const distZ = positions[i3 + 2] - playerPosition.z;
      const horizontalDist = Math.sqrt(distX * distX + distZ * distZ);

      if (positions[i3 + 1] < 0 || horizontalDist > 35) {
        positions[i3] = playerPosition.x + (Math.random() - 0.5) * 60;
        positions[i3 + 1] = 25 + Math.random() * 10;
        positions[i3 + 2] = playerPosition.z + (Math.random() - 0.5) * 60;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#e8f0ff"
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </points>
  );
}

// Near-camera snow layer for "inside the blizzard" feel
function NearCameraSnowLayer({
  count,
  playerPosition,
}: {
  count: number;
  playerPosition: THREE.Vector3;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const [particles] = useState(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = Math.random() * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;

      velocities[i3] = (Math.random() - 0.5) * 4; // strong horizontal wind
      velocities[i3 + 1] = -4 - Math.random() * 3; // fast fall (-4 to -7)
      velocities[i3 + 2] = (Math.random() - 0.5) * 4;
    }

    return { positions, velocities };
  });

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += particles.velocities[i3] * delta;
      positions[i3 + 1] += particles.velocities[i3 + 1] * delta;
      positions[i3 + 2] += particles.velocities[i3 + 2] * delta;

      const distX = positions[i3] - playerPosition.x;
      const distZ = positions[i3 + 2] - playerPosition.z;
      const horizontalDist = Math.sqrt(distX * distX + distZ * distZ);

      if (positions[i3 + 1] < 0 || horizontalDist > 5) {
        positions[i3] = playerPosition.x + (Math.random() - 0.5) * 10;
        positions[i3 + 1] = playerPosition.y + 5 + Math.random() * 5;
        positions[i3 + 2] = playerPosition.z + (Math.random() - 0.5) * 10;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#ffffff"
        size={0.3}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
      />
    </points>
  );
}

export default function Snowstorm({
  count = 8000,
  playerPosition,
}: SnowstormProps) {
  return (
    <>
      <BlizzardLayer count={count} playerPosition={playerPosition} />
      <GentleSnowLayer count={Math.floor(count * 0.4)} playerPosition={playerPosition} />
      <NearCameraSnowLayer count={400} playerPosition={playerPosition} />
    </>
  );
}
