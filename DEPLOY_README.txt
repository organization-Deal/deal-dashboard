รับจ่ายแบบไม่จำกัด — Dashboard Mobile Workspace v5.2
วันที่: 2026-08-07

ฐานไฟล์:
- Dashboard v5.1 Sidebar Clean ล่าสุด
- คง Multi-business / Pro 3 ธุรกิจ / Subscription / Gmail / Non-blocking Company Setup ไว้

สิ่งที่แก้สำหรับโทรศัพท์:
1. Business Switcher ย้ายเป็นแถบบนมือถือแบบ fixed และยังสลับ Workspace ได้
2. Bottom Navigation ใหม่ 5 ปุ่ม:
   - ภาพรวม
   - เบิกจ่าย
   - รายจ่าย
   - กระทบยอด
   - เพิ่มเติม
3. ปุ่ม “เพิ่มเติม” เปิด Bottom Sheet รวม:
   - รายรับ / รายงาน / เอกสาร / ประวัติ
   - เอกสารจากอีเมล / รายจ่ายประจำ
   - จับคู่หลักฐาน / เอกสารอัตโนมัติ
   - ข้อมูลบริษัท / ช่องทางการเงิน / ทีม
   - ตั้งค่าการใช้งาน / แพ็กเกจ
4. Header มือถือใหม่ ลดของรก และซ่อน Sheet/Drive จากหัวจอ
5. KPI / Cards / Forms / Buttons / Pricing / Settings ปรับ spacing และ touch target สำหรับมือถือ
6. ตารางเบิกจ่ายหลักเปลี่ยนเป็นการ์ดต่อรายการบนมือถือ ไม่ต้องเลื่อนตาราง 1,500px
7. Status filters และ Reconciliation KPI ใช้ horizontal scroll แบบ mobile
8. Modal / Drawer / Dialog เปลี่ยนเป็น Bottom Sheet บนมือถือ
9. รองรับ safe-area ของ iPhone และ input font 16px เพื่อกัน Safari zoom
10. ไม่แก้ business logic เดิม

วิธี Deploy:
- เอา index.html ไปทับ root ของ repo deal-dashboard
- Deploy Dashboard อย่างเดียว

ตรวจแล้ว:
- JavaScript syntax ผ่าน
