README FIRST — V7.62 MOBILE PRODUCTION UX

อัปเฉพาะ repo:
organization-Deal/deal-dashboard

ไฟล์ที่ต้องอัปไป ROOT:
1. apply-v762-mobile-production-ux-fix.mjs
2. package.json   (ทับของเดิม)

ไม่ต้องแก้ deal-line-bot รอบนี้

จากนั้น New Deployment

Build log ต้องเห็น:
✅ MOBILE_PRODUCTION_UX_FIX_V7_62_20260816 ready
✅ mobile permission now uses the real business router
✅ closing More always releases mobile scroll lock
✅ employee / permission chevrons preserved
✅ connected Google no longer sends mobile users to OAuth again
✅ unavailable Sheet/Drive no longer fail silently
✅ permission/team controls are iPhone-sized and scrollable

Smoke test บน iPhone / LINE browser:
1. เปิด Dashboard จาก LINE
2. เพิ่มเติม
3. สิทธิ์การใช้งาน
   - ต้องเปิดหน้าได้ครั้งแรก
   - ต้องเลื่อนหน้าได้ทันที
4. กลับ เพิ่มเติม > ข้อมูลพนักงาน
   - ต้องมีลูกศร และเปิดได้
5. เพิ่มเติม > Google
   - ถ้าเชื่อมแล้ว ต้องไม่เข้า OAuth ใหม่
6. เปิด Google Sheet / Drive
   - ถ้าพร้อม เปิดได้
   - ถ้ายังไม่พร้อม ต้องมีข้อความ ไม่ใช่กดเงียบ
7. เปิด/ปิด เพิ่มเติม 5 รอบ
   - ทุกครั้งหลังปิด หน้าหลักต้อง scroll ได้
