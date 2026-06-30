/**
 * Supply Drop — Weekly rotating rejection clip pool with retooling
 *
 * Pool of 28 clips, 12 active per week.
 * Clips rotate on Mondays. Rested clips get priority.
 * When a clip returns from rest, its inflection index advances.
 * After 3 rotations, a clip "graduates" (retired from pool).
 * New clips (with null audio) are flagged for generation on return.
 */

import poolData from "./supply-drop.json";

export type RejectionEntry = {
  id: string;
  msg: string;
  expression: string;
  audio: string | null;
  inflectionIndex: number;
};

type PoolEntry = {
  id: string;
  msg: string;
  expression: string;
  audio: string | null;
  rotationsUsed: number;
  maxRotations: number;
  inflections: string[];
};

type SupplyDropState = {
  activeSetIds: string[];
  lastRotationDate: string; // YYYY-MM-DD or ISO week
  rotationCount: number;
  usageLog: Record<string, number>; // clipId → total times used
};

const STORAGE_KEY = "sqhq-supply-drop-v2";
const POOL: PoolEntry[] = poolData.pool as PoolEntry[];
const WEEKLY_COUNT = 12;

/** Get ISO week string: "2026-W26" */
function getWeek(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Load state from localStorage */
function loadState(): SupplyDropState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/** Save state to localStorage */
function saveState(state: SupplyDropState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/** Get clips that haven't graduated */
function getActivePool(): PoolEntry[] {
  return POOL.filter((c) => c.rotationsUsed < c.maxRotations);
}

/** Get current inflection index for a clip based on rotations used */
function getInflectionIndex(clip: PoolEntry): number {
  return clip.rotationsUsed % clip.inflections.length;
}

/** Get the current inflection name for a clip */
export function getInflection(clip: RejectionEntry): string {
  const poolClip = POOL.find((c) => c.id === clip.id);
  if (!poolClip) return "default";
  return poolClip.inflections[clip.inflectionIndex] || "default";
}

/** Rotate: pick new weekly set */
function performRotation(prevState: SupplyDropState | null): SupplyDropState {
  const activePool = getActivePool();
  const prevIds = new Set(prevState?.activeSetIds || []);
  const usageLog = { ...(prevState?.usageLog || {}) };

  // Step 1: Prioritize clips that were resting (not in last set)
  const rested = activePool.filter((c) => !prevIds.has(c.id));
  const wasActive = activePool.filter((c) => prevIds.has(c.id));

  // Step 2: Shuffle both groups
  const shuffledRested = shuffle(rested);
  const shuffledActive = shuffle(wasActive);

  // Step 3: Pick from rested first, then fill from active
  const selected: PoolEntry[] = [];
  for (const clip of shuffledRested) {
    if (selected.length >= WEEKLY_COUNT) break;
    selected.push(clip);
  }
  for (const clip of shuffledActive) {
    if (selected.length >= WEEKLY_COUNT) break;
    // Skip if already selected (shouldn't happen, but safety)
    if (!selected.find((s) => s.id === clip.id)) {
      selected.push(clip);
    }
  }

  // Step 4: Advance rotations and update usage
  const activeSet: RejectionEntry[] = selected.map((clip) => {
    clip.rotationsUsed += 1;
    usageLog[clip.id] = (usageLog[clip.id] || 0) + 1;
    return {
      id: clip.id,
      msg: clip.msg,
      expression: clip.expression,
      audio: clip.audio,
      inflectionIndex: getInflectionIndex(clip),
    };
  });

  // Step 5: Save state
  const week = getWeek();
  const newState: SupplyDropState = {
    activeSetIds: activeSet.map((c) => c.id),
    lastRotationDate: week,
    rotationCount: (prevState?.rotationCount || 0) + 1,
    usageLog,
  };
  saveState(newState);

  return newState;
}

/** Get today's active rejection set. Rotates weekly on Monday. */
export function getActiveRejections(): RejectionEntry[] {
  const currentWeek = getWeek();
  const state = loadState();

  // Already have this week's set
  if (state && state.lastRotationDate === currentWeek && state.activeSetIds.length > 0) {
    // Build active entries from current state
    return state.activeSetIds
      .map((id) => {
        const poolClip = POOL.find((c) => c.id === id);
        if (!poolClip) return null;
        return {
          id: poolClip.id,
          msg: poolClip.msg,
          expression: poolClip.expression,
          audio: poolClip.audio,
          inflectionIndex: getInflectionIndex(poolClip),
        };
      })
      .filter(Boolean) as RejectionEntry[];
  }

  // New week — rotate
  const newState = performRotation(state);
  return newState.activeSetIds
    .map((id) => {
      const poolClip = POOL.find((c) => c.id === id);
      if (!poolClip) return null;
      return {
        id: poolClip.id,
        msg: poolClip.msg,
        expression: poolClip.expression,
        audio: poolClip.audio,
        inflectionIndex: getInflectionIndex(poolClip),
      };
    })
    .filter(Boolean) as RejectionEntry[];
}

/** Force a re-roll (for testing or manual refresh) */
export function forceRotation(): RejectionEntry[] {
  const state = loadState();
  const newState = performRotation(state);
  return newState.activeSetIds
    .map((id) => {
      const poolClip = POOL.find((c) => c.id === id);
      if (!poolClip) return null;
      return {
        id: poolClip.id,
        msg: poolClip.msg,
        expression: poolClip.expression,
        audio: poolClip.audio,
        inflectionIndex: getInflectionIndex(poolClip),
      };
    })
    .filter(Boolean) as RejectionEntry[];
}

/** Get pool stats for debugging/display */
export function getPoolStats() {
  const active = getActivePool();
  const graduated = POOL.filter((c) => c.rotationsUsed >= c.maxRotations);
  const needsAudio = active.filter((c) => !c.audio);
  return {
    totalPool: POOL.length,
    activeCount: active.length,
    graduatedCount: graduated.length,
    needsAudioCount: needsAudio.length,
    needsAudio,
    graduated,
  };
}

/** Check if a clip needs new audio (null audio field) */
export function needsAudioGeneration(clip: RejectionEntry): boolean {
  return clip.audio === null;
}

/** Mark a clip as having audio generated (called after TTS) */
export function markAudioGenerated(clipId: string, audioPath: string): void {
  const clip = POOL.find((c) => c.id === clipId);
  if (clip) {
    clip.audio = audioPath;
    // Also update localStorage state
    const state = loadState();
    if (state) {
      saveState(state);
    }
  }
}

/** Get the full pool size (for display/debugging) */
export function getPoolSize(): number {
  return POOL.length;
}
