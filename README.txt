V7.50 — Connection Stability

ปัญหาที่แก้:
- health check settings/business/workspace/Gmail พลาดแค่ครั้งเดียวแล้ว Dashboard ตีธุรกิจว่าไม่พร้อม
- load() ล้าง ALL=[] ทำให้ยอดบน Dashboard กลายเป็น 0
- Google/Gmail reconnect หรือ network กระตุกทำให้ Sheet/Drive ดูเหมือนหลุด
- ผู้ใช้ต้องกดเชื่อมใหม่ทั้งที่ข้อมูลเดิมยังอยู่

แนวทางใหม่:
- health probe เป็นแค่สัญญาณเตือน ไม่ใช่คำสั่งล้างข้อมูล
- Dashboard core จะลอง API จริงก่อนเสมอ
- API หลักโหลดสำเร็จ = ยืนยัน business + workspace ว่าพร้อม
- เก็บ last-known-good 24 ชั่วโมง
- transient failure 1–2 รอบไม่ตัด connection
- ถ้า API หลัก fail ต่อเนื่อง 3 รอบ + health fail จึงค่อยถือว่า connection มีปัญหาจริง
- Gmail แยกจาก core business readiness
- ไม่แตะข้อมูลใน Sheet / Drive / KV

อัปที่ root ของ deal-dashboard:
- apply-v750-connection-stability.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

Build log ต้องมี:
✅ NETWORK_FALSE_OFFLINE_FIX_V7_48_20260814 ready
✅ DASHBOARD_CORE_CACHE_FIX_V7_49_20260814 ready
✅ CONNECTION_STABILITY_V7_50_20260815 ready
