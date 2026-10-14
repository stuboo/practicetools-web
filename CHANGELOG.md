# Changelog

All notable changes to this project are documented in this file.
Versions follow the 4-part MAJOR.MINOR.PATCH.MICRO format.

## [0.2.0.0] - 2026-10-14

### Added
- Pre-visit packets (behind `VITE_PREVISIT_ENABLED`). A patient opens a
  packet link such as `/p/new-incontinence#d=2026-11-03` and gets a timeline
  of teaching, the QUID questionnaire, a 3-day bladder diary, and a share
  step. Nothing asks for her name or any identifier, and her entries stay on
  her phone until she shares them.
- Bladder diary: log a void in three taps, plus leaks, drinks, and bed and
  wake times, in mL or oz. Entries survive refresh and can be edited,
  deleted, or erased.
- Share codes: the patient's results are encrypted on her phone and uploaded
  as ciphertext. She gets a code like `ABCDE-FGHJJ` to bring to her visit,
  and an "Add to calendar" file.
- Clinic viewer at `/clinic/previsit` (login required): enter the code to
  decrypt the results on this computer, see the diary summary (frequency,
  nocturia, voided volumes, NPI, leaks, intake) and QUID scores, copy a
  plain-text summary for the note, and delete the upload from the server.
  One-time key import at `/clinic/previsit/setup`.
- `scripts/previsit-keygen.mjs` creates the practice key pair.

### Changed
- The QUID questions and scoring moved to a shared module. The `/quid6` page
  works exactly as before.

## [0.1.0.1] - 2026-10-02

### Fixed
- Combining patient education PDFs downloads the merged file again. The
  PDF host was missing a cross-origin rule after the August storage move,
  so Chrome blocked the files and nothing downloaded.
- A failed combine now shows an error message instead of silently doing
  nothing behind a "copied to clipboard" success toast.
- The combined file is saved with a `.pdf` extension.

## [0.1.0.0] - 2026-08-08

### Added
- The print-handout and Epic AVS copy actions now freeze while a new
  search settles, so they can never capture the previous patient's
  results.
- Straight-line distance estimates are now visually distinct from real
  drive times on the result row and its map pin, so a fallback estimate
  can never pass itself off as a routed drive time.
- The search radius is adjusted with an always-visible stepper in 5-mile
  steps (5-100 mi); the previous slider-and-number-input's 1-mile
  granularity is gone.
- A search that finds nothing says so, instead of showing the first-run
  prompt under a toolbar claiming zero results.

### Changed
- The search-therapists page is redesigned as a dispatch console: one dark
  toolbar holding the ZIP field, radius stepper, result count and actions;
  dense scannable result rows with rank badges matching numbered map pins;
  and a full-height map beside the list. Set in self-hosted IBM Plex,
  bundled with the app so no font CDN is ever contacted.
- Result rows show clinic email and website as a clean hostname instead of
  raw URLs with tracking parameters, and omit blank or "n/a" fields
  entirely - on screen, in the printed handout, and in the AVS text.
- Row selection (via each row's rank badge), addresses and the radius
  stepper are keyboard-accessible and announced properly by screen
  readers, and text contrast meets WCAG AA.
- The "View Backend" header button is gone; admin access moves to the
  admin panel.

### Fixed
- A slow search response can no longer repopulate the page after the ZIP
  was cleared or changed - results always belong to the ZIP in the box.
- The loading skeleton no longer sticks forever when the input settles
  back to its previous value.
- Website and referral-form links from the database are validated before
  rendering: only http(s) URLs are linked, bare domains get a scheme, and
  script-scheme values are refused everywhere they could appear.
- Pasting a ZIP with a leading space no longer silently drops its last
  digit.
- The radius shown in the filter no longer disagrees with the radius the
  search actually used.
