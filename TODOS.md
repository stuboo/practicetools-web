# TODOS

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
