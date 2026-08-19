รับจ่ายแบบไม่จำกัด — Dashboard v7.94 CI Visual Lock

รอบนี้แก้ตามภาพจริงที่เจอหลัง v7.93:

1) ยอดเงินปกติทั้งหมดเป็นสีกรม/ดำ ไม่ใช้เขียวเป็นสีตกแต่ง
2) เขียว / ส้ม / แดง ใช้เฉพาะสัญญาณสถานะขนาดเล็ก
3) ปุ่มในตารางเป็น neutral outline ทั้งหมด เพื่อลดสีซ้ำทุกแถว
4) ปุ่มหลักระดับหน้า/section เท่านั้นที่เป็น Indigo #4F46E5
5) Active tab / active navigation ใช้ Indigo Soft #EEF2FF
6) Bank logo / Company logo คงสีจริงของแบรนด์
7) เพิ่ม ci-lock.css และ runtime guard เพื่อกัน style เก่าที่ inject ทีหลังกลับมาทับ CI

วิธีใช้:
- วาง apply-v794-ci-visual-lock.mjs และ package.json ที่ root ของ deal-dashboard
- Push / รอ Cloudflare deploy
- เมื่อขึ้นเขียว ให้เปิด Dashboard แล้ว Ctrl + Shift + R
