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
  muted?: boolean;
  onToggleMute?: () => void;
}

const DEMON_COUNT = 20;
const DEMON_KILL_DISTANCE = 1.5;
const DEMON_DARK_DISTANCE = 15;
const SISTER_CLEAR_DISTANCE = 1.2;
const SISTER_VISIBLE_DISTANCE = 12;

function LoadingTracker({ onProgress }: { onProgress: (progress: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);
  return null;
}

export default function Game({ gameState, onClear, onGameOver, onLoadingProgress, muted = false, onToggleMute }: GameProps) {
  // ── Refs: values read inside useFrame / RAF — no re-renders needed ──
  const playerPosRef = useRef(new Vector3(0, 0, 0));
  const camRotRef    = useRef(0);
  const isMovingRef  = useRef(false);

  const sisterInitialPosition = useRef((() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    return new Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
  })()).current;

  const sisterPosRef = useRef(sisterInitialPosition.clone());

  const demonInitialPositions = useRef((() => {
    const positions: Vector3[] = [];
    for (let i = 0; i < DEMON_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / DEMON_COUNT + (Math.random() - 0.5) * 0.8;
      const dist = 15 + Math.random() * 45;
      positions.push(new Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist));
    }
    return positions;
  })()).current;

  const demonPositionsRef = useRef<Vector3[]>(demonInitialPositions.map(p => p.clone()));

  // ── State: only what drives React DOM rendering ──
  const [distanceToSister, setDistanceToSister]     = useState(50);
  const [closestDemonDistance, setClosestDemonDistance] = useState(100);
  const [isMoving, setIsMoving]                     = useState(false);
  const [miniGameActive, setMiniGameActive]         = useState(false);
  const [killedDemons, setKilledDemons]             = useState<Set<number>>(() => new Set());
  const [sisterDiscovered, setSisterDiscovered]     = useState(false);

  // Throttled snapshot for Minimap (10 fps)
  const [minimapState, setMinimapState] = useState(() => ({
    playerPos:     new Vector3(),
    playerRot:     0,
    playerFacing:  0,
    demonPositions: demonInitialPositions.map(p => p.clone()),
    sisterPos:     sisterInitialPosition.clone(),
  }));

  // Throttle refs
  const prevSisterDistRef  = useRef(50);
  const prevDemonDistRef   = useRef(100);
  const lastMinimapTimeRef = useRef(0);

  const startTimeRef    = useRef<number | null>(null);
  const gameEndedRef    = useRef(false);
  const miniGameDemonId = useRef<number | null>(null);

  useEffect(() => {
    if (gameState === "playing" && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      gameEndedRef.current = false;
    }
  }, [gameState]);

  // ── Callbacks ──

  // Sister writes position to ref — no setState
  const handleSisterPositionUpdate = useCallback((position: Vector3) => {
    sisterPosRef.current.copy(position);
  }, []);

  // Demons write to ref — no setState
  const handleDemonPositionUpdate = useCallback((id: number, position: Vector3) => {
    demonPositionsRef.current[id] = position;
  }, []);

  const handlePositionUpdate = useCallback(
    (position: Vector3, camRotation: number, facing: number, moving: boolean) => {
      // Mutate refs — zero re-renders from player movement
      playerPosRef.current.copy(position);
      camRotRef.current = camRotation;

      // isMoving: only trigger re-render on actual change (start/stop)
      if (moving !== isMovingRef.current) {
        isMovingRef.current = moving;
        setIsMoving(moving);
      }

      if (gameState !== "playing" || gameEndedRef.current) return;

      // Sister distance
      const sisterDist = position.distanceTo(sisterPosRef.current);

      if (sisterDist <= SISTER_VISIBLE_DISTANCE && !sisterDiscovered) {
        setSisterDiscovered(true);
      }
      if (sisterDist <= SISTER_CLEAR_DISTANCE && startTimeRef.current) {
        gameEndedRef.current = true;
        onClear((Date.now() - startTimeRef.current) / 1000);
        return;
      }

      // Demon distances
      let minDemonDist = Infinity;
      let closestDemonId = -1;
      for (let i = 0; i < demonPositionsRef.current.length; i++) {
        if (killedDemons.has(i)) continue;
        const dist = position.distanceTo(demonPositionsRef.current[i]);
        if (dist < minDemonDist) { minDemonDist = dist; closestDemonId = i; }
      }

      if (minDemonDist <= DEMON_KILL_DISTANCE && !miniGameActive && closestDemonId >= 0) {
        miniGameDemonId.current = closestDemonId;
        setMiniGameActive(true);
      }

      // ColorHint: throttle by 0.3-unit threshold
      if (Math.abs(sisterDist - prevSisterDistRef.current) > 0.3) {
        setDistanceToSister(sisterDist);
        prevSisterDistRef.current = sisterDist;
      }
      if (minDemonDist !== Infinity && Math.abs(minDemonDist - prevDemonDistRef.current) > 0.3) {
        setClosestDemonDistance(minDemonDist);
        prevDemonDistRef.current = minDemonDist;
      }

      // Minimap: throttle to 10 fps
      const nowMs = Date.now();
      if (nowMs - lastMinimapTimeRef.current > 100) {
        lastMinimapTimeRef.current = nowMs;
        setMinimapState({
          playerPos:    position.clone(),
          playerRot:    camRotation,
          playerFacing: facing,
          demonPositions: demonPositionsRef.current
            .map((p, i) => (killedDemons.has(i) ? null : p.clone()))
            .filter((p): p is Vector3 => p !== null),
          sisterPos: sisterPosRef.current.clone(),
        });
      }
    },
    [gameState, onClear, killedDemons, miniGameActive, sisterDiscovered]
  );

  const handleLoadingProgress = useCallback(
    (progress: number) => { onLoadingProgress?.(progress); },
    [onLoadingProgress]
  );

  const handleMiniGameSuccess = useCallback(() => {
    const demonId = miniGameDemonId.current;
    if (demonId !== null) setKilledDemons(prev => new Set(prev).add(demonId));
    setMiniGameActive(false);
    miniGameDemonId.current = null;
  }, []);

  const handleMiniGameFail = useCallback(() => {
    setMiniGameActive(false);
    miniGameDemonId.current = null;
    if (startTimeRef.current) {
      gameEndedRef.current = true;
      onGameOver((Date.now() - startTimeRef.current) / 1000);
    }
  }, [onGameOver]);

  if (gameState === "start") return null;

  const isActive = gameState === "playing";

  return (
    <>
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#243447"]} />
        <fog attach="fog" args={["#243447", 3, 28]} />

        <ambientLight intensity={0.35} />
        {/* Shadows removed — expensive 2048×2048 shadow map was major GPU overhead */}
        <directionalLight position={[10, 20, 10]} intensity={0.5} />

        <LoadingTracker onProgress={handleLoadingProgress} />
        <Suspense fallback={null}>
          <Player
            onPositionUpdate={handlePositionUpdate}
            isPlaying={isActive && !miniGameActive}
          />
          {/* Pass playerPosRef.current (mutable Vector3): 3D components read via closure in
              useFrame without re-renders. cameraRotationRef passed for ThirdPersonCamera. */}
          <ThirdPersonCamera
            playerPosition={playerPosRef.current}
            cameraRotationRef={camRotRef}
          />
          <Sister
            position={sisterInitialPosition}
            playerPosition={playerPosRef.current}
            onPositionUpdate={handleSisterPositionUpdate}
            visible={distanceToSister <= SISTER_VISIBLE_DISTANCE}
            muted={muted}
          />
          {demonInitialPositions.map((pos, i) => (
            !killedDemons.has(i) && (
              <BloodDemon
                key={i}
                id={i}
                initialPosition={pos}
                onPositionUpdate={handleDemonPositionUpdate}
                playerPosition={playerPosRef.current}
              />
            )
          ))}
          <Ground />
          {gameState !== "clear" && (
            <Snowstorm playerPosition={playerPosRef.current} />
          )}
          <Footprints playerPosition={playerPosRef.current} isMoving={isMoving} />
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
          playerPosition={minimapState.playerPos}
          playerRotation={minimapState.playerRot}
          playerFacing={minimapState.playerFacing}
          sisterPosition={minimapState.sisterPos}
          demonPositions={minimapState.demonPositions}
          sisterDiscovered={sisterDiscovered}
        />
      )}
      {miniGameActive && (
        <GaugeMinigame onSuccess={handleMiniGameSuccess} onFail={handleMiniGameFail} />
      )}
      {onToggleMute && (
        <button
          onClick={onToggleMute}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            background: "none",
            border: "none",
            outline: "none",
            cursor: "pointer",
            width: 36,
            height: 36,
            padding: 0,
          }}
          aria-label={muted ? "음성 켜기" : "음성 끄기"}
        >
          {muted ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      )}
    </>
  );
}
