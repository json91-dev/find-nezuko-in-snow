"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

interface ThirdPersonCameraProps {
  playerPosition: Vector3;
  playerRotation: number;
}

const CAMERA_OFFSET = new Vector3(0, 3, 5); // 뒤로 5m, 위로 3m
const LOOK_OFFSET = new Vector3(0, 1.5, 0); // 캐릭터 상체를 바라봄

export default function ThirdPersonCamera({
  playerPosition,
  playerRotation,
}: ThirdPersonCameraProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());

  useFrame(() => {
    // Calculate camera position based on player rotation
    const offset = CAMERA_OFFSET.clone();
    offset.applyAxisAngle(new Vector3(0, 1, 0), playerRotation);

    targetPosition.current.copy(playerPosition).add(offset);
    targetLookAt.current.copy(playerPosition).add(LOOK_OFFSET);

    // Smooth camera follow
    camera.position.lerp(targetPosition.current, 0.1);

    // Look at player
    const currentLookAt = new Vector3();
    camera.getWorldDirection(currentLookAt);
    camera.lookAt(targetLookAt.current);
  });

  return null;
}
