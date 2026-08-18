import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const indexFile = path.join(root, "index.html");
const dashboardFile = path.join(root, "assets", "dashboard.js");
const MARK = "MANUAL_EXPENSE_UI_V7_78_20260818";

for (const f of [indexFile, dashboardFile]) if (!fs.existsSync(f)) throw new Error(`v7.78 missing ${f}`);

let html = fs.readFileSync(indexFile, "utf8");

if (!html.includes('id="manualExpenseCreate"')) {
  const oldHead = `      <div class="expense-page-head">
        <div>
          <div class="head-kicker">EXPENSE REGISTER</div>
          <h3>ทะเบียนรายจ่าย</h3>
          <p>ดูรายจ่ายเป็นตารางเดียว ค้นหา กรอง และเปิดเอกสารได้จากแถวเดียวกัน</p>
        </div>
      </div>`;
  const newHead = `      <div class="expense-page-head">
        <div>
          <div class="head-kicker">EXPENSE REGISTER</div>
          <h3>ทะเบียนรายจ่าย</h3>
          <p>ดูรายจ่ายเป็นตารางเดียว ค้นหา กรอง และเปิดเอกสารได้จากแถวเดียวกัน</p>
        </div>
        <div class="manual-expense-head-actions">
          <button class="btn solid" id="manualExpenseCreate" type="button">+ บันทึกรายจ่าย</button>
        </div>
      </div>`;
  if (!html.includes(oldHead)) throw new Error("v7.78 expense head anchor missing");
  html = html.replace(oldHead, newHead);
}

if (!html.includes('id="manualExpenseModal"')) {
  const anchor = `    <!-- INCOME / ACCOUNTS RECEIVABLE -->`;
  if (!html.includes(anchor)) throw new Error("v7.78 modal anchor missing");
  const modal = `    <div class="manual-expense-modal" id="manualExpenseModal" aria-hidden="true">
      <div class="manual-expense-card" role="dialog" aria-modal="true" aria-labelledby="manualExpenseTitle">
        <div class="manual-expense-modal-head">
          <div><span>MANUAL ENTRY</span><h3 id="manualExpenseTitle">บันทึกรายจ่าย</h3><p>กรอกเองไม่ใช้ AI และนับเป็น 1 รายการในโควตารายเดือน</p></div>
          <button type="button" class="manual-expense-close" id="manualExpenseClose" aria-label="ปิด">×</button>
        </div>
        <form id="manualExpenseForm" class="manual-expense-form">
          <div><label>วันที่รายการ *</label><input id="manualExpenseDate" type="date" required></div>
          <div><label>ยอดเงิน *</label><input id="manualExpenseAmount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" required></div>
          <div class="full"><label>ร้านค้า / ผู้รับเงิน *</label><input id="manualExpenseVendor" maxlength="180" placeholder="เช่น บริษัท ABC จำกัด / ร้านค้า" required></div>
          <div><label>หมวดรายจ่าย</label><select id="manualExpenseCategory"></select></div>
          <div><label>ผู้เบิก / ผู้จ่าย</label><input id="manualExpensePayer" maxlength="180" placeholder="ชื่อผู้จ่ายหรือผู้เบิก"></div>
          <div class="full"><label>รายละเอียด</label><textarea id="manualExpenseNote" maxlength="500" placeholder="รายละเอียดเพิ่มเติม"></textarea></div>
          <div><label>หัก ณ ที่จ่าย %</label><select id="manualExpenseWht"><option value="0">ไม่มี</option><option value="1">1%</option><option value="2">2%</option><option value="3">3%</option><option value="5">5%</option><option value="10">10%</option></select></div>
          <div class="manual-expense-checks"><label><input id="manualExpenseVat" type="checkbox"> มี VAT</label><label><input id="manualExpensePaid" type="checkbox" checked> จ่ายแล้ว</label></div>
          <div class="manual-expense-info full"><b>โควตา:</b> ใช้ 1 รายการ · <b>AI:</b> ไม่ใช้โควตา AI</div>
          <div class="manual-expense-actions full"><button class="btn" id="manualExpenseCancel" type="button">ยกเลิก</button><button class="btn solid" type="submit">บันทึกรายจ่าย</button></div>
        </form>
      </div>
    </div>

${anchor}`;
  html = html.replace(anchor, modal);
}

html = html.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, "./assets/dashboard.js?v=7.78.20260818");
fs.writeFileSync(indexFile, html);

