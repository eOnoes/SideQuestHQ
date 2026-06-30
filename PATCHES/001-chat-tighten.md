# SQHQ Chat Patch — v1

**Date:** June 30, 2026
**Author:** Cyony
**Target:** SideQuestHQ — VoiceAgent chat module
**Status:** Ready for Codex

---

## Overview

Six targeted changes to the chat/agent interface. All changes are scoped to:
- `src/app/components/VoiceAgent.tsx`
- `src/app/styles/voice-agent.css`
- `src/app/styles/workspaces.css`
- `src/app/api/chat/sessions/route.ts`
- `src/lib/store.ts` (if new functions needed)

**DO NOT rebuild what exists. PATCH only what's listed below.**

---

## Change 1: New Chat Button — Color Accent

**Goal:** Make the "Start New Chat" button visually distinct from the selectable session list below it.

**Current:** `background: #111`, `border: 1px dashed #333`, `color: #888` — blends in with session cards.

**Target:** Add a subtle gold accent tint to make it pop without being loud.

**CSS changes in `voice-agent.css`:**
```css
.va-new-chat-btn {
  /* UPDATE existing: */
  background: linear-gradient(135deg, rgba(255, 211, 61, 0.08) 0%, rgba(255, 211, 61, 0.03) 100%);
  border: 1px solid rgba(255, 211, 61, 0.25);
  color: #ffd33d;
}

.va-new-chat-btn:hover {
  background: linear-gradient(135deg, rgba(255, 211, 61, 0.14) 0%, rgba(255, 211, 61, 0.06) 100%);
  border-color: rgba(255, 211, 61, 0.4);
  color: #ffe066;
}

.va-new-chat-icon {
  /* UPDATE existing: */
  background: rgba(255, 211, 61, 0.12);
  border: 1px solid rgba(255, 211, 61, 0.3);
  color: #ffd33d;
}
```

**No JSX changes needed.**

---

## Change 2: Archive & Delete on Chat Sessions

**Goal:** Let users archive or delete old conversations from the landing session list.

### Backend — New API endpoint

**File:** `src/app/api/chat/sessions/route.ts`

Add a new route file: `src/app/api/chat/sessions/[id]/route.ts`

```typescript
// PUT /api/chat/sessions/:id — archive or delete a session
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { archived } = await req.json();
  const db = getDb();
  db.prepare("UPDATE chat_sessions SET archived = ? WHERE id = ?").run(archived ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}

// DELETE /api/chat/sessions/:id — permanently delete session + messages
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  db.prepare("DELETE FROM chat_messages WHERE session_id = ?").run(params.id);
  db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
```

### Frontend — Store functions

**File:** `src/lib/store.ts`

Add two functions:
```typescript
export async function archiveChatSession(sessionId: string): Promise<void> {
  return api.archiveChatSession(sessionId);
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  return api.deleteChatSession(sessionId);
}
```

Also update `api.ts` to add the fetch calls for `archiveChatSession` and `deleteChatSession`.

### Frontend — UI on session items

**File:** `src/app/components/VoiceAgent.tsx`

On each `.va-history-item`, add a subtle action row that appears on hover (desktop) or long-press (mobile):

- **Archive button:** 📦 icon — calls `archiveChatSession(s.id)`, removes from list
- **Delete button:** 🗑️ icon — calls `deleteChatSession(s.id)` with a confirmation prompt, removes from list

**CSS additions in `voice-agent.css`:**
```css
.va-history-actions {
  display: none;
  gap: 8px;
  margin-top: 8px;
}

.va-history-item:hover .va-history-actions {
  display: flex;
}

.va-history-action-btn {
  background: none;
  border: 1px solid #2a2a2a;
  color: #555;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--font-mono, inherit);
  transition: all 0.15s;
}

.va-history-action-btn:hover {
  border-color: #555;
  color: #aaa;
}

.va-history-action-btn.delete:hover {
  border-color: #b53333;
  color: #b53333;
}
```

**Behavior:**
- Archive: removes from visible list, sets `archived=1` in DB
- Delete: `window.confirm("Delete this conversation forever?")` → deletes from DB
- Both: call `loadSessions()` after to refresh list

---

## Change 3: Auto-Delete Empty Sessions

**Goal:** If a new chat is created but no messages are sent, auto-delete when navigating away.

**File:** `src/app/components/VoiceAgent.tsx`

In the `goToLanding()` function (line ~211), add a check:

```typescript
const goToLanding = async () => {
  // Auto-delete empty sessions
  if (currentSessionId && messages.length === 0) {
    try {
      await deleteChatSession(currentSessionId)
    } catch { /* silent */ }
  }
  setView('landing')
  setCurrentSessionId(null)
  setMessages([])
  setSearchQuery('')
  setSearchResults([])
  loadSessions()
}
```

Also apply the same logic in `startNewChat()` — before creating a new session, check if the current one is empty and delete it:

```typescript
const startNewChat = async () => {
  // Clean up empty session before creating new one
  if (currentSessionId && messages.length === 0) {
    try {
      await deleteChatSession(currentSessionId)
    } catch { /* silent */ }
  }
  try {
    const sess = await createChatSession()
    setCurrentSessionId(sess.id)
    setMessages([])
    setView('chat')
    loadSessions()
  } catch { /* empty */ }
}
```

