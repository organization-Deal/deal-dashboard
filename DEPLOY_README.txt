รับจ่ายแบบไม่จำกัด — Dashboard Mobile UX v5.3
Date: 2026-08-08

Base:
- deal-dashboard-main (3).zip

Changed file:
- index.html

What changed:
1) Removed the mobile business/company selector from the fixed/floating area.
   - It now appears as a compact card in normal page flow above the page header.
   - It can never cover content at the bottom of the screen.

2) Bottom navigation is always visible on phones / Fold portrait up to 820px.
   Tabs:
   - ภาพรวม
   - เบิกจ่าย
   - รายจ่าย
   - กระทบยอด
   - เพิ่มเติม

3) "เพิ่มเติม" now exposes desktop-parity navigation, including:
   - รายรับ
   - รายงานและภาษี
   - เอกสารทั้งหมด
   - ประวัติ
   - เอกสารจากอีเมล
   - รายจ่ายประจำ
   - จับคู่หลักฐาน
   - เอกสารอัตโนมัติ
   - ข้อมูลบริษัท
   - ผู้อนุมัติและลายเซ็น
   - บัญชีและช่องทางการเงิน
   - ทีมและผู้ใช้งาน
   - หมวดหมู่
   - ตั้งค่าการใช้งาน
   - แพ็กเกจ
   - เชื่อมต่อ Google
   - Google Sheet
   - Google Drive

4) Overview mobile hierarchy improved:
   - KPI numbers first
   - accounting note second
   - package/beta card reduced and moved below the important numbers

Deploy:
- Replace index.html in the dashboard repository with this index.html.
- Commit/push to the branch connected to Cloudflare Pages/Workers deployment.
- Hard refresh / open a fresh LINE in-app browser after deploy.

Important:
- This patch only changes dashboard front-end UX. It does not change the LINE bot backend.
