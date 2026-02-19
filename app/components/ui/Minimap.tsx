"use client";

import { useRef, useEffect, useState } from "react";
import { Vector3 } from "three";

interface MinimapProps {
  playerPosition: Vector3;
  playerRotation: number;
  playerFacing: number;
  sisterPosition: Vector3;
  demonPositions: Vector3[];
  mapSize?: number;
  sisterDiscovered?: boolean;
}

const MINIMAP_SIZE = 120;
const MINIMAP_RADIUS = MINIMAP_SIZE / 2;
const HINT_RANGE = 12; // m (matches SISTER_VISIBLE_DISTANCE from Game.tsx)
const HINT_FIRST_DELAY = 3000; // 3 seconds - first hint
const HINT_INTERVAL = 250000; // 25 seconds - interval after first
const HINT_DURATION = 1500; // 1.5 seconds

export default function Minimap({
  playerPosition,
  playerRotation,
  playerFacing,
  sisterPosition,
  demonPositions,
  mapSize = 160,
  sisterDiscovered = false,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHint, setShowHint] = useState(false);

  // Hint flash timer - first at 5 seconds, then every 10 seconds for 1.5 seconds
  useEffect(() => {
    const firstTimer = setTimeout(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), HINT_DURATION);

      // Then repeat every 10 seconds
      const interval = setInterval(() => {
        setShowHint(true);
        setTimeout(() => setShowHint(false), HINT_DURATION);
      }, HINT_INTERVAL);

      return () => clearInterval(interval);
    }, HINT_FIRST_DELAY);

    return () => clearTimeout(firstTimer);
  }, []);

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

    // Rotate entire map so player's facing direction points up (compass mode)
    ctx.save();
    ctx.translate(MINIMAP_RADIUS, MINIMAP_RADIUS);
    ctx.rotate(-playerRotation);
    ctx.translate(-MINIMAP_RADIUS, -MINIMAP_RADIUS);

    // Helper: world position to minimap position (player-centered)
    const toMinimap = (worldPos: Vector3) => {
      const relX = (worldPos.x - playerPosition.x) * scale;
      const relZ = (worldPos.z - playerPosition.z) * scale;
      return { x: MINIMAP_RADIUS + relX, z: MINIMAP_RADIUS + relZ };
    };

    // Draw hint circle (yellow full circle around sister) - shows every 10 seconds
    if (showHint) {
      const hintRadius = HINT_RANGE * scale; // Convert world distance to minimap scale
      const sisterPos = toMinimap(sisterPosition);

      ctx.fillStyle = "rgba(255, 200, 0, 0.35)"; // Yellow semi-transparent
      ctx.beginPath();
      // Draw full circle around sister's position
      ctx.arc(sisterPos.x, sisterPos.z, hintRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw circle outline for better visibility
      ctx.strokeStyle = "rgba(255, 200, 0, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sisterPos.x, sisterPos.z, hintRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw demons (red dots)
    demonPositions.forEach((demonPos) => {
      const { x, z } = toMinimap(demonPos);
      ctx.fillStyle = "rgba(220, 38, 38, 0.8)";
      ctx.beginPath();
      ctx.arc(x, z, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw sister (blue dot only when discovered AND within HINT_RANGE)
    const distanceToSister = playerPosition.distanceTo(sisterPosition);
    if (sisterDiscovered && distanceToSister <= HINT_RANGE) {
      const sis = toMinimap(sisterPosition);
      ctx.fillStyle = "rgba(59, 130, 246, 0.9)"; // Blue
      ctx.beginPath();
      ctx.arc(sis.x, sis.z, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // undo compass rotation

    // Draw player arrow (rotated to show facing direction)
    ctx.save();
    ctx.translate(MINIMAP_RADIUS, MINIMAP_RADIUS);
    const facingOffset = playerFacing - playerRotation;
    ctx.rotate(-facingOffset);

    // Arrow shape pointing up
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
  }, [playerPosition, playerRotation, playerFacing, sisterPosition, demonPositions, mapSize, sisterDiscovered, showHint]);

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
