Dashboard v7.5 — Connection Health

เป้าหมาย
- ถ้า Dashboard โหลดไม่ได้ จะตรวจการเชื่อมต่อก่อน ไม่ฟันธงว่า server/อินเทอร์เน็ตช้า
- ไม่แก้ schema และไม่แตะข้อมูลใน Google Sheet/Drive
- ไม่ต้อง deploy LINE Bot

พฤติกรรมใหม่
1. ตรวจธุรกิจปัจจุบัน
2. ตรวจ Google Sheet / Drive
3. ตรวจ Gmail
4. ถ้าธุรกิจหรือ Sheet/Drive ยังไม่พร้อม ระบบหยุดยิง API รายการซ้ำและแสดงคำแนะนำให้เชื่อมธุรกิจ/Google
5. ถ้า Gmail ยังไม่เชื่อม Dashboard หลักยังใช้ได้ แต่แจ้งว่า Email automation ยังไม่ทำงาน
6. เมื่อพื้นฐานครบแล้วแต่ API 5xx จริง จึงแสดงข้อความระบบตอบช้า

ไฟล์ที่แก้
- index.html (cache bust v7.5)
- assets/dashboard.js
- assets/dashboard.css

Deploy Dashboard only.
