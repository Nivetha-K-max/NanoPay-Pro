# NanoPay Pro - TODO

## Fix app not running & Local Setup

- [x] Update `vite.config.ts` to fix TanStack virtual module resolution errors (`#tanstack-router-entry`, `#tanstack-start-entry`) by removing `vite-tsconfig-paths` and enabling native `resolve.tsconfigPaths`.
- [x] Restart dev server and verify no Vite dependency optimization errors.
- [x] Created `.env` file with database credentials and JWT secret
- [ ] If backend still not running, check backend logs separately (Prisma env / TS vs JS runtime).

---

## Setup Steps to Run the App

### Step 1: Prisma Setup
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate dev --name init` (creates PostgreSQL tables)

### Step 2: Start Backend (Terminal 1)
- [ ] Run `npx tsx watch server/index.ts` — Starts Express on port 5000

### Step 3: Start Frontend (Terminal 2)
- [ ] Run `npm run dev` — Starts Vite on port 3000

### Step 4: Verify
- [ ] Open http://localhost:3000 — Frontend
- [ ] Open http://localhost:5000/api/health — Backend health check

---

## Notification Preferences + Quiet Hours

### Step 1 — Update NotificationService to enforce preferences
- [ ] Inject `NotificationPreferenceRepository`
- [ ] Add defaulting to `NotificationPreference.defaultsFor(user)` when missing
- [ ] Gate in-app persistence/websocket and email sending based on `shouldDeliver`

### Step 2 — Implement quiet hours suppression
- [ ] Extend `NotificationPreference.shouldDeliver(...)` to return false when quiet hours enabled and current time is inside quiet-hours window
- [ ] Ensure security events still return true even during quiet hours
- [ ] Handle windows that wrap midnight (e.g., 22 -> 8)

### Step 3 — Build/verify
- [ ] Run Maven tests/build for affected modules (`nanopay-core`, `nanopay-infrastructure`)
- [ ] Smoke-check compilation


