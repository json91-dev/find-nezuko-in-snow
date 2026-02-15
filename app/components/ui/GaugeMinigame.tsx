"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface GaugeMinigameProps {
  onSuccess: () => void;
  onFail: () => void;
}

const SUCCESS_ZONE_MIN = 0.4;
const SUCCESS_ZONE_MAX = 0.6;
const CYCLE_SPEED = 1.2; // seconds per full cycle

export default function GaugeMinigame({ onSuccess, onFail }: GaugeMinigameProps) {
  const [position, setPosition] = useState(0); // 0~1
  const [strikeResult, setStrikeResult] = useState<"success" | "fail" | null>(null);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number>(0);
  const resolvedRef = useRef(false);

  // Animate the arrow position using sine wave
  useEffect(() => {
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const t = (Math.sin((elapsed / CYCLE_SPEED) * Math.PI * 2) + 1) / 2; // 0~1
      setPosition(t);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleStrike = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    cancelAnimationFrame(rafRef.current);

    const isSuccess = position >= SUCCESS_ZONE_MIN && position <= SUCCESS_ZONE_MAX;
    setStrikeResult(isSuccess ? "success" : "fail");

    // Delay callback to show slash animation
    setTimeout(() => {
      if (isSuccess) onSuccess();
      else onFail();
    }, 500);
  }, [position, onSuccess, onFail]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleStrike();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStrike]);

  // Touch input
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleStrike();
    };
    // Use a dedicated overlay element — captured via the component's own div
    const el = document.getElementById("gauge-minigame-overlay");
    if (el) {
      el.addEventListener("touchstart", handleTouch, { passive: false });
      return () => el.removeEventListener("touchstart", handleTouch);
    }
  }, [handleStrike]);

  const arrowLeftPercent = position * 100;

  return (
    <div
      id="gauge-minigame-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={handleStrike}
    >
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-white/20 bg-gray-900/95 p-6 text-center shadow-2xl">
        {/* Title */}
        <h2 className="mb-2 text-2xl font-bold text-red-400">
          검을 휘둘러라!
        </h2>

        {/* Sword icon */}
        <div className="mb-4 text-3xl">⚔</div>

        {/* Gauge bar */}
        <div className="relative mx-auto mb-4 h-8 w-full overflow-hidden rounded-full bg-gray-700">
          {/* Success zone (red/orange for weak point feel) */}
          <div
            className="absolute top-0 h-full bg-red-500/40"
            style={{
              left: `${SUCCESS_ZONE_MIN * 100}%`,
              width: `${(SUCCESS_ZONE_MAX - SUCCESS_ZONE_MIN) * 100}%`,
            }}
          />
          {/* Success zone border lines */}
          <div
            className="absolute top-0 h-full w-0.5 bg-orange-400"
            style={{ left: `${SUCCESS_ZONE_MIN * 100}%` }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-orange-400"
            style={{ left: `${SUCCESS_ZONE_MAX * 100}%` }}
          />
          {/* Moving indicator — sword icon */}
          <div
            className="absolute top-0 flex h-full w-6 items-center justify-center text-lg"
            style={{
              left: `${arrowLeftPercent}%`,
              transform: "translateX(-50%)",
            }}
          >
            🗡
          </div>
        </div>

        {/* Arrow indicator below gauge */}
        <div className="relative mx-auto mb-6 h-4 w-full">
          <div
            className="absolute text-red-400 text-lg leading-none"
            style={{
              left: `${arrowLeftPercent}%`,
              transform: "translateX(-50%)",
            }}
          >
            ▲
          </div>
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-300">
          SPACE / 탭으로 베기!
        </p>

        {/* Slash effect overlay */}
        {strikeResult && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center rounded-xl overflow-hidden">
            <svg className="w-full h-full absolute" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                x1="20" y1="80" x2="80" y2="20"
                stroke={strikeResult === "success" ? "#ff4444" : "#888"}
                strokeWidth="3"
                strokeLinecap="round"
                className="animate-slash"
              />
            </svg>
            <span
              className="text-3xl font-bold z-10 drop-shadow-lg"
              style={{ color: strikeResult === "success" ? "#ff4444" : "#888" }}
            >
              {strikeResult === "success" ? "참!" : "빗나감..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
