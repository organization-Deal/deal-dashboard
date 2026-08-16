V7.69.1 — CASH POSITION RATE LIMIT FIX

Upload to organization-Deal/deal-dashboard ROOT:
1. apply-v7691-cash-position-rate-limit-fix.mjs
2. package.json (replace current)

Backend does NOT need another deploy for this fix.

ROOT CAUSE
v7.69 frontend forced /api/cash-position repeatedly:
- after renderCashPositionBoard
- after renderBatches
- after refreshBatchData
- after baseline save at 700ms
- again at 1600ms
- startup at 0 / 200 / 700 / 1600ms

A cash-position request itself reads multiple accounting datasets.
Right after a payment/slip Sheet write, this burst can trigger Google Sheets rate limiting.

V7.69.1
- disables loading old aggressive v7.69 runtime
- one initial delayed request
- one request after a completed batch refresh
- one request after manual baseline save
- single-flight: only one request can exist at a time
- 12 second successful-data TTL
- 5 second absolute request gap
- if Sheets says rate limited, silently cool down for 65 seconds
- no repeated cash-position popup storm

Build must show:
✅ CASH_POSITION_RATE_LIMIT_FIX_V7_69_1_20260816 ready
✅ removed repeated 0/200/700/1600ms cash-position requests
✅ removed duplicate renderBatches + refreshBatchData forced requests
✅ cash position now uses single-flight + debounce + 12-second cache
✅ Google Sheets rate-limit response triggers a silent 65-second cooldown
✅ payment/baseline changes trigger only one delayed cash refresh
