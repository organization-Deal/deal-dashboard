v7.92 — CI Strict Color System

รอบนี้ตรวจ source จริงก่อนแก้

เจอสีดำค้างจาก:
1. assets/dashboard.css
   - .btn.solid
   - .workspace-link.drive
   - .expense-status-tab.active
   - settings / integration blocks หลายตัว

2. apply-v778 / v779 / v780
   - JavaScript inject <style> ตอน runtime
   - manual-expense-pay-btn
   - manual800-paid
   - toast
   ทำให้ static CSS ที่แก้ก่อนหน้าถูกเขียนทับได้

วิธีแก้ v7.92:
- append Runtime CSS เป็นโค้ดตัวสุดท้ายใน dashboard.js
- จึงชนะทั้ง dashboard.css, brand-theme.css และ runtime CSS เก่า
- black = ใช้เป็นตัวหนังสือเท่านั้น
- primary action = Indigo #4F46E5
- utility = ขาว/เทา
- status = พื้นเทา + จุด semantic เล็ก
- รวม batch monochrome cleanup ไว้แล้ว ไม่ต้องลง v7.91

ไฟล์ที่ต้องอัปเข้า root deal-dashboard:
1. apply-v792-ci-strict-color-system.mjs
2. package.json

หลัง Deploy สำเร็จ:
Ctrl + Shift + R

จุดที่ควรเห็นทันที:
- "ทั้งหมด" หน้า รายจ่าย: จากดำ -> ม่วงอ่อน
- "+ บันทึกรายจ่าย": จากดำ -> Indigo
- "เปิด Drive": จากดำ -> ขาว
- จ่ายแล้วหลายแถว: จาก pill เขียว -> pill เทา + จุดเขียว