let js = fs.readFileSync(dashboardFile, "utf8");

if (!js.includes(MARK)) {
  js += `

/* ${MARK} */
(() => {
  "use strict";

  const style=document.createElement("style");
  style.textContent=\`
    .expense-page-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end}
    .manual-expense-head-actions{display:flex;gap:8px;flex-shrink:0}
    .manual-expense-modal{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.28);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:20px}
    .manual-expense-modal.show{display:flex}
    .manual-expense-card{width:min(720px,100%);max-height:min(780px,calc(100vh - 32px));overflow:auto;background:#fff;border:1px solid #e5e5e7;border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.20)}
    .manual-expense-modal-head{position:sticky;top:0;z-index:2;background:rgba(255,255,255,.96);backdrop-filter:blur(16px);padding:22px 24px 17px;border-bottom:1px solid #ededf0;display:flex;justify-content:space-between;gap:16px}
    .manual-expense-modal-head span{font-size:10px;letter-spacing:.08em;color:#8e8e93}.manual-expense-modal-head h3{margin:3px 0 3px;font-size:22px}.manual-expense-modal-head p{margin:0;color:#6e6e73;font-size:12px}
    .manual-expense-close{width:36px;height:36px;border:0;border-radius:50%;background:#f2f2f7;font-size:22px;cursor:pointer}
    .manual-expense-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:22px 24px 24px}
    .manual-expense-form .full{grid-column:1/-1}.manual-expense-form label{display:block;font-size:11px;font-weight:600;margin:0 0 6px;color:#3a3a3c}
    .manual-expense-form input,.manual-expense-form select,.manual-expense-form textarea{width:100%;border:1px solid #d8d8dc;border-radius:11px;background:#fff;padding:10px 11px;font:inherit;font-size:13px;outline:none}
    .manual-expense-form textarea{min-height:82px;resize:vertical}
    .manual-expense-checks{display:flex;gap:18px;align-items:center;padding-top:22px}.manual-expense-checks label{display:flex;align-items:center;gap:7px;margin:0;font-weight:500}.manual-expense-checks input{width:auto}
    .manual-expense-info{font-size:11px;color:#6e6e73;background:#f5f5f7;border-radius:12px;padding:11px 13px}
    .manual-expense-actions{display:flex;justify-content:flex-end;gap:8px}.manual-expense-toast{position:fixed;z-index:100001;right:24px;bottom:24px;background:#111;color:#fff;border-radius:13px;padding:12px 16px;font-size:12px;box-shadow:0 14px 40px rgba(0,0,0,.25)}
    @media(max-width:700px){.expense-page-head{align-items:flex-start;flex-direction:column}.manual-expense-head-actions,.manual-expense-head-actions button{width:100%}.manual-expense-modal{padding:8px;align-items:flex-end}.manual-expense-card{max-height:92vh;border-radius:22px 22px 12px 12px}.manual-expense-form{grid-template-columns:1fr;padding:18px}.manual-expense-form .full{grid-column:auto}.manual-expense-checks{padding-top:2px}.manual-expense-actions{flex-direction:column-reverse}.manual-expense-actions button{width:100%}}
  \`;
  document.head.appendChild(style);

  const modal=document.getElementById("manualExpenseModal");
  const form=document.getElementById("manualExpenseForm");

  function todayV778(){
    const d=new Date(),pad=n=>String(n).padStart(2,"0");
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  }
  function toastV778(text){
    document.querySelector(".manual-expense-toast")?.remove();
    const n=document.createElement("div");n.className="manual-expense-toast";n.textContent=text;document.body.appendChild(n);
    setTimeout(()=>n.remove(),3200);
  }
  function syncCategoriesV778(){
    const target=document.getElementById("manualExpenseCategory");if(!target)return;
    const source=document.getElementById("fCat");
    const values=[...new Set(Array.from(source?.options||[]).map(o=>String(o.value||o.textContent||"").trim()).filter(Boolean))];
    const fallback=["ค่าบริการ & จ้างงาน","ค่าเดินทาง","ค่าอาหาร","ค่าอุปกรณ์สำนักงาน","ค่าสาธารณูปโภค","ค่าโฆษณา","อื่น ๆ"];
    const list=values.length?values:fallback;
    target.innerHTML=list.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
    target.value=list.includes("อื่น ๆ")?"อื่น ๆ":list[0]||"";
  }
  function openV778(){
    syncCategoriesV778();
    document.getElementById("manualExpenseDate").value=todayV778();
    document.getElementById("manualExpenseAmount").value="";
    document.getElementById("manualExpenseVendor").value="";
    document.getElementById("manualExpenseNote").value="";
    document.getElementById("manualExpenseWht").value="0";
    document.getElementById("manualExpenseVat").checked=false;
    document.getElementById("manualExpensePaid").checked=true;
    const payer=document.getElementById("manualExpensePayer");
    if(payer&&!payer.value)payer.value=(document.getElementById("whoName")?.textContent||"").trim();
    modal?.classList.add("show");modal?.setAttribute("aria-hidden","false");
    setTimeout(()=>document.getElementById("manualExpenseVendor")?.focus(),80);
  }
  function closeV778(){modal?.classList.remove("show");modal?.setAttribute("aria-hidden","true");}

  async function saveV778(payload,forceDuplicate=false){
    const res=await fetch(apiUrl("/api/expenses/manual"),{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({...payload,forceDuplicate}),
    });
    const data=await res.json().catch(()=>({}));
    if(res.status===409&&data.error==="possible_duplicate"&&!forceDuplicate){
      const m=data.duplicate?.matches?.[0];
      const detail=m?("\\n\\nคล้ายกับ: "+(m.vendor||"รายการเดิม")+" · "+Number(m.amount||0).toLocaleString("th-TH")+" บาท · "+(m.date||"")):"";
      if(confirm("พบรายการที่คล้ายกันมาก"+detail+"\\n\\nต้องการบันทึกซ้ำจริงหรือไม่?")) return saveV778(payload,true);
      return {cancelled:true};
    }
    if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||("HTTP "+res.status));
    return data;
  }

  document.getElementById("manualExpenseCreate")?.addEventListener("click",openV778);
  document.getElementById("manualExpenseClose")?.addEventListener("click",closeV778);
  document.getElementById("manualExpenseCancel")?.addEventListener("click",closeV778);
  modal?.addEventListener("click",e=>{if(e.target===modal)closeV778();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal?.classList.contains("show"))closeV778();});

  form?.addEventListener("submit",async e=>{
    e.preventDefault();
    const submit=form.querySelector('button[type="submit"]');
    const payload={
      date:document.getElementById("manualExpenseDate").value,
      amount:Number(document.getElementById("manualExpenseAmount").value||0),
      vendor:document.getElementById("manualExpenseVendor").value.trim(),
      category:document.getElementById("manualExpenseCategory").value,
      payerName:document.getElementById("manualExpensePayer").value.trim(),
      note:document.getElementById("manualExpenseNote").value.trim(),
      whtRate:Number(document.getElementById("manualExpenseWht").value||0),
      vat:document.getElementById("manualExpenseVat").checked,
      paid:document.getElementById("manualExpensePaid").checked,
    };
    if(!payload.date||!payload.vendor||!(payload.amount>0)){alert("กรุณากรอกวันที่ ร้านค้า และยอดเงินให้ครบ");return;}
    if(submit){submit.disabled=true;submit.textContent="กำลังบันทึก…";}
    try{
      const out=await saveV778(payload,false);
      if(out?.cancelled)return;
      closeV778();
      EXPENSE_PAGE=1;
      await Promise.all([
        refreshData({manual:true}),
        typeof refreshSubscription==="function"?refreshSubscription({quiet:true}):Promise.resolve(true),
      ]);
      toastV778("บันทึกรายจ่ายแล้ว · ใช้โควตารายการ 1 รายการ");
    }catch(err){alert(err?.message||"บันทึกรายจ่ายไม่สำเร็จ");}
    finally{if(submit){submit.disabled=false;submit.textContent="บันทึกรายจ่าย";}}
  });

  console.info("${MARK}");
})();`;
}

fs.writeFileSync(dashboardFile, js);
execFileSync(process.execPath, ["--check", dashboardFile], { stdio:"inherit" });

if (!html.includes('id="manualExpenseCreate"') || !html.includes('id="manualExpenseModal"') || !js.includes(MARK)) throw new Error("v7.78 dashboard audit failed");

console.log(`✅ ${MARK} ready`);
console.log("✅ Manual expense button + modal");
console.log("✅ Save to /api/expenses/manual");
console.log("✅ Quota and duplicate UX");
