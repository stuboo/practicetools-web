# Changelog

All notable changes to this project are documented in this file.
Versions follow the 4-part MAJOR.MINOR.PATCH.MICRO format.

## [0.2.0.0] - 2026-10-25

### Added
- A new Med Coverage card on Home (`/med-coverage`) shows which OAB
  medication a plan covers and what its prior authorization needs. Pick
  beta-3 agonists or antimuscarinics, then Medicare, WI Medicaid, or a
  commercial plan or PBM. Medicare plans can be found by plan name or
  contract-plan ID (for example H5216-001).
- Each result lists, per drug, the tier or status, PA, step therapy and
  quantity limit, and a "Prescribe this" line naming the product the plan
  actually lists (for example "Myrbetriq, not generic mirabegron").
- The PA criteria checklist covers prior trials, trial duration,
  contraindication pathway, and approval length. Anything the payer has
  not published reads "Not published" rather than a guess.
- Every result shows its source link, document date, and last-checked
  date, the SmartPhrases to run next, the payer's last three changes,
  and a reminder to confirm in the payer portal before submitting.
  Medicare plans open on the newest plan year, with a toggle when two
  years are published.
- Strengths with the same coverage share one card ("Strengths: 25 mg,
  50 mg") and are split out only when their coverage differs. Payers that
  list a drug per product line get a product-line filter. Coverage the
  payer has not published reads "Coverage not published", never "Not
  covered".
- A "What changed" panel lists published coverage changes, newest first,
  filterable by payer, with the date the data was last checked.
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
