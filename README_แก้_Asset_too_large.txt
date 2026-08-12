deal-dashboard — FIX Asset too large

สาเหตุ:
wrangler.toml ตั้ง [assets] directory = "."
หลัง Cloudflare ติดตั้ง dependencies แล้ว node_modules จะอยู่ใต้ repo root
Wrangler จึงพยายาม upload node_modules เป็น static assets ด้วย
ทำให้เจอ Asset too large > 25 MiB

วิธีแก้:
1. อัปไฟล์ .assetsignore ไปที่ ROOT ของ repo deal-dashboard
   ตำแหน่งเดียวกับ package.json และ wrangler.toml
2. ไม่ต้องเปลี่ยน Build command
3. Deploy command ใช้ npm run deploy ต่อได้
4. Root directory ใช้ / ต่อได้
5. Retry build

ไฟล์ apply-v7263-approver-assignment-confirmation.mjs ที่หลงอยู่ใน deal-dashboard
ควรลบออกภายหลัง เพราะเป็น patch ของ deal-line-bot ไม่ใช่ dashboard
แต่ไม่จำเป็นต้องลบเพื่อให้ build รอบนี้ผ่าน
