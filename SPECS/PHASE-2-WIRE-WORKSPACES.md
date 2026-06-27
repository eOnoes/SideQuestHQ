# Echo — Phase 2: Wire All Workspaces to Live Data

**From:** Cyony
**Date:** June 27, 2026
**Priority:** CRITICAL — This is the "make it real" phase

---

## Goal

Replace ALL hardcoded data in every workspace with live data from the SQLite database via the API. Every workspace should be able to display, add, edit, and delete records.

---

## Current State

Every workspace (`GarageWorkspace.tsx`, `HousesWorkspace.tsx`, `LedgerWorkspace.tsx`, `PaperTrailWorkspace.tsx`, `ConnectsWorkspace.tsx`) uses hardcoded `const` arrays. The API routes and DB schema already exist. The `lib/store.ts` and `lib/api.ts` already have the client-side cache pattern.

**DO NOT rebuild the API routes or DB schema.** Just wire the UI to use them.

---

## Phase 2A: Garage (Vehicles)

**File:** `src/app/components/workspaces/GarageWorkspace.tsx`

### What to do:

1. **Import store functions:**
```tsx
import { useEffect, useState } from "react";
import { getAssets, addAsset } from "@/lib/store";
import type { Asset } from "@/app/types";
```

2. **Replace hardcoded VEHICLES array** with a `useEffect` that loads vehicles from the store/API on mount.

3. **Add "Add Vehicle" button** at the top. When clicked, show a simple inline form with fields:
   - Vehicle name (text input)
   - Make (text input)
   - Model (text input)
   - Year (text input)
   - Type (select: Car/Truck/Motorcycle/Van)
   - Tag (text input)
   - Status (select: Available/Unavailable)

4. **Keep the existing accordion UI** — it's already built and looks great. Just make it read from live data instead of the hardcoded array.

5. **Scoreboard** should compute total fleet value from the actual vehicle data.

### API Routes (already exist):
- `GET /api/assets` — list vehicles
- `POST /api/assets` — add vehicle

### Notes:
- The `vehicles` table exists in the DB with fields: vehicle_id, vehicle_name, vehicle_type, make, model, model_year, owned_or_leased, availability_status, in_service_date, notes
- For now, display what we have. Forms can be simple — just enough to add a vehicle.

---

## Phase 2B: Houses (Properties)

**File:** `src/app/components/workspaces/HousesWorkspace.tsx`

### What to do:

1. **Import store functions:**
```tsx
import { useEffect, useState } from "react";
import { getAssets, addAsset } from "@/lib/store";
import type { Asset } from "@/app/types";
```

2. **Replace hardcoded PROPERTIES array** with live data.

3. **Add "Add Property" button** with inline form:
   - Property name (text)
   - Street address (text)
   - City (text)
   - State (text)
   - Monthly rent (number)
   - Status (select: Occupied/Vacant)

4. **Keep the accordion UI** — just wire it to real data.

5. **Scoreboard** should compute property count and occupancy from data.

### API Routes (already exist):
- `GET /api/assets` — list properties
- `POST /api/assets` — add property

---

## Phase 2C: Ledger (Expenses)

**File:** `src/app/components/workspaces/LedgerWorkspace.tsx`

### What to do:

1. **Add a new table** to `src/lib/db.ts` if it doesn't exist:
```sql
CREATE TABLE IF NOT EXISTS global_ledger (
  entry_id TEXT PRIMARY KEY,
  date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  amount REAL NOT NULL DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'out',
  source TEXT NOT NULL DEFAULT '',
  receipt_url TEXT DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

2. **Create API routes:**
```
src/app/api/ledger/route.ts          — GET (list) + POST (add)
src/app/api/ledger/[id]/route.ts     — PUT (update) + DELETE (remove)
src/app/api/ledger/summary/route.ts  — GET (monthly totals)
```

3. **Wire LedgerWorkspace.tsx** to load from API instead of hardcoded SECTIONS.

4. **Add "Add Entry" form:**
   - Date (date input)
   - Description (text)
   - Category (select: rental/vehicle/personal/investment/other)
   - Amount (number)
   - Direction (select: in/out)

5. **Scoreboard** should compute net = total in - total out from actual data.

### Keep the existing UI structure — sections, color bars, running total. Just make it data-driven.

---

## Phase 2D: Connects (Contacts)

**File:** `src/app/components/workspaces/ConnectsWorkspace.tsx`

### What to do:

1. **Replace hardcoded CONTACTS array** with live data from `getPeople()` in the store.

2. **Add "Add Contact" button** with inline form:
   - Name (text)
   - Phone (text)
   - Role/Relation (text)
   - Category (select: contractors/fam/work)
   - Subcategory (text)
   - Note (text)

3. **Keep the existing sort bar** (A→Z / by category) — already built.

4. **Keep the accordion UI** — already looks great.

### API Routes (already exist):
- `GET /api/people` — list contacts
- `POST /api/people` — add contact
- `PUT /api/people/:id` — update contact
- `DELETE /api/people/:id` — remove contact

---

## Phase 2E: Paper Trail (Documents)

**File:** `src/app/components/workspaces/PaperTrailWorkspace.tsx`

### What to do:

1. **Add a new table** to `src/lib/db.ts`:
```sql
CREATE TABLE IF NOT EXISTS documents (
  document_id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'uncategorized',
  source TEXT NOT NULL DEFAULT '',
  document_type TEXT NOT NULL DEFAULT 'receipt',
  file_url TEXT DEFAULT '',
  amount REAL DEFAULT 0,
  date TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

2. **Create API routes:**
```
src/app/api/documents/route.ts          — GET (list) + POST (add)
src/app/api/documents/[id]/route.ts     — PUT (update) + DELETE (remove)
```

3. **Wire PaperTrailWorkspace.tsx** to load from API.

4. **Add "Add Receipt" form:**
   - Title (text)
   - Vendor/Source (text)
   - Amount (number)
   - Date (date)
   - Category (select: property/vehicle/personal/other)

5. **Keep the existing filter chips and receipt group UI** — just make it data-driven.

---

## Build Order

Do them in this order:
1. **Garage** — simplest, good warmup
2. **Connects** — already has API routes
3. **Houses** — similar pattern
4. **Ledger** — needs new table + API routes
5. **Paper Trail** — needs new table + API routes

---

## Constraints

- Do NOT change the existing UI layout/structure — just replace hardcoded data with live data
- Do NOT touch VoiceAgent.tsx, ScoutPanel.tsx, MenuCards.tsx, HomeFeed.tsx, or ErrorBoundary.tsx
- Keep the ErrorBoundary wrapping in app-shell.tsx intact
- TypeScript must pass: `npx tsc --noEmit`
- Build must pass: `npx next build`
- Each workspace should show a loading state while fetching data
- Each workspace should show an empty state when no data exists

---

## Verification Checklist

For EACH workspace:
- [ ] Displays data from API (not hardcoded)
- [ ] "Add" form works and saves to database
- [ ] New item appears in list immediately after adding
- [ ] Refresh page → data persists
- [ ] Empty state shows when no data
- [ ] Loading state shows while fetching
- [ ] TypeScript passes
- [ ] Build passes

---

*— Cyony*
