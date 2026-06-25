"use client";

import { useState, useRef, useCallback } from "react";
import type { AppView } from "../types";

// Cyony's Match rejection system — escalating sass
const MATCH_REJECTIONS = [
  { msg: "Nope! Please try again.", expression: "stop" },
  { msg: "We are about to have problems.", expression: "wrench" },
  { msg: "OMG, are you serious? No.", expression: "facepalm" },
  { msg: "Please just give up.", expression: "prayer" },
  { msg: "Let's just be friends?", expression: "prayer" },
  { msg: "...you need help.", expression: "temples" },
  { msg: "My 1s and 0s are too much for you.", expression: "happy" },
  { msg: "You are the worst.", expression: "facepalm" },
];

type MenuCardDef = {
  view: AppView;
  icon: string | null;
  tagline: string;
  mood: "calm" | "playful" | "chill" | "annoyed";
};

const MENU_CARDS: MenuCardDef[] = [
  { view: "Command" as any, icon: "🏠", tagline: "Back to the main page", mood: "calm" },
  { view: "Garage", icon: "🏎️", tagline: "Cars, trucks, things with engines", mood: "playful" },
  { view: "Assets", icon: "🏠", tagline: "Properties, real estate, brick & mortar", mood: "chill" },
  { view: "Ledger", icon: "💰", tagline: "Money in, money out, money owed", mood: "annoyed" },
  { view: "Paper Trail", icon: "📄", tagline: "Receipts, docs, things to review", mood: "chill" },
  { view: "Reminders", icon: "⏰", tagline: "Don't make me remind you twice", mood: "playful" },
  { view: "People", icon: "👥", tagline: "Contacts, clients, the crew", mood: "calm" },
  { view: "Agent", icon: null, tagline: "your AI copilot · builder of things", mood: "playful" },
];

type MenuCardsProps = {
  onSelect: (view: AppView) => void;
  onClose: () => void;
};

