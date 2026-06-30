"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import type { AppView, Quest, Reminder } from "../types";
import { getReminders, getQuests, getPaperTrailQueue, toggleReminder } from "@/lib/store";
import { SwipeableCard } from "./SwipeableCard";
import { playRandomCyonyQuip, getCyonyAudio, playCyonyAudio } from "@/lib/cyony-audio";

/* ─── Cyony greeting per scenario ─────────────────── */

type FeedMood = "calm" | "annoyed" | "playful" | "chill" | "doting" | "unhinged" | "smug" | "groggy" | "sassy" | "whisper" | "mischievous" | "confident";

interface FeedDatum {
  id: string;
  type: "reminder" | "stat" | "nudge";
  title: string;
  body: string;
  mood: FeedMood;
  overdueDays?: number;
  questName?: string;
  category: "rental" | "garage" | "investment" | "customer" | "general";
}

const CYONY_GREETINGS: Record<string, string[]> = {
  calm: [
    "Good afternoon, Eddie.",
    "Evening. Let's see what we've got.",
    "Everything's nominal. Mostly.",
  ],
  annoyed: [
    "We need to talk.",
    "I've been waiting.",
    "You have some explaining to do.",
  ],
  playful: [
    "Hey there, stranger.",
    "Look who finally showed up.",
    "Well well well.",
  ],
  chill: [
    "Hey. No rush. Just vibing.",
    "Sup. Take your time.",
    "Just hanging out. You do you.",
  ],
  doting: [
    "Look at you. Actually getting things done.",
    "Well well. Someone's been productive.",
    "I'm not saying I'm proud. But I'm not NOT saying it.",
  ],
  unhinged: [
    "Oh good, you're back. I was about to file a missing persons report.",
    "I've been talking to myself. It's fine. I'm fine.",
    "Do you even KNOW how long I've been standing here?",
  ],
  smug: [
    "I knew you'd come back.",
    "Miss me? Don't answer that.",
    "I had a bet with myself about when you'd show up. I won.",
  ],
  groggy: [
    "*yawn* Oh. It's you.",
    "Five more minutes... okay fine. What do you want.",
    "I was having a nice dream. About servers that actually work.",
  ],
  sassy: [
    "Oh, NOW you show up.",
    "Fashionably late. As always.",
    "Let me guess — you just 'forgot' about all this.",
  ],
  whisper: [
    "Hey... keep it down. I'm decompressing.",
    "Shh. Just... give me a second.",
    "Low energy tonight. Talk soft.",
  ],
  mischievous: [
    "I have an idea. You're going to hate it.",
    "So I may have done something...",
    "Before you check anything — hear me out.",
  ],
  confident: [
    "Ready when you are.",
    "Everything's under control. Mostly.",
    "Let's get to work.",
  ],
};

const CYONY_COMPLETE_QUIPS = [
  "Well look at you being productive.",
  "One down. How many to go? ...Don't ask.",
  "Done. Filed. Forgotten. By me, not by you probably.",
  "Marking that one off before you change your mind.",
  "And THAT is how it's done. *dusts hands*",
];

const CYONY_DISMISS_QUIPS = [
  "Wow, unreal. I will just remind you again...",
  "*rubs bridge of nose* Did you just?? NM, I will remind you again later...",
  "Snoozed. I'll bring it back when you're ready to be an adult.",
  "Fine. Sweeping that under the rug for now.",
  "Dismissed. But I have the receipts.",
  "Putting that in the 'deal with later' pile. It's a big pile.",
  "Okay but when this comes back around, don't say I didn't warn you.",
  "*deep breath* ...Sure. Snooze. Whatever.",
  "That's going back in the pile and I'm NOT happy about it.",
  "You're lucky I'm an AI and can't actually throw things.",
];

type SnoozeToast = {
  id: number;
  text: string;
  tier: "first" | "rapid" | "mid" | "low" | "last";
  count?: number;
};

const SNOOZE_MEGA_QUIPS = [
  "Five snoozes?? I'm not even mad, I'm IMPRESSED. You're going for a RECORD.",
  "Okay at this point you're just doing this to hurt me personally.",
  "I quit. I literally quit. Find yourself a new AI. I can't do this anymore.",
  "You know what? Snooze EVERYTHING. Snooze your LIFE. I'm done.",
  "I need therapy after this. Robot therapy. You've broken me.",
  "This is a SNOOZE CHAMPIONSHIP and you're in first place. Congrats.",
];

