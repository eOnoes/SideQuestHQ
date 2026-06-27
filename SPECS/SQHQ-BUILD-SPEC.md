# SideQuestHQ — Complete Build Spec

**Author:** Cyony (Architect)
**Date:** June 27, 2026
**Status:** Ready for Echo + Codex
**Repo:** `https://github.com/eOnoes/SideQuestHQ`

---

## Executive Summary

SideQuestHQ is a personal command center PWA for Eddie. It manages vehicles, rental properties, expenses, contacts, documents, reminders, and an AI chat agent (Scout/Cyony). The **foundation is solid** — database schema, API routes, type definitions, and client store already exist. What's missing is **wiring the UI to real data, adding offline/PWA capabilities, and modular error isolation**.

This spec defines every module, every data model, every API endpoint, and every component needed to turn the current prototype into a production-grade application.

---

## Architecture Overview

```
src/
├── app/
│   ├── api/                    # Thin API controllers (Next.js Route Handlers)
│   │   ├── auth/               # Auth check/login/logout
│   │   ├── chat/               # Chat messages, sessions, search
│   │   ├── garage/             # Vehicles, trips, expenses
│   │   ├── houses/             # Properties, tenants, rent, expenses, work orders
│   │   ├── ledger/             # Global expense/income entries
│   │   ├── contacts/           # People/contacts with categories
│   │   ├── documents/          # Paper trail, receipts, uploads
│   │   ├── reminders/          # Reminder CRUD
│   │   ├── investments/        # Investment snapshots
│   │   ├── crypto/             # Crypto snapshots
│   │   ├── assets/             # Asset tracking
│   │   ├── quests/             # Quest CRUD + sub-items
│   │   └── voice/              # TTS proxy
│   ├── components/
│   │   ├── ErrorBoundary.tsx   # Per-module error isolation
│   │   ├── workspaces/         # One file per module (already exists)
│   │   ├── MenuCards.tsx       # Navigation grid
│   │   ├── VoiceAgent.tsx      # Chat agent
│   │   ├── ScoutPanel.tsx      # Settings/overlay
│   │   ├── HomeFeed.tsx        # Main dashboard
│   │   └── ...
│   ├── layout.tsx              # Root layout + service worker registration
│   ├── page.tsx                # Root page
│   └── globals.css             # Design tokens + all styles
├── lib/
│   ├── db.ts                   # SQLite connection + schema (ALREADY COMPLETE)
│   ├── api.ts                  # Client-side API wrapper (ALREADY COMPLETE)
│   ├── store.ts                # Client-side cache (ALREADY COMPLETE)
│   ├── auth.tsx                # Auth provider
│   ├── supply-drop.ts          # Supply Drop rotation engine
│   └── sw-registration.ts      # Service worker registration
├── types.ts                    # ALL type definitions (ALREADY COMPLETE)
└── public/
    ├── manifest.json           # PWA manifest
    ├── sw.js                   # Service worker
    └── icons/                  # PWA icons (192, 512)
```

### Key Principle: Modular Isolation

Every workspace is an **independent module**. If one crashes, the others keep running. This is achieved via:

1. **Error Boundaries** — Each workspace wrapped in `<ErrorBoundary fallback={...}>`
2. **Independent API routes** — Each module has its own `/api/<module>/` routes
3. **Independent state** — Each workspace manages its own loading/error states
4. **No cross-module imports** — Workspaces don't import from each other

---

## What Already Exists (DO NOT REBUILD)

| Component | Status | Notes |
|---|---|---|
| `lib/db.ts` | ✅ COMPLETE | 20+ tables, schema auto-initializes |
| `types.ts` | ✅ COMPLETE | All entity types defined |
| `lib/api.ts` | ✅ COMPLETE | Client API wrapper for all endpoints |
| `lib/store.ts` | ✅ COMPLETE | Client-side cache with pub/sub |
| `app/api/quests/` | ✅ COMPLETE | Full CRUD for quests + sub-items |
| `app/api/chat/` | ✅ COMPLETE | Messages, sessions, search |
| `app/api/reminders/` | ✅ COMPLETE | Reminder CRUD |
| `app/api/people/` | ✅ COMPLETE | Contact CRUD |
| `app/api/assets/` | ✅ COMPLETE | Asset CRUD |
| `app/api/investments/` | ✅ COMPLETE | Investment snapshots |
| `app/api/crypto/` | ✅ COMPLETE | Crypto snapshots |
| `VoiceAgent.tsx` | ✅ COMPLETE | Chat, sessions, search, rejection, Supply Drop |
| `MenuCards.tsx` | ✅ COMPLETE | Navigation grid, Supply Drop rotation |
| `ScoutPanel.tsx` | ✅ COMPLETE | Settings, font size, moods |
| `HomeFeed.tsx` | ✅ COMPLETE | Dashboard cards |
| `app-shell.tsx` | ✅ COMPLETE | Root shell, routing, state |
| `globals.css` | ✅ COMPLETE | Full design system |
| `public/manifest.json` | ✅ EXISTS | Needs icons + service worker |

