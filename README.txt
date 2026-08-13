V7.41 — รวมข้อมูลบริษัท + ผู้อนุมัติ/ลายเซ็น

อัปที่ root ของ deal-dashboard:
- apply-v741-company-documents-ui.mjs
- package.json

Cloudflare:
Build command: None
Deploy command: npm run deploy
Root directory: /

ผลลัพธ์:
- เมนูเดียว: ข้อมูลบริษัทและเอกสาร
- ซ่อนเมนูผู้อนุมัติและลายเซ็นแยก
- รวมข้อมูลบริษัท ผู้อนุมัติ ลายเซ็น โลโก้ ความพร้อมเอกสารไว้หน้าเดียว
- Save แล้วอยู่หน้าเดิม ไม่เด้งกลับภาพรวม
- URL เก่า biz=approver ถูกพาไปหน้าใหม่
- ไม่แตะ API/ข้อมูลเดิม
