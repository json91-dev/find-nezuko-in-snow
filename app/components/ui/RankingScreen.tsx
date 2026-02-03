"use client";

import type { RankingRecord } from "@/app/hooks/useRanking";

interface RankingScreenProps {
  rankings: RankingRecord[];
  currentRecordId?: string;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function RankingScreen({
  rankings,
  currentRecordId,
  onClose,
}: RankingScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="animate-fade-in-up mx-4 w-full max-w-lg">
        <div className="rounded-2xl border border-white/10 bg-[#0f1a2e]/95 p-6 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="mx-auto mb-4 h-[2px] w-16 bg-gradient-to-r from-transparent via-[#4a9eff] to-transparent" />
          <h2 className="animate-text-glow mb-6 text-center text-2xl font-black tracking-wider text-white">
            랭킹
          </h2>

          {rankings.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">
              아직 기록이 없습니다.
            </p>
          ) : (
            <div className="mb-6 space-y-1">
              {/* Table header */}
              <div className="flex items-center px-3 py-2 text-xs uppercase tracking-widest text-blue-300/50">
                <span className="w-12 text-center">순위</span>
                <span className="flex-1">닉네임</span>
                <span className="w-28 text-right">시간</span>
              </div>
              {/* Rows */}
              {rankings.map((record, index) => (
                <div
                  key={record.id}
                  className={`flex items-center rounded-lg px-3 py-2.5 transition-colors ${
                    record.id === currentRecordId
                      ? "border border-amber-500/20 bg-amber-500/10 text-amber-100"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <span className="w-12 text-center text-sm">
                    {index < 3 ? RANK_ICONS[index] : index + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">
                    {record.nickname}
                  </span>
                  <span className="w-28 text-right font-mono text-sm">
                    {formatTime(record.time)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10"
          >
            닫기
          </button>

          <div className="mx-auto mt-4 h-[2px] w-16 bg-gradient-to-r from-transparent via-[#4a9eff] to-transparent" />
        </div>
      </div>
    </div>
  );
}
