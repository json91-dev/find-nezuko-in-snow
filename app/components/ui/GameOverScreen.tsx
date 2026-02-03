"use client";

interface GameOverScreenProps {
  elapsedTime: number;
  onRestart: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function GameOverScreen({ elapsedTime, onRestart }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0505] via-[#2a0a0a] to-[#0a0505]">
      {/* Dark red vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(80,0,0,0.6)_100%)]" />

      {/* Crack overlay effect */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="45" y1="0" x2="52" y2="35" stroke="rgba(220,38,38,0.5)" strokeWidth="0.3" />
          <line x1="52" y1="35" x2="48" y2="55" stroke="rgba(220,38,38,0.5)" strokeWidth="0.25" />
          <line x1="48" y1="55" x2="55" y2="100" stroke="rgba(220,38,38,0.4)" strokeWidth="0.2" />
          <line x1="52" y1="35" x2="70" y2="45" stroke="rgba(220,38,38,0.3)" strokeWidth="0.2" />
          <line x1="48" y1="55" x2="30" y2="70" stroke="rgba(220,38,38,0.3)" strokeWidth="0.2" />
          <line x1="30" y1="70" x2="25" y2="100" stroke="rgba(220,38,38,0.2)" strokeWidth="0.15" />
        </svg>
      </div>

      <div className="animate-fade-in-up relative z-10 mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-red-900/30 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
          {/* Decorative top */}
          <div className="mx-auto mb-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-red-600 to-transparent" />

          {/* Title */}
          <h1
            className="mb-2 text-center text-3xl font-black tracking-wider text-red-400"
            style={{
              textShadow: "0 0 20px rgba(220,38,38,0.5), 0 0 40px rgba(220,38,38,0.2)",
            }}
          >
            혈귀에게 당했습니다...
          </h1>

          {/* Time survived */}
          <div className="my-8 text-center">
            <p className="mb-1 text-xs uppercase tracking-widest text-red-400/50">
              생존 시간
            </p>
            <p className="font-mono text-4xl font-bold text-white/80">
              {formatTime(elapsedTime)}
            </p>
          </div>

          {/* Restart button */}
          <button
            onClick={onRestart}
            className="w-full rounded-xl border border-red-600/20 bg-gradient-to-r from-red-900/30 to-red-800/20 px-6 py-4 text-sm font-bold tracking-widest text-red-200 transition-all hover:from-red-900/50 hover:to-red-800/40 active:scale-[0.98]"
          >
            다시 도전하기
          </button>

          {/* Decorative bottom */}
          <div className="mx-auto mt-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
        </div>
      </div>
    </div>
  );
}
