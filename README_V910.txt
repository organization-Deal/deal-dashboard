DEAL Dashboard v9.10.0 — Reconciliation Operator View
Build date: 20 Aug 2026

เป้าหมาย
- ทำหน้ากระทบยอดให้เป็น workflow เดียวที่อ่านจากบนลงล่าง: เลือกบัญชี → Statement → ตรวจคู่ → ยืนยัน
- ลดข้อมูลซ้ำและกล่อง KPI ที่ทำให้หน้าดูเหมือน dashboard ซ้อน dashboard
- ไม่แตะ logic การจับคู่, API, Statement parser, bank mapping หรือ event เดิม

สิ่งที่แก้
1) Header กระชับ + flow 4 ขั้นตอน
2) สรุปบัญชีเหลือ compact strip เดียว
3) แถบเตือนที่ไม่มีข้อความจริงถูกซ่อน
4) KPI 5 กล่องซ้ำ: ถ้าทั้งหมดเป็น 0 จะซ่อน; ถ้ามีงานจริงจะย่อเป็น chips
5) Statement panel เหลือแถวเดียว และซ่อนการ์ดบัญชีซ้ำ
6) ตอนยังไม่มี Statement จะแสดง empty state ที่บอก action ถัดไปชัดเจน
7) ปุ่ม "ยืนยันคู่ที่ตรงกันทั้งหมด" ย้ายมาอยู่กับส่วนงานกระทบยอด โดยย้าย DOM node จริงเพื่อรักษา event listener เดิม
8) Mobile รองรับ horizontal account summary และปุ่ม Statement เต็มแถว
9) ใช้ CI Navy #11162E เดิม ไม่มี accent สีม่วง AI

Deploy
- แตกไฟล์ ZIP นี้ทับ root ของ deal-dashboard
- Commit / Push
- Build log ต้องมีบรรทัด ✅ Dashboard v9.10.0

Safety
- v9.10 รันหลัง v9.09 และก่อน wrangler deploy
- เป็น composition patch เฉพาะ reconciliation
- cache-bust assets v9.08/v9.09 เพื่อไม่ให้ browser ผสมไฟล์คนละเวอร์ชัน
