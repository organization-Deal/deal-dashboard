รับจ่ายแบบไม่จำกัด — NAVY CI v9.00

CI ใหม่จากภาพอ้างอิง:
Primary      #11162E
Hover        #20294F
Deep Navy    #080B1A
Navy Soft    #F0F2F8
Navy Line    #D9DEEA
Background   #F8F9FC

ไฟล์ที่ต้องวางทับ/เพิ่มใน repo deal-dashboard:
1) apply-v900-navy-ci.mjs          -> root
2) package.json                    -> root (วางทับ)

ทำงานอย่างไร:
- patch รันเป็นตัวสุดท้ายก่อน wrangler deploy
- ไล่ runtime จริง: root *.html + assets/*.css + assets/*.js
- เปลี่ยน Indigo/Purple/Blue/Black primary เดิมเป็น Navy
- แก้ทุกหน้าใน index + standalone: admin, billing-admin, checklist, files, pilot, receipt
- แก้ loading / spinner / progress / focus / selection / pricing / chart
- ความพร้อมธุรกิจ + ข้อมูลล่าสุด = Navy (ไม่เขียว)
- สี AI badge / AI chip / AI accent = Navy Soft + Navy
- สีสถานะจริง เช่น จ่ายแล้ว/สำเร็จ ยังคง muted green
- แก้ cache bust brand-theme.css เป็น v9.00.20260820 อัตโนมัติ

Deploy:
npm run deploy

หลัง Deploy เช็ก Console:
getComputedStyle(document.documentElement).getPropertyValue('--rubjai-ci-build')

ต้องได้:
v9.00-navy-20260820
