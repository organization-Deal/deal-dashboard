V7.49 — แก้ Dashboard กลับจาก Gmail แล้ว Offline / ยอดเป็น 0

สาเหตุ:
- index.html เรียก assets/dashboard.js?v=7.33 มาตลอด
- _headers cache /assets/* นาน 86400 วินาที (24 ชั่วโมง)
- หลัง OAuth reload หน้า Browser/Cloudflare จึงสามารถหยิบ dashboard.js รุ่นเก่ากลับมา
- รุ่นเก่ายังหยุดโหลดทันทีเมื่อ navigator.onLine=false

อัปที่ root ของ deal-dashboard:
- apply-v749-dashboard-cache-fix.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

ใน Build log ต้องเห็น:
✅ NETWORK_FALSE_OFFLINE_FIX_V7_48_20260814 ready
✅ DASHBOARD_CORE_CACHE_FIX_V7_49_20260814 ready
✅ dashboard.js cache key -> v7.49.20260814
✅ dashboard.js Cache-Control -> no-store

หลัง deploy:
1. เปิด Dashboard ใหม่
2. Hard Refresh 1 ครั้ง
3. ถ้าเปิด tab เก่าค้างไว้ ให้ปิด tab นั้นแล้วเปิดจาก LINE/Dashboard link ใหม่

ไม่แตะ Sheet / Drive / Gmail token / ข้อมูลบัญชี
