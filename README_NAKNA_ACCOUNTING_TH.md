# นากนะ บัญชี — ชุดเปลี่ยนแบรนด์ 1.0.0

ใช้กับ `deal-dashboard` เท่านั้น ไม่ใช่ `hr-line`, Nakna HR, หรือ DEAL! Connect

## ขอบเขต

เปลี่ยนแบรนด์ของหน้าเว็บระบบบัญชีเดิมให้เป็น “นากนะ บัญชี” เพื่อใช้คู่กับนากนะ HR

- ชื่อผลิตภัณฑ์บนแถบแบรนด์ / ชื่อแท็บ browser / metadata / คำเรียกผลิตภัณฑ์เดิมที่ระบุได้แน่นอน
- หัวแบรนด์และมาสคอตจากไฟล์นากนะ HR ที่ผู้ใช้แนบมา ไม่แทนที่โลโก้หรือชื่อบริษัทของ Workspace
- สีข้อความ ปุ่มหลัก ปุ่มรอง เมนู active ฟอร์ม กราฟเดิม แท็บ ตาราง การ์ด และองค์ประกอบคู่มือ/สิทธิ์ที่รองรับ
- ฟอนต์ IBM Plex Sans Thai และ IBM Plex Sans โดยใช้ Google Fonts URL รูปแบบเดียวกับ HR ไม่มีไฟล์ฟอนต์ในชุดนี้
- สร้างธีมใหม่เป็นขั้นตอนสุดท้ายก่อน deploy เพื่อไม่ให้แพตช์สี Navy รุ่นก่อนเขียนทับ
- ไม่เพิ่ม MutationObserver, setInterval, listener หรือ JavaScript runtime ตัวใหม่ใน browser

## สีอ้างอิงจาก HR

อ้างอิง `hr-line-main (2).zip`: `public/ui/p10.css` ซึ่งโหลดหลัง `public/styles.css` และ `public/ui/nakna-mark.webp`

| องค์ประกอบ | ค่า |
|---|---|
| Primary Teal | #04878A |
| หัวข้อ | #153C45 |
| ข้อความหลัก | #20373E |
| ข้อความรอง | #5C7178 |
| พื้นหน้า | #F5F7F8 |
| การ์ด | #FFFFFF |
| สีพื้นอ่อน | #E8F5F5 |
| เส้นขอบ | #E1E9EC |
| ฟอนต์ | IBM Plex Sans Thai / IBM Plex Sans |

สีความสำเร็จ คำเตือน และข้อผิดพลาดยังแยกเป็นเขียว เหลือง และแดง ไม่เปลี่ยนทุกสถานะเป็น Teal

## สิ่งที่ไม่เปลี่ยน

ข้อมูลการเงิน ชื่อ/โลโก้บริษัท ผู้รับเงิน เลขบัญชี สิทธิ์ API การอนุมัติ การโอนเงิน ธุรกรรม ฐานข้อมูล Secret ราคาหรือแพ็กเกจ

ไม่เปลี่ยนชื่อ repository, Cloudflare Worker, hostname, LINE OA, Rich Menu, ข้อความ LINE จากฝั่ง bot หรือไฟล์เอกสารที่ออกไปแล้ว

ไม่รวมระบบล็อกอิน/บิลลิง/สิทธิ์กับ Nakna HR การเปลี่ยนรอบนี้ทำให้แบรนด์สอดคล้องกัน ไม่ใช่เชื่อมระบบหลังบ้านเข้าด้วยกัน

## โครงสร้างไฟล์ที่เพิ่ม

```text
apply-nakna-accounting-brand.mjs
branding/
  nakna-accounting-brand.css
  nakna-accounting-mark.webp
scripts/
  install-nakna-accounting-brand.mjs
  verify-nakna-accounting-brand.mjs
tests/
  nakna-accounting-brand.test.mjs
README_NAKNA_ACCOUNTING_TH.md
QA_NAKNA_ACCOUNTING.json
```

เก็บต้นฉบับธีมไว้ใน `branding/` แยกจาก `assets/` เพื่อป้องกันแพตช์เก่าไล่แก้สีไฟล์ runtime ก่อนขั้นสุดท้าย

ไม่แนบ `index.html`, `dashboard.js` หรือ `package.json` รุ่นเก่ามาทับ repo ที่ใช้อยู่ สคริปต์จะปรับเฉพาะจุดที่รองรับในไฟล์ปัจจุบัน

## วิธีติดตั้งผ่าน GitHub + Cloudflare

1. ใช้ repo `deal-dashboard` และ branch ที่ Cloudflare deploy อยู่
2. แตก ZIP แล้วเพิ่มไฟล์ทั้งหมดตามโครงสร้างด้านบนที่ root เดียวกับ `index.html` และ `package.json` ไม่ใส่ในโฟลเดอร์ซ้อนอีกชั้น
3. Commit / Push
4. ใน Cloudflare ตั้ง **Deploy command** เป็น:

```bash
node scripts/install-nakna-accounting-brand.mjs && npm run deploy
```

คำสั่งนี้จะรักษา chain ของ deploy เดิม เช่น apply-v7xx … v916 แล้วแทรกสองคำสั่งนี้ไว้หน้า Wrangler:

```bash
node apply-nakna-accounting-brand.mjs && node scripts/verify-nakna-accounting-brand.mjs
```

ไม่ต้องเปลี่ยน dependencies หรือค่าของ wrangler.toml ไม่ต้อง migration และไม่ต้องเพิ่ม Secret

