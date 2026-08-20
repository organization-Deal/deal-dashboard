import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const VERSION = '9.14.0';
const BUILD_DATE = '20260821';
const SELF = 'apply-v914-employee-modal-access.mjs';
const MARK = 'RUBJAI_V914_EMPLOYEE_MODAL_ACCESS_20260821';

const indexFile = path.join(root, 'index.html');
const packageFile = path.join(root, 'package.json');
const assetsDir = path.join(root, 'assets');
const cssFile = path.join(assetsDir, 'employee-modal-access-v914.css');
const jsFile = path.join(assetsDir, 'employee-modal-access-v914.js');

if (!fs.existsSync(indexFile)) throw new Error('v9.14 missing index.html');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const css = `/* ${MARK} */
html.v914-team-access .v913-team-jump{display:none!important}
html.v914-team-access #dashboardAccessCard.v914-access-engine,
html.v914-team-access .v913-permission-shell.v914-access-engine{
  position:absolute!important;
  left:-10000px!important;
  top:0!important;
  width:1px!important;
  height:1px!important;
  min-height:1px!important;
  overflow:hidden!important;
  opacity:.001!important;
  pointer-events:none!important;
  margin:0!important;
  padding:0!important;
}
.v914-edit-access-btn{white-space:nowrap}
.v914-row-access{
  display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:4px 8px;border-radius:999px;
  background:#F0F2F8;color:#11162E;font-size:10.5px;font-weight:750;line-height:1.1;vertical-align:middle
}
.v914-row-access.is-none{color:#667085;background:#F7F8FA}
.v914-row-access.is-approver{background:#EEF4FF;color:#253B80}
.v914-row-access.is-accountant{background:#ECFDF3;color:#166534}
.v914-row-access.is-viewer{background:#F2F4F7;color:#344054}
.v914-employee-dialog{width:min(680px,calc(100vw - 28px))!important;max-width:680px!important}
.v914-employee-dialog .v914-modal-subcopy{color:#667085!important}
.v914-access-box{
  margin:16px 0 4px;padding:16px;border:1px solid rgba(17,22,46,.10);border-radius:16px;background:#FAFBFD
}
.v914-access-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.v914-access-head strong{display:block;color:#11162E;font-size:13px;line-height:1.3}
.v914-access-head small{display:block;color:#667085;font-size:10.5px;line-height:1.45;margin-top:3px}
.v914-access-current{flex:0 0 auto;padding:5px 8px;border-radius:999px;background:#EEF1F6;color:#475467;font-size:10px;font-weight:750}
.v914-role-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.v914-role-option{
  appearance:none;width:100%;text-align:left;border:1px solid #D8DEE9;border-radius:13px;background:#fff;color:#11162E;
  padding:11px 12px;cursor:pointer;transition:border-color .12s ease,box-shadow .12s ease,background .12s ease
}
.v914-role-option:hover{border-color:#AAB4C8}
.v914-role-option.is-selected{border-color:#11162E;background:#F0F2F8;box-shadow:0 0 0 1px #11162E inset}
.v914-role-option b{display:block;font-size:12.5px;line-height:1.25}
.v914-role-option span{display:block;margin-top:3px;color:#667085;font-size:10.5px;line-height:1.35}
.v914-access-note{display:flex;align-items:flex-start;gap:7px;margin-top:10px;color:#667085;font-size:10px;line-height:1.45}
.v914-access-note b{color:#11162E}
.v914-access-state{margin-top:9px;min-height:16px;font-size:10.5px;color:#667085}
.v914-access-state.ok{color:#166534}.v914-access-state.warn{color:#B45309}.v914-access-state.bad{color:#B42318}
#v914Toast{position:fixed;right:20px;bottom:20px;z-index:2147483000;max-width:min(420px,calc(100vw - 28px));padding:11px 14px;border-radius:12px;background:#11162E;color:white;font-size:12px;box-shadow:0 16px 42px rgba(17,22,46,.25);opacity:0;transform:translateY(8px);pointer-events:none;transition:.16s ease}
#v914Toast.show{opacity:1;transform:translateY(0)}#v914Toast.bad{background:#7A271A}
@media(max-width:640px){
  .v914-employee-dialog{width:calc(100vw - 20px)!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important}
  .v914-role-grid{grid-template-columns:1fr}
  .v914-access-head{display:block}.v914-access-current{display:inline-flex;margin-top:8px}
}
`;

