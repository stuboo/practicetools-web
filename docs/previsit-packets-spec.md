# Spec: Pre-Visit Packets, Bladder Diary, and Encrypted Share Codes

**Status:** Approved for implementation
**Date:** 2026-10-14
**Owner:** Ryan Stewart, DO
**Repos touched:** `web` (React/TS, `stuboo/practicetools-web`) and `api` (FastAPI, `stuboo/practicetoolsapi`). Paths are relative to each repo root.

---

## 0. Goal (for `/goal`)

**Objective.** Ship milestones M1–M6 (§9): a mobile-first, no-account pre-visit packet app. Its bladder diary and questionnaire results stay on the patient's phone until she submits them. Results are uploaded only as an end-to-end-encrypted blob that the clinic can open with the patient's share code plus the practice private key.

**Done when all of the following are true:**

1. Every acceptance criterion in §9 for M1–M6 is checked off in this file (change `- [ ]` to `- [x]`).
2. In `web`: `npm run lint`, `npm test`, and `npm run build` all exit 0.
3. In `api`: `source venv/bin/activate && pytest tests/test_previsit_*.py` exits 0, and no test that passed before this work now fails.
4. The worked example in §6.4 is a passing unit test that reproduces every number in the table.
5. The crypto round-trip test (§5.6) passes, including the four negative cases.
6. No new database column, request field, or log line stores a patient name, DOB, MRN, phone, email, or IP address (§8.1). A test enforces the model allowlist.
7. Work is on branch `previsit-packets` in both repos, committed, pushed, and opened as a PR in each. **Do not merge.**

**Out of scope for this goal:** everything in §10 (Epic write-back, offline QR transfer, push reminders, content CMS, more packets).

**Before writing code:** run the full `api` test suite once and save the pass/fail list to `api/tests/.previsit-baseline.txt` (not committed). That's the baseline for criterion 3.

**If blocked:** for a decision this spec doesn't settle, pick the option most consistent with §1 (privacy first, then patient ease) and record it in §11 Decision Log. Don't stop to ask. Clinical content that needs Ryan's review gets a `TODO-REVIEW:` placeholder (§7.3), never invented facts.

### Paste-ready command

The `/goal` evaluator sees only the conversation, not files, so the condition requires the evidence to be printed in the final turn:

```
/goal Implement milestones M1-M6 of web/docs/previsit-packets-spec.md, following that spec exactly (read it first; §0 lists the done criteria). The goal is met only when your final turn prints all of the following fresh command output: (1) in web: npm run lint, npm test, and npm run build, each exiting 0, with the vitest summary showing the summary.test.ts, envelope.test.ts, and packets.test.ts files passing; (2) in api with the venv active: pytest tests/test_previsit_*.py exiting 0, plus a full-suite comparison against api/tests/.previsit-baseline.txt showing no newly failing tests; (3) grep -c "^- \[ \]" web/docs/previsit-packets-spec.md returning 0; (4) git status clean and git log -1 on branch previsit-packets in both repos; (5) the two PR URLs (not merged). Never invent site-specific clinical facts; use TODO-REVIEW placeholders. Do not merge PRs, push to main, or store any patient identifier or IP server-side. Stop after 80 turns.
```

---

## 1. Background and principles

Incontinence volume is rising, and a 3-day bladder diary is the standard workup. Paper diaries come back incomplete or not at all, and MyChart patient-entered flowsheets are too clunky for 10–15 entries a day on a phone. Separately, patients arrive not knowing what to expect. WellPrept (a urologist-built product) shows the value of timed pre-visit teaching.

This project combines both. A **visit packet** is a link sent before the visit that unlocks a timeline of modules: teaching, questionnaires, a bladder diary, logistics, and finally a **share code**. At the visit, the clinician enters the code and sees the results.

**Principles, in priority order:**

1. **The server never holds readable patient data.** It stores no identity at all. Diary and questionnaire data reach it only as ciphertext it cannot decrypt.
2. **No accounts, no installs, no identifiers.** The app never asks for name, DOB, MRN, phone, or email. The share code, entered while the clinician is in the patient's chart, is what links the data to the patient.
3. **Patient ease.** Logging a void takes ≤3 taps. The app works on any modern phone browser and survives refreshes and offline periods.
4. **Epic-ready data.** Events are stored in a FHIR-mappable shape with stable codes, so flowsheet write-back later is a mapping table, not a rewrite (§10).

