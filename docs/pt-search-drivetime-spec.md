# Spec: PT Search — Drive-Time Results, Auto-Expanding Radius, Map, Handout, Abuse Protection

**Status:** Approved for implementation
**Date:** 2026-08-08
**Repos touched:** `api` (FastAPI backend) and `web` (React frontend). Paths below are relative to each repo root.

---

## 1. Background & goals

The PT search tool (`web/src/pages/search-therapists/`, backend `api/app/services/physical_therapist_service.py`) is used **live, in the exam room, with the patient present**. The clinician enters the patient's ZIP and reads off the nearest pelvic-floor PT locations; the patient picks where the referral goes. Reliability and speed in that moment outrank everything else.

Current problems:

1. **Empty results.** Default radius is 5 miles; rural ZIPs frequently return nothing ("Not Found!").
2. **No ordering.** Results are returned in database order, not by distance.
3. **Straight-line distance lies.** Distance is geodesic (crow-flies). Example failure: a patient in Door County, WI (e.g. Sturgeon Bay 54235) is shown Marinette, WI as "nearby" — ~25 mi across the water of Green Bay, but a ~90-minute drive around it. Green Bay clinics are the correct answer by car.
4. **No spatial context.** No map; the patient can't see where the options are.
5. **Nothing leaves the room with the patient.**
6. **The search endpoint is public and each search can trigger billable Google API calls** — no throttle, no budget cap.

### Goals

- Rank and display results by **drive time** (Google Distance Matrix), with straight-line as a graceful fallback — the tool must **never** be down or empty during a patient visit.
- **Always return at least 3 results**, auto-expanding past the radius when needed, sorted nearest-first.
- **Map** with numbered pins matching the result cards.
- **Printable patient handout** of the results, plus an **EMR-ready plain-text copy** that pastes cleanly into the Epic After Visit Summary (AVS).
- **Strict ZIP validation** with clean errors.
- **Layered abuse/billing protection**: per-IP rate limiting with escalating blocks (permanent only for scripted-scale abuse — the clinician's own hospital shares NAT egress IPs that can't be allowlisted), a hard daily budget on Google API usage with graceful degradation, and Google-Cloud-side quota caps as the final backstop.

### Non-goals

- No insurance badges/filters on the search page (explicitly declined).
- No auth on the search page (it stays public; abuse is handled by rate limiting).
- No changes to admin CRUD screens beyond cache invalidation hooks.
- No self-hosted routing (OSRM was considered and rejected in favor of Google Distance Matrix).

---

## 2. Current architecture (facts, verified)

- **DB:** SQLite via SQLModel. `physicaltherapist` table has 82 rows; **all** have cached `latitude`/`longitude` (stored as **strings** — see §3.6). `location_source` records whether geocoding used the address or ZIP.
- **Search flow:** `GET /physicaltherapist/distance/{zipcode}?distance=5` → `PhysicalTherapistController.get_by_distance` → `PhysicalTherapistService.get_by_distance`: geocodes the ZIP via Google Geocoding (one API call per search), computes geodesic distance to every therapist with `geopy`, returns unsorted rows within radius. Response envelope: `{"message": ..., "data": [...]}`.
- **Frontend:** `web/src/pages/search-therapists/index.tsx` — debounced ZIP input (fires at ≥5 chars, no format validation), radius slider 5–100 mi in a Popover, card grid, "Not Found!" empty state. Cards in `PhysicalTherapyCard.tsx` show a `distance` badge in miles.
- **Deployment:** uvicorn behind nginx (`api/nginx.conf` proxies `localhost:8000`, sets `X-Real-IP` and `X-Forwarded-For`). systemd unit `practicetoolsapi.service`. Errors to Rollbar. Config via `app/config.py` (pydantic-settings, `.env`).
- **Google usage today:** server-side Geocoding API through the `googlemaps` client with a `Referer` header (`app/config.py` → `settings.google_maps_api_key`).
- **React 18.2 / Vite 4 / Tailwind / Headless UI.** No map library installed.
- **Response conventions:** errors use `{"message": ..., "status": False}` (see `app/main.py` exception handlers). Keep these shapes.

---

## 3. Backend changes (`api` repo)

### 3.1 ZIP → lat/lng: `pgeocode` (offline), Google as fallback

