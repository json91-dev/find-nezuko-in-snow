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
  uniform float uIsLeft;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv - vec2(0.5);
    if (uIsLeft > 0.5) uv.x = -uv.x;

    // Toe area (upper, wider)
    vec2 toeCenter = uv - vec2(0.03, -0.12);
    float toeDist = length(toeCenter * vec2(1.6, 2.2));
    float toeShape = smoothstep(0.5, 0.32, toeDist);

    // Heel area (lower, narrower)
    vec2 heelCenter = uv - vec2(-0.02, 0.15);
    float heelDist = length(heelCenter * vec2(2.2, 2.8));
    float heelShape = smoothstep(0.5, 0.32, heelDist);

    // Arch indent (inner side)
    vec2 archCenter = uv - vec2(0.06, 0.02);
    float archDist = length(archCenter * vec2(3.5, 1.8));
    float archIndent = smoothstep(0.2, 0.45, archDist);

    float footShape = max(toeShape, heelShape);
    float alpha = footShape * archIndent * uOpacity;

    float depth = footShape * 0.08;
    vec3 color = vec3(0.72 - depth, 0.77 - depth, 0.85 - depth);
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
      const geometry = new THREE.PlaneGeometry(0.3, 0.4);
      geometry.rotateX(-Math.PI / 2);

      for (let i = 0; i < MAX_FOOTPRINTS; i++) {
        const material = new THREE.ShaderMaterial({
          vertexShader: footprintVertexShader,
          fragmentShader: footprintFragmentShader,
          uniforms: {
            uOpacity: { value: 0 },
            uIsLeft: { value: 0 },
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
        const isLeft = stepSide.current;
        const direction = playerPosition.clone().sub(lastPositionRef.current).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        const offset = perpendicular.multiplyScalar(isLeft === 0 ? 0.12 : -0.12);
        stepSide.current = isLeft === 0 ? 1 : 0;

        fp.mesh.position.set(
          playerPosition.x + offset.x,
          0.02,
          playerPosition.z + offset.z
        );
        fp.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        fp.mesh.visible = true;
        fp.createdAt = now;
        fp.active = true;
        const mat = fp.mesh.material as THREE.ShaderMaterial;
        mat.uniforms.uOpacity.value = 0.7;
        mat.uniforms.uIsLeft.value = isLeft;

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