const js = `/* ${MARK} */
(() => {
  'use strict';
  const VERSION = '${VERSION}';
  const root = document.documentElement;
  const ROLE = {
    none: { label:'ไม่มีสิทธิ์ Dashboard', short:'ไม่มีสิทธิ์' },
    approver: { label:'ผู้อนุมัติ', short:'ผู้อนุมัติ' },
    accountant: { label:'บัญชี / การเงิน', short:'บัญชี / การเงิน' },
    viewer: { label:'ดูอย่างเดียว', short:'ดูอย่างเดียว' },
  };
  let observer = null;
  let scheduled = false;
  let timer = 0;
  let lastHref = location.href;
  let applying = false;

  const clean = s => String(s || '').replace(/\\s+/g,' ').trim();
  const low = s => clean(s).toLowerCase();
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function routeTeam(){
    try{ const u=new URL(location.href); return u.searchParams.get('page')==='business' && u.searchParams.get('biz')==='team'; }
    catch{return false;}
  }
  function visible(el){
    if(!el || el.hidden || el.getAttribute('aria-hidden')==='true') return false;
    const cs=getComputedStyle(el); return cs.display!=='none' && cs.visibility!=='hidden';
  }
  function toast(msg,bad=false){
    let el=document.getElementById('v914Toast');
    if(!el){el=document.createElement('div');el.id='v914Toast';document.body.appendChild(el);}
    el.textContent=msg;el.classList.toggle('bad',bad);el.classList.add('show');
    clearTimeout(el.__t);el.__t=setTimeout(()=>el.classList.remove('show'),2800);
  }
  function roleFromText(t){
    const s=low(t);
    if(s.includes('บัญชี / การเงิน')||s.includes('บัญชี/การเงิน')||s.includes('accountant')) return 'accountant';
    if(s.includes('ผู้อนุมัติ')||s.includes('approver')) return 'approver';
    if(s.includes('ดูอย่างเดียว')||s.includes('viewer')) return 'viewer';
    return 'none';
  }

  function accessCard(){ return document.getElementById('dashboardAccessCard'); }
  function accessRows(){
    const card=accessCard(); if(!card) return [];
    const sel='tr,.list-card-row,.dash-access-row,.access-row,.member-row,[data-access-user],[class*="access-member"],[class*="permission-member"]';
    const rows=[...card.querySelectorAll(sel)];
    return rows.length?rows:[...card.querySelectorAll('div')].filter(el=>{
      const t=clean(el.textContent); return t.length>2 && t.length<280 && /(ผู้อนุมัติ|บัญชี\\s*\\/\\s*การเงิน|ดูอย่างเดียว)/.test(t);
    });
  }
  function currentRoleFor(name,lineHint=''){
    name=clean(name); lineHint=clean(lineHint);
    if(!name&&!lineHint) return 'none';
    const candidates=accessRows().filter(row=>{
      const t=clean(row.textContent);
      return (name && t.includes(name)) || (lineHint && t.includes(lineHint.slice(-6)));
    });
    if(!candidates.length) return 'none';
    const exact=candidates.sort((a,b)=>clean(a.textContent).length-clean(b.textContent).length)[0];
    return roleFromText(exact.textContent);
  }
  function currentAccessRow(name,lineHint=''){
    const rows=accessRows().filter(row=>{
      const t=clean(row.textContent);
      return (name&&t.includes(name)) || (lineHint&&t.includes(lineHint.slice(-6)));
    });
    return rows.sort((a,b)=>clean(a.textContent).length-clean(b.textContent).length)[0]||null;
  }

  function findEditDialog(){
    const heads=[...document.querySelectorAll('h1,h2,h3,h4,strong,b')].filter(el=>visible(el)&&clean(el.textContent)==='แก้ข้อมูลพนักงาน');
    for(const h of heads){
      let cur=h;
      for(let i=0;cur&&i<7;i++,cur=cur.parentElement){
        if(cur.matches?.('[role="dialog"],.modal-card,.dialog,.dialog-card,.modal-content,.sheet,.drawer-card')) return cur;
        const txt=clean(cur.textContent);
        if(txt.includes('ชื่อ–นามสกุล')&&txt.includes('ธนาคาร')&&txt.includes('เลขบัญชี')&&txt.includes('บันทึก')) return cur;
      }
    }
    return null;
  }
  function textInputByLabel(dialog,labelRx){
    const labels=[...dialog.querySelectorAll('label')];
    for(const l of labels){
      if(labelRx.test(clean(l.textContent))){ const input=l.querySelector('input,select,textarea')||l.parentElement?.querySelector('input,select,textarea'); if(input)return input; }
    }
    return null;
  }
  function dialogIdentity(dialog){
    const nameInput=textInputByLabel(dialog,/ชื่อ.?นามสกุล|ชื่อพนักงาน|^ชื่อ$/);
    const name=clean(nameInput?.value||'');
    let lineHint='';
    const lineInput=textInputByLabel(dialog,/LINE|ไลน์/i); if(lineInput) lineHint=clean(lineInput.value||'');
    if(!lineHint){
      const rowName=name;
      const row=[...document.querySelectorAll('.list-card-row,[class*="member-row"],[class*="employee-row"],tr')].find(r=>clean(r.textContent).includes(rowName));
      const m=clean(row?.textContent).match(/LINE\\s*[·:]?\\s*([^\\s]+)/i); if(m)lineHint=m[1];
    }
    return {name,lineHint};
  }
  function findDialogFooter(dialog){
    const buttons=[...dialog.querySelectorAll('button')].filter(visible);
    const save=buttons.find(b=>/^(บันทึก|บันทึกการแก้ไข)$/.test(clean(b.textContent)));
    const cancel=buttons.find(b=>/ยกเลิก/.test(clean(b.textContent)));
    if(save&&cancel){
      let cur=save.parentElement;
      for(let i=0;cur&&i<4;i++,cur=cur.parentElement){ if(cur.contains(cancel)) return cur; }
    }
    return save?.parentElement||null;
  }
  function updateRoleUI(box,role){
    box.dataset.role=role;
    box.querySelectorAll('[data-v914-role]').forEach(b=>b.classList.toggle('is-selected',b.dataset.v914Role===role));
    const current=box.querySelector('.v914-access-current');
    if(current) current.textContent='สิทธิ์ปัจจุบัน: '+ROLE[box.dataset.currentRole||'none'].short;
    const state=box.querySelector('.v914-access-state');
    if(state){ state.className='v914-access-state'; state.textContent=role===(box.dataset.currentRole||'none')?'ยังไม่ได้เปลี่ยนสิทธิ์':'จะบันทึกสิทธิ์พร้อมข้อมูลพนักงาน'; }
  }
  function injectAccess(dialog){
    if(dialog.querySelector('.v914-access-box')) return;
    dialog.classList.add('v914-employee-dialog');
    const id=dialogIdentity(dialog);
    const current=currentRoleFor(id.name,id.lineHint);
    const box=document.createElement('section');
    box.className='v914-access-box'; box.dataset.currentRole=current; box.dataset.role=current;
    box.innerHTML='<div class="v914-access-head"><div><strong>สิทธิ์ Dashboard</strong><small>แก้ข้อมูลพนักงานและสิทธิ์จากหน้าต่างเดียว ไม่ต้องไปเพิ่มสิทธิ์อีกหน้า</small></div><span class="v914-access-current">สิทธิ์ปัจจุบัน: '+ROLE[current].short+'</span></div>'+
      '<div class="v914-role-grid" role="radiogroup" aria-label="สิทธิ์ Dashboard">'+
      '<button type="button" class="v914-role-option" data-v914-role="none"><b>ไม่มีสิทธิ์ Dashboard</b><span>เป็นพนักงานในระบบ แต่ไม่เข้า Dashboard</span></button>'+
      '<button type="button" class="v914-role-option" data-v914-role="approver"><b>ผู้อนุมัติ</b><span>อนุมัติรายการที่ส่งเข้ามา</span></button>'+
      '<button type="button" class="v914-role-option" data-v914-role="accountant"><b>บัญชี / การเงิน</b><span>ตรวจเอกสาร จ่ายเงิน และกระทบยอด</span></button>'+
      '<button type="button" class="v914-role-option" data-v914-role="viewer"><b>ดูอย่างเดียว</b><span>ดู Dashboard ได้ แต่แก้ไขข้อมูลไม่ได้</span></button></div>'+
      '<div class="v914-access-note"><span>i</span><div><b>ใช้สิทธิ์เดิมของระบบ</b> ระบบจะเลือกพนักงานจาก LINE และบันทึกผ่านฟอร์มสิทธิ์เดิมให้อัตโนมัติ</div></div><div class="v914-access-state">ยังไม่ได้เปลี่ยนสิทธิ์</div>';
    const footer=findDialogFooter(dialog);
    if(footer) footer.parentElement.insertBefore(box,footer); else dialog.appendChild(box);
    box.addEventListener('click',e=>{const b=e.target.closest('[data-v914-role]');if(!b)return;updateRoleUI(box,b.dataset.v914Role);});
    updateRoleUI(box,current);
    const sub=[...dialog.querySelectorAll('p,small,.cs,.sub,.subtitle')].find(el=>/ไม่เปลี่ยนสิทธิ์ Dashboard/.test(clean(el.textContent)));
    if(sub){sub.textContent='แก้ข้อมูลรับเงินและสิทธิ์ Dashboard ได้จากจุดเดียว';sub.classList.add('v914-modal-subcopy');}
  }

  function findRoleButton(card,role){
    const wanted=ROLE[role]?.label||'';
    const els=[...card.querySelectorAll('button,[role="button"],label')];
    return els.find(el=>clean(el.textContent)===wanted)||els.find(el=>{
      const t=clean(el.textContent);
      if(role==='accountant') return /บัญชี\\s*\\/\\s*การเงิน/.test(t);
      if(role==='approver') return t==='ผู้อนุมัติ';
      if(role==='viewer') return t==='ดูอย่างเดียว';
      return false;
    })||null;
  }
  function optionContains(select,name){ return [...select.options].some(o=>clean(o.textContent).includes(name)); }
  function employeeSelect(card,name){
    return [...card.querySelectorAll('select')].find(s=>optionContains(s,name))||null;
  }
  function groupSelect(card){
    return [...card.querySelectorAll('select')].find(s=>{
      const parent=clean(s.parentElement?.textContent); const opts=[...s.options].map(o=>clean(o.textContent)).join(' ');
      return /กลุ่ม LINE|กลุ่มไลน์|LINE.*กลุ่ม/i.test(parent)||/เลือกกลุ่ม LINE|เลือกกลุ่มไลน์/i.test(opts);
    })||null;
  }
  function setSelect(select,value){
    select.value=value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));
  }
  async function selectEmployeeThroughGroups(card,name){
    let emp=employeeSelect(card,name);
    if(emp){ const opt=[...emp.options].find(o=>clean(o.textContent).includes(name)); if(opt){setSelect(emp,opt.value);return true;} }
    const grp=groupSelect(card);
    if(!grp) return false;
    const original=grp.value;
    const options=[...grp.options].filter(o=>String(o.value||'').trim()&&!/เลือกกลุ่ม/.test(clean(o.textContent)));
    for(const o of options){
      setSelect(grp,o.value); await sleep(90);
      emp=employeeSelect(card,name);
      const match=emp&&[...emp.options].find(x=>clean(x.textContent).includes(name));
      if(match){setSelect(emp,match.value);return true;}
    }
    if(original)setSelect(grp,original);
    return false;
  }
  function addAccessButton(card){
    const buttons=[...card.querySelectorAll('button')];
    return buttons.find(b=>/เพิ่มสิทธิ์ให้พนักงาน|บันทึกสิทธิ์|เพิ่มสิทธิ์/.test(clean(b.textContent))&&!/วิธี/.test(clean(b.textContent)))||null;
  }
  async function removeAccess(name,lineHint){
    const row=currentAccessRow(name,lineHint); if(!row)return true;
    const b=[...row.querySelectorAll('button,a')].find(x=>/ลบ|ถอน|ยกเลิกสิทธิ์|เอาออก/.test(clean(x.textContent)));
    if(!b) return false;
    b.click(); await sleep(180);
    const confirmBtn=[...document.querySelectorAll('button')].filter(visible).find(x=>/ยืนยัน.*(ลบ|ถอน|ยกเลิก)|^(ลบ|ถอนสิทธิ์)$/.test(clean(x.textContent)));
    if(confirmBtn){confirmBtn.click();await sleep(220);}
    return true;
  }
  async function applyPermission(name,lineHint,role,oldRole,state){
    if(applying||!name||role===oldRole) return true;
    applying=true;
    try{
      if(typeof window.renderBusiness==='function'){try{window.renderBusiness();}catch{}}
      await sleep(80);
      const card=accessCard();
      if(!card){throw new Error('ไม่พบระบบสิทธิ์เดิม');}
      if(role==='none'){
        const ok=await removeAccess(name,lineHint);
        if(!ok) throw new Error('หาเมนูถอนสิทธิ์เดิมไม่เจอ');
        if(state){state.className='v914-access-state ok';state.textContent='บันทึกข้อมูลและถอนสิทธิ์แล้ว';}
        toast('บันทึกข้อมูลและสิทธิ์พนักงานแล้ว');
        return true;
      }
      const roleBtn=findRoleButton(card,role);
      if(!roleBtn) throw new Error('ไม่พบตัวเลือก '+ROLE[role].label);
      roleBtn.click(); await sleep(60);
      const found=await selectEmployeeThroughGroups(card,name);
      if(!found) throw new Error('ไม่พบพนักงานนี้ในรายชื่อ LINE ที่ใช้กำหนดสิทธิ์');
      const save=addAccessButton(card);
      if(!save) throw new Error('ไม่พบปุ่มบันทึกสิทธิ์เดิม');
      save.click();
      if(state){state.className='v914-access-state ok';state.textContent='ส่งคำสั่งบันทึกสิทธิ์แล้ว';}
      toast('บันทึกข้อมูลและสิทธิ์พนักงานแล้ว');
      await sleep(260);
      annotateRows();
      return true;
    }catch(err){
      console.warn('${MARK} permission save',err);
      if(state){state.className='v914-access-state warn';state.textContent='ข้อมูลพนักงานบันทึกแล้ว แต่สิทธิ์ยังไม่เปลี่ยน: '+err.message;}
      toast('ข้อมูลพนักงานบันทึกแล้ว แต่สิทธิ์ยังไม่เปลี่ยน — '+err.message,true);
      return false;
    }finally{applying=false;}
  }

  function bindModalSave(dialog){
    if(dialog.dataset.v914SaveBound==='1')return;
    dialog.dataset.v914SaveBound='1';
    dialog.addEventListener('click',e=>{
      const save=e.target.closest('button'); if(!save||!/^(บันทึก|บันทึกการแก้ไข)$/.test(clean(save.textContent)))return;
      const box=dialog.querySelector('.v914-access-box'); if(!box)return;
      const id=dialogIdentity(dialog); const role=box.dataset.role||'none'; const oldRole=box.dataset.currentRole||'none'; const state=box.querySelector('.v914-access-state');
      // ให้ระบบเดิมบันทึกข้อมูลพนักงานก่อน แล้วค่อยใช้ฟอร์มสิทธิ์เดิมที่ซ่อนไว้
      setTimeout(()=>applyPermission(id.name,id.lineHint,role,oldRole,state),260);
    },true);
  }

  function employeeRows(){
    const scope=document.getElementById('biz-team')||document;
    return [...scope.querySelectorAll('.list-card-row,[class*="employee-row"],[class*="member-row"],tr')].filter(row=>{
      const t=clean(row.textContent);return t&&[...row.querySelectorAll('button')].some(b=>/แก้ข้อมูล|แก้ไข/.test(clean(b.textContent)));
    });
  }
  function rowName(row){
    const candidate=row.querySelector('strong,b,[class*="name"]');
    if(candidate)return clean(candidate.textContent);
    const btn=[...row.querySelectorAll('button')].find(b=>/แก้ข้อมูล|แก้ไข/.test(clean(b.textContent)));
    const clone=row.cloneNode(true); clone.querySelectorAll('button').forEach(b=>b.remove());
    return clean(clone.textContent).split(' ')[0]||clean(btn?.dataset?.name||'');
  }
  function annotateRows(){
    employeeRows().forEach(row=>{
      const name=rowName(row); if(!name)return;
      const role=currentRoleFor(name,'');
      let badge=row.querySelector('.v914-row-access');
      if(!badge){badge=document.createElement('span');badge.className='v914-row-access';const first=row.querySelector('strong,b,[class*="name"]');if(first)first.insertAdjacentElement('afterend',badge);else row.prepend(badge);}
      badge.className='v914-row-access is-'+role;badge.textContent=ROLE[role].short;
      row.querySelectorAll('button').forEach(b=>{if(clean(b.textContent)==='แก้ข้อมูล'){b.textContent='แก้ข้อมูล / สิทธิ์';b.classList.add('v914-edit-access-btn');}});
    });
  }
  function hideStandaloneAccess(){
    const card=accessCard(); if(card){card.classList.add('v914-access-engine');card.closest('.v913-permission-shell')?.classList.add('v914-access-engine');}
  }
  function audit(){
    scheduled=false;timer=0;
    if(!routeTeam()){root.classList.remove('v914-team-access');return;}
    root.classList.add('v914-team-access');
    hideStandaloneAccess(); annotateRows();
    const dialog=findEditDialog(); if(dialog){injectAccess(dialog);bindModalSave(dialog);}
    window.__RUBJAI_DASHBOARD_VERSION__=VERSION;
  }
  function schedule(delay=45){if(!routeTeam()||scheduled)return;scheduled=true;clearTimeout(timer);timer=setTimeout(audit,delay);}
  function attach(){
    observer?.disconnect();observer=null;
    if(!routeTeam()){root.classList.remove('v914-team-access');return;}
    audit();observer=new MutationObserver(()=>schedule(55));observer.observe(document.body,{childList:true,subtree:true});
  }
  document.addEventListener('click',e=>{
    if(!routeTeam())return;
    const b=e.target.closest('button'); if(b&&/แก้ข้อมูล|แก้ไข/.test(clean(b.textContent)))setTimeout(schedule,0);
  },true);
  addEventListener('popstate',()=>setTimeout(()=>{if(location.href!==lastHref){lastHref=location.href;attach();}},0));
  setInterval(()=>{if(location.href!==lastHref){lastHref=location.href;attach();}},500);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
  console.info('${MARK}',VERSION);
})();
`;

