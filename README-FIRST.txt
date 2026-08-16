V7.67.1 — FAST NAVIGATION COMPATIBLE

อัป root ของ deal-dashboard แค่:
1. apply-v7671-fast-navigation-compatible.mjs
2. package.json (ทับเดิม)

สำคัญ:
- package นี้เอา apply-v767-fast-navigation.mjs ตัวที่ Build ล้มออกแล้ว
- ไม่ต้องลบไฟล์ v767 เก่าออกจาก GitHub ก็ได้ เพราะ deploy chain จะไม่เรียกมัน
- ไม่แตะ Backend

สาเหตุ Build เดิมล้ม:
v7.67 พยายาม match load() block ยาวทั้งก้อน แต่ migration ก่อนหน้าแก้ block เดียวกันไปแล้ว
จึง throw "load health block changed" ก่อน wrangler deploy

v7.67.1:
- core fast navigation ยังเหมือนเดิม
- load() optimization เป็น optional
- ถ้า block ถูก migration ก่อนหน้าเปลี่ยน จะ skip ไม่ล้ม Build
- เปลี่ยนหน้า Dashboard ไม่ใช้ location.assign แล้ว
- เก็บข้อมูลหน้าที่เคยเปิดไว้ใน RAM
- sync API เบื้องหลังแบบ 30-second stale-while-revalidate
- browser Back/Forward ยังทำงาน

Build ต้องเห็น:
✅ FAST_NAVIGATION_COMPAT_V7_67_1_20260816 ready
✅ Dashboard page switches use soft navigation instead of full reload
✅ previous page DOM/data is retained in memory
✅ page refresh uses 30-second stale-while-revalidate
✅ load() compatibility guard enabled — changed earlier migrations cannot fail this build
✅ optional subscription gate optimization: applied หรือ skipped
✅ browser Back/Forward works with soft navigation

แล้วต้องไปต่อถึง wrangler deploy สำเร็จ
