v7.55 — Gmail OAuth Return to Overview

สาเหตุ:
หลังเชื่อม Gmail สำเร็จ URL ยังเหลือ &page=email
load() จึงเปิดหน้าเอกสารจากอีเมลทุกครั้งที่ Refresh

แก้:
- เฉพาะตอน Gmail OAuth callback สำเร็จ
- ลบ gmail=connected
- เปลี่ยน page=overview
- ลบ biz ที่อาจค้าง
- เปิดหน้า “ภาพรวม” ทันที
- การ Refresh หน้าอื่นที่ผู้ใช้ตั้งใจเปิดเองยังคงอยู่หน้าเดิมตามปกติ

อัป root ของ deal-dashboard:
- apply-v755-gmail-return-overview.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /
