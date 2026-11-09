# นากนะ บัญชี — Performance 1.2.0

ชุดนี้ต่อจาก Accounting Recovery / LINE Rebrand 1.1 ที่ติดตั้งแล้ว ไม่ใช่โค้ด HR
วันที่ตรวจ source: 9 พฤศจิกายน 2026

## ขอบเขตที่ตรวจได้จริง
- อ่านซอร์สปัจจุบันและสคริปต์ build จาก GitHub ผ่าน connector
- Node unit/integration harness 51 กรณีผ่าน (ใช้ข้อมูลจำลอง)
- ทดลองตัวเตรียม frontend บน build fixture: patch, การคงธีม, ลำดับโหลด network guard, cache version และรันซ้ำผ่าน
- ยังไม่ได้ build repository เต็มด้วย Wrangler หรือทดสอบ API ของบัญชีจริง
- ไม่ได้ Commit/Push/Deploy ขึ้น Production; สิทธิ์ GitHub ที่เชื่อมอยู่ยังไม่มี push
- ไม่อ้างว่าเวลาโหลดจริงลดลงกี่วินาที จนกว่าจะวัดก่อน/หลังใน Production

## สิ่งที่ไม่เปลี่ยน
ไม่เปลี่ยนสี/ฟอนต์/มาสคอต, ไม่ลบข้อมูล, ไม่แก้ยอดเงินหรือรายการ, ไม่เปลี่ยนการอนุมัติ/จ่าย/ลิงก์ที่ใช้เข้าเว็บ
ไม่มี schema migration, ไม่ต้องเปลี่ยน Secret, ไม่มีการเพิ่ม persistent cache ของรายการเงิน
Full billing และการบังคับโควตาเดิมยังทำงานตามเดิม

## ลำดับติดตั้ง
ติดตั้งฝั่ง deal-line-bot ก่อน แล้วจึง deal-dashboard
ไฟล์ต้องอยู่ที่ root ของ repo ตามโครงสร้าง ZIP ไม่ต้องอัป ZIP ทั้งก้อนหรือสร้างโฟลเดอร์ครอบ
ตรวจ diff และเก็บ commit เดิมสำหรับย้อนกลับก่อนอัปเดต

## ชุดนี้สำหรับ organization-Deal/deal-dashboard

เปลี่ยน scripts/prepare-nakna-accounting-release.mjs
เพิ่ม performance/nakna-fast-load.mjs และ tests/performance.test.mjs
ยังใช้ apply-nakna-accounting-brand.mjs และ branding/ ของ Recovery 1.1 เดิม
ไม่วาง index.html หรือ dashboard.js รุ่นเก่าทับ repo

### วิธี deploy
ตั้ง Cloudflare Deploy command เป็น:
```bash
npm run deploy
```
wrangler.toml ที่ติดตั้ง Recovery 1.1 แล้วต้องมี:
```toml
[build]
command = "node scripts/prepare-nakna-accounting-release.mjs"
```
ต้องเห็น:
```
PASS NAKNA-ACCOUNTING-PERFORMANCE-1.2.0
```

### ผลที่เปลี่ยน
- เริ่มอ่านข้อมูลหน้าที่เปิดทันที พร้อมข้อมูลตั้งค่าบริษัท โดยไม่รอ Google/Gmail/รายชื่อธุรกิจ/แพ็กเกจครบ
- ปลดสถานะ boot เมื่อ primary request จบ ไม่รอ optional requests
- โหลดบริการรองภายหลัง จำกัดงานเสริมพร้อมกัน 2 งาน
- overview ไม่ดึง Gmail status หรือข้อมูลหน้าอื่นล่วงหน้า
- overview ใช้ metadata แพ็กเกจแบบเบา แต่หน้า Billing ใช้ endpoint เต็มเดิม
- สรุปแพ็กเกจไม่ทับ PLAN_INFO เพื่อไม่ทำให้โควตากลายเป็น 0 หรือเปลี่ยนสิทธิ์
- โหลดแพ็กเกจล้มเหลวแสดงข้อความและทางไปลองใหม่ ไม่ค้างคำว่า “กำลังโหลดแพ็กเกจ”
- เมื่อ settings อ่านไม่สำเร็จไม่บังคับเปิด wizard ตั้งค่าบริษัทจากข้อมูลที่ยังไม่รู้
- คง read-timeout และ network diagnostics ของ 1.1; ไม่มีการลด timeout เพื่อแกล้งให้ดูเร็วขึ้น

### ทดสอบก่อน deploy
```bash
node --test tests/performance.test.mjs
```
หลัง deploy ตรวจ assets/nakna-accounting-release.json ว่าระบุ release 1.2.0
ทดสอบเปิด overview, เบิกจ่าย, รายรับ, แพ็กเกจ และกลับ overview
ข้อมูลเก่าที่เป็นเดือนสิงหาคมจะไม่ถูกบวกเข้า KPI เดือนพฤศจิกายน การเลือกเดือนยังเหมือนเดิม

### วัดผลจริงหลัง deploy
เปิด Network ในเบราว์เซอร์และบันทึก duration ของ /api/expenses, /api/settings, /api/subscription แยกกัน
diagnostics เดิมดูได้ด้วย:
```javascript
window.__NAKNA_ACCOUNTING_NETWORK__?.report()
```
รายงานนี้ไม่รวม signed URL หรือค่า tenant/key แต่ Network/HAR ปกติอาจมี credential: ห้ามแชร์ HAR ดิบ
ไม่ได้รับประกันความเร็วของ Google Sheets หรือเครือข่ายผู้ใช้

### ย้อนกลับ
revert commit ของชุดนี้แล้ว deploy Recovery 1.1 เดิม ไม่ต้องแก้ข้อมูลบัญชี
