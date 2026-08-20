RUBJAI Dashboard v9.08.0 — BRAND + COMPOSITION + LINE WORKSPACE FIX
วันที่: 20 ส.ค. 2569

รอบนี้เป็น FINAL VISUAL GUARD ที่รันหลัง v9.07 ก่อน wrangler deploy

แก้หลัก:
1) เอาสี AI / indigo-purple ออกจาก runtime ทั้ง index.html และ assets CSS/JS
   - Primary: #11162E
   - Hover: #20294F
   - Deep: #080B1A
   - Soft: #F0F2F8
   - Line: #D9DEEA
   - ปุ่ม CTA / Active tab / progress / recommended package กลับเข้า CI RUBJAI
   - v9.07 Mobile เบิกจ่ายใช้ navy เดียวกัน

2) กลุ่ม LINE ไม่เด้งเป็นหน้าหรือ modal โดดๆ
   - LINE Workspace > รายละเอียด จะพาไป จัดการธุรกิจ > กลุ่ม LINE
   - lineGroupMonitor ถูกย้าย/ล็อกไว้ใน #lineGroupBusinessMount
   - legacy modal "กลุ่ม LINE ของ ..." ถูก suppress แล้ว route เข้า tab ที่ถูกต้อง

3) Composition desktop
   - หน้า ทีมและสิทธิ์ / เพิ่มสิทธิ์ให้พนักงาน ขยาย card ให้สัมพันธ์กับ workspace
   - ไม่ปล่อยฟอร์มแคบลอยกลางพื้นที่ว่างขนาดใหญ่
   - หน้า settings / package / reimbursement ใช้ rhythm และ active state ชุดเดียวกัน

4) Deployment guard
   - patch จะสแกน known AI palette หลัง patch ทั้งหมด
   - ถ้าพบสีม่วง/indigo ที่กำหนดไว้ จะ fail ก่อน wrangler deploy เพื่อไม่ปล่อย regression ขึ้น production

วิธีใช้:
- แตก ZIP
- วางไฟล์ทับที่ root ของ repo deal-dashboard
- Commit / Push
- Cloudflare build จะรัน v9.08 เป็น patch สุดท้ายก่อน wrangler deploy

ตรวจ Build log ต้องเห็น:
✅ Dashboard v9.08.0
✅ RUBJAI CI restored: navy #11162E / no generic indigo-purple accent
✅ LINE Workspace details route into Business > กลุ่ม LINE
✅ Legacy standalone LINE-group modal suppressed
✅ Team/permission desktop composition widened and normalized
✅ Static audit blocks known AI palette from shipping
