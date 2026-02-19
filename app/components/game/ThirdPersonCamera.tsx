"use client";

import { memo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

interface ThirdPersonCameraProps {
  playerPosition: Vector3;
  cameraRotationRef: RefObject<number>;
}

const CAMERA_OFFSET = new Vector3(0, 3, 5);
const LOOK_OFFSET = new Vector3(0, 0.8, 0);

export default memo(function ThirdPersonCamera({
  playerPosition,
  cameraRotationRef,
}: ThirdPersonCameraProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());

  useFrame(() => {
    const offset = CAMERA_OFFSET.clone();
    offset.applyAxisAngle(new Vector3(0, 1, 0), cameraRotationRef.current ?? 0);

    targetPosition.current.copy(playerPosition).add(offset);
    targetLookAt.current.copy(playerPosition).add(LOOK_OFFSET);

    camera.position.lerp(targetPosition.current, 0.1);
    camera.lookAt(targetLookAt.current);
  });

  return null;
});
