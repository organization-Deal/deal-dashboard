v7.76 Stripe legacy Pilot override fix

สาเหตุ:
assets/reimbursement-batch-lock.js ยังมีโค้ด v7.12 ที่กำหนด requestUpgradePilot ทับ requestUpgrade ของ Stripe หลังหน้าโหลดเสร็จ
จึงเห็นปุ่มใหม่ "ชำระและเริ่มใช้แพ็กนี้" แต่เมื่อกดกลับทำงานแบบเก่า "บันทึกแพ็กไว้ / ทีมงานติดต่อ"

อัปไฟล์ 2 ไฟล์ที่จำเป็นไปที่ root ของ deal-dashboard:
- apply-v776-stripe-legacy-pilot-override-fix.mjs
- package.json

จากนั้นรอ Cloudflare deploy ผ่าน แล้ว Ctrl+Shift+R หน้า Dashboard