- Add `pgeocode` to `requirements.txt` **and** `requirements-linux.txt` (per `api/CLAUDE.md`).
- New helper in the service: resolve a 5-digit ZIP to `(lat, lng)` via `pgeocode.Nominatim('us')`. A missing/NaN result means "unknown ZIP" → HTTP 422 (see §3.5).
- If pgeocode's dataset is unavailable (first-run download failure — it fetches its US dataset on first use), fall back to the existing Google Geocoding path so a search still works; log a warning.
- Warm pgeocode once at app startup (background thread or FastAPI startup hook) so the first in-room search isn't slow.
- Therapist **address** geocoding on admin create/update keeps using Google Geocoding unchanged (rare, address-level precision needed).

### 3.2 Two-stage search with drive times

Rewrite `PhysicalTherapistService.get_by_distance(zipcode, distance)`:

1. **Validate** ZIP (§3.5). Resolve to origin lat/lng.
2. **Stage 1 — geodesic prefilter (free):** compute geodesic miles to all therapists (all have cached coords; keep the existing lazy-geocode branch for any future row without them). Sort ascending. Take the top `CANDIDATE_COUNT` (default **20**, setting `pt_search_candidate_count`). With 82 clinics, the true 3 nearest-by-car are always inside a top-20 geodesic set.
3. **Stage 2 — drive times for candidates:**
   - Look up each `(zip, therapist_id)` in the drive-time cache (§3.3).
   - For cache misses, make **one** Distance Matrix request: `gmaps.distance_matrix(origins=[origin], destinations=[...], mode="driving", units="imperial")` — ≤20 destinations fits a single request (API limit is 25 destinations / 100 elements per request).
   - Guard the call with the **budget breaker** (§3.4). On budget exhaustion, API error, timeout (set ~5s), or per-element status ≠ `OK`: fall back to a **geodesic estimate** for the affected therapists — `duration_seconds = geodesic_miles / 40mph`, `distance_miles = geodesic_miles`, item flagged `drive_time_source: "estimate"` (vs `"google"`). The search must **never 500 because Google failed**.
   - Write successful Google results to the cache.
4. **Sort** candidates ascending by `duration_seconds` (real and estimated values interleave on the same axis).
5. **Filter + auto-expand:** keep candidates with `drive_distance_miles <= distance` (the requested radius, default **15** — setting `pt_search_default_radius_miles`; revised from 5 during implementation, see below). If fewer than `MIN_RESULTS` (default **3**, setting `pt_search_min_results`) remain, take the first `MIN_RESULTS` from the sorted list regardless of radius and set `expanded: true`.
6. **Return** items + meta.

**Response shape** (keep the envelope; additive changes only):

```json
{
  "message": "Physical therapists near 54235",
  "data": [
    {
      "...existing therapist fields...": "unchanged",
      "latitude": 44.51, "longitude": -88.01,
      "distance": 24.3,
      "drive_time_minutes": 28,
      "drive_distance_miles": 24.3,
      "drive_time_source": "google"
    }
  ],
  "meta": {
    "zip": "54235",
    "origin": {"latitude": 44.83, "longitude": -87.38},
    "radius_requested": 5,
    "expanded": true,
    "degraded": false,
    "result_count": 3
  }
}
```

- `distance` stays populated (drive miles when available, else geodesic) for backward compatibility.
- `meta.degraded: true` when any item used an estimate because of budget exhaustion or API failure (frontend shows a subtle note; see §4.4).
- `meta.origin` is the ZIP centroid, for the map's patient marker.

### 3.3 Drive-time cache

New table (SQLModel model + Alembic migration) `drive_time_cache`:

| column | type | notes |
|---|---|---|
| id | int PK | |
| zip | str, indexed | normalized 5-digit |
| therapist_id | int, FK → physicaltherapist.id | |
| duration_seconds | int | |
| distance_meters | int | |
| computed_at | datetime (UTC) | |

Unique constraint on `(zip, therapist_id)`.

- **TTL:** entries older than `drive_cache_ttl_days` (default **365**) are treated as misses and refreshed opportunistically.
- **Invalidation:** delete a therapist's cache rows when it is deleted, or when an update changes `address`, `city`, `state`, `zip`, `latitude`, or `longitude` (hook in `PhysicalTherapistController.update/delete/delete_multiple`; also on CSV import replacing rows).
- Roads and clinics are stable; once a ZIP has been searched once, later searches from that ZIP make **zero** Google calls.

