# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Cashlog («کش لاگر») is a Persian (RTL, Jalali calendar) mobile-first PWA for logging daily income and costs.
Next.js 16 App Router + React 19, Supabase (auth + Postgres with RLS), Zustand, Tailwind v4, shadcn/radix, Recharts.

## Commands

Package manager is pnpm.

- `pnpm dev` — dev server on http://localhost:3000
- `pnpm build` — production build (also the type check; there is no separate `tsc` script)
- `pnpm lint` — ESLint (next core-web-vitals + typescript)

There is no test suite. Verify changes with `pnpm lint` and `pnpm build`, and by running the app.

Env (`.env`, git-ignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY`/secret key for `lib/supabase/admin.ts` (server only).

## Architecture

### Client-side page switching (not normal Next routing)
`app/*/page.tsx` for app pages return `null`. The real views are rendered by `components/web/AppViews.tsx`
in `app/layout.tsx`, keyed by `usePathname()` (`/` → HomeView, `/logs` → TransactionList, `/user`,
`/categories`). Navigation uses `navigate()` / `NavLink` from `lib/nav.ts`, which call `history.pushState`
directly — **never use `next/link` or `router.push` between app pages**. Visited tabs stay mounted but `hidden`;
use `useViewActive()` (`components/web/ViewActive.tsx`) to skip work (e.g. charts) in hidden tabs. When adding
a page, register it in both `VIEWS` (AppViews) and `ORDER` (lib/nav.ts — also drives slide direction).
`SwipeNav` changes tabs by swiping. `/login` and `/auth/*` are ordinary server-rendered routes.

### Offline-first data sync
All transaction/category data lives in the Zustand store `store/useChartStore.ts` (`useLogStore`), backed by
the sync engine in `lib/sync.ts`:
- Every mutation (`addLog`, `updateCategory`, …) goes through `commit(op)`: applies the `Op` optimistically,
  enqueues it (`enqueue` collapses pending upserts on the same row while keeping order), persists a per-user
  snapshot to localStorage (`cashlog:v1:<userId>`), then calls `sync()`.
- `sync()` drains the queue in order via `runOp`, then `fetchRemote` and replays still-queued ops on top.
  Network errors flip `isOnline` false and stop; other errors toast and drop the op. `sameData` avoids
  re-rendering/re-animating when nothing changed.
- `components/web/DataLoader.tsx` calls `init(userId)` and retries on `online`, visibility, and a 30s timer.
- Data never comes from server components; the client store is the source of truth for UI.

Naming quirk: `LogEntry` uses legacy field names — `key` = category id (null if category deleted),
`visitors` = amount, `mode: "increase" | "decrease"` = income/cost. `rowToEntry`/`entryToRow` map to DB
columns (`category_id`, `amount`, `kind: "income" | "cost"`, `occurred_at`). `logs` is entries grouped by
Persian year/month (`getPersianYearMonth` in `lib/utils.ts`); `store/selectors.ts` reads a month from it.

### Supabase
- Clients: `lib/supabase/client.ts` (browser), `server.ts` (server components/routes), `admin.ts`
  (service role, server only), `middleware.ts` (`updateSession`).
- `proxy.ts` is the Next 16 replacement for `middleware.ts`: refreshes the session and redirects
  unauthenticated users to `/login`. Its matcher excludes `sw.js`, `offline.html`, the manifest and images.
- `app/auth/login/route.ts` logs in by username or email; usernames are resolved to emails server-side with
  the admin client so emails are never readable through the API.
- Schema lives in `supabase/migrations/` (categories, transactions, profiles; RLS "own rows" policies;
  triggers on `auth.users` create the profile). Add new changes as new timestamped migration files.

### PWA
`public/sw.js` caches shell/static/pages (bump `VERSION` when changing caching), registered in `AppShell`.
`app/manifest.ts` is the manifest. Inline boot script (theme + `beforeinstallprompt` capture) is injected in
`layout.tsx` via `next/script` `beforeInteractive`.

## Conventions

- UI text is Persian; code comments are mostly in Persian too — match the surrounding file.
- `DESIGN.md` is the design system (iOS Settings/Telegram style: flat grouped surfaces, glass header/tab bar,
  tokens in `app/globals.css`, radius/spacing/type/motion rules). Read it before UI work. Key rules: money
  uses `.num`; income is `text-success`, costs stay foreground (red only for destructive); no shadows except
  `shadow-float`/`glass`; no bounce, staggered lists, or width/height animation; respect reduced motion.
- `components/ui` = shadcn primitives; `components/web` = app components. Path alias `@/*` → repo root.
- Category colors: new ones come from `SWATCHES` in `lib/palette.ts`; `normalizeColor` handles legacy values.
