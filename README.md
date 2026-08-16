# Adrift

A digital message in a bottle. Write something, seal it, throw it into the
ocean — strangers find it, and you're told when it's opened, never by whom.

Full product/design spec: [`docs/adrift-spec.md`](docs/adrift-spec.md).

Monorepo:

- `artifacts/api-server/` — Express + Drizzle (PostgreSQL) API and the drift
  economy engine
- `artifacts/adrift/` — Expo (React Native) client
- `shared/` — types shared between both

> The "Run it" steps below describe the original Prisma/SQLite backend under
> `server/` and `app/`, which has been superseded. For the current stack see
> [`replit.md`](replit.md).

## Run it

### 1. Backend

```
npm install
npm run server:migrate   # first time only — creates server/prisma/dev.db
npm run server:seed      # first time only — seeds cities + bot personas
npm run server:dev       # starts the API on :4000
```

Leave this running. The economy engine (drift ticks + bot personas reading,
passing, breaking, and replying to bottles) starts automatically alongside
the server, so there's real activity to find even with a single real user.

### 2. Find your machine's LAN IP

Your phone and this computer need to be on the same Wi-Fi. Find the IP:

- macOS: `ipconfig getifaddr en0`
- Linux: `hostname -I`
- Windows: `ipconfig` (look for IPv4 Address)

Set it in `app/.env`:

```
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:4000
```

(`localhost` only works if you're running the app in a simulator on this
same machine — a real phone needs the LAN IP.)

### 3. Mobile app

```
npm run app:start
```

Scan the QR code with the **Expo Go** app on your phone (iOS or Android).
First launch asks for a nickname only — after that you're in. Your country is
derived from the request IP in the background, and stays "Unknown" when it
can't be resolved (which is normal on a LAN or a private network).

## What's implemented

Write → seal → drift → someone opens it → break / pass on / reply, the
3-credit reply gate, Pro unlock (stubbed, no real payment), the zoomable
globe/chart, city shores, and the tracker. A scheduled server-side engine
advances drift, applies tail-weighted drowning and break-vote consensus,
and drives ~20 bot personas through the exact same action pipeline a real
user uses — so your inbox and tracker stay alive without anything being
fabricated.

## Deliberately deferred

- Real push notifications (the app polls instead)
- Real payment processing for the $5 Pro unlock
- Postgres / hosted deployment (Prisma makes that a one-line datasource
  change whenever you're ready)
- The other three Glass & Ink theme variants (only Deep Water ships)
