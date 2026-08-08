# Changelog

All notable changes to this project are documented in this file.
Versions follow the 4-part MAJOR.MINOR.PATCH.MICRO format.

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
