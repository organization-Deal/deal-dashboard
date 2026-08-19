v7.93 — GLOBAL CI DESIGN SYSTEM

รอบนี้เป็น CI ทั้งระบบ ไม่ใช่ patch เฉพาะหน้าที่เห็นในรูป

ครอบคลุม:
- ภาพรวม
- เบิกจ่าย
- รายจ่าย
- รายรับ
- กระทบยอด
- รายงานและภาษี
- เอกสารทั้งหมด
- เอกสารจากอีเมล
- รายจ่ายประจำ
- ประวัติการทำงาน
- จัดการธุรกิจทุกแท็บ: ข้อมูลบริษัท / ผู้อนุมัติ / Workflow / การเงิน / ทีม / หมวดหมู่
- ระบบและการเชื่อมต่อ
- แพ็กเกจ / Billing
- Modal / Drawer / Form ที่เปิดจาก Dashboard
- Internal Ops (admin.html)
- Billing Admin
- Pilot form
- จับคู่หลักฐาน (files.html)
- Checklist
- Receipt page

CI RULES:
- Background: #F7F8FC
- Surface: #FFFFFF
- Text: #101828 / #344054
- Primary Indigo: #4F46E5
- Indigo Soft: #EEF2FF
- Green / Amber / Red = สถานะเท่านั้น
- ไม่มี permanent black surface ใน UI
- IBM Plex Sans Thai ทั้งระบบ
- การ์ด radius 14-15px และ shadow เบา
- ปุ่มหลัก Indigo, ปุ่มรองขาว/เทา
- Status = pill เทา + semantic dot

วิธีลง:
1. อัป apply-v793-global-ci-design-system.mjs ไป root ของ deal-dashboard
2. วาง package.json ทับไฟล์เดิม
3. รอ Cloudflare build สำเร็จ
4. Ctrl + Shift + R

หมายเหตุ: v7.93 ต่อจาก v7.92 ที่อยู่ใน repo ปัจจุบันได้ตรง ๆ
