# SideQuestHQ — Audit Results & TODO List
## Compiled: July 1, 2026
## Audited by: Kimi (Security) + Codex (Code Quality)

---

## 🔴 CRITICAL — Fix Before Anything Else

| # | Issue | What It Means | Fix Effort |
|---|-------|--------------|------------|
| 1 | **Login accepts ANY password** | The auth route skips password check entirely. Anyone can log in with any password. | S |
| 2 | **Snooze-log API has NO auth** | Any unauthenticated user can read/inject/acknowledge snooze entries | S |
| 3 | **MiMo API URL hardcoded** | Can't change endpoints per environment, exposes infrastructure in source | S |

---

## 🟠 HIGH — Fix Before Going Live

| # | Issue | What It Means | Fix Effort |
|---|-------|--------------|------------|
| 4 | **No rate limiting anywhere** | Brute-force login possible, any endpoint can be flooded | M |
| 5 | **No input validation (no Zod)** | User data used directly, no length limits or type checks | M |
| 6 | **No CSRF protection** | State-changing requests have no token verification | M |
| 7 | **Supabase anon key on client** | Need to verify RLS is enabled on all tables (or remove Supabase) | S |
| 8 | **Seed password hash in source code** | `hualslx` bcrypt hash committed to repo | S |

---

## 🟡 MEDIUM — Clean Up Before Final Form

| # | Issue | What It Means | Fix Effort |
|---|-------|--------------|------------|
| 9 | **10 dead component files** | ~3,000 lines of dead code (old workspace files) | S |
| 10 | **Duplicate login pages** | `login/page.tsx` AND `login-page.tsx` both exist | S |
| 11 | **22 `any` types in codebase** | Loses TypeScript safety, especially in API layer | M |
| 12 | **Zero `useMemo` usage** | FeedItems rebuilt every render, no memoization anywhere | M |
| 13 | **No security headers** | Missing CSP, HSTS, X-Frame-Options | S |
| 14 | **30-day session expiry** | Too long for financial data. Should be 7 days | S |
| 15 | **No accessibility basics** | No skip-to-content, no keyboard nav on swipe cards, no aria-live | M |
| 16 | **93 inline style objects** | Performance hit, harder to maintain | M |
| 17 | **AppShell is a 387-line god component** | All business logic in one file, ~20 useState hooks | L |
| 18 | **Cloudflare wildcard in dev origins** | Remove `*.trycloudflare.com` before production | S |
| 19 | **No `.env.example` for secrets** | Deployers won't know to set SESSION_SECRET or MIMO_API_KEY | S |

---

## 🔵 LOW — Nice to Have

| # | Issue | Fix Effort |
|---|-------|------------|
| 20 | `.pumpkin-protocol.env` tracked in git | S |
| 21 | SQLite database path is predictable | S |
| 22 | `suppressHydrationWarning` on body hides bugs | S |
| 23 | Duplicate category-matching logic in HomeFeed/CardView | S |
| 24 | Seed data in client bundle (only used by dead persistence.ts) | S |

---

## ✅ What's Already Good

| Area | Status |
|------|--------|
| SQL injection protection | ✅ All queries parameterized |
| XSS protection | ✅ No dangerouslySetInnerHTML |
| Server-side API keys | ✅ Only in server routes |
| Session basics | ✅ httpOnly, sameSite, secure in prod |
| .gitignore coverage | ✅ Excludes .env, .db, data/ |
| Voice endpoint auth | ✅ Fixed — checks session |
| TypeScript compilation | ✅ Clean build, zero errors |
| **Build passes** | ✅ `next build` succeeds |

---

## 📋 MASTER TODO — Priority Order

### Phase 1: Security Lockdown (Tonight)
- [ ] Fix login password verification (bcrypt.compare)
- [ ] Add auth to snooze-log endpoint
- [ ] Add rate limiting to login
- [ ] Move MiMo URL to env variable
- [ ] Add security headers to next.config.mjs

### Phase 2: Dead Code Cleanup (Quick Wins)
- [ ] Delete 10 old workspace component files
- [ ] Delete `persistence.ts`
- [ ] Delete `Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx`
- [ ] Delete duplicate `login-page.tsx`
- [ ] Remove seed data from client bundle
- [ ] Add SESSION_SECRET + MIMO_API_KEY to .env.example

### Phase 3: Code Quality
- [ ] Replace 22 `any` types with proper types
- [ ] Add `useMemo` to HomeFeed (feedItems)
- [ ] Add `useCallback` to handlers
- [ ] Add `React.memo` to SwipeableCard
- [ ] Type Quest.status and Quest.type properly
- [ ] Fix request polling cleanup on unmount

### Phase 4: Architecture
- [ ] Split AppShell into smaller components/hooks
- [ ] Create shared `<WorkspaceLayout>` wrapper
- [ ] Extract inline styles to CSS classes
- [ ] Add accessibility (skip-to-content, keyboard nav, aria-live)

### Phase 5: Property Tracker Module
- [ ] Build property dashboard panel
- [ ] Add mortgage/payment tracking
- [ ] Add contractor payment ledger
- [ ] Add rental income tracking
- [ ] Import existing data from /opt/data/manila-house/

---

## ⏱ Estimated Total Effort

| Phase | Effort | Time |
|-------|--------|------|
| Phase 1: Security | S-M items | ~1-2 hours |
| Phase 2: Cleanup | All S items | ~30 min |
| Phase 3: Code Quality | S-M items | ~2-3 hours |
| Phase 4: Architecture | M-L items | ~3-4 hours |
| Phase 5: New Features | M-L items | ~4-6 hours |
| **TOTAL** | | **~11-16 hours** |

> Realistic timeline: 2-3 sessions with Codex/Kimi

---
*Audit sources: Kimi (security, 17 API calls) + Codex/MiMo (code review, 19 API calls)*
*Next step: Start Phase 1 tonight*
