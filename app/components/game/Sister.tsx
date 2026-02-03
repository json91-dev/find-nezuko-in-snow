"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3, AnimationAction } from "three";
import * as THREE from "three";
import usePositionalAudio from "@/app/hooks/usePositionalAudio";

interface SisterProps {
  position: Vector3;
  playerPosition: Vector3;
  onPositionUpdate?: (position: Vector3) => void;
}

const MOVE_SPEED = 2.5;
const DIRECTION_CHANGE_INTERVAL = 4000;
const MAP_BOUNDARY = 80;

export default function Sister({ position, playerPosition, onPositionUpdate }: SisterProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/model/sister.glb");
  const { actions, names } = useAnimations(animations, groupRef);

  const currentPositionRef = useRef(position.clone());
  const moveDirection = useRef(new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
  const currentAction = useRef<AnimationAction | null>(null);
  const lastDirectionChange = useRef(Date.now());

  // Use state for audio position so the hook gets updated values
  const [audioPosition, setAudioPosition] = useState(() => position.clone());

  usePositionalAudio({
    audioSources: [
      "/audio/sister-sound-1.mp3",
      "/audio/sister-sound-2.mp3",
      "/audio/sister-sound-3.mp3",
    ],
    sourcePosition: audioPosition,
    listenerPosition: playerPosition,
    maxDistance: 50,
    refDistance: 5,
  });

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
        currentAction.current = action;
      }
    }

    return () => {
      if (currentAction.current) {
        currentAction.current.stop();
      }
    };
  }, [actions, names]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const now = Date.now();

    if (now - lastDirectionChange.current > DIRECTION_CHANGE_INTERVAL) {
      moveDirection.current = new Vector3(
        Math.random() - 0.5,
        0,
        Math.random() - 0.5
      ).normalize();
      lastDirectionChange.current = now;
    }

    const movement = moveDirection.current.clone().multiplyScalar(MOVE_SPEED * delta);
    currentPositionRef.current.add(movement);

    const distFromOrigin = currentPositionRef.current.length();
    if (distFromOrigin > MAP_BOUNDARY) {
      moveDirection.current = currentPositionRef.current.clone().negate().normalize();
      lastDirectionChange.current = now;
    }

    groupRef.current.position.copy(currentPositionRef.current);

    if (moveDirection.current.length() > 0) {
      const angle = Math.atan2(moveDirection.current.x, moveDirection.current.z);
      groupRef.current.rotation.y = angle;
    }

    // Update audio position for the positional audio hook
    setAudioPosition(currentPositionRef.current.clone());

    onPositionUpdate?.(currentPositionRef.current.clone());
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <primitive object={scene} scale={1} />
    </group>
  );
}

useGLTF.preload("/model/sister.glb");
