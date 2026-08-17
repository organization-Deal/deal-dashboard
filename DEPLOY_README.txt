Dashboard v7.72.2 Trial UI fix

แก้ปัญหา UI หน้า Billing แสดง Trial 60 วัน / 1,500 ทั้งที่ backend เป็น Trial 30 วัน / 1,000 แล้ว

ไฟล์ที่เปลี่ยน:
- apply-v772-trial-30d-1000-ui.mjs

สิ่งที่ patch ตอน deploy:
- assets/reimbursement-batch-lock.js: Trial 30 วัน / 1,000 รายการ
- คง paid Business package = 1,500 รายการ/เดือน
- bump cache key reimbursement-batch-lock.js -> v7.72.2.20260817
- audit ป้องกัน 60-day Trial copy กลับมาอีก

นำไฟล์ apply-v772-trial-30d-1000-ui.mjs ไปแทนไฟล์เดิมใน root ของ repo แล้ว deploy ตามปกติ
