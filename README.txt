RUBJAI Dashboard v9.06.0
BATCHES TABLE-FIRST + VERSION BADGE
20 ส.ค. 2569

ไฟล์นี้แก้ 2 เรื่องพร้อมกัน:

1) หน้า "เบิกจ่าย"
- เอา "กลุ่ม LINE ที่ส่งรายการเข้าเบิก" ออกจากหน้าเบิกจ่าย
- เอา "ยอดเงินแต่ละบัญชี" ออกจากหน้าเบิกจ่าย
- เปิดหน้าเบิกจ่ายแล้วเจอ Status + ตารางใบเบิกทันที
- กลุ่ม LINE ย้ายไป: จัดการธุรกิจ > กลุ่ม LINE
- ยอดเงินบัญชีย้ายไป: จัดการธุรกิจ > บัญชีและช่องทางการเงิน

2) Version ของ Dashboard
- เพิ่มข้อความเล็กมุมล่างซ้าย:
  Dashboard v9.06.0
  Build 20 ส.ค. 2569

วิธีติดตั้ง:
1. วาง apply-v906-batches-table-first-version-badge.mjs ที่ root ของ deal-dashboard
2. รัน:
   node apply-v906-batches-table-first-version-badge.mjs
3. Deploy:
   npm run deploy

ไฟล์จะเพิ่มตัวเองเป็น patch ตัวสุดท้ายก่อน wrangler deploy อัตโนมัติ

หลัง Deploy เช็ก 2 จุด:
A) มุมล่างซ้ายต้องเห็น "Dashboard v9.06.0"
B) Console:
   window.__RUBJAI_DASHBOARD_VERSION__
ต้องได้:
   "9.06.0"

และ:
   window.__RUBJAI_V906_TABLE_FIRST__
ต้องได้:
   true

ถ้ามุมล่างซ้ายยังไม่มี v9.06.0 = Cloudflare ยังไม่ได้ใช้ build นี้
