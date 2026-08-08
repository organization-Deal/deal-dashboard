Dashboard v7.2 — Accounting SME Coming Soon Lock

Purpose
- Keep stable core features available.
- Lock unfinished Accounting SME modules instead of showing blank/half-ready pages.

Locked for now
- เจ้าหนี้
- ค้นหาทั้งระบบ
- ลูกค้าและผู้ขาย
- ปิดงวดบัญชี
- ศูนย์ภาษี
- สมุดบัญชี
- ย้ายข้อมูล
- Audit & สิทธิ์

Behavior
- Desktop and mobile show a lock + Coming Soon badge.
- Clicking a locked feature opens a small Coming Soon dialog and does not change route.
- Direct URLs to locked pages fall back to Overview and show the Coming Soon dialog.
- accounting-suite.js remains in the repository but is not loaded while the suite is locked.

Not changed
- LINE Bot
- Google Sheet / Drive data
- Existing data schemas
- Overview, reimbursement, expenses, income, reconciliation, reports, documents, Gmail, recurring expenses, business settings

Deploy
- Dashboard only.
- Replace index.html and assets/dashboard.js + assets/dashboard.css, or upload the full project.
