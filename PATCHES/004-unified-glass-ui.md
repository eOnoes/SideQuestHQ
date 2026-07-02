# PATCH 004 — Full Workspace Redesign: Unified Glass UI

## Overview
Complete visual and behavioral overhaul of ALL workspace tabs (Garage, Assets, Ledger, Paper Trail, Connects, Reminders) to follow a single unified design language.

---

## 1. UNIVERSAL DESIGN SYSTEM (applies to ALL tabs)

### 1.1 Fixed Frosted Glass Header
- `position: sticky; top: 0; z-index: 50;`
- Background: `rgba(8, 8, 8, 0.75)` with `backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);`
- Border-bottom: `1px solid rgba(255,255,255,0.05)`
- Contains: `«` back button (left), tab title (center-left), `+ Add` button (right)
- The `+ Add` button is ALWAYS in the header row — no separate action bar
- This header NEVER scrolls — it stays fixed at top

### 1.2 Universal Card Style
- **Border radius: 0** — sharp corners everywhere (cards, buttons, inputs, pills, badges)
- **Top-right corner cut**: `clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%);`
  - This creates a 45-degree diagonal cut on the top-right corner
  - Apply to ALL cards: vehicle cards, property cards, ledger entries, receipt cards, contact cards, reminder cards
- Background: `#111`
- Border: `1px solid #1a1a1a`
- Left accent bar: 3px wide, colored per item type (keep existing color logic)
- Transition on expand: `max-height` or `height` animation ~300ms ease

### 1.3 Card Expansion Behavior
- Only 1 card expanded at a time across the entire page
- Clicking a collapsed card: auto-collapses any currently expanded card, then expands the clicked one
- Clicking an already-expanded card: collapses it
- Expanded cards show full data (2.5x collapsed height approximately)
- Expansion pushes cards below it downward — no overlap, no z-index tricks
- Use CSS transition for smooth expand/collapse animation

### 1.4 Scroll Behavior
- Cards list scrolls naturally under the fixed frosted header(s)
- Content that scrolls under a fixed header blurs behind it (the backdrop-filter handles this)

