DEAL Dashboard v9.09.0 — Permissions Full Width + No Flicker
Build: 20 Aug 2026

WHAT CHANGED
1) สิทธิ์การใช้งาน / เพิ่มสิทธิ์ให้พนักงาน
   - ขยาย workflow ให้เต็มความกว้างของ workspace เหมือนฟีเจอร์หลักอื่น
   - เอา max-width / centered island ที่ทำให้ฟอร์มแคบออก
   - แก้ parent container ที่ยังบีบความกว้างอยู่ด้วย ไม่ได้แก้เฉพาะ card ชั้นใน

2) แก้อาการกดเมนูแล้วเห็น UI เก่าแวบหนึ่งก่อน UI ใหม่
   - เพิ่ม early MutationObserver ใน <head> ทำงานก่อน paint
   - ตอนกด route สิทธิ์การใช้งาน มี transition cover ชั่วคราว
   - ปลด cover หลัง DOM ใหม่ถูก mark/composed แล้วเท่านั้น
   - มี fail-safe 1.8 วินาทีเพื่อไม่ให้หน้าค้างถ้า route มีปัญหา

3) Regression safety
   - v9.09 รันหลัง v9.08 เสมอ
   - ไม่ย้อนสี Navy CI / LINE Workspace composition / mobile compact ที่แก้แล้ว

DEPLOY
เอาไฟล์ทั้งหมดใน ZIP วางทับ root ของ repo deal-dashboard แล้ว Commit/Push
Build log ท้าย ๆ ต้องมี:
✅ Dashboard v9.09.0
✅ Employee permissions composition is full workspace width
✅ Pre-paint MutationObserver prevents legacy narrow UI from flashing
✅ Navigation transition cover prevents old page -> new page visual flicker
✅ v9.08 LINE + navy CI fixes remain intact
