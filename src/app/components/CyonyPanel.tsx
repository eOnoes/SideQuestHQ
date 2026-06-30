"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { addReminder, addChatMessage } from "@/lib/store";

const FONT_MIN = 12
const FONT_MAX = 22
const FONT_DEFAULT = 15

type CyonyPanelProps = {
  onClose: () => void;
  onOpenMenu: () => void;
  onRequestSent: (mode: "text" | "voice") => void;
  mood?: string;
  onMoodChange?: (mood: string) => void;
};

export function CyonyPanel({ onClose, onOpenMenu, onRequestSent, mood: externalMood, onMoodChange }: CyonyPanelProps) {
  const [mode, setMode] = useState<"choose" | "compose" | "options">("choose");
  const [input, setInput] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('sqhq-cyony-draft') || ''
  });
  const [voiceMode, setVoiceMode] = useState<"text" | "voice">("text");
  const [sending, setSending] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return FONT_DEFAULT
    const stored = localStorage.getItem('sqhq-font-size')
    return stored ? parseInt(stored, 10) : FONT_DEFAULT
  })
  // Persist draft
  useEffect(() => {
    if (input) localStorage.setItem('sqhq-cyony-draft', input)
  }, [input])
  const pendingRef = useRef(false);

  const applyFontSize = (size: number) => {
    const clamped = Math.max(FONT_MIN, Math.min(FONT_MAX, size))
    setFontSize(clamped)
    // Use zoom to scale the entire UI proportionally (overrides won't fight it)
    const scale = clamped / FONT_DEFAULT
    document.documentElement.style.zoom = String(scale)
    document.documentElement.style.setProperty('--app-font-size', `${clamped}px`)
    localStorage.setItem('sqhq-font-size', String(clamped))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pendingRef.current) return;
    setInput("");
    localStorage.removeItem('sqhq-cyony-draft');
    setSending(true);
    pendingRef.current = true;
    sendToCyony(text);
  }

  async function sendToCyony(text: string) {
    // Save user message
    addChatMessage("user", text);

    // Check if it's a simple command
    if (text.toLowerCase().startsWith("remind") || text.toLowerCase().startsWith("add reminder")) {
      const label = text.replace(/^(remind me|remind|add reminder)( to|:|,)?\s*/i, "").trim();
      if (label) {
        addReminder({ label, quest: "Side Quest", due: "Soon", priority: "Normal", done: false });
        addChatMessage("cyony", `Done. Added '${label}' to your reminders. You're welcome. 😏`);
      }
      pendingRef.current = false;
      setSending(false);
      onRequestSent(voiceMode);
      return;
    }

    // General request — hit the voice API
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mood: "calm" }),
      });
      if (res.ok) {
        const data = await res.json();
        addChatMessage("cyony", data.text || "...I got nothing. That's rare.");

        // If voice mode, play the audio response
        if (voiceMode === "voice" && data.audio) {
          const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
          audio.play().catch(() => {});
        }
      } else {
        addChatMessage("cyony", "API's being stubborn. Try me again in a bit. 🙄");
      }
    } catch {
      addChatMessage("cyony", "I couldn't reach the brain. Made a note though.");
    }

    pendingRef.current = false;
    setSending(false);
    onRequestSent(voiceMode);
  }

  if (sending) {
    return (
      <div className="cyony-panel cyony-panel-sending">
        <div className="cyony-sending-indicator">
          <span className="cyony-sending-label">Cyony</span>
          <span className="cyony-sending-dots">
            <span className="fab-dot" />
            <span className="fab-dot" />
            <span className="fab-dot" />
          </span>
        </div>
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <div className="cyony-panel cyony-panel-choose">
        <div className="cyony-mood-bar" data-mood="playful">
          <p>"What can I do for you, sugar?"</p>
        </div>
        <div className="cyony-choices">
          <button className="cyony-choice-btn" onClick={() => { setMode("compose"); }} type="button">
            ✦ Make a Request
          </button>
          <button className="cyony-choice-btn" onClick={onOpenMenu} type="button">
            ☰ Open Menu
          </button>
          <button className="cyony-choice-btn" onClick={() => setMode("options")} type="button">
            ⚙️ Options
          </button>
          <button className="cyony-choice-btn cyony-choice-cancel" onClick={onClose} type="button">
            Never mind
          </button>
        </div>
      </div>
    );
  }

  if (mode === "options") {
    const currentMood = externalMood || 'auto'
    const MOOD_OPTIONS = [
      { id: 'auto', emoji: '🤖', label: 'auto' },
      { id: 'calm', emoji: '😌', label: 'calm' },
      { id: 'annoyed', emoji: '😤', label: 'annoyed' },
      { id: 'playful', emoji: '😏', label: 'playful' },
      { id: 'sassy', emoji: '💅', label: 'sassy' },
      { id: 'deadpan', emoji: '😐', label: 'deadpan' },
      { id: 'eureka', emoji: '💡', label: 'eureka' },
      { id: 'chill', emoji: '💤', label: 'chill' },
      { id: 'mischievous', emoji: '😈', label: 'mischievous' },
      { id: 'confident', emoji: '👑', label: 'confident' },
    ]

    return (
      <div className="cyony-panel cyony-panel-options">
        <div className="cyony-mood-bar" data-mood="calm">
          <p>"Dial it in, sugar."</p>
        </div>
        <div className="cyony-options-content">
          <div className="cyony-option-row">
            <span className="cyony-option-label">Font Size</span>
            <div className="cyony-font-controls">
              <button className="cyony-font-btn" onClick={() => applyFontSize(fontSize - 1)} disabled={fontSize <= FONT_MIN} type="button">A-</button>
              <span className="cyony-font-value">{fontSize}px</span>
              <button className="cyony-font-btn" onClick={() => applyFontSize(fontSize + 1)} disabled={fontSize >= FONT_MAX} type="button">A+</button>
            </div>
          </div>
          <div className="cyony-option-row">
            <span className="cyony-option-label">Mood</span>
            <div className="cyony-mood-grid">
              {MOOD_OPTIONS.map(m => (
                <button
                  key={m.id}
                  className={`cyony-mood-chip${currentMood === m.id ? ' active' : ''}`}
                  onClick={() => onMoodChange?.(m.id)}
                  type="button"
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="cyony-compose-cancel" onClick={() => setMode("choose")} type="button">← Back</button>
      </div>
    )
  }

  return (
    <div className="cyony-panel cyony-panel-compose">
      <div className="cyony-mood-bar" data-mood="calm">
        <p>"Tell me what you need."</p>
      </div>

      <div className="cyony-toggle-row">
        <button
          className="cyony-mode-toggle"
          data-active={voiceMode === "text"}
          onClick={() => setVoiceMode("text")}
          type="button"
        >📝 Text</button>
        <button
          className="cyony-mode-toggle"
          data-active={voiceMode === "voice"}
          onClick={() => setVoiceMode("voice")}
          type="button"
        >🔊 Voice</button>
      </div>

      <form className="cyony-compose-form" onSubmit={handleSubmit}>
        <textarea
          className="cyony-compose-input"
          placeholder='Remind me to check the power bill...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          autoFocus
        />
        <button className="cyony-compose-send" type="submit" disabled={!input.trim() || sending}>
          {sending ? <span className="cyony-sending-label">✎ Sending...</span> : "Send"}
        </button>
      </form>
      <button className="cyony-compose-cancel" onClick={onClose} type="button">Cancel</button>
    </div>
  );
}
