# Changelog

All notable changes to this project are documented in this file.
Versions follow the 4-part MAJOR.MINOR.PATCH.MICRO format.

## [0.3.0.0] - 2026-10-26

### Added
- Med Coverage results open with a coverage heatmap: one row per
  medication and form, with a Generic and a Brand cell coloured green
  (covered, no PA or step), amber (PA or step therapy), red (not covered)
  or grey (not published). Every cell also says it in words.
- The heatmap sorts by CNS activity, low to high, by default (beta-3
  agonists and trospium first, oral oxybutynin last), or by best coverage.
  Each row shows its CNS level.
- Tapping a medication in the heatmap opens its detail in the list below
  and briefly highlights it in yellow.

### Removed
- The "Prescribe this" box. The heatmap answers the same question at a
  glance.

## [0.2.0.0] - 2026-10-25

### Added
- A new Med Coverage card on Home (`/med-coverage`) answers "what OAB
  meds are available to this patient?". It asks for the prescription
  coverage first (Medicare, WI Medicaid, or a commercial plan or PBM),
  then the plan, and shows every OAB medication, beta-3 agonists and
  antimuscarinics together. Medicare plans can be found by plan name or
  contract-plan ID (for example H5216-001).
- The result leads with one "Prescribe this" line per beta-3 agonist
  that names what to send and what the other product needs ("Mirabegron:
  send Myrbetriq (preferred, no PA). mirabegron needs PA."), then every
  product in four groups: covered with no PA or step, covered with PA or
  step therapy, not covered, and coverage not published. Each product is
  one line with its tier and PA / ST / QL badges; strengths with the same
  coverage share a line. A bare lowercase ingredient name ("oxybutynin ER
  tablet") is the generic; brands read "Detrol LA (tolterodine) capsule".
- Tapping a product opens its detail: the PA criteria checklist (prior
  trials, trial duration, contraindication pathway, approval length),
  notes, the SmartPhrases to run next, and the source link, document
  date, and last-checked date. Anything the payer has not published
  reads "Not published" rather than a guess.
- Medicare plans open on the newest plan year, with a toggle when two
  years are published; payers with several product lines get a picker.
  Recent changes for the payer sit behind one "Recent changes (n)" line,
  and every result ends with a reminder to confirm in the payer portal.
- A "What changed" panel lists published coverage changes, newest first,
  filterable by payer, with the date the data was last checked. It shows
  the newest 10 with a button for the rest.
- "Payer not listed?" lets anyone ask for a payer to be added (plan or
  PBM name only, 60 characters, with numbers that look like patient data
  refused). Until requests open, it says so and shows the general steps.

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
