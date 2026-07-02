# PATCH 005 — Biometric / Passkey Authentication

## Overview
Add WebAuthn (Passkeys) support so Eddie can log in with fingerprint/face on mobile instead of typing the password every time.

---

## How WebAuthn Works
1. **Registration**: After first password login, prompt "Save passkey for faster login?" → browser triggers biometric → stores a credential on device
2. **Authentication**: On login screen, show "Use passkey" button → browser triggers biometric → verifies against stored credential → logs in

No password needed after initial setup. Works on Android (fingerprint/PIN) and iOS (Face ID/Touch ID).

---

## Database Changes

### New table: `passkeys`
```sql
CREATE TABLE IF NOT EXISTS passkeys (
  id TEXT PRIMARY KEY,           -- credential ID (base64url)
  user_id TEXT NOT NULL,         -- 'eddie'
  public_key TEXT NOT NULL,      -- public key (base64url)
  counter INTEGER NOT NULL DEFAULT 0,  -- signature counter
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## API Routes

### `POST /api/auth/passkey/register/options`
- Called to get registration options (challenge, user info, RP info)
- Returns WebAuthn `PublicKeyCredentialCreationOptions`
- Challenge stored in session for verification

### `POST /api/auth/passkey/register/verify`
- Called after browser completes biometric prompt
- Receives the attestation response
- Verifies challenge matches, stores credential in `passkeys` table
- Returns success/failure

### `POST /api/auth/passkey/login/options`
- Called to get authentication options (challenge, allowed credentials)
- Returns WebAuthn `PublicKeyCredentialRequestOptions`
- Challenge stored in session

### `POST /api/auth/passkey/login/verify`
- Called after browser completes biometric prompt
- Receives the assertion response
- Verifies signature against stored public key
- Updates counter
- Sets session (same as password login)
- Returns success/failure

### `DELETE /api/auth/passkey/:id`
- Remove a registered passkey (settings/management)

### `GET /api/auth/passkey/list`
- List registered passkeys for the user

---

## Frontend Changes

### Login Page (`/login/page.tsx`)
- Add "Use passkey" button ABOVE the password field
- When tapped: calls `/api/auth/passkey/login/options` → `navigator.credentials.get()` → calls `/api/auth/passkey/login/verify`
- If no passkeys registered, button shows "Set up passkey" instead
- After successful password login, show prompt: "Save passkey for faster login?" with "Yes"/"Not now" buttons
  - Yes → calls `/api/auth/passkey/register/options` → `navigator.credentials.create()` → calls `/api/auth/passkey/register/verify`

### Key UI Elements
```
┌─────────────────────────┐
│      SideQuest HQ       │
│                         │
│   [ fingerprint icon ]  │
│   Use passkey           │  ← NEW: primary action
│                         │
│   ─── or ───            │
│                         │
│   [ Password field ]    │
│   [ Enter HQ button ]   │
│                         │
│   Save passkey after    │  ← NEW: shown after password login
│   password login?       │
└─────────────────────────┘
```

---

## Implementation Notes

### Dependencies needed
- `@simplewebauthn/server` — server-side WebAuthn verification
- `@simplewebauthn/browser` — client-side WebAuthn prompts

### WebAuthn Config
```typescript
const rpName = "SideQuest HQ";
const rpID = process.env.WEBAUTHN_RP_ID || "localhost"; // set to Tailscale IP or domain in prod
const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3456";
```

### Important
- `rpID` must match the domain/IP being accessed (e.g., `100.85.111.32` for Tailscale)
- `origin` must match the full origin URL
- For Tailscale deployment: set `WEBAUTHN_RP_ID=100.85.111.32` and `WEBAUTHN_ORIGIN=http://100.85.111.32:3456`
- For local dev: `WEBAUTHN_RP_ID=localhost` and `WEBAUTHN_ORIGIN=http://localhost:3000`

### Security
- Challenge expires after 60 seconds
- Counter prevents replay attacks
- Only 'eddie' user can register passkeys (single-user app)
- Passkeys are device-bound (can't be transferred)

---

## Files to Create/Modify

1. **`src/app/api/auth/passkey/register/options/route.ts`** — registration options
2. **`src/app/api/auth/passkey/register/verify/route.ts`** — registration verification
3. **`src/app/api/auth/passkey/login/options/route.ts`** — authentication options
4. **`src/app/api/auth/passkey/login/verify/route.ts`** — authentication verification
5. **`src/app/api/auth/passkey/list/route.ts`** — list passkeys
6. **`src/app/api/auth/passkey/[id]/route.ts`** — delete passkey
7. **`src/lib/passkey.ts`** — shared WebAuthn config and helpers
8. **`src/lib/db.ts`** — add passkeys table to initSchema
9. **`src/app/login/page.tsx`** — add passkey buttons and flow
10. **`package.json`** — add @simplewebauthn/server and @simplewebauthn/browser

---

## Verification
- [ ] `npm run build` passes
- [ ] Login page shows "Use passkey" button
- [ ] After password login, "Save passkey?" prompt appears
- [ ] Registering passkey triggers biometric prompt
- [ ] Subsequent logins work with passkey (no password needed)
- [ ] Works on Android Chrome and iOS Safari
- [ ] Passkey list endpoint shows registered credentials
- [ ] Deleting a passkey removes it from DB
