RUBJAI CI v7.97 — DIRECT SOURCE FIX
======================================

ทำไมรอบนี้ต่างจาก v7.90 / v7.92 / v7.93 / v7.95:
- รอบเก่าเป็น apply-vxxx.mjs ที่ต้องรันตอน Cloudflare build
- รอบนี้แก้ไฟล์จริงที่ index.html อ้างอยู่แล้ว:
      assets/brand-theme.css
- ไม่ต้องแก้ package.json
- ไม่ต้องเพิ่ม deploy patch เข้า chain
- ถ้า Cloudflare serve commit ล่าสุด ไฟล์นี้ต้องถูกโหลดแน่นอน

สิ่งที่ไล่แก้:
1. + บันทึกรายจ่าย = Indigo #4F46E5
2. + ตั้งเบิก = White outline
3. ตรวจเอกสาร / เพิ่มข้อมูลบัญชี / ดูรายละเอียด ในตาราง = White outline
4. วิธีใช้ / header utilities = White, ไม่ใช้ dark CTA
5. Expense active tab = Indigo-soft
6. Batch status cards = White + selected border
7. Status = neutral chip + semantic dot เท่านั้น
8. Reconciliation active account/KPI = White + Indigo border
9. Workspace settings dark panel = White
10. Billing/pricing = White + Indigo primary
11. Fallback logos/avatars = Indigo; uploaded real logos unchanged
12. No full-row green/red backgrounds

วิธีวาง:
- แตก ZIP
- เข้า repo deal-dashboard
- เปิดโฟลเดอร์ assets
- วาง brand-theme.css ทับไฟล์เดิม
- Commit
- รอ Cloudflare deployment ที่อ้าง commit ใหม่นี้

ตรวจว่า production ได้ไฟล์ใหม่จริง:
1. หลัง deploy กด Ctrl+Shift+R
2. เปิด DevTools > Console แล้วรัน:
   getComputedStyle(document.documentElement).getPropertyValue('--rubjai-ci-build')
3. ต้องได้:
   "v7.97-direct-source-20260819"

ถ้าไม่ได้ค่านี้:
- ไม่ใช่ปัญหา CSS แล้ว
- Cloudflare ยัง serve deployment/commit เก่า

หมายเหตุ:
- package.json ปัจจุบันมี v7.95 ใน deploy chain แต่ GitHub source ไม่มี assets/ci-final.css
  เพราะ ci-final.css ถูกสร้างตอน build เท่านั้น
- v7.88 มี rule ที่ตั้ง .btn.solid และ .acct-next .btn.primary-next เป็น deep navy
  จึงอธิบายหน้าตาปัจจุบันที่ยังดำ/กรมได้
