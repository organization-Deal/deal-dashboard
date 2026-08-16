V7.63.1 — PERMISSION FLOW RESCUE

อัปเฉพาะ deal-dashboard ROOT:
1. apply-v7631-permission-flow-rescue.mjs
2. package.json (ทับเดิม)

package ใหม่นี้เอา apply-v763-permission-simple-flow.mjs ออกจาก build แล้ว ไฟล์เก่าจะอยู่ใน repo ได้แต่ไม่ถูกเรียก
ไม่ต้องแก้ Backend

Build ต้องเห็น:
✅ PERMISSION_FLOW_RESCUE_V7_63_1_20260816 ready
✅ permission opens the real #biz-team tab, not virtual #biz-permissions
✅ removed recursive MutationObserver from permission simplification
✅ blank permission page has a finite visibility rescue

หลัง Deploy เปิด Dashboard ใหม่จาก LINE > เพิ่มเติม > สิทธิ์การใช้งาน ต้องเห็นฟอร์มทันที
