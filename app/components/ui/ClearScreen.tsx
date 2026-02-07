"use client";

import { useState } from "react";

interface ClearScreenProps {
  clearTime: number;
  onRestart: () => void;
  onSaveRecord: (nickname: string) => void;
  onShowRanking: () => void;
  isRecordSaved: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
    onSaveRecord(nickname || "익명");
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a1520] via-[#2a1f30] to-[#1a1520]">
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
                  className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
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
              className="w-full rounded-xl px-6 py-3 text-sm text-white/40 transition-colors hover:text-white/60"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "눈보라 속 네즈코 찾기",
                    text: `${formatTime(clearTime)}에 네즈코을 찾았습니다!`,
                    url: window.location.href,
                  });
                }
              }}
            >
              공유하기
            </button>
          </div>

          {/* Decorative bottom */}
          <div className="mx-auto mt-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        </div>
      </div>
    </div>
  );
}
