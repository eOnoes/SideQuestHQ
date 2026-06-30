# PATCH 002 — Chat Session Swipe Actions

**Date:** 2026-06-30
**Requested by:** Eddie
**Component:** `src/app/components/VoiceAgent.tsx`
**Depends on:** Patch 001 (chat tighten)

## Summary
Replace the button-based Archive/Delete actions on chat sessions with a swipe gesture — slide right to archive, slide left to delete. Matches the existing `SwipeableCard` pattern already used in GarageWorkspace, etc.

## Why
Buttons clutter the session cards on mobile. Swipe is more tactile, more intentional, and matches iOS/Android native patterns. The swipe gesture itself serves as confirmation — no `window.confirm` popup needed.

## Changes

### 1. Import SwipeableCard in VoiceAgent.tsx
Add to imports at top of file:
```tsx
import { SwipeableCard } from './SwipeableCard'
```

### 2. Wrap each session item in SwipeableCard
Current code (lines ~422-441):
```tsx
{sessions.map(s => (
  <div key={s.id} className="va-history-item" onClick={() => resumeSession(s.id)}>
    ...content...
    <div className="va-history-actions" onClick={e => e.stopPropagation()}>
      <button ...>📦 Archive</button>
      <button ...>🗑️ Delete</button>
    </div>
  </div>
))}
```

Replace with:
```tsx
{sessions.map(s => (
  <SwipeableCard
    key={s.id}
    onTap={() => resumeSession(s.id)}
    onSwipeRight={() => handleArchiveSession(s.id)}
    onSwipeLeft={() => handleDeleteSession(s.id)}
    rightAction={{
      direction: "right",
      label: "Archive",
      icon: "📦",
      color: "#fff",
      bgColor: "rgba(234,179,8,0.9)",
    }}
    leftAction={{
      direction: "left",
      label: "Delete",
      icon: "🗑️",
      color: "#fff",
      bgColor: "rgba(239,68,68,0.9)",
    }}
    className="va-history-item-swipe"
  >
    <div className="va-history-item">
      <div className="va-history-title">
        {s.title}
        {pendingSessions.has(s.id) && (
          <span className="va-pending-badge" title="Cyony is responding...">⚡</span>
        )}
      </div>
      <div className="va-history-meta">
        <span>{s.message_count} message{s.message_count !== 1 ? 's' : ''}</span>
        <span>{formatDate(s.updated_at)}</span>
      </div>
      {s.last_message && (
        <div className="va-history-preview">{s.last_message.slice(0, 60)}{s.last_message.length > 60 ? '...' : ''}</div>
      )}
    </div>
  </SwipeableCard>
))}
```

### 3. Remove old action buttons div
Delete the entire `<div className="va-history-actions">` block (the one with Archive and Delete buttons). The SwipeableCard swipe replaces it.

### 4. Remove window.confirm from handleDeleteSession
Current:
```tsx
const handleDeleteSession = async (sessionId: string) => {
  if (!window.confirm("Delete this conversation forever?")) return
  await deleteChatSession(sessionId)
  loadSessions()
}
```
Change to:
```tsx
const handleDeleteSession = async (sessionId: string) => {
  await deleteChatSession(sessionId)
  loadSessions()
}
```
The swipe gesture IS the confirmation — intentional and deliberate.

### 5. CSS (if needed)
The existing `SwipeableCard` styles should work. May need minor `.va-history-item-swipe` styling to match the card padding/spacing. Check if existing `.va-history-item` padding works inside the swipeable wrapper.

## Swipe UX
- **Swipe RIGHT** → Gold background reveals with 📦 Archive icon → session archives
- **Swipe LEFT** → Red background reveals with 🗑️ Delete icon → session deletes
- **Tap** → Opens the session (same as before)
- **Threshold:** 80px (built into SwipeableCard)
- **Flick:** Fast swipe also triggers (velocity > 0.5)

## Verification
1. Open chat landing page
2. Swipe right on a session → should archive with gold reveal
3. Swipe left on a session → should delete with red reveal
4. Tap on a session → should open it
5. Confirm no button clutter remains on session cards
