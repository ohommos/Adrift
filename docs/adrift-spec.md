# Adrift — Product & Design Spec

*A digital message in a bottle. You write something, seal it, and throw it into the ocean. Strangers find it. You're told when it's opened — never by whom.*

Consolidated from the full design thread. Sections 1–12 are product and economy; 13–19 are the design system, visual exploration, and prototype state.

---

# PART I — PRODUCT

## 1. The core loop

Write → seal → drift → someone opens it → you're notified → they pass it on or break it.

Four verbs the user learns: **write, wait, open, pass on.**

**Stated goals:** virality and retention. Specifically, getting people past the fourth session — the concept is inherently shareable, but the loop has to give them a reason to come back.

## 2. Content and identity

- **Text only.** No photos, video, audio, or links. 500 character limit.
- **Identity shown:** nickname, flag, city. No real names.
- Senders never learn who opened their bottle unless that person replies.

## 3. Locality

Two scopes at send time:

| Scope | Behaviour |
|---|---|
| **Your City** | Only found by people in your city. A smaller, closer water. |
| **Global** | Could reach anyone, anywhere. You'll see which countries open it. |

Pro users can send to **any city** on the planet, chosen from the chart. Your home city is always free.

## 4. Timing — never promised

**No ETAs anywhere in the product.** Arrival and open-timing are tuned server-side to balance supply, demand, and notification pacing.

The tracker shows qualitative states only:

`Sealed` → `Drifting` → `Nearing a shore` → `Opened` → `Lost at sea`

Bottles arrive at **any hour**. Dawn/dusk delivery windows were explicitly considered and rejected.

**Why:** arrival ≠ being read. A bottle can wash ashore and sit unopened for days. Promising a time you can't keep breaks trust, and the timing dial is the single most valuable lever for retention and cold-start density.

**Consequence:** accelerated delivery was **dropped entirely** as a Pro feature. You cannot sell speed without promising time.

> Earlier drafts specified drift times in days, then minutes, then seconds ("60 minutes to circle the world"). All were abandoned once it became clear that timing must stay hidden to function as a supply/demand lever.

## 5. What the sender learns

