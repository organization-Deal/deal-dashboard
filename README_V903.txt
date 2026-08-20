RUBJAI Dashboard — Bottom Nav v9.03

วางไฟล์ทั้งหมดใน ZIP ที่ root ของ deal-dashboard แล้ว Deploy ตามปกติ

ไฟล์:
- apply-v900-navy-ci.mjs
- apply-v901-navy-cleanup.mjs
- apply-v902-mobile-composition.mjs
- apply-v903-bottom-nav-polish.mjs
- package.json

v9.03:
- เปลี่ยน bottom nav จากแถบเทาเต็มจอ -> floating glass dock
- ลดความรู้สึกเป็นกล่องทื่อ
- icon เบาลง ไม่เป็นก้อนมืด
- active = soft gray/navy pill + indicator เส้น navy ด้านบน
- รองรับ iPhone safe-area / LINE WebView
- More sheet ปรับ backdrop ให้เข้ากับ CI
- cache bust brand-theme.css?v=9.03.20260820

หลัง Deploy:
ปิดหน้า Dashboard ใน LINE แล้วเปิดใหม่หนึ่งครั้ง
