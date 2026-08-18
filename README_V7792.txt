v7.79.2 — Simple Expense UI Hotfix

แก้ 2 เรื่อง:
1) Validation "nearest valid values 0.9901 / 1.0001" — เกิดจาก quantity min=.0001 + step=.01
2) UI ยาวและปุ่มบันทึกมองไม่เห็น

วิธีอัป:
- อัปไฟล์ apply-v779-professional-manual-expense-ui.mjs ทับไฟล์ชื่อเดิมใน root ของ deal-dashboard
- ไม่ต้องแก้ package.json
- ไม่ต้องอัป deal-line-bot ใหม่
- Commit → รอ Cloudflare Deploy → Ctrl+Shift+R

ฟอร์มใหม่:
- ปุ่มบันทึกอยู่หัวฟอร์มและมองเห็นตลอด
- ลดเหลือ 4 ส่วน: ข้อมูลหลัก / ยอดเงิน / การชำระเงิน / ข้อมูลเพิ่มเติม
- ไม่ต้องกรอกจำนวนและราคาต่อหน่วย ถ้าเป็นรายการรายจ่ายทั่วไป
- VAT/WHT ยังคำนวณอัตโนมัติ
