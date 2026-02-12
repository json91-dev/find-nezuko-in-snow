"use client";

import { useEffect, useRef, useCallback } from "react";
import { Vector3 } from "three";

interface UsePositionalAudioProps {
  audioSources: string[];
  sourcePosition: Vector3;
  listenerPosition: Vector3;
  maxDistance?: number;
  refDistance?: number;
}

export default function usePositionalAudio({
  audioSources,
  sourcePosition,
  listenerPosition,
  maxDistance = 50,
  refDistance = 5,
}: UsePositionalAudioProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const buffersRef = useRef<AudioBuffer[]>([]);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Store positions in refs for RAF access
  const sourcePositionRef = useRef(sourcePosition);
  const listenerPositionRef = useRef(listenerPosition);
  const maxDistanceRef = useRef(maxDistance);
  sourcePositionRef.current = sourcePosition;
  listenerPositionRef.current = listenerPosition;
  maxDistanceRef.current = maxDistance;

  const playNextSound = useCallback(() => {
    const ctx = audioContextRef.current;
    const panner = pannerRef.current;
    const buffers = buffersRef.current;

    if (!ctx || !panner || buffers.length === 0 || !isPlayingRef.current)
      return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const buffer = buffers[currentIndexRef.current];
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(panner);
    sourceNodeRef.current = source;

    source.onended = () => {
      if (isPlayingRef.current) {
        currentIndexRef.current =
          (currentIndexRef.current + 1) % buffers.length;
        const delay = 3000 + Math.random() * 5000; // 3-8s random interval
        timeoutRef.current = setTimeout(playNextSound, delay);
      }
    };

    source.start(0);
  }, []);

  // Initialize audio context and load buffers
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let mounted = true;

    const initAudio = async () => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (
            window as unknown as {
              webkitAudioContext: typeof window.AudioContext;
            }
          ).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const panner = ctx.createPanner();
        panner.panningModel = "HRTF";
        panner.distanceModel = "inverse";
        panner.refDistance = refDistance;
        panner.maxDistance = maxDistance;
        panner.rolloffFactor = 2;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        pannerRef.current = panner;

        const gain = ctx.createGain();
        gain.gain.value = 1.0;
        gainRef.current = gain;

        panner.connect(gain);
        gain.connect(ctx.destination);

        const loadPromises = audioSources.map(async (src) => {
          const response = await fetch(src);
          const arrayBuffer = await response.arrayBuffer();
          return ctx.decodeAudioData(arrayBuffer);
        });

        const buffers = await Promise.all(loadPromises);
        if (mounted) {
          buffersRef.current = buffers;
          isPlayingRef.current = true;

          // Resume on user interaction if suspended
          const resumeAudio = () => {
            if (ctx.state === "suspended") {
              ctx.resume();
            }
          };
          document.addEventListener("click", resumeAudio, { once: false });
          document.addEventListener("keydown", resumeAudio, { once: false });
          document.addEventListener("touchstart", resumeAudio, { once: false });

          // Start playing after a short delay
          timeoutRef.current = setTimeout(playNextSound, 500);
        }
      } catch (error) {
        console.error("Failed to initialize positional audio:", error);
      }
    };

    initAudio();

    return () => {
      mounted = false;
      isPlayingRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          /* already stopped */
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update panner and listener positions every frame via RAF
  useEffect(() => {
    let animationId: number;

    const updatePositions = () => {
      const panner = pannerRef.current;
      const ctx = audioContextRef.current;
      if (!panner || !ctx) {
        animationId = requestAnimationFrame(updatePositions);
        return;
      }

      const sp = sourcePositionRef.current;
      const lp = listenerPositionRef.current;

      panner.positionX.setValueAtTime(sp.x, ctx.currentTime);
      panner.positionY.setValueAtTime(sp.y, ctx.currentTime);
      panner.positionZ.setValueAtTime(sp.z, ctx.currentTime);

      const listener = ctx.listener;
      if (listener.positionX) {
        listener.positionX.setValueAtTime(lp.x, ctx.currentTime);
        listener.positionY.setValueAtTime(lp.y, ctx.currentTime);
        listener.positionZ.setValueAtTime(lp.z, ctx.currentTime);
      }

      // Manual gain-based distance attenuation (cubic falloff)
      const gain = gainRef.current;
      if (gain) {
        const distance = Math.sqrt(
          (sp.x - lp.x) ** 2 + (sp.y - lp.y) ** 2 + (sp.z - lp.z) ** 2
        );
        const md = maxDistanceRef.current;
        const t = Math.min(distance / md, 1);
        // Cubic falloff: near=loud, mid=steep drop, far=nearly silent
        const volume = t >= 1 ? 0 : Math.pow(1 - t, 3);
        gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
      }

      animationId = requestAnimationFrame(updatePositions);
    };

    animationId = requestAnimationFrame(updatePositions);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return null;
}
