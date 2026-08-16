PUBLIC PILOT FORM v7.59

อัปไฟล์ pilot.html ไปที่ ROOT ของ repository:
organization-Deal/deal-dashboard

ให้ทับ pilot.html เดิม แล้ว Deploy deal-dashboard

หลัง Deploy ลิงก์ที่ส่งให้ลูกค้า:
https://deal-dashboard.organization-23c.workers.dev/pilot.html

ฟอร์มส่ง POST ไปที่:
https://accoutingsuppor02.organization-23c.workers.dev/pilot/request

Backend เดิมรองรับ field:
- contactName
- businessName
- email
- contact
- referrer
- note
- website (honeypot)

ข้อมูลเพิ่มเติม เช่น จำนวนพนักงาน / จำนวนรายการ / Workflow ปัจจุบัน /
ฟีเจอร์ที่สนใจ / ปัญหาที่อยากแก้ จะถูกรวมเข้า field note อัตโนมัติ
จึงไม่ต้องแก้ backend เพิ่มเพื่อใช้ฟอร์มนี้

หลังลูกค้าส่ง:
Internal Operations > Pilot Requests
ควรเห็นรายการใหม่ทันทีหลัง Refresh
