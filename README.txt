V7.48 — แก้ Dashboard เข้า Offline ทั้งที่อินเทอร์เน็ตใช้งานได้

อัปที่ root ของ deal-dashboard:
- apply-v748-false-offline-fix.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

แก้:
- navigator.onLine=false จะไม่หยุดโหลด API อีก
- Dashboard จะลอง Worker/API จริงก่อนตัดสินว่าเชื่อมไม่ได้
- browser offline event จะไม่ล้างข้อมูลเดิมและไม่ทำยอดกลายเป็น 0
- ลด false offline ที่ทำให้สถานะ Google/Gmail ดูผิดตามไปด้วย
- ไม่แตะข้อมูลบัญชี / Sheet / Drive / Backend / Worker
