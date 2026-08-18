v7.79.1 — Dashboard build hotfix

สาเหตุ: apply-v779-professional-manual-expense-ui.mjs มี nested template literal ที่ ${cats()} ถูก evaluate ตอน build ทำให้ ReferenceError: cats is not defined

วิธีใช้:
- อัป apply-v779-professional-manual-expense-ui.mjs ไปทับไฟล์เดิมที่ root ของ deal-dashboard
- ไม่ต้องแก้ package.json เพราะชื่อไฟล์เดิม
- Commit แล้วรอ Cloudflare deploy ใหม่
