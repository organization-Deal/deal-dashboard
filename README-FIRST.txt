V7.62.1 — MOBILE PRODUCTION UX BUILD FIX

สาเหตุ Build v7.62 ล้ม:
- v7.62 ใช้ String.raw ตอนสร้าง runtime CSS
- ทำให้ generated asset มี style.textContent=\`
- Node จึง SyntaxError ก่อน wrangler deploy

แก้แล้ว:
- เปลี่ยน generation ให้เขียน backtick จริง
- ตรวจตัว migration ด้วย node --check
- จำลอง generated employee-permission-split-v747.js แล้ว node --check ผ่าน
- จำลอง generated dashboard.js แล้ว node --check ผ่าน

อัปเฉพาะ repo deal-dashboard ที่ ROOT:
1. apply-v7621-mobile-production-ux-fix.mjs
2. package.json (ทับของเดิม)

ไฟล์ apply-v762-mobile-production-ux-fix.mjs เก่าจะเก็บไว้ใน repo ก็ได้
เพราะ package.json ใหม่นี้จะไม่เรียกมันแล้ว

ไม่ต้องแก้ deal-line-bot

Build log ที่ต้องเห็น:
✅ MOBILE_PRODUCTION_UX_FIX_V7_62_1_20260816 ready
...
จากนั้นต้องไปต่อถึง:
wrangler deploy
และ Build Success

หลัง Deploy ค่อยทดสอบ:
เพิ่มเติม > สิทธิ์การใช้งาน
- กดครั้งแรกเข้าได้
- เลื่อนหน้าได้
- ปิด/เปิดเมนูแล้วยัง scroll ได้
