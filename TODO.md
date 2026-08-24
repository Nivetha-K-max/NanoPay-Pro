## TODO - Fix app not running

- [x] Update `vite.config.ts` to fix TanStack virtual module resolution errors (`#tanstack-router-entry`, `#tanstack-start-entry`) by removing `vite-tsconfig-paths` and enabling native `resolve.tsconfigPaths`.

- [x] Restart dev server and verify no Vite dependency optimization errors.

- [x] Created `.env` file with database credentials and JWT secret

- [ ] If backend still not running, check backend logs separately (Prisma env / TS vs JS runtime).

---

## Setup Steps to Run the App

### Step 1: Prisma Setup
- [ ] Run `npx prisma generate` — ⏳ In progress
- [ ] Run `npx prisma migrate dev --name init` (creates PostgreSQL tables)

### Step 2: Start Backend (Terminal 1)
- [ ] Run `npx tsx watch server/index.ts` — Starts Express on port 5000

### Step 3: Start Frontend (Terminal 2)
- [ ] Run `npm run dev` — Starts Vite on port 3000 (⚠️ known TanStack compat issue)

### Step 4: Verify
- [ ] Open http://localhost:3000 — Frontend
- [ ] Open http://localhost:5000/api/health — Backend health check

