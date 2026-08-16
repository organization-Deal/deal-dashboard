Fix: remove broken v7.58 PIN patch from dashboard deploy chain.

Why:
apply-v758-admin-pin-ui.mjs currently generates invalid JavaScript in assets/admin.js.
That makes the build stop before wrangler deploy, so pilot.html never reaches production.

Upload package.json to ROOT of deal-dashboard, replacing the existing file.
Then start a NEW deployment from main.

Expected: v7.55 logs -> wrangler deploy -> Success.
No v7.58 line should appear.