**Also:** When leaving the chat view, check if the session has only 1 message (the user's first message with no response yet) — treat that as empty too:

```typescript
const isEmptySession = messages.length === 0 || 
  (messages.length === 1 && messages[0].role === 'user')
```

Use `isEmptySession` in the checks above instead of `messages.length === 0`.

---

## Change 4: Remove Quick-Action Icons from Chat View

**Goal:** Remove the key/card/pin utility icons row that appears above the bottom nav in chat view.

**File:** `src/app/components/VoiceAgent.tsx`

Search for the section rendering these icons (likely in the chat view return, around the input bar area). Remove or comment out the entire row containing the key, card, and pin icons.

**If the icons are in a separate component:** Simply don't render it inside the VoiceAgent chat view.

**If they're inline:** Remove the JSX block. It's likely a div with three icon buttons between the input area and the bottom of the screen.

**CSS:** No CSS changes needed — just remove the JSX.

---

## Change 5: Back Arrow Visibility

**Goal:** Make the back arrow more visible across all screens.

**File:** `src/app/styles/workspaces.css`

```css
/* UPDATE existing .workspace-back: */
.workspace-back {
  background: none;
  border: none;
  color: #888;           /* was #555 — brighter default */
  font-size: 20px;       /* was 18px — slightly larger */
  cursor: pointer;
  padding: 4px 2px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;      /* NEW — bolder weight */
  letter-spacing: -1px;  /* NEW — tighten the << if using double */
}

.workspace-back:hover {
  color: #ccc;           /* was #888 — more contrast on hover */
}
```

**File:** `src/app/components/VoiceAgent.tsx`

Update the back button text from `←` to `«` (double angle) in all instances:
- Line ~326: `<button className="workspace-back" onClick={onBack} type="button">«</button>`
- Line ~430: `<button className="workspace-back" onClick={goToLanding} type="button">«</button>`

Also update any other workspace components that use `.workspace-back` to use `«` instead of `←`.

---

## Change 6: Text/Voice Mode Toggle — Slide Redesign

**Goal:** Convert the two-button mode toggle into a sliding toggle. Default to voice mode.

**File:** `src/app/components/VoiceAgent.tsx`

Replace the mode toggle JSX (appears twice — landing header and chat header):

**Before:**
```jsx
<div className="va-mode-toggle">
  <button className={`va-mode-btn ${responseMode === 'text' ? 'active' : ''}`} ...>📝</button>
  <button className={`va-mode-btn ${responseMode === 'voice' ? 'active' : ''}`} ...>🔊</button>
</div>
```

**After:**
```jsx
<div className="va-mode-toggle" onClick={() => {
  const next = responseMode === 'text' ? 'voice' : 'text'
  setResponseMode(next)
  onModeChange?.(next)
}}>
  <div className={`va-mode-slider ${responseMode === 'voice' ? 'voice' : 'text'}`}>
    <span className="va-mode-label-left">📝</span>
    <span className="va-mode-label-right">🔊</span>
    <div className="va-mode-knob" />
  </div>
</div>
```

**Default state:** Change `useState<'text' | 'voice'>('text')` to `useState<'text' | 'voice'>('voice')` on line 78.

**CSS changes in `voice-agent.css`:**

Replace the `.va-mode-toggle` and `.va-mode-btn` styles:

```css
.va-mode-toggle {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.va-mode-slider {
  position: relative;
  display: flex;
  align-items: center;
  width: 52px;
  height: 26px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 13px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.va-mode-slider.voice {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.35);
}

.va-mode-slider.text {
  background: rgba(255, 211, 61, 0.1);
  border-color: rgba(255, 211, 61, 0.25);
}

.va-mode-label-left,
.va-mode-label-right {
  position: absolute;
  font-size: 11px;
  transition: opacity 0.3s;
  pointer-events: none;
}

.va-mode-label-left { left: 6px; }
.va-mode-label-right { right: 6px; }

.va-mode-slider.text .va-mode-label-left { opacity: 1; }
.va-mode-slider.text .va-mode-label-right { opacity: 0.3; }
.va-mode-slider.voice .va-mode-label-left { opacity: 0.3; }
.va-mode-slider.voice .va-mode-label-right { opacity: 1; }

.va-mode-knob {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffd33d;
  top: 2px;
  left: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.va-mode-slider.voice .va-mode-knob {
  left: 28px;
  background: #a78bfa;
}

.va-mode-slider.text .va-mode-knob {
  left: 2px;
  background: #ffd33d;
}
```

---

## Testing Checklist

After Codex builds, Eddie tests:

- [ ] **New Chat button** — gold tint visible, stands out from session list
- [ ] **Hover session card** — archive/delete buttons appear
- [ ] **Archive** — session disappears from list, data preserved in DB
- [ ] **Delete** — confirmation prompt, session permanently removed
- [ ] **Empty session** — create new chat, leave without typing, verify it's gone
- [ ] **Back arrow** — `«` visible and bold on all screens
- [ ] **Mode toggle** — slides smoothly, defaults to voice (🔊)
- [ ] **Voice mode** — purple accent when active
- [ ] **Text mode** — gold accent when active
- [ ] **No regressions** — existing chat, mood, search, mic all still work

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/components/VoiceAgent.tsx` | Back arrow text, mode toggle JSX, empty session cleanup, remove quick-action icons, archive/delete UI |
| `src/app/styles/voice-agent.css` | New chat button accent, mode slider styles, session action buttons |
| `src/app/styles/workspaces.css` | Back arrow visibility |
| `src/app/api/chat/sessions/[id]/route.ts` | NEW FILE — archive + delete endpoints |
| `src/lib/store.ts` | Add archiveChatSession, deleteChatSession functions |
| `src/lib/api.ts` | Add fetch calls for archive/delete |

---

*Plan once. Build clean. Test thorough.* 🔧
