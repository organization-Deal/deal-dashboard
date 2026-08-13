V7.43 — ลดหน้าเพิ่มคนเข้าทีมให้เหลือ 3 ขั้นตอน

อัปที่ root ของ deal-dashboard:
- apply-v743-team-access-clean.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

UI ใหม่:
1. เลือกหน้าที่
2. เลือกคนจาก LINE
3. เพิ่มเข้าทีม

- ซ่อนช่องชื่อจากหน้าหลัก ระบบใช้ชื่อ LINE อัตโนมัติ
- ยังเปิด “แก้ชื่อในระบบ” ได้ถ้าจำเป็น
- Workflow ย้ายเป็นฟีเจอร์รองด้านล่าง และมีปุ่ม “ตั้งค่า Workflow” เล็กด้านบน
- ตัดข้อความสถานะซ้ำ
- จำกัดความกว้าง flow ไม่ให้กระจายเต็มจอ
- ไม่แตะ Backend / สิทธิ์เดิม / ข้อมูลสมาชิก
