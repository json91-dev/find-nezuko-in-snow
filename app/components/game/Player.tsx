"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3, AnimationAction } from "three";
import * as THREE from "three";

interface PlayerProps {
  onPositionUpdate: (position: Vector3, rotation: number, isMoving: boolean) => void;
  isPlaying: boolean;
}

const MOVE_SPEED = 5;

export default function Player({ onPositionUpdate, isPlaying }: PlayerProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/model/swordman.glb");
  const { actions, names } = useAnimations(animations, groupRef);

  const keysPressed = useRef<Set<string>>(new Set());
  const mouseMovement = useRef({ x: 0 });
  const isMouseDown = useRef(false);
  const rotation = useRef(0);
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
      keysPressed.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
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
        // Snap rotation toward click point
        const screenCenterX = window.innerWidth / 2;
        const offsetX = e.clientX - screenCenterX;
        const normalizedOffset = offsetX / screenCenterX; // -1 to 1
        const snapAngle = normalizedOffset * (Math.PI / 3); // max 60°
        rotation.current -= snapAngle;
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
      lastTouchX = e.touches[0].clientX;
      // Snap rotation toward touch point
      const screenCenterX = window.innerWidth / 2;
      const offsetX = e.touches[0].clientX - screenCenterX;
      const normalizedOffset = offsetX / screenCenterX;
      const snapAngle = normalizedOffset * (Math.PI / 3);
      rotation.current -= snapAngle;
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

    // Apply mouse rotation (only when mouse is held, 1.5x sensitivity)
    rotation.current -= mouseMovement.current.x * 0.0045;
    mouseMovement.current.x = 0;

    // Calculate movement direction
    const forward = new Vector3(0, 0, 0);
    const keys = keysPressed.current;

    if (keys.has("w") || keys.has("arrowup")) forward.z -= 1;
    if (keys.has("s") || keys.has("arrowdown")) forward.z += 1;
    if (keys.has("a") || keys.has("arrowleft")) forward.x -= 1;
    if (keys.has("d") || keys.has("arrowright")) forward.x += 1;

    // Mouse hold = move forward
    if (isMouseDown.current) forward.z -= 1;

    const moving = forward.length() > 0;

    if (moving) {
      forward.normalize();
      forward.applyAxisAngle(new Vector3(0, 1, 0), rotation.current);
      position.current.add(forward.multiplyScalar(MOVE_SPEED * delta));
    }

    // Update group transform
    groupRef.current.position.copy(position.current);
    groupRef.current.rotation.y = rotation.current;

    onPositionUpdate(position.current.clone(), rotation.current, moving);
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1} rotation-y={Math.PI} />
    </group>
  );
}

useGLTF.preload("/model/swordman.glb");
