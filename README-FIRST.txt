V7.66 — CASH POSITION COMPACT

อัปเฉพาะ deal-dashboard ROOT:
1. apply-v766-cash-position-compact.mjs
2. package.json

ไม่ต้องแก้ Backend และไม่ต้องอัป generated CSS/JS เอง

Mobile result:
- ตัด CASH POSITION kicker + คำอธิบายยาว
- หัวข้อ + จัดการบัญชีอยู่บรรทัดเดียว
- 3 summary ใหญ่ -> 1 summary หลัก + 2 mini stats
- ซ่อนข้อความย่อยใต้ summary
- account card ย่อเป็น 2 แถว
- ยอดอยู่ขวา / เวลาอัปเดตอยู่ล่าง
- อัปเดตยอด -> อัปเดต / ใส่ยอดปัจจุบัน -> ใส่ยอด
- ตัด “ไม่บอก” และชื่อบัญชีที่ซ้ำในรายละเอียด

Build ต้องเห็น:
✅ CASH_POSITION_COMPACT_V7_66_20260816 ready
✅ cash summary changed to 1 hero + 2 mini stats on mobile
✅ cash account cards compacted into two-row mobile cards
✅ update-balance action reduced to a small secondary button
✅ long cash-position descriptions removed on mobile
