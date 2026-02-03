"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FootprintsProps {
  playerPosition: THREE.Vector3;
  isMoving: boolean;
}

const MAX_FOOTPRINTS = 50;
const FOOTPRINT_INTERVAL = 0.8; // meters between footprints
const FADE_START = 4.0; // seconds before fade starts
const FADE_DURATION = 1.0; // seconds to fully fade

const footprintVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const footprintFragmentShader = `
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // Simple elliptical footprint shape
    vec2 center = vUv - vec2(0.5);
    float dist = length(center * vec2(1.0, 1.4));
    float alpha = smoothstep(0.5, 0.3, dist) * uOpacity;

    // Slightly darker than snow
    vec3 color = vec3(0.75, 0.8, 0.88);
    gl_FragColor = vec4(color, alpha);
  }
`;

interface FootprintData {
  mesh: THREE.Mesh;
  createdAt: number;
  active: boolean;
}

export default function Footprints({ playerPosition, isMoving }: FootprintsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const footprintsRef = useRef<FootprintData[]>([]);
  const lastPositionRef = useRef(new THREE.Vector3());
  const poolInitialized = useRef(false);
  const stepSide = useRef(0); // alternating left/right

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Initialize object pool
    if (!poolInitialized.current) {
      poolInitialized.current = true;
      const geometry = new THREE.PlaneGeometry(0.25, 0.35);
      geometry.rotateX(-Math.PI / 2);

      for (let i = 0; i < MAX_FOOTPRINTS; i++) {
        const material = new THREE.ShaderMaterial({
          vertexShader: footprintVertexShader,
          fragmentShader: footprintFragmentShader,
          uniforms: {
            uOpacity: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        mesh.position.set(0, 0.01, 0);
        groupRef.current.add(mesh);
        footprintsRef.current.push({ mesh, createdAt: 0, active: false });
      }
    }

    const now = clock.elapsedTime;

    // Place new footprints
    if (isMoving) {
      const dist = lastPositionRef.current.distanceTo(playerPosition);
      if (dist >= FOOTPRINT_INTERVAL) {
        // Find an inactive footprint or the oldest one
        let fp = footprintsRef.current.find((f) => !f.active);
        if (!fp) {
          // Recycle oldest
          fp = footprintsRef.current.reduce((oldest, f) =>
            f.createdAt < oldest.createdAt ? f : oldest
          );
        }

        // Alternate left/right foot offset
        const direction = playerPosition.clone().sub(lastPositionRef.current).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        const offset = perpendicular.multiplyScalar(stepSide.current === 0 ? 0.12 : -0.12);
        stepSide.current = stepSide.current === 0 ? 1 : 0;

        fp.mesh.position.set(
          playerPosition.x + offset.x,
          0.02,
          playerPosition.z + offset.z
        );
        fp.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        fp.mesh.visible = true;
        fp.createdAt = now;
        fp.active = true;
        (fp.mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.7;

        lastPositionRef.current.copy(playerPosition);
      }
    } else if (lastPositionRef.current.distanceTo(playerPosition) > 0.1) {
      lastPositionRef.current.copy(playerPosition);
    }

    // Update opacity for fading
    for (const fp of footprintsRef.current) {
      if (!fp.active) continue;

      const age = now - fp.createdAt;
      if (age > FADE_START + FADE_DURATION) {
        fp.active = false;
        fp.mesh.visible = false;
        (fp.mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0;
      } else if (age > FADE_START) {
        const fadeProgress = (age - FADE_START) / FADE_DURATION;
        (fp.mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value =
          0.7 * (1 - fadeProgress);
      }
    }
  });

  return <group ref={groupRef} />;
}
