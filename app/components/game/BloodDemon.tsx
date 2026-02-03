"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3, AnimationAction } from "three";
import * as THREE from "three";

interface BloodDemonProps {
  initialPosition: Vector3;
  onPositionUpdate: (id: number, position: Vector3) => void;
  id: number;
}

const MOVE_SPEED = 1.5;
const DIRECTION_CHANGE_INTERVAL = 6000;
const MAP_BOUNDARY = 70;

export default function BloodDemon({ initialPosition, onPositionUpdate, id }: BloodDemonProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/model/blooddemon.glb");
  const clonedScene = useRef(scene.clone());
  const { actions, names } = useAnimations(animations, groupRef);

  const currentPosition = useRef(initialPosition.clone());
  const moveDirection = useRef(
    new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
  );
  const currentAction = useRef<AnimationAction | null>(null);
  const lastDirectionChange = useRef(Date.now());

  // Setup walk animation
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
    currentPosition.current.add(movement);

    const distFromOrigin = currentPosition.current.length();
    if (distFromOrigin > MAP_BOUNDARY) {
      moveDirection.current = currentPosition.current.clone().negate().normalize();
      lastDirectionChange.current = now;
    }

    groupRef.current.position.copy(currentPosition.current);

    if (moveDirection.current.length() > 0) {
      const angle = Math.atan2(moveDirection.current.x, moveDirection.current.z);
      groupRef.current.rotation.y = angle;
    }

    onPositionUpdate(id, currentPosition.current.clone());
  });

  return (
    <group ref={groupRef} position={[initialPosition.x, initialPosition.y, initialPosition.z]}>
      <primitive object={clonedScene.current} scale={1} />
    </group>
  );
}

useGLTF.preload("/model/blooddemon.glb");
