"use client";

import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { Suspense, useState, useCallback, useRef, useEffect } from "react";
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
import GaugeMinigame from "../ui/GaugeMinigame";

export type GameState = "start" | "loading" | "playing" | "clear" | "gameover";

interface GameProps {
  gameState: GameState;
  onClear: (elapsedTime: number) => void;
  onGameOver: (elapsedTime: number) => void;
  onLoadingProgress?: (progress: number) => void;
}

const DEMON_COUNT = 1;
const DEMON_KILL_DISTANCE = 1.5;
const DEMON_DARK_DISTANCE = 15;
const SISTER_CLEAR_DISTANCE = 1.2;

// Track loading progress and report to parent
function LoadingTracker({ onProgress }: { onProgress: (progress: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);
  return null;
}

export default function Game({ gameState, onClear, onGameOver, onLoadingProgress }: GameProps) {
  const [playerPosition, setPlayerPosition] = useState<Vector3>(
    () => new Vector3(0, 0, 0)
  );
  const [cameraRotation, setCameraRotation] = useState(0);
  const [playerFacing, setPlayerFacing] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [distanceToSister, setDistanceToSister] = useState(50);
  const [closestDemonDistance, setClosestDemonDistance] = useState(100);
  const startTimeRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);
  const [miniGameActive, setMiniGameActive] = useState(false);
  const [killedDemons, setKilledDemons] = useState<Set<number>>(() => new Set());
  const miniGameDemonId = useRef<number | null>(null);

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
  const [demonInitialPositions] = useState<Vector3[]>(() => {
    const positions: Vector3[] = [];
    for (let i = 0; i < DEMON_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / DEMON_COUNT + (Math.random() - 0.5) * 0.8;
      const dist = 15 + Math.random() * 45;
      positions.push(new Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist));
    }
    return positions;
  });

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
    (position: Vector3, camRotation: number, facing: number, moving: boolean) => {
      setPlayerPosition(position);
      setCameraRotation(camRotation);
      setPlayerFacing(facing);
      setIsMoving(moving);

      if (gameState !== "playing" || gameEndedRef.current) return;

      // Sister distance
      const sisterDist = position.distanceTo(sisterCurrentPosition);
      setDistanceToSister(sisterDist);

      // Check clear condition
      if (sisterDist <= SISTER_CLEAR_DISTANCE && startTimeRef.current) {
        gameEndedRef.current = true;
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        onClear(elapsedTime);
        return;
      }

      // Demon distances (skip killed demons)
      let minDemonDist = Infinity;
      let closestDemonId = -1;
      for (let i = 0; i < demonPositions.length; i++) {
        if (killedDemons.has(i)) continue;
        const dist = position.distanceTo(demonPositions[i]);
        if (dist < minDemonDist) {
          minDemonDist = dist;
          closestDemonId = i;
        }
      }
      setClosestDemonDistance(minDemonDist);

      // Check demon collision → trigger minigame
      if (minDemonDist <= DEMON_KILL_DISTANCE && !miniGameActive && closestDemonId >= 0) {
        miniGameDemonId.current = closestDemonId;
        setMiniGameActive(true);
      }
    },
    [sisterCurrentPosition, demonPositions, gameState, onClear, onGameOver, killedDemons, miniGameActive]
  );

  const handleLoadingProgress = useCallback(
    (progress: number) => {
      onLoadingProgress?.(progress);
    },
    [onLoadingProgress]
  );

  const handleMiniGameSuccess = useCallback(() => {
    const demonId = miniGameDemonId.current;
    if (demonId !== null) {
      setKilledDemons(prev => new Set(prev).add(demonId));
    }
    setMiniGameActive(false);
    miniGameDemonId.current = null;
  }, []);

  const handleMiniGameFail = useCallback(() => {
    setMiniGameActive(false);
    miniGameDemonId.current = null;
    if (startTimeRef.current) {
      gameEndedRef.current = true;
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      onGameOver(elapsedTime);
    }
  }, [onGameOver]);

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
        <color attach="background" args={["#243447"]} />
        <fog attach="fog" args={["#243447", 3, 28]} />

        <ambientLight intensity={0.35} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        <LoadingTracker onProgress={handleLoadingProgress} />
        <Suspense fallback={null}>
          <Player
            onPositionUpdate={handlePositionUpdate}
            isPlaying={isActive && !miniGameActive}
          />
          <ThirdPersonCamera
            playerPosition={playerPosition}
            cameraRotation={cameraRotation}
          />
          <Sister
            position={sisterInitialPosition}
            playerPosition={playerPosition}
            onPositionUpdate={handleSisterPositionUpdate}
          />
          {demonInitialPositions.map((pos, i) => (
            !killedDemons.has(i) && (
              <BloodDemon
                key={i}
                id={i}
                initialPosition={pos}
                onPositionUpdate={handleDemonPositionUpdate}
                playerPosition={playerPosition}
              />
            )
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
          playerRotation={cameraRotation}
          playerFacing={playerFacing}
          sisterPosition={sisterCurrentPosition}
          demonPositions={demonPositions}
        />
      )}
      {miniGameActive && (
        <GaugeMinigame onSuccess={handleMiniGameSuccess} onFail={handleMiniGameFail} />
      )}
    </>
  );
}
