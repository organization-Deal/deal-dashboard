V7.65 — MOBILE MINIMAL UI

แนวคิดรอบนี้: ตัดคำอธิบาย / help / microcopy บนมือถือให้น้อยลง เพราะมีการสอนใช้งานแล้ว

อัปเฉพาะ root repo deal-dashboard:
1. apply-v765-mobile-minimal-ui.mjs
2. package.json

ต้องมี v764 อยู่ก่อน และใน package นี้กูใส่ v764 + v765 ใน deploy chain ให้แล้ว

Build log ต้องเห็น:
✅ MOBILE_MINIMAL_UI_V7_65_20260816 ready
✅ mobile help / explanatory copy reduced on phone
✅ settings service descriptions hidden for cleaner cards
✅ phone filters normalized to simpler single-column actions
✅ minimal mobile audit available as window.__minimalMobileAuditV765()

สิ่งที่รอบนี้เน้น:
- ซ่อนปุ่ม/บล็อก "วิธีใช้หน้านี้" บนมือถือ
- ซ่อนคำอธิบายยาวใน Settings service cards
- ซ่อน note/คำอธิบายที่เกะกะหลายจุดบน Overview / Settings / Batches
- ทำ filter/action บนมือถือให้อยู่คอลัมน์เดียว อ่านง่ายกว่า
