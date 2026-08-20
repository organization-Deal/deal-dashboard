V9.04.2 FORCE TABLE-FIRST

รูปที่ส่งมาล่าสุดแปลว่า v904 เดิมไม่ได้ถูกเรียกใน build ที่ deploy จริง
เพราะเอาไฟล์ .mjs ไปวางเฉย ๆ จะยังไม่เปลี่ยน source ถ้า package.json ไม่ได้เรียกมัน

รอบนี้ทำ 2 อย่าง:
1) บังคับย้าย DOM ทุกครั้ง แม้โค้ดเก่าจะ render กลับมาหลัง async refresh
2) เมื่อรันไฟล์นี้ครั้งแรก มันเพิ่มตัวเองเข้า package.json > scripts.deploy อัตโนมัติ

วิธีใช้:
1. วาง apply-v9042-batches-table-first-force.mjs ที่ root ของ deal-dashboard
2. รัน:
   node apply-v9042-batches-table-first-force.mjs
3. Deploy:
   npm run deploy

หลัง deploy:
- หน้า เบิกจ่าย = status + ตารางทันที
- กลุ่ม LINE -> จัดการธุรกิจ > กลุ่ม LINE
- ยอดเงินแต่ละบัญชี -> จัดการธุรกิจ > บัญชีและช่องทางการเงิน

ตรวจว่า build ใหม่เข้าจริง:
เปิด Console แล้วพิมพ์
window.__RUBJAI_V9042_TABLE_FIRST__

ต้องได้ true
