RUBJAI CI v8.00 — Readiness + Live Sync Fix

วางทับ:
assets/brand-theme.css

แก้ selector จริงจาก source:
- .onboarding.complete .count → Indigo
- .onboarding.complete .onboarding-progress span → Indigo
- .onboard-step.done .step-dot → Indigo soft
- .syncstate.ok .dot → Indigo

ดังนั้น 2 จุดในภาพ:
1. ความพร้อมธุรกิจ / 5/5 / ✓ ทั้งหมด ไม่เขียวแล้ว
2. ข้อมูลล่าสุด dot ไม่เขียวแล้ว

ไม่ต้องเปลี่ยน package.json

แนะนำ cache bust ใน index.html:
brand-theme.css?v=8.00.20260820

ตรวจหลัง deploy:
getComputedStyle(document.documentElement).getPropertyValue('--rubjai-ci-build')

ต้องได้:
v8.00-direct-source-20260820
