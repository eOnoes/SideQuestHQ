# Security Review — SideQuest.HQ

**Reviewed:** June 26, 2026  
**Reviewer:** Hermes Agent (automated)  
**Scope:** Full codebase at `D:\Trippcore\SideQuestHQ`  
**Status:** Pre-deployment (local dev only)

---

## Executive Summary

SideQuest.HQ has a reasonable foundation — parameterized SQL queries, iron-session for auth, and no `dangerouslySetInnerHTML`. However, there are several **critical and high-severity issues** that must be addressed before any public deployment. The authentication system is fundamentally weak, an API route is completely unprotected, and the session secret has a hardcoded fallback.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 4 |
| 🟡 Medium | 5 |
| 🔵 Low / Info | 4 |

---

## 🔴 CRITICAL Findings

### C1. Password Hashing Is Trivially Breakable

**Files:** `src/app/api/auth/login/route.ts` (lines 6–13), `src/lib/db.ts` (line 315)

The app uses a custom DJB2-style integer hash for passwords:

```typescript
function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return "h" + Math.abs(h).toString(36);
}
```

The seeded user in `db.ts` has `password_hash: 'hualslx'`, which is the hash of a short string. This hash:
- Has **no salt** — identical passwords produce identical hashes
- Has **no iterations/work factor** — computable in nanoseconds
- Produces only ~32 bits of output — trivially brute-forced
- Is **not a password hashing algorithm** (no bcrypt, argon2, scrypt)

**Impact:** Anyone with read access to the SQLite database file can recover the password almost instantly. An attacker who can make API calls can brute-force the login endpoint.

**Recommendation:**
- Use `bcrypt` or `argon2` for password hashing
- Add salt and proper work factor
- For a single-user app, a long passphrase hashed with argon2id is ideal

```bash
npm install bcryptjs
```

---

### C2. Voice API Endpoint Has No Authentication

**File:** `src/app/api/voice/route.ts`

The `/api/voice` POST endpoint has **no session check**. Compare with every other API route:

```typescript
// Every other route does this:
const session = await getSession();
if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// /api/voice does NOT:
export async function POST(req: NextRequest) {
  // Jumps straight to processing — no auth check
  const { text, mood } = await req.json()
```

**Impact:** Anyone who can reach the server can send arbitrary prompts to the MiMo AI endpoint, consuming your `MIMO_API_KEY` quota and potentially extracting the Chloe system prompt. This is an **unauthenticated API key relay**.

**Recommendation:** Add session validation at the top of the POST handler, consistent with all other routes.

---

### C3. Session Secret Has Hardcoded Fallback

**File:** `src/lib/session.ts` (line 10)

```typescript
password: process.env.SESSION_SECRET || "fallback-dev-secret-change-me-in-production-32c",
```

