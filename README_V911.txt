Dashboard v9.11.0 — Reconciliation Stability Hotfix

Fixes the production hang/blank screen introduced by v9.10 runtime composition.

Root cause fixed:
- v9.10 could detect hidden reconciliation DOM even when page=reconciliation was not active.
- It observed class/style changes while also writing inline style during its own audit.
- That could create a self-triggering MutationObserver/microtask loop and starve the browser UI.

v9.11:
- hard-gates reconciliation runtime to ?page=reconciliation only
- childList-only debounced observer
- no queueMicrotask loop
- no inline style writes inside reconciliation audit
- cleans stale v9.09 transition class outside permissions route
- keeps v9.10 reconciliation visual composition

Deploy: place all files at the deal-dashboard repository root, replace package.json, then commit/push.
