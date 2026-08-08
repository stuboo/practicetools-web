# Spec: Retire admin.urogy.in and fold the admin panel into `urogy.in/admin`

**Status:** Approved for implementation — **after** the DigitalOcean migration completes
**Date:** 2026-08-08
**Repos touched:** `web` (React frontend) only. No `api` changes: every endpoint this needs already exists and is unchanged.

---

## 1. Background & goals

`admin.urogy.in` is a separate React SPA on DigitalOcean App Platform, built from
`josephajibodu/admin.quiz.urogy.in` — a private repo Ryan cannot access. It has two problems:

1. **It cannot be rebuilt.** Its build has failed since some push after 2026-03-18 on
   TypeScript errors in `src/types.ts` (duplicate `QuestionnairaData` identifier, a
   broken `from '..'` import, and a conflicting `Questionnaire` declaration). App
   Platform still serves the 2026-03-18 artifact, which is why the site returns 200,
   but every rebuild since has ERRORed — including three triggered on 2026-08-08 by a
   DNS/certificate change. If that artifact is ever evicted there is no way to restore it.
2. **The source is unrecoverable.** No source maps were deployed (the apparent `.map`
   response is the SPA catch-all serving `index.html`), and static-site components have
   no container to shell into. DigitalOcean holds the build in its own cache with no
   API to extract it.

The behaviour, however, is fully known: client routes were read out of the deployed
bundle, and the 29 `/admin/*` endpoints it calls are in our own API.

Meanwhile `practicetools-web` already contains the scaffolding an admin panel needs —
`AuthProvider`, `AdminRoute` (which checks `user.is_admin`), an `/admin` route tree, an
`AdminShell` layout, and an axios client that injects JWTs and handles 401s. Two of the
old app's screens are effectively already here (`/login`, and user management).

So this is not a rewrite. It is porting seven screens into an app already set up for them.

### Goals

- Rebuild the admin screens under `urogy.in/admin/*`, reusing the existing auth and guards.
- Retire `admin.urogy.in` and its App Platform app, removing the last unbuildable service.
- Ship as part of the same Cloudflare Pages deployment as the rest of `practicetools-web`.
- Never need `josephajibodu`'s repo.

### Non-goals

- **No API changes.** All 29 endpoints exist and are already exercised by the old app.
- **No `/signup` screen.** The old app had one; an admin panel that lets anyone register
  is a liability. Users are created through `POST /admin/auth/users` by an existing admin.
- **No redirect from `admin.urogy.in`.** Ryan chose retirement over preserving the
  hostname. The DNS record and the App Platform app both go away.
- **Not a redesign.** Match the conventions already in `src/pages/admin/physical-therapists/`
  rather than introducing a new visual language.

---

## 2. Current architecture (facts, verified 2026-08-08)

**Old app** (`admin.urogy.in`, App Platform app `admin-frontend`, component
`admin-quiz-urogy-in`, static site, `yarn build`). Client routes extracted from the
deployed bundle:

```
/  /login  /signup  /diagnosis  /diagnosis/:id  /invitations
/questionnaires  /settings/general  /settings/youtube-authorization  /videos
```

It calls `https://api.urogy.in`, which since 2026-08-08 is served by CT 101 on the R640
through a Cloudflare Tunnel. CORS on that API already allows `https://urogy.in`.

**This app** (`practicetools-web`) already has:

| Piece | Path | Note |
|---|---|---|
| `AuthProvider`, `useAuth` | `src/context/AuthContext.tsx` | token in `localStorage`, validates on mount, handles forced logout |
| `AdminRoute` | `src/components/common/AdminRoute.tsx` | redirects unauthenticated → `/login`, non-admin → `/` |
| `ProtectedRoute` | `src/components/common/ProtectedRoute.tsx` | authenticated-only |
| `/admin` route tree | `src/App.tsx` | currently holds `users` only |
| `AdminShell` | used by `/physical-therapists` | existing admin layout |
| axios client | `src/api/client.ts` | `VITE_API_URL` base, injects `Authorization`, clears auth on 401 |
| Login screen | `src/pages/coverage/LoginPage.tsx` | at `/login` |

---

## 3. Route mapping

| Old route | New route | Endpoints |
|---|---|---|
| `/login` | `/login` — **already exists**, no work | `POST /admin/auth/login`, `/refresh` |
| `/signup` | **dropped** (see non-goals) | — |
| `/` | `/admin` (index) | `GET /admin/dashboard/stats` |
| `/diagnosis` | `/admin/diagnosis` | `GET /admin/diagnosis` |
| `/diagnosis/:id` | `/admin/diagnosis/:id` | `GET /admin/diagnosis/{id}`, `POST .../add-video`, `.../remove-video`, `.../videos/update_order` |
| `/invitations` | `/admin/invitations` | `GET,POST /admin/invitations`, `GET,PUT,DELETE /{id}`, `DELETE /delete-many` |
| `/questionnaires` | `/admin/questionnaires` | `GET /admin/questionnaires/`, `/{id}`, `/analytics` |
| `/videos` | `/admin/videos` | `GET,POST /admin/videos`, `POST /{id}/update`, `DELETE /{id}` |
| `/settings/general` | `/admin/settings` | `GET /admin/settings/`, `PUT /admin/settings/update` |
| `/settings/youtube-authorization` | `/admin/settings/youtube` | `POST /admin/youtube/auth/`, `GET /auth/account`, `GET /auth/callback` |
| — | `/admin/users` — **already exists** | `/admin/auth/users*` |
| — | `/physical-therapists` — **already exists**, consider moving under `/admin` | — |

