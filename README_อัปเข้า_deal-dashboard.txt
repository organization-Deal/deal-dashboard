Dashboard v7.9 — ห้ามรวมใบเบิกซ้ำ
=================================

อัปเข้า:
organization-Deal/deal-dashboard

ไฟล์:
1. index.html                              -> ทับ root/index.html
2. assets/reimbursement-batch-lock.js      -> เพิ่มใน assets/

ทำอะไร:
- Checkbox มีเฉพาะ "รายการย่อย" ที่ยังไม่เคยรวม
- ใบเบิกหลักที่สร้างแล้วจะไม่มี checkbox รวมซ้ำ
- การ์ดใบเบิกหลักโชว์:
  รวมใบเบิกแล้ว · <เลขเอกสาร>
  เช่น รวมใบเบิกแล้ว · 2026-W32-B02-001
- Select all จะเลือกเฉพาะรายการที่ยังรวมได้
- ไม่แก้ข้อมูลใน Sheet
- ไม่กระทบ v7.8 Cash-Basis Overview
