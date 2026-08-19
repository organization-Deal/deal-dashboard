รับจ่ายแบบไม่จำกัด Dashboard v7.89 — CI Focus

Direction:
- ยึดภาพ Reference ล่าสุดเป็นหลัก
- 90% ขาว / เทาอ่อน / Navy text
- Indigo = CI หลัก ใช้เฉพาะ Active, Primary CTA, chart/progress
- Navy = focus surface ที่สำคัญ ไม่ใช้ทั้งหน้า
- Green / Amber / Red = semantic status เท่านั้น ไม่ทาพื้นการ์ดหรือทั้งแถว
- ลด gradient เหลือ Overview focus KPI เพียงจุดเดียว
- Income KPI ทุกใบกลับเป็นพื้นขาว
- Reconciliation ลบพื้นเขียว/แดง/เหลืองของแถว เหลือสีเฉพาะ status badge
- Batches ลดสีใน status cards และตาราง
- Expenses เน้นขาว + status chip
- IBM Plex Sans Thai คงเดิม

วิธีใช้:
1. อัปโหลด apply-v789-ci-focus-dashboard.mjs ไป root ของ repo
2. วาง package.json ทับไฟล์เดิม
3. รอ Cloudflare deploy สำเร็จ
4. เปิดเว็บแล้ว Ctrl+Shift+R
