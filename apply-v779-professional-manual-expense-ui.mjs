import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dashboardFile = path.join(process.cwd(), "assets", "dashboard.js");
const indexFile = path.join(process.cwd(), "index.html");
const MARK = "SIMPLE_EXPENSE_UI_V7_79_2_20260818";

for (const f of [dashboardFile, indexFile]) {
  if (!fs.existsSync(f)) throw new Error(`v7.79.2 missing ${f}`);
}

let js = fs.readFileSync(dashboardFile, "utf8");

if (!js.includes(MARK)) {
  js += `

/* ${MARK} */
(() => {
  "use strict";

  const style = document.createElement("style");
  style.textContent = \`
    .manual-expense-modal{
      padding:14px!important;
      align-items:center!important;
      background:rgba(20,20,22,.30)!important;
      backdrop-filter:blur(12px);
    }
    .manual-expense-card.simple7792{
      width:min(900px,calc(100vw - 28px))!important;
      max-height:calc(100vh - 28px)!important;
      border-radius:22px!important;
      background:#f7f7f8!important;
      overflow:hidden!important;
      display:flex;
      flex-direction:column;
      box-shadow:0 28px 80px rgba(0,0,0,.20);
    }
    .simple7792-header{
      flex:0 0 auto;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:18px;
      padding:18px 20px;
      background:rgba(255,255,255,.97);
      border-bottom:1px solid #e7e7ea;
      backdrop-filter:blur(18px);
      z-index:5;
    }
    .simple7792-title small{display:block;font-size:9px;letter-spacing:.09em;color:#8e8e93;margin-bottom:3px}
    .simple7792-title h3{margin:0;font-size:22px;letter-spacing:-.025em;color:#111}
    .simple7792-title p{margin:3px 0 0;font-size:10px;color:#777}
    .simple7792-head-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
    .simple7792-head-actions .btn{min-width:86px}
    .simple7792-close{width:34px;height:34px;border:0;border-radius:50%;background:#f2f2f7;font-size:19px;cursor:pointer}
    .simple7792-scroll{overflow:auto;padding:14px 16px 20px}
    .simple7792-section{
      background:#fff;
      border:1px solid #e5e5e7;
      border-radius:16px;
      margin-bottom:11px;
      overflow:hidden;
    }
    .simple7792-section-head{
      padding:12px 15px 10px;
      border-bottom:1px solid #efeff1;
    }
    .simple7792-section-head b{font-size:12px;color:#1d1d1f}
    .simple7792-section-head span{font-size:9px;color:#8e8e93;margin-left:6px}
    .simple7792-grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:11px;
      padding:14px 15px 15px;
    }
    .simple7792-grid.three{grid-template-columns:1.25fr .8fr .8fr}
    .simple7792-field.full{grid-column:1/-1}
    .simple7792-field label{
      display:block;
      font-size:10px;
      font-weight:600;
      color:#555;
      margin:0 0 6px;
    }
    .simple7792-field label em{font-style:normal;color:#ff3b30}
    .simple7792-field input,
    .simple7792-field select,
    .simple7792-field textarea{
      width:100%;
      min-height:40px;
      border:1px solid #d7d7dc;
      border-radius:10px;
      padding:9px 10px;
      background:#fff;
      font:inherit;
      font-size:12px;
      outline:none;
    }
    .simple7792-field textarea{min-height:66px;resize:vertical}
    .simple7792-field input:focus,
    .simple7792-field select:focus,
    .simple7792-field textarea:focus{
      border-color:#111;
      box-shadow:0 0 0 3px rgba(0,0,0,.045);
    }
    .simple7792-money{
      display:grid;
      grid-template-columns:1.5fr 1fr;
      gap:13px;
      padding:14px 15px 15px;
      align-items:stretch;
    }
    .simple7792-money-left{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .simple7792-money-left .full{grid-column:1/-1}
    .simple7792-taxline{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .simple7792-check{
      display:flex;
      align-items:center;
      gap:6px;
      font-size:10px;
      color:#555;
      cursor:pointer;
    }
    .simple7792-check input{width:auto}
    .simple7792-total{
      background:#f5f5f7;
      border-radius:13px;
      padding:13px 14px;
      display:flex;
      flex-direction:column;
      justify-content:center;
    }
    .simple7792-total-row{display:flex;justify-content:space-between;gap:10px;font-size:10px;color:#777;margin:3px 0}
    .simple7792-total-row.final{padding-top:8px;margin-top:7px;border-top:1px solid #ddd;color:#111;align-items:end}
    .simple7792-total-row.final strong{font-size:24px;letter-spacing:-.03em}
    .simple7792-status{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
    }
    .simple7792-choice{
      border:1px solid #ddd;
      border-radius:11px;
      padding:10px 11px;
      display:flex;
      gap:8px;
      align-items:flex-start;
      cursor:pointer;
    }
    .simple7792-choice.active{border-color:#111;background:#f7f7f8}
    .simple7792-choice input{margin-top:2px}
    .simple7792-choice b{display:block;font-size:11px}
    .simple7792-choice small{display:block;font-size:9px;color:#888;margin-top:2px}
    .simple7792-hint{
      margin:0 15px 14px;
      padding:9px 11px;
      border-radius:10px;
      background:#f5f5f7;
      color:#777;
      font-size:9px;
    }
    .manual-expense-toast{
      position:fixed;
      right:22px;
      bottom:22px;
      z-index:100005;
      background:#111;
      color:#fff;
      border-radius:12px;
      padding:11px 14px;
      font-size:11px;
      box-shadow:0 14px 38px rgba(0,0,0,.24);
    }
    @media(max-width:760px){
      .manual-expense-modal{padding:0!important;align-items:flex-end!important}
      .manual-expense-card.simple7792{
        width:100%!important;
        max-height:96vh!important;
        border-radius:22px 22px 0 0!important;
      }
      .simple7792-header{padding:14px 13px}
      .simple7792-title p{display:none}
      .simple7792-head-actions .cancel-text{display:none}
      .simple7792-head-actions .btn{min-width:96px}
      .simple7792-scroll{padding:10px}
      .simple7792-grid,.simple7792-grid.three,.simple7792-money{grid-template-columns:1fr}
      .simple7792-money-left{grid-template-columns:1fr}
      .simple7792-money-left .full{grid-column:auto}
    }
  \`;
  document.head.appendChild(style);

  const money = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits:2, maximumFractionDigits:2 });
  const num = (id) => Math.max(0, Number(document.getElementById(id)?.value || 0));
  const today = () => {
    const d = new Date(), p = (v) => String(v).padStart(2,"0");
    return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
  };

  function categoryOptions() {
    const vals = [...new Set(Array.from(document.getElementById("fCat")?.options || [])
      .map(o => String(o.value || o.textContent || "").trim()).filter(Boolean))];
    const list = vals.length ? vals : ["ค่าบริการ & จ้างงาน","ค่าเดินทาง","ค่าอาหาร","ค่าอุปกรณ์สำนักงาน","ค่าสาธารณูปโภค","ค่าโฆษณา","อื่น ๆ"];
    return list.map(v => '<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
  }

  function calculate() {
    const base = num("s7792amount");
    const vat = document.getElementById("s7792vat")?.checked ? base * .07 : 0;
    const beforeWht = base + vat;
    const wht = beforeWht * (num("s7792wht") / 100);
    const net = Math.max(0, beforeWht - wht);
    [["s7792base",base],["s7792vatv",vat],["s7792whtv",wht],["s7792net",net]].forEach(([id,v])=>{
      const el=document.getElementById(id); if(el) el.textContent=money(v);
    });
    return { base, vat, wht, net };
  }

  function renderSimpleModal() {
    const modal = document.getElementById("manualExpenseModal");
    if (!modal) return;

    modal.innerHTML = \`
      <div class="manual-expense-card simple7792" role="dialog" aria-modal="true">
        <form id="s7792form" style="display:contents">
          <header class="simple7792-header">
            <div class="simple7792-title">
              <small>EXPENSE ENTRY</small>
              <h3>บันทึกรายจ่าย</h3>
              <p>กรอกเฉพาะข้อมูลที่จำเป็น รายละเอียดบัญชีที่เหลือระบบจัดให้</p>
            </div>
            <div class="simple7792-head-actions">
              <button class="btn cancel-text" type="button" id="s7792cancel">ยกเลิก</button>
              <button class="btn solid" type="submit" id="s7792save">บันทึกรายจ่าย</button>
              <button class="simple7792-close" type="button" id="s7792close" aria-label="ปิด">×</button>
            </div>
          </header>

          <div class="simple7792-scroll">
            <section class="simple7792-section">
              <div class="simple7792-section-head"><b>ข้อมูลหลัก</b><span>ร้านค้า วันที่ และหมวดรายจ่าย</span></div>
              <div class="simple7792-grid three">
                <div class="simple7792-field">
                  <label>ร้านค้า / ผู้รับเงิน <em>*</em></label>
                  <input id="s7792vendor" maxlength="180" placeholder="เช่น บริษัท ABC จำกัด" required>
                </div>
                <div class="simple7792-field">
                  <label>วันที่รายการ <em>*</em></label>
                  <input id="s7792date" type="date" required>
                </div>
                <div class="simple7792-field">
                  <label>หมวดรายจ่าย</label>
                  <select id="s7792cat">\${categoryOptions()}</select>
                </div>
                <div class="simple7792-field">
                  <label>ประเภทเอกสาร</label>
                  <select id="s7792doctype">
                    <option>บันทึกเอง</option>
                    <option>ใบเสร็จรับเงิน</option>
                    <option>ใบกำกับภาษี</option>
                    <option>ใบแจ้งหนี้</option>
                    <option>สลิปโอนเงิน</option>
                    <option>เอกสารอื่น</option>
                  </select>
                </div>
                <div class="simple7792-field">
                  <label>ผู้เบิก / ผู้จ่าย</label>
                  <input id="s7792payer" maxlength="180" placeholder="ชื่อผู้เบิกหรือผู้จ่าย">
                </div>
                <div class="simple7792-field">
                  <label>เลขรายการ</label>
                  <input value="ระบบสร้างให้อัตโนมัติ" disabled>
                </div>
              </div>
            </section>

            <section class="simple7792-section">
              <div class="simple7792-section-head"><b>ยอดเงิน</b><span>ใส่ยอดก่อน VAT ระบบคำนวณยอดสุทธิให้</span></div>
              <div class="simple7792-money">
                <div class="simple7792-money-left">
                  <div class="simple7792-field full">
                    <label>รายการ / รายละเอียด</label>
                    <input id="s7792item" maxlength="250" placeholder="เช่น ค่าอาหารประชุม / ค่าโฆษณาเดือนสิงหาคม">
                  </div>
                  <div class="simple7792-field">
                    <label>ยอดก่อน VAT <em>*</em></label>
                    <input id="s7792amount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" required>
                  </div>
                  <div class="simple7792-field">
                    <label>หัก ณ ที่จ่าย</label>
                    <select id="s7792wht">
                      <option value="0">ไม่มี</option>
                      <option value="1">1%</option>
                      <option value="2">2%</option>
                      <option value="3">3%</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                    </select>
                  </div>
                  <div class="simple7792-taxline full">
                    <label class="simple7792-check"><input id="s7792vat" type="checkbox"> มี VAT 7%</label>
                  </div>
                </div>
                <div class="simple7792-total">
                  <div class="simple7792-total-row"><span>ก่อน VAT</span><b>฿<span id="s7792base">0.00</span></b></div>
                  <div class="simple7792-total-row"><span>VAT</span><b>+฿<span id="s7792vatv">0.00</span></b></div>
                  <div class="simple7792-total-row"><span>หัก ณ ที่จ่าย</span><b>-฿<span id="s7792whtv">0.00</span></b></div>
                  <div class="simple7792-total-row final"><span>ยอดจ่ายสุทธิ</span><strong>฿<span id="s7792net">0.00</span></strong></div>
                </div>
              </div>
              <div class="simple7792-hint">บันทึกเอง 1 รายการ = ใช้โควตารายการ 1 รายการ · ไม่ใช้โควตา AI</div>
            </section>

            <section class="simple7792-section">
              <div class="simple7792-section-head"><b>การชำระเงิน</b><span>เลือกสถานะก่อนบันทึก</span></div>
              <div class="simple7792-grid">
                <div class="simple7792-status full">
                  <label class="simple7792-choice active" id="s7792paidbox">
                    <input type="radio" name="s7792state" value="paid" checked>
                    <span><b>จ่ายแล้ว</b><small>นับเป็นเงินออกจริง</small></span>
                  </label>
                  <label class="simple7792-choice" id="s7792pendingbox">
                    <input type="radio" name="s7792state" value="pending">
                    <span><b>ยังไม่จ่าย</b><small>เก็บไว้เป็นรายการรอจ่าย</small></span>
                  </label>
                </div>
                <div class="simple7792-field">
                  <label>จ่ายจาก / ช่องทางการเงิน</label>
                  <input id="s7792payment" maxlength="180" placeholder="เช่น KBank • 1234 / เงินสด">
                </div>
                <div class="simple7792-field">
                  <label>วันที่ชำระ</label>
                  <input id="s7792paiddate" type="date">
                </div>
              </div>
            </section>

            <section class="simple7792-section">
              <div class="simple7792-section-head"><b>ข้อมูลเพิ่มเติม</b><span>ไม่บังคับ</span></div>
              <div class="simple7792-grid">
                <div class="simple7792-field full">
                  <label>หมายเหตุ</label>
                  <textarea id="s7792note" maxlength="500" placeholder="รายละเอียดเพิ่มเติมสำหรับฝ่ายบัญชี"></textarea>
                </div>
                <div class="simple7792-field full">
                  <label>ลิงก์หลักฐาน / เอกสาร</label>
                  <input id="s7792evidence" type="url" placeholder="วางลิงก์ Google Drive หรือเอกสารที่เกี่ยวข้อง">
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>
    \`;

    document.getElementById("s7792date").value = today();
    document.getElementById("s7792paiddate").value = today();
    document.getElementById("s7792payer").value = (document.getElementById("whoName")?.textContent || "").trim();

    ["s7792amount","s7792wht"].forEach(id => document.getElementById(id)?.addEventListener("input", calculate));
    document.getElementById("s7792vat")?.addEventListener("change", calculate);

    document.querySelectorAll('input[name="s7792state"]').forEach(r => r.addEventListener("change", () => {
      const paid = document.querySelector('input[name="s7792state"]:checked')?.value === "paid";
      document.getElementById("s7792paidbox")?.classList.toggle("active", paid);
      document.getElementById("s7792pendingbox")?.classList.toggle("active", !paid);
      document.getElementById("s7792paiddate").disabled = !paid;
    }));

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden","true");
    };
    document.getElementById("s7792close").onclick = close;
    document.getElementById("s7792cancel").onclick = close;

    document.getElementById("s7792form").addEventListener("submit", async (e) => {
      e.preventDefault();

      const vendor = document.getElementById("s7792vendor").value.trim();
      const totals = calculate();
      if (!vendor) { alert("กรุณากรอกร้านค้า / ผู้รับเงิน"); return; }
      if (!(totals.base > 0)) { alert("กรุณากรอกยอดเงินให้มากกว่า 0 บาท"); return; }

      const save = document.getElementById("s7792save");
      save.disabled = true;
      save.textContent = "กำลังบันทึก…";

      const payload = {
        date: document.getElementById("s7792date").value,
        vendor,
        category: document.getElementById("s7792cat").value,
        payerName: document.getElementById("s7792payer").value.trim(),
        itemName: document.getElementById("s7792item").value.trim(),
        qty: 1,
        unitPrice: totals.base,
        discount: 0,
        amount: totals.net,
        vat: document.getElementById("s7792vat").checked,
        whtRate: Number(document.getElementById("s7792wht").value || 0),
        paid: document.querySelector('input[name="s7792state"]:checked')?.value === "paid",
        paymentMethod: document.getElementById("s7792payment").value.trim(),
        docType: document.getElementById("s7792doctype").value,
        note: document.getElementById("s7792note").value.trim(),
        attachmentUrls: [document.getElementById("s7792evidence").value.trim()].filter(Boolean)
      };

      try {
        let res = await fetch(apiUrl("/api/expenses/manual"), {
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify(payload)
        });
        let data = await res.json().catch(() => ({}));

        if (res.status === 409 && data.error === "possible_duplicate") {
          if (!confirm("พบรายการที่คล้ายกันมาก ต้องการบันทึกซ้ำหรือไม่?")) {
            save.disabled = false;
            save.textContent = "บันทึกรายจ่าย";
            return;
          }
          res = await fetch(apiUrl("/api/expenses/manual"), {
            method:"POST",
            headers:{"content-type":"application/json"},
            body:JSON.stringify({...payload, forceDuplicate:true})
          });
          data = await res.json().catch(() => ({}));
        }

        if (!res.ok || data.ok !== true) throw new Error(data.message || data.error || "บันทึกไม่สำเร็จ");

        close();
        if (typeof EXPENSE_PAGE !== "undefined") EXPENSE_PAGE = 1;
        await Promise.all([
          typeof refreshData === "function" ? refreshData({manual:true}) : Promise.resolve(),
          typeof refreshSubscription === "function" ? refreshSubscription({quiet:true}) : Promise.resolve()
        ]);

        const toast = document.createElement("div");
        toast.className = "manual-expense-toast";
        toast.textContent = "บันทึกรายจ่ายเรียบร้อย";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
      } catch (err) {
        alert(err?.message || "บันทึกรายจ่ายไม่สำเร็จ");
      } finally {
        save.disabled = false;
        save.textContent = "บันทึกรายจ่าย";
      }
    });

    calculate();
  }

  function hook() {
    const modal = document.getElementById("manualExpenseModal");
    const oldButton = document.getElementById("manualExpenseCreate");
    if (!modal || !oldButton) return;

    const button = oldButton.cloneNode(true);
    oldButton.replaceWith(button);

    button.addEventListener("click", () => {
      renderSimpleModal();
      modal.classList.add("show");
      modal.setAttribute("aria-hidden","false");
      setTimeout(() => document.getElementById("s7792vendor")?.focus(), 50);
    });

    modal.addEventListener("click", e => {
      if (e.target === modal) {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden","true");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(hook,180));
  } else {
    setTimeout(hook,180);
  }

  console.info("${MARK}");
})();`;
}

fs.writeFileSync(dashboardFile, js);
execFileSync(process.execPath, ["--check", dashboardFile], {stdio:"inherit"});

let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, "./assets/dashboard.js?v=7.79.2.20260818");
fs.writeFileSync(indexFile, html);

if (!js.includes(MARK) || js.includes('id="p779qty" type="number" min=".0001" step=".01"')) {
  throw new Error("v7.79.2 audit failed");
}
console.log(`✅ ${MARK} ready`);
console.log("✅ Removed invalid quantity step");
console.log("✅ Save button stays visible in the header");
console.log("✅ Simplified expense entry to 4 compact sections");
