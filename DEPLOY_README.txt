Dashboard v7.4 — Resilient Mobile Load

Problem fixed
- A single failed /api/expenses request during initial load previously called fatal() and replaced the entire Dashboard body with a large error card.

New behavior
- Transient network/API errors never destroy the Dashboard UI.
- Sidebar, company switcher, navigation and current page remain visible.
- A compact connection banner appears inside the Dashboard instead of a full-screen error.
- Automatic retry uses backoff (2.5s → 5s → 10s → 20s → 30s → 60s).
- Manual “ลองใหม่” is available.
- When the connection returns, the banner disappears automatically.
- If the same tab already had successfully loaded data, a session-only snapshot can be used while reconnecting.
- 401/403 no longer wipes the screen; the Dashboard remains visible with a clear “link expired” banner.
- Missing tenant/token still uses the explicit invalid-link page because the Dashboard cannot operate without credentials.

Security/data
- No Google Sheet or Drive data is modified by this patch.
- No backend/API schema changes.
- Temporary fallback data uses sessionStorage only; it is not persisted as a long-term browser database.

Files changed
- index.html (asset version bump only)
- assets/dashboard.js
- assets/dashboard.css

Deploy Dashboard only.
