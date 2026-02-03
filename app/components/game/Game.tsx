"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Vector3 } from "three";
import Player from "./Player";
import ThirdPersonCamera from "./ThirdPersonCamera";
import Ground from "./Ground";
import Snowstorm from "./Snowstorm";
import Sister from "./Sister";
import ColorHint from "./ColorHint";
import BloodDemon from "./BloodDemon";
import Footprints from "./Footprints";
import GameHUD from "../ui/GameHUD";
import Minimap from "../ui/Minimap";

export type GameState = "start" | "playing" | "clear" | "gameover";

interface GameProps {
  gameState: GameState;
  onClear: (elapsedTime: number) => void;
  onGameOver: (elapsedTime: number) => void;
}

const DEMON_COUNT = 5;
const DEMON_KILL_DISTANCE = 2;
const DEMON_DARK_DISTANCE = 15;

export default function Game({ gameState, onClear, onGameOver }: GameProps) {
  const [playerPosition, setPlayerPosition] = useState<Vector3>(
    () => new Vector3(0, 0, 0)
  );
  const [playerRotation, setPlayerRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [distanceToSister, setDistanceToSister] = useState(50);
  const [closestDemonDistance, setClosestDemonDistance] = useState(100);
  const startTimeRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);

  // Sister initial position - random spawn 30-50m away
  const [sisterInitialPosition] = useState<Vector3>(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    return new Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
  });

  const [sisterCurrentPosition, setSisterCurrentPosition] = useState<Vector3>(
    () => sisterInitialPosition.clone()
  );

  // Demon initial positions - spread evenly around the map
  const demonInitialPositions = useMemo(() => {
    const positions: Vector3[] = [];
    for (let i = 0; i < DEMON_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / DEMON_COUNT + (Math.random() - 0.5) * 0.8;
      const dist = 15 + Math.random() * 45; // 15-60m from origin
      positions.push(new Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist));
    }
    return positions;
  }, []);

  // Track demon positions
  const [demonPositions, setDemonPositions] = useState<Vector3[]>(
    () => demonInitialPositions.map((p) => p.clone())
  );

  const handleSisterPositionUpdate = useCallback((position: Vector3) => {
    setSisterCurrentPosition(position);
  }, []);

  const handleDemonPositionUpdate = useCallback((id: number, position: Vector3) => {
    setDemonPositions((prev) => {
      const next = [...prev];
      next[id] = position;
      return next;
    });
  }, []);

  useEffect(() => {
    if (gameState === "playing" && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      gameEndedRef.current = false;
    }
  }, [gameState]);

  const handlePositionUpdate = useCallback(
    (position: Vector3, rotation: number, moving: boolean) => {
      setPlayerPosition(position);
      setPlayerRotation(rotation);
      setIsMoving(moving);

      if (gameState !== "playing" || gameEndedRef.current) return;

      // Sister distance
      const sisterDist = position.distanceTo(sisterCurrentPosition);
      setDistanceToSister(sisterDist);

      // Check clear condition
      if (sisterDist <= 3 && startTimeRef.current) {
        gameEndedRef.current = true;
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        onClear(elapsedTime);
        return;
      }

      // Demon distances
      let minDemonDist = Infinity;
      for (const demonPos of demonPositions) {
        const dist = position.distanceTo(demonPos);
        if (dist < minDemonDist) minDemonDist = dist;
      }
      setClosestDemonDistance(minDemonDist);

      // Check demon kill condition
      if (minDemonDist <= DEMON_KILL_DISTANCE && startTimeRef.current) {
        gameEndedRef.current = true;
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        onGameOver(elapsedTime);
      }
    },
    [sisterCurrentPosition, demonPositions, gameState, onClear, onGameOver]
  );

  if (gameState === "start") {
    return null;
  }

  const isActive = gameState === "playing";

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
            isPlaying={isActive}
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
          {demonInitialPositions.map((pos, i) => (
            <BloodDemon
              key={i}
              id={i}
              initialPosition={pos}
              onPositionUpdate={handleDemonPositionUpdate}
            />
          ))}
          <Ground />
          <Snowstorm playerPosition={playerPosition} />
          <Footprints playerPosition={playerPosition} isMoving={isMoving} />
        </Suspense>
      </Canvas>
      <ColorHint
        distance={distanceToSister}
        maxDistance={50}
        demonDistance={closestDemonDistance}
        demonMaxDistance={DEMON_DARK_DISTANCE}
      />
      <GameHUD isPlaying={isActive} />
      {isActive && (
        <Minimap
          playerPosition={playerPosition}
          playerRotation={playerRotation}
          sisterPosition={sisterCurrentPosition}
          demonPositions={demonPositions}
        />
      )}
    </>
  );
}
