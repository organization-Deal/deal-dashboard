import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const indexFile = path.join(root, 'index.html');
const assetsDir = path.join(root, 'assets');
const assetFile = path.join(assetsDir, 'company-documents-v741.js');
const MARK = 'COMPANY_DOCUMENTS_MERGED_V7_41_20260814';

if (!fs.existsSync(indexFile)) throw new Error('ไม่พบ index.html — ให้รันที่ root ของ deal-dashboard');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const asset = `(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function addStyle(){
    if($('#companyDocsV741Style')) return;
    const s=document.createElement('style');
    s.id='companyDocsV741Style';
    s.textContent=[
      '[data-biz="approver"],[data-mobile-biz="approver"]{display:none!important}',
      '#biz-approver{display:none!important}',
      '.company-docs-hero-v741{background:#fff;border:1px solid #e8e8ed;border-radius:22px;padding:18px 20px;margin-bottom:14px;display:flex;justify-content:space-between;gap:20px}',
      '.company-docs-hero-v741 .k{font-size:10px;letter-spacing:.08em;color:#86868b;font-weight:800}.company-docs-hero-v741 h2{font-size:20px;margin:3px 0 5px}.company-docs-hero-v741 p{font-size:11px;color:#6e6e73;margin:0;line-height:1.55;max-width:720px}',
      '.company-docs-status-v741{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.company-docs-chip-v741{border-radius:999px;padding:7px 9px;background:#fff6e8;color:#935b00;font-size:10px;font-weight:750;white-space:nowrap}.company-docs-chip-v741.ok{background:#edf8ef;color:#248a3d}',
      '#biz-profile .biz-grid{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.company-docs-note-v741{margin-top:12px;padding:10px 12px;border-radius:12px;background:#f5f5f7;color:#6e6e73;font-size:10.5px;line-height:1.5}',
      '@media(max-width:760px){.company-docs-hero-v741{display:block}.company-docs-status-v741{justify-content:flex-start;margin-top:12px}#biz-profile .biz-grid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(s);
  }

  function ready(v){return String(v||'').trim().length>0}
  function setting(k){try{return typeof SETTINGS!=='undefined' ? SETTINGS?.[k] : ''}catch{return ''}}
  function renderStatus(){
    const box=$('#companyDocsStatusV741'); if(!box) return;
    const company=ready($('#bizCompany')?.value||setting('company_name'))&&ready($('#bizAddress')?.value||setting('company_address'))&&ready($('#bizTaxId')?.value||setting('tax_id'));
    const approver=ready($('#bizApprover')?.value||setting('approver_name'));
    const sign=ready(setting('approver_sign_url'));
    const logo=ready(setting('logo_url'));
    box.innerHTML=[['ข้อมูลบริษัท',company],['ผู้อนุมัติ',approver],['ลายเซ็น',sign],['โลโก้',logo]].map(function(row){const t=row[0],ok=row[1];return '<span class="company-docs-chip-v741 '+(ok?'ok':'')+'">'+(ok?'✓':'•')+' '+t+'</span>'}).join('');
  }

  function renameMenus(){
    $$('[data-biz="profile"]').forEach(function(b){const s=b.querySelector('span'); if(s)s.textContent='ข้อมูลบริษัทและเอกสาร'; else if(b.classList.contains('subnavlink'))b.textContent='ข้อมูลบริษัทและเอกสาร'});
    $$('[data-mobile-biz="profile"]').forEach(function(b){const s=b.querySelector('span');if(s)s.textContent='ข้อมูลบริษัทและเอกสาร'});
    $$('[data-biz="approver"],[data-mobile-biz="approver"]').forEach(function(b){b.hidden=true});
    const onboard=$('[data-step="company_documents"] span:last-child'); if(onboard) onboard.textContent='ข้อมูลบริษัท ผู้อนุมัติ และลายเซ็น';
  }

  function merge(){
    addStyle(); renameMenus();
    const profile=$('#biz-profile'), approver=$('#biz-approver'), grid=profile?.querySelector('.biz-grid');
    if(!profile||!grid) return;
    if(!$('#companyDocsHeroV741')){
      const hero=document.createElement('div'); hero.id='companyDocsHeroV741'; hero.className='company-docs-hero-v741';
      hero.innerHTML='<div><div class="k">COMPANY DOCUMENTS</div><h2>ข้อมูลบริษัทและเอกสาร</h2><p>ตั้งค่าข้อมูลที่ใช้บนใบเบิกและเอกสารอัตโนมัติไว้ในที่เดียว — ข้อมูลบริษัท ผู้อนุมัติ โลโก้ และลายเซ็น ส่วนตราประทับบริษัทไม่ได้บังคับในระบบรุ่นนี้</p></div><div class="company-docs-status-v741" id="companyDocsStatusV741"></div>';
      profile.insertBefore(hero,grid);
    }
    const approverCard=$('#bizApprover')?.closest('.card');
    const signatureCard=$('#signatureStatus')?.closest('.card');
    if(approverCard && approverCard.parentElement!==grid) grid.appendChild(approverCard);
    if(signatureCard && signatureCard.parentElement!==grid) grid.appendChild(signatureCard);
    if(approverCard){const h=approverCard.querySelector('h3'),c=approverCard.querySelector('.cs');if(h)h.textContent='ผู้อนุมัติ / ผู้ลงนาม';if(c)c.textContent='ชื่อผู้มีอำนาจที่แสดงบนเอกสารของบริษัท'}
    if(signatureCard){const h=signatureCard.querySelector('h3'),c=signatureCard.querySelector('.cs');if(h)h.textContent='โลโก้และลายเซ็น';if(c)c.textContent='ไฟล์ที่ใช้กับใบเบิกและใบแทนที่ระบบสร้างใหม่';if(!signatureCard.querySelector('.company-docs-note-v741')){const n=document.createElement('div');n.className='company-docs-note-v741';n.textContent='ตราประทับบริษัทไม่ใช่ข้อมูลบังคับในระบบรุ่นนี้ ปัจจุบันเอกสารใช้ข้อมูลบริษัท ผู้อนุมัติ โลโก้ และลายเซ็น';signatureCard.appendChild(n)}}
    if(approver) approver.hidden=true;
    renderStatus();
  }

  function patchNav(){
    try{
      if(typeof setBusinessTab==='function'&&!setBusinessTab.__v741){const o=setBusinessTab;setBusinessTab=function(tab,...r){return o.call(this,tab==='approver'?'profile':tab,...r)};setBusinessTab.__v741=true}
      if(typeof openBusiness==='function'&&!openBusiness.__v741){const o=openBusiness;openBusiness=function(tab,...r){return o.call(this,tab==='approver'?'profile':tab,...r)};openBusiness.__v741=true}
    }catch(e){console.warn('v741 nav',e)}
  }

  function keepSaveHere(){
    const b=$('#saveBusiness'), a=$('#saveApprover');
    if(b&&b.dataset.v741!=='1'&&typeof saveSettings==='function'){b.dataset.v741='1';b.onclick=async()=>{const ok=await saveSettings({company_name:$('#bizCompany')?.value.trim()||'',company_address:($('#bizAddress')?.value||'').trim().replace(/\\n/g,'\\\\n'),tax_id:$('#bizTaxId')?.value.trim()||''},'bizSaveState');if(ok){try{renderBusiness()}catch{}renderStatus()}}}
    if(a&&a.dataset.v741!=='1'&&typeof saveSettings==='function'){a.dataset.v741='1';a.onclick=async()=>{const ok=await saveSettings({approver_name:$('#bizApprover')?.value.trim()||''},'approverSaveState');if(ok){try{renderBusiness()}catch{}renderStatus()}}}
  }

  function normalize(){
    const q=new URLSearchParams(location.search); if(q.get('biz')==='approver'){q.set('biz','profile');history.replaceState(null,'',location.pathname+'?'+q.toString());try{setBusinessTab('profile')}catch{}}
  }

  function init(){patchNav();merge();keepSaveHere();normalize()}
  document.addEventListener('click',function(e){const x=e.target.closest('[data-biz="approver"],[data-mobile-biz="approver"]');if(x){e.preventDefault();e.stopImmediatePropagation();try{openBusiness('profile',document.querySelector('[data-biz="profile"]'))}catch{}};if(e.target.closest('#saveBusiness,#saveApprover,#openAssetSettings,#openSignatureSettings'))setTimeout(renderStatus,400)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('load',()=>setTimeout(init,100),{once:true});
  console.info('${MARK}');
})();`;

fs.writeFileSync(assetFile, asset);
execFileSync(process.execPath, ['--check', assetFile], { stdio: 'inherit' });
let html = fs.readFileSync(indexFile, 'utf8');
if (!html.includes(MARK)) {
  html = html.replace('</body>', '<!-- ' + MARK + ' -->\n<script src="./assets/company-documents-v741.js?v=7.41"></script>\n</body>');
  fs.writeFileSync(indexFile, html);
}
console.log('✅ ' + MARK + ' ready');
