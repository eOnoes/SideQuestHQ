/**
 * Cyony Audio Cache — pre-generated MiMo TTS voice clips
 *
 * Maps quip keys to cached OGG files in /public/audio/scout/
 * Falls back to null if not cached (caller uses live MiMo TTS instead)
 *
 * Tier-based snooze system:
 *   s0 = casual (1st snooze)
 *   s1 = mild (2nd)
 *   s2 = medium (3rd)
 *   s3 = hot (4th)
 *   s4 = nuclear (5th+)
 *   s5 = last reminder snoozed
 *   sr = rapid-fire (multiple in <2s)
 *   srp = repeat reminder (snoozed before)
 *   c  = completed
 *   af = agent filler ("interesting, give me a second...")
 */

type CyonyAudioEntry = {
  ogg: string;
  text: string;
  category?: string;
};

type CyonyAudioManifest = Record<string, CyonyAudioEntry>;

let manifestCache: CyonyAudioManifest | null = null;

async function loadManifest(): Promise<CyonyAudioManifest> {
  if (manifestCache) return manifestCache;
  try {
    const res = await fetch("/audio/scout/manifest.json");
    if (res.ok) {
      manifestCache = await res.json();
      return manifestCache!;
    }
  } catch {}
  return {};
}

/**
 * Get cached audio URL for a Cyony quip key.
 * Returns the OGG URL if available, null otherwise.
 */
export async function getCyonyAudio(key: string): Promise<string | null> {
  const manifest = await loadManifest();
  const entry = manifest[key];
  if (entry) {
    return `/audio/scout/${entry.ogg}`;
  }
  return null;
}

/**
 * Play a cached Cyony audio clip.
 * Stops any currently playing audio first.
 * Returns true if audio was played, false if not cached.
 */
export async function playCyonyAudio(
  key: string,
  currentAudioRef?: React.MutableRefObject<HTMLAudioElement | null>
): Promise<boolean> {
  // Create Audio IMMEDIATELY — before any async work — so interrupt can stop it
  const audio = new Audio();
  if (currentAudioRef) {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    currentAudioRef.current = audio; // tracked BEFORE manifest fetch
  }

  const url = await getCyonyAudio(key);
  if (!url) {
    if (currentAudioRef?.current === audio) currentAudioRef.current = null;
    return false;
  }

  // Check: was this audio interrupted/abandoned while fetching manifest?
  if (currentAudioRef?.current !== audio) return false;

  try {
    audio.src = url;
    await audio.play();
    return true;
  } catch {
    if (currentAudioRef?.current === audio) currentAudioRef.current = null;
    return false;
  }
}

/**
 * Pick a random quip key from a numbered pool and play it.
 * e.g. playRandomCyonyQuip("s0", 5) tries s0_1 through s0_5
 * Returns the key that was played, or null if none cached.
 */
export async function playRandomCyonyQuip(
  prefix: string,
  count: number,
  currentAudioRef?: React.MutableRefObject<HTMLAudioElement | null>
): Promise<string | null> {
  const idx = Math.floor(Math.random() * count) + 1;
  const key = `${prefix}_${idx}`;
  const played = await playCyonyAudio(key, currentAudioRef);
  return played ? key : null;
}

/**
 * Play a random audio clip from an array of keys.
 * Tries each key in random order until one plays.
 */
export async function playRandomFromKeys(
  keys: string[],
  currentAudioRef?: React.MutableRefObject<HTMLAudioElement | null>
): Promise<string | null> {
  const shuffled = [...keys].sort(() => Math.random() - 0.5);
  for (const key of shuffled) {
    const played = await playCyonyAudio(key, currentAudioRef);
    if (played) return key;
  }
  return null;
}

// Pre-warm manifest on load
if (typeof window !== "undefined") {
  loadManifest();
}
