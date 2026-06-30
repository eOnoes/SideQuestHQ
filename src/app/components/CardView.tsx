"use client";

import { useState, useCallback, type FormEvent } from "react";
import type { Quest, Reminder, CardCategory } from "../types";
import { getReminders, getQuests, toggleReminder } from "@/lib/store";

/* ─── Card types ──────────────────────────────────── */

export type CardItem = {
  id: string;
  type: "reminder" | "quest" | "asset";
  title: string;
  subtitle: string;
  body: string;
  category: CardCategory;
  mood: "calm" | "annoyed" | "playful" | "chill";
  actions: Array<{
    label: string;
    action: "dismiss" | "complete" | "mark-paid" | "view-details" | "silence-month";
    primary?: boolean;
  }>;
  questName?: string;
  value?: string;
  progress?: number;
  overdueDays?: number;
};

const CATEGORY_LABELS: Record<CardCategory, string> = {
  all: "All",
  rental: "Rentals",
  garage: "Garage",
  investment: "Investments",
  customer: "Customers",
  general: "General",
};

type CardViewProps = {
  initialCategory?: CardCategory;
  onBack: () => void;
  onViewDetails: (questName: string) => void;
};

export function CardView({ initialCategory = "all", onBack, onViewDetails }: CardViewProps) {
  const [activeCategory, setActiveCategory] = useState<CardCategory>(initialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Build cards from data
  const quests = getQuests();
  const reminders = getReminders();
  const allCards: CardItem[] = buildCards(reminders, quests);
  const filteredCards = activeCategory === "all"
    ? allCards
    : allCards.filter((c) => c.category === activeCategory);
  const visibleCards = filteredCards.filter((c) => !dismissedIds.has(c.id));
  const currentCard = visibleCards[currentIndex];

  const categories: CardCategory[] = ["all", "rental", "garage", "investment", "customer"];

  const handleAction = useCallback((action: CardItem["actions"][number]) => {
    if (!currentCard) return;
    if (action.action === "dismiss" || action.action === "silence-month") {
      setDismissedIds((prev) => new Set(prev).add(currentCard.id));
      if (currentIndex >= visibleCards.length - 1) {
        setCurrentIndex(Math.max(0, visibleCards.length - 2));
      }
    }
    if (action.action === "complete" && currentCard.questName) {
      const idx = reminders.findIndex((r) => r.quest === currentCard.questName && r.label === currentCard.title);
      if (idx !== -1) toggleReminder(idx);
      setDismissedIds((prev) => new Set(prev).add(currentCard.id));
    }
    if (action.action === "view-details" && currentCard.questName) {
      onViewDetails(currentCard.questName);
    }
  }, [currentCard, currentIndex, visibleCards, reminders, onViewDetails]);

  // Touch/swipe handlers
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setSwiping(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setSwipeOffset(e.touches[0].clientX - touchStart);
  };
  const handleTouchEnd = () => {
    setSwiping(false);
    if (swipeOffset > 60) {
      // swiped right — prev, with infinite loop
      setCurrentIndex((i) => (i - 1 + visibleCards.length) % visibleCards.length);
    } else if (swipeOffset < -60) {
      // swiped left — next, with infinite loop
      setCurrentIndex((i) => (i + 1) % visibleCards.length);
    }
    setSwipeOffset(0);
  };

  if (visibleCards.length === 0) {
    return (
      <div className="card-view">
        <div className="card-view-top">
          <button className="card-view-back" onClick={onBack} type="button">« Back</button>
          <div className="card-view-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className="card-filter-btn"
                data-active={activeCategory === cat}
                onClick={() => { setActiveCategory(cat); setCurrentIndex(0); }}
                type="button"
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
        <div className="card-view-empty">
          <p>All clear in this category.</p>
          <p className="muted">Cyony's proud of you. Don't let it go to your head.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-view">
      {/* Top bar */}
      <div className="card-view-top">
        <button className="card-view-back" onClick={onBack} type="button">« Back</button>
        <div className="card-view-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className="card-filter-btn"
              data-active={activeCategory === cat}
              onClick={() => { setActiveCategory(cat); setCurrentIndex(0); }}
              type="button"
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Mood bar */}
      <div className="card-mood-bar" data-mood={currentCard?.mood}>
        <div className="card-mood-content">
          <span className="card-mood-icon">{currentCard?.type === "quest" ? "⚔️" : currentCard?.type === "asset" ? "🏠" : "📋"}</span>
          <p>{getMoodText(currentCard)}</p>
        </div>
      </div>

      {/* Card */}
      <div
        className="card-deck"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentCard && (
          <div className="card-view-card" data-mood={currentCard.mood}>
            <div className="card-category-tag" data-category={currentCard.category}>
              {CATEGORY_LABELS[currentCard.category]}
            </div>

            <div className="card-header">
              <h3>{currentCard.title}</h3>
              {currentCard.value && <strong className="card-value">{currentCard.value}</strong>}
            </div>

            <div className="card-divider" />

            <div className="card-body">
              <p className="card-subtitle">{currentCard.subtitle}</p>
              <p className="card-main-text">{currentCard.body}</p>
              {currentCard.progress !== undefined && (
                <div className="card-progress">
                  <div className="card-progress-bar">
                    <span style={{ width: `${currentCard.progress}%` }} />
                  </div>
                  <span>{currentCard.progress}%</span>
                </div>
              )}
              {currentCard.overdueDays !== undefined && currentCard.overdueDays > 0 && (
                <div className="card-overdue-badge" data-severity={currentCard.overdueDays >= 3 ? "high" : "mid"}>
                  {currentCard.overdueDays}d overdue
                </div>
              )}
            </div>

            <div className="card-actions">
              {currentCard.actions.map((action) => (
                <button
                  key={action.label}
                  className={`card-action-btn${action.primary ? " primary" : ""}`}
                  onClick={() => handleAction(action)}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Swipe indicator */}
      <div className="card-swipe-indicator">
        <span>◄ {currentIndex + 1} of {visibleCards.length} ►</span>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────── */

function buildCards(reminders: Reminder[], quests: Quest[]): CardItem[] {
  const cards: CardItem[] = [];

  for (const reminder of reminders.filter((r) => !r.done)) {
    const category = getCardCategory(reminder);
    const overdueDays = estimateOverdue(reminder.due);
    const mood = overdueDays >= 3 ? "annoyed" : overdueDays >= 1 ? "calm" : reminder.priority === "Important" ? "playful" : "chill";

    const actions = [
      { label: "Mark Done", action: "complete" as const, primary: true },
      { label: "Silence Month", action: "silence-month" as const },
      { label: "View Details", action: "view-details" as const },
    ];

    const relatedQuest = quests.find((q) => q.name === reminder.quest);

    cards.push({
      id: `reminder-card-${reminder.label}-${reminder.quest}`,
      type: "reminder",
      title: reminder.label,
      subtitle: reminder.quest,
      body: buildCardBody(reminder, mood),
      category,
      mood,
      actions,
      questName: reminder.quest,
      value: reminder.priority === "Important" ? "⚠ Important" : undefined,
      progress: relatedQuest?.progress,
      overdueDays,
    });
  }

  // Also add quests that have no reminders but need attention
  for (const quest of quests) {
    const hasReminder = reminders.some((r) => r.quest === quest.name);
    if (hasReminder) continue;
    if (quest.status === "Discovery" || quest.status === "Active") {
      const category = getCardCategoryFromQuest(quest);
      cards.push({
        id: `quest-card-${quest.name}`,
        type: "quest",
        title: quest.name,
        subtitle: quest.type,
        body: quest.nextMove || quest.summary,
        category,
        mood: "chill",
        actions: [
          { label: "View Details", action: "view-details" as const, primary: true },
          { label: "Dismiss", action: "dismiss" as const },
        ],
        questName: quest.name,
        value: quest.value,
        progress: quest.progress,
      });
    }
  }

  return cards;
}

function getCardCategory(reminder: Reminder): CardCategory {
  const q = reminder.quest.toLowerCase();
  if (q.includes("rental") || q.includes("property") || q.includes("lee") || q.includes("maple")) return "rental";
  if (q.includes("garage") || q.includes("truck") || q.includes("vehicle") || q.includes("f-150") || q.includes("oil")) return "garage";
  if (q.includes("invest") || q.includes("401k") || q.includes("crypto") || q.includes("stock")) return "investment";
  if (q.includes("customer") || q.includes("estimate") || q.includes("client") || q.includes("build")) return "customer";
  return "general";
}

function getCardCategoryFromQuest(quest: Quest): CardCategory {
  const n = quest.name.toLowerCase();
  if (n.includes("rental") || n.includes("property") || n.includes("maple")) return "rental";
  if (n.includes("garage") || n.includes("truck") || n.includes("vehicle")) return "garage";
  if (n.includes("invest") || n.includes("401k") || n.includes("crypto")) return "investment";
  if (n.includes("customer") || n.includes("estimate") || n.includes("build")) return "customer";
  return "general";
}

function estimateOverdue(due: string): number {
  const d = due.toLowerCase();
  if (d.includes("overdue") || d.includes("late")) return 3;
  if (d.includes("today")) return 0;
  if (d.includes("tomorrow")) return -1;
  if (d.includes("yesterday")) return 1;
  if (d.includes("week")) return -3;
  return 0;
}

function buildCardBody(reminder: Reminder, mood: string): string {
  if (mood === "annoyed") {
    return `"We talked about this. ${reminder.label}. ${reminder.quest}. I'm not repeating myself."`;
  }
  if (mood === "playful") {
    return `"Sugar... ${reminder.label} is waiting on ${reminder.quest}. Go on. You got this."`;
  }
  if (mood === "chill") {
    return `"Whenever. ${reminder.label} on ${reminder.quest}. It'll keep."`;
  }
  return `"${reminder.label} for ${reminder.quest}. Due ${reminder.due}. Just so we're on the same page."`;
}

function getMoodText(card: CardItem | undefined): string {
  if (!card) return "";
  switch (card.mood) {
    case "annoyed": return "😤 Alright, let's see what we're ignoring today.";
    case "playful": return "😏 Look what we have here...";
    case "chill": return "😌 No rush. Let's take a look.";
    case "calm": return "🧐 Let's review, shall we?";
  }
}
