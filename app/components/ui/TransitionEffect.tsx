"use client";

import { useEffect, useState } from "react";

interface TransitionEffectProps {
  type: "clear" | "gameover";
  onComplete: () => void;
}

const TRANSITION_DURATION = 1500; // ms

export default function TransitionEffect({ type, onComplete }: TransitionEffectProps) {
  const [phase, setPhase] = useState<"flash" | "fade">("flash");

  useEffect(() => {
    // Flash phase (first 300ms), then fade phase
    const flashTimer = setTimeout(() => setPhase("fade"), 300);
    const completeTimer = setTimeout(onComplete, TRANSITION_DURATION);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (type === "clear") {
    return (
      <div className="pointer-events-none absolute inset-0 z-40">
        {/* Warm bright flash then fade to white */}
        <div
          className="absolute inset-0 transition-all"
          style={{
            backgroundColor:
              phase === "flash"
                ? "rgba(255, 220, 150, 0.6)"
                : "rgba(255, 255, 255, 0.95)",
            transitionDuration: phase === "flash" ? "200ms" : "1200ms",
          }}
        />
        {/* Warm light particles */}
        {phase === "fade" && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,200,80,0.3)_0%,transparent_70%)]" />
        )}
      </div>
    );
  }

  // gameover
  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {/* Red flash then dark fade */}
      <div
        className={`absolute inset-0 transition-all ${phase === "flash" ? "animate-screen-shake" : ""}`}
        style={{
          backgroundColor:
            phase === "flash"
              ? "rgba(200, 0, 0, 0.7)"
              : "rgba(10, 0, 0, 0.95)",
          transitionDuration: phase === "flash" ? "100ms" : "1200ms",
        }}
      />
      {/* Crack overlay during fade */}
      {phase === "fade" && (
        <div className="absolute inset-0 opacity-40">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="50" y1="0" x2="48" y2="40" stroke="rgba(255,50,50,0.8)" strokeWidth="0.4" />
            <line x1="48" y1="40" x2="53" y2="60" stroke="rgba(255,50,50,0.6)" strokeWidth="0.35" />
            <line x1="53" y1="60" x2="47" y2="100" stroke="rgba(255,50,50,0.4)" strokeWidth="0.3" />
            <line x1="48" y1="40" x2="35" y2="55" stroke="rgba(255,50,50,0.4)" strokeWidth="0.25" />
            <line x1="53" y1="60" x2="65" y2="75" stroke="rgba(255,50,50,0.3)" strokeWidth="0.25" />
          </svg>
        </div>
      )}
      {/* Dark vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(50,0,0,0.8)_100%)]" />
    </div>
  );
}
