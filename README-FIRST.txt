V7.67.2 — FAST NAVIGATION FINAL COMPAT

UPLOAD TO deal-dashboard ROOT:
1. apply-v7672-fast-navigation-final-compatible.mjs
2. package.json (replace current)

IMPORTANT
- Removes v7.67.1 from deploy chain.
- Old v7.67 / v7.67.1 files can remain in GitHub; they are not executed.
- No Backend changes.

WHY v7.67.1 FAILED
It assumed assets/dashboard.js ended with:
  load();

But earlier migrations append runtime code after load().
Therefore endsWith("load();") was false even though the Dashboard source was valid.

V7.67.2 DOES NOT:
- inspect the end of dashboard.js
- replace load()
- assume where load() is located

V7.67.2 DOES:
- replace only the known hardNavigate() function
- preserve page DOM/data in RAM
- switch page by history.pushState + openPage/openBusiness
- refresh stale data silently
- append Back/Forward listener at the end of the file
- warm reimbursement/income after initial page startup

BUILD MUST SHOW:
✅ FAST_NAVIGATION_FINAL_COMPAT_V7_67_2_20260816 ready
✅ Dashboard internal navigation no longer uses full-page reload
✅ dashboard.js tail/load() placement is no longer assumed
✅ previous page DOM/data remains in memory
✅ page data uses 30-second stale-while-revalidate
✅ heavy reimbursement/income pages warm after initial load
✅ browser Back/Forward uses soft navigation

Then it must continue to:
wrangler deploy --config ./wrangler.toml
and finish successfully.
