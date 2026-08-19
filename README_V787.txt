v7.87 — Final Dashboard Design ตามแนวภาพโฆษณา

เป้าหมาย:
- ไม่เปลี่ยน Logic / Workflow / API
- เปลี่ยนเฉพาะ Visual ของ Dashboard
- IBM Plex Sans Thai
- White + Indigo/Purple แบบภาพโฆษณา
- Sidebar active เป็นม่วงอ่อน + เส้นม่วง
- หน้าใบเบิกมี KPI Card 7 ใบพร้อม Icon
- Table สะอาด สีอ่อน อ่านง่าย
- Status ใช้ chip สีแยกตามความหมาย
- ลดการใช้ดำทึบและการย้อมสีทั้งแถว
- Responsive มือถือยังทำงาน

วางไฟล์:
deal-dashboard/
├─ apply-v787-ad-final-design.mjs   (ไฟล์ใหม่)
└─ package.json                     (วางทับ)

จากนั้น Commit / Deploy ตามเดิม
Patch นี้ถูกวางเป็นขั้นตอนสุดท้ายก่อน wrangler deploy
ดังนั้นดีไซน์จะไม่ถูก patch รุ่นเก่าเขียนทับระหว่าง build.
