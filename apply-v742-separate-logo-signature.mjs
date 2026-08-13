import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const indexFile=path.join(root,"index.html");
const receiptFile=path.join(root,"receipt.html");
const assets=path.join(root,"assets");
const assetFile=path.join(assets,"company-assets-v742.js");
const MARK="COMPANY_ASSETS_SEPARATED_V7_42_20260814";
const RECEIPT_MARK="RECEIPT_ASSET_FOCUS_V7_42_20260814";

if(!fs.existsSync(indexFile)) throw new Error("ไม่พบ index.html — ให้รันที่ root ของ deal-dashboard");
if(!fs.existsSync(assets)) fs.mkdirSync(assets,{recursive:true});

fs.writeFileSync(assetFile,"(()=>{\n  \"use strict\";\n  const MARK=\"COMPANY_ASSETS_SEPARATED_V7_42_20260814\";\n  const $=(s,r=document)=>r.querySelector(s);\n\n  function addStyle(){\n    if($(\"#companyAssetsV742Style\")) return;\n    const s=document.createElement(\"style\");\n    s.id=\"companyAssetsV742Style\";\n    s.textContent=`\n      .company-asset-panel-v742{\n        margin-top:14px;padding-top:14px;border-top:1px solid #ededf0;\n      }\n      .company-asset-head-v742{\n        display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;\n      }\n      .company-asset-head-v742 strong{display:block;font-size:12px;color:#111}\n      .company-asset-head-v742 small{display:block;font-size:10px;color:#6e6e73;margin-top:3px;line-height:1.45}\n      .company-asset-preview-v742{\n        min-height:86px;border:1px solid #e8e8ed;border-radius:14px;background:#fafafa;\n        display:flex;align-items:center;justify-content:center;padding:12px;overflow:hidden;\n      }\n      .company-asset-preview-v742 img{max-width:220px;max-height:84px;object-fit:contain}\n      .company-asset-empty-v742{font-size:10.5px;color:#86868b}\n      .company-asset-state-v742{display:flex;align-items:center;gap:7px;font-size:10.5px;margin:8px 0 0}\n      .company-asset-dot-v742{width:7px;height:7px;border-radius:50%;background:#d1d1d6}\n      .company-asset-state-v742.ok .company-asset-dot-v742{background:#248a3d}\n      #biz-profile .company-signature-v741{display:none!important}\n      #biz-profile .company-approver-v741{min-height:100%}\n      @media(max-width:760px){\n        .company-asset-head-v742{display:block}\n        .company-asset-head-v742 .btn{margin-top:8px;width:100%}\n      }\n    `;\n    document.head.appendChild(s);\n  }\n\n  function setting(key){\n    try{return typeof SETTINGS!==\"undefined\" ? (SETTINGS?.[key]||\"\") : \"\"}catch{return \"\"}\n  }\n  function displayUrl(url,size=420){\n    try{\n      if(typeof compactImageUrl===\"function\") return compactImageUrl(url,size);\n    }catch{}\n    return String(url||\"\").trim();\n  }\n\n  function logoUrl(){\n    return String(\n      setting(\"logo_url\") ||\n      setting(\"company_logo_url\") ||\n      setting(\"logoUrl\") ||\n      \"\"\n    ).trim();\n  }\n\n  function signatureUrl(){\n    try{\n      if(typeof approverSignatureUrl===\"function\") return String(approverSignatureUrl()||\"\").trim();\n    }catch{}\n    return String(\n      setting(\"approver_sign_url\") ||\n      setting(\"signature_url\") ||\n      \"\"\n    ).trim();\n  }\n\n  function goAsset(kind){\n    try{\n      const q=new URLSearchParams();\n      q.set(\"tenant\",typeof TENANT!==\"undefined\"?TENANT:\"\");\n      q.set(\"k\",typeof K!==\"undefined\"?K:\"\");\n      q.set(\"asset\",kind);\n      location.href=location.origin+\"/receipt?\"+q.toString();\n    }catch{}\n  }\n\n  function panel(kind){\n    const isLogo=kind===\"logo\";\n    const url=isLogo?logoUrl():signatureUrl();\n    const src=displayUrl(url,420);\n    const title=isLogo?\"โลโก้บริษัท\":\"ลายเซ็นผู้อนุมัติ\";\n    const desc=isLogo\n      ?\"ใช้เป็นอัตลักษณ์ของบริษัทบนเอกสาร\"\n      :\"ใช้รับรองเอกสารในชื่อผู้อนุมัติ / ผู้ลงนาม\";\n    const button=isLogo?\"เปลี่ยนโลโก้\":\"เปลี่ยนลายเซ็น\";\n    return `\n      <div class=\"company-asset-panel-v742\" data-company-asset=\"${kind}\">\n        <div class=\"company-asset-head-v742\">\n          <div><strong>${title}</strong><small>${desc}</small></div>\n          <button class=\"btn\" type=\"button\" data-v742-open-asset=\"${kind}\">${button}</button>\n        </div>\n        <div class=\"company-asset-preview-v742\">\n          ${src?`<img src=\"${String(src).replace(/\"/g,\"&quot;\")}\" loading=\"lazy\" decoding=\"async\" alt=\"${title}\">`:`<span class=\"company-asset-empty-v742\">ยังไม่ได้อัปโหลด${title}</span>`}\n        </div>\n        <div class=\"company-asset-state-v742 ${url?\"ok\":\"\"}\">\n          <span class=\"company-asset-dot-v742\"></span>\n          <span>${url?\"พร้อมใช้กับเอกสารใหม่\":\"ยังไม่ได้ตั้งค่า\"}</span>\n        </div>\n      </div>`;\n  }\n\n  function apply(){\n    addStyle();\n    const profile=$(\"#biz-profile\");\n    const companyCard=$(\"#bizCompany\")?.closest(\".card\");\n    const approverCard=$(\"#bizApprover\")?.closest(\".card\");\n    const oldSignatureCard=$(\"#signatureStatus\")?.closest(\".card\");\n    if(!profile||!companyCard||!approverCard) return;\n\n    // เปลี่ยนปุ่มเก่าที่เคยสื่อว่าโลโก้+ลายเซ็นรวมกัน\n    const oldAsset=$(\"#openAssetSettings\");\n    const oldSign=$(\"#openSignatureSettings\");\n    if(oldAsset){\n      oldAsset.textContent=\"เปลี่ยนโลโก้\";\n      oldAsset.style.display=\"none\";\n    }\n    if(oldSign){\n      oldSign.textContent=\"เปลี่ยนลายเซ็น\";\n      oldSign.style.display=\"none\";\n    }\n\n    // ลบ panel เก่าแล้ว render ใหม่จาก Settings ล่าสุด\n    companyCard.querySelector('[data-company-asset=\"logo\"]')?.remove();\n    approverCard.querySelector('[data-company-asset=\"signature\"]')?.remove();\n    companyCard.insertAdjacentHTML(\"beforeend\",panel(\"logo\"));\n    approverCard.insertAdjacentHTML(\"beforeend\",panel(\"signature\"));\n\n    // status เดิมของ signature ยังถูก renderBusiness อัปเดต แต่ซ่อน card เดิมเพื่อไม่ซ้ำ\n    if(oldSignatureCard) oldSignatureCard.style.display=\"none\";\n\n    // ชื่อการ์ดให้ชัดว่า approver กับ signature เป็นชุดเดียวกัน\n    const ah=approverCard.querySelector(\"h3\");\n    const as=approverCard.querySelector(\".cs\");\n    if(ah) ah.textContent=\"ผู้อนุมัติ / ผู้ลงนาม\";\n    if(as) as.textContent=\"ชื่อและลายเซ็นของผู้มีอำนาจที่ใช้บนเอกสารบริษัท\";\n\n    // note เก่าที่บอกโลโก้+ลายเซ็นรวมกันซ่อน\n    document.querySelectorAll(\".company-docs-note-v741\").forEach(n=>n.style.display=\"none\");\n  }\n\n  function hookRender(){\n    try{\n      if(typeof renderBusiness===\"function\" && !renderBusiness.__v742){\n        const original=renderBusiness;\n        const wrapped=function(...args){\n          const out=original.apply(this,args);\n          setTimeout(apply,0);\n          return out;\n        };\n        wrapped.__v742=true;\n        renderBusiness=wrapped;\n      }\n    }catch(e){console.warn(\"v7.42 hook renderBusiness\",e)}\n  }\n\n  document.addEventListener(\"click\",e=>{\n    const btn=e.target.closest(\"[data-v742-open-asset]\");\n    if(btn){\n      e.preventDefault();\n      e.stopImmediatePropagation();\n      goAsset(btn.dataset.v742OpenAsset);\n    }\n  },true);\n\n  window.addEventListener(\"storage\",e=>{\n    if(/document-settings-updated|signature-ready/.test(e.key||\"\")) setTimeout(apply,50);\n  });\n\n  function init(){\n    hookRender();\n    apply();\n  }\n\n  if(document.readyState===\"loading\") document.addEventListener(\"DOMContentLoaded\",init,{once:true});\n  else init();\n  window.addEventListener(\"load\",()=>setTimeout(init,100),{once:true});\n  console.info(MARK);\n})();");
execFileSync(process.execPath,["--check",assetFile],{stdio:"inherit"});

