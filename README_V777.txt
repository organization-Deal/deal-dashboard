v7.77 — Stripe Success UX + Owner Billing Admin

อัปเข้า root ของ deal-dashboard:
1) apply-v777-billing-success-ui.mjs
2) package.json
3) billing-admin.html

หลัง Deploy:
- ลูกค้าจ่ายสำเร็จ → กลับ Dashboard → ระบบรอ Webhook และแสดง “ชำระเงินสำเร็จ”
- หน้าแพ็กเกจแสดงวันต่ออายุ + ปุ่ม “จัดการการชำระเงิน”
- หลังบ้านเจ้าของ: https://deal-dashboard.organization-23c.workers.dev/billing-admin.html
  ใช้ ADMIN_PIN 6 หลักเดียวกับ Internal Ops

สำคัญ:
ต้องอัป deal-line-bot v7.77 ก่อน แล้วค่อย deal-dashboard v7.77
