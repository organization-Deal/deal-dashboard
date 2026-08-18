import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const file=path.join(process.cwd(),"assets","dashboard.js");
const indexFile=path.join(process.cwd(),"index.html");
const MARK="PRO_MANUAL_EXPENSE_UI_V7_79_20260818";
if(!fs.existsSync(file)) throw new Error("v7.79 missing dashboard.js");
let js=fs.readFileSync(file,"utf8");

if(!js.includes(MARK)){
js+=`

/* ${MARK} */
(() => {
"use strict";

const style=document.createElement("style");
style.textContent=\`
.manual-expense-modal{padding:10px!important;align-items:center!important;background:rgba(17,17,17,.32)!important;backdrop-filter:blur(12px)}
.manual-expense-card.pro779{width:min(1080px,calc(100vw - 24px))!important;max-height:calc(100vh - 20px)!important;border-radius:22px!important;background:#f6f6f7!important;overflow:hidden!important;display:flex;flex-direction:column}
.pro779 .manual-expense-modal-head{background:rgba(255,255,255,.96)!important;padding:18px 22px!important}
.pro779-body{overflow:auto;padding:16px 18px 94px}
.pro779-section{background:#fff;border:1px solid #e5e5e7;border-radius:16px;margin-bottom:12px;overflow:hidden}
.pro779-head{padding:13px 16px;border-bottom:1px solid #ededf0;display:flex;gap:9px;align-items:center}
.pro779-head i{width:27px;height:27px;border-radius:8px;background:#f2f2f7;display:grid;place-items:center;font-style:normal;color:#555}
.pro779-head b{font-size:13px}.pro779-head small{display:block;color:#8e8e93;font-size:10px;margin-top:2px}
.pro779-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;padding:15px}.pro779-grid.two{grid-template-columns:repeat(2,1fr)}
.pro779-field.full{grid-column:1/-1}.pro779-field label{display:block;font-size:10px;font-weight:600;color:#555;margin-bottom:6px}
.pro779-field input,.pro779-field select,.pro779-field textarea{width:100%;min-height:40px;border:1px solid #d7d7dc;border-radius:10px;padding:9px 10px;font:inherit;font-size:12px;background:#fff;outline:none}
.pro779-field textarea{min-height:72px;resize:vertical}.pro779-field input:focus,.pro779-field select:focus,.pro779-field textarea:focus{border-color:#111;box-shadow:0 0 0 3px rgba(0,0,0,.045)}
.pro779-line{padding:15px;overflow:auto}.pro779-table{min-width:760px;width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e6e6e8;border-radius:12px;overflow:hidden}
.pro779-table th{padding:9px;background:#fafafa;color:#777;font-size:9px;text-align:left;border-bottom:1px solid #e7e7e9}.pro779-table td{padding:6px;border-right:1px solid #eee}.pro779-table td:last-child{border-right:0}
.pro779-table input,.pro779-table select{width:100%;border:0;outline:none;padding:7px;background:transparent;font:inherit;font-size:12px}
.pro779-summary{display:grid;grid-template-columns:1fr 320px;gap:16px;padding:0 15px 15px}.pro779-note{font-size:10px;color:#777;display:flex;align-items:center}
.pro779-total{background:#111;color:#fff;border-radius:13px;padding:13px 15px}.pro779-total div{display:flex;justify-content:space-between;font-size:10px;color:#bbb;margin-bottom:6px}.pro779-total div:last-child{padding-top:7px;border-top:1px solid rgba(255,255,255,.16);margin:0;color:#fff}.pro779-total strong{font-size:21px}
.pro779-status{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pro779-choice{border:1px solid #ddd;border-radius:11px;padding:11px;display:flex;gap:8px;cursor:pointer}.pro779-choice.active{border-color:#111;background:#f7f7f8}.pro779-choice b{font-size:11px}.pro779-choice small{display:block;font-size:9px;color:#888;margin-top:2px}
.pro779-evidence{border:1px dashed #bbb;border-radius:12px;padding:14px;background:#fafafa}.pro779-evidence b{display:block;font-size:11px}.pro779-evidence small{font-size:9px;color:#888}
.pro779-sticky{position:absolute;left:0;right:0;bottom:0;background:rgba(255,255,255,.97);backdrop-filter:blur(18px);border-top:1px solid #ddd;padding:12px 18px;display:flex;justify-content:space-between;align-items:center}.pro779-sticky small{color:#777}.pro779-actions{display:flex;gap:8px}.pro779-actions button{min-width:112px}
@media(max-width:760px){.manual-expense-card.pro779{width:100%!important;max-height:96vh!important;margin-top:auto;border-radius:22px 22px 0 0!important}.pro779-grid,.pro779-grid.two,.pro779-summary{grid-template-columns:1fr}.pro779-body{padding:12px 12px 92px}.pro779-sticky small{display:none}.pro779-actions{width:100%}.pro779-actions button{flex:1;min-width:0}}
\`;
document.head.appendChild(style);

const money=n=>Number(n||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
const n=id=>Math.max(0,Number(document.getElementById(id)?.value||0));
const today=()=>{const d=new Date(),p=x=>String(x).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())};
function cats(){
 const vals=[...new Set(Array.from(document.getElementById("fCat")?.options||[]).map(o=>String(o.value||o.textContent||"").trim()).filter(Boolean))];
 const list=vals.length?vals:["ค่าบริการ & จ้างงาน","ค่าเดินทาง","ค่าอาหาร","ค่าอุปกรณ์สำนักงาน","ค่าสาธารณูปโภค","ค่าโฆษณา","อื่น ๆ"];
 return list.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
}
function calc(){
 const qty=Math.max(.0001,n("p779qty")||1),unit=n("p779unit"),discount=n("p779discount");
 const base=Math.max(0,qty*unit-discount),vat=document.getElementById("p779vat")?.checked?base*.07:0;
 const totalBeforeWht=base+vat,wht=totalBeforeWht*(n("p779wht")/100),net=Math.max(0,totalBeforeWht-wht);
 [["p779base",base],["p779vatv",vat],["p779whtv",wht],["p779total",net]].forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=money(v)});
 return {qty,unit,discount,net};
}
function renderModal(){
 const modal=document.getElementById("manualExpenseModal");if(!modal)return;
 modal.innerHTML=\`
 <div class="manual-expense-card pro779">
  <div class="manual-expense-modal-head">
   <div><span>EXPENSE ENTRY</span><h3>บันทึกรายจ่าย</h3><p>ข้อมูลครบในรายการเดียว เพื่อให้ฝ่ายบัญชีตรวจและทำงานต่อได้ง่าย</p></div>
   <button type="button" class="manual-expense-close" id="p779close">×</button>
  </div>
  <form id="p779form" style="display:contents">
   <div class="pro779-body">
    <section class="pro779-section">
     <div class="pro779-head"><i>⌁</i><div><b>ข้อมูลเอกสาร</b><small>วันรายการ ประเภทเอกสาร และข้อมูลผู้ขาย</small></div></div>
     <div class="pro779-grid">
      <div class="pro779-field"><label>เลขรายการ</label><input value="สร้างอัตโนมัติหลังบันทึก" disabled></div>
      <div class="pro779-field"><label>วันที่รายการ *</label><input id="p779date" type="date" required></div>
      <div class="pro779-field"><label>ประเภทเอกสาร</label><select id="p779doctype"><option>บันทึกเอง</option><option>ใบเสร็จรับเงิน</option><option>ใบกำกับภาษี</option><option>ใบแจ้งหนี้</option><option>สลิปโอนเงิน</option><option>เอกสารอื่น</option></select></div>
      <div class="pro779-field"><label>ร้านค้า / ผู้รับเงิน *</label><input id="p779vendor" maxlength="180" placeholder="เช่น บริษัท ABC จำกัด" required></div>
      <div class="pro779-field"><label>หมวดรายจ่าย</label><select id="p779cat">${cats()}</select></div>
      <div class="pro779-field"><label>ผู้เบิก / ผู้จ่าย</label><input id="p779payer" maxlength="180" placeholder="ชื่อผู้เบิกหรือผู้จ่าย"></div>
     </div>
    </section>

    <section class="pro779-section">
     <div class="pro779-head"><i>≡</i><div><b>รายการและภาษี</b><small>คำนวณยอดสุทธิให้ทันที</small></div></div>
     <div class="pro779-line">
      <table class="pro779-table"><thead><tr><th style="width:34%">รายการ / รายละเอียด</th><th>จำนวน</th><th>ราคา/หน่วย</th><th>ส่วนลด</th><th>VAT</th><th>หัก ณ ที่จ่าย</th></tr></thead>
      <tbody><tr>
       <td><input id="p779item" maxlength="250" placeholder="เช่น ค่าโฆษณาเดือนสิงหาคม"></td>
       <td><input id="p779qty" type="number" min=".0001" step=".01" value="1"></td>
       <td><input id="p779unit" type="number" min="0" step=".01" placeholder="0.00"></td>
       <td><input id="p779discount" type="number" min="0" step=".01" value="0"></td>
       <td><label style="display:flex;align-items:center;gap:6px"><input id="p779vat" type="checkbox" style="width:auto"> 7%</label></td>
       <td><select id="p779wht"><option value="0">ไม่มี</option><option value="1">1%</option><option value="2">2%</option><option value="3">3%</option><option value="5">5%</option><option value="10">10%</option></select></td>
      </tr></tbody></table>
     </div>
     <div class="pro779-summary">
      <div class="pro779-note">บันทึกเอง 1 รายการ = ใช้โควตารายการ 1 · ไม่ใช้โควตา AI</div>
      <div class="pro779-total">
       <div><span>ก่อน VAT</span><b>฿<span id="p779base">0.00</span></b></div>
       <div><span>VAT</span><b>฿<span id="p779vatv">0.00</span></b></div>
       <div><span>หัก ณ ที่จ่าย</span><b>-฿<span id="p779whtv">0.00</span></b></div>
       <div><span>ยอดสุทธิ</span><strong>฿<span id="p779total">0.00</span></strong></div>
      </div>
     </div>
    </section>

    <section class="pro779-section">
     <div class="pro779-head"><i>฿</i><div><b>การชำระเงิน</b><small>แยกเงินออกจริงออกจากรายการที่ยังรอจ่าย</small></div></div>
     <div class="pro779-grid two">
      <div class="pro779-status full">
       <label class="pro779-choice active" id="p779paidbox"><input type="radio" name="p779state" value="paid" checked><span><b>จ่ายแล้ว</b><small>นับเป็นเงินออกจริง</small></span></label>
       <label class="pro779-choice" id="p779pendingbox"><input type="radio" name="p779state" value="pending"><span><b>ยังไม่จ่าย</b><small>เก็บเป็นรายการรอดำเนินการ</small></span></label>
      </div>
      <div class="pro779-field"><label>จ่ายจาก / ช่องทางการเงิน</label><input id="p779payment" maxlength="180" placeholder="เช่น KBank • 1234 / เงินสด"></div>
      <div class="pro779-field"><label>วันที่ชำระ</label><input id="p779paiddate" type="date"></div>
     </div>
    </section>

    <section class="pro779-section">
     <div class="pro779-head"><i>⌕</i><div><b>หมายเหตุและหลักฐาน</b><small>เก็บข้อมูลให้บัญชีย้อนตรวจได้</small></div></div>
     <div class="pro779-grid two">
      <div class="pro779-field full"><label>หมายเหตุ</label><textarea id="p779note" maxlength="500" placeholder="เช่น ค่าใช้จ่ายโครงการ / รอบบิล / เหตุผลในการจ่าย"></textarea></div>
      <div class="pro779-field full"><label>ลิงก์หลักฐาน / เอกสาร</label><input id="p779evidence" type="url" placeholder="วางลิงก์ Google Drive หรือเอกสารที่เกี่ยวข้อง"></div>
      <div class="pro779-evidence full"><b>หลักฐานจะถูกผูกกับรายการนี้</b><small>เวอร์ชันนี้รองรับการวางลิงก์ก่อน เพื่อไม่ทำให้ flow เดิมของ Drive/OCR พัง</small></div>
     </div>
    </section>
   </div>
   <div class="pro779-sticky"><small><b>บันทึกเอง</b> · ใช้ 1 รายการ · AI 0 ใบ</small><div class="pro779-actions"><button class="btn" type="button" id="p779cancel">ยกเลิก</button><button class="btn solid" type="submit" id="p779save">บันทึกรายจ่าย</button></div></div>
  </form>
 </div>\`;

 document.getElementById("p779date").value=today();
 document.getElementById("p779paiddate").value=today();
 document.getElementById("p779payer").value=(document.getElementById("whoName")?.textContent||"").trim();
 ["p779qty","p779unit","p779discount","p779wht"].forEach(id=>document.getElementById(id)?.addEventListener("input",calc));
 document.getElementById("p779vat")?.addEventListener("change",calc);
 document.querySelectorAll('input[name="p779state"]').forEach(r=>r.addEventListener("change",()=>{
  const paid=document.querySelector('input[name="p779state"]:checked')?.value==="paid";
  document.getElementById("p779paidbox").classList.toggle("active",paid);
  document.getElementById("p779pendingbox").classList.toggle("active",!paid);
  document.getElementById("p779paiddate").disabled=!paid;
 }));
 const close=()=>modal.classList.remove("show");
 document.getElementById("p779close").onclick=close;document.getElementById("p779cancel").onclick=close;

 document.getElementById("p779form").addEventListener("submit",async e=>{
  e.preventDefault();const c=calc(),vendor=document.getElementById("p779vendor").value.trim();
  if(!vendor){alert("กรุณากรอกร้านค้า / ผู้รับเงิน");return} if(!(c.net>0)){alert("กรุณากรอกราคาให้มากกว่า 0 บาท");return}
  const btn=document.getElementById("p779save");btn.disabled=true;btn.textContent="กำลังบันทึก…";
  const payload={date:document.getElementById("p779date").value,vendor,category:document.getElementById("p779cat").value,payerName:document.getElementById("p779payer").value.trim(),itemName:document.getElementById("p779item").value.trim(),qty:c.qty,unitPrice:c.unit,discount:c.discount,amount:c.net,vat:document.getElementById("p779vat").checked,whtRate:Number(document.getElementById("p779wht").value||0),paid:document.querySelector('input[name="p779state"]:checked')?.value==="paid",paymentMethod:document.getElementById("p779payment").value.trim(),docType:document.getElementById("p779doctype").value,note:document.getElementById("p779note").value.trim(),attachmentUrls:[document.getElementById("p779evidence").value.trim()].filter(Boolean)};
  try{
   let res=await fetch(apiUrl("/api/expenses/manual"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
   let data=await res.json().catch(()=>({}));
   if(res.status===409&&data.error==="possible_duplicate"&&confirm("พบรายการที่คล้ายกันมาก ต้องการบันทึกซ้ำหรือไม่?")){
    res=await fetch(apiUrl("/api/expenses/manual"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...payload,forceDuplicate:true})});
    data=await res.json().catch(()=>({}));
   }
   if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||"บันทึกไม่สำเร็จ");
   close();if(typeof EXPENSE_PAGE!=="undefined")EXPENSE_PAGE=1;
   await Promise.all([typeof refreshData==="function"?refreshData({manual:true}):Promise.resolve(),typeof refreshSubscription==="function"?refreshSubscription({quiet:true}):Promise.resolve()]);
   const toast=document.createElement("div");toast.className="manual-expense-toast";toast.textContent="บันทึกรายจ่ายเรียบร้อย";document.body.appendChild(toast);setTimeout(()=>toast.remove(),2600);
  }catch(err){alert(err?.message||"บันทึกรายจ่ายไม่สำเร็จ")}finally{btn.disabled=false;btn.textContent="บันทึกรายจ่าย"}
 });
}

function hook(){
 const modal=document.getElementById("manualExpenseModal"),old=document.getElementById("manualExpenseCreate");if(!modal||!old)return;
 const fresh=old.cloneNode(true);old.replaceWith(fresh);
 fresh.addEventListener("click",()=>{renderModal();modal.classList.add("show");modal.setAttribute("aria-hidden","false");setTimeout(()=>document.getElementById("p779vendor")?.focus(),50)});
 modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("show")});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(hook,180));else setTimeout(hook,180);
console.info("${MARK}");
})();`;
}
fs.writeFileSync(file,js);
execFileSync(process.execPath,["--check",file],{stdio:"inherit"});

let html=fs.readFileSync(indexFile,"utf8");
html=html.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, "./assets/dashboard.js?v=7.79.20260818");
fs.writeFileSync(indexFile,html);
console.log(`✅ ${MARK}`);