---

## 2. Current architecture (facts, verified 2026-10-14)

- **web:** React 18 + Vite + TS + Tailwind, react-router v6 (`src/App.tsx`), React Query, Redux store (`src/libs/store.ts`), Radix UI components, `qrcode.react` installed. Tests: Vitest + jsdom + Testing Library (`vite.config.ts`, `src/test/setup.ts`, pattern `src/**/*.test.{ts,tsx}`). API client: `src/api/client.ts` (axios, `VITE_API_URL`).
- **Auth in web:** `AuthProvider` + `ProtectedRoute` / `AdminRoute` (`src/components/common/`). Clinician-only pages go behind `ProtectedRoute`.
- **Existing QUID questionnaire:** `src/pages/quid6/index.tsx` defines the QUID questions, their SUI/UUI scoring, and the results inline.
- **api:** FastAPI + SQLModel + SQLite + Alembic (`migrations/versions/`), layered `routes/ → controllers/ → services/ → repositories/ → models/`. Auth dependency: `AuthService.get_current_user`. Rate limiting: `app/services/rate_limit_service.py` (`RateLimitService.enforce(ip)`), with the client IP from `app/services/client_ip.py`; see `routes/physical_therapist_routes.py::search_rate_limit` for the pattern. Error envelope `{"message": ..., "status": False}`. Tests in `tests/`, pytest with `asyncio_mode = auto`.
- **Existing invitation/questionnaire flow:** `models/invitation.py` and `models/questionnaire.py` (token invites → QUID responses → YouTube playlist). **Leave it alone.** The new feature is separate and does not reuse those tables, because they store server-readable responses.
- **Hosting:** the API runs on a home server behind a tunnel, and `urogyn.click` short links run at Cloudflare's edge (`shortener/README.md`). Short links for packets are added later by hand; no shortener changes are in scope.

---

## 3. User flows

### 3.1 Patient

1. She receives a link (MyChart message, letter, AVS, or SMS from the front desk), e.g. `https://<web-host>/p/new-incontinence#d=2026-11-03`. The fragment `d` is the visit date. Fragments are never sent to the server.
2. The packet home shows the visit date, a countdown, and the module timeline. If `d` is missing or invalid, she enters the date herself (stored on the device).
3. She works through the modules in any order. Each one shows a "recommended start" date, not a hard lock.
4. In the diary she logs events for 3 days, then taps **Finish diary**.
5. On **Share with your care team** she reviews what will be sent and taps **Create my code**. The app encrypts and uploads, then shows the code `ABCDE-FGHJK` large, with "Bring this to your visit" and "Add to calendar".
6. After submitting she can keep viewing her own data. She can delete everything on the device at any time ("Erase my data").

### 3.2 Clinician

1. One-time setup per workstation: on `/clinic/previsit/setup` (behind `ProtectedRoute`), import the practice private key file (§5.2). It's stored as a **non-extractable** WebCrypto key in IndexedDB.
2. At the visit, with the patient's chart open in Epic, go to `/clinic/previsit` and enter the code. The browser fetches the blob, decrypts it locally, and renders the result (§6.5).
3. Click **Copy for note** and paste into the Epic note. Optionally click **Delete from server** once charted.

---

## 4. Packet format

### 4.1 Location and loading

- Packets are JSON files in `web/src/previsit/packets/<packet-id>.json`, bundled at build time (`import.meta.glob`). No server involvement.
- `packet-id` is kebab-case, permanent once published (it will appear on printed QR codes later).

### 4.2 Schema (TypeScript, in `web/src/previsit/types.ts`)

```ts
type Packet = {
  id: string;                    // "new-incontinence"
  version: number;               // bump on content change
  title: string;                 // "Your bladder visit"
  visitLabel: string;            // "New patient visit, Urogynecology"
  modules: Module[];
};

type ModuleBase = {
  id: string;                    // unique within packet
  title: string;
  startOffsetDays: number;       // days before visit to recommend starting; 0 = day of visit
  estMinutes?: number;
};

type Module =
  | (ModuleBase & { kind: "info"; blocks: Block[] })
  | (ModuleBase & { kind: "questionnaire"; questionnaireId: "quid" })
  | (ModuleBase & { kind: "diary"; days: 3 })
  | (ModuleBase & { kind: "share" });

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: "info" | "warning"; text: string }
  | { type: "video"; youtubeId: string; caption?: string }
  | { type: "image"; src: string; alt: string }      // src under web/public/previsit/
  | { type: "link"; href: string; text: string };
```

