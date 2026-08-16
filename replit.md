# Adrift

A digital message in a bottle. You write something, seal it, and throw it into the ocean. Strangers find it. You're told when it's opened — never by whom.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (pre-provisioned by Replit)
- Optional env: `GEOIP_URL` — country-lookup endpoint, `{ip}` is substituted.
  Defaults to a TLS endpoint; lookups that fail leave the user as "Unknown".

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (mounted at `/api`)
- DB: PostgreSQL + Drizzle ORM (migrated from Prisma/SQLite)
- Shared types: `@adrift/shared` (`shared/src/index.ts`)
- Build: esbuild (ESM bundle)

## Where things live

| Path | What it is |
|------|------------|
| `docs/adrift-spec.md` | Full product & design spec (canonical reference) |
| `shared/src/index.ts` | Shared domain types between server and app |
| `lib/db/src/schema/index.ts` | Drizzle schema — 7 tables (City, User, Bottle, BottleInteraction, BottleOpen, Reply, Notification) |
| `artifacts/api-server/src/` | Express API server |
| `artifacts/api-server/src/engine/` | Background drift engine (tick, bots, notify, dials) |
| `artifacts/api-server/src/services/bottleActions.ts` | Core game logic (create, open, break/pass, reply) |
| `artifacts/api-server/src/seed.ts` | Idempotent cold-start seed (15 cities, 22 bot personas), runs on boot |
| `artifacts/api-server/src/routes/` | REST routes: identity, bottles, cities, notifications, pro |
| `app/` | Expo React Native client (original, not yet migrated to workspace) |

## Architecture decisions

- **Drizzle over Prisma**: migrated from the original Prisma/SQLite backend to Drizzle/PostgreSQL to fit the Replit monorepo conventions. All queries use explicit Drizzle select/insert/update — no Prisma-style magic.
- **Routes mount at `/api`**: the proxy routes `/api` to the api-server artifact. Client must use `/api/identity`, `/api/bottles`, etc.
- **`@adrift/shared`** lives under `shared/` (not `lib/`) to preserve the original `@adrift/shared` package name, which the Expo client also imports.
- **Engine starts in `index.ts`** after the server binds to its port. The drift tick runs every 15s; bot tick every 20s.
- **IDs are UUID strings** (generated in application code via `crypto.randomUUID()`), matching Prisma's cuid-like approach but using standard PostgreSQL-compatible UUIDs.
- **Bot cold-start**: 22 bot personas seeded across 15 cities. Bots act through real mechanics — no fabricated events. The seed runs automatically at server boot and is idempotent, so a fresh database is never empty.
- **Onboarding takes a nickname only.** Nicknames are unique case-insensitively, enforced by a unique index on `lower(nickname)` — the application check is a friendlier fast path, not the authority. Home country is resolved from the request IP *after* the signup response is sent, so a slow or unreachable geo provider can never delay or fail account creation.

## Product (from spec)

Core loop: **Write → Seal → Drift → Someone opens it → Notified → Pass on or Break**

Five tabs: Tides (your bottles) · Haul (inbox) · Chart (world map) · Scrawl (compose) · Crew (profile)

Monetisation: $5 once, forever — unlocks unlimited replies and sending to any city.

See `docs/adrift-spec.md` for the full product and design spec.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after changing `lib/db/src/schema/index.ts`.
- `notInArray(col, [])` generates invalid SQL — always guard with `arr.length > 0 ? notInArray(...) : undefined`.
- `and()` and `or()` in Drizzle silently drop `undefined` arguments, which is useful for conditional filters.
- The `shared/` package must stay in `pnpm-workspace.yaml` and in the root `tsconfig.json` references.
- API routes are at `/api/*` (not root) — the proxy enforces this.
- Never match user-supplied text with `ilike` — `%` and `_` are wildcards there. Use `lower(col) = lower(value)` for case-insensitive equality.
- `expo-secure-store` has no web implementation; go through `artifacts/adrift/lib/storage.ts`, which falls back to localStorage on web.
- `Alert.alert` is a no-op on react-native-web; use `artifacts/adrift/lib/alert.ts`.