let html=fs.readFileSync(indexFile,"utf8");
if(!html.includes(MARK)){
  html=html.replace("</body>",`<!-- ${MARK} -->
<script src="./assets/company-assets-v742.js?v=7.42"></script>
</body>`);
  fs.writeFileSync(indexFile,html);
}

if(fs.existsSync(receiptFile)){
  let receipt=fs.readFileSync(receiptFile,"utf8");
  if(!receipt.includes(RECEIPT_MARK)){
    receipt=receipt.replace("</body>",`<!-- ${RECEIPT_MARK} -->
<script>(()=>{
  const Q=new URLSearchParams(location.search);
  const asset=Q.get("asset");
  if(!asset)return;
  const target=asset==="signature"?"signFile":asset==="logo"?"logoFile":"";
  if(!target)return;
  const run=()=>{
    const el=document.getElementById(target);
    if(!el)return;
    const field=el.closest(".field")||el;
    field.scrollIntoView({behavior:"smooth",block:"center"});
    field.style.outline="2px solid #1d1d1f";
    field.style.outlineOffset="4px";
    setTimeout(()=>{field.style.outline="";field.style.outlineOffset="";},1800);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(run,120),{once:true});
  else setTimeout(run,120);
})();</script>
</body>`);
    fs.writeFileSync(receiptFile,receipt);
  }
}

console.log("✅ "+MARK+" ready");