If `SESSION_SECRET` is not set in the environment (and `.env.example` doesn't list it), iron-session will use this known, committed string. Anyone who reads this source code can:
- Forge session cookies
- Authenticate as any user
- Bypass all session-based protections

**Impact:** Complete authentication bypass in production if the env var isn't set.

**Recommendation:**
1. Remove the fallback — **crash on startup** if `SESSION_SECRET` is missing:
   ```typescript
   password: process.env.SESSION_SECRET!,
   ```
2. Add `SESSION_SECRET` to `.env.example` (with a placeholder, not the real value)
3. Generate a strong secret: `openssl rand -hex 32`

---

## 🟠 HIGH Findings

### H1. Snooze Log Endpoint Is Completely Unprotected

**File:** `src/app/api/snooze-log/route.ts`

All three HTTP methods (POST, GET, PATCH) lack session checks:

```typescript
export async function POST(req: NextRequest) {
  // No session check — anyone can write snooze events
  
export async function GET() {
  // No session check — anyone can read all snooze data
  
export async function PATCH() {
  // No session check — anyone can mark snoozes as acknowledged
```

**Impact:** An unauthenticated attacker can:
- Read snooze activity (minor data leak)
- Inject fake snooze entries (pollute data)
- Acknowledge all snoozes, hiding real user activity

**Recommendation:** Add `getSession()` + `isLoggedIn` check to all three handlers.

---

### H2. Supabase Anon Key Exposed to Client — RLS Must Be Verified

**File:** `src/lib/supabase.ts`

```typescript
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

The `NEXT_PUBLIC_` prefix causes Next.js to bundle this into client-side JavaScript. This is **by design** for Supabase — the anon key is meant to be public. However, security depends entirely on **Row Level Security (RLS)** being enabled on every Supabase table.

**Impact:** If RLS is not configured, anyone can read/write all Supabase data using the exposed anon key. The app currently uses SQLite as primary storage, but `syncFromServer()` in `supabase.ts` directly queries Supabase tables.

**Recommendation:**
1. Verify RLS is enabled on all Supabase tables
2. Add RLS policies scoped to authenticated users
3. Test with an unauthenticated client to confirm access is denied
4. Consider whether Supabase is needed at all if SQLite is the primary store

---

### H3. No Rate Limiting on Login Endpoint

**File:** `src/app/api/auth/login/route.ts`

There is no rate limiting, account lockout, or brute-force protection on the login endpoint.

**Impact:** An attacker can attempt unlimited passwords. Combined with the weak hash function (C1), this is trivially exploitable.

**Recommendation:**
- Implement rate limiting (e.g., 5 attempts per minute per IP)
- Add progressive delays on failed attempts
- Consider using `next-rate-limit` or similar middleware
- Add CAPTCHA after N failed attempts

---

### H4. No Input Validation or Sanitization

**Files:** All API routes under `src/app/api/`

User-supplied data is used directly without validation:

```typescript
// No length limits, no type checking, no sanitization
const body = await req.json();
db.prepare("INSERT INTO reminders ...").run(body.label, ...);
```

**Impact:**
- Extremely large payloads could cause DoS (memory exhaustion)
- Malicious content in chat messages/notes could be rendered unexpectedly
- Field values aren't type-checked — unexpected types could cause runtime errors

**Recommendation:**
- Add input validation middleware (e.g., `zod`)
- Enforce max lengths on string fields
- Validate data types before insertion
- Consider using `next-api-middleware` for cross-cutting concerns

---

## 🟡 MEDIUM Findings

### M1. `SESSION_SECRET` Not Listed in `.env.example`

**File:** `.env.example`

The `.env.example` file only lists Supabase variables:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`SESSION_SECRET` and `MIMO_API_KEY` are not mentioned, making it easy for a deployer to miss them.

**Recommendation:** Add both to `.env.example`:
```
SESSION_SECRET=generate-with-openssl-rand-hex-32
MIMO_API_KEY=your-xiaomi-mimo-key
```

---

### M2. No Security Headers Configured

**File:** `next.config.mjs`

The Next.js config has no security headers:

```javascript
const nextConfig = {
  turbopack: { root: import.meta.dirname },
  allowedDevOrigins: ['*.trycloudflare.com'],
};
```

Missing headers:
- `Content-Security-Policy` (CSP) — no XSS mitigation
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` — clickjacking risk
- `Strict-Transport-Security` — no HTTPS enforcement
- `Referrer-Policy`
- `Permissions-Policy`

**Recommendation:** Add headers in `next.config.mjs`:
```javascript
headers: [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
    ],
  },
],
```

---

### M3. Cloudflare Tunnel Origin in Config (Dev Only)

**File:** `next.config.mjs` (line 7)

```javascript
allowedDevOrigins: ['*.trycloudflare.com'],
```

This wildcard allows any Cloudflare tunnel subdomain to access the dev server. While `allowedDevOrigins` only affects development mode, it should be removed or tightened before any production deployment.

**Recommendation:** Remove or restrict this setting for production builds.

---

### M4. 30-Day Session Expiry Is Excessively Long

**File:** `src/lib/session.ts` (line 16)

```typescript
maxAge: 60 * 60 * 24 * 30, // 30 days
```

For an app handling financial data (investments, crypto, rental properties), a 30-day session is very long. If a session cookie is stolen, it remains valid for a month.

**Recommendation:** Reduce to 7 days for a balance of security and UX, or implement session revocation on sensitive actions.

---

### M5. Error Messages Leak User Existence

**File:** `src/app/api/auth/login/route.ts` (lines 24–26 vs 29–31)

```typescript
if (!user) {
  return NextResponse.json({ error: "No user found" }, { status: 500 });
}
// vs
if (pwHash !== user.password_hash) {
  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
```

Different error messages/status codes reveal whether the user exists. (Low risk here since user ID is hardcoded "eddie", but a bad pattern for future multi-user expansion.)

**Recommendation:** Return a generic "Invalid credentials" for both cases.

---

## 🔵 LOW / INFORMATIONAL Findings

### L1. No CSRF Protection Beyond `sameSite` Cookie

Iron-session's `sameSite: "lax"` provides basic CSRF protection for GET-based state changes, but POST/PUT/DELETE requests from the same origin are not CSRF-protected. For a single-user local app, this is acceptable, but add CSRF tokens for production.

### L2. `.pumpkin-protocol.env` Is Tracked in Git

This file contains routing logic (not secrets), but `.env` files in git can be confusing for reviewers. Consider renaming to `.pumpkin-protocol.md` or adding it to `.gitignore`.

### L3. SQLite Database File Path Is Deterministic

`src/lib/db.ts` line 4: `const DB_PATH = path.join(process.cwd(), "data", "sqhq.db");`

The DB path is predictable. While `data/` is in `.gitignore`, ensure the file has appropriate OS-level permissions on the deployment server.

### L4. No HTTPS Enforcement

The app doesn't enforce HTTPS. For local dev this is fine, but for any public deployment, use a reverse proxy (nginx/Caddy) that terminates TLS.

---

## ✅ What's Done Well

| Area | Status |
|------|--------|
| **Parameterized SQL queries** | ✅ All queries use `?` or `@named` params — no SQL injection |
| **React content escaping** | ✅ No `dangerouslySetInnerHTML` or `innerHTML` usage |
| **Server-side API keys** | ✅ `MIMO_API_KEY` is only used in server routes |
| **Session security basics** | ✅ `httpOnly: true`, `sameSite: "lax"`, secure in production |
| **`.gitignore` coverage** | ✅ Excludes `.env`, `.env.local`, `*.db`, `data/` |
| **No client-side secrets** | ✅ Only `NEXT_PUBLIC_SUPABASE_*` exposed (by design) |
| **Parameterized dynamic queries** | ✅ Quest UPDATE uses whitelisted field names from code |
| **Route authentication** | ✅ Most routes check `session.isLoggedIn` |
| **Better-sqlite3** | ✅ Uses WAL mode and foreign keys |

---

## Priority Remediation Checklist

### Before Any Deployment (Must Fix)

- [ ] **C1:** Replace custom hash with bcrypt/argon2
- [ ] **C2:** Add auth check to `/api/voice`
- [ ] **C3:** Remove hardcoded session secret fallback
- [ ] **H1:** Add auth check to `/api/snooze-log`
- [ ] **H2:** Verify Supabase RLS is enabled on all tables
- [ ] **M1:** Add `SESSION_SECRET` and `MIMO_API_KEY` to `.env.example`

### Before Public Deployment (Should Fix)

- [ ] **H3:** Add rate limiting to login endpoint
- [ ] **H4:** Add input validation middleware
- [ ] **M2:** Add security headers in next.config
- [ ] **M3:** Remove `trycloudflare.com` from allowed origins
- [ ] **M4:** Reduce session expiry to 7 days
- [ ] **M5:** Use generic login error messages
- [ ] **L4:** Configure HTTPS via reverse proxy

### Nice to Have

- [ ] **L1:** Add CSRF token protection
- [ ] **L2:** Rename `.pumpkin-protocol.env` to non-env extension
- [ ] **L3:** Restrict SQLite file permissions on deploy
- [ ] Add Content-Security-Policy header
- [ ] Add structured logging for auth events
- [ ] Implement session revocation mechanism

---

*Report generated by automated security review. Manual penetration testing recommended before production deployment.*
