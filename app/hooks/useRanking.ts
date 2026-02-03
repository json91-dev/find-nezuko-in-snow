"use client";

import { useState, useCallback } from "react";

export interface RankingRecord {
  id: string;
  nickname: string;
  time: number; // in seconds
  date: string;
}

const STORAGE_KEY = "snowstorm-game-rankings";
const MAX_RANKINGS = 10;

function loadRankings(): RankingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load rankings:", error);
  }
  return [];
}

export default function useRanking() {
  const [rankings, setRankings] = useState<RankingRecord[]>(loadRankings);

  // Save rankings to localStorage
  const saveRankings = useCallback((newRankings: RankingRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRankings));
      setRankings(newRankings);
    } catch (error) {
      console.error("Failed to save rankings:", error);
    }
  }, []);

  // Add a new record
  const addRecord = useCallback(
    (nickname: string, time: number): number => {
      const newRecord: RankingRecord = {
        id: Date.now().toString(),
        nickname: nickname.trim() || "익명",
        time,
        date: new Date().toISOString(),
      };

      const updatedRankings = [...rankings, newRecord]
        .sort((a, b) => a.time - b.time)
        .slice(0, MAX_RANKINGS);

      saveRankings(updatedRankings);

      // Return the rank (1-based index)
      const rank = updatedRankings.findIndex((r) => r.id === newRecord.id);
      return rank !== -1 ? rank + 1 : -1;
    },
    [rankings, saveRankings]
  );

  // Get all rankings
  const getRankings = useCallback((): RankingRecord[] => {
    return rankings;
  }, [rankings]);

  // Check if a time would make the leaderboard
  const wouldMakeLeaderboard = useCallback(
    (time: number): boolean => {
      if (rankings.length < MAX_RANKINGS) return true;
      return time < rankings[rankings.length - 1].time;
    },
    [rankings]
  );

  return {
    rankings,
    addRecord,
    getRankings,
    wouldMakeLeaderboard,
  };
}