### 3.4 Billing protection — budget breaker + Google-side caps

**App-level daily budget.** New table `google_api_usage` (`date` UTC PK, `elements_used` int). Before a Distance Matrix call, check `elements_used + len(destinations) <= google_matrix_daily_element_budget` (default **2000**, env-configurable). If it would exceed: skip Google, use geodesic estimates, set `degraded: true`. Increment the counter atomically after each successful call. This bounds worst-case spend per day no matter what the rate limiter misses.

**Google Cloud Console hardening (deployment checklist, not code):**
- Restrict the API key to only the APIs actually used (Geocoding, Distance Matrix).
- Set a **requests/day quota cap** on Distance Matrix in the Cloud Console (e.g. 500/day — the true backstop even against app bugs).
- Set a billing budget alert on the project.

### 3.5 ZIP validation & error handling

- Route-level validation: `zipcode` must match `^\d{5}$` → else HTTP **422** `{"message": "ZIP code must be 5 digits", "status": false}`.
- Well-formed but unknown ZIP (pgeocode returns NaN and Google fallback finds nothing) → HTTP **422** `{"message": "Unrecognized ZIP code", "status": false}`.
- Clamp `distance` query param to 1–100.
- Remove the current `raise Exception(...)` path in the service (currently an unhandled 500).

**Default radius (revised during implementation, 2026-08-08).** 5 miles returned nothing for most rural ZIPs, so nearly every search fell through to the auto-expand path and the "showing the nearest instead" banner became the normal state rather than the exception it exists to flag. Default is now **15 miles**, on both the API (`pt_search_default_radius_miles`) and the web client. The frontend always sends an explicit radius rather than omitting the parameter, so the two defaults cannot silently drift apart. The slider floor is also decoupled from the default: it was previously bound to it, which would have made 15 the *minimum* selectable radius as well.

### 3.6 Lat/lng column types

`latitude`/`longitude` are `Optional[str]` on the model. Alembic migration to `Float` (SQLite stores them loosely already; values are numeric strings — cast in the migration). Update the SQLModel fields to `Optional[float]`. The map and `meta.origin` need real numbers; do not ship string coordinates to the frontend.

### 3.7 Rate limiting & permanent blocking

Applies to the **search endpoint** (`GET /physicaltherapist/distance/{zipcode}`) — the only public endpoint that can trigger billable calls. Implemented as a FastAPI dependency; persistence in SQLite (no new infra, survives restarts; the app runs as a single uvicorn worker, which makes SQLite counters safe here).

**Client IP resolution** (module `app/services/client_ip.py` or similar):
- If the immediate peer is localhost (nginx), trust `X-Real-IP`; otherwise use the socket peer address. Never trust these headers from non-local peers (spoofing).
- Deployment checklist item: if `api.urogy.in` is proxied through Cloudflare, configure nginx with `set_real_ip_from` for Cloudflare's published ranges and `real_ip_header CF-Connecting-IP` so `X-Real-IP` reaches the app already-correct. App code stays the same either way.

**Limits** (all env-configurable via `Settings`):

| setting | default | meaning |
|---|---|---|
| `search_rate_limit_per_hour` | 120 | sliding 60-min window, per IP (burst ceiling) |
| `search_rate_limit_per_day` | 600 | sliding 24-h window, per IP (sustained ceiling) |
| `search_rate_allowlist` | "" | comma-separated IPs/CIDRs never limited or blocked — **optional**; see IP-sharing note below |

**IP-sharing constraint (design driver):** the clinician uses this tool from inside a large hospital system whose egress IPs cannot be reliably enumerated, and hospital NAT can put an entire building — including the clinician — behind one IP. Therefore: (a) the allowlist is a nice-to-have, not a prerequisite; (b) **permanent** blocks must only fire on signals no group of humans behind a NAT could produce; (c) repeat mild overage gets escalating *temporary* blocks instead. The hard billing guarantee comes from the budget breaker (§3.4) and the Cloud Console quota cap — IP limiting is load-shedding and friction, not the last line of defense.

