"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3 } from "three";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

interface EndingSceneProps {
  type: "clear" | "gameover";
  onComplete: () => void;
}

const SCENE_DURATION = 3500;
const WALK_DURATION = 2500;

// Camera setup
function SceneCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0.8, 0);
  }, [camera]);
  return null;
}

// Walking character
function WalkingCharacter({
  modelPath,
  startX,
  endX,
  scale,
  fadeOut,
  elapsed,
  modelRotationY,
}: {
  modelPath: string;
  startX: number;
  endX: number;
  scale: number;
  fadeOut: boolean;
  elapsed: React.MutableRefObject<number>;
  modelRotationY?: number;
}) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as Group;
    // Deep-clone materials so fade-out doesn't mutate the cached original
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material = child.material.clone();
      }
    });
    return clone;
  }, [scene]);
  const { actions, names } = useAnimations(animations, groupRef);

  // Play walk animation
  useEffect(() => {
    if (names.length === 0) return;
    const walkNames = ["walk", "Walk", "walking", "Walking", "run", "Run"];
    let walkAnimName = names.find((name) => walkNames.includes(name));
    if (!walkAnimName) walkAnimName = names[0];
    if (walkAnimName) {
      const action = actions[walkAnimName];
      if (action) {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
        return () => { action.stop(); };
      }
    }
  }, [actions, names]);

  useFrame(() => {
    if (!groupRef.current) return;

    const walkProgress = Math.min(elapsed.current / WALK_DURATION, 1);
    // Smooth easing
    const eased = 1 - Math.pow(1 - walkProgress, 2);
    const x = startX + (endX - startX) * eased;
    groupRef.current.position.x = x;

    // Face toward center
    // Left character (startX<0) walks right → face +X direction
    // Right character (startX>0) walks left → face -X direction
    groupRef.current.rotation.y = startX < 0 ? Math.PI / 2 : -Math.PI / 2;

    // Fade out after walk completes (gameover swordman)
    if (fadeOut && walkProgress >= 1) {
      const holdProgress = Math.min((elapsed.current - WALK_DURATION) / (SCENE_DURATION - WALK_DURATION), 1);
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (!mat.transparent) {
            mat.transparent = true;
          }
          mat.opacity = 1 - holdProgress;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[startX, 0, 0]}>
      <primitive object={clonedScene} scale={scale} rotation-y={modelRotationY ?? 0} />
    </group>
  );
}

// Shared helper: soft circular sprite texture (prevents square particles)
function createCircleTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// Cherry blossom particles (clear ending)
function CherryBlossomParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 200;
  const circleTexture = useMemo(() => createCircleTexture(), []);

  const { positions, velocities, offsets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const off = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 8 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      vel[i * 3] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = -(0.3 + Math.random() * 0.5);
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      off[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, velocities: vel, offsets: off };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const time = performance.now() / 1000;

    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3] * delta + Math.sin(time + offsets[i]) * 0.005;
      posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      // Reset if fallen below view
      if (posArray[i * 3 + 1] < -1) {
        posArray[i * 3] = (Math.random() - 0.5) * 12;
        posArray[i * 3 + 1] = Math.random() * 4 + 4;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFB7C5"
        size={0.12}
        transparent
        opacity={0.8}
        depthWrite={false}
        sizeAttenuation
        map={circleTexture}
        alphaTest={0.01}
      />
    </points>
  );
}

// Snow particles (gameover ending)
function SnowParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 100;
  const circleTexture = useMemo(() => createCircleTexture(), []);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 8 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      vel[i] = -(0.5 + Math.random() * 0.8);
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += velocities[i] * delta;
      if (posArray[i * 3 + 1] < -1) {
        posArray[i * 3] = (Math.random() - 0.5) * 12;
        posArray[i * 3 + 1] = Math.random() * 4 + 6;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.08}
        transparent
        opacity={0.6}
        depthWrite={false}
        sizeAttenuation
        map={circleTexture}
        alphaTest={0.01}
      />
    </points>
  );
}

// Inner scene content
function EndingSceneContent({ type, onComplete }: EndingSceneProps) {
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);

  useFrame((_, delta) => {
    elapsedRef.current += delta * 1000; // convert to ms
    if (elapsedRef.current >= SCENE_DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  const isClear = type === "clear";

  return (
    <>
      <SceneCamera />

      {/* Lighting — gameover was too dark (0.2/0.3 vs game 0.35/0.5); boost so characters read clearly */}
      <ambientLight intensity={isClear ? 0.8 : 0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={isClear ? 0.6 : 0.7}
        color={isClear ? "#FFF5E6" : "#AABBCC"}
      />

      {/* Ground plane — large + fog so edges fade softly (like in-game) */}
      <mesh rotation-x={-Math.PI / 2} position-y={0}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={isClear ? "#FFE0E6" : "#95a5b5"} roughness={0.85} />
      </mesh>

      {/* Left character: swordman (with Math.PI model rotation like Player.tsx) */}
      <WalkingCharacter
        modelPath="/model/swordman.glb"
        startX={-4}
        endX={-0.3}
        scale={1}
        fadeOut={!isClear}
        elapsed={elapsedRef}
        modelRotationY={Math.PI}
      />

      {/* Right character: sister (clear) or blooddemon (gameover) */}
      <WalkingCharacter
        modelPath={isClear ? "/model/sister.glb" : "/model/blooddemon.glb"}
        startX={4}
        endX={0.3}
        scale={isClear ? 1 : 1.3}
        fadeOut={false}
        elapsed={elapsedRef}
      />

      {/* Particles */}
      {isClear ? <CherryBlossomParticles /> : <SnowParticles />}
    </>
  );
}

export default function EndingScene({ type, onComplete }: EndingSceneProps) {
  const [ready, setReady] = useState(false);
  const isClear = type === "clear";

  useEffect(() => {
    // Small delay to let the canvas mount
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="absolute inset-0 z-40"
      style={{ backgroundColor: isClear ? "#FFE8EC" : "#243447" }}
    >
      {ready && (
        <Canvas
          camera={{ fov: 50, near: 0.1, far: 100 }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={[isClear ? "#FFE8EC" : "#243447"]} />
          <fog
            attach="fog"
            args={[isClear ? "#FFE8EC" : "#243447", 2, 32]}
          />
          <EndingSceneContent type={type} onComplete={onComplete} />
        </Canvas>
      )}
    </div>
  );
}
