# รับจ่ายแบบไม่จำกัด — Accounting Dashboard

Dashboard HTML สำหรับฝ่ายบัญชี เชื่อมกับ Worker ใน Repo `deal-line-bot` โดยตรง ไม่มี npm build step

## เวอร์ชันหน้ารอบเบิก

- UI: `ONE_ACCOUNTING_TABLE_V4`
- API contract ที่คาดหวัง: `REIMBURSEMENT_ACCOUNTING_TABLE_V3`

## โต๊ะทำงานเบิกจ่าย

หน้า `เบิกจ่าย` รวมงานไว้ในตารางเดียว:

- รอรวมรอบ
- รอตรวจเอกสาร
- ต้องแก้ไข
- รอโอนเงิน
- รอหลักฐานการโอน
- จ่ายแล้ว

กดใบเบิกเพื่อเปิด Drawer ด้านขวา ดูรายการย่อย เอกสาร บัญชี Audit log และทำงานถัดไปโดยไม่เปลี่ยนหน้า

รองรับค้นหา กรองสถานะ รายการด่วน เลือกหลายรายการ สร้างรอบ ส่งออก CSV โอนเงิน ตีกลับพร้อมเหตุผล แนบหลักฐาน และส่ง LINE ซ้ำ

## ไฟล์

```text
index.html       Dashboard และโต๊ะทำงานเบิกจ่าย
checklist.html   Checklist ความพร้อมขายลูกค้า
files.html       จับคู่หลักฐาน
receipt.html     เอกสาร/ใบแทน
```

## Deploy

Repo นี้เป็น static HTML ให้ Deploy หลัง `deal-line-bot` เพื่อให้ API contract V3 พร้อมก่อน

หลัง Deploy ให้เปิดลิงก์จาก LINE ซึ่งต้องมี query `tenant` และ `k` แล้วทดสอบหน้า `?page=batches`

## Checklist

เปิด `checklist.html` จากเมนู “ความพร้อมขาย” เพื่อทำ UAT, Security, Pilot และ commercial readiness ต่อก่อนเปิดขายสาธารณะ
