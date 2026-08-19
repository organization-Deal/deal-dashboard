v7.90 — Reference Redesign

สาเหตุที่ v7.88 ดูแทบไม่เปลี่ยน:
index.html โหลด assets/dashboard.css ก่อน แล้วโหลด assets/brand-theme.css ทีหลัง
ดังนั้น CI stylesheet ตัวหลังสามารถเขียนทับ patch ที่ append อยู่ใน dashboard.css ได้

v7.90 แก้ถูกชั้น:
- append visual override ที่ท้าย assets/brand-theme.css โดยตรง
- cache-bust brand-theme.css เป็น v=7.90.20260819
- ไม่ใช้ v7.89 เป็น dependency

Visual direction:
- ขาว/เทา/Navy เป็นฐาน
- Indigo เป็น CI หลักเฉพาะ CTA, active navigation, chart, progress
- Overview มี colored focus card แค่ใบเดียว
- ลบวงกลมตกแต่งใน status strip หน้าเบิกจ่าย
- Status colors อยู่แค่ badge
- รายรับ KPI ขาวทั้งหมด
- กระทบยอดกลับเป็น surface ขาว ไม่มี block สีใหญ่
- ลด radius / shadow ให้คล้าย reference ล่าสุด

อัปโหลดเข้า root deal-dashboard:
1) apply-v790-reference-redesign.mjs
2) package.json

รอ Cloudflare Deploy สำเร็จ แล้ว Ctrl+Shift+R
