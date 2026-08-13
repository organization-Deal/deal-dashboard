V7.44 — จัดคอมโพสหน้า Team Access ใหม่

อัปที่ root ของ deal-dashboard:
- apply-v744-team-access-composition.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

สิ่งที่เปลี่ยน:
- Main layout 8/4: ฟอร์มซ้าย + Preview summary ขวา
- Summary ขวาแสดงชื่อ / กลุ่ม / หน้าที่ / ความสามารถ / readiness
- ตัดกล่อง preview ว่างในฟอร์มซ้ายออก
- สมาชิกที่มีสิทธิ์แล้วแยกเป็น section ด้านล่าง
- Workflow ย้ายล่างสุดและพับไว้
- ไม่แตะ Backend / API / สิทธิ์เดิม / รายชื่อเดิม