**Tables:**
- `search_request_log(id, ip indexed, requested_at)` — one row per search attempt; rows older than 25h pruned opportunistically.
- `rate_limit_violations(id, ip indexed, window: 'hour'|'day', occurred_at)` — one row per violation *episode* (throttled requests during an already-violating window don't create new episodes; use a ≥30-min gap or a new window to count a new episode).
- `blocked_ips(id, ip unique, reason, blocked_at, expires_at nullable)` — `expires_at NULL` means **permanent until manually removed**; otherwise the block lapses automatically at that time.

**Behavior (checked in order):**
1. IP in allowlist (if configured) → proceed, skip logging.
2. IP has an active row in `blocked_ips` → HTTP **403** `{"message": "Access blocked", "status": false}`. No detail about why.
3. Over the hour or day limit → HTTP **429** with `Retry-After`, `{"message": "Too many searches. Try again later.", "status": false}`; record a violation episode.
4. **Escalation:**
   - **≥3× the hourly limit within one hour** (360+ attempts — no set of humans behind a shared NAT uses this niche tool that hard; unambiguously a script) → **permanent block** (`expires_at NULL`).
   - Repeat violation episodes → **escalating temporary blocks**: 2nd episode within 7 days → 24 h block; 3rd → 7-day block; 4th → 30-day block (never permanent on this path).

   **Limit sizing (revised during implementation, 2026-08-08).** The originally specced 20/hr + 100/day were measured against the shared-NAT case they were meant to survive and did not: three clinicians at two referrals/hour each (~18 searches/hour, three searches per referral) exhaust 100/day mid-afternoon, earn a 24-hour block on day 2 and a 7-day block on day 3 — a clinic-wide outage produced by ordinary use. Raising them costs nothing: worst-case daily Google spend is set entirely by the element budget (§3.4) and the Cloud Console cap — 100, 600 and 5000 searches/day all bill exactly the budget — and repeat ZIPs are cached and free. `per_hour` is a burst ceiling and `per_day` the sustained one; size `per_day` against a full day's work (~216 searches for a busy three-clinician day), not against `per_hour`. Scripted abuse is still caught: permanent block at 360 attempts/hour.

   Rationale: the requested "block permanently at >20/hr or >100/day" is preserved in spirit — those thresholds throttle immediately and repeat offenders get locked out for escalating periods — but permanent blocks are reserved for scripted-abuse signatures. The clinician works from a large hospital system whose egress IPs can't be enumerated for an allowlist, so a permanent block on repeat mild overage could permanently brick the tool for the clinician's own building (hospital NAT = one IP for everyone). Temporary escalation punishes abuse just as effectively for billing purposes (the budget breaker bounds spend anyway) without an unrecoverable failure mode in the exam room.
5. Otherwise: log the request, proceed.

**Observability:** every block insertion (and every 10th 429 per IP) is reported to Rollbar (already integrated) so the operator notices if legitimate traffic is being caught — this substitutes for the missing allowlist as the safety valve.

Note the layering: even a distributed attacker who evades IP limits can only spend the **daily element budget** (§3.4), and beyond that the Cloud Console quota cap. Cached-ZIP searches cost nothing regardless.

**Admin visibility** (behind existing admin auth, `app/routes/admin/`):
- `GET /admin/rate-limits/blocks` — list blocked IPs (active and expired) with reason/expiry and recent violation counts.
- `DELETE /admin/rate-limits/blocks/{ip}` — unblock immediately.

### 3.8 New settings (add to `Settings` in `app/config.py` and `.env.example`)

```
PT_SEARCH_CANDIDATE_COUNT=20
PT_SEARCH_MIN_RESULTS=3
PT_SEARCH_DEFAULT_RADIUS_MILES=15
DRIVE_CACHE_TTL_DAYS=365
GOOGLE_MATRIX_DAILY_ELEMENT_BUDGET=2000
SEARCH_RATE_LIMIT_PER_HOUR=120
SEARCH_RATE_LIMIT_PER_DAY=600
SEARCH_RATE_ALLOWLIST=
```

---

## 4. Frontend changes (`web` repo)

### 4.1 Dependencies

- `leaflet` + `react-leaflet@^4` (v4.x — v5 requires React 19; this app is React 18) + `@types/leaflet`.
- `qrcode.react` for handout QR codes.
- OpenStreetMap raster tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) with the required attribution control. No API key, no billing.

### 4.2 Types (`src/pages/search-therapists/types.ts`)

