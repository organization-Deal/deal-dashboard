V7.63 — PERMISSION SIMPLE FLOW

อัปเฉพาะ repo:
organization-Deal/deal-dashboard

อัป 2 ไฟล์ไป ROOT:
1. apply-v763-permission-simple-flow.mjs
2. package.json (ทับไฟล์เดิม)

ไม่ต้องอัป permissions-simple-flow-v763.js เอง
migration จะสร้าง asset ให้ตอน Build

ไม่ต้องแก้ Backend

หลัง Deploy หน้า สิทธิ์การใช้งาน จะเหลือ:
1. เลือกหน้าที่
2. เลือกกลุ่ม LINE + พนักงาน
3. สรุปสั้น 1 บรรทัด
4. ปุ่ม เพิ่มสิทธิ์ให้พนักงาน
5. สมาชิกที่มีสิทธิ์แล้ว

สิ่งที่ซ่อนออกจาก flow:
- Preview ขนาดใหญ่
- Workflow ของสิทธิ์การใช้งานที่ซ้ำกับหน้า Workflow
- ปุ่มตั้งค่า Workflow ในการ์ดนี้
- ชื่อในระบบ/รายละเอียดขั้นสูงที่ไม่จำเป็น
- คำอธิบายบทบาทยาวบนมือถือ

Build log ต้องเห็น:
✅ PERMISSION_SIMPLE_FLOW_V7_63_20260816 ready
✅ permission flow = role → LINE group → employee → add access
✅ duplicate preview removed from the main flow
✅ duplicate workflow card removed from the permission page
✅ existing access members remain below the form
✅ mobile role choices compacted to one row
