# Accounting Suite v7.1 — Dashboard

ฐาน: v6 Modular / Route-Isolated (ตัวที่ลด RAM จาก ~1.4 GB เหลือระดับ ~89 MB ในการใช้งานจริงของโปรเจกต์)

## เพิ่มอะไร
- วันนี้ต้องทำอะไร (งานบัญชีสำคัญบนหน้า Overview)
- ค้นหาทั้งระบบ: รายจ่าย / รายรับ-ลูกหนี้ / เจ้าหนี้ / คู่ค้า / Archive เดิม
- ลูกค้าและผู้ขาย (Contact Master) + Statement รายคู่ค้า
- เจ้าหนี้การค้า (AP) + วันครบกำหนด + จ่ายบางส่วน + WHT + หลักฐาน
- ปิดงวดบัญชี + Checklist + ล็อกงวด + เปิดใหม่พร้อมเหตุผล
- ศูนย์ภาษี: VAT ซื้อ / VAT ขาย / WHT รับ / WHT จ่าย + รายการเตือน + CSV
- สมุดบัญชี: Chart of Accounts / Journal / Trial Balance / Manual Adjustment
- Migration Center: CSV/XLSX, auto mapping, template, Archive, Contacts, AR, AP, Opening Balance
- เพิ่มยอดยกมาด้วยมือได้
- Backup JSON เต็มบริษัท
- Audit Log + สิทธิ์ Owner / Accountant / Approver / Viewer
- Universal Search และ Archive สำหรับประวัติระบบเดิม

## หลัก UX
- เมนูงานประจำอยู่ด้านบน
- งานบัญชีที่ใช้ไม่บ่อยถูกจัดกลุ่มใน “บัญชี SME”
- Desktop ใช้ตาราง, Mobile ใช้ layout อ่านง่าย
- หน้าหนักยังคง Route Isolation ของ v6: เปิดหน้าไหน โหลดหน้านั้น ไม่แบกทุกฟีเจอร์ใน RAM พร้อมกัน

## ข้อมูลเดิม
- ไม่ลบหรือเขียนทับข้อมูลรายรับ/รายจ่ายเดิม
- ฟีเจอร์ใหม่ใช้ Sheet tab ใหม่
- Ledger ไม่ backfill รายการเก่าก่อน v7 อัตโนมัติ เพื่อกันการลงบัญชีซ้ำ ให้กำหนด Cut-over Date และนำ “ยอดยกมา” เข้าแทน

## ลำดับ deploy
1. Deploy LINE Bot / Worker v7.1 ก่อน
2. ตรวจ root health ให้ version เป็น `DEAL_LINE_BOT_v7.1_ACCOUNTING_SUITE_20260809`
3. Deploy Dashboard
4. ปิด tab Dashboard เก่าแล้วเปิดใหม่
5. เปิดเมนู “ย้ายข้อมูล” หรือ “เจ้าหนี้” ครั้งแรก ระบบจะสร้าง tab ใหม่อัตโนมัติ
6. ก่อนย้ายข้อมูลจริง แนะนำให้กด “สำรองข้อมูลบริษัท” และสำรอง Google Sheet เดิมอีกชั้น

## Cut-over แนะนำ
1. Import ประวัติหลายปีเป็น Archive
2. Import ลูกค้า/ผู้ขาย
3. Import ลูกหนี้ค้าง
4. Import เจ้าหนี้ค้าง
5. Import/กรอก Opening Balance ณ วัน Cut-over
6. ตรวจว่าเดบิต = เครดิต
7. เริ่มบันทึกรายการใหม่ในระบบนี้
8. ใช้ปิดงวดเมื่อกระทบยอด/เอกสารครบ

## ขอบเขตที่จงใจไม่แอบอ้าง
- Tax Center เป็นศูนย์เตรียม/ตรวจข้อมูล ไม่ใช่การยื่น ภ.พ.30 / ภ.ง.ด. / e-Tax โดยตรง
- Role v7 ใช้ลิงก์ token แยกต่อคนและ revoke ได้ ยังไม่ใช่ SSO/อีเมลองค์กรเต็มรูปแบบ
- Backup v7 เป็น full JSON export; การ Restore แบบกดครั้งเดียวไม่ได้เปิดให้ทำลายข้อมูลโดยอัตโนมัติ ใช้ Migration Center เป็นช่องทางนำเข้าที่ปลอดภัยกว่า
