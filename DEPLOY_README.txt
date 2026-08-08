Dashboard v6.0 — Route-Isolated / Low-Memory Architecture
Date: 2026-08-09

WHY
Previous dashboard kept all features in one long-lived renderer and could grow to ~1.4 GB in Chrome.
This version changes frontend architecture without changing accounting data or Google Sheet schemas.

WHAT CHANGED
1) index.html is now an app shell. CSS and JS are external assets:
   - assets/dashboard.css
   - assets/dashboard.js
2) Main workspace navigation uses full-document route changes (?page=...).
   This intentionally lets Chrome destroy the previous page renderer, DOM, decoded images, timers, and page caches.
3) Initial loading is route-aware:
   - Overview/Expenses/Reports/Documents/Activity/Settings/Business: compact expenses only
   - Batches: batch API only
   - Reconciliation: reconciliation API only
   - Income: income API only (reconciliation rows lazy-loaded only when opened)
   - Email: email documents only
   - Subscriptions: subscriptions only
   - Billing: no expense preload
4) Gmail documents and recurring subscriptions are no longer fetched together unless explicitly requested.
5) Expense API requests use view=dashboard. Worker returns a compact projection and does NOT send duplicated attachment arrays/batch internals to the browser.
6) Tables/lists have bounded DOM rendering:
   - expenses 100/page
   - income 100/page
   - accounting documents 100/page
   - batches 100/page
   - reconciliation 100/page
   - Gmail documents 100/page
   - activity 150 at a time
7) CSV Object URLs are revoked after download.
8) Income reconciliation data is released from browser memory when its modal closes.
9) Persistent sidebar backdrop blur is disabled to reduce compositor/GPU surfaces.

DATA SAFETY
- No Google Sheet schema was changed.
- No row is deleted or migrated.
- Existing Worker endpoints remain compatible.
- view=dashboard is optional; callers without it still receive the existing full expense payload.
- Income reconciliation query is optional; existing callers still get the full response.

DEPLOY ORDER
1) Deploy deal-line-bot v6.0 first (adds compact dashboard projection + optional lightweight Income response).
2) Deploy dashboard v6.0 second.
3) Close the old Dashboard browser tab completely, then open a fresh link from LINE.

TEST
- Open Overview, note Chrome Task Manager memory.
- Navigate to Expenses, Income, Batches, Reconciliation, Gmail and back.
- Navigation intentionally reloads the document while retaining tenant/k/page in the URL.
- Verify filters, exports, review/payment actions, business settings, and mobile navigation.
- In Console, dashboardMemoryReport() remains available for JS heap/data counters.
