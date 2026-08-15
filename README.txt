v7.53 — แก้ Dashboard ค้าง “กำลังโหลดข้อมูล...”

ต้นเหตุ:
v7.52 เพิ่ม googleOk ให้ Promise.all จุดแรก แต่เปลี่ยน logic ทั้งไฟล์ให้ใช้ googleOk
load() จึง ReferenceError ก่อนถึง /api/expenses และค้าง loading ตลอด

อัปที่ root ของ deal-dashboard:
- apply-v753-load-googleok-crash-fix.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

Build log ต้องเห็น:
✅ PRODUCTION_AUTH_UI_GUARD_V7_52_20260815 ready
✅ V7_52_1 current/legacy expense payload anchors supported
✅ LOAD_GOOGLEOK_CRASH_FIX_V7_53_20260815 ready
✅ googleOk declarations verified: 2
✅ load() no longer crashes before primary dashboard fetch

หลัง deploy:
- ปิด Dashboard tab เก่า
- เปิดใหม่
- Hard refresh 1 ครั้ง