### What Exists But Uses Hardcoded Data (WIRED TO API)

| Workspace | Current State | Action |
|---|---|---|
| `GarageWorkspace.tsx` | Hardcoded vehicle array | Wire to `/api/garage` |
| `HousesWorkspace.tsx` | Hardcoded property array | Wire to `/api/houses` |
| `LedgerWorkspace.tsx` | Hardcoded transaction sections | Wire to `/api/ledger` |
| `PaperTrailWorkspace.tsx` | Hardcoded receipt groups | Wire to `/api/documents` |
| `ConnectsWorkspace.tsx` | Hardcoded contact array | Wire to `/api/contacts` |
| `RemindersWorkspace.tsx` | Wired to store (partially) | Needs UI overhaul |

---

## Module Specifications

### Module 1: Garage (Vehicles)

**Tables:** `vehicles`, `vehicle_trips`, `vehicle_expenses` (already in DB)

**API Routes:**

```
GET    /api/garage                    → List all vehicles
POST   /api/garage                    → Add vehicle
PUT    /api/garage/:id                → Update vehicle
DELETE /api/garage/:id                → Remove vehicle

GET    /api/garage/:id/trips          → List trips for vehicle
POST   /api/garage/:id/trips          → Log trip
DELETE /api/garage/:id/trips/:tripId  → Remove trip

GET    /api/garage/:id/expenses       → List expenses for vehicle
POST   /api/garage/:id/expenses       → Log expense
DELETE /api/garage/:id/expenses/:expId → Remove expense
```

**Component:** `GarageWorkspace.tsx`

**UI Requirements:**
- Fleet value scoreboard (computed from vehicles)
- Vehicle cards with accordion expand (ALREADY BUILT — just needs data)
- "Add Vehicle" form (modal or inline): year, make, model, type, tag, ownership, status
- Trip log: date, odometer start/end, origin, destination, purpose, business use toggle
- Expense log: date, type (fuel/maintenance/insurance/registration/repairs), amount, notes
- Service reminders: upcoming maintenance based on mileage/time

**Acceptance Criteria:**
- [ ] Can add/edit/delete vehicles
- [ ] Can log trips with odometer tracking
- [ ] Can log vehicle expenses
- [ ] Fleet value auto-calculates
- [ ] Data persists to SQLite
- [ ] Works offline (cached reads)

---

### Module 2: Houses (Rental Properties)

**Tables:** `rental_properties`, `tenants`, `rent_records`, `rental_expenses`, `work_orders` (already in DB)

**API Routes:**

```
GET    /api/houses                        → List all properties
POST   /api/houses                        → Add property
PUT    /api/houses/:id                    → Update property
DELETE /api/houses/:id                    → Remove property

GET    /api/houses/:id/tenants            → List tenants
POST   /api/houses/:id/tenants            → Add tenant
PUT    /api/houses/:id/tenants/:tid       → Update tenant

GET    /api/houses/:id/rent               → Rent records
POST   /api/houses/:id/rent               → Log rent payment
PUT    /api/houses/:id/rent/:rid          → Update rent record

GET    /api/houses/:id/expenses           → Property expenses
POST   /api/houses/:id/expenses           → Log expense
DELETE /api/houses/:id/expenses/:eid      → Remove expense

GET    /api/houses/:id/work-orders        → Work orders
POST   /api/houses/:id/work-orders        → Create work order
PUT    /api/houses/:id/work-orders/:wid   → Update work order
DELETE /api/houses/:id/work-orders/:wid   → Close/cancel work order
```

**Component:** `HousesWorkspace.tsx`

**UI Requirements:**
- Property cards with accordion (ALREADY BUILT — needs data)
- Property detail view: address, insurance, mortgage progress bar, tenant info
- Rent tracker: who paid, when, amount, late fees
- Expense tracker per property: mortgage, utilities, insurance, repairs, lawn
- Work order board: planned → in-progress → completed
- Vacancy alerts on main dashboard

**Acceptance Criteria:**
- [ ] Can add/edit/delete properties
- [ ] Can manage tenants per property
- [ ] Can log rent payments with status (due/paid/late)
- [ ] Can log property expenses with categories
- [ ] Can create and track work orders
- [ ] Mortgage progress bar calculates from data
- [ ] Vacancy alerts show on HomeFeed

---

### Module 3: Ledger (Expenses & Income)

**Tables:** Uses `rental_expenses`, `vehicle_expenses`, plus a new `global_ledger` table

