# TODOS

## previsit-packets

Issues to file in `stuboo/practicetools-web` (the gh token could not create
issues on 2026-10-14). TODO-REVIEW items block removing `new-incontinence` from
`DRAFT_PACKETS`.

### Pre-visit content: clinic phone number
**Priority:** P1
Every info module (`welcome`, `what-to-expect`, `getting-here`) ends with "Questions before your visit? Call the clinic." followed by:

> TODO-REVIEW: Clinic phone number for patients to call with questions before the visit.

File: `src/previsit/packets/new-incontinence.json`

### Pre-visit content: confirm privacy wording in Welcome
**Priority:** P1
> TODO-REVIEW: Ryan to confirm the privacy wording above matches what the clinic wants to tell patients, including how long shared data is kept.

Module `welcome`. Retention is 30 days (`previsit_retention_days`).

### Pre-visit content: confirm first-visit tests in What to expect
**Priority:** P1
> TODO-REVIEW: Ryan to confirm which of the above (pelvic exam, urine test, bladder scan) the clinic usually does at a first visit, and whether to arrive with a full or empty bladder.

Module `what-to-expect`. Also review the agent-written safety line telling patients to call for fever, burning, blood in the urine, or inability to pee.

### Pre-visit content: clinic name and address
**Priority:** P1
> TODO-REVIEW: Clinic name and street address, including building and suite or floor.

Module `getting-here`.

### Pre-visit content: parking instructions
**Priority:** P1
> TODO-REVIEW: Parking instructions (where to park, cost, validation).

Module `getting-here`.

### Pre-visit content: entrance and check-in
**Priority:** P1
> TODO-REVIEW: Which entrance to use and how to check in.

Module `getting-here`.

### Pre-visit content: arrival time and what to bring
**Priority:** P1
> TODO-REVIEW: How early to arrive and what to bring for check-in (for example photo ID and insurance card).

Module `getting-here`.

### Pre-visit content: full bladder on arrival?
**Priority:** P1
> TODO-REVIEW: Whether to arrive with a full bladder, or to avoid peeing right before the visit.

Module `getting-here`.

### Pre-visit content: collection hat supply
**Priority:** P1
> TODO-REVIEW: Tell Ryan whether the clinic gives patients a collection hat, and where to get one if not.

File: `src/previsit/content/diaryTeaching.ts` (diary teaching card).

### Pre-visit content: verify QUID citation
**Priority:** P1
The registry citation for QUID (`src/previsit/questionnaires/registry.ts`) was written from memory: Bradley et al., Neurourol Urodyn 2010;29(5):727-734. Verify before the packet leaves draft.

### Pre-visit: Copy for note without a diary
**Priority:** P2
The clinic viewer disables "Copy for note" when a submission has no diary, so a
questionnaire-only or note-only share can't be copied. `noteText()` needs a
variant that emits just the QUID and patient-note lines.

### Pre-visit later: Epic flowsheet write-back (SMART on FHIR)
**Priority:** P3
Spec §10.1. Convert the clinic viewer to a SMART on FHIR EHR launch app in Hyperspace and write each `DiaryEvent` plus the §6.3 summary as Observations mapped to custom flowsheet rows, keyed by `DiaryEvent.kind`. Open questions: can rows file without per-value validation; Advocate approval for third-party SMART apps.

### Pre-visit later: Epic-driven packet delivery
**Priority:** P3
Spec §10.2. SmartText or letter per visit type, then automated sends by visit type (analyst build).

### Pre-visit later: offline QR transfer
**Priority:** P3
Spec §10.3. Envelope in a QR code for in-person visits, no server.

### Pre-visit later: reminder notifications
**Priority:** P3
Spec §10.4. Diary reminders; iOS requires add-to-home-screen.

### Pre-visit later: more packets and instruments
**Priority:** P3
Spec §10.5. Urodynamics, Botox, pessary, pre-op, post-op. More instruments once licensing is cleared.

### Pre-visit later: content editor in admin UI
**Priority:** P3
Spec §10.6.

### Pre-visit later: de-identified QI dataset (opt-in design)
**Priority:** P3
Spec §10.7. Needs a separate opt-in design; conflicts with §1.1 as built.

### Pre-visit later: Spanish and other languages
**Priority:** P3
Spec §10.8.

### Pre-visit: stop storing patient IPs in the shared rate limiter
**Priority:** P2
Spec §8.2 told the API to reuse `RateLimitService`, so `/previsit/*` requests write the client IP to `search_request_log` for up to 25 h and share PT search's per-IP budget. That's in tension with §1 (no identifiers). Consider a separate, in-memory or keyed-hash limiter for `/previsit`. See Decision Log, 2026-10-14.

## search-therapists

### Fake-timers test refactor
**Priority:** P2
The page suite runs against the real 1-second debounce (~23s wall time) and the
debounce timer firing outside act() floods the output with React act() warnings.
Refactor to vi.useFakeTimers() + advanceTimersByTimeAsync so the suite is
deterministic and fast. Deferred from pre-landing review on pt-search-redesign.

### Consolidate the console palette
**Priority:** P3
The dispatch-console hexes (#0f2a43, #2f7dd1, #1b3d5e, #2d5479, #eef2f6) are
repeated as arbitrary Tailwind values across index.tsx, PhysicalTherapyCard.tsx,
CopyForAvsButton.tsx, Loading.tsx and as JS literals in ResultsMap.tsx. Name
them in tailwind.config.js theme.extend.colors and share the two ResultsMap
values from one constant. Deferred from pre-landing review on pt-search-redesign.

### Extract shared test fixtures
**Priority:** P3
The TherapistType factory is duplicated in index.test.tsx,
PhysicalTherapyCard.test.tsx and referralFormat.test.ts. Extract a shared
testFixtures.ts. Deferred from pre-landing review on pt-search-redesign.

### Decide on the double header
**Priority:** P3
The white urogy.in nav renders above the navy console toolbar. If the stacked
look wears thin, route /search-therapists outside Layout the way
/admin/physical-therapists uses AdminShell. Deliberately accepted for now.

### Radius stepper touch targets
**Priority:** P3
The +/- buttons are 32x36px, under the 44px touch-target minimum. Enlarging
them changes the approved compact toolbar; revisit if tablet use grows.

### Verify multi-page print handout
**Priority:** P2
The print CSS positions #pt-print-handout absolutely while hiding everything
else with visibility, which some engines paginate poorly. Manually print a
15+ result handout in Chrome and Firefox and fix pagination if content clips.

## Completed