Extend `TherapistType` with `latitude?: number; longitude?: number; drive_time_minutes?: number; drive_distance_miles?: number; drive_time_source?: 'google' | 'estimate'` and change `distance` to `number`. Add a `SearchMeta` type mirroring §3.2 and update `PhysicalTherapistAPI.searchTherapistsByZipCode` to return `{ therapists, meta }`.

### 4.3 ZIP validation UX

- Search fires only when the input matches `^\d{5}$` (replace the current `length >= 5` check). `inputMode="numeric"`, `maxLength=5`.
- Non-empty invalid input after debounce → inline helper text ("Enter a 5-digit ZIP code"), no request.
- 422 from the API → show its `message` inline. The "Not Found!" block is removed (auto-expand makes it unreachable except for errors).

### 4.4 Results + map layout

- Two-pane layout on `lg:` (cards list ~1/2, sticky map ~1/2); stacked on mobile with the map above the cards (fixed height ~320px). Exam-room screens vary — both orientations must be usable.
- **Cards:** numbered (1 = nearest). Distance badge becomes **"28 min drive · 24.3 mi"**; when `drive_time_source === 'estimate'`, show **"~24.3 mi (straight line)"** instead of a minutes figure. Keep existing card content otherwise.
- **Map (`ResultsMap.tsx`):** numbered pins (Leaflet `divIcon`) matching card numbers; a visually distinct marker (different color/shape) at `meta.origin` for the patient's ZIP; auto `fitBounds` over all pins + origin on new results.
- **Pin ↔ card sync:** shared `selectedId` state. Clicking a pin highlights + scrolls its card into view; clicking a card highlights the pin and opens its popup (name + drive time).
- **Expansion banner:** when `meta.expanded`, show above the results: *"No locations within {radius_requested} miles — showing the {n} nearest."*
- **Degraded note:** when `meta.degraded`, small muted line: *"Drive times unavailable — distances are straight-line."*
- Radius slider/filter is unchanged in UI; it now bounds **drive** miles server-side.

### 4.5 Patient handout (print)

- "Print handout" button near the results header.
- A dedicated printable component (rendered hidden on screen, shown via `@media print` CSS that hides the rest of the app — no popup windows): practice name ("Urogyn — Pelvic Floor Physical Therapy Referral Options" or similar generic header), date, "Prepared for ZIP {zip}", then each result: number, name, full address, phone, fax, website, drive time, and a QR code linking to `https://www.google.com/maps/dir/?api=1&destination={encoded full address}` (free URL scheme, no API). Footer: "Distances are approximate driving estimates from your ZIP code."
- One page for 3–5 results; plain black-on-white; no map screenshot (Leaflet tiles print unreliably and add no decision value on paper).

### 4.6 Copy for Epic AVS (EMR-ready plain text)

- **"Copy for AVS" button** next to "Print handout". On click, writes a **plain-text-only** rendering of the results to the clipboard via `navigator.clipboard.writeText()` (site is HTTPS, so the Clipboard API is available). Button flips to "Copied ✓" for ~2 s; on Clipboard API failure, fall back to showing the text in a modal `<textarea>` (select-all on open) so it can be copied manually.
- **Text only, no HTML flavor:** write only the `text/plain` clipboard type — never `text/html`. Epic's AVS / SmartText rich-text editors mangle or strip pasted markup, fonts, and styles; plain text pastes predictably everywhere in Hyperspace.
- **Formatting rules for EMR compatibility:**
  - ASCII only: straight quotes, hyphens (no em dashes, bullets `•`, arrows, emoji, or non-breaking spaces).
  - No tabs — indent with spaces. Blank line between entries. `\n` newlines.
  - No URLs shortened or QR references (QR codes are print-only); include the website as a bare domain if present.
- **Content template** (numbered to match the cards/pins; omit blank fields):

  ```
  PELVIC FLOOR PHYSICAL THERAPY - REFERRAL OPTIONS
  (nearest options to ZIP 54235, listed closest first)

  1. Advanced PT & Sports Medicine - Green Bay
     123 Main St, Green Bay, WI 54301
     Phone: (920) 555-1234   Fax: (920) 555-1235
     Website: advancedptsm.com
     About 28 minutes away by car (24 miles)

  2. ...

  Drive times are estimates from your ZIP code. Please call to
  confirm scheduling and insurance participation before your visit.
  ```

  When `drive_time_source === 'estimate'`, the distance line reads `About 24 miles away (straight-line estimate)`.