---

## 4. Frontend changes (`web` repo)

### 4.1 Route tree

Extend the existing `/admin` block in `src/App.tsx`. It already wraps in
`AuthProvider` + `AdminRoute`; add an `AdminShell` layout so the new screens get
navigation, and nest the new routes as children.

**Lazy-load the whole `/admin` subtree** with `React.lazy` + `Suspense`. The entry chunk
is currently 272 KB gzipped after the `pdf-lib` split; admin code must not land on the
critical path for patients opening `/combine-pdfs`. Same technique as
`src/libs/pdf-libs.ts`.

### 4.2 Files to add

```
src/pages/admin/
  dashboard/index.tsx
  diagnosis/index.tsx          list
  diagnosis/show.tsx           detail + video attach/detach/reorder
  invitations/index.tsx        list, create, edit, bulk delete
  questionnaires/index.tsx     list + analytics
  questionnaires/show.tsx      single response detail
  videos/index.tsx             list, create, update, delete
  settings/general.tsx
  settings/youtube.tsx         OAuth init + connected-account state
src/api/admin/                 typed wrappers per resource
src/types/admin.ts             shared response types
```

Follow the structure already used by `src/pages/admin/physical-therapists/`
(`index` / `show` / `create` / `edit` / `validation-schema`) rather than inventing a
second convention.

### 4.3 Data fetching

Use **`@tanstack/react-query`**, already a dependency and used in 18 files. Do not add
Redux state for these screens: `react-redux` survives in only two files and is on its
way out.

### 4.4 Video ordering

`POST /admin/diagnosis/{id}/videos/update_order` implies drag-to-reorder. Check what the
endpoint expects before choosing a library; a simple up/down control is acceptable for
v1 given how rarely this is used.

### 4.5 YouTube authorization

`GET /admin/youtube/auth/callback` is an OAuth redirect target. The API reads
`YOUTUBE_AUTH_CALLBACK` from its environment — **verify it points at a URL that still
exists** once `admin.urogy.in` is gone. If it references the old host, the API `.env` on
CT 101 must be updated and the Google OAuth client's authorized redirect URIs changed to
match. This is the one item with a dependency outside this repo.

---

## 5. Security notes

`AdminRoute` controls **what renders, not what is permitted**. The API enforces
authorization; the guard is a UX affordance. This is already true of `/admin/users`, so
nothing changes — stated so nobody later assumes the client is a boundary.

Lazy-loading admin code is a payload-size decision, not a security one. Admin JS is
public either way.

---

## 6. Deployment / cutover checklist

1. Ship the new screens to `urogy.in/admin/*` and confirm each against the live API.
2. Confirm `YOUTUBE_AUTH_CALLBACK` and the Google OAuth redirect URIs (§4.5).
3. Announce/agree a date — this is a URL change for anyone with bookmarks.
4. Delete the `admin.urogy.in` CNAME from the `urogy.in` Cloudflare zone.
5. Destroy App Platform app `admin-frontend` (`7817e3f4-c421-4af9-9c4b-5025e63e1925`).
6. Leave `stuboo/quiz.urogy.in` (the fork) alone — `quiz.urogy.in` is a separate app and
   is not in scope here.

---

## 7. Acceptance criteria

- Every route in §3 renders under `/admin/*` and performs its listed operations against
  the live API.
- A non-admin authenticated user is redirected to `/`; an unauthenticated user to `/login`.
- The entry chunk does not grow: admin code is in its own lazily-loaded chunk.
- `npx tsc --noEmit` clean; `npx vite build` succeeds.
- `admin.urogy.in` no longer resolves, and the App Platform app is destroyed.
- No `api` repo changes were required.

---

## 8. Open questions

- **Is `/physical-therapists` misplaced?** It is an admin screen sitting at the top
  level, outside the `/admin` tree and its guard. Worth moving while the area is being
  reorganised — but it is a URL change with its own bookmark risk, so it is called out
  rather than assumed.
- **Which screens are actually used?** Ryan reports using the admin panel rarely. If
  invitations or questionnaires are dead in practice, they need not be ported. Cheapest
  way to find out: the audit trail (`/audit-records`) and questionnaire counts — the
  `questionnaires` table was empty as of 2026-08-08, which suggests that screen may have
  nothing to show.
