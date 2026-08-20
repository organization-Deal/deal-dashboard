V9.04 — BATCHES TABLE FIRST

วาง apply-v904-batches-table-first.mjs ที่ root ของ deal-dashboard

รัน:
node apply-v904-batches-table-first.mjs

ถ้าใช้ build chain ให้รันไฟล์นี้หลัง patch design ตัวล่าสุด และก่อน wrangler deploy.

ผล:
- หน้า เบิกจ่าย เปิดมาเจอ Status + ตารางใบเบิกทันที
- กลุ่ม LINE ย้ายไป จัดการธุรกิจ > กลุ่ม LINE
- ยอดเงินแต่ละบัญชี ย้ายไป จัดการธุรกิจ > บัญชีและช่องทางการเงิน
- ไม่ลบหรือย้ายข้อมูลจริง แค่ย้าย UI
