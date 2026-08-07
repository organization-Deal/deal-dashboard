Dashboard Sidebar / Workspace Control v4.8

เปลี่ยนเฉพาะ deal-dashboard/index.html

สิ่งที่แก้:
- จัด Sidebar ใหม่เป็น WORKSPACE / BUSINESS / SYSTEM
- ย้าย Quick actions เข้า Workspace เป็นเครื่องมือ จับคู่หลักฐาน + เอกสารอัตโนมัติ
- จัดเมนูธุรกิจใหม่: ข้อมูลบริษัท / ผู้อนุมัติ & ลายเซ็น / ทีม & ผู้ใช้งาน / บัญชีและช่องทางการเงิน / หมวดหมู่
- แยก System: ระบบและการเชื่อมต่อ / แพ็กเกจและอัปเกรด / เชื่อม Google
- เปลี่ยนหน้า Settings เป็น System Control Center โทนดำ-ขาว ไม่ใช้การ์ด 4 ช่องแบบเดิม
- Setup 3/3 จะยุบเป็นสถานะ “บริษัทพร้อมใช้งาน” โดยอัตโนมัติ
- รักษา id และ data-action เดิมเพื่อไม่ให้ workflow หลักพัง

Deploy: เอา index.html ไปทับ root ของ repo deal-dashboard แล้ว Deploy Dashboard อย่างเดียว
