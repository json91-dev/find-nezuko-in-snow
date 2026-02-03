"use client";

import { useState } from "react";

interface StartScreenProps {
  onStart: () => void;
}

function SnowParticles() {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      drift: Math.random() > 0.5,
      opacity: 0.3 + Math.random() * 0.5,
    }))
  );

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className={p.drift ? "snow-particle-drift" : "snow-particle"}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </>
  );
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0f2240] to-[#162d50]">
      <SnowParticles />

      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,158,255,0.08)_0%,transparent_70%)]" />

      <div className="animate-fade-in-up relative z-10 mx-4 w-full max-w-md">
        {/* Main card with glassmorphism */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Decorative top border */}
          <div className="mx-auto mb-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-[#4a9eff] to-transparent" />

          {/* Title */}
          <h1 className="animate-text-glow mb-2 text-center text-4xl font-black tracking-wider text-white">
            눈보라 속
          </h1>
          <h1 className="animate-text-glow mb-6 text-center text-4xl font-black tracking-wider text-white">
            여동생 찾기
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-center text-sm leading-relaxed text-blue-200/70">
            눈보라 속에서 길을 잃은 여동생을 찾아주세요.
            <br />
            울음소리와 색감만이 유일한 단서입니다.
          </p>

          {/* Controls info */}
          <div className="mb-8 rounded-xl border border-white/5 bg-white/5 p-4">
            <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-blue-300/80">
              조작 방법
            </h3>
            <div className="space-y-2 text-sm text-blue-100/60">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-white/5 text-xs text-blue-300">
                  W
                </span>
                <span>WASD / 방향키로 이동</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-7 w-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                </svg>
                <span>마우스 클릭+드래그로 이동/회전</span>
              </div>
            </div>
          </div>

          {/* Sound reminder */}
          <div className="mb-6 rounded-lg border border-[#4a9eff]/20 bg-[#4a9eff]/5 px-4 py-2 text-center">
            <p className="text-xs text-blue-300/80">
              소리를 켜주세요 &mdash; 소리가 중요한 단서입니다
            </p>
          </div>

          {/* Start button */}
          <button
            onClick={onStart}
            className="animate-pulse-glow w-full rounded-xl border border-[#4a9eff]/30 bg-gradient-to-r from-[#4a9eff]/20 to-[#6db3ff]/20 px-8 py-4 text-lg font-bold tracking-widest text-white transition-all hover:from-[#4a9eff]/40 hover:to-[#6db3ff]/40 active:scale-[0.98]"
          >
            시작하기
          </button>

          {/* Decorative bottom border */}
          <div className="mx-auto mt-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-[#4a9eff] to-transparent" />
        </div>
      </div>
    </div>
  );
}