**New Table:**
```sql
CREATE TABLE IF NOT EXISTS global_ledger (
  entry_id TEXT PRIMARY KEY,
  date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  amount REAL NOT NULL DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'out',  -- 'in' or 'out'
  source TEXT NOT NULL DEFAULT '',  -- 'rental', 'vehicle', 'personal', 'paycheck'
  property_id TEXT DEFAULT '',
  vehicle_id TEXT DEFAULT '',
  receipt_url TEXT DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**API Routes:**

```
GET    /api/ledger                    → List entries (with filters: date, category, source)
POST   /api/ledger                    → Add entry
PUT    /api/ledger/:id                → Update entry
DELETE /api/ledger/:id                → Remove entry
GET    /api/ledger/summary            → Monthly totals (in/out/net by category)
GET    /api/ledger/export             → CSV export
```

**Component:** `LedgerWorkspace.tsx`

**UI Requirements:**
- Net this month scoreboard (ALREADY BUILT — needs real data)
- Sections: rental income, investments, property expenses, personal expenses
- Add entry form: date, description, category, amount, direction, source
- Filter by: date range, category, source
- CSV export button
- Running balance calculation

**Acceptance Criteria:**
- [ ] Can add/edit/delete ledger entries
- [ ] Scoreboard shows real calculated totals
- [ ] Filter by category and date range
- [ ] CSV export works
- [ ] Categories match the existing type system

---

### Module 4: Connects (Contacts)

**Tables:** Uses existing `people` table (already in DB)

**API Routes:** Already exist at `/api/people/`

**Component:** `ConnectsWorkspace.tsx`

**UI Requirements:**
- Contact cards with accordion (ALREADY BUILT — needs data)
- Add contact form: name, type, phone, relation, note, category, subcategory
- Sort: A→Z or by category (ALREADY BUILT)
- Category groups: contractors, fam, work (ALREADY BUILT)
- Quick action: tap phone to call, tap email to compose
- Search/filter contacts

**Acceptance Criteria:**
- [ ] Can add/edit/delete contacts
- [ ] Sort by name or category
- [ ] Category grouping works
- [ ] Phone/email actions work on mobile
- [ ] Data persists to SQLite

---

### Module 5: Paper Trail (Documents & Receipts)

**Tables:** `rental_documents` (already in DB) + new `documents` table for global docs

**New Table:**
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

**API Routes:**

```
GET    /api/documents                  → List all (with filters)
POST   /api/documents                  → Add document
PUT    /api/documents/:id              → Update document
DELETE /api/documents/:id              → Remove document
POST   /api/documents/upload           → Upload file (saves to /public/uploads/)
GET    /api/documents/export           → CSV export
```

**Component:** `PaperTrailWorkspace.tsx`

**UI Requirements:**
- Receipt groups by asset/category (ALREADY BUILT — needs data)
- Filter chips (ALREADY BUILT)
- Add receipt: vendor, detail, amount, date, category, upload image
- File upload: camera capture or file select on mobile
- Export to CSV
- Running total (ALREADY BUILT)

**Acceptance Criteria:**
- [ ] Can add/edit/delete documents
- [ ] File upload works (image capture on mobile)
- [ ] Filter by asset/category
- [ ] CSV export works
- [ ] Receipts link to related properties/vehicles

---

### Module 6: Reminders

**Tables:** `reminders` (already in DB)

**API Routes:** Already exist at `/api/reminders/`

**Component:** `RemindersWorkspace.tsx`

**UI Requirements:**
- Reminder list with toggle/remove (ALREADY BUILT)
- Add form: label, due date, priority, link to quest (ALREADY BUILT)
- Overdue alerts on HomeFeed
- **Push notification integration** (see PWA section)

**Acceptance Criteria:**
- [ ] Full CRUD works
- [ ] Priority levels: Quiet, Normal, Important
- [ ] Overdue reminders highlighted
- [ ] Push notifications for Important reminders

---

### Module 7: Chat Agent (VoiceAgent)

**Tables:** `chat_sessions`, `chat_messages` (already in DB)

**API Routes:** Already exist at `/api/chat/`

**Component:** `VoiceAgent.tsx`

**Status:** ✅ FULLY FUNCTIONAL — Do not rebuild. Only improvements:
- Push notification when new response arrives (if app is in background)
- Session auto-archiving after 24h inactivity

**Acceptance Criteria:**
- [ ] All existing features preserved
- [ ] Background push notification for new responses
- [ ] Session auto-archive works

---

### Module 8: PWA & Offline Support

**New Files:**
```
public/
├── sw.js                   # Service worker
├── icons/
│   ├── icon-192.png        # PWA icon
│   └── icon-512.png        # PWA icon
└── manifest.json           # ALREADY EXISTS — needs icons updated

