Dashboard v7.52.1 hotfix

แก้ build fail:
Error: หา anchor ไม่เจอ: expense payload validation

วิธีใช้:
1) เอา apply-v752-production-auth-ui.mjs ไปทับไฟล์ชื่อเดิมที่ root ของ deal-dashboard
2) ไม่ต้องแก้ package.json
3) Deploy ใหม่

ต้องเห็น log:
✅ PRODUCTION_AUTH_UI_GUARD_V7_52_20260815 ready
✅ Google Sheet/Drive and Gmail shown as separate auth states
✅ google_reconnect_required preserves cache / shows — instead of ฿0
✅ 401 dashboard-link auth no longer confused with Google OAuth expiry
✅ V7_52_1 current/legacy expense payload anchors supported
