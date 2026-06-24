"use client";

import { useState, useRef, type ReactNode } from "react";

type SwipeAction = {
  direction: "left" | "right";
  label: string;
  icon: string;
  color: string;
  bgColor: string;
};

type SwipeableCardProps = {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  onTap?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  /** Rendered below the card when snoozed/dismissed */
  mutterBubble?: ReactNode;
};

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  onTap,
  className = "",
  style,
  disabled = false,
  mutterBubble,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [phase, setPhase] = useState<"idle" | "dragging" | "shrinking" | "tucked" | "done">("idle");
  const [tuckSide, setTuckSide] = useState<"left" | "right" | null>(null);
  const [showHint, setShowHint] = useState<"left" | "right" | null>(null);
  const touchStart = useRef(0);
  const startTime = useRef(0);
  const isDragging = useRef(false);

  const threshold = 80;
  const hintThreshold = 30;

  function handleStart(clientX: number) {
    if (disabled || phase === "tucked" || phase === "done") return;
    touchStart.current = clientX;
    startTime.current = Date.now();
    isDragging.current = true;
    setPhase("dragging");
  }

  function handleMove(clientX: number) {
    if (!isDragging.current || disabled) return;
    const dx = clientX - touchStart.current;
    setOffset(dx);

    if (dx > hintThreshold && rightAction) {
      setShowHint("right");
    } else if (dx < -hintThreshold && leftAction) {
      setShowHint("left");
    } else {
      setShowHint(null);
    }
  }

  function handleEnd() {
    if (!isDragging.current || disabled) return;
    isDragging.current = false;

    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(offset) / elapsed;
    const isFlick = velocity > 0.5 && Math.abs(offset) > 30;

    if (offset > threshold || (isFlick && offset > 0 && rightAction)) {
      // Swipe right → complete (fly off)
      setPhase("done");
      // Fire callback IMMEDIATELY — audio plays on swipe, not after animation
      onSwipeRight?.();
    } else if (offset < -threshold || (isFlick && offset < 0 && leftAction)) {
      // Swipe left → snooze (shrink & tuck)
      setTuckSide("left");
      setPhase("shrinking");
      // Fire callback IMMEDIATELY — audio plays on swipe, not after delay
      onSwipeLeft?.();
      setTimeout(() => {
        setPhase("tucked");
        // Brief tuck, then fade out
        setTimeout(() => {
          setPhase("done");
        }, 800);
      }, 400);
    } else {
      // Tap check
      if (Math.abs(offset) < 10 && elapsed < 300 && onTap) {
        onTap();
      }
      setOffset(0);
      setPhase("idle");
    }
    setShowHint(null);
  }

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse handlers
  const [mouseDown, setMouseDown] = useState(false);
  const onMouseDown = (e: React.MouseEvent) => { setMouseDown(true); handleStart(e.clientX); };
  const onMouseMove = (e: React.MouseEvent) => { if (mouseDown) handleMove(e.clientX); };
  const onMouseUp = () => { setMouseDown(false); handleEnd(); };
  const onMouseLeave = () => { if (mouseDown) { setMouseDown(false); setOffset(0); setPhase("idle"); setShowHint(null); } };

  const action = showHint === "right" ? rightAction : showHint === "left" ? leftAction : null;
  const progress = Math.min(Math.abs(offset) / threshold, 1);

  // Build card classes
  let cardClass = "swipeable-card";
  if (phase === "done" && tuckSide === null) cardClass += " swipeable-card-flyaway";
  if (phase === "shrinking") cardClass += ` swipeable-card-shrink-${tuckSide}`;
  if (phase === "tucked") cardClass += ` swipeable-card-tucked-${tuckSide}`;
  if (phase === "done" && tuckSide) cardClass += " swipeable-card-fade-out";

  // Outer wrapper gets collapsing class when done with snooze animation
  // This removes vertical space so snoozed cards don't stack on live ones
  let outerClass = `swipeable-card-outer ${className}`;
  if (phase === "done" && tuckSide) outerClass += " swipeable-card-outer-collapse";

  return (
    <div className={outerClass} style={style}>
      {/* The card + action reveal */}
      <div className="swipeable-card-wrapper">
        {/* Action reveal layer (behind the card) */}
        {action && phase === "dragging" && (
          <div
            className="swipeable-action-reveal"
            style={{
              opacity: progress,
              background: action.bgColor,
              alignItems: showHint === "right" ? "flex-start" : "flex-end",
            }}
          >
            <span className="swipeable-action-icon" style={{ color: action.color }}>
              {action.icon}
            </span>
            <span className="swipeable-action-label" style={{ color: action.color }}>
              {action.label}
            </span>
          </div>
        )}

        {/* The card itself */}
        <div
          className={cardClass}
          style={{
            transform: phase === "dragging" || phase === "idle"
              ? `translateX(${offset}px) rotate(${offset * 0.06}deg)`
              : undefined,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {children}
        </div>
      </div>

      {/* Mutter bubble — appears after tuck */}
      {(phase === "tucked" || (phase === "done" && tuckSide)) && mutterBubble && (
        <div className="swipeable-mutter-bubble">
          {mutterBubble}
        </div>
      )}
    </div>
  );
}
