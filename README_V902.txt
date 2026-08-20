RUBJAI Dashboard — Mobile Composition v9.02

ไฟล์ใน ZIP นี้ self-contained:
- apply-v900-navy-ci.mjs
- apply-v901-navy-cleanup.mjs
- apply-v902-mobile-composition.mjs
- package.json

วางทั้งหมดที่ root ของ deal-dashboard แล้ว Deploy ตามปกติ

v9.02 แก้เฉพาะ Mobile Composition:
1. Workspace card ลดความสูง
2. Header เป็น 2 แถว:
   - ภาพรวม | วิธีใช้
   - เดือน | refresh
3. KPI 2x2 ลดความสูง/ช่องว่าง
4. ซ่อน accounting note บน Overview มือถือ
5. Trial banner ลดเหลือ utility strip
6. Graph ลดเหลือ 118px
7. Bottom nav 66px
8. Active icon ใช้ slate/navy soft ไม่เป็นก้อนมืด
9. Cache bust เป็น brand-theme.css?v=9.02.20260820

หลัง Deploy บน iPhone:
- ปิดหน้า LINE WebView แล้วเปิดใหม่
หรือ
- Safari/Chrome hard refresh

เช็ก Console:
getComputedStyle(document.documentElement).getPropertyValue('--rubjai-ci-build')
CI เดิมยังเป็น v9.01 ส่วน composition ดูจาก Network:
brand-theme.css?v=9.02.20260820
