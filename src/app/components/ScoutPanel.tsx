"use client";

import { useState, useRef, type FormEvent } from "react";
import { addReminder, addChatMessage } from "@/lib/store";

type ScoutPanelProps = {
  onClose: () => void;
  onOpenMenu: () => void;
  onRequestSent: (mode: "text" | "voice") => void;
};

export function ScoutPanel({ onClose, onOpenMenu, onRequestSent }: ScoutPanelProps) {
  const [mode, setMode] = useState<"choose" | "compose">("choose");
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState<"text" | "voice">("text");
  const [sending, setSending] = useState(false);
  const pendingRef = useRef(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pendingRef.current) return;
    setInput("");
    setSending(true);
    pendingRef.current = true;
    sendToScout(text);
  }

  async function sendToScout(text: string) {
    // Save user message
    addChatMessage("user", text);

    // Check if it's a simple command
    if (text.toLowerCase().startsWith("remind") || text.toLowerCase().startsWith("add reminder")) {
      const label = text.replace(/^(remind me|remind|add reminder)( to|:|,)?\s*/i, "").trim();
      if (label) {
        addReminder({ label, quest: "Side Quest", due: "Soon", priority: "Normal", done: false });
        addChatMessage("scout", `Done. Added '${label}' to your reminders. You're welcome. 😏`);
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
        addChatMessage("scout", data.text || "...I got nothing. That's rare.");

        // If voice mode, play the audio response
        if (voiceMode === "voice" && data.audio) {
          const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
          audio.play().catch(() => {});
        }
      } else {
        addChatMessage("scout", "API's being stubborn. Try me again in a bit. 🙄");
      }
    } catch {
      addChatMessage("scout", "I couldn't reach the brain. Made a note though.");
    }

    pendingRef.current = false;
    setSending(false);
    onRequestSent(voiceMode);
  }

  if (sending) {
    return (
      <div className="scout-panel scout-panel-sending">
        <div className="scout-sending-indicator">
          <span className="scout-sending-label">Scout</span>
          <span className="scout-sending-dots">
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
      <div className="scout-panel scout-panel-choose">
        <div className="scout-mood-bar" data-mood="playful">
          <p>"What can I do for you, sugar?"</p>
        </div>
        <div className="scout-choices">
          <button className="scout-choice-btn" onClick={() => { setMode("compose"); }} type="button">
            ✦ Make a Request
          </button>
          <button className="scout-choice-btn" onClick={onOpenMenu} type="button">
            ☰ Open Menu
          </button>
          <button className="scout-choice-btn scout-choice-cancel" onClick={onClose} type="button">
            Never mind
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scout-panel scout-panel-compose">
      <div className="scout-mood-bar" data-mood="calm">
        <p>"Tell me what you need."</p>
      </div>

      <div className="scout-toggle-row">
        <button
          className="scout-mode-toggle"
          data-active={voiceMode === "text"}
          onClick={() => setVoiceMode("text")}
          type="button"
        >📝 Text</button>
        <button
          className="scout-mode-toggle"
          data-active={voiceMode === "voice"}
          onClick={() => setVoiceMode("voice")}
          type="button"
        >🔊 Voice</button>
      </div>

      <form className="scout-compose-form" onSubmit={handleSubmit}>
        <textarea
          className="scout-compose-input"
          placeholder='Remind me to check the power bill...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          autoFocus
        />
        <button className="scout-compose-send" type="submit" disabled={!input.trim() || sending}>
          {sending ? <span className="scout-sending-label">✎ Sending...</span> : "Send"}
        </button>
      </form>
      <button className="scout-compose-cancel" onClick={onClose} type="button">Cancel</button>
    </div>
  );
}
