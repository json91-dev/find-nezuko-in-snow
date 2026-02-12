"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3, AnimationAction } from "three";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

interface BloodDemonProps {
  initialPosition: Vector3;
  onPositionUpdate: (id: number, position: Vector3) => void;
  id: number;
  playerPosition: Vector3;
}

const MOVE_SPEED = 1.5;
const CHASE_SPEED = 2.8;
const CHASE_DISTANCE = 15;
const DIRECTION_CHANGE_INTERVAL = 6000;
const MAP_BOUNDARY = 70;

export default function BloodDemon({ initialPosition, onPositionUpdate, id, playerPosition }: BloodDemonProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/model/blooddemon.glb");
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene) as Group, [scene]);
  const { actions, names } = useAnimations(animations, groupRef);

  const currentPosition = useRef(initialPosition.clone());
  const moveDirection = useRef<Vector3>(new Vector3(1, 0, 0));
  const currentAction = useRef<AnimationAction | null>(null);
  const lastDirectionChange = useRef(0);
  const [animOffset] = useState(() => Math.random() * 5);

  useEffect(() => {
    moveDirection.current = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    lastDirectionChange.current = Date.now();
  }, []);

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

  // Randomize animation offset after setup (via ref to avoid hook immutability lint)
  useEffect(() => {
    if (currentAction.current) {
      currentAction.current.time = animOffset;
    }
  }, [animOffset]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const now = Date.now();
    const distToPlayer = currentPosition.current.distanceTo(playerPosition);
    const chasing = distToPlayer <= CHASE_DISTANCE;

    if (chasing) {
      // Chase mode: lerp direction toward player
      const toPlayer = playerPosition.clone().sub(currentPosition.current).setY(0).normalize();
      moveDirection.current.lerp(toPlayer, 0.05);
      moveDirection.current.normalize();
    } else {
      // Wander mode: random direction changes
      if (now - lastDirectionChange.current > DIRECTION_CHANGE_INTERVAL) {
        moveDirection.current = new Vector3(
          Math.random() - 0.5,
          0,
          Math.random() - 0.5
        ).normalize();
        lastDirectionChange.current = now;
      }
    }

    const speed = chasing ? CHASE_SPEED : MOVE_SPEED;
    const movement = moveDirection.current.clone().multiplyScalar(speed * delta);
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
      <primitive object={clonedScene} scale={1.3} />
    </group>
  );
}

useGLTF.preload("/model/blooddemon.glb");