- Share one formatter between the print handout and the AVS text (single source of truth for wording/ordering); the AVS version is the same content minus QR codes and print styling.

---

## 5. Testing

**API (pytest, mock `googlemaps` and pgeocode):**
- Sorting: results ascending by drive time; Door-County scenario — origin 54235 with a therapist set containing Marinette (54143, shorter geodesic, longer drive) and Green Bay (longer geodesic, shorter drive): Green Bay must rank first.
- Auto-expand: 0 or 1–2 within radius → exactly `MIN_RESULTS` returned, `expanded: true`; ≥3 within radius → all within radius, `expanded: false`.
- Cache: second search for same ZIP makes zero Distance Matrix calls; therapist address update invalidates its rows; TTL expiry refreshes.
- Budget breaker: exhausted budget → geodesic estimates, `degraded: true`, HTTP 200, no Google call.
- Google error/timeout → same graceful degradation.
- Validation: `1234`, `abcde`, unknown ZIP `00000` → 422 with correct message shape.
- Rate limiting: 21st request in an hour → 429 with `Retry-After`; 60 requests in an hour → immediate **permanent** block → 403; 2nd violation episode within 7 days → 24 h temporary block that lapses on its own; 3rd → 7-day; 4th → 30-day; allowlisted IP (when configured) never limited; blocks survive restart (DB-backed); admin unblock works; block events reported to Rollbar.
- Client IP: `X-Real-IP` honored only from localhost peer.

**Web:** `tsc`/build passes; card renders both drive-time and estimate variants; ZIP gating (no request for `1234` or `abcdef`); AVS formatter output is pure ASCII with no tabs, matches the template for both `google` and `estimate` variants, and omits blank fields.

---

## 6. Deployment checklist

1. `alembic upgrade head` (new tables + lat/lng float migration).
2. Update `requirements.txt` **and** regenerate `requirements-linux.txt` (per `api/CLAUDE.md`).
3. New env vars on the server (§3.8). `SEARCH_RATE_ALLOWLIST` stays empty (hospital egress IPs can't be reliably enumerated); populate it later only if stable IPs become known.
4. Google Cloud Console: restrict key to Geocoding + Distance Matrix; set Distance Matrix daily quota cap (~500 req/day); set a billing alert. Verify current Distance Matrix pricing/free-tier before choosing the element budget.
5. Check whether `api.urogy.in` is Cloudflare-proxied (account exists for the URL shortener). If yes: nginx `set_real_ip_from` Cloudflare ranges + `real_ip_header CF-Connecting-IP`; if no, current `X-Real-IP` config is already correct.
6. First-run pgeocode dataset download happens at startup — verify the service user can write its cache dir and that startup logs show the warm-up succeeded.
7. Smoke test in production: known-cached ZIP (no Google call), new rural ZIP (expansion banner), invalid ZIP (clean 422), then confirm `google_api_usage` counter matches expectations.

## 7. Acceptance criteria

1. Searching a rural ZIP with zero clinics in 5 mi returns the 3 nearest by drive time with an expansion banner — never an empty result for a valid ZIP.
2. Sturgeon Bay–class ZIPs rank around-the-water clinics by real driving order (Green Bay above Marinette).
3. Results are numbered, sorted by drive time, and mirrored by numbered map pins with a distinct patient-origin marker; pin/card selection is synced both ways.
4. Repeat searches from an already-seen ZIP trigger zero Google API calls (verify via usage counter).
5. With Google unreachable or budget exhausted, search still returns sorted straight-line results with a visible note.
6. An IP exceeding 20 searches/hour or 100/day is throttled with 429s; scripted-scale bursts get a permanent 403 block and repeat mild overage gets escalating temporary blocks (24 h → 7 d → 30 d); all blocks survive restarts; block events surface in Rollbar; admin can list and remove blocks. No permanent block is reachable through usage volumes plausible for humans sharing a hospital NAT.
7. Worst-case daily Google spend is bounded by the element budget and by the Cloud Console quota cap even under distributed abuse.
8. "Print handout" produces a clean one-page printout with numbered options and working QR directions codes.
9. "Copy for AVS" places plain ASCII text on the clipboard that pastes cleanly into an Epic AVS/SmartText field with numbering, addresses, phone/fax, and drive times intact — no markup, no special characters, no tabs.
10. Invalid or unknown ZIPs return a 422 with a human-readable message; the UI surfaces it inline.
