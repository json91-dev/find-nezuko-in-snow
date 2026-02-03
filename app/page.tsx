"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import StartScreen from "./components/ui/StartScreen";
import ClearScreen from "./components/ui/ClearScreen";
import RankingScreen from "./components/ui/RankingScreen";
import GameOverScreen from "./components/ui/GameOverScreen";
import TransitionEffect from "./components/ui/TransitionEffect";
import useBGM from "./hooks/useBGM";
import useRanking from "./hooks/useRanking";
import type { GameState } from "./components/game/Game";

const Game = dynamic(() => import("./components/game/Game"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a1628]">
      <p className="animate-pulse text-blue-300/60">로딩 중...</p>
    </div>
  ),
});

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [clearTime, setClearTime] = useState<number>(0);
  const [showRanking, setShowRanking] = useState(false);
  const [isRecordSaved, setIsRecordSaved] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | undefined>();

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<"clear" | "gameover" | null>(null);
  const [pendingTime, setPendingTime] = useState(0);

  const { rankings, addRecord } = useRanking();

  useBGM({
    src: "/audio/bgm.MP3",
    volume: 0.3,
    enabled: gameState === "playing",
  });

  const handleStart = useCallback(() => {
    setGameState("playing");
    setIsRecordSaved(false);
    setCurrentRecordId(undefined);
    setIsTransitioning(false);
    setTransitionType(null);
  }, []);

  const handleClear = useCallback((elapsedTime: number) => {
    setPendingTime(elapsedTime);
    setTransitionType("clear");
    setIsTransitioning(true);
  }, []);

  const handleGameOver = useCallback((elapsedTime: number) => {
    setPendingTime(elapsedTime);
    setTransitionType("gameover");
    setIsTransitioning(true);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    if (transitionType === "clear") {
      setClearTime(pendingTime);
      setGameState("clear");
    } else if (transitionType === "gameover") {
      setClearTime(pendingTime);
      setGameState("gameover");
    }
  }, [transitionType, pendingTime]);

  const handleRestart = useCallback(() => {
    setGameState("start");
    setClearTime(0);
    setIsRecordSaved(false);
    setCurrentRecordId(undefined);
    setShowRanking(false);
    setIsTransitioning(false);
    setTransitionType(null);
  }, []);

  const handleSaveRecord = useCallback(
    (nickname: string) => {
      addRecord(nickname, clearTime);
      setIsRecordSaved(true);
      const newRecordId = Date.now().toString();
      setCurrentRecordId(newRecordId);
    },
    [addRecord, clearTime]
  );

  const handleShowRanking = useCallback(() => {
    setShowRanking(true);
  }, []);

  const handleCloseRanking = useCallback(() => {
    setShowRanking(false);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {gameState !== "start" && (
        <Game
          gameState={gameState}
          onClear={handleClear}
          onGameOver={handleGameOver}
        />
      )}

      {gameState === "start" && <StartScreen onStart={handleStart} />}

      {/* Transition effects */}
      {isTransitioning && transitionType && (
        <TransitionEffect
          type={transitionType}
          onComplete={handleTransitionComplete}
        />
      )}

      {gameState === "clear" && !showRanking && (
        <ClearScreen
          clearTime={clearTime}
          onRestart={handleRestart}
          onSaveRecord={handleSaveRecord}
          onShowRanking={handleShowRanking}
          isRecordSaved={isRecordSaved}
        />
      )}

      {gameState === "gameover" && (
        <GameOverScreen
          elapsedTime={clearTime}
          onRestart={handleRestart}
        />
      )}

      {showRanking && (
        <RankingScreen
          rankings={rankings}
          currentRecordId={currentRecordId}
          onClose={handleCloseRanking}
        />
      )}
    </main>
  );
}
