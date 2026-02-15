"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3, AnimationAction } from "three";
import * as THREE from "three";

interface PlayerProps {
  onPositionUpdate: (position: Vector3, cameraRotation: number, playerFacing: number, isMoving: boolean) => void;
  isPlaying: boolean;
}

const MOVE_SPEED = 5;

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export default function Player({ onPositionUpdate, isPlaying }: PlayerProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/model/swordman.glb");
  const { actions, names } = useAnimations(animations, groupRef);

  const keysPressed = useRef<Set<string>>(new Set());
  const mouseMovement = useRef({ x: 0 });
  const isMouseDown = useRef(false);
  const isTouchInput = useRef(false);
  const cameraRotation = useRef(0);
  const playerFacing = useRef(0);
  const position = useRef(new Vector3(0, 0, 0));
  const currentAction = useRef<AnimationAction | null>(null);

  const getWalkAnimation = useCallback(() => {
    const walkNames = ["walk", "Walk", "walking", "Walking", "run", "Run"];
    for (const name of walkNames) {
      if (names.includes(name)) return name;
    }
    return names.length > 0 ? names[0] : null;
  }, [names]);

  // Keyboard controls
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying]);

  // Mouse controls: hold to move forward, drag to rotate
  useEffect(() => {
    if (!isPlaying) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = true;
        isTouchInput.current = false;
        // Snap playerFacing toward click point (relative to camera)
        const screenCenterX = window.innerWidth / 2;
        const offsetX = e.clientX - screenCenterX;
        const normalizedOffset = offsetX / screenCenterX; // -1 to 1
        const snapAngle = normalizedOffset * (Math.PI / 3); // max 60°
        playerFacing.current = cameraRotation.current - snapAngle;
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = false;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDown.current) {
        mouseMovement.current.x += e.movementX;
      }
    };
    // Prevent context menu on right-click during gameplay
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("contextmenu", handleContextMenu);
      isMouseDown.current = false;
    };
  }, [isPlaying]);

  // Touch controls: tap to move forward, swipe to rotate
  useEffect(() => {
    if (!isPlaying) return;

    let lastTouchX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isMouseDown.current = true;
      isTouchInput.current = true;
      lastTouchX = e.touches[0].clientX;
      // 스냅 제거: 터치 시작 시 방향 변경 없음, 스와이프로만 방향 전환
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isMouseDown.current || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - lastTouchX;
      mouseMovement.current.x += deltaX;
      lastTouchX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        isMouseDown.current = false;
      }
    };

    const opts: AddEventListenerOptions = { passive: false };
    document.addEventListener("touchstart", handleTouchStart, opts);
    document.addEventListener("touchmove", handleTouchMove, opts);
    document.addEventListener("touchend", handleTouchEnd, opts);
    document.addEventListener("touchcancel", handleTouchEnd, opts);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
      isMouseDown.current = false;
    };
  }, [isPlaying]);

  // Always play animation
  useEffect(() => {
    const walkAnimName = getWalkAnimation();
    if (!walkAnimName || !actions[walkAnimName]) return;

    const action = actions[walkAnimName];
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().play();
    currentAction.current = action;

    return () => {
      if (currentAction.current) {
        currentAction.current.stop();
      }
    };
  }, [actions, getWalkAnimation]);

  useFrame((_, delta) => {
    if (!groupRef.current || !isPlaying) return;

    // Apply mouse/touch drag rotation
    // const rotDelta = mouseMovement.current.x * 0.0045;
    const rotDelta = mouseMovement.current.x * 0.01;
    if (isTouchInput.current) {
      // 터치: 캐릭터만 회전 (감도 2배), 카메라 고정
      playerFacing.current -= rotDelta * 3;
    } else {
      // 마우스: 카메라 + 캐릭터 동시 회전 (기존 동작)
      cameraRotation.current -= rotDelta;
      if (isMouseDown.current) {
        playerFacing.current -= rotDelta;
      }
    }
    mouseMovement.current.x = 0;

    // Calculate movement direction (relative to camera)
    const forward = new Vector3(0, 0, 0);
    const keys = keysPressed.current;

    if (keys.has("KeyW") || keys.has("ArrowUp")) forward.z -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) forward.z += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) forward.x -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) forward.x += 1;

    const keyMoving = forward.length() > 0;

    // Mouse hold = move forward in playerFacing direction
    const mouseMoving = isMouseDown.current;

    if (keyMoving) {
      forward.normalize();
      // WASD moves relative to camera direction
      forward.applyAxisAngle(new Vector3(0, 1, 0), cameraRotation.current);
      position.current.add(forward.multiplyScalar(MOVE_SPEED * delta));

      // Align playerFacing to movement direction
      const targetFacing = Math.atan2(forward.x, forward.z) + Math.PI;
      playerFacing.current = lerpAngle(playerFacing.current, targetFacing, 0.15);
    } else if (mouseMoving) {
      // Move in playerFacing direction
      const moveDir = new Vector3(
        -Math.sin(playerFacing.current),
        0,
        -Math.cos(playerFacing.current)
      );
      position.current.add(moveDir.multiplyScalar(MOVE_SPEED * delta));
    }

    const moving = keyMoving || mouseMoving;

    // Update group transform
    groupRef.current.position.copy(position.current);
    groupRef.current.rotation.y = playerFacing.current;

    onPositionUpdate(position.current.clone(), cameraRotation.current, playerFacing.current, moving);
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1} rotation-y={Math.PI} />
    </group>
  );
}

useGLTF.preload("/model/swordman.glb");
