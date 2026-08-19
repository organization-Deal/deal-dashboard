v7.88 — Calm Accounting Theme

เป้าหมาย:
ลดสีบน Dashboard ให้เป็นโปรแกรมบัญชี/B2B มากขึ้น
- 90% ขาว/เทา/กรม
- Indigo ใช้เฉพาะ active navigation / focus / progress
- เขียว/ส้ม/แดงใช้เฉพาะสถานะ ไม่ทาสีทั้งการ์ดหรือทั้งแถว
- ปุ่มหลักเปลี่ยนจากม่วง gradient เป็น Deep Navy
- Income: เอาพื้นเขียวของ KPI เงินเข้าจริงออก
- Reconciliation: เอาพื้นแถวเขียว/แดง/เหลืองออก เหลือสีที่ status badge
- Warning กระทบยอดเป็นการ์ดขาว + เส้นส้มบางด้านซ้าย
- Batches: ลด bubble/ม่วงใน status cards
- Overview: เหลือ focus card กรมเพียงใบเดียว
- Font IBM Plex Sans Thai เหมือนเดิม

อัปเข้า root ของ deal-dashboard:
1) apply-v788-calm-accounting-theme.mjs
2) package.json

จากนั้นรอ Cloudflare Deploy เขียว แล้ว Ctrl+Shift+R