**ห้ามใช้เพียง `npx wrangler deploy` สำหรับการติดตั้งชุดนี้ครั้งแรก** เพราะจะข้ามขั้นเปลี่ยนแบรนด์ ไฟล์ต้นฉบับใน branding/ ต้องถูกนำไปใช้ก่อน upload

### ติดตั้งจากเครื่องพัฒนา

```bash
node --test tests/nakna-accounting-brand.test.mjs
node scripts/install-nakna-accounting-brand.mjs
npm run deploy
```

installer ไม่ลบ pre-existing deploy hooks, ไม่เปลี่ยน version ของแอป และไม่ลบ dependencies ตัวเดิม หลังติดตั้งสามารถใช้ npm run deploy ต่อได้

สคริปต์จะหยุดแทนการเขียนทับ หากพบว่าไม่ใช่โครงสร้างบัญชีที่รองรับ หรือ deploy command ไม่มี Wrangler จุดเดียวที่ระบุได้

### ตรวจไฟล์โดยยังไม่ deploy

หลัง build/patch เดิมเสร็จแล้ว:

```bash
node apply-nakna-accounting-brand.mjs
node scripts/verify-nakna-accounting-brand.mjs
```

ไฟล์ที่เกิด/เปลี่ยนเมื่อรัน:
- `index.html`: title, root branding marker, หัวแบรนด์, font/theme links
- `assets/nakna-accounting-brand.css` / `assets/nakna-accounting-mark.webp` / `assets/nakna-accounting-brand.json`
- เฉพาะข้อความผลิตภัณฑ์แบบ exact literal ที่พบใน assets/dashboard.js และ helper ที่ระบุในสคริปต์
- name/short_name/theme ใน manifest.json หรือ manifest.webmanifest (เฉพาะเมื่อมีอยู่แล้ว)
- `package.json`: เฉพาะ deploy hook และคำสั่ง nakna:brand เมื่อรัน installer

## วิธีรู้ว่าเว็บใช้แบรนด์ใหม่จริง

- มุมแบรนด์แสดง “นากนะ บัญชี” โดยชื่อ Workspace ยังเป็นบริษัทเดิม
- ปุ่มหลักสี Teal ไม่ใช่ Navy
- HTML root มี `data-nk-release="NAKNA-ACCOUNTING-BRAND-1.0.0"`
- ไฟล์ `/assets/nakna-accounting-brand.json` มีชื่อผลิตภัณฑ์กับ release ข้างต้น
- ใน DevTools computed styles ต้องแสดง primary #04878A, heading #153C45 และฟอนต์ IBM Plex Sans Thai เป็นลำดับแรก
- ทดสอบเปลี่ยนเมนู เปิด modal และมือถือ ไม่พบชื่อ/สีเดิมกลับมาหลังเปลี่ยนหน้า

ไม่ควรแก้สีด้วยการแก้ไฟล์ assets ที่สร้างขึ้นโดยตรง ให้แก้ต้นฉบับ `branding/nakna-accounting-brand.css`

## ผลทดสอบและข้อจำกัด

- 18 Node tests: idempotence, ป้องกันใช้กับ HR ผิด repo, คง ID/handler/URL/ข้อมูลบริษัท, คง deploy chain และกู้ธีมหลังถูกสีเก่าเขียนทับ
- 16 build-time checks: ชื่อ release, CSS ลำดับสุดท้าย, สี/ฟอนต์ที่ระบุ, asset hash และไม่มี JS runtime ใหม่
- ตรวจ CSS syntax ด้วย PostCSS และ Node syntax ของสคริปต์
- ทดสอบ Chromium แบบ offline กับ HTML ระบบบัญชีที่ดึงจากไฟล์แนบ/Library และ CSS v9.08 ที่มีในบทสนทนา ความกว้าง 390, 768, 1440px
- ตรวจสี computed style, สี focus, mascot, no horizontal overflow และไม่มี page error ใน fixture
- ภาพตัวอย่างใช้ข้อมูลสมมติ และไม่ได้เรียก API หรือทำธุรกรรมจริง
- สภาพแวดล้อมทดสอบโหลด Google Fonts ภายนอกไม่ได้ ภาพตัวอย่างจึงใช้ fallback ไทยที่ติดตั้งไว้ ตรวจลิงก์และการตั้งค่าฟอนต์แล้ว แต่ยังไม่ได้พิสูจน์การดาวน์โหลดฟอนต์ภายนอกบน Production
- ไม่ได้เข้าถึง repository ระบบบัญชีฉบับล่าสุดจาก GitHub และไม่ได้ deploy ไปยังเว็บจริง การตรวจ 3 หน้าจอไม่ได้เท่ากับ End-to-End QA ทุกฟีเจอร์บน Production

หลัง deploy ต้องตรวจการเปลี่ยนหน้า/เปิด modal/ตารางเบิกจ่ายจากข้อมูลจริง และว่าฟอนต์โหลดได้ ภายใต้ CSP ของเว็บที่อนุญาต fonts.googleapis.com / fonts.gstatic.com อยู่แล้ว การตรวจนี้ไม่ให้สิทธิ์เปลี่ยนข้อกำหนด CSP หรือ Secret โดยอัตโนมัติ

## ย้อนกลับ

ย้อน commit ชุดแบรนด์นี้และคืน index/assets/manifest จาก commit ก่อนติดตั้ง หากรันแล้วเกิดไฟล์ที่สร้างขึ้นใหม่ ให้ลบเฉพาะ assets/nakna-accounting-brand.css, assets/nakna-accounting-brand.json, assets/nakna-accounting-mark.webp และคืน deploy command เดิม ไม่ต้องแตะข้อมูลบัญชี
