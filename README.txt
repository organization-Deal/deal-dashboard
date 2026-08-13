V7.45 — RESET COMPOSITION หน้า Team Access

อัปที่ root ของ deal-dashboard:
- apply-v745-team-composition-reset.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

แก้เฉพาะ layout/composition:
- dashboard access กินเต็มความกว้างของหน้า ไม่ลอยเป็น card จิ๋วกลางจอ
- ซ้าย/ขวา 70/30 บน desktop
- ตัด card ซ้อน card ใน step 1/2 เปลี่ยนเป็น section ต่อเนื่อง
- Summary ขวาใหญ่ขึ้นและสมดุลกับ form
- สมาชิกที่มีสิทธิ์แล้ว + Workflow อยู่เป็น section ต่อเนื่องภายในการ์ดเดียว
- ไม่แตะ Backend / API / permissions / team data