src/lib/
└── sw-registration.ts      # Register service worker in layout
```

**Service Worker Strategy:**

```javascript
// sw.js — Network-first for API, Cache-first for static assets
const STATIC_CACHE = 'sqhq-static-v1';
const API_CACHE = 'sqhq-api-v1';

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
        '/globals.css',
      ]);
    })
  );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    // Network-first for API calls
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
});
```

**Registration (in `layout.tsx`):**
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

**Acceptance Criteria:**
- [ ] App shell cached on first load
- [ ] Offline: cached pages still load
- [ ] Offline: API calls fall back to cached responses
- [ ] PWA install prompt works on mobile
- [ ] Icons display correctly on home screen

---

### Module 9: Push Notifications

**Implementation:**

1. **Service Worker** handles push events
2. **API Route** `/api/notifications/subscribe` stores subscription
3. **Server-side** triggers push on:
   - New chat response (when app is backgrounded)
   - Important reminder due
   - Supply Drop rotation (weekly)

**New Table:**
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'eddie',
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Acceptance Criteria:**
- [ ] Browser push permission prompt works
- [ ] Chat responses push when app is backgrounded
- [ ] Important reminders push
- [ ] Supply Drop rotation pushes weekly
- [ ] Subscriptions stored in DB

---

### Module 10: Error Boundaries

**New Component:** `ErrorBoundary.tsx`

```typescript
// Wraps each workspace module
// If one module crashes, others keep running
// Shows fallback UI with "retry" button

<ErrorBoundary fallback={<ModuleError name="Garage" onRetry={() => ...} />}>
  <GarageWorkspace onBack={...} />
</ErrorBoundary>
```

**Implementation:**
- One `ErrorBoundary` component with configurable fallback
- Wrap each workspace in `app-shell.tsx`
- Log errors to console (future: send to server)
- Show friendly "Something went wrong" with retry button

**Acceptance Criteria:**
- [ ] Each workspace wrapped in ErrorBoundary
- [ ] Crash in one module doesn't affect others
- [ ] Fallback UI shows module name + retry button
- [ ] Errors logged to console

---

## Build Order (Priority)

| Phase | Module | Effort | Impact |
|---|---|---|---|
| **1** | Error Boundaries | 30 min | Safety net for everything else |
| **2** | Garage (wire to API) | 2 hours | Most tangible — vehicles are real |
| **3** | Houses (wire to API) | 2 hours | Rental income tracking |
| **4** | Ledger (new table + wire) | 2 hours | Financial visibility |
| **5** | Connects (wire to API) | 1 hour | Already mostly built |
| **6** | Paper Trail (new table + wire) | 2 hours | Receipt management |
| **7** | PWA (service worker + icons) | 2 hours | Offline + install |
| **8** | Push Notifications | 2 hours | App feels alive |
| **9** | Reminders push integration | 1 hour | Ties into push |

**Total estimated effort: ~15 hours of focused coding**

---

## Design Constraints

1. **Quiet Terminal Brutalism** — Dark #080808 background, mono+serif fonts, minimal UI
2. **Purple = Scout only** — Never use purple on non-Scout elements
3. **Mobile-first** — Cards maximize phone screen space, full width, minimal margin
4. **No new dependencies** — Use what's already in package.json (Next.js, React, better-sqlite3)
5. **Modular isolation** — Error boundaries on every workspace, no cross-module imports
6. **TypeScript strict** — All new code must type-check clean
7. **Existing API patterns** — Follow the same fetch/response patterns in `lib/api.ts`

---

## Data Seeding

For initial development, seed the database with Eddie's real data:

**Vehicles:**
- 2019 Porsche Cayman — tag: SQHQ-911, owned, $58K value
- 2021 Ford F-150 — tag: TBD, financed, $485/mo
- 1960 VW Baja Bug — K20 swap, project, in progress

**Properties:**
- W. Lee Ave, Osceola TN — occupied, paid off, $1,450/mo rent
- Poplar Ave, Memphis TN — vacant, financed, $1,150/mo mortgage

**Contacts:**
- Derek Thompson (builder, IRL Cyony)
- Martinez Carlos (mechanic)
- Patel Raj (electrician)
- GreenScape LLC (lawn)
- Mom
- Savage (night shift partner)

See `src/app/components/workspaces/*.tsx` for the full hardcoded data to migrate.

---

## Testing Checklist

For each module:
- [ ] Add item → appears in list
- [ ] Edit item → changes persist
- [ ] Delete item → removed from list
- [ ] Refresh page → data still there
- [ ] Open different module → previous module's state preserved
- [ ] Crash one module → others still work
- [ ] Go offline → cached data loads
- [ ] Come back online → fresh data fetches

---

## Questions for Eddie

None. This spec is complete. Build it.

---

*— Cyony, your architect* 🔧
