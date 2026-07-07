# ResolveX — Combined Frontend + Backend Issues Report

Built from the two trace files (`ResolveX_API_Flow.md` and `ResolveX_Frontend_API_Calls.md`). This report pulls everything found into one prioritized list, then breaks it down in detail: **frontend issues & dead code → backend issues & dead code → orphan routes → duplicate implementations.**

**Severity key**
- 🔴 **P0 — Critical.** Security/data-exposure risk. Fix before anything else.
- 🟠 **P1 — High.** A real user-facing feature is broken right now.
- 🟡 **P2 — Medium.** Not visibly broken yet, but fragile, confusing, or wasteful; will cause a bug soon if untouched.
- ⚪ **P3 — Low.** Dead code / cleanup. No user ever hits this; safe to schedule whenever.

---

## Priority matrix — fix in this order

| # | ID | Severity | Issue | Category |
|---|----|----------|-------|----------|
| 1 | BE-1 | 🔴 P0 | `notification.routes.js` has **no auth middleware on any route** — anyone can read/mark-read/delete/clear another user's notifications | Backend |
| 2 | FE-1 | 🟠 P1 | "Change Password" is completely broken — calls a route that doesn't exist | Frontend + missing backend feature |
| 3 | FE-2 | 🟠 P1 | "Export My Issues" button is broken — calls a route that doesn't exist | Frontend + missing backend feature |
| 4 | BE-2 | 🟠 P1 | Admin/staff logout never reaches the backend — no audit trail entry, `adminLogout` is effectively dead | Backend + Frontend |
| 5 | BE-3 | 🟡 P2 | Route-ordering fragility in `staff_issue.routes.js` (`/stats` declared after `/:id`) | Backend |
| 6 | BE-4 | 🟡 P2 | Cross-file controller imports blur ownership of two routers | Backend |
| 7 | FE-4 | 🟡 P2 | `complaintService.search()`/`.filter()` point at a route that doesn't exist | Frontend |
| 8 | FE-5 | 🟡 P2 | `adminService.getAnalytics()` points at a route that doesn't exist | Frontend |
| 9 | FE-6 | 🟡 P2 | `AdminAnalyticsManager.jsx` probes 4 URLs per page load, 2 of which 404 every time | Frontend |
| 10 | DUP-1 | 🟡 P2 | `StaffDashboard.jsx` / `StaffIssuesPage.jsx` duplicate all fetch + update + stats logic | Duplicate |
| 11 | DUP-2 | 🟡 P2 | `WorkspaceSelector.jsx` / `WorkspaceSwitcher.jsx` duplicate workspace list/join/leave logic | Duplicate |
| 12 | DUP-3 | 🟡 P2 | `NotificationBell.jsx` / `NotificationPage.jsx` duplicate all 5 notification calls + open separate sockets | Duplicate |
| 13 | DUP-4 | 🟡 P2 | `AdminUsersManager` / `ComplaintManager` / `AdminAnalyticsManager` bypass `adminService.js` and reimplement calls it already wraps | Duplicate |
| 14 | OR-1 | ⚪ P3 | 12 backend endpoints have zero frontend callers — decide keep-and-wire-up vs. delete | Orphan routes |
| 15 | BE-5 | ⚪ P3 | `roleCheck.js` middleware (`isAdmin`/`isStaff`/`isUser`) is fully unused | Backend dead code |
| 16 | FE-7 | ⚪ P3 | `complaintService.js` — 11 of 14 exported functions never called | Frontend dead code |
| 17 | FE-8 | ⚪ P3 | `adminService.js` — 7 of 21 exported functions never called | Frontend dead code |
| 18 | FE-9 | ⚪ P3 | Inconsistent `BASE_URL` fallback port (`:3000` vs `:5000`) in two files | Frontend |
| 19 | DUP-5 | ⚪ P3 | `PUT /:id/upvote` and `PUT /:id/vote` are an intentional duplicate alias | Duplicate (informational) |

**Suggested rhythm:** fix #1 today (it's a live security hole), clear #2–4 this week (visibly broken features + compliance gap), then batch #5–13 into a "cleanup sprint," and knock out #14–19 opportunistically whenever you're touching nearby code.

---

## Section A — Frontend: issues & dead code

