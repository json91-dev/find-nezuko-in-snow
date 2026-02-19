"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface RankingRecord {
  id: string;
  nickname: string;
  time: number; // in seconds
  date: string;
}

const MAX_RANKINGS = 10;

function rowToRecord(row: {
  id: string;
  nickname: string;
  time: number;
  created_at: string;
}): RankingRecord {
  return {
    id: row.id,
    nickname: row.nickname,
    time: row.time,
    date: row.created_at,
  };
}

export default function useRanking() {
  const [rankings, setRankings] = useState<RankingRecord[]>([]);

  // Fetch rankings from Supabase
  const fetchRankings = useCallback(async (): Promise<RankingRecord[]> => {
    const { data, error } = await supabase
      .from("rankings")
      .select("*")
      .order("time", { ascending: true })
      .limit(MAX_RANKINGS);

    if (error) {
      console.error("Failed to fetch rankings:", error);
      return [];
    }

    const records = (data ?? []).map(rowToRecord);
    setRankings(records);
    return records;
  }, []);

  // Add a new record, returns { id, rank }
  const addRecord = useCallback(
    async (
      nickname: string,
      time: number
    ): Promise<{ id: string; rank: number }> => {
      const { data, error } = await supabase
        .from("rankings")
        .insert({ nickname: nickname.trim() || "익명", time })
        .select()
        .single();

      if (error || !data) {
        console.error("Failed to save ranking:", error);
        return { id: "", rank: -1 };
      }

      const updated = await fetchRankings();
      const rank = updated.findIndex((r) => r.id === data.id);
      return { id: data.id, rank: rank !== -1 ? rank + 1 : -1 };
    },
    [fetchRankings]
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
    fetchRankings,
    addRecord,
    getRankings,
    wouldMakeLeaderboard,
  };
}
