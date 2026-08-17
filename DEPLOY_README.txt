V7.72 Dashboard build fix

Replace only:
  apply-v772-trial-30d-1000-ui.mjs

What this fixes:
1) Converts stale index.html Beta/unlimited fallback copy to the 30-day Business Trial / 1,000 docs policy before the UI audit runs.
2) Fixes the audit scope so "1,500 รายการ/เดือน" is rejected only in the Pilot Trial surface, not in the paid Business plan (which correctly remains 1,500 docs/month).

Local verification performed:
- Ran the complete dashboard apply chain from v7.35 through v7.72 (excluding only the final network wrangler deploy).
- v7.72 audit passed.
- assets/dashboard.js syntax passed node --check.
- apply-v772-trial-30d-1000-ui.mjs syntax passed node --check.
- Paid Business plan remained 1,500 docs/month.
