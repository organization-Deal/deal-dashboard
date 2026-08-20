DEAL Dashboard — v9.06 DEPLOY READY

ให้เอา 2 ไฟล์นี้วางทับ/เพิ่มที่ root ของ repo:

1. package.json
   - วางทับ package.json เดิม
   - deploy chain เดิมจาก Build Log ถูกเก็บครบ
   - เพิ่ม apply-v906-batches-table-first-version-badge.mjs ก่อน wrangler deploy

2. apply-v906-batches-table-first-version-badge.mjs
   - วางที่ root ของ repo เช่นเดียวกับ patch ตัวอื่น

จากนั้น Commit + Push ได้เลย
Cloudflare จะรัน npm run deploy อัตโนมัติ

Build Log ใหม่ต้องมี:
node apply-v903-bottom-nav-polish.mjs &&
node apply-v906-batches-table-first-version-badge.mjs &&
wrangler deploy --config ./wrangler.toml

หน้าเว็บหลัง deploy:
- เบิกจ่าย = ตารางเบิกจ่ายเป็นงานหลัก
- กลุ่ม LINE ย้ายออกไปแท็บจัดการธุรกิจ
- ยอดเงินแต่ละบัญชีย้ายออกไปแท็บบัญชี/ช่องทางการเงิน
- มุมล่างซ้ายเห็น Dashboard v9.06.0
