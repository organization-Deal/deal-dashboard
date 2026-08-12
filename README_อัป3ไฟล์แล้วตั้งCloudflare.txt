DEAL-DASHBOARD — WORKERS STATIC ASSETS FIX
=========================================

สาเหตุเดิม
----------
deal-dashboard เป็น Static HTML ล้วน:
- ไม่มี Worker main
- ไม่มี wrangler.toml
- ไม่มี package.json

ดังนั้น:
npx wrangler@3.90.0 deploy

จะพังด้วย:
Missing entry-point

วิธีใหม่
--------
ใช้ Cloudflare Workers Static Assets

เพิ่ม 3 ไฟล์ที่ root:
- wrangler.toml
- package.json
- .assetsignore

Cloudflare Build Settings:

Build command:
npm install --package-lock=false

Deploy command:
npm run deploy

Root directory:
/

Version command:
ปล่อยเดิมได้ หรือเว้นว่างถ้า UI อนุญาต

สำคัญ
------
ใช้ Wrangler 4.115.0 แบบ pin exact ใน package.json
ไม่ใช้ latest 4.121.0 ที่ build เคยเจอ dependency miniflare ผิด

Static assets ที่จะถูก deploy:
- index.html
- admin.html
- pilot.html
- checklist.html
- files.html
- receipt.html
- assets/**
- _headers

ไฟล์เอกสาร/patch จะไม่ถูก public เพราะ .assetsignore

ควรลบจาก deal-dashboard root หลัง deploy ผ่าน:
- apply-v7263-approver-assignment-confirmation.mjs
  (เป็น Worker patch ของ deal-line-bot ไม่ใช่ Dashboard)
- download
- download (1)

ไม่ต้องย้าย HTML เข้า public/
ไม่ต้องสร้าง Worker index.js
ไม่ต้องใช้ main
Workers Static Assets รองรับ assets-only config โดยตรง