No markdown renderer. Blocks render to plain React elements, and no raw HTML is ever injected.

### 4.3 Validation

`web/src/previsit/packets.test.ts` loads every packet and asserts:

- unique module ids, exactly one `share` module, last in order;
- every `questionnaireId` exists in the questionnaire registry;
- `startOffsetDays` is an integer, 0–30;
- `image.src` files exist in `public/previsit/`;
- no block text contains `TODO-REVIEW:` **unless** the packet is listed in `DRAFT_PACKETS`. The app shows a "Draft content" banner on draft packets.

---

## 5. Share code and encryption

### 5.1 Threat model

| Attacker has | Can read diary? | Why |
|---|---|---|
| Server database / backups | No | Ciphertext only, with no practice private key |
| A share code only (guessed or overheard) | No | Also needs the practice private key, which lives only on clinic workstations |
| The practice private key only | No | Must also know the code to find the blob and derive the key |
| Code + clinic workstation + clinician login | Yes | Intended path |
| The patient's unlocked phone | Yes | Her own data. "Erase my data" exists. |

### 5.2 Practice key pair

- Algorithm: **ECDH P-256** (WebCrypto `ECDH`, `namedCurve: "P-256"`).
- `web/scripts/previsit-keygen.mjs` (Node ≥18, uses `globalThis.crypto.subtle`) writes:
  - `previsit-practice-public.jwk.json`: not committed. Its value goes into `VITE_PREVISIT_PUBLIC_KEY_JWK` (single-line JSON) in `.env`. Add a placeholder to `.env.example` if one exists.
  - `previsit-practice-private.jwk.json`: never committed. Add the pattern `*private*.jwk.json` to `.gitignore`. Ryan keeps it offline and imports it on each clinic workstation (§3.2).
- A test key pair for unit tests lives in `web/src/previsit/crypto/__fixtures__/` and is labeled `TEST ONLY`.

### 5.3 Share code

- 10 characters from Crockford base32 (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`), displayed as `XXXXX-XXXXX`. The first 9 are random (`crypto.getRandomValues`, 45 bits).
- The 10th is a check character: `alphabet[(Σ (i+1) × value(char_i) for i = 0..8) mod 32]`. It catches typos and most transpositions before a network round trip.
- Normalizing input: uppercase; strip spaces and hyphens; map `O→0`, `I→1`, `L→1`; reject `U` and other invalid characters with an inline error.
- 45 bits is enough because the code is never the only secret (§5.1), and redeem requires a clinician login plus rate limiting.

### 5.4 Envelope (v1)

On submit, the patient device:

1. Generates an ephemeral ECDH P-256 key pair.
2. `shared = ECDH(ephemeralPrivate, practicePublic)` (256 bits).
3. `salt` = 16 random bytes.
4. `key = HKDF-SHA256(ikm = shared, salt, info = UTF8("previsit/v1|" + normalizedCode))` → AES-256-GCM key.
5. `iv` = 12 random bytes; `ct = AES-GCM(key, iv, plaintext, additionalData = UTF8("previsit/v1|" + packetId))`.
6. `plaintext` = UTF-8 JSON of `SubmissionPayload` (§6.1).

Envelope JSON, every binary field base64url without padding:

```json
{ "v": 1, "packetId": "new-incontinence", "epk": "<65-byte uncompressed P-256 point>", "salt": "...", "iv": "...", "ct": "..." }
```

**Lookup key** sent to the server: `base64url(SHA-256(UTF8("previsit-lookup/v1|" + normalizedCode)))`. The server never sees the code.

### 5.5 Clinic decrypt

Recompute the lookup from the entered code → `POST /previsit/redeem` → envelope → ECDH with the stored practice private key and `epk` → HKDF with the same `info` → AES-GCM decrypt, using `packetId` from the envelope as AAD. A failure at any step shows "Code not found or could not be opened", the same message for every failure.

### 5.6 Crypto tests (required)

`web/src/previsit/crypto/envelope.test.ts`, with `// @vitest-environment node` so WebCrypto is real:

- the round trip with the test key pair recovers the exact payload;
- **negative:** wrong code → fails; wrong private key → fails; tampered `ct` (1 bit flipped) → fails; `packetId` changed in the envelope → fails (AAD);
- code generation: 1,000 codes are all valid and pass the checksum; normalizing `abcde fghjk` equals `ABCDE-FGHJK`.

---

## 6. Bladder diary

### 6.1 Data model (on device, and inside the encrypted payload)

```ts
type DiaryEvent =
  | { id: string; t: string; kind: "void"; volumeMl: number | null; urgency: 0|1|2|3|4 | null }
  | { id: string; t: string; kind: "leak"; amount: "drops"|"moderate"|"soaked"; trigger: "cough_sneeze_laugh"|"activity"|"urgency"|"no_reason"|"other"; padChanged: boolean }
  | { id: string; t: string; kind: "intake"; volumeMl: number; beverage: "water"|"coffee"|"tea"|"soda"|"alcohol"|"juice"|"milk"|"other"; caffeinated: boolean }
  | { id: string; t: string; kind: "bed" }     // went to bed intending to sleep
  | { id: string; t: string; kind: "wake" };   // got up for the day

// t = local ISO-8601 with offset, e.g. "2026-11-01T06:00:00-05:00"

type SubmissionPayload = {
  schema: "previsit-submission/v1";
  packetId: string; packetVersion: number;
  createdAt: string;
  diary?: { events: DiaryEvent[]; unit: "ml" | "oz" };
  questionnaires?: { id: "quid"; answers: number[]; scores: Record<string, number>; interpretation: string }[];
  patientNote?: string;   // optional free text, ≤500 chars
};
```

`DiaryEvent.kind` and the enum values are the **stable internal codes** that §10's flowsheet mapping keys on. Never rename them; add new values instead.

### 6.2 Capture UX

- Diary home: four large buttons (**Peed**, **Leaked**, **Drank**, **Bed / Up**), today's event list beneath, and a day indicator ("Day 2 of 3").
- **Peed:** volume input with quick picks, plus "Didn't measure" (`volumeMl: null`). Then urgency 0–4 with plain-language labels (0 "No urge" … 4 "Couldn't hold it"), skippable. Save. That's ≤3 taps with a quick pick.
- **Leaked:** amount → what were you doing → changed pad? Save.
- **Drank:** beverage → size quick picks (8 oz cup, 12 oz can, 16 oz bottle, custom). Caffeinated defaults from beverage type (coffee/tea/soda → true), editable.
- **Bed / Up:** a single tap records the current time. The label switches based on the last bed/wake event.
- Every event's time defaults to now and can be edited, for back-entry. Events can be edited and deleted.
- Unit toggle, mL or oz (stored as mL; 1 oz = 29.5735 mL, display rounded to 5 mL or 0.5 oz).
- Teaching card on first open: how to use a collection hat, what counts as a leak, record bed and wake times.
- Persistence: IndexedDB via a small wrapper in `web/src/previsit/storage.ts`, with every call in try/catch. If storage is unavailable, show a persistent warning that data will be lost on refresh.

### 6.3 Summary calculations (pure functions in `web/src/previsit/diary/summary.ts`)

Definitions follow ICS terminology (Hashim et al., *Neurourol Urodyn* 2019, ICS standardization of terminology in nocturia/bladder diaries). The rules, per diary day `D`, anchored on `wake_D`:

- **FMV_D (first morning void):** the first void at or after `wake_D` and ≤60 min after it. It may be absent.
- **Daytime voids_D:** voids with `wake_D ≤ t < bed_D` (includes FMV_D).
- **Nocturia episodes_D:** voids with `bed_D ≤ t < wake_{D+1}`. Bedtime stands in for sleep onset (record this assumption in the UI help text).
- **24h frequency_D** = daytime voids_D + nocturia episodes_D.
- **24h voided volume_D:** sum of measured voids with `FMV_D < t ≤ FMV_{D+1}`, i.e. **excluding** FMV_D and **including** FMV_{D+1}. Requires both FMVs and `wake_{D+1}`. Otherwise null.
- **Nocturnal urine volume (NUV)_D** = measured nocturnal voids_D + FMV_{D+1}.
- **NPI_D** = NUV_D / 24h voided volume_D. Flag **nocturnal polyuria** when NPI > 0.33 (help text: the threshold is age-dependent; 0.33 applies to older adults, and >0.20 is used in younger adults).
- **Max voided volume:** the largest single measured void in the whole diary, FMVs included; report whether it was an FMV.
- **Mean voided volume:** mean of all measured voids.
- **Leaks_D:** count by trigger, mapped to type: `cough_sneeze_laugh`/`activity` → stress; `urgency` → urge; others → other. **Pads_D** = count of `padChanged`.
- **Intake_D:** total mL, caffeinated count, alcohol count, over `wake_D ≤ t < wake_{D+1}`.
- A day is **complete** when `wake_D`, `bed_D`, and `wake_{D+1}` all exist. Diary-level values are the mean over complete days (rounded: counts to 0.1, volumes to whole mL, NPI to whole %). Unmeasured voids count toward frequency but not volumes, and the summary shows "N voids not measured".
- Data-quality warnings (shown, never blocking): fewer than 3 complete days; any day with no wake/bed; >25% of voids unmeasured; a void >1000 mL ("check entry").

### 6.4 Worked example (must be a passing unit test, `summary.test.ts`)

One complete day. Mon wake 06:00, bed 22:30; Tue wake 06:00.

| Time | Event |
|---|---|
| Mon 06:00 | wake |
| Mon 06:00 | void 400 mL (FMV_Mon) |
| Mon 07:00 | intake coffee 240 mL, caffeinated |
| Mon 09:00 | void 250 |
| Mon 10:30 | leak drops, cough_sneeze_laugh, no pad change |
| Mon 12:00 | void 200; intake water 500 |
| Mon 15:00 | void 300 |
| Mon 16:00 | leak moderate, urgency, pad changed |
| Mon 18:00 | void 250; intake water 350 |
| Mon 22:00 | void 200 |
| Mon 22:30 | bed |
| Tue 02:00 | void 300 |
| Tue 06:00 | wake |
| Tue 06:05 | void 350 (FMV_Tue) |

Expected for day Mon: daytime voids **6**, nocturia **1**, 24h frequency **7**, 24h voided volume **1850 mL**, NUV **650 mL**, NPI **35%** with the nocturnal polyuria flag **on**, max voided volume **400 mL (FMV)**, mean voided volume **281 mL** (2250 / 8), stress leaks **1**, urge leaks **1**, pads **1**, intake **1090 mL**, caffeinated **1**, alcohol **0**, complete days **1**. A "fewer than 3 complete days" warning is present.

Add at least these further cases: an unmeasured void, a missing FMV (no void within 60 min of wake → 24h volume null), and a diary with 3 complete days averaging correctly.

### 6.5 Clinic view and note text

The `/clinic/previsit` result page shows: the summary card (diary-level values + warnings), a per-day table, the questionnaire results, the patient note, and a collapsible raw event log with a timeline.

**Copy for note** produces plain text (no tabs, ≤80 chars per line, ASCII only). The format is below; the values shown are illustrative, and the test uses the §6.4 values:

```
PRE-VISIT BLADDER DIARY (patient-entered, 3 complete days, 11/01-11/04/2026)
24h frequency: 7.0 (day 6.0, night 1.0)
24h voided volume: 1850 mL | NUV: 650 mL | NPI: 35% (nocturnal polyuria)
Max voided volume: 400 mL (first morning) | Mean: 281 mL
Leaks/24h: 2.0 (stress 1.0, urge 1.0, other 0.0) | Pads/24h: 1.0
Fluid intake/24h: 1090 mL (caffeinated 1.0, alcohol 0.0)
Data quality: 2 voids not measured
QUID: SUI 6, UUI 9 -> <interpretation>
Patient note: "<text>"
```

A unit test asserts this exact output for the §6.4 fixture (with that fixture's values).

---

## 7. Questionnaires and content

### 7.1 Questionnaire registry

- Move the QUID question definitions and scoring out of `src/pages/quid6/index.tsx` into `src/previsit/questionnaires/quid.ts`, and make the QUID page import them. **The existing QUID page must behave identically.** Add a test locking its scores for 2 sample answer sets before refactoring.
- Registry entries: `{ id, title, questions, score(answers) → { scores, interpretation }, citation, licenseStatus: "cleared" | "needs-review" }`. Only `cleared` instruments may appear in a non-draft packet. QUID is `cleared` (already in public use on this site). Do **not** add PFDI-20, ICIQ, OAB-q, or others in this goal.

### 7.2 Packet to build: `new-incontinence`

| Module | kind | startOffsetDays |
|---|---|---|
| Welcome, what this is | info | 14 |
| What to expect at your first visit | info | 14 |
| Quick bladder questionnaire (QUID) | questionnaire | 10 |
| 3-day bladder diary | diary | 5 |
| Getting here: parking and check-in | info | 1 |
| Share with your care team | share | 0 |

### 7.3 Content rules

- Write generic, accurate patient-education text at about a 6th–8th grade reading level for "Welcome", "What to expect", and the diary teaching card.
- **Never invent site-specific facts** (addresses, entrances, parking, phone numbers, arrival times, whether to arrive with a full bladder). Put `TODO-REVIEW: <what Ryan must supply>` placeholders in their place and list `new-incontinence` in `DRAFT_PACKETS`.
- Every info module ends with: "Questions before your visit? Call the clinic." Use a `TODO-REVIEW` placeholder for the phone number.

### 7.4 Calendar

On the share module and the packet home, "Add to calendar" downloads a `.ics` built on the device with two all-day events: "Start bladder diary" (visit − 5 days) and "Urogynecology visit – bring your code" (visit date). No server call.

---

## 8. API (`api` repo)

### 8.1 Model: `app/models/previsit_submission.py`

| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| lookup | str(43), unique, indexed | base64url SHA-256 from §5.4 |
| packet_id | str(64) | from the envelope, validated `^[a-z0-9-]{1,64}$` |
| envelope | text | ≤ 64 KB, stored verbatim |
| created_at | datetime (UTC) | |
| expires_at | datetime (UTC) | created_at + 30 days (setting `previsit_retention_days`) |
| redeemed_count | int | default 0 |
| last_redeemed_at | datetime null | |

Model: `app/models/previsit_event.py` (anonymous analytics):

| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| packet_id | str(64) | |
| event | enum | `packet_opened`, `module_completed`, `diary_finished`, `submitted`, `redeemed` |
| module_id | str(64) null | |
| day | date | **date only**, no time-of-day |

**No IP, user agent, name, or identifier columns on either table.** `tests/test_previsit_models.py` asserts the exact column sets of both tables (the allowlist).

Alembic migration in `migrations/versions/`, following the existing naming style.

### 8.2 Routes: `app/routes/previsit_routes.py`, prefix `/previsit`

| Method + path | Auth | Rate limit | Behavior |
|---|---|---|---|
| `POST /previsit/submissions` | none | yes (`RateLimitService`) | Body `{lookup, envelope}`. Validate sizes, the envelope JSON shape (`v == 1`, required keys, base64url), and the packet_id format. 201 `{expires_at}`. A duplicate `lookup` gets 409, and the client regenerates the code and retries once. |
| `POST /previsit/redeem` | `AuthService.get_current_user` | yes | Body `{lookup}`. 200 `{envelope, created_at, expires_at}`, increments `redeemed_count`, records a `redeemed` event. Unknown or expired → 404, same message. |
| `DELETE /previsit/submissions` | `AuthService.get_current_user` | yes | Body `{lookup}`. 204, or 404. |
| `POST /previsit/events` | none | yes | Body `{packet_id, event, module_id?}`. 204. Server sets `day`. |
| `GET /admin/previsit/stats` | admin | n/a | Counts per packet × event, last 90 days. |

- The lookup goes in the body, never the URL, so it stays out of access logs.
- Never log request bodies for these routes. Rollbar reports must not include the body.
- Expired submissions are purged on startup and on every `POST /previsit/submissions`.
- Controller/service/repository layering matches `physical_therapist_*`.

### 8.3 API tests: `tests/test_previsit_*.py`

Create → redeem → delete happy path; a redeem with no auth → 401; an expired submission → 404 and is purged; an oversize envelope → 413 or 422; a malformed envelope → 422; duplicate lookup → 409; the rate limit is applied (reuse the `test_search_rate_limit.py` patterns); the model column allowlist.

---

## 9. Milestones and acceptance criteria

Work through these in order. Check each box when it's verified (tests pass, not just code written).

### M1: Diary core (web, no UI)
- [x] `types.ts` defines `DiaryEvent`, `SubmissionPayload`, `Packet`, `Module`, `Block`
- [x] `diary/summary.ts` implements §6.3; the §6.4 worked example test passes with every listed value
- [x] The extra summary cases (unmeasured void, missing FMV, 3-day average) pass
- [x] The `noteText()` exact-output test passes

### M2: Share code and encryption (web, no UI)
- [x] `crypto/code.ts`: generate, normalize, checksum (§5.3)
- [x] `crypto/envelope.ts`: seal/open (§5.4–5.5)
- [x] `scripts/previsit-keygen.mjs` works under `node`; `.gitignore` excludes private JWKs
- [x] All §5.6 tests pass, including the 4 negative cases

### M3: API storage
- [x] Models, migration, repository, service, controller, routes per §8
- [x] Routes registered in `app/main.py` with tag "Pre-Visit"
- [x] All §8.3 tests pass; no previously passing api test fails

### M4: Patient app
- [x] `PatientLayout` (minimal, no site nav, mobile-first, 16px gutters, ≥44px tap targets)
- [x] Route `/p/:packetId` (public); unknown packet → friendly not-found
- [x] Visit date from `#d=YYYY-MM-DD` or user entry, stored on the device; countdown and module timeline with recommended start dates
- [x] Info module renders all block types; questionnaire module runs QUID from the registry
- [x] Diary capture per §6.2, persisted in IndexedDB, edit/delete, unit toggle, teaching card
- [x] Share module: review → seal → upload → display code; 409 retry; offline → "Try again when connected" with data kept
- [x] "Erase my data" clears all on-device data for the packet
- [x] `.ics` download (§7.4)
- [x] Anonymous events fire (§8.2); event-call failures never surface to the user
- [x] Component tests: logging a void in ≤3 taps with a quick pick; the share flow with a mocked API shows a valid code

### M5: Clinic viewer
- [x] `/clinic/previsit/setup` and `/clinic/previsit` behind `ProtectedRoute`
- [x] Private-key import stored non-extractable in IndexedDB; status shown; "Remove key from this computer" button
- [x] Code entry with live normalization and checksum validation
- [x] Redeem → decrypt → render §6.5; **Copy for note** uses `useCopyToClipboard`; **Delete from server** works
- [x] Component test: with a fixture envelope plus the test key, the page renders the §6.4 summary values

### M6: Packet content and gating
- [x] `packets/new-incontinence.json` per §7.2 and §7.3, listed in `DRAFT_PACKETS`
- [x] QUID extracted to the registry; the existing `/quid6` page passes its locking test unchanged
- [x] `packets.test.ts` (§4.3) passes
- [x] `VITE_PREVISIT_ENABLED` flag: when not `"true"`, `/p/*` and `/clinic/previsit*` routes render NotFound; no link from Home in this goal
- [x] `CHANGELOG.md`, `VERSION`, and `package.json` version bumped per `web/CLAUDE.md`; the api follows its own conventions
- [x] §11 Decision Log updated; a GitHub issue is filed in `stuboo/practicetools-web` for each `TODO-REVIEW` item and each §10 item

---

## 10. Later (not in this goal)

1. **Epic flowsheet write-back.** Convert the clinic viewer to a SMART on FHIR **EHR launch** app inside Hyperspace (patient in context), and write each `DiaryEvent` plus the §6.3 summary as `Observation`s mapped to custom flowsheet rows, keyed by `DiaryEvent.kind` and field. Open questions: whether the rows can file without per-value validation, and Advocate's approval process for third-party SMART apps.
2. **Epic-driven delivery:** a SmartText or letter per visit type, then automated sends by visit type (analyst build).
3. **Offline QR transfer** for in-person visits (envelope in a QR code, no server).
4. Reminder notifications (iOS requires the app be added to the home screen).
5. More packets: urodynamics, Botox, pessary, pre-op, post-op. More instruments once licensing is cleared.
6. A content editor in the admin UI.
7. A pooled, de-identified QI dataset (needs a separate opt-in design; conflicts with §1.1 as built).
8. Spanish and other languages.

---

## 11. Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-14 | ECDH P-256 + HKDF + AES-GCM via WebCrypto; no crypto dependencies | Built into all target browsers and Node; the server never decrypts |
| 2026-10-14 | Separate tables from the existing invitation/questionnaire flow | That flow stores server-readable responses, which violates §1.1 |
| 2026-10-14 | The visit date lives in the URL fragment or on the device only | Keeps the date of service off the server |
| 2026-10-14 | Write raw diary events to flowsheets later, not just summaries | ~60–80 values over 3 days is fine for flowsheets and keeps the raw log (Ryan) |
| 2026-10-14 | The canonical code is the hyphenated display form `XXXXX-XXXXX`; HKDF info and lookup strings use it | One unambiguous string for both sides; seal, open and lookup normalize input first |
| 2026-10-14 | §5.6's example `abcde fghjk` fails the §5.3 checksum; tests use `ABCDE-FGHJJ` and assert `ABCDE-FGHJK` is a checksum error | Followed the §5.3 formula as written |
| 2026-10-14 | Known limit: the weighted mod-32 checksum misses some single-character errors (e.g. a value change of 4 at weight 8) | Acceptable: the code is never the only secret (§5.1); tests cover ±1 errors at every position |
| 2026-10-14 | `openEnvelope` also rejects payloads whose `schema` or `packetId` don't match the envelope | Defense in depth beyond AAD |
| 2026-10-14 | Diary days start at each wake event; bed_D is the last bed in [wake_D, wake_{D+1}); a duplicate wake on the same local date is ignored | Naps and repeat taps shouldn't split a day |
| 2026-10-14 | An unmeasured FMV_{D+1} makes 24h volume and NUV null; diary NPI is the mean of daily ratios | Avoids understated volumes; matches "mean over complete days" |
| 2026-10-14 | Note text always uses whole mL; nulls print `n/a`; the data-quality line reads "all voids measured" when nothing is flagged | Notes stay unit-stable and exact (§6.4: 281 mL, not 280) |
| 2026-10-14 | QUID registry `interpretation` is the diagnosis only; the internal scheduling recommendation is not shown to patients or put in the note | Internal routing text isn't clinical content |
| 2026-10-14 | Patient routes are `/p/:packetId` and `/p/:packetId/m/:moduleId`; the `#d=` fragment is saved on the device then dropped | Module views survive refresh; the date never leaves the device |
| 2026-10-14 | Patient API calls use a separate axios instance with no auth header | A clinician token on a shared device must never ride along, and a 401 must not redirect a patient to login |
| 2026-10-14 | The client sends `packet_opened`, `module_completed` and `diary_finished` once per device; the server records `submitted` and `redeemed` itself and rejects them from the public endpoint | No double counting, and the public endpoint can't inflate redeem stats |
| 2026-10-14 | After sharing, the patient can make a new code; the old one stays valid until it expires (erase warns about this) | No identity means there's nothing to authorize deleting the old upload; it expires in 30 days |
| 2026-10-14 | API returns 413 for envelopes over 64 KB and 422 for malformed shapes; envelope keys must be exactly `v, packetId, epk, salt, iv, ct` | Nothing extra (e.g. an identifier) can be smuggled in next to the ciphertext |
| 2026-10-14 | Rollbar reports for `/previsit` drop the body, query, user IP, proxy IP headers, frame locals and exception text | §8.2 forbids body logging; SQLAlchemy errors embed bound parameters |
| 2026-10-14 | Rate limiting reuses `RateLimitService` as §8.2 specifies, so the client IP sits in the existing `search_request_log` for ≤25 h and shares PT search's per-IP budget | Spec-mandated; tracked as a follow-up issue because it is in tension with §1 |
| 2026-10-14 | `pytest` works without `python -m` via a `sys.path` insert at the top of `tests/conftest.py`; `pytest.ini` is unchanged | Fixing its `[tool:pytest]` header would change async settings for existing tests |
| 2026-10-14 | Pre-existing `npm run lint` failures on `main` were fixed with behavior-preserving edits | Done criterion 2 requires lint to exit 0 |
| 2026-10-14 | Previsit pages are lazy-loaded behind `PrevisitRoute`, which checks `VITE_PREVISIT_ENABLED` at render | Keeps crypto and patient code out of the main bundle; one gate for all four routes |
