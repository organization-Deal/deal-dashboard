Company Setup Gmail return fix v4.6

แก้ปัญหา:
- เชื่อม Gmail สำเร็จแล้ว แต่กลับ Dashboard แล้ว Company Setup ยังขึ้น "เชื่อม Gmail" ซ้ำ

สาเหตุ:
- Dashboard เดิมโหลด Gmail status + Email documents + Subscriptions เป็นชุดเดียว
- ถ้า Email documents หรือ Subscriptions ช้าหรือ error จะไม่อัปเดต EMAIL_INFO แม้ Gmail OAuth สำเร็จแล้ว

สิ่งที่แก้:
- อ่าน /api/gmail-status แยกจาก Email Inbox APIs
- เมื่อ OAuth callback กลับมาพร้อม ?gmail=connected จะ poll ยืนยันสถานะ Gmail สูงสุด 8 ครั้ง
- เมื่อ connected=true จะอัปเดต Company Setup ทันทีและไม่ขอเชื่อมซ้ำ
- Email documents / Subscriptions error ชั่วคราวจะไม่ทำให้ Gmail ถูกแสดงเป็น disconnected

Deploy:
- ทับ index.html ที่ root repo deal-dashboard
- Deploy Dashboard เท่านั้น
