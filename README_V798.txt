RUBJAI CI v7.98 — DIRECT SOURCE
ไฟล์ที่ต้องวางทับ:
assets/brand-theme.css

รอบนี้เพิ่มจาก v7.97:
- เขียว Success เปลี่ยนเป็น muted sage #39705A
- เขียวอ่อน #F1F6F3
- Sidebar / connection / paid status ลดความสด
- Operation Overlay "กำลังดำเนินการ..." ใช้ Indigo
- Spinner = Indigo
- Progress = Indigo
- Overlay = เทาอ่อน
- Card = ขาว + shadow เบาลง
- Mobile loading card ปรับขนาดให้พอดี

ไม่ต้องเปลี่ยน package.json
ไม่ต้องรัน apply-vxxx

ตรวจหลัง deploy:
เปิด Console แล้วรัน
getComputedStyle(document.documentElement).getPropertyValue('--rubjai-ci-build')

ต้องได้:
v7.98-direct-source-20260820
