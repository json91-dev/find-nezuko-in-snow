"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import StartScreen from "./components/ui/StartScreen";
import ClearScreen from "./components/ui/ClearScreen";
import RankingScreen from "./components/ui/RankingScreen";
import GameOverScreen from "./components/ui/GameOverScreen";
import EndingScene from "./components/ui/EndingScene";
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
  const [gameKey, setGameKey] = useState(0);
  const [clearTime, setClearTime] = useState<number>(0);
  const [showRanking, setShowRanking] = useState(false);
  const [isRecordSaved, setIsRecordSaved] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | undefined>();
  const [isMuted, setIsMuted] = useState(false);

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<"clear" | "gameover" | null>(null);
  const [pendingTime, setPendingTime] = useState(0);

  const { rankings, addRecord, fetchRankings } = useRanking();

  useBGM({
    src: "/audio/bgm.MP3",
    volume: 0.3,
    enabled: gameState === "playing" && !isMuted,
  });

  // Toggle body class for touch-action prevention during gameplay
  useEffect(() => {
    document.body.classList.toggle("gaming", gameState === "playing");
    return () => document.body.classList.remove("gaming");
  }, [gameState]);

  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleStart = useCallback(() => {
    setGameState("loading");
    setLoadingProgress(0);
    setIsRecordSaved(false);
    setCurrentRecordId(undefined);
    setIsTransitioning(false);
    setTransitionType(null);
  }, []);

  const handleLoadingProgress = useCallback((progress: number) => {
    setLoadingProgress(progress);
    if (progress >= 100) {
      setGameState((prev) => (prev === "loading" ? "playing" : prev));
    }
  }, []);

  const handleClear = useCallback((elapsedTime: number) => {
    setPendingTime(elapsedTime);
    setTransitionType("clear");
    setIsTransitioning(true);
  }, []);

  const handleGameOver = useCallback((elapsedTime: number) => {
    // Play death sound effect
    try {
      const deathSound = new Audio("/audio/swordman-dead.MP3");
      deathSound.volume = 0.5;
      deathSound.play().catch(() => {});
    } catch {
      // Ignore audio errors
    }

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
    setGameKey(prev => prev + 1);
    setGameState("start");
    setClearTime(0);
    setIsRecordSaved(false);
    setCurrentRecordId(undefined);
    setShowRanking(false);
    setIsTransitioning(false);
    setTransitionType(null);
  }, []);

  const handleSaveRecord = useCallback(
    async (nickname: string) => {
      const { id } = await addRecord(nickname, clearTime);
      setIsRecordSaved(true);
      setCurrentRecordId(id || undefined);
    },
    [addRecord, clearTime]
  );

  const handleShowRanking = useCallback(async () => {
    await fetchRankings();
    setShowRanking(true);
  }, [fetchRankings]);

  const handleCloseRanking = useCallback(() => {
    setShowRanking(false);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {gameState !== "start" && (
        <div key={gameKey} style={{ display: isTransitioning ? 'none' : undefined }}>
          <Game
            gameState={gameState}
            onClear={handleClear}
            onGameOver={handleGameOver}
            onLoadingProgress={handleLoadingProgress}
            muted={isMuted}
            onToggleMute={() => setIsMuted(prev => !prev)}
          />
        </div>
      )}

      {gameState === "start" && <StartScreen onStart={handleStart} />}

      {gameState === "loading" && (
        <StartScreen
          onStart={handleStart}
          isLoading
          loadingProgress={loadingProgress}
        />
      )}

      {/* Ending scene */}
      {isTransitioning && transitionType && (
        <EndingScene
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
