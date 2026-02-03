"use client";

import { useRef, useEffect } from "react";
import { Vector3 } from "three";

interface MinimapProps {
  playerPosition: Vector3;
  playerRotation: number;
  sisterPosition: Vector3;
  demonPositions: Vector3[];
  mapSize?: number;
}

const MINIMAP_SIZE = 120;
const MINIMAP_RADIUS = MINIMAP_SIZE / 2;

export default function Minimap({
  playerPosition,
  playerRotation,
  sisterPosition,
  demonPositions,
  mapSize = 160,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_SIZE * dpr;
    canvas.height = MINIMAP_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Background circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(MINIMAP_RADIUS, MINIMAP_RADIUS, MINIMAP_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    // Dark background
    ctx.fillStyle = "rgba(10, 22, 40, 0.8)";
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Grid lines
    ctx.strokeStyle = "rgba(74, 158, 255, 0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const pos = (MINIMAP_SIZE / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, MINIMAP_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(MINIMAP_SIZE, pos);
      ctx.stroke();
    }

    const scale = MINIMAP_SIZE / mapSize;

    // Helper: world position to minimap position
    const toMinimap = (worldPos: Vector3) => {
      const x = MINIMAP_RADIUS + worldPos.x * scale;
      const z = MINIMAP_RADIUS + worldPos.z * scale;
      return { x, z };
    };

    // Draw demons (red dots)
    demonPositions.forEach((demonPos) => {
      const { x, z } = toMinimap(demonPos);
      if (x >= 0 && x <= MINIMAP_SIZE && z >= 0 && z <= MINIMAP_SIZE) {
        ctx.fillStyle = "rgba(220, 38, 38, 0.8)";
        ctx.beginPath();
        ctx.arc(x, z, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw sister (cyan dot)
    const sis = toMinimap(sisterPosition);
    if (sis.x >= 0 && sis.x <= MINIMAP_SIZE && sis.z >= 0 && sis.z <= MINIMAP_SIZE) {
      ctx.fillStyle = "rgba(74, 220, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(sis.x, sis.z, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing ring
      ctx.strokeStyle = "rgba(74, 220, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sis.x, sis.z, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw player (white arrow pointing in rotation direction)
    const player = toMinimap(playerPosition);
    ctx.save();
    ctx.translate(player.x, player.z);
    ctx.rotate(-playerRotation);

    // Arrow shape
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.moveTo(0, -6);    // tip
    ctx.lineTo(-4, 4);    // bottom-left
    ctx.lineTo(0, 2);     // notch
    ctx.lineTo(4, 4);     // bottom-right
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Border circle
    ctx.restore();
    ctx.strokeStyle = "rgba(74, 158, 255, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(MINIMAP_RADIUS, MINIMAP_RADIUS, MINIMAP_RADIUS - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [playerPosition, playerRotation, sisterPosition, demonPositions, mapSize]);

  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-20">
      <canvas
        ref={canvasRef}
        style={{
          width: MINIMAP_SIZE,
          height: MINIMAP_SIZE,
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
