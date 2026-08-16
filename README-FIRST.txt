V7.67 — FAST NAVIGATION

อัปเฉพาะ deal-dashboard ROOT:
1. apply-v767-fast-navigation.mjs
2. package.json (ทับเดิม)

ไม่ต้องแก้ Backend

เปลี่ยนหลัก:
- เลิก location.assign ตอนเปลี่ยนหน้าใน Dashboard
- ใช้ soft navigation + history.pushState
- ไม่ลบ DOM/data ของหน้าที่เพิ่งออก
- render ข้อมูลใน RAM ทันที แล้ว sync API ข้างหลัง
- 30 วินาทีไม่ยิง API หน้าเดิมซ้ำ
- warm เบิกจ่าย 1.2 วิ และรายรับ 2.6 วิหลังหน้าแรกพร้อม
- Overview ไม่รอ package API
- Back/Forward ยังทำงาน

Build ต้องเห็น:
✅ FAST_NAVIGATION_V7_67_20260816 ready
✅ page navigation no longer reloads the whole Dashboard
✅ previous page DOM/data kept in memory for instant return
✅ page API refresh uses 30-second stale-while-revalidate cache
✅ reimbursement and income are warmed after first load
✅ Overview no longer waits for package API before accounting load
✅ browser Back/Forward works with soft navigation

ทดสอบหลัง Deploy:
เปิดจาก LINE > ภาพรวม > รายจ่าย > เบิกจ่าย > รายรับ > ภาพรวม
การสลับหน้าต้องไม่เห็น browser reload ใหม่ทั้งหน้า
