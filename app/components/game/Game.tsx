"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { Vector3 } from "three";
import Player from "./Player";
import ThirdPersonCamera from "./ThirdPersonCamera";
import Ground from "./Ground";
import Snowstorm from "./Snowstorm";
import Sister from "./Sister";
import ColorHint from "./ColorHint";
import GameHUD from "../ui/GameHUD";

export type GameState = "start" | "playing" | "clear";

interface GameProps {
  gameState: GameState;
  onClear: (elapsedTime: number) => void;
}

export default function Game({ gameState, onClear }: GameProps) {
  const [playerPosition, setPlayerPosition] = useState<Vector3>(
    () => new Vector3(0, 0, 0)
  );
  const [playerRotation, setPlayerRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [distanceToSister, setDistanceToSister] = useState(50);
  const startTimeRef = useRef<number | null>(null);

  // Sister initial position - random spawn 30-50m away
  const [sisterInitialPosition] = useState<Vector3>(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 20; // 30-50m
    return new Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
  });

  // Track sister's current position
  const [sisterCurrentPosition, setSisterCurrentPosition] = useState<Vector3>(
    () => sisterInitialPosition.clone()
  );

  const handleSisterPositionUpdate = useCallback((position: Vector3) => {
    setSisterCurrentPosition(position);
  }, []);

  useEffect(() => {
    if (gameState === "playing" && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, [gameState]);

  const handlePositionUpdate = useCallback(
    (position: Vector3, rotation: number, moving: boolean) => {
      setPlayerPosition(position);
      setPlayerRotation(rotation);
      setIsMoving(moving);

      // Calculate distance to sister
      const distance = position.distanceTo(sisterCurrentPosition);
      setDistanceToSister(distance);

      // Check clear condition - distance <= 3m
      if (distance <= 3 && gameState === "playing" && startTimeRef.current) {
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        onClear(elapsedTime);
      }
    },
    [sisterCurrentPosition, gameState, onClear]
  );

  if (gameState === "start") {
    return null;
  }

  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#e8e8e8"]} />
        <fog attach="fog" args={["#e8e8e8", 2, 15]} />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        <Suspense fallback={null}>
          <Player
            onPositionUpdate={handlePositionUpdate}
            isPlaying={gameState === "playing"}
          />
          <ThirdPersonCamera
            playerPosition={playerPosition}
            playerRotation={playerRotation}
          />
          <Sister
            position={sisterInitialPosition}
            playerPosition={playerPosition}
            onPositionUpdate={handleSisterPositionUpdate}
          />
          <Ground />
          <Snowstorm playerPosition={playerPosition} />
        </Suspense>
      </Canvas>
      <ColorHint distance={distanceToSister} maxDistance={50} />
      <GameHUD isPlaying={gameState === "playing"} />
    </>
  );
}