fs.writeFileSync(cssFile, css, 'utf8');
fs.writeFileSync(jsFile, js, 'utf8');
execFileSync(process.execPath, ['--check', jsFile], { stdio: 'pipe' });

let html = fs.readFileSync(indexFile, 'utf8');
html = html.replace(/\s*<link[^>]+href=["']\.\/assets\/employee-modal-access-v914\.css[^>]*>\s*/gi, '\n');
html = html.replace(/\s*<script[^>]+src=["']\.\/assets\/employee-modal-access-v914\.js[^>]*><\/script>\s*/gi, '\n');
if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) throw new Error('v9.14 invalid index.html');
html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="./assets/employee-modal-access-v914.css?v=${VERSION}.${BUILD_DATE}">\n</head>`);
html = html.replace(/<\/body>/i, `  <script src="./assets/employee-modal-access-v914.js?v=${VERSION}.${BUILD_DATE}"></script>\n</body>`);
html = html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i, `$1Dashboard v${VERSION}`);
fs.writeFileSync(indexFile, html, 'utf8');

if (fs.existsSync(packageFile)) {
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  pkg.version = VERSION;
  const deploy = String(pkg?.scripts?.deploy || '');
  if (deploy && !deploy.includes(SELF)) {
    const idx = deploy.lastIndexOf('wrangler deploy');
    const hook = `node ${SELF}`;
    if (idx >= 0) {
      const left = deploy.slice(0, idx).replace(/\s*&&\s*$/, '').trimEnd();
      pkg.scripts.deploy = `${left} && ${hook} && ${deploy.slice(idx)}`;
    } else pkg.scripts.deploy = `${deploy} && ${hook}`;
  }
  fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

const outHtml=fs.readFileSync(indexFile,'utf8');
const outJs=fs.readFileSync(jsFile,'utf8');
const outCss=fs.readFileSync(cssFile,'utf8');
const pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));
const checks={
  cssLinked:outHtml.includes(`employee-modal-access-v914.css?v=${VERSION}.${BUILD_DATE}`),
  jsLinked:outHtml.includes(`employee-modal-access-v914.js?v=${VERSION}.${BUILD_DATE}`),
  modalRoleUI:outJs.includes('สิทธิ์ Dashboard')&&outJs.includes('บัญชี / การเงิน')&&outJs.includes('ดูอย่างเดียว'),
  nativeAccessReuse:outJs.includes("dashboardAccessCard")&&outJs.includes('selectEmployeeThroughGroups')&&outJs.includes('addAccessButton'),
  routeScoped:outJs.includes("u.searchParams.get('biz')==='team'")&&outJs.includes("childList:true,subtree:true")&&!outJs.includes('characterData:true'),
  standaloneHidden:outCss.includes('v914-access-engine'),
  packageHook:pkg.version===VERSION&&String(pkg.scripts.deploy).includes(SELF),
};
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
if(failed.length)throw new Error('v9.14 audit failed: '+failed.join(', '));
fs.writeFileSync(path.join(root,'AUDIT_V914.json'),JSON.stringify({version:VERSION,mark:MARK,checks},null,2)+'\n','utf8');

console.log(`✅ Dashboard v${VERSION}`);
console.log('✅ Employee edit modal now includes Dashboard access role');
console.log('✅ Employee data and access permission can be saved from one modal');
console.log('✅ Existing dashboardAccessCard is reused as the permission engine; backend/API logic is not duplicated');
console.log('✅ Standalone add-permission card is hidden from the team page to remove duplicate workflow');
console.log('✅ Employee rows show current access role and Edit becomes แก้ข้อมูล / สิทธิ์');
console.log('✅ Runtime observer remains route-scoped and childList-only');
