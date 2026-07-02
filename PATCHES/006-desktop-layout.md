# PATCH 006 — Desktop Layout with Left Icon Rail

## Goal
When viewed on desktop (screen width >= 1024px), the app switches from mobile-first
single-column to a proper desktop layout with a persistent left icon rail (L1) and
a content area (C1) that fills the remaining space. Phone PWA keeps current layout.

## Design

### L1 — Left Icon Rail (always visible on desktop)
- Width: 64px
- Dark background (#0a0a0a)
- Contains icon buttons for each main menu item:
  - 🏠 Command (Home feed)
  - 🚗 Garage
  - 🏠 Houses
  - 📒 Ledger
  - 📄 Paper Trail
  - ⏰ Reminders
  - 👥 People
- Active icon has a subtle highlight (left border accent or bg change)
- Clicking an icon switches the C1 content area
- Below nav icons: 🔧 Cyony wrench button (opens Cyony panel as sidebar, not overlay)

### C1 — Content Area
- Takes all remaining horizontal space (flex: 1)
- Scrollable vertically
- Shows the active workspace component
- No more "back to feed" buttons on desktop — nav is in L1

### Home Feed on Desktop
The HomeFeed component needs desktop-specific layout:
- Top section: Greeting + 3 stat cards side by side (compact, not stacked)
- Main section: Reminders list as a compact table/grid, NOT full-width cards
- Reminders should be smaller text, denser layout
- Use the space wisely — 2-column layout for feed items if room

### Cyony Panel on Desktop
- Opens as a slide-in panel from the right (like a sidebar), NOT a centered overlay
- Width: ~380px
- Behind it: content area dims but stays visible

### FAB Button
- Hide the floating FAB on desktop — Cyony is in the left rail
- Mode toggle (📝/🎙️) moves to the Cyony panel or stays as a small toggle near the wrench icon

## Implementation

### 1. App Shell (`app-shell.tsx`)
- Detect desktop via CSS media query or window width state
- When desktop: render `<div className="app-shell-desktop">` with L1 + C1 layout
- When mobile: keep current layout exactly as-is
- L1 nav icons call `setActiveView()` directly (same as menu does now)
- Remove `showMenu` state on desktop — L1 replaces it

### 2. CSS (`globals.css`)
Add desktop-specific styles:

```css
/* Desktop layout — only kicks in at 1024px+ */
@media (min-width: 1024px) {
  .app-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  
  .desktop-rail {
    width: 64px;
    min-width: 64px;
    background: #0a0a0a;
    border-right: 1px solid #1a1a1a;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    gap: 4px;
    overflow-y: auto;
  }
  
  .rail-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 20px;
    cursor: pointer;
    transition: background 0.15s;
    border: none;
    background: transparent;
    position: relative;
  }
  
  .rail-icon:hover { background: #1a1a1a; }
  .rail-icon.active { background: #1a1a1a; }
  .rail-icon.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    background: var(--accent, #c8ff00);
    border-radius: 0 2px 2px 0;
  }
  
  .rail-spacer { flex: 1; }
  
  .desktop-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: #111;
  }
  
  /* Cyony panel as sidebar on desktop */
  .cyony-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: auto;
    width: 380px;
    background: rgba(0,0,0,0.5);
    z-index: 100;
  }
  
  .cyony-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 380px;
  }
  
  /* Hide FAB on desktop */
  .fab-container { display: none; }
  
  /* Home feed desktop layout */
  .home-feed-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .home-feed-reminders {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .reminder-item {
    padding: 10px 12px;
    font-size: 13px;
  }
}
```

### 3. HomeFeed Desktop Adjustments
- Stats row: 3 columns instead of stacked
- Reminders: 2-column grid, smaller cards
- Greeting text: smaller, more compact
- No full-width stretches

### 4. Workspace Components
- Each workspace already has `onBack` prop — on desktop this becomes a no-op
- Workspaces should fill the C1 area with proper padding
- Headers stay fixed at top of C1

## Files to Change
- `/root/sqhq/src/app/app/app-shell.tsx` — add desktop layout with L1 rail
- `/root/sqhq/src/app/globals.css` — add all desktop media query styles
- `/root/sqhq/src/app/components/HomeFeed.tsx` — desktop-friendly layout adjustments

## Constraints
- Mobile layout MUST remain exactly as-is — no regressions
- Desktop only activates at 1024px+ width
- All workspaces must work in C1 area
- No new dependencies
- TypeScript must pass
- Build must pass

## Verification
1. `rm -rf .next && npm run build` — must pass
2. On desktop browser: left rail visible, content fills right side
3. On phone PWA: looks exactly like before
4. Clicking rail icons switches content area
5. Cyony opens as right sidebar on desktop
