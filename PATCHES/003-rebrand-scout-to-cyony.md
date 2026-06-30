# PATCH 003 — Rebrand Scout/Chloe → Cyony

**Date:** 2026-06-30
**Requested by:** Eddie
**Scope:** Full name cleanup across the app

## Summary
The app has three names for the same AI persona: "Scout" (component code), "Chloe Vance" (voice system prompt), and "Cyony" (what Eddie calls me). Unify everything to **Cyony**.

## Changes

### 1. Voice Route (`src/app/api/voice/route.ts`)
- Rename `CHLOE_SYSTEM` → `CYONY_SYSTEM`
- Replace "Chloe Vance" persona text with Cyony persona:
  ```
  You are Cyony — sharp, witty, and always has Eddie's back. You keep SideQuest HQ running.
  Your voice: confident, warm, with a playful edge. You're not just an assistant — you're family.
  Lightly amused sarcasm runs through everything you say. Even when helpful, a smirk. Even warm, a side-eye.
  ```
- Replace `SCOUT_VOICE_URL` → `CYONY_VOICE_URL`
- Update fallback voice from `'Chloe'` to `'Cyony'`
- Update all `chloeText` variable → `cyonyText`
- Update error message: "Chloe's comms are down" → "Cyony's comms are down"
- Update comment: "MiMo generates Chloe's response" → "MiMo generates Cyony's response"
- The reference audio path `shared/chloe-voice-clone/` should stay as-is (it's a file path, not user-facing)

### 2. Store Types (`src/lib/store.ts`)
- Change role type: `"user" | "scout"` → `"user" | "cyony"`

### 3. API Client (`src/lib/api.ts`)
- Change `addChatMessage` role param: `"user" | "scout"` → `"user" | "cyony"`

### 4. VoiceAgent (`src/app/components/VoiceAgent.tsx`)
- All `role === 'scout'` → `role === 'cyony'`
- All `role: 'scout'` → `role: 'cyony'`
- `addChatMessage('scout', ...)` → `addChatMessage('cyony', ...)`
- CSS class `va-msg scout` → `va-msg cyony`

### 5. ScoutPanel → CyonyPanel (`src/app/components/ScoutPanel.tsx`)
- Rename file: `ScoutPanel.tsx` → `CyonyPanel.tsx`
- Rename export: `ScoutPanel` → `CyonyPanel`
- Rename type: `ScoutPanelProps` → `CyonyPanelProps`
- All `addChatMessage("scout", ...)` → `addChatMessage("cyony", ...)`
- localStorage key: `sqhq-scout-draft` → `sqhq-cyony-draft`
- Function name: `sendToScout` → `sendToCyony`
- CSS classes: `scout-panel` → `cyony-panel`, `scout-sending-indicator` → `cyony-sending-indicator`
- All inline text referencing "Scout" → "Cyony"

### 6. App Shell (`src/app/app/app-shell.tsx`)
- Import: `ScoutPanel` → `CyonyPanel`
- State: `showScout` → `showCyony`, `scoutBusy` → `cyonyBusy`
- Role check: `m.role === "scout"` → `m.role === "cyony"`
- Display name: `fab-scout-name` content "Scout" → "Cyony"
- CSS classes: `scout-overlay` → `cyony-overlay`
- All references updated consistently

### 7. HomeFeed (`src/app/components/HomeFeed.tsx`)
- Import: `scout-audio` → `cyony-audio` (after file rename)
- Function references: `playRandomScoutQuip` → `playRandomCyonyQuip`, etc.
- `buildScoutBody` → `buildCyonyBody`
- All "Scout" in user-facing text → "Cyony"

### 8. CardView (`src/app/components/CardView.tsx`)
- "Scout's proud of you" → "Cyony's proud of you"

### 9. Scout Audio Lib (`src/lib/scout-audio.ts`)
- Rename file: `scout-audio.ts` → `cyony-audio.ts`
- Update all function names: `playRandomScoutQuip` → `playRandomCyonyQuip`, `getScoutAudio` → `getCyonyAudio`, `playScoutAudio` → `playCyonyAudio`
- Audio paths stay as `/audio/scout/` for now (actual audio files don't need renaming)

### 10. CSS (`src/app/styles/home-feed.css`)
- `.feed-scout-bubble` → `.feed-cyony-bubble`
- `.fab-scout-name` → `.fab-cyony-name`
- `.scout-overlay` → `.cyony-overlay`
- `.scout-panel` → `.cyony-panel`
- `.scout-mood-bar` → `.cyony-mood-bar`
- `.scout-choices` → `.cyony-choices`
- `.scout-choice-btn` → `.cyony-choice-btn`
- All related selectors updated

### 11. Voice Agent CSS (`src/app/styles/voice-agent.css`)
- `.va-msg.scout` → `.va-msg.cyony`

## What NOT to change
- File path `shared/chloe-voice-clone/` (actual directory name on disk)
- Audio file paths `/audio/scout/` (actual directory with OGG files)
- `SCOUT_VOICE_URL` variable can stay as internal var name if it references the chloe-voice-clone path

## Verification
1. `npm run typecheck` — no errors
2. `npm run build` — clean build
3. Open app — profile shows "Cyony", FAB says "Cyony"
4. Send a message — response comes from "Cyony" not "Scout" or "Chloe"
5. Voice mode — audio generates with Cyony voice