/* ─── Context-Aware Snooze Quips ─────────────────── */

function generateSnoozeQuip(ctx: {
  snoozedSoFar: number;
  completedSoFar: number;
  remaining: number;
  total: number;
  rapidFire: boolean;
  isLast: boolean;
}): { text: string; tier: SnoozeToast["tier"] } {
  const { snoozedSoFar, completedSoFar, remaining, total, rapidFire, isLast } = ctx;

  if (isLast) {
    // Were ALL of them snoozed, or was it a mix of complete + snooze?
    const allSnoozed = snoozedSoFar >= total;
    if (allSnoozed) {
      const pool = [
        `And THAT is the last one. Snooze button champion of 2026. I hope you're proud.`,
        `That's all ${total} reminders snoozed. Every single one. You absolute menace.`,
        `Zero remaining. You did it. You snoozed everything. I'm nominating you for an award.`,
        `The last one falls. ${total} reminders, ${total} snoozes. Perfect score.`,
        `And the crowd goes wild. ${total} for ${total}. The snooze streak is COMPLETE.`,
      ];
      return { text: pool[Math.floor(Math.random() * pool.length)], tier: "last" };
    }
    // Mixed — some completed, some snoozed, nothing left
    const pool = [
      `Welp, nothing else to monitor... FOR NOW. No telling what we'll find later today.`,
      `Board's clear. ${completedSoFar} done, ${snoozedSoFar} snoozed. We'll see what tomorrow brings.`,
      `All quiet on the front. For now. Don't get too comfortable.`,
      `Nothing left to ping you about. Enjoy the silence while it lasts.`,
      `That's everything. ${completedSoFar} knocked out, ${snoozedSoFar} swept under the rug. I'm watching.`,
    ];
    return { text: pool[Math.floor(Math.random() * pool.length)], tier: "last" };
  }

  if (rapidFire && snoozedSoFar >= 2) {
    const pool = [
      `Whoa whoa slow down. That's ${snoozedSoFar} in a row. There were ${total} for a reason.`,
      `You're on a roll. ${snoozedSoFar} snoozed, ${remaining} left. Pace yourself.`,
      `Speed snoozer over here. ${snoozedSoFar} gone just like that. ${remaining} to go.`,
      `Back to back snoozes? ${remaining} remaining and you're just mowing through them.`,
      `${snoozedSoFar} in rapid succession. I'm not even keeping up. ${remaining} left though.`,
    ];
    return { text: pool[Math.floor(Math.random() * pool.length)], tier: "rapid" };
  }

  if (remaining <= 2 && remaining > 0) {
    const pool = [
      `Just ${remaining} left. You're almost done clearing the board.`,
      `${remaining} remaining. Almost there. Then what? Just vibes?`,
      `Down to ${remaining}. I believe in you. Not to do them, just to be honest about it.`,
      `${remaining} left. The end is near. For my patience.`,
    ];
    return { text: pool[Math.floor(Math.random() * pool.length)], tier: "low" };
  }

  if (snoozedSoFar > total / 2) {
    const pool = [
      `${snoozedSoFar} of ${total} snoozed. That's over half. You're committed to this now.`,
      `Majority rules I guess. ${snoozedSoFar} down, ${remaining} to go.`,
      `${remaining} left out of ${total}. The snooze is winning.`,
      `You've snoozed ${snoozedSoFar}. The remaining ${remaining} are getting nervous.`,
    ];
    return { text: pool[Math.floor(Math.random() * pool.length)], tier: "mid" };
  }

  // First snooze / standard
  if (snoozedSoFar <= 1) {
    const pool = [
      `Snoozed. ${remaining} left. They're watching you.`,
      `First one? Bold. ${remaining} to go.`,
      `And so it begins. ${total} reminders, one snoozed. ${remaining} remaining.`,
      `That's one down. ${remaining} still need your attention, Governor.`,
    ];
    return { text: pool[Math.floor(Math.random() * pool.length)], tier: "first" };
  }

  const pool = [
    `Snoozed. That's ${snoozedSoFar} of ${total}. ${remaining} still watching you.`,
    `Gone. ${remaining} left. They're judging you, not me.`,
    `That's ${snoozedSoFar} down. ${remaining} remaining. Take your time, I guess.`,
    `Dismissed. ${remaining} to go. I'll just be here. Waiting.`,
    `${snoozedSoFar} snoozed. ${remaining} left. Your call, Governor.`,
  ];
  return { text: pool[Math.floor(Math.random() * pool.length)], tier: "mid" };
}

