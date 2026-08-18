import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const indexFile=path.join(process.cwd(),"index.html");
const dashboardFile=path.join(process.cwd(),"assets","dashboard.js");
const MARK="VENDOR_REQUISITION_BUTTON_V7_81_20260818";
for(const f of [indexFile,dashboardFile])if(!fs.existsSync(f))throw new Error(`v7.81 missing ${f}`);

let html=fs.readFileSync(indexFile,"utf8");
if(!html.includes('id="vendorRequisitionCreate"')){
  const anchor=`<button class="btn solid" id="manualExpenseCreate" type="button">+ บันทึกรายจ่าย</button>`;
  if(!html.includes(anchor))throw new Error("v7.81 button anchor missing — v7.78 must run first");
  html=html.replace(anchor,`<button class="btn" id="vendorRequisitionCreate" type="button">+ ตั้งเบิก</button>
          ${anchor}`);
}
html=html.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/,"./assets/dashboard.js?v=7.81.20260818");
fs.writeFileSync(indexFile,html);

let js=fs.readFileSync(dashboardFile,"utf8");
if(!js.includes(MARK)){
js+=`

/* ${MARK} */
(() => {
  "use strict";
  const style=document.createElement("style");
  style.textContent=\`
    #vendorRequisitionCreate{background:#fff!important;color:#111!important;border:1px solid #cfcfd4!important}
    #vendorRequisitionCreate:hover{background:#f5f5f7!important}
    #vendorRequisitionCreate[disabled]{opacity:.55;cursor:wait}
    @media(max-width:700px){#vendorRequisitionCreate{width:100%}}
  \`;
  document.head.appendChild(style);

  async function openRequisition(){
    const btn=document.getElementById("vendorRequisitionCreate");if(!btn)return;
    const old=btn.textContent;btn.disabled=true;btn.textContent="กำลังเปิดฟอร์ม…";
    const tab=window.open("about:blank","_blank");
    try{
      const res=await fetch(apiUrl("/api/requisition-link"),{
        method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({recipientType:"company"})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data.ok!==true||!data.url)throw new Error(data.message||data.reason||"สร้างลิงก์ตั้งเบิกไม่สำเร็จ");
      if(tab)tab.location.href=data.url; else location.href=data.url;
    }catch(err){
      try{tab?.close()}catch{}
      alert(err?.message||"เปิดฟอร์มตั้งเบิกไม่สำเร็จ");
    }finally{btn.disabled=false;btn.textContent=old}
  }

  function bind(){
    const old=document.getElementById("vendorRequisitionCreate");
    if(!old||old.dataset.v781==="1")return;
    const btn=old.cloneNode(true);btn.dataset.v781="1";old.replaceWith(btn);btn.addEventListener("click",openRequisition);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(bind,300));else setTimeout(bind,300);
  console.info("${MARK}");
})();`;
}
fs.writeFileSync(dashboardFile,js);
execFileSync(process.execPath,["--check",dashboardFile],{stdio:"inherit"});
if(!html.includes('id="vendorRequisitionCreate"')||!js.includes(MARK))throw new Error("v7.81 dashboard audit failed");
console.log(`✅ ${MARK} ready`);
