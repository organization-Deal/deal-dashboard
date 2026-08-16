V7.64 — MOBILE UX SYSTEM PASS

UPLOAD ONLY TO:
organization-Deal/deal-dashboard

UPLOAD TO REPO ROOT:
1. apply-v764-mobile-ux-system-pass.mjs
2. package.json  (replace current)

DO NOT change deal-line-bot.
DO NOT manually upload generated CSS/JS.
The build migration creates:
- assets/mobile-ux-system-v764.css
- assets/mobile-ux-system-v764.js

BUILD LOG MUST SHOW:
✅ MOBILE_UX_SYSTEM_V7_64_20260816 ready
✅ final mobile CSS layer loaded after legacy dashboard styles
✅ Settings service cards rebuilt for phone layout
✅ duplicate Settings title / giant package CTA removed on phones
✅ Tenant/internal workspace diagnostics hidden on phones
✅ bottom-nav desktop active rail removed
✅ overview / expenses / reimbursement / income / reports / documents / email / reconciliation / business / workflow / billing mobile rules audited

Then Wrangler deploy must continue to Success.

REAL PHONE SMOKE TEST AFTER DEPLOY:
Overview → Expenses → Reimbursement → Income → More
then Reconciliation, Reports, Documents, Email,
Company, Approver, Workflow, Finance, Employees,
Permissions, Categories, Settings, Billing.

Every page must:
- scroll normally
- have no whole-page horizontal overflow
- have no vertical stacked status text
- not hide content behind bottom nav
- not trigger iPhone auto zoom on form fields
- keep black CTA only for an actual primary action
- allow modal/drawer scrolling and closing

See MOBILE-UX-AUDIT-v764.txt.