### 1.5 Add Form
- When `+ Add` is clicked, a form panel slides down below the header
- Form has sharp corners (0 radius), dark background (#0a0a0a), border #222
- Form inputs: 0 border-radius, background #0a0a0a, border 1px solid #222
- Green submit button at bottom
- `+ Add` button text changes to `✕ Close` when form is open

---

## 2. GARAGE TAB (Mobile Assets)

### Header
- Text: `« Garage - Mobile Assets`
- Right side: `+ Add` button (in-header)

### Cards (Collapsed)
- Left side: Year (last 2 digits) in large bold text + Make | Model
- Right side (stacked vertically, right-aligned):
  - Tag number (license plate)
  - Insurance renewal date (MM/DD/YY)
- Left accent bar color by vehicle type (Car=yellow, Truck=green, Motorcycle=red, Van=blue)

### Cards (Expanded ~2.5x)
- Shows ALL vehicle data: make, model, type, ownership status, availability, notes
- Status pills: PAID OFF/LEASED, AVAILABLE/UNAVAILABLE
- Data rows with key:value format

### Default State
- All cards start COLLAPSED on page load
- `expanded` state defaults to `null` (not 0)

---

## 3. ASSETS TAB (Properties)

### Header
- Text: `« Assets`
- Right side: `+ Add` button (in-header)

### Cards (Collapsed)
- Left side: Street number (large bold) + Street address
- Right side (stacked, right-aligned):
  - City, State
  - Status: occupied/vacant
- Left accent bar: green=occupied, red=vacant

### Cards (Expanded ~2.5x)
- Full address, ownership status, rental status, notes
- Status pills: OCCUPIED/VACANT, PAID OFF/FINANCED
- Vacancy alert if unoccupied

### Default State
- All cards start COLLAPSED (`expanded` defaults to `null`)

---

## 4. LEDGER TAB

### Header Row 1 (Primary — always fixed)
- Text: `« Ledger`
- Right side: `+ Add` button (in-header)

### Header Row 2 (Summary — also fixed, sits below primary)
- Frosted glass same as primary header
- Shows 3 values in a row:
  - Total In (green)
  - Total Out (red)
  - % Earned (computed: totalIn / totalOut * 100 or net/in * 100)
- Background: `rgba(8, 8, 8, 0.75)` with backdrop-filter blur
- Border-bottom: `1px solid rgba(255,255,255,0.05)`

### Cards
- Each card is a transaction/entry
- Collapsed: Description name (left), Amount + Date (right)
- Left accent bar: green=in, red=out, blue=neutral
- Expanded: Shows full detail — name, detail, amount, date, type, section

### Scroll Behavior
- Cards scroll under BOTH fixed headers
- Primary header at top, summary header right below it — both sticky

### Default State
- All cards start COLLAPSED
- Page starts showing current date entries at top, older entries below

---

## 5. PAPER TRAIL TAB

### Header Row 1 (Primary — always fixed)
- Text: `« Paper Trail`
- Right side: `+ Add` button (in-header)

### Header Row 2 (Summary — also fixed, sits below primary)
- Frosted glass same as primary header
- Shows:
  - "Year to date expenses" label
  - Total amount (red, negative)
  - Clickable — tapping opens a year selector popup
- Year selector: shows current year + past 3 years (2026, 2025, 2024, 2023)
- Only years with data are selectable (others grayed out)
- Default: Current year selected

### + Add Flow
When user taps `+ Add`, show 3 option buttons (not a form immediately):
1. **Manual Entry** → opens the manual form (vendor, detail, amount, date, category)
2. **Picture** → opens camera/file picker for receipt photo (placeholder for now)
3. **CSV** → opens file picker for CSV import (placeholder for now)

### Cards
- Collapsed: Vendor name (left), Amount + Date (right)
- Badge: manual/receipt/digital
- Left accent bar color by category
- Expanded: Full receipt details — vendor, detail, amount, date, category, badge type

### Default State
- All cards start COLLAPSED
- Filter chips still available (all, property, vehicle, personal, uncategorized)

---

## 6. REMINDERS TAB

### Header
- Text: `« Reminders`
- Right side: `+ Add` button (in-header)

### + Add Form Fields
- Title/Description (text)
- Due Date (date picker)
- Recurrence selector:
  - One-time
  - Weekly
  - Monthly
  - Annually
- Priority: Quiet / Normal / Important

### Cards (Collapsed)
- Left side: Title (bold)
- Right side (stacked, right-aligned):
  - Due date
  - Recurrence badge (ONE-TIME, WEEKLY, MONTHLY, ANNUAL)
- Left accent bar: green=completed, yellow=upcoming, red=overdue

### Cards (Expanded ~2.5x)
- Full reminder details: title, due date, recurrence, priority, linked asset/vehicle if any
- Mark complete / snooze buttons

### Default State
- All cards start COLLAPSED
- Sorted by due date (soonest first)

---

## 7. CONNECTS TAB

### Header
- Text: `« Connects`
- Right side: `+ Add` button (in-header)

### Cards (Collapsed)
- Left side: Contact name (bold)
- Right side (stacked, right-aligned):
  - Phone number
  - Category badge (contractors, fam, work, general)
- Left accent bar: green=contractors, blue=fam, orange=work

### Cards (Expanded ~2.5x)
- Full contact details: name, phone, relation, note, category, subcategory
- All key:value detail rows

### Sort
- Keep the A→Z / by category sort chips below the header

### Default State
- All cards start COLLAPSED

---

## 8. CSS CHANGES REQUIRED

### workspaces.css — Remove all border-radius
- `.accordion-card`: `border-radius: 0` (was 10px)
- `.contact-card`: `border-radius: 0` (was 8px)
- `.receipt-card`: `border-radius: 0` (was 8px)
- `.pill`: `border-radius: 0` (was 12px)
- `.receipt-badge`: `border-radius: 0` (was 4px)
- `.filter-chip`: `border-radius: 0` (was 14px)
- `.sort-chip`: `border-radius: 0` (was 14px)
- `.add-form`: `border-radius: 0` (was 10px)
- `.form-input`: `border-radius: 0` (was 6px)
- `.form-submit`: `border-radius: 0` (was 8px)
- `.csv-btn`: `border-radius: 0` (was 8px)
- `.filter-icon-btn`: `border-radius: 0` (was 8px)
- `.filter-panel`: `border-radius: 0` (was 16px)
- `.net-banner`: `border-radius: 0` (was 10px)
- `.running-total`: `border-radius: 0` (was 10px)
- `.vacancy-alert`: `border-radius: 0` (was 8px)
- `.workspace-scoreboard`: `border-radius: 0` (was 10px)

### workspaces.css — Add clip-path for top-right cut
```css
.card-cut {
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%);
}
```
Apply `.card-cut` class to ALL card elements.

### workspaces.css — Frosted glass header
```css
.workspace-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(8, 8, 8, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px 12px 10px;
}
```

### workspaces.css — Frosted glass summary bar (Ledger + Paper Trail)
```css
.workspace-summary-bar {
  position: sticky;
  top: 52px;
  z-index: 49;
  background: rgba(8, 8, 8, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 10px 12px;
}
```

### workspaces.css — Card expand animation
```css
.accordion-card,
.contact-card,
.receipt-card,
.tx-card,
.reminder-card {
  overflow: hidden;
  transition: max-height 0.3s ease, background 0.2s ease;
}
```

### workspaces.css — In-header Add button
```css
.workspace-add-btn {
  background: none;
  border: 1px solid #333;
  color: #2ecc71;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.workspace-add-btn:hover {
  border-color: #2ecc71;
  background: rgba(46, 204, 113, 0.08);
}
```

---

## 9. FILES TO MODIFY

1. **`src/app/styles/workspaces.css`** — All CSS changes (frosted glass, clip-path, remove border-radius, animation)
2. **`src/app/components/workspaces/GarageWorkspace.tsx`** — Redesign with frosted header, new card layout, in-header Add
3. **`src/app/components/workspaces/HousesWorkspace.tsx`** → Rename content to Assets, frosted header, new card layout
4. **`src/app/components/workspaces/LedgerWorkspace.tsx`** — Dual frosted headers, % earned, card redesign
5. **`src/app/components/workspaces/PaperTrailWorkspace.tsx`** — Dual frosted headers, year selector, 3-option Add
6. **`src/app/components/workspaces/ConnectsWorkspace.tsx`** — Frosted header, new card layout
7. **New: `src/app/components/workspaces/RemindersWorkspace.tsx`** — New workspace for reminders
8. **`src/app/app/app-shell.tsx`** — Add Reminders route, update view names if needed
9. **`src/app/types.ts`** — Add RemindersWorkspace if new type needed

---

## 10. VERIFICATION
- [ ] All 6 tabs render without errors
- [ ] Frosted glass header is fixed and content scrolls under it
- [ ] + Add button is in the header row on every tab
- [ ] All cards have 0 border-radius
- [ ] All cards have the top-right 45-degree diagonal cut
- [ ] Only 1 card expanded at a time (auto-close previous)
- [ ] Card expansion pushes content below it down smoothly
- [ ] All cards start collapsed on page load
- [ ] Ledger has dual fixed headers (title + summary)
- [ ] Paper Trail has dual fixed headers (title + YTD)
- [ ] Paper Trail Add shows 3 options (Manual/Picture/CSV)
- [ ] Reminders tab works with recurrence options
- [ ] Connects tab uses "Connects" naming
- [ ] `npm run build` passes with 0 TypeScript errors