### FE-1 🟠 P1 — "Change Password" is completely broken
**Where:** `components/user/Profile.jsx`, `handleSaveProfile()` (password tab) → calls `PUT /api/users/change-password`
**What's wrong:** There is no `/change-password` route in `user.routes.js`, and no matching controller function in `user.controllers.js` either. Every attempt to change a password from the Profile page fails.
**Impact:** A core account-security feature silently does nothing useful for the end user (they see a generic error toast and have no way to change their password at all).
**How to start fixing it:**
1. Decide the contract: `PUT /api/users/change-password` with `{ currentPassword, newPassword }`, auth-protected by `middleware/auth.js` — matches what the frontend already sends.
2. Add a `changePassword` controller in `user.controllers.js`: fetch the user by `req.user._id`, verify `currentPassword` against the stored hash, hash and save `newPassword`.
3. Wire it up in `user.routes.js`: `router.put("/change-password", auth, changePassword);`
4. Manually test the Profile → "Change Password" tab end-to-end once deployed.

### FE-2 🟠 P1 — "Export My Issues" button is broken
**Where:** `components/user/Profile.jsx`, inline `onClick` handler (~line 977) → calls `GET /api/user_issues/export`
**What's wrong:** `/export` isn't declared before the generic `GET /:id` in `user_issue.routes.js`, so Express treats `"export"` as a complaint ID. The request either 500s (invalid ObjectId) or 404s, and the frontend happily tries to download whatever error payload comes back as `my-issues.csv`.
**Impact:** Users clicking "Export" get a broken/garbage CSV file instead of their complaint history.
**How to start fixing it:**
1. Add a dedicated route in `user_issue.routes.js`, declared **above** `GET /:id`: `router.get('/export', auth, handleExportMyIssues);`
2. Write `handleExportMyIssues` in `user_issue.controllers.js` (there's already a CSV generator at `utils/exportGenerator.js` used elsewhere — reuse it) to stream back a CSV of the current user's complaints.
3. No frontend change needed — `Profile.jsx` already expects a `blob` response at this exact URL.
4. Test with a user that has 0, 1, and many complaints (edge cases for CSV generation).

### FE-4 🟡 P2 — `complaintService.search()` / `.filter()` target a non-existent route
**Where:** `services/complaintService.js`
**What's wrong:** Both build a URL of `/api/user_issues/search`, which isn't declared anywhere in `user_issue.routes.js`. Currently dead code (nothing calls these two functions), but it's a landmine for the next developer who wires up a search box expecting it to work.
**How to start fixing it:**
1. Either delete `search()`/`filter()` from `complaintService.js` if search isn't planned, **or**
2. Add a real `GET /api/user_issues/search?q=...` route + controller on the backend, declared above `GET /:id`, before anyone starts using these functions.

### FE-5 🟡 P2 — `adminService.getAnalytics()` targets a non-existent route
**Where:** `services/adminService.js`
**What's wrong:** Calls `GET /api/admin/analytics` — but `analytics.routes.js` (mounted at that exact prefix) has no root `/` handler, only `/comprehensive`, `/export`, and `/staff/my-performance`. Dead code today; would 404 immediately if ever used.
**How to start fixing it:**
1. Delete `getAnalytics()` if nothing needs it (the working equivalent is `getComprehensiveAnalytics`, already reachable at `/comprehensive` and already used by `AdminAnalyticsManager.jsx`), **or**
2. Point it at `/comprehensive` instead if it was meant to be a generic alias.

### FE-6 🟡 P2 — `AdminAnalyticsManager.jsx` probes 4 URLs on every load
**Where:** `components/admin/AdminAnalyticsManager.jsx`, `fetchAnalytics()`
**What's wrong:** Tries `/api/analytics/comprehensive`, `/api/admin/analytics/comprehensive`, `/api/analytics/dashboard`, `/api/admin/analytics/dashboard` in sequence until one succeeds. Only the second one is a real route — the other three guarantee a failed request each time the analytics page loads.
**Impact:** Not broken (it still works), but every page load pays for 1 wasted round-trip minimum, and the fallback logic hides the fact that only one URL is actually correct.
**How to start fixing it:**
1. Replace the 4-URL loop with a single direct call to `` `${API_URL}/api/admin/analytics/comprehensive` ``.
2. Delete the `possibleEndpoints` array and the try/catch loop around it.

### FE-7 ⚪ P3 — `complaintService.js`: 11 of 14 functions are dead code
**Where:** `services/complaintService.js`
**What's wrong:** Only `checkDuplicate`, `upvoteComplaint`, and `addComment` are ever imported anywhere. `getAll`, `getById`, `getMyComplaints`, `getUserIssues`, `update`, `delete`, `vote`, `getComments`, `getStats`, `search`, `filter` are never called — every page that needs this functionality (`Profile.jsx`, `Dashboard.jsx`, `MyComplaints.jsx`, `AllComplaints.jsx`, `Reports.jsx`, `Leaderboard.jsx`) reimplements the same `axios` calls directly instead.
**How to start fixing it:**
1. Pick one direction: either delete the unused exports to stop the confusion, or actually migrate the six-plus components above to use this service (bigger job, but removes a lot of duplicated `axios.get(...)` boilerplate).
2. If keeping them, add a one-line comment above each noting it's not currently wired to any page, so the next person doesn't assume it's covered by existing usage.

### FE-8 ⚪ P3 — `adminService.js`: 7 of 21 functions are dead code
**Where:** `services/adminService.js`
**What's wrong:** `getStaffPerformance`, `getUsers`, `getUserStats`, `getIssues`, `getAnalytics`, `exportData`, `adminLogout` are exported but never imported anywhere. Components like `AdminUsersManager.jsx` and `ComplaintManager.jsx` duplicate this logic with their own raw `axios` calls instead of using the service.
**How to start fixing it:**
1. Same call to make as FE-7 — either delete the dead exports or migrate `AdminUsersManager.jsx` / `ComplaintManager.jsx` / `AdminAnalyticsManager.jsx` to use them.
2. `adminLogout` specifically should be **used**, not deleted — see BE-2 below.

### FE-9 ⚪ P3 — Inconsistent `BASE_URL` fallback port
**Where:** `components/user/MyComplaints.jsx` and `components/common/ComplaintDetailPage.jsx`
**What's wrong:** Both default to `http://localhost:3000` if `VITE_API_URL` isn't set, while every other file in the app defaults to `:5000` (matching the actual backend default port). Harmless as long as the env var is always set, but a confusing trap for local dev.
**How to start fixing it:**
1. Find/replace `"http://localhost:3000"` → `"http://localhost:5000"` in both files.
2. Consider centralizing this fallback in one constant (e.g. export it from `constants/index.js`) so it can never drift again.

---

## Section B — Backend: issues & dead code

### BE-1 🔴 P0 — `notification.routes.js` has no auth on any route
**Where:** `BACKEND/src/routes/notification.routes.js` (all 6 routes)
**What's wrong:** Every route — `GET /:userId`, `PATCH /:id/read`, `PATCH /:userId/read-all`, `DELETE /:id`, `DELETE /:userId/clear-all`, `GET /:userId/stats` — relies purely on the `:userId`/`:id` in the URL, with **no `auth`, `staffAuth`, `adminAuth`, or `chatAuth`** guarding any of them.
**Impact:** Anyone who can guess or obtain another user's Mongo ID can read that user's notifications, mark them read, delete individual ones, or wipe out their entire notification history — with no login required at all. This is a real, exploitable data-exposure and data-integrity bug in production.
**How to start fixing it:**
1. Add `chatAuth` (it already resolves User/Staff/Admin from the same token, which fits since notifications go to all three roles) as router-level middleware: `router.use(chatAuth);` at the top of `notification.routes.js`.
2. In each controller (`notification.controllers.js`), add a check that the authenticated actor (`req.user`/`req.staff`/`req.admin`) actually matches the `:userId` in the URL — auth alone isn't enough if it still lets User A operate on User B's ID.
3. Re-test the frontend notification bell and notifications page afterward — both already send an `Authorization` header today, so this should be a drop-in fix with no frontend changes needed.
4. Grep the codebase for any other place calling these routes without a token, to make sure nothing else silently depended on the current unauthenticated behavior.

### BE-2 🟠 P1 — Admin/staff logout never reaches the backend
**Where:** `App.jsx`'s `handleLogout()` (used by every admin/staff page); backend's `POST /api/admin/logout` (`admin.controllers.js`, wrapped in `auditLogger('LOGOUT', 'AUTHENTICATION')`)
**What's wrong:** The admin/staff logout handler in the frontend only clears `localStorage` — it never calls the backend at all. `adminService.adminLogout()` exists and would call the right endpoint, but nothing invokes it.
**Impact:** Two consequences: (1) the audit log (which this app clearly cares about — there's a whole `audit.routes.js` + `AdminAuditLogsManager.jsx` UI for it) never records a LOGOUT event, leaving a gap in the security trail; (2) if token invalidation/session cleanup is ever added server-side later, it'll be silently skipped for every admin/staff logout today.
**How to start fixing it:**
1. In `App.jsx`, make `handleLogout()` call `adminService.adminLogout()` (or a role-aware equivalent) before clearing `localStorage`, for admin/staff sessions specifically.
2. Keep it non-blocking (fire-and-forget, like `Home.jsx` already does for regular users) so a slow/failed network call never blocks the UI logout.
3. Confirm an entry shows up in `AdminAuditLogsManager.jsx` after logging out as admin.

### BE-3 🟡 P2 — Route-ordering fragility in `staff_issue.routes.js`
**Where:** `BACKEND/src/routes/staff_issue.routes.js`
**What's wrong:** `PUT /:id` is declared before `GET /stats`. No collision exists *today* only because they're different HTTP methods — but it's one accidental `GET /:id` addition away from `GET /api/staff/issues/stats` being swallowed as `id="stats"`.
**How to start fixing it:**
1. Move `router.get("/stats", staffAuth, handleGetStaffStats);` to appear directly after `router.get("/", ...)` and before `router.put("/:id", ...)`, matching the pattern already used correctly in `admin_issue.routes.js` and `audit.routes.js`.
2. As a habit going forward: always declare fixed-segment GET routes before any `/:id`-style route in the same file, regardless of method, to avoid relying on method-difference as an accidental safety net.

### BE-4 🟡 P2 — Cross-file controller imports blur router ownership
**Where:**
- `routes/admin_issue.routes.js` imports and wires up `adminOverridePriority`, which is physically defined in `user_issue.controllers.js`, not `admin_issue.controllers.js`.
- `routes/admin.staff.routes.js` imports `getPendingStaff`, `approveStaff`, `rejectStaff` from `staff.controllers.js`, not `admin.staff.controllers.js`.

**What's wrong:** Not a functional bug — everything works — but it means a developer editing `admin_issue.controllers.js` or `admin.staff.controllers.js` won't find these functions there, increasing the odds of someone accidentally duplicating the logic in the "expected" file later.
**How to start fixing it:**
1. Either move `adminOverridePriority` into `admin_issue.controllers.js` (it's only ever called from that router), or add a clear comment at the top of `admin_issue.routes.js` explaining the cross-import and why.
2. Do the same for the three staff-related functions in `admin.staff.routes.js` — either relocate them to `admin.staff.controllers.js`, or comment the import clearly.

### BE-5 ⚪ P3 — `roleCheck.js` middleware is fully unused
**Where:** `BACKEND/src/middleware/roleCheck.js` (`isAdmin`, `isStaff`, `isUser`)
**What's wrong:** Defined, exported, never imported by any route file. The app achieves role separation entirely through `auth`/`adminAuth`/`staffAuth`/`chatAuth` checking separate Mongo collections instead.
**How to start fixing it:**
1. Confirm with the team whether this was an earlier, abandoned role-check design.
2. If truly obsolete, delete the file. If it's meant for a future single-collection role model, leave a comment explaining that intent so it doesn't look like a mistake.

---

## Section C — Orphan / childless routes (backend routes nobody calls)

These all work fine if hit directly (e.g. via Postman) but have **zero callers anywhere in the current frontend.** For each, the fix is a decision — either wire up the missing frontend feature, or remove the endpoint to shrink the API surface.

| # | Endpoint | Backend controller | Notes |
|---|---|---|---|
| OR-1 | `GET /api/admin/issues/staff` | `handleFetchStaffList` | Frontend uses `GET /api/admin/staff` for the assignment dropdown instead — this purpose-built one (per its own code comment) is unused |
| OR-2 | `POST /api/admin/logout` | `adminLogout` | See BE-2 — fix by wiring up, not deleting |
| OR-3 | `GET /api/admin/staff/top-performers` | `getTopPerformers` | No "top performers" UI exists yet |
| OR-4 | `GET /api/admin/users/:id` | `getUserDetails` | No "view single user" screen exists |
| OR-5 | `PUT /api/admin/users/:id` | `updateUser` | No "edit single user" screen exists |
| OR-6 | `GET /api/admin/staff/:id` | `getStaffDetails` | The "View Details" button that would call this is commented out in `StaffManager.jsx` |
| OR-7 | `GET /api/staff/issues/stats` | `handleGetStaffStats` | Both staff pages compute stats client-side from the plain complaint list instead |
| OR-8 | `GET /api/staff/issues/admins/list` | `getAdminsIdForStaff` | No caller found anywhere |
| OR-9 | `GET /api/staff/departments` | `getDepartments` | No caller found anywhere |
| OR-10 | `GET /api/user_issues/locations` | `handleComplaintLocations` | No map/locations view currently calls this |
| OR-11 | `GET /api/user_issues/:id/comments` | `getComplaintComments` | Comments are always read off the embedded `complaint.comments` field instead |
| OR-12 | `GET /api/notifications/:userId/stats` | `getNotificationStats` | Not exported by `notificationService.js`, not called raw anywhere |
| OR-13 | `POST /api/otp/resend` | `resendOTP` | No "resend OTP" button wired up |
| OR-14 | `POST /api/otp/password-reset/request` | `requestPasswordResetOTP` | Frontend reuses the generic `POST /api/otp/request` with `purpose: 'password-reset'` instead |

**How to start working through this list:**
1. Triage each row with the product owner: "do we want this feature soon?" vs. "was this speculative and can go."
2. For anything kept, log a small ticket per row to wire up the missing UI (most are a button + one `axios` call away from being used, since the backend logic already exists and works).
3. For anything cut, remove both the route and its now-unused controller function together, so dead code doesn't reappear at both ends independently.

---

## Section D — Duplicate implementations

### DUP-1 🟡 P2 — `StaffDashboard.jsx` vs. `StaffIssuesPage.jsx`
Both independently implement: fetch assigned complaints (`GET /api/staff/issues`), update complaint status (`PUT /api/staff/issues/:id`), and client-side stat calculation from the same shape of data.
**How to start fixing it:**
1. Extract a shared hook, e.g. `useStaffComplaints()`, that does the fetch + `calculateStats()` once.
2. Have both pages consume the hook instead of each maintaining its own copy — a bug fix in one currently has to be manually copy-pasted into the other, and it's easy to forget.

### DUP-2 🟡 P2 — `WorkspaceSelector.jsx` vs. `WorkspaceSwitcher.jsx`
Both call `GET /api/users/my-workspaces`; `WorkspaceSelector.jsx` additionally handles join/leave (also duplicated with the join/leave logic already in `Profile.jsx`).
**How to start fixing it:**
1. Pull `loadUserWorkspaces()`, `handleJoinWorkspace()`, and `handleLeaveWorkspace()` into a small shared module (or a `useWorkspaces()` hook) and have all three files (`WorkspaceSelector.jsx`, `WorkspaceSwitcher.jsx`, `Profile.jsx`) import from it.

### DUP-3 🟡 P2 — `NotificationBell.jsx` vs. `NotificationPage.jsx`
Both call all five notification endpoints and each opens its **own** Socket.IO connection and registers for the `notification` event — if a user has the bell visible while the notifications page is open, that's two live sockets doing the same job.
**How to start fixing it:**
1. Have `NotificationPage.jsx` switch to `notificationService.js` consistently (it already does) and have `NotificationBell.jsx` do the same instead of raw `axios`, so there's one code path for the HTTP side.
2. Longer-term: lift the socket connection + notification state into a shared context/provider mounted once near the app root, so both components subscribe to one socket instead of opening two.

### DUP-4 🟡 P2 — Admin components bypassing `adminService.js`
`AdminUsersManager.jsx`, `ComplaintManager.jsx`, and `AdminAnalyticsManager.jsx` all use raw `axios` with manually-attached `adminToken` headers, duplicating logic that `adminService.js` already provides (or could easily provide) for users/issues/analytics.
**How to start fixing it:**
1. Add the missing wrapper functions to `adminService.js` for issues and analytics-export (users/stats functions already exist there but are unused — see FE-8).
2. Migrate the three components to import from `adminService.js` instead of calling `axios` directly, one component at a time, so a future auth-header change (e.g. moving to the shared `axiosInstance` interceptor) only needs to happen in one place.

### DUP-5 ⚪ P3 — `PUT /:id/upvote` and `PUT /:id/vote` (informational — not a bug)
**Where:** `user_issue.routes.js`
**What's going on:** Both routes point to the exact same guarded `handleUpvoteComplaint()` handler, on purpose — `/vote` is kept only as a backward-compatible alias per the code's own comment, so it can't be used to bypass the one-vote-per-user check.
**How to start fixing it:** No action needed now. When ready to drop legacy support, just delete the `/vote` route — `ComplaintDetailPage.jsx` and `Dashboard.jsx` are the only two frontend callers still using the `/vote` alias instead of `/upvote`, so update those two call sites first, then remove the route.

---

## Suggested next step

Start with **BE-1** (the notification auth gap) since it's a live, unauthenticated data-exposure issue — that's the only item on this list that needs to happen before anything else. Everything from #2 onward can be sequenced however fits your sprint, but the priority matrix at the top gives a reasonable default order.