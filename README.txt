V7.39 — กู้ Dashboard หน้าดำ/ค้าง

สาเหตุ: v7.38 ใช้ MutationObserver เฝ้าทั้งหน้า และ refresh() เขียน DOM ของหน้า Team ซ้ำ
จึงเกิด mutation loop ทำให้ main thread ของ browser ค้างได้ แม้อยู่หน้าอื่น เพราะ Team DOM มีอยู่ในหน้าเดียวกัน

อัปที่ root deal-dashboard:
- apply-v739-recover-dashboard.mjs
- package.json

Deploy command:
npm run deploy

v7.39 จะ:
- ถอน script v7.38 ออกจาก index ที่ deploy
- ใช้ UI แบบง่ายตัวใหม่ที่ไม่มี MutationObserver
- คงฟีเจอร์เลือก Role → LINE → เพิ่มคน
- ไม่แตะ API / ข้อมูล / สิทธิ์เดิม
