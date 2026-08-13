V7.42 — แยก Logo และ Signature ให้ชัด

อัปที่ root ของ deal-dashboard:
- apply-v742-separate-logo-signature.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

ผล:
- โลโก้บริษัทอยู่ในการ์ดข้อมูลบริษัท
- ลายเซ็นอยู่ในการ์ดผู้อนุมัติ/ผู้ลงนาม
- ไม่มีการ์ด “โลโก้และลายเซ็น” รวมกันอีก
- ปุ่ม “เปลี่ยนโลโก้” และ “เปลี่ยนลายเซ็น” แยกกัน
- หน้า receipt จะ scroll/focus ไปช่องที่ถูกต้องตามปุ่มที่กด
- ไม่แก้ Backend และไม่แตะข้อมูลเดิม
