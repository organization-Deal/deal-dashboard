import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dashboardFile = path.join(process.cwd(), "assets", "dashboard.js");
const indexFile = path.join(process.cwd(), "index.html");
const MARK = "MANUAL_EXPENSE_PAYMENT_UI_V7_80_20260818";

for (const f of [dashboardFile, indexFile]) {
  if (!fs.existsSync(f)) throw new Error(`v7.80 missing ${f}`);
}

let js = fs.readFileSync(dashboardFile, "utf8");

if (!js.includes(MARK)) {
  js += `

/* ${MARK} */
(() => {
  "use strict";

  const style = document.createElement("style");
  style.textContent = \`
    .expense-state.waiting-payment{background:#fff4df!important;color:#8a5200!important;border-color:#f5d7a0!important}
    .manual-expense-row-actions{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
    .manual-expense-pay-btn{border:1px solid #111;background:#111;color:#fff;border-radius:9px;padding:7px 9px;font:inherit;font-size:10px;font-weight:650;cursor:pointer;white-space:nowrap}

    .manual800-card{
      width:min(860px,calc(100vw - 28px))!important;
      max-height:calc(100vh - 28px)!important;
      background:#f7f7f8!important;
      border-radius:22px!important;
      overflow:hidden!important;
      display:flex;
      flex-direction:column;
      box-shadow:0 28px 80px rgba(0,0,0,.20);
    }
    .manual800-header{
      position:relative;
      z-index:10;
      flex:0 0 auto;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:16px;
      padding:17px 19px;
      background:rgba(255,255,255,.97);
      border-bottom:1px solid #e5e5e7;
      backdrop-filter:blur(18px);
    }
    .manual800-title small{display:block;color:#8e8e93;font-size:9px;letter-spacing:.09em;margin-bottom:2px}
    .manual800-title h3{font-size:21px;margin:0;letter-spacing:-.025em}
    .manual800-title p{font-size:10px;color:#777;margin:3px 0 0}
    .manual800-actions{display:flex;align-items:center;gap:7px;flex-shrink:0}
    .manual800-actions button{min-height:38px;white-space:nowrap}
    .manual800-pending{border:1px solid #c9c9ce;background:#fff;color:#111;border-radius:10px;padding:9px 12px;font:inherit;font-size:11px;font-weight:650;cursor:pointer}
    .manual800-paid{border:1px solid #111;background:#111;color:#fff;border-radius:10px;padding:9px 12px;font:inherit;font-size:11px;font-weight:650;cursor:pointer}
    .manual800-close{width:34px;height:34px;border:0;border-radius:50%;background:#f2f2f7;font-size:19px;cursor:pointer}
    .manual800-scroll{overflow:auto;padding:13px 15px 18px}
    .manual800-section{background:#fff;border:1px solid #e5e5e7;border-radius:15px;margin-bottom:10px;overflow:hidden}
    .manual800-section-head{padding:11px 14px 9px;border-bottom:1px solid #efeff1}
    .manual800-section-head b{font-size:12px}.manual800-section-head span{font-size:9px;color:#8e8e93;margin-left:6px}
    .manual800-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:13px 14px 14px}
    .manual800-grid.three{grid-template-columns:1.3fr .85fr .85fr}
    .manual800-field.full{grid-column:1/-1}
    .manual800-field label{display:block;font-size:10px;font-weight:600;color:#555;margin-bottom:5px}
    .manual800-field label em{font-style:normal;color:#ff3b30}
    .manual800-field input,.manual800-field select,.manual800-field textarea{
      width:100%;min-height:39px;border:1px solid #d7d7dc;border-radius:10px;padding:8px 10px;background:#fff;font:inherit;font-size:12px;outline:none
    }
    .manual800-field textarea{min-height:62px;resize:vertical}
    .manual800-money{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;padding:13px 14px}
    .manual800-money-left{display:grid;grid-template-columns:1fr 1fr;gap:9px}.manual800-money-left .full{grid-column:1/-1}
    .manual800-check{display:flex;gap:6px;align-items:center;font-size:10px;color:#555}.manual800-check input{width:auto}
    .manual800-total{background:#f5f5f7;border-radius:12px;padding:12px 13px}
    .manual800-total-row{display:flex;justify-content:space-between;font-size:10px;color:#777;margin:3px 0}
    .manual800-total-row.final{border-top:1px solid #ddd;padding-top:7px;margin-top:7px;color:#111;align-items:end}
    .manual800-total-row.final strong{font-size:22px}
    .manual800-paybox{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:13px 14px 14px}
    .manual800-paynote{grid-column:1/-1;padding:9px 10px;background:#f5f5f7;border-radius:9px;font-size:9px;color:#777;line-height:1.55}
    .manual800-file{
      border:1px dashed #bcbcc2!important;background:#fafafa!important;padding:8px!important
    }
    .manual800-status{font-size:10px;color:#666;min-width:115px;text-align:right}
    .manual800-status.error{color:#b42318}
    .manual800-status.ok{color:#1b7f3a}

    .manual-pay-backdrop{position:fixed;inset:0;z-index:100020;background:rgba(20,20,22,.30);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px}
    .manual-pay-card{width:min(500px,100%);background:#fff;border-radius:20px;box-shadow:0 26px 75px rgba(0,0,0,.22);overflow:hidden}
    .manual-pay-head{display:flex;justify-content:space-between;gap:12px;padding:17px 18px;border-bottom:1px solid #eee}
    .manual-pay-head h3{margin:0;font-size:18px}.manual-pay-head p{margin:3px 0 0;font-size:10px;color:#777}
    .manual-pay-body{padding:16px 18px}.manual-pay-summary{background:#f5f5f7;border-radius:12px;padding:11px 12px;margin-bottom:12px;display:flex;justify-content:space-between;gap:10px}
    .manual-pay-summary span{font-size:10px;color:#777}.manual-pay-summary strong{font-size:14px}
    .manual-pay-actions{display:flex;justify-content:flex-end;gap:8px;padding:13px 18px;border-top:1px solid #eee}
    .manual-pay-actions button{min-width:110px}
    .manual800-toast{position:fixed;z-index:100030;right:22px;bottom:22px;background:#111;color:#fff;border-radius:12px;padding:11px 14px;font-size:11px;box-shadow:0 14px 38px rgba(0,0,0,.24)}
    @media(max-width:760px){
      .manual-expense-modal{padding:0!important;align-items:flex-end!important}
      .manual800-card{width:100%!important;max-height:96vh!important;border-radius:22px 22px 0 0!important}
      .manual800-header{padding:13px 12px;align-items:flex-start}.manual800-title p{display:none}
      .manual800-actions{gap:5px;flex-wrap:wrap;justify-content:flex-end}.manual800-actions button{font-size:10px;padding:8px 9px}
      .manual800-status{order:5;width:100%;text-align:right;min-width:0}
      .manual800-scroll{padding:9px}.manual800-grid,.manual800-grid.three,.manual800-money,.manual800-paybox{grid-template-columns:1fr}
      .manual800-money-left{grid-template-columns:1fr}.manual800-money-left .full,.manual800-paynote{grid-column:auto}
      .manual-pay-backdrop{align-items:flex-end;padding:0}.manual-pay-card{border-radius:20px 20px 0 0}
    }
  \`;
  document.head.appendChild(style);

  const money800 = (n) => Number(n || 0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
  const num800 = (id) => Math.max(0,Number(document.getElementById(id)?.value || 0));
  const today800 = () => {
    const d=new Date(),p=v=>String(v).padStart(2,"0");
    return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
  };
  const sleep800 = (ms) => new Promise(r=>setTimeout(r,ms));

  function toast800(text){
    document.querySelector(".manual800-toast")?.remove();
    const n=document.createElement("div");n.className="manual800-toast";n.textContent=text;document.body.appendChild(n);
    setTimeout(()=>n.remove(),3000);
  }

  async function postJson800(path,payload,{timeout=20000}={}){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const res=await fetch(apiUrl(path),{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify(payload),
        signal:controller.signal,
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data.ok===false){
        const err=new Error(data.message||data.error||("HTTP "+res.status));
        err.status=res.status;err.data=data;throw err;
      }
      return data;
    }catch(err){
      if(err?.name==="AbortError"){
        const e=new Error("ใช้เวลานานกว่าปกติ ระบบยกเลิกการรอแล้ว กรุณาดูในตารางก่อนกดซ้ำ");
        e.code="timeout";throw e;
      }
      throw err;
    }finally{clearTimeout(timer);}
  }

  function fileBase64800(file){
    return new Promise((resolve,reject)=>{
      if(!file)return reject(new Error("กรุณาแนบสลิปหรือหลักฐานการโอน"));
      if(file.size>8*1024*1024)return reject(new Error("ไฟล์ต้องไม่เกิน 8 MB"));
      const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
      if(file.type&&!allowed.includes(file.type))return reject(new Error("รองรับ JPG, PNG, WEBP และ PDF เท่านั้น"));
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
      reader.onload=()=>{
        const raw=String(reader.result||"");
        resolve({
          base64:raw.includes(",")?raw.split(",").pop():raw,
          mediaType:file.type||"image/jpeg",
          name:file.name||("slip-"+Date.now()),
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function categoryOptions800(){
    const vals=[...new Set(Array.from(document.getElementById("fCat")?.options||[])
      .map(o=>String(o.value||o.textContent||"").trim()).filter(Boolean))];
    const list=vals.length?vals:["ค่าบริการ & จ้างงาน","ค่าเดินทาง","ค่าอาหาร","ค่าอุปกรณ์สำนักงาน","ค่าสาธารณูปโภค","ค่าโฆษณา","อื่น ๆ"];
    return list.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
  }

  function channelOptions800(){
    let channels=[];
    try{
      channels=typeof batchPaymentChannels==="function"?batchPaymentChannels().filter(x=>x.active):[];
    }catch{}
    if(!channels.length)return '<option value="">ยังไม่ได้ตั้งช่องทางการเงิน</option>';
    return '<option value="">เลือกบัญชีที่ใช้จ่าย</option>'+channels.map(x=>{
      const title=typeof financeChannelTitle==="function"?financeChannelTitle(x):(x.label||x.name||x.bank||"บัญชี");
      const detail=typeof financeChannelDetail==="function"?financeChannelDetail(x):(x.number||"");
      return '<option value="'+escAttr(x.id)+'">'+esc(title)+(detail?' · '+esc(detail):'')+'</option>';
    }).join("");
  }

  function selectedChannelLabel800(selectId){
    const node=document.getElementById(selectId);
    if(!node||!node.value)return "";
    return String(node.options[node.selectedIndex]?.textContent||"").trim();
  }

  function calc800(){
    const base=num800("m800amount");
    const vat=document.getElementById("m800vat")?.checked?base*.07:0;
    const gross=base+vat;
    const wht=gross*(num800("m800wht")/100);
    const net=Math.max(0,gross-wht);
    [["m800base",base],["m800vatv",vat],["m800whtv",wht],["m800net",net]].forEach(([id,v])=>{
      const e=document.getElementById(id);if(e)e.textContent=money800(v);
    });
    return {base,vat,wht,net};
  }

  function manualExpensePayload800(){
    const totals=calc800();
    return {
      date:document.getElementById("m800date").value,
      vendor:document.getElementById("m800vendor").value.trim(),
      category:document.getElementById("m800cat").value,
      payerName:document.getElementById("m800payer").value.trim(),
      itemName:document.getElementById("m800item").value.trim(),
      qty:1,
      unitPrice:totals.base,
      discount:0,
      amount:totals.net,
      vat:document.getElementById("m800vat").checked,
      whtRate:Number(document.getElementById("m800wht").value||0),
      paid:false,
      paymentMethod:"",
      docType:document.getElementById("m800doctype").value,
      note:document.getElementById("m800note").value.trim(),
      attachmentUrls:[],
    };
  }

  function validateBase800(payload){
    if(!payload.date)throw new Error("กรุณาเลือกวันที่รายการ");
    if(!payload.vendor)throw new Error("กรุณากรอกร้านค้า / ผู้รับเงิน");
    if(!(payload.unitPrice>0))throw new Error("กรุณากรอกยอดเงินให้มากกว่า 0 บาท");
  }

  function optimisticInsert800(expense){
    if(!expense?.id)return;
    const exists=ALL.some(x=>String(x.id)===String(expense.id));
    if(!exists)ALL.unshift(expense);
    if(typeof renderExp==="function")renderExp();
  }

  function refreshQuiet800(){
    setTimeout(()=>{
      if(typeof refreshData==="function")refreshData({manual:true}).catch(()=>{});
      if(typeof refreshSubscription==="function")refreshSubscription({quiet:true}).catch(()=>{});
    },120);
  }

  async function payExisting800(id,{channelSelectId,slipInputId,paidAtId}){
    const paymentMethod=selectedChannelLabel800(channelSelectId);
    if(!paymentMethod)throw new Error("กรุณาเลือกบัญชีหรือช่องทางที่ใช้จ่าย");
    const file=document.getElementById(slipInputId)?.files?.[0];
    const filePayload=await fileBase64800(file);
    const paidAt=document.getElementById(paidAtId)?.value||today800();
    return await postJson800("/api/expenses/manual/pay",{
      id,paymentMethod,paidAt,file:filePayload
    },{timeout:30000});
  }

  function renderCreateModal800(){
    const modal=document.getElementById("manualExpenseModal");if(!modal)return;
    modal.innerHTML=\`
      <div class="manual-expense-card manual800-card" role="dialog" aria-modal="true">
        <div class="manual800-header">
          <div class="manual800-title">
            <small>EXPENSE ENTRY</small>
            <h3>บันทึกรายจ่าย</h3>
            <p>เลือกว่าเก็บไว้รอจ่าย หรือบันทึกว่าจ่ายแล้วพร้อมสลิป</p>
          </div>
          <div class="manual800-actions">
            <span class="manual800-status" id="m800status"></span>
            <button type="button" class="manual800-pending" id="m800savePending">บันทึกรอจ่าย</button>
            <button type="button" class="manual800-paid" id="m800savePaid">บันทึกว่าจ่ายแล้ว</button>
            <button type="button" class="manual800-close" id="m800close" aria-label="ปิด">×</button>
          </div>
        </div>

        <div class="manual800-scroll">
          <section class="manual800-section">
            <div class="manual800-section-head"><b>ข้อมูลหลัก</b><span>ร้านค้า วันที่ และหมวดรายจ่าย</span></div>
            <div class="manual800-grid three">
              <div class="manual800-field"><label>ร้านค้า / ผู้รับเงิน <em>*</em></label><input id="m800vendor" maxlength="180" placeholder="เช่น บริษัท ABC จำกัด"></div>
              <div class="manual800-field"><label>วันที่รายการ <em>*</em></label><input id="m800date" type="date"></div>
              <div class="manual800-field"><label>หมวดรายจ่าย</label><select id="m800cat">\${categoryOptions800()}</select></div>
              <div class="manual800-field"><label>ประเภทเอกสาร</label><select id="m800doctype"><option>บันทึกเอง</option><option>ใบเสร็จรับเงิน</option><option>ใบกำกับภาษี</option><option>ใบแจ้งหนี้</option><option>สลิปโอนเงิน</option><option>เอกสารอื่น</option></select></div>
              <div class="manual800-field"><label>ผู้เบิก / ผู้จ่าย</label><input id="m800payer" maxlength="180" placeholder="ชื่อผู้เบิกหรือผู้จ่าย"></div>
              <div class="manual800-field"><label>เลขรายการ</label><input value="ระบบสร้างให้อัตโนมัติ" disabled></div>
            </div>
          </section>

          <section class="manual800-section">
            <div class="manual800-section-head"><b>ยอดเงิน</b><span>ใส่ยอดก่อน VAT ระบบคำนวณยอดสุทธิให้</span></div>
            <div class="manual800-money">
              <div class="manual800-money-left">
                <div class="manual800-field full"><label>รายการ / รายละเอียด</label><input id="m800item" maxlength="250" placeholder="เช่น ค่าอาหารประชุม / ค่าโฆษณาเดือนสิงหาคม"></div>
                <div class="manual800-field"><label>ยอดก่อน VAT <em>*</em></label><input id="m800amount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00"></div>
                <div class="manual800-field"><label>หัก ณ ที่จ่าย</label><select id="m800wht"><option value="0">ไม่มี</option><option value="1">1%</option><option value="2">2%</option><option value="3">3%</option><option value="5">5%</option><option value="10">10%</option></select></div>
                <label class="manual800-check full"><input id="m800vat" type="checkbox"> มี VAT 7%</label>
              </div>
              <div class="manual800-total">
                <div class="manual800-total-row"><span>ก่อน VAT</span><b>฿<span id="m800base">0.00</span></b></div>
                <div class="manual800-total-row"><span>VAT</span><b>+฿<span id="m800vatv">0.00</span></b></div>
                <div class="manual800-total-row"><span>หัก ณ ที่จ่าย</span><b>-฿<span id="m800whtv">0.00</span></b></div>
                <div class="manual800-total-row final"><span>ยอดจ่ายสุทธิ</span><strong>฿<span id="m800net">0.00</span></strong></div>
              </div>
            </div>
          </section>

          <section class="manual800-section">
            <div class="manual800-section-head"><b>กรณีจ่ายแล้ว</b><span>ใช้เมื่อกด “บันทึกว่าจ่ายแล้ว” เท่านั้น</span></div>
            <div class="manual800-paybox">
              <div class="manual800-field"><label>จ่ายจาก / ช่องทางการเงิน</label><select id="m800channel">\${channelOptions800()}</select></div>
              <div class="manual800-field"><label>วันที่โอน</label><input id="m800paidAt" type="date"></div>
              <div class="manual800-field full"><label>สลิป / หลักฐานการโอน</label><input class="manual800-file" id="m800slip" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></div>
              <div class="manual800-paynote">ถ้ายังไม่ได้โอน ไม่ต้องกรอกส่วนนี้ — กด <b>บันทึกรอจ่าย</b> แล้วรายการจะขึ้นสถานะ “รอจ่าย” จากนั้นค่อยกด “โอนแล้ว” ที่รายการและแนบสลิปภายหลัง</div>
            </div>
          </section>

          <section class="manual800-section">
            <div class="manual800-section-head"><b>ข้อมูลเพิ่มเติม</b><span>ไม่บังคับ</span></div>
            <div class="manual800-grid">
              <div class="manual800-field full"><label>หมายเหตุ</label><textarea id="m800note" maxlength="500" placeholder="รายละเอียดเพิ่มเติมสำหรับฝ่ายบัญชี"></textarea></div>
            </div>
          </section>
        </div>
      </div>
    \`;

    document.getElementById("m800date").value=today800();
    document.getElementById("m800paidAt").value=today800();
    document.getElementById("m800payer").value=(document.getElementById("whoName")?.textContent||"").trim();
    ["m800amount","m800wht"].forEach(id=>document.getElementById(id)?.addEventListener("input",calc800));
    document.getElementById("m800vat")?.addEventListener("change",calc800);
    calc800();

    const close=()=>{modal.classList.remove("show");modal.setAttribute("aria-hidden","true");};
    document.getElementById("m800close").onclick=close;

    async function saveMode800(mode){
      const status=document.getElementById("m800status");
      const pendingBtn=document.getElementById("m800savePending");
      const paidBtn=document.getElementById("m800savePaid");
      pendingBtn.disabled=true;paidBtn.disabled=true;
      status.className="manual800-status";status.textContent=mode==="paid"?"กำลังบันทึกและแนบสลิป…":"กำลังบันทึกรอจ่าย…";

      let created=null;
      try{
        const payload=manualExpensePayload800();
        validateBase800(payload);

        created=await postJson800("/api/expenses/manual",payload,{timeout:20000});
        if(created?.expense)optimisticInsert800(created.expense);

        if(mode==="paid"){
          try{
            const paid=await payExisting800(created.id,{
              channelSelectId:"m800channel",slipInputId:"m800slip",paidAtId:"m800paidAt"
            });
            const row=ALL.find(x=>String(x.id)===String(created.id));
            if(row){
              row.status="จ่ายแล้ว";row.paid=true;row.attSlip=paid.slipUrl||row.attSlip||"";
              row.transferor=paid.paymentMethod||row.transferor||"";
            }
            if(typeof renderExp==="function")renderExp();
            status.className="manual800-status ok";status.textContent="บันทึกและแนบสลิปแล้ว";
            close();toast800("บันทึกเป็นจ่ายแล้วและแนบสลิปเรียบร้อย");
          }catch(payErr){
            status.className="manual800-status error";status.textContent="บันทึกรายการแล้ว แต่สลิปยังไม่สำเร็จ";
            close();
            toast800("รายการถูกเก็บเป็น “รอจ่าย” แล้ว กรุณาแนบสลิปจากตารางภายหลัง");
            alert("รายการถูกบันทึกเป็น “รอจ่าย” แล้ว แต่ขั้นตอนบันทึกการโอนยังไม่สำเร็จ:\\n"+payErr.message);
          }
        }else{
          status.className="manual800-status ok";status.textContent="บันทึกรอจ่ายแล้ว";
          close();toast800("บันทึกรอจ่ายแล้ว");
        }

        refreshQuiet800();
      }catch(err){
        status.className="manual800-status error";status.textContent=err.message||"บันทึกไม่สำเร็จ";
        alert(err.message||"บันทึกรายจ่ายไม่สำเร็จ");
      }finally{
        pendingBtn.disabled=false;paidBtn.disabled=false;
      }
    }

    document.getElementById("m800savePending").onclick=()=>saveMode800("pending");
    document.getElementById("m800savePaid").onclick=()=>saveMode800("paid");
  }

  function closePayModal800(){
    document.getElementById("manualPayBackdrop800")?.remove();
  }

  function openPayModal800(row){
    closePayModal800();
    const backdrop=document.createElement("div");
    backdrop.id="manualPayBackdrop800";
    backdrop.className="manual-pay-backdrop";
    backdrop.innerHTML=\`
      <div class="manual-pay-card">
        <div class="manual-pay-head">
          <div><h3>บันทึกว่าโอนแล้ว</h3><p>แนบสลิปก่อน ระบบถึงจะเปลี่ยนสถานะเป็น “จ่ายแล้ว”</p></div>
          <button type="button" class="manual800-close" id="pay800close">×</button>
        </div>
        <div class="manual-pay-body">
          <div class="manual-pay-summary">
            <div><span>ผู้รับเงิน</span><strong>\${esc(row.vendor||"—")}</strong></div>
            <div style="text-align:right"><span>ยอด</span><strong>฿\${money800(row.amount)}</strong></div>
          </div>
          <div class="manual800-grid" style="padding:0">
            <div class="manual800-field"><label>จ่ายจาก / ช่องทางการเงิน <em>*</em></label><select id="pay800channel">\${channelOptions800()}</select></div>
            <div class="manual800-field"><label>วันที่โอน</label><input id="pay800date" type="date" value="\${today800()}"></div>
            <div class="manual800-field full"><label>สลิป / หลักฐานการโอน <em>*</em></label><input class="manual800-file" id="pay800slip" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></div>
            <div class="manual800-status full" id="pay800status" style="text-align:left"></div>
          </div>
        </div>
        <div class="manual-pay-actions">
          <button type="button" class="btn" id="pay800cancel">ยกเลิก</button>
          <button type="button" class="btn solid" id="pay800submit">ยืนยันว่าจ่ายแล้ว</button>
        </div>
      </div>
    \`;
    document.body.appendChild(backdrop);

    document.getElementById("pay800close").onclick=closePayModal800;
    document.getElementById("pay800cancel").onclick=closePayModal800;
    backdrop.addEventListener("click",e=>{if(e.target===backdrop)closePayModal800();});

    document.getElementById("pay800submit").onclick=async()=>{
      const btn=document.getElementById("pay800submit"),status=document.getElementById("pay800status");
      btn.disabled=true;btn.textContent="กำลังบันทึก…";status.className="manual800-status";status.textContent="กำลังอัปโหลดสลิปและเปลี่ยนสถานะ…";
      try{
        const out=await payExisting800(String(row.id),{
          channelSelectId:"pay800channel",slipInputId:"pay800slip",paidAtId:"pay800date"
        });
        const live=ALL.find(x=>String(x.id)===String(row.id));
        if(live){
          live.status="จ่ายแล้ว";live.paid=true;live.attSlip=out.slipUrl||live.attSlip||"";
          live.transferor=out.paymentMethod||live.transferor||"";
        }
        if(typeof renderExp==="function")renderExp();
        closePayModal800();toast800("บันทึกว่าจ่ายแล้วและแนบสลิปเรียบร้อย");
        refreshQuiet800();
      }catch(err){
        status.className="manual800-status error";status.textContent=err.message||"บันทึกไม่สำเร็จ";
        alert(err.message||"บันทึกการโอนไม่สำเร็จ");
      }finally{btn.disabled=false;btn.textContent="ยืนยันว่าจ่ายแล้ว";}
    };
  }

  // Status badge: make "รอจ่าย" visually distinct.
  if(typeof expenseStatusClass==="function"){
    const coreStatus800=expenseStatusClass;
    expenseStatusClass=function(status){
      if(String(status||"")==="รอจ่าย")return "waiting-payment";
      return coreStatus800(status);
    };
  }

  // Add "โอนแล้ว" action directly on pending manual-expense rows.
  if(typeof expenseRowHTML==="function"){
    const coreRow800=expenseRowHTML;
    expenseRowHTML=function(r){
      let html=coreRow800(r);
      const pending=String(r?.status||"")==="รอจ่าย";
      const manual=String(r?.docType||"")==="บันทึกเอง"||String(r?.source||"")==="manual_dashboard";
      if(!pending||!manual||!r?.id)return html;
      html=html.replace(
        /<button type="button" class="expense-more-btn" data-exp-open="([^"]+)">ดู<\\/button>/,
        '<div class="manual-expense-row-actions"><button type="button" class="manual-expense-pay-btn" data-manual-pay-id="'+escAttr(r.id)+'">โอนแล้ว</button><button type="button" class="expense-more-btn" data-exp-open="$1">ดู</button></div>'
      );
      return html;
    };
  }

  document.addEventListener("click",e=>{
    const btn=e.target.closest("[data-manual-pay-id]");
    if(!btn)return;
    e.preventDefault();e.stopPropagation();
    const id=btn.dataset.manualPayId;
    const row=ALL.find(x=>String(x.id)===String(id));
    if(row)openPayModal800(row);
  });

  // Replace previous v7.79.x click handler with v7.80 create flow.
  function hookCreate800(){
    const modal=document.getElementById("manualExpenseModal");
    const old=document.getElementById("manualExpenseCreate");
    if(!modal||!old)return;
    const fresh=old.cloneNode(true);old.replaceWith(fresh);
    fresh.addEventListener("click",()=>{
      renderCreateModal800();
      modal.classList.add("show");modal.setAttribute("aria-hidden","false");
      setTimeout(()=>document.getElementById("m800vendor")?.focus(),50);
    });
    modal.addEventListener("click",e=>{
      if(e.target===modal){modal.classList.remove("show");modal.setAttribute("aria-hidden","true");}
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>setTimeout(hookCreate800,240));
  }else setTimeout(hookCreate800,240);

  console.info("${MARK}");
})();`;
}

fs.writeFileSync(dashboardFile, js);
execFileSync(process.execPath, ["--check", dashboardFile], {stdio:"inherit"});

let html=fs.readFileSync(indexFile,"utf8");
html=html.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, "./assets/dashboard.js?v=7.80.20260818");
fs.writeFileSync(indexFile,html);

if(!js.includes(MARK))throw new Error("v7.80 dashboard audit failed");
console.log(`✅ ${MARK} ready`);
console.log("✅ Two explicit save paths: รอจ่าย / จ่ายแล้ว");
console.log("✅ Pending rows show รอจ่าย + โอนแล้ว action");
console.log("✅ Paid confirmation requires payment channel + slip");
console.log("✅ Client timeout prevents endless กำลังบันทึก state");
