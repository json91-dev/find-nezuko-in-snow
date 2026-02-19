"use client";

import { useState } from "react";

function SnowParticles() {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => {
      const duration = 8 + Math.random() * 12;
      return {
        id: i,
        left: Math.random() * 100,
        size: (2 + Math.random() * 4) * 1.4,
        duration,
        delay: -(Math.random() * duration),
        drift: Math.random() > 0.5,
        opacity: 0.3 + Math.random() * 0.5,
      };
    })
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

interface ClearScreenProps {
  clearTime: number;
  onRestart: () => void;
  onSaveRecord: (nickname: string) => Promise<void>;
  onShowRanking: () => Promise<void>;
  isRecordSaved: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export default function ClearScreen({
  clearTime,
  onRestart,
  onSaveRecord,
  onShowRanking,
  isRecordSaved,
}: ClearScreenProps) {
  const [nickname, setNickname] = useState("");

  const handleSaveRecord = () => {
    if (!nickname.trim()) return;
    onSaveRecord(nickname.trim());
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a1520] via-[#2a1f30] to-[#1a1520]">
      <SnowParticles />
      {/* Warm light particles */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,180,50,0.1)_0%,transparent_60%)]" />

      <div className="animate-fade-in-up relative z-10 mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-amber-500/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Decorative top */}
          <div className="mx-auto mb-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Title */}
          <h1 className="animate-warm-glow mb-2 text-center text-3xl font-black tracking-wider text-amber-100">
            네즈코을 찾았습니다!
          </h1>

          {/* Time */}
          <div className="my-8 text-center">
            <p className="mb-1 text-xs uppercase tracking-widest text-amber-300/60">
              클리어 시간
            </p>
            <p className="font-mono text-5xl font-bold text-white">
              {formatTime(clearTime)}
            </p>
          </div>

          {/* Save record */}
          {!isRecordSaved && (
            <div className="mb-6 space-y-3">
              <p className="text-center text-sm text-amber-200/60">
                랭킹에 기록을 남기시겠습니까?
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="닉네임 (최대 10자)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 10))}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 outline-none backdrop-blur-sm focus:border-amber-400/30"
                />
                <button
                  onClick={handleSaveRecord}
                  disabled={!nickname.trim()}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  저장
                </button>
              </div>
            </div>
          )}

          {isRecordSaved && (
            <p className="mb-6 text-center text-sm text-emerald-400/80">
              기록이 저장되었습니다!
            </p>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onShowRanking}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10"
            >
              랭킹 보기
            </button>
            <button
              onClick={onRestart}
              className="w-full rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-600/20 to-amber-500/20 px-6 py-3 text-sm font-bold text-amber-100 transition-all hover:from-amber-600/30 hover:to-amber-500/30"
            >
              다시 하기
            </button>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-6 py-3 text-sm font-bold text-[#191919] transition-opacity hover:opacity-90 active:opacity-80"
              onClick={() => {
                if (typeof window === "undefined" || !window.Kakao) return;
                if (!window.Kakao.isInitialized()) {
                  window.Kakao.init(
                    process.env.NEXT_PUBLIC_KAKAO_JS_KEY as string
                  );
                }
                const siteUrl = window.location.origin;
                window.Kakao.Share.sendDefault({
                  objectType: "feed",
                  content: {
                    title: "눈보라 속 네즈코 찾기",
                    description: `❄️ ${formatTime(clearTime)}만에 네즈코를 찾았습니다! 당신도 도전해보세요!`,
                    imageUrl: `${siteUrl}/game.png`,
                    link: {
                      mobileWebUrl: siteUrl,
                      webUrl: siteUrl,
                    },
                  },
                  buttons: [
                    {
                      title: "나도 도전하기",
                      link: {
                        mobileWebUrl: siteUrl,
                        webUrl: siteUrl,
                      },
                    },
                  ],
                });
              }}
            >
              {/* Kakao 로고 */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9 1C4.582 1 1 3.896 1 7.444c0 2.292 1.515 4.305 3.797 5.435L3.94 16.13a.25.25 0 0 0 .374.274L8.4 13.83c.196.015.394.022.6.022 4.418 0 8-2.896 8-6.408C17 3.896 13.418 1 9 1Z"
                  fill="#191919"
                />
              </svg>
              카카오톡으로 공유하기
            </button>
          </div>

          {/* Decorative bottom */}
          <div className="mx-auto mt-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        </div>
      </div>
    </div>
  );
}
