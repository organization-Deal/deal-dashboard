Dashboard v5.0 — Non-blocking Company Setup

แก้จาก Dashboard v4.9 Multi-business Pro ล่าสุด

สิ่งที่เปลี่ยน:
- Company Setup แบบเต็มหน้าจอจะไม่เด้งอัตโนมัติอีกต่อไป
- Refresh / Gmail OAuth callback / sync / navigation จะไม่เปิด modal บังคับ
- Dashboard เปิดใช้งานและสลับหน้าได้ตามปกติ แม้ setup ยังไม่ครบ
- Checklist "ตั้งค่าบริษัท" ใน Sidebar ยังอยู่และอัปเดต 0/3, 1/3, 2/3, 3/3 ตามจริง
- กดแต่ละรายการใน checklist เพื่อไปเชื่อม Gmail / ข้อมูลบริษัท / ช่องทางการเงินได้ตามเดิม
- เมื่อครบ 3/3 จะเปลี่ยนเป็น "บริษัทพร้อมใช้งาน"
- ไม่ลบข้อมูลและไม่แก้ Workflow เบิกจ่าย / Multi-business / Subscription

วิธี Deploy:
1. เอา index.html ไปทับ root ของ repo deal-dashboard
2. Deploy Dashboard อย่างเดียว
