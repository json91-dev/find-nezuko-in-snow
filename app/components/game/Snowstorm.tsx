"use client";

import { memo, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SnowstormProps {
  count?: number;
  playerPosition: THREE.Vector3;
}

// GPU-based vertex shader: computes particle positions on the GPU each frame.
// No JS per-frame loops — only time + playerPosition uniforms are updated.
const vertexShader = /* glsl */ `
  uniform float time;
  uniform vec3 playerPosition;
  uniform float spread;
  uniform float height;
  uniform float size;
  uniform float swayAmount;

  attribute vec3 aSeed;      // random 0-1 seed per particle (x, y, z offset)
  attribute vec3 aVelocity;  // velocity: x/z wind, y fall speed (positive = downward)
  attribute float aPhase;    // random phase for sine sway

  void main() {
    float swayX = sin(time * 0.5 + aPhase) * swayAmount;

    // World-space drift — independent of playerPosition so particles don't "follow" the player.
    // 500.0 gives a large initial spread; the wrapping below brings them near the player.
    float worldX = aSeed.x * 500.0 + aVelocity.x * time + swayX;
    float worldZ = aSeed.z * 500.0 + aVelocity.z * time;
    float y      = mod(aSeed.y * height - aVelocity.y * time, height);

    // Wrap to the nearest alias within spread/2 of the player (invisible teleport at boundary).
    // Particle stays at its world position until it drifts > spread/2 away, then jumps to the
    // opposite side — exactly like the original JS respawn, but on the GPU.
    float posX = worldX - floor((worldX - playerPosition.x) / spread + 0.5) * spread;
    float posZ = worldZ - floor((worldZ - playerPosition.z) / spread + 0.5) * spread;

    vec4 mvPosition = modelViewMatrix * vec4(posX, y, posZ, 1.0);
    gl_PointSize = clamp(size * projectionMatrix[1][1] * 100.0 / -mvPosition.z, 1.0, 64.0);
    gl_Position  = projectionMatrix * mvPosition;
  }
`;

// Soft hazy sprite — mimics the original canvas radial gradient falloff
const fragmentShader = /* glsl */ `
  uniform float opacity;
  uniform vec3 color;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0; // 0 = center, 1 = edge
    if (d > 1.0) discard;
    // pow(1-d, 1.5): gentle curve — bright center, fades smoothly to transparent edge.
    // Matches the feel of the original canvas radial gradient (full → 0.8 → 0 across radius).
    float alpha = pow(1.0 - d, 1.5) * opacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

interface LayerConfig {
  count: number;
  spread: number;
  height: number;
  size: number;
  opacity: number;
  color: string;
  fallSpeed: [number, number];
  windSpeed: number;
  swayAmount?: number;
}

function ShaderSnowLayer({
  config,
  playerPositionRef,
}: {
  config: LayerConfig;
  playerPositionRef: React.RefObject<THREE.Vector3>;
}) {
  const {
    count,
    spread,
    height,
    size,
    opacity,
    color,
    fallSpeed,
    windSpeed,
    swayAmount = 0,
  } = config;

  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const seeds      = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      seeds[i3]     = Math.random();
      seeds[i3 + 1] = Math.random();
      seeds[i3 + 2] = Math.random();

      velocities[i3]     = (Math.random() - 0.5) * windSpeed;
      velocities[i3 + 1] = fallSpeed[0] + Math.random() * (fallSpeed[1] - fallSpeed[0]);
      velocities[i3 + 2] = (Math.random() - 0.5) * windSpeed;

      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    // Dummy position buffer — real positions computed in vertex shader
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aSeed",     new THREE.BufferAttribute(seeds,      3));
    geo.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute("aPhase",    new THREE.BufferAttribute(phases,     1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time:           { value: 0 },
        playerPosition: { value: new THREE.Vector3() },
        spread:         { value: spread },
        height:         { value: height },
        size:           { value: size },
        opacity:        { value: opacity },
        color:          { value: new THREE.Color(color) },
        swayAmount:     { value: swayAmount },
      },
      transparent: true,
      depthWrite:  false,
    });

    return { geometry: geo, material: mat };
  }, [count, spread, height, size, opacity, color, fallSpeed, windSpeed, swayAmount]);

  // Only uniform updates per frame — no JS particle loops
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.time.value = clock.elapsedTime;
    mat.uniforms.playerPosition.value.copy(playerPositionRef.current);
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}

export default memo(function Snowstorm({ count = 8000, playerPosition }: SnowstormProps) {
  const playerPositionRef = useRef(playerPosition.clone());

  // Sync playerPosition prop → ref each frame (no re-render needed)
  useFrame(() => {
    playerPositionRef.current.copy(playerPosition);
  });

  const layers: LayerConfig[] = useMemo(
    () => [
      // Main blizzard layer
      {
        count,
        spread:    50,
        height:    30,
        size:      0.15,
        opacity:   0.85,
        color:     "#ffffff",
        fallSpeed: [1, 2.5],
        windSpeed: 1,
      },
      // Gentle slow snow with sine sway
      {
        count:      Math.floor(count * 0.4),
        spread:     60,
        height:     30,
        size:       0.08,
        opacity:    0.6,
        color:      "#e8f0ff",
        fallSpeed:  [0.5, 1.5],
        windSpeed:  0.3,
        swayAmount: 1.5,
      },
      // Near-camera layer for "inside the blizzard" feel
      {
        count:     400,
        spread:    10,
        height:    10,
        size:      0.3,
        opacity:   0.5,
        color:     "#ffffff",
        fallSpeed: [1.5, 3],
        windSpeed: 2,
      },
    ],
    [count]
  );

  return (
    <>
      {layers.map((config, i) => (
        <ShaderSnowLayer key={i} config={config} playerPositionRef={playerPositionRef} />
      ))}
    </>
  );
});