- **That** it was opened. Never who.
- **Which countries** opened it (global bottles only, and only where daily volume is high enough that it doesn't de-anonymise).
- **How many shores** it has reached (pass-on count).
- Eventually, that it was **lost at sea** — if it drowned, or if enough readers broke it. These two look identical to the sender, deliberately.

This turns one bottle into a week of notifications: *opened in Brazil → passed on → now in Poland → reached its fourth shore.*

## 6. Reader actions

On opening a bottle, the reader gets **three buttons in one row**:

| Action | Meaning | Effect on circulation |
|---|---|---|
| **Break** | This one stops with you | A vote against, not a deletion |
| **Pass it on** *(visually dominant, centre)* | Sends it drifting onward | Stays in circulation |
| **Reply** | Opens a private thread | Bottle keeps drifting either way |

- **Break and pass each earn 1 credit** toward a reply. Nothing is gained by forwarding toxicity.
- **Replying does not remove the bottle from circulation.**
- **No reason-sheet on break** — considered and explicitly removed as friction.
- **No "Countries only. Never people." disclaimer line** — explicitly removed.

**Break is a vote, not a deletion.** A bottle only sinks when several independent readers break it, so no single person can destroy someone's message.

## 7. Replies — the gate

1. **First reply is always free.** Everyone feels the thread before there's a price.
2. **After that: 3 credits = 1 reply.** Fixed at three, never variable — a shifting requirement breaks expectations and creates a weird UX.
3. **$5 once, forever** — the shortcut for people who'd rather pay than participate.

Nothing is ever taken away. Each tier is an addition.

**Why the gate exists:** it is a harassment filter first and revenue second. Anyone abusing strangers at scale must either do real work or pay — and can be removed for $5 a time.

## 8. Supply and demand

The ocean is the resource. Replies do not drain it.

| Action | Effect on ocean |
|---|---|
| New bottle | +1 |
| Pass on | stays in circulation |
| Break (by consensus) | −1 |
| Drowning (system) | −1 |
| Reply | neutral |

**The hidden dials:**

- **Breakage threshold** — how many independent breaks sink a bottle.
- **Drowning rate** — random attrition, weighted to the **tail**: bottles already passed on many times, or sitting unopened a long while. **Never fresh bottles** — the pain would land on a sender whose message died unread.
- **Notification pacing** — smoothing arrivals so users get something most days rather than five on Tuesday.

**Cold start:** launch **one city at a time** until it has density. Manipulate timing and matching freely. **Never fabricate the other person** — no generated bottles, no fake open events. That line is what the whole product rests on.

## 9. Shown vs. hidden

**Shown:** the three buttons, the honest line *"Break or pass it on, and you're one closer to a reply,"* the sender's open/country/shore updates, the user's own credit count.

**Hidden:** break counts (theirs, the bottle's, the sender's), the breakage threshold, drowning logic, notification pacing.

> **Users make judgments. The system draws conclusions.**

Breaking doubles as the reporting system — a bottle broken by nearly everyone who sees it is an automatically ranked abuse queue.

## 10. Pro — $5 once, forever

- Unlimited replies (skip the 3-credit requirement)
- Send to any city on the planet

**Deliberately excluded:** accelerated delivery. Pay-to-be-heard would poison the premise.

## 11. Retention levers identified

- **Inbox quality is the whole game.** Everything else is scaffolding.
- **Notify on arrival, not just on open** — arrival is supply you control.
- **One bottle generates a week of notifications** (opened → passed on → country → shore count).
- **Replies turn a two-session loop into a relationship.**
- The 3-credit gate creates productive waiting: people return to check the inbox.

## 12. Deferred, rejected, and open

**Deferred:** Deep Water (choose a month/year drift), anchoring a bottle to your home shore, the keepsake shelf, hard sink-after-N-shores, daily send caps, patina based on elapsed time (replaced by pass-on count).

**Rejected:** accelerated delivery; dawn/dusk delivery windows; variable credit thresholds; break reason-sheets; precise drift ETAs.

**Open questions:**
- Daily send cap — one bottle a day, or unrestricted?
- Cap on replies a single bottle can generate?
- Free-forever grandfathering for early users?
- Who funds moderation at scale, given $5 once-per-lifetime?

---

# PART II — DESIGN

## 13. Screen inventory

Five tabs: **Tides · Haul (inbox) · Chart · Scrawl (write) · Crew (profile)**

| Screen | Contents |
|---|---|
| **Tides (home)** | Your bottles, each with a live animated drift map, state chip, region, country count. Credit pips in header. |
| **Chart** | Zoomable world chart. Ports, clickable oceans, your drift trails. Lists: busiest waters, quiet shores. |
| **Dive** | Transition: the chart zooms through the screen into a city. |
| **City shore** | Bobbing bottles scaled to local volume, sample letters in city-specific voices, Pro-gated "throw a bottle into X". |
| **Tracker** | Drift map, state, "Opened in" country list, pass-on chain, the letter. |
| **Compose → Scope → Seal → Sent** | Write, choose ocean, hold the wax seal, confirmation. |
| **Haul → Read → Break/Pass/Reply → Fate/ReplySent** | Inbox and the reader decision. |
| **Crew** | Stats, credit progress bar, Pro state. |
| **Paywall** | Sheet, $5 once. |

## 14. The type system

The governing principle: **a decorative face is for words you recognise, not words you read.**

| Tier | Face | Job | Rule |
|---|---|---|---|
| **DISPLAY** | Pirata One | Screen titles, wordmark, section rules | **Never below 16px** — enforced and verified |
| **META** | Cinzel | Short uppercase labels, chips, counts | Even strokes hold up small |
| **UI** | Spectral | All interface prose | Screen-optimised serif, legible at 11px |
| **LETTER** | IM Fell English | **The message text and nothing else** | Every use verified to sit on `C.ink` inside a letter |

**The bug this fixed:** the app's default `fontFamily` was originally the antique letter face, so every 11px hint inherited a thin, irregular, deliberately badly-printed font. Pirata One was also running at 13px in two places.

**Why it matters:** roughness reads as *character* on a letter and as *poor craft* on a button. Confining the antique face to message bodies makes it mean something — it marks what a human being actually wrote.

## 15. Colour and contrast

Current palette (Blackflag):

```
abyss     #0A1622   ground
tide      #16283A   panels
tideLight #24405A   raised/borders
foam      #FFFFFF   primary text
foamDim   #A9C6DD   secondary text
brass     #FFC93C   primary accent, buttons, titles
wax       #FF6B4A   signal red, alerts, home marker
seaglass  #4FE0C0   "opened" state
parchment #FFF6E4   letter paper
ink       #14202C   letter text
```

**Measured contrast — all 13 text pairs clear WCAG AA; 11 clear AAA:**

| Pair | Ratio |
|---|---|
| body on panel | 15.01 |
| letter on paper | 15.36 |
| accent on ground | 11.88 |
| secondary on panel | 8.44 |
| wax on ground | 6.48 |
| wax on panel | 5.33 |

**The lesson learned:** the first pirate attempt failed because of **value structure, not hue** — a mid-brown ground, light-tan cards, and cream text all sat within ~25% lightness of each other. Body text measured **1.73:1** against a 4.5 minimum. Seven pairs failed. The fix was inverting the structure: dark ground, dark panels, bright text, and parchment reserved exclusively for letters — which also makes a received message read as the one bright object in a dark room.

The signal red was **solved for rather than eyeballed**: `#E8402A` measured 3.72 on panels, so it was replaced with `#FF6B4A` at 5.33.

## 16. The chart (current)

Replaced an earlier wireframe globe, which read as a data-visualisation idiom and fought the rest of the app.

**Zoom:** pinch, scroll wheel, `+`/`−` buttons, double-tap-to-point. Range **0.45×** (whole world in frame) to **5×** (single harbour). Zoom anchors under the finger. Jump buttons: **PORTO** (home) and **WORLD**.

**Level of detail** — labels are budgeted by zoom rather than shrunk:

| Zoom | Behaviour |
|---|---|
| < 1.5× | Ocean names + only ports with 190+ bottles |
| 1.5–2.4× | Ports with 85+ |
| ≥ 1.8× | Graticule fades in |
| ≥ 2.2× | Ocean bottle counts appear |
| ≥ 2.6× | Longitude degrees appear |
| ≥ 3× | Every port labelled, with counts |

Ocean labels **fade as you zoom in** — they're context you no longer need.

**Clickable oceans:** twelve named waters, each with a hit region. The sheet shows bottles in that water, **which of your own bottles are drifting there** (by distance, tappable to the tracker), and major ports as chips.

**Cartographic treatment:** cool ivory paper, continental shelf bands stepping out from every coast in soft blue-green, fine graticule, precise port dots with white centres, one restrained compass at 55% opacity. Coastlines keep a slight hand-drawn waver (turbulence scale 1.1) so they read as drawn rather than generated.

**Deliberately removed as kitsch:** sea serpent, ship doodle, "here be monsters", cross-hatching, sixteen rhumb lines, orange parchment, brass nailheads.

## 17. The balance that was landed on

> **The chrome carries the character; the data stays legible.**

The pirate register lives in the frame — Pirata One titles, brass borders, the wax skull seal, "PUT IN AT SEOUL". The chart itself is a precise instrument. This split is what let the theme be characterful without becoming cartoonish.

## 18. Themes explored

Twelve full builds, each a complete app rather than a recolour — palette, typefaces, texture layer, navigation structure, and seal glyph all differed.

| # | Theme | Idea |
|---|---|---|
| 1 | Deep Water | Underwater looking up; bottle-glass green, brass lamplight |
| 2 | Foxed | Light theme; the app *is* the letter, aged paper and foxing stains |
| 3 | Nocturne | Sea at 2am; starfield, moonlight, glowing paper |
| 4 | Salt & Rust | Weathered harbour; halftone, rust, industrial slab type |
| A | Aurora | Chromeless; drifting colour blobs, 3-minute hue cycle, frosted glass |
| B | Riso | Zine print; two spot inks swapping every 7s, misregistration |
| C | Sumi | Ink diffusing in water; vast space, brush strokes, ensō seal |
| D | Cyanotype | Sun-printed chart; exposure develops over 75s |
| E | Comic | Ben-Day dots flipping ink, speech bubbles, THWOMP! seal |
| F | Pirate | Burnt map, candlelight, skull seal — *failed on contrast* |
| G | Island | Tiki-pop; full day/night sky cycle in 3 minutes |
| H | Arcade | CRT scanlines, pixel palette swapping ROM every 4s |

**Iterations on the winner:** F2 Lantern (below deck, dark) → F3 Ensign (naval flag, high contrast) → **F4 Blackflag** (best of both, contrast-solved) → F5 (type system + chart) → **F6 (zoomable chart, current)**.

## 19. Known risks

- **Break may become the lazy default** now that it needs one tap and earns equal credit. Cheap fix: keep pass-on visually dominant (already partly done via width and colour) rather than restoring the reason sheet.
- **Replying spends 3 credits and earns none**, so a non-Pro user replying twice hits a wall fast.
- **Ritual animations were built and then removed** — the seal/uncork sequences (~2.5s and ~1.5s) were lovely once and tedious at scale. If revisited, they need skip-on-tap.
- **Chart labels** may still collide in dense clusters at low zoom on small phones; the LOD thresholds are the tuning point.
- **Screenshot consistency:** themes with cycling colour (Aurora, Island, Arcade) look different every time, which cuts against virality where a recognisable look helps.

---

## Files

| File | What it is |
|---|---|
| `Adrift-00-Original-GlassAndInk.jsx` | The original design — glass-and-ink palette, wireframe globe, raised centre Planet tab |
| `Adrift-F6-Chart.jsx` | Current design — Blackflag palette, four-tier type system, zoomable clickable chart |
