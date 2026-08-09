อันนี้เป็น DASHBOARD v7.7 — Mobile Reimbursement Selection
==========================================================

อัปเข้า repo:
organization-Deal/deal-dashboard

ไม่ใช่ deal-line-bot

ให้ Upload/Replace ตาม path นี้ตรง ๆ:

deal-dashboard/
├─ index.html                    <-- ทับไฟล์เดิม
└─ assets/
   ├─ dashboard.js               <-- ทับไฟล์เดิม
   └─ dashboard.css              <-- ทับไฟล์เดิม

หลัง commit ให้ Cloudflare ของ Dashboard deploy ใหม่

สิ่งที่แก้:
- มือถือหน้าเบิกจ่ายแสดง checkbox จริง
- การ์ดมือถือย่อข้อมูลที่ไม่จำเป็น
- เลือกหลายรายการได้
- เลือกข้ามผู้เบิกได้
- ถ้า 1 ผู้เบิก: "รวมเป็นใบเบิก"
- ถ้าหลายผู้เบิก: "รวมเป็นรอบเบิก"
- มี action bar ลอยเหนือ bottom navigation
- backend เดิมจะแยกใบเบิก/บัญชีรับเงินตามผู้เบิกเพื่อไม่ให้เงินปนกัน

ไม่ต้องแก้ LINE Bot สำหรับฟีเจอร์นี้
