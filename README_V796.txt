v7.96 — Action Hierarchy Fix

แก้ 3 จุดจากภาพล่าสุด:
1) + บันทึกรายจ่าย: เปลี่ยนจาก navy/black เป็น Indigo #4F46E5
2) วิธีใช้หน้านี้: ปุ่ม utility เป็นขาวขอบเทา + icon Indigo-soft
3) ปุ่มซ้ำในตาราง เช่น ตรวจเอกสาร / เพิ่มข้อมูลบัญชี / ดูรายละเอียด:
   เป็นขาวขอบเทาทั้งหมด ไม่เป็นปุ่มดำ/กรม

กฎ CI:
- Indigo filled = primary CTA ระดับหน้า
- White outline = secondary / utility / repeated row action
- Green / orange / red = semantic status only
- ไม่มี navy/black filled controls ใน UI ปกติ

วิธีวาง:
- apply-v796-action-hierarchy-fix.mjs -> root
- package.json จาก ZIP -> ทับ package.json
- Push แล้วรอ Cloudflare deploy
- Ctrl + Shift + R หลัง deploy
