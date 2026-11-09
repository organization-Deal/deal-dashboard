# นากนะ บัญชี — Dashboard Recovery 1.1.0

## ใช้กับอะไร
ใช้กับ organization-Deal/deal-dashboard เท่านั้น ไม่ใช่ hr-line, deal-connect, rubjaai-website หรือ deal-line-bot
อิงซอร์ส main ที่อ่านในรอบนี้: f6a7f164ef5330add4e7087308755f0e0642eac2
assets/dashboard.js Git blob: 855b82f484c738de8ca0894d006123e072f7ba2f
ไฟล์ wrangler.toml ในชุดนี้รักษาชื่อ Worker และ assets directory จากซอร์สนั้น เพิ่มเฉพาะ [build].

## สาเหตุที่ยืนยันได้จากซอร์ส
- index.html ที่อยู่ใน Git ยังโหลด CSS เดิม; rebrand รอบก่อนต้องอาศัย installer และ deploy command เฉพาะ
- package.json ที่อ่านยังจบที่แพตช์ v9.15 ก่อน wrangler โดยไม่มี brand hook
- load() รอสถานะหลายบริการก่อนอ่าน /api/expenses; fastNavPrime โหลดหน้าเบิกจ่าย/รายรับที่ยังไม่เปิด
นี่เป็นการตรวจซอร์ส ไม่ใช่การวัด latency ของ Production หรือพิสูจน์สาเหตุทุกกรณีบนมือถือผู้ใช้

## สิ่งที่แก้
1. ย้ายการลงธีมเข้าขั้น [build] ของ Wrangler บังคับทุก deploy ทั้ง npm run deploy และ npx wrangler deploy
2. ใช้ชื่อ นากนะ บัญชี สีหลัก #04878A, heading #153C45, text #20373E, ฟอนต์ IBM Plex Sans Thai/IBM Plex Sans
3. ใช้มาสคอตจากไฟล์นากนะ HR ที่ผู้ใช้ให้มา ไม่เปลี่ยนชื่อหรือโลโก้บริษัทลูกค้า
4. เริ่ม authenticated primary GET ก่อนกลุ่ม health checks; ไม่เอาแพ็กเกจมาบล็อกการอ่านยอด; หยุด prefetch หน้าที่ไม่เปิด
5. จำกัดเวลารอ GET ของบัญชี 20 วินาที (status บางตัว 10 วินาที) รวมเวลารอ JSON body; แสดงข้อความ+ลองใหม่
6. รวม GET ที่กำลังรอของ endpoint ที่กำหนดและ URL/tenant/auth/options เดียวกันเท่านั้น ไม่ cache ข้อมูลถาวร
7. ไม่ retry/แก้ POST หรือ upload/approval/payment; ไม่ข้ามการตรวจสิทธิ์; ไม่ reset Google/tenant/link
8. มี release manifest และตัวตรวจไฟล์ที่เสิร์ฟจริง ป้องกันสรุปว่า deploy ใหม่ทั้งที่ไฟล์เก่า

## อัปขึ้น GitHub
- สำรอง commit ปัจจุบัน ตรวจ diff หากมีการแก้ใหม่หลัง source ที่ระบุ
- แตก ZIP แล้ววางไฟล์ใน root ของ deal-dashboard ตามโครงสร้างใน ZIP ไม่สร้างโฟลเดอร์ครอบ ไม่อัป ZIP ตรง ๆ
- ต้องอัป wrangler.toml ด้วย มิฉะนั้นอาจข้ามขั้นลงธีมอีก
- Commit/Push branch ที่ Cloudflare ผูกไว้
- Deploy command แนะนำ: npm run deploy (คง legacy build sequence ใน package.json เดิม)
- ไม่ต้องรัน install-nakna-accounting-brand.mjs เพิ่มอีกสำหรับชุดนี้
- แพตช์นี้ไม่เปลี่ยน package.json, dependency, Secret, ฐานข้อมูล หรือ migration

## ทดสอบก่อน/หลัง deploy
ก่อน: node --test tests/recovery.test.mjs
Deploy: npm run deploy
ท้าย Build ต้องมี PASS NAKNA-ACCOUNTING-RECOVERY-1.1.0
หลัง: node scripts/check-nakna-accounting-live.mjs
หน้าเว็บต้องมีชื่อ นากนะ บัญชี และสี Teal แม้ข้อมูลบัญชียังโหลดอยู่
ตรวจ network/ช้าจริงใน Production ต่อด้วยบัญชีเจ้าของที่ถูกต้อง; อย่าใส่ tenant/key URL ลงรายงานสาธารณะ
window.__NAKNA_ACCOUNTING_NETWORK__.report() คืนเฉพาะ path/status/เวลา ไม่คืน query/key/ข้อมูลบัญชี

## ขอบเขตการยืนยัน
20 automated tests ผ่าน: boot scheduling, idempotent build, no auth bypass, GET dedup, body timeout, 401/403/429, POST preservation
Chromium บน fixture: 390/768/1440px สีหลัก/ข้อความ/semantic ถูกต้อง, ไม่มีแนวนอนล้น, timeout banner ใช้ได้, ไม่มี pageerror
fixture ไม่ใช่แอปเต็ม; font-family ตั้งถูก แต่ไม่ได้ยืนยันการดาวน์โหลด Google Fonts ออนไลน์
ไม่ได้รัน legacy build chain ทั้งหมด/ทดสอบบัญชีจริง/วัดความเร็ว Google Sheets จริง/Deploy ขึ้น Production ในรอบนี้
ชุดนี้ไม่แก้ backend Google Sheets latency หรือ OAuth token ที่หมดอายุ — จะแสดงข้อผิดพลาดแทนค้างเงียบ
ไม่รับประกันว่าทุกกรณีโหลดช้าหายจนกว่าจะทดสอบ Production

## Rollback
คืน commit ก่อนอัปชุดนี้และ redeploy; ห้ามลบ D1, KV, Sheet หรือ reset ลิงก์ธุรกิจเพื่อแก้เรื่องธีม