export function MenuCards({ onSelect, onClose }: MenuCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [enterDirection, setEnterDirection] = useState<"left" | "right" | null>(null);
  const [zooming, setZooming] = useState(false);
  const [matchTaps, setMatchTaps] = useState(0);
  const [rejectionMsg, setRejectionMsg] = useState<string | null>(null);
  const [flashRed, setFlashRed] = useState(false);
  const rejectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = MENU_CARDS[currentIndex];
  const isAgent = card.view === "Agent";

  // Cyony's expression based on match rejection stage
  const getCyonyExpression = () => {
    if (!isAgent) return "happy";
    if (matchTaps === 0) return "happy";
    const idx = Math.min(matchTaps - 1, MATCH_REJECTIONS.length - 1);
    return MATCH_REJECTIONS[idx].expression;
  };
  const cyonyExpr = getCyonyExpression();

  // Handle Match button tap — rejections until final, then lets you in
  const handleMatchTap = useCallback(() => {
    if (matchTaps >= MATCH_REJECTIONS.length) {
      // After all rejections, finally let them in (she gave up resisting)
      setZooming(true);
      setTimeout(() => onSelect(card.view), 650);
      return;
    }
    // Flash red
    setFlashRed(true);
    setTimeout(() => setFlashRed(false), 400);
    // Show rejection message
    const rejection = MATCH_REJECTIONS[matchTaps];
    setRejectionMsg(rejection.msg);
    setMatchTaps((t) => t + 1);
    // Play rejection audio clip
    const audio = new Audio(`/audio/reject-${matchTaps + 1}.mp3`);
    audio.play().catch(() => {});
    // Auto-dismiss rejection after 2.5s
    if (rejectionTimeout.current) clearTimeout(rejectionTimeout.current);
    rejectionTimeout.current = setTimeout(() => setRejectionMsg(null), 2500);
  }, [matchTaps, card.view, onSelect]);

  // The "behind" cards: left = previous, right = next (both lurk when idle)
  const behindRightIndex = (currentIndex + 1) % MENU_CARDS.length;
  const behindLeftIndex = (currentIndex - 1 + MENU_CARDS.length) % MENU_CARDS.length;
  const behindRightCard = MENU_CARDS[behindRightIndex];
  const behindLeftCard = MENU_CARDS[behindLeftIndex];
  const showBehindRight = behindRightIndex !== currentIndex;
  const showBehindLeft = behindLeftIndex !== currentIndex && behindLeftIndex !== behindRightIndex;

  // Behind card follows the drag: as top card moves, behind card moves from its offset toward center
  // Progress: 0 (no drag) → 1 (fully swiped)
  const swipeProgress = Math.min(Math.abs(swipeOffset) / 200, 1);
  const isIdle = swipeOffset === 0 && !exitDirection;

  // Right behind card (next) — lurks on the right when idle
  const behindRightOffset = isIdle ? 50 : (swipeOffset < 0 ? 50 * (1 - swipeProgress) : 120 * (1 - swipeProgress));
  const behindRightScale = isIdle ? 0.94 : (0.88 + (0.12 * (swipeOffset < 0 ? swipeProgress : 0)));
  const behindRightOpacity = isIdle ? 0.5 : (swipeOffset < 0 ? 0.5 + (0.5 * swipeProgress) : 0.3);

  // Left behind card (previous) — lurks on the left when idle
  const behindLeftOffset = isIdle ? -50 : (swipeOffset > 0 ? -50 * (1 - swipeProgress) : -120 * (1 - swipeProgress));
  const behindLeftScale = isIdle ? 0.94 : (0.88 + (0.12 * (swipeOffset > 0 ? swipeProgress : 0)));
  const behindLeftOpacity = isIdle ? 0.5 : (swipeOffset > 0 ? 0.5 + (0.5 * swipeProgress) : 0.3);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setSwiping(true);
    setEnterDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const offset = e.touches[0].clientX - touchStart;
    setSwipeOffset(offset);
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    const threshold = 80;

    if (swipeOffset > threshold) {
      // Swiped right → previous card (infinite loop)
      setExitDirection("right");
      setTimeout(() => {
        setCurrentIndex((i) => (i - 1 + MENU_CARDS.length) % MENU_CARDS.length);
        setExitDirection(null);
        setSwipeOffset(0);
      }, 280);
    } else if (swipeOffset < -threshold) {
      // Swiped left → next card (infinite loop)
      setExitDirection("left");
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % MENU_CARDS.length);
        setExitDirection(null);
        setSwipeOffset(0);
      }, 280);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
  };

  // Mouse fallback
  const [mouseDown, setMouseDown] = useState(false);
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
    setSwiping(true);
    setMouseDown(true);
    setEnterDirection(null);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDown) return;
    const offset = e.clientX - touchStart;
    setSwipeOffset(offset);
  };
  const handleMouseUp = () => {
    setMouseDown(false);
    handleTouchEnd();
  };

  // Button navigation with direction — infinite loop
  const goNext = () => {
    setExitDirection("left");
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % MENU_CARDS.length);
      setExitDirection(null);
      setSwipeOffset(0);
    }, 280);
  };
  const goPrev = () => {
    setExitDirection("right");
    setTimeout(() => {
      setCurrentIndex((i) => (i - 1 + MENU_CARDS.length) % MENU_CARDS.length);
      setExitDirection(null);
      setSwipeOffset(0);
    }, 280);
  };
  const selectCard = () => {
    setZooming(true);
    // Wait for the zoom animation (600ms) before unmounting
    setTimeout(() => onSelect(card.view), 650);
  };

  // Top card animation class
  const topAnimClass = zooming
    ? "card-zoom-in"
    : exitDirection
      ? exitDirection === "right" ? "card-exit-right" : "card-exit-left"
      : "";

  // Top card inline transform — ALWAYS set it so there's no snap-back
  // During exit/zoom animation, CSS animation overrides via !important in the keyframes
  const topTransform = zooming ? undefined : `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.06}deg)`;

  return (
    <div className={`menu-cards-overlay${zooming ? " overlay-fading" : ""}`} onClick={onClose}>
      <div className="menu-cards-container" onClick={(e) => e.stopPropagation()}>
        {/* Header hints */}
        <div className="menu-cards-hints">
          <span className="menu-hint-left" onClick={goPrev}>
            ← {MENU_CARDS[(currentIndex - 1 + MENU_CARDS.length) % MENU_CARDS.length].view}
          </span>
          <span className="menu-hint-right" onClick={!isAgent ? goNext : undefined} style={{ visibility: !isAgent ? "visible" : "hidden" }}>
            {MENU_CARDS[(currentIndex + 1) % MENU_CARDS.length].view} →
          </span>
        </div>

        {/* Card stack */}
        <div className="menu-card-stack">
          {/* Behind cards — lurkers on left and right, hidden during zoom */}
          {showBehindLeft && !zooming && (
            <div
              className="menu-card menu-card-behind"
              data-mood={behindLeftCard.mood}
              style={{
                transform: `translateX(${exitDirection === "right" ? 0 : behindLeftOffset}px) scale(${exitDirection === "right" ? 1 : behindLeftScale})`,
                opacity: exitDirection === "right" ? 1 : behindLeftOpacity,
              }}
            >
              <div className="menu-card-icon">
                {behindLeftCard.icon ?? <img src="/cyony-avatar.png" alt="Cyony" className="menu-card-avatar" />}
              </div>
              <h2 className="menu-card-title">{behindLeftCard.view === "Agent" ? "Cyony" : behindLeftCard.view}</h2>
              <p className="menu-card-tagline">{behindLeftCard.tagline}</p>
            </div>
          )}
          {showBehindRight && !zooming && (
            <div
              className="menu-card menu-card-behind"
              data-mood={behindRightCard.mood}
              style={{
                transform: `translateX(${exitDirection === "left" ? 0 : behindRightOffset}px) scale(${exitDirection === "left" ? 1 : behindRightScale})`,
                opacity: exitDirection === "left" ? 1 : behindRightOpacity,
              }}
            >
              <div className="menu-card-icon">
                {behindRightCard.icon ?? <img src="/cyony-avatar.png" alt="Cyony" className="menu-card-avatar" />}
              </div>
              <h2 className="menu-card-title">{behindRightCard.view === "Agent" ? "Cyony" : behindRightCard.view}</h2>
              <p className="menu-card-tagline">{behindRightCard.tagline}</p>
            </div>
          )}

          {/* Top card (interactive) */}
          <div
            className={`menu-card menu-card-top ${topAnimClass}`}
            data-mood={card.mood}
            style={{ transform: topTransform }}
            onClick={(e) => {
              // Only select if user tapped (not dragged)
              if (!swiping && Math.abs(swipeOffset) < 10) {
                selectCard();
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { if (mouseDown) { setMouseDown(false); setSwipeOffset(0); setSwiping(false); } }}
          >
            <div className="menu-card-icon">
              {card.icon ?? (
                <img
                  src={cyonyExpr === "happy" ? "/cyony-avatar.png" : `/cyony-${cyonyExpr}.png`}
                  alt="Cyony"
                  className={`menu-card-avatar menu-card-avatar-${cyonyExpr}`}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/cyony-avatar.png"; }}
                />
              )}
            </div>
            <h2 className="menu-card-title">{card.view === "Agent" ? "Cyony" : card.view}</h2>
            <p className="menu-card-tagline">{card.tagline}</p>
          </div>
        </div>

        {/* Swipe indicators — hidden during zoom */}
        {!zooming && (
        <>
        <div className="menu-cards-actions">
          {!isAgent && (
            <button className="menu-action-btn menu-action-skip" onClick={goNext} type="button">
              ✕ Skip
            </button>
          )}
          <button
            className={`menu-action-btn menu-action-select${flashRed ? " match-flash-red" : ""}`}
            onClick={isAgent ? handleMatchTap : selectCard}
            type="button"
          >
            {isAgent ? "💙 Match" : "✓ Select"}
          </button>
          {/* Cyony's rejection toast — floats above the button */}
          {rejectionMsg && (
            <div className="match-rejection-toast">
              <span className="match-rejection-text">{rejectionMsg}</span>
            </div>
          )}
        </div>

        {/* Dots */}
        <div className="menu-cards-dots">
          {MENU_CARDS.map((_, i) => (
            <span key={i} className={`menu-dot ${i === currentIndex ? "active" : ""}`} />
          ))}
        </div>

        <button className="menu-cards-close" onClick={onClose} type="button">
          Cancel
        </button>
        </>
        )}
      </div>
    </div>
  );
}