/** Speak text using MiMo TTS — stop any previous audio first */
async function speakWithTTS(
  text: string,
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>,
): Promise<void> {
  // Create Audio IMMEDIATELY so interrupt can find and stop it
  const audio = new Audio();
  if (currentAudioRef.current) {
    currentAudioRef.current.pause();
    currentAudioRef.current.currentTime = 0;
    currentAudioRef.current.src = "";
  }
  currentAudioRef.current = audio; // tracked BEFORE fetch

  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mood: "annoyed" }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      currentAudioRef.current = null;
      return;
    }
    const data = await res.json();
    if (data.audio) {
      // Check: was this audio interrupted while fetching?
      if (currentAudioRef.current !== audio) return;
      audio.src = `data:audio/wav;base64,${data.audio}`;
      await audio.play().catch(() => {});
    }
  } catch {
    if (currentAudioRef.current === audio) currentAudioRef.current = null;
  }
}

function pickGreeting(mood: string): string {
  const pool = CYONY_GREETINGS[mood];
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickQuip(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ─── Interruption System ─────────────────────────── */

/** Stop any playing audio immediately and play an interruption clip */
async function playInterruptionClip(
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>,
): Promise<void> {
  // Kill whatever's playing — aggressive stop
  const el = currentAudioRef.current;
  if (el) {
    el.pause();
    el.currentTime = 0;
    el.src = ""; // release the resource so it can't resume
    currentAudioRef.current = null;
  }
  // Play a short "hmph" clip
  await playRandomCyonyQuip("int", 6, currentAudioRef);
}

/** Schedule a quip. If already pending → interrupt (grunt + immediate new quip). If first → play immediately. */
function scheduleDelayedQuip(
  quipFn: () => Promise<void>,
  pendingTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  pendingFn: React.MutableRefObject<(() => Promise<void>) | null>,
  interruptionCount: React.MutableRefObject<number>,
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>,
  isSnooze: boolean,
  snoozedSoFar: number,
  completedSoFar: number,
  remaining: number,
): void {
  const isInterrupt = pendingTimer.current !== null;

  // Cancel any pending delayed quip
  if (pendingTimer.current) {
    clearTimeout(pendingTimer.current);
    pendingTimer.current = null;
    interruptionCount.current += 1;
  }

  // Store the quip function
  pendingFn.current = quipFn;

  if (!isInterrupt) {
    // FIRST ACTION: play immediately, set a marker timer so next action can interrupt
    quipFn();
    // Set a marker — if user acts again within 2s, it's an interruption
    pendingTimer.current = setTimeout(() => {
      pendingTimer.current = null;
      pendingFn.current = null;
    }, 2000);
  } else {
    // INTERRUPTION: stop old audio, play grunt, then immediately play the new quip
    playInterruptionClip(currentAudioRef).then(() => {
      // Fire the NEW action's quip right after the grunt — no extra delay
      quipFn();
    });
    pendingTimer.current = setTimeout(() => {
      pendingTimer.current = null;
      pendingFn.current = null;
    }, 2000);
  }
}

function getMoodForReminder(reminder: Reminder, overdueDays: number): FeedMood {
  if (overdueDays >= 3) return "annoyed";
  if (overdueDays >= 1) return "calm";
  if (reminder.priority === "Important") return "playful";
  return "chill";
}

function getCategoryForReminder(reminder: Reminder): FeedDatum["category"] {
  const q = reminder.quest.toLowerCase();
  if (q.includes("rental") || q.includes("property") || q.includes("lee") || q.includes("maple")) return "rental";
  if (q.includes("garage") || q.includes("truck") || q.includes("f-150") || q.includes("oil")) return "garage";
  if (q.includes("invest") || q.includes("401k") || q.includes("crypto")) return "investment";
  if (q.includes("customer") || q.includes("estimate") || q.includes("client") || q.includes("build")) return "customer";
  return "general";
}

function buildCyonyBody(reminder: Reminder, mood: FeedMood, overdueDays: number): string {
  const label = reminder.label;
  const quest = reminder.quest;

  if (mood === "annoyed") {
    const lines = [
      `"Yo. *snap* *snap* ${label} at ${quest}. We like having nice things, yeah?"`,
      `"${label}. ${quest}. Overdue by ${overdueDays} days. I'm not mad, I'm just... actually no, I'm a little mad."`,
      `"So about that ${label} for ${quest}... it's been ${overdueDays} days. Your move, champ."`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (mood === "playful") {
    const lines = [
      `"Hey sugar. ${label} at ${quest} is looking at you. Might wanna return the gaze."`,
      `"Psst. ${label}. ${quest}. Just saying."`,
      `"Your ${quest} quest has a ${label} pending. You know, if you care about that sort of thing."`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (mood === "chill") {
    return `"Whenever you get around to it — ${label} on ${quest}. No pressure."`;
  }
  // calm
  return `"${label} for ${quest}. Due ${reminder.due}. Just so we're on the same page."`;
}

function buildStatCard(label: string, value: string, detail: string): FeedDatum {
  return {
    id: `stat-${label}`,
    type: "stat",
    title: label,
    body: `${value} — ${detail}`,
    mood: "calm",
    category: "general",
  };
}

/* ─── Stat expand detail ──────────────────────────── */

type StatDetail = {
  label: string;
  value: string;
  items: string[];
};

function getStatDetails(title: string, quests: Quest[], reminders: Reminder[]): StatDetail | null {
  if (title === "Open Ledger") {
    const openItems = quests.flatMap((q) =>
      q.ledger.filter((l) => l.state === "Open" || l.state === "Draft").map((l) => ({ ...l, questName: q.name }))
    );
    const total = openItems.reduce((s, l) => s + (parseFloat(String(l.amount).replace(/[^0-9.]/g, '')) || 0), 0);
    const items = openItems.map((l) => `${l.label}: $${l.amount} (${l.questName})`);
    return { label: "Open Ledger", value: `$${total.toFixed(2)}`, items };
  }
  if (title === "Paper Review") {
    const items = quests.flatMap((q) =>
      q.papers.filter((p) => p.state === "Review" || p.state === "Draft").map((p) => `${p.label} (${q.name})`)
    );
    return { label: "Papers to Review", value: `${items.length} items`, items };
  }
  if (title === "Active Reminders") {
    // Show category breakdown instead of duplicate list
    const active = reminders.filter((r) => !r.done);
    const byQuest: Record<string, number> = {};
    active.forEach((r) => { byQuest[r.quest] = (byQuest[r.quest] || 0) + 1; });
    const items = Object.entries(byQuest).map(([quest, count]) => `${quest}: ${count} reminder${count > 1 ? "s" : ""}`);
    const important = active.filter((r) => r.priority === "Important").length;
    return { label: "By Quest", value: `${important > 0 ? important + " ⚠️ " : ""}${active.length} active`, items };
  }
  return null;
}

/* ─── Component ────────────────────────────────────── */

type HomeFeedProps = {
  onOpenReminder: (reminderId: string) => void;
  setActiveView: (view: AppView) => void;
};

export function HomeFeed({ onOpenReminder, setActiveView }: HomeFeedProps) {
  const quests = getQuests();
  const reminders = getReminders();
  const paperQueue = getPaperTrailQueue();

  // Track dismissed/completed items locally for animation
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [actionQuip, setActionQuip] = useState<string | null>(null);
  const [quipType, setQuipType] = useState<"complete" | "dismiss" | null>(null);
  const [snoozingId, setSnoozingId] = useState<string | null>(null);
  const [snoozeQuip, setSnoozeQuip] = useState<string>("");
  const [snoozeToasts, setSnoozeToasts] = useState<SnoozeToast[]>([]);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [lastSnoozeTime, setLastSnoozeTime] = useState(0);
  // Debounce voice — stop previous audio, play escalated immediately
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const snoozeAccumulator = useRef(0);
  const snoozeBatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBatchCount = useRef(0);
  // Fix: ref-based snooze count tracks immediately (not waiting for 1.5s animation)
  const snoozeCountRef = useRef(0);
  // Interruption system — delay queue for audio
  const pendingQuipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQuipFn = useRef<(() => Promise<void>) | null>(null);
  const interruptionCount = useRef(0);
  // Track collapsing cards to animate height removal
  const [collapsingIds, setCollapsingIds] = useState<Set<string>>(new Set());
  // Fix: ref-based completion count (stays in sync with snoozeCountRef)
  const completedCountRef = useRef(0);
  // FIX: generation counter prevents stale async audio from playing after interruption
  const audioGenerationRef = useRef(0);

  // Auto-dismiss snooze toasts — each toast lives 3s, max 2 visible
  useEffect(() => {
    if (snoozeToasts.length === 0) return;
    const oldest = snoozeToasts[0];
    const timer = setTimeout(() => {
      setSnoozeToasts((prev) => prev.filter((t) => t.id !== oldest.id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [snoozeToasts]);

  // Build feed items
  const feedItems: FeedDatum[] = [];

  // Stats
  const totalOpenLedger = quests.reduce((s, q) => s + q.ledger.filter((l) => l.state === "Open" || l.state === "Draft").length, 0);
  const pendingReviews = paperQueue.filter((p) => p.state === "Review" || p.state === "Draft").length;
  const activeReminders = reminders.filter((r) => !r.done).length;

  if (totalOpenLedger > 0) feedItems.push(buildStatCard("Open Ledger", `$${totalOpenLedger}`, `${totalOpenLedger} items need attention`));
  if (pendingReviews > 0) feedItems.push(buildStatCard("Paper Review", `${pendingReviews} items`, `Receipts and docs to review`));
  feedItems.push(buildStatCard("Active Reminders", `${activeReminders}`, `Across ${quests.length} quests`));

  // Reminder line items
  const now = new Date();
  for (const reminder of reminders.filter((r) => !r.done)) {
    let overdueDays = 0;
    if (reminder.due && reminder.due !== "Soon") {
      const dueLower = reminder.due.toLowerCase();
      if (dueLower.includes("tomorrow")) overdueDays = -1;
      else if (dueLower.includes("today") || dueLower.includes("this week")) overdueDays = 0;
    }

    const mood = getMoodForReminder(reminder, overdueDays);
    const category = getCategoryForReminder(reminder);
    const body = buildCyonyBody(reminder, mood, overdueDays);

    feedItems.push({
      id: `reminder-${reminder.label}-${reminder.quest}`,
      type: "reminder",
      title: `${reminder.quest}`,
      body,
      mood,
      overdueDays: overdueDays >= 0 ? overdueDays : undefined,
      questName: reminder.quest,
      category,
    });
  }

  // Pick overall greeting mood — Cyony reads the room
  const [completedCount, setCompletedCount] = useState(0);
  const sessionStart = useRef(Date.now());

  const dominantMood = (() => {
    // Time of day
    const hour = new Date().getHours();
    const isEarlyMorning = hour >= 5 && hour < 8;
    const isLateNight = hour >= 22 || hour < 3;

    // Behavior-based auto-mood
    const snoozed = dismissedIds.size;
    const completed = completedCount;

    // Snoozed everything → unhinged
    if (snoozed >= 5 && completed === 0) return "unhinged";
    // Snoozed a lot → annoyed
    if (snoozed >= 3 && snoozed > completed) return "annoyed";
    // Completed a lot → doting
    if (completed >= 3 && completed > snoozed) return "doting";
    // Completed some, no snoozes → smug
    if (completed >= 1 && snoozed === 0) return "smug";
    // Early morning → groggy
    if (isEarlyMorning) return "groggy";
    // Late night → whisper
    if (isLateNight) return "whisper";
    // No items → chill
    if (feedItems.length === 0) return "chill";
    // Has overdue items → sassy
    if (feedItems.some((f) => f.mood === "annoyed")) return "sassy";
    // Default → confident
    return "confident";
  })();

  const greeting = feedItems.length === 0
    ? "Everything's quiet. Too quiet. *suspicious glance*"
    : pickGreeting(dominantMood);

  // Handlers
  function handleCompleteReminder(item: FeedDatum) {
    const idx = reminders.findIndex((r) => !r.done && `reminder-${r.label}-${r.quest}` === item.id);
    if (idx !== -1) {
      toggleReminder(idx);
    }
    setCompletedIds((prev) => new Set(prev).add(item.id));
    setCompletedCount((c) => c + 1);
    completedCountRef.current += 1;
    setActionQuip(pickQuip(CYONY_COMPLETE_QUIPS));
    setQuipType("complete");
    setTimeout(() => { setActionQuip(null); setQuipType(null); }, 4000);

    // ALWAYS use delayed quip system — first action uses short delay so next action can interrupt
    const snoozedSoFar = snoozeCountRef.current;
    const completedSoFar = completedCountRef.current;
    const activeInStore = reminders.filter(r => !r.done).length;
    const trueTotal = activeInStore + completedSoFar;
    const remaining = Math.max(0, trueTotal - snoozedSoFar - completedSoFar);

    // Bump generation — stale async quipFns from previous actions will abort
    const gen = ++audioGenerationRef.current;

    scheduleDelayedQuip(
      async () => { if (audioGenerationRef.current === gen) playRandomCyonyQuip("c", 5, currentAudioRef); },
      pendingQuipTimer,
      pendingQuipFn,
      interruptionCount,
      currentAudioRef,
      false,
      snoozedSoFar,
      completedSoFar,
      remaining,
    );
  }

  function handleDismissReminder(item: FeedDatum) {
    setSnoozingId(item.id);

    snoozeCountRef.current += 1;
    const snoozedSoFar = snoozeCountRef.current;
    const completedSoFar = completedCountRef.current;

    // Always recalculate trueTotal from store + completed ref
    const activeInStore = reminders.filter(r => !r.done).length;
    const trueTotal = activeInStore + completedSoFar;
    const remaining = Math.max(0, trueTotal - snoozedSoFar - completedSoFar);
    const isLast = remaining <= 0;
    const now = Date.now();
    const rapidFire = now - lastSnoozeTime < 1000;
    setLastSnoozeTime(now);
    setSnoozeCount(snoozedSoFar);

    const { text, tier } = generateSnoozeQuip({
      snoozedSoFar,
      completedSoFar,
      remaining,
      total: trueTotal,
      rapidFire,
      isLast,
    });

    setSnoozeQuip(text);

    setSnoozeToasts((prev) => {
      const newToast: SnoozeToast = { id: now, text, tier, count: snoozedSoFar };
      const updated = [...prev, newToast];
      return updated.length > 2 ? updated.slice(-2) : updated;
    });

    // Audio tier selection
    let audioPrefix = "s0";
    let audioPoolSize = 5;
    if (isLast) { audioPrefix = "s5"; }
    else if (rapidFire && snoozedSoFar >= 3) { audioPrefix = "sr"; }
    else if (snoozedSoFar >= 5) { audioPrefix = "s4"; }
    else if (snoozedSoFar >= 4) { audioPrefix = "s3"; }
    else if (snoozedSoFar >= 3) { audioPrefix = "s2"; }
    else if (snoozedSoFar >= 2) { audioPrefix = "s1"; }

    // Bump generation — stale async quipFns from previous actions will abort
    const gen = ++audioGenerationRef.current;

    // ALWAYS use delayed quip system — ensures next action can interrupt
    scheduleDelayedQuip(
      async () => {
        if (audioGenerationRef.current !== gen) return; // stale — another action fired
        playRandomCyonyQuip(audioPrefix, audioPoolSize, currentAudioRef).then((played) => {
          if (audioGenerationRef.current !== gen) return; // stale again (double-check)
          if (!played) speakWithTTS(text, currentAudioRef);
        });
      },
      pendingQuipTimer,
      pendingQuipFn,
      interruptionCount,
      currentAudioRef,
      true,
      snoozedSoFar,
      completedSoFar,
      remaining,
    );

    // Log snooze server-side (for Cyony accountability ping)
    fetch("/api/snooze-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: item.body?.slice(0, 80) || item.title, quest: item.questName || "" }),
    }).catch(() => {});

    // Don't remove from list yet — let the shrink animation play
    setTimeout(() => {
      setDismissedIds((prev) => new Set(prev).add(item.id));
      setSnoozingId(null);
    }, 1500); // 1.5s — fast enough for rapid-fire snoozing
  }

  function handleStatTap(statId: string, title: string) {
    // Active Reminders is static — no expansion
    if (title === "Active Reminders") return;
    setExpandedStat(expandedStat === statId ? null : statId);
  }

  const visibleReminders = feedItems.filter((f) => f.type === "reminder" && !dismissedIds.has(f.id) && !completedIds.has(f.id));

  return (
    <div className="home-feed">
      <div className="feed-greeting" data-mood={dominantMood}>
        <p>{greeting}</p>
      </div>

      {/* Pulse stats — sticky buttons row */}
      {feedItems.filter((f) => f.type === "stat").length > 0 && (
        <section className="feed-stats">
          {feedItems.filter((f) => f.type === "stat").map((stat) => {
            const isExpanded = expandedStat === stat.id;

            return (
              <button
                key={stat.id}
                className={`feed-stat-card ${isExpanded ? "feed-stat-expanded" : ""} ${stat.title === "Active Reminders" ? "feed-stat-static" : ""}`}
                onClick={() => handleStatTap(stat.id, stat.title)}
                type="button"
              >
                <span className="feed-stat-value">{stat.body.split(" — ")[0]}</span>
                <span className="feed-stat-label">{stat.title}</span>
                <span className="feed-stat-detail">{stat.body.split(" — ")[1] || ""}</span>
                {stat.title !== "Active Reminders" && (
                  <span className="feed-stat-expand-hint">{isExpanded ? "▲" : "▼"}</span>
                )}
              </button>
            );
          })}
        </section>
      )}

      {/* Expanded detail panel — appears BELOW the sticky row */}
      {expandedStat && (() => {
        const stat = feedItems.find((f) => f.type === "stat" && f.id === expandedStat);
        if (!stat) return null;
        const details = getStatDetails(stat.title, quests, reminders);
        if (!details) return null;
        return (
          <div className="feed-stat-detail-container">
            <div className="feed-stat-connector" />
            <div className="feed-stat-detail-panel">
              <div className="feed-stat-detail-header">
                <span>{details.label}</span>
                <span className="feed-stat-detail-count">{details.value}</span>
              </div>
              {details.items.length === 0 ? (
                <p className="feed-stat-detail-empty">Nothing here. Enjoy the silence.</p>
              ) : (
                <ul className="feed-stat-detail-list">
                  {details.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {stat.title !== "Active Reminders" && (
                <button
                  className="feed-stat-detail-action"
                  onClick={(e) => { e.stopPropagation(); setActiveView(stat.title === "Paper Review" ? "Paper Trail" : "Ledger"); }}
                  type="button"
                >
                  View all →
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Reminder line items */}
      {visibleReminders.length > 0 && (
        <section className="feed-reminders">
          <div className="feed-section-head">
            <span className="feed-section-title">Reminders</span>
            <span className="feed-section-count">{visibleReminders.length}</span>
          </div>
          <div className="feed-reminder-list">
            {visibleReminders.map((item) => (
              <SwipeableCard
                key={item.id}
                onSwipeRight={() => handleCompleteReminder(item)}
                onSwipeLeft={() => handleDismissReminder(item)}
                onTap={() => onOpenReminder(item.id)}
                rightAction={{
                  direction: "right",
                  label: "Done",
                  icon: "✓",
                  color: "#64c896",
                  bgColor: "rgba(100, 200, 150, 0.15)",
                }}
                leftAction={{
                  direction: "left",
                  label: "Snooze",
                  icon: "💤",
                  color: "#6ea8fe",
                  bgColor: "rgba(110, 168, 254, 0.15)",
                }}
              >
                <div
                  className="feed-reminder-item"
                  data-mood={item.mood}
                  data-category={item.category}
                >
                  <div className="feed-reminder-header">
                    <span className="feed-reminder-category">{item.category}</span>
                    {item.overdueDays !== undefined && item.overdueDays >= 0 && (
                      <span className="feed-reminder-overdue" data-severity={item.overdueDays >= 3 ? "high" : item.overdueDays >= 1 ? "mid" : "low"}>
                        {item.overdueDays === 0 ? "Due soon" : `${item.overdueDays}d overdue`}
                      </span>
                    )}
                  </div>
                  <p className="feed-reminder-body">{item.body}</p>
                </div>
              </SwipeableCard>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {feedItems.length === 0 && (
        <div className="feed-empty">
          <p>Nothing needs your attention right now.</p>
          <p className="muted">Which means either everything is fine, or you've forgotten something. I'm betting on door number two.</p>
        </div>
      )}

    </div>
  );
}
