import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const VERSION = '9.15.0';
const BUILD_DATE = '20260821';
const SELF = 'apply-v915-employee-modal-composition.mjs';
const MARK = 'RUBJAI_V915_EMPLOYEE_MODAL_COMPOSITION_20260821';

const indexFile = path.join(root, 'index.html');
const packageFile = path.join(root, 'package.json');
const assetsDir = path.join(root, 'assets');
const cssFile = path.join(assetsDir, 'employee-modal-composition-v915.css');
const jsFile = path.join(assetsDir, 'employee-modal-composition-v915.js');

if (!fs.existsSync(indexFile)) throw new Error('v9.15 missing index.html');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const css = `/* ${MARK} */
/* Modal frame: wider, centered, vertical-scroll only. Never create horizontal scroll. */
.v915-employee-modal-frame{
  width:min(760px,calc(100vw - 32px))!important;
  max-width:760px!important;
  min-width:0!important;
  max-height:calc(100dvh - 32px)!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
}
.v914-employee-dialog.v915-employee-dialog{
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
  max-height:calc(100dvh - 32px)!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  overscroll-behavior:contain;
  scrollbar-gutter:stable;
  box-sizing:border-box!important;
}
.v915-employee-dialog *,
.v915-employee-modal-frame *{
  box-sizing:border-box;
  min-width:0;
}
.v915-employee-dialog input,
.v915-employee-dialog select,
.v915-employee-dialog textarea,
.v915-employee-dialog button{
  max-width:100%!important;
}

/* Keep the employee fields readable and prevent inherited fixed widths. */
.v915-employee-dialog form,
.v915-employee-dialog [class*="form"],
.v915-employee-dialog [class*="field"],
.v915-employee-dialog [class*="grid"]{
  max-width:100%!important;
}

/* Access section becomes part of the form instead of a large nested card. */
.v915-employee-dialog .v914-access-box{
  margin:14px 0 0!important;
  padding:14px 0 2px!important;
  border:0!important;
  border-top:1px solid rgba(17,22,46,.10)!important;
  border-radius:0!important;
  background:transparent!important;
  width:100%!important;
  max-width:100%!important;
  overflow:hidden!important;
}
.v915-employee-dialog .v914-access-head{
  align-items:center!important;
  gap:10px!important;
  margin-bottom:10px!important;
}
.v915-employee-dialog .v914-access-head strong{
  font-size:13px!important;
  font-weight:800!important;
}
.v915-employee-dialog .v914-access-head small{
  margin-top:2px!important;
  font-size:10px!important;
  line-height:1.35!important;
}
.v915-employee-dialog .v914-access-current{
  padding:4px 7px!important;
  font-size:9.5px!important;
  white-space:nowrap!important;
}
.v915-employee-dialog .v914-role-grid{
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:8px!important;
  width:100%!important;
}
.v915-employee-dialog .v914-role-option{
  width:100%!important;
  min-width:0!important;
  min-height:58px!important;
  padding:9px 10px!important;
  border-radius:12px!important;
  white-space:normal!important;
  overflow-wrap:anywhere!important;
}
.v915-employee-dialog .v914-role-option b{
  font-size:11.5px!important;
  line-height:1.25!important;
}
.v915-employee-dialog .v914-role-option span{
  margin-top:2px!important;
  font-size:9.5px!important;
  line-height:1.3!important;
}
.v915-employee-dialog .v914-access-note{
  margin-top:8px!important;
  padding:8px 10px!important;
  border-radius:10px!important;
  background:#F7F8FA!important;
  font-size:9.5px!important;
  line-height:1.35!important;
}
.v915-employee-dialog .v914-access-state{
  margin-top:6px!important;
  min-height:14px!important;
  font-size:9.5px!important;
}

/* The actual save/cancel row stays visible while the form scrolls. */
.v915-modal-actions{
  position:sticky!important;
  bottom:-1px!important;
  z-index:4!important;
  margin:12px -2px -2px!important;
  padding:12px 2px 2px!important;
  background:linear-gradient(to bottom,rgba(255,255,255,.92),#fff 28%)!important;
  border-top:1px solid rgba(17,22,46,.08)!important;
}

/* Remove any scrollbar forced by the old inner composition. */
.v915-employee-dialog::-webkit-scrollbar{width:8px;height:0}
.v915-employee-dialog::-webkit-scrollbar-thumb{background:#D7DCE5;border-radius:999px}
.v915-employee-dialog::-webkit-scrollbar-track{background:transparent}

@media(max-width:720px){
  .v915-employee-modal-frame{
    width:calc(100vw - 20px)!important;
    max-width:none!important;
    max-height:calc(100dvh - 20px)!important;
  }
  .v914-employee-dialog.v915-employee-dialog{
    max-height:calc(100dvh - 20px)!important;
    scrollbar-gutter:auto;
  }
  .v915-employee-dialog .v914-access-head{
    display:flex!important;
  }
  .v915-employee-dialog .v914-role-grid{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
}
@media(max-width:500px){
  .v915-employee-dialog .v914-role-grid{grid-template-columns:1fr!important}
  .v915-employee-dialog .v914-access-current{display:none!important}
  .v915-employee-dialog .v914-role-option{min-height:52px!important}
}
`;

const js = `/* ${MARK} */
(() => {
  'use strict';
  const VERSION='${VERSION}';
  const clean=s=>String(s||'').replace(/\\s+/g,' ').trim();

  function routeTeam(){
    try{const u=new URL(location.href);return u.searchParams.get('page')==='business'&&u.searchParams.get('biz')==='team';}
    catch{return false;}
  }
  function visible(el){
    if(!el||el.hidden||el.getAttribute('aria-hidden')==='true')return false;
    const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden';
  }
  function findDialog(){
    const heads=[...document.querySelectorAll('h1,h2,h3,h4,strong,b')]
      .filter(el=>visible(el)&&clean(el.textContent)==='แก้ข้อมูลพนักงาน');
    for(const h of heads){
      let cur=h;
      for(let i=0;cur&&i<8;i++,cur=cur.parentElement){
        const t=clean(cur.textContent);
        if(cur.classList?.contains('v914-employee-dialog'))return cur;
        if(t.includes('ชื่อ–นามสกุล')&&t.includes('ธนาคาร')&&t.includes('เลขบัญชี')&&t.includes('บันทึก'))return cur;
      }
    }
    return document.querySelector('.v914-employee-dialog');
  }
  function markFrames(dialog){
    dialog.classList.add('v915-employee-dialog');
    const seen=[];
    let cur=dialog;
    for(let i=0;cur&&i<5;i++,cur=cur.parentElement){
      if(cur===document.body||cur===document.documentElement)break;
      const r=cur.getBoundingClientRect();
      if(r.width>=300&&r.width<Math.min(innerWidth*.96,900)&&r.height>=220){
        seen.push(cur);
      }
    }
    // Mark dialog and only the nearest plausible white-card ancestors; never the full-screen backdrop.
    seen.slice(0,3).forEach(el=>el.classList.add('v915-employee-modal-frame'));
  }
  function markActions(dialog){
    const buttons=[...dialog.querySelectorAll('button')].filter(visible);
    const save=buttons.find(b=>/^(บันทึก|บันทึกการแก้ไข)$/.test(clean(b.textContent)));
    const cancel=buttons.find(b=>/^ยกเลิก$/.test(clean(b.textContent)));
    if(!save)return;
    let p=save.parentElement;
    for(let i=0;p&&i<4;i++,p=p.parentElement){
      if(!cancel||p.contains(cancel)){p.classList.add('v915-modal-actions');break;}
    }
  }
  function compose(){
    if(!routeTeam())return false;
    const dialog=findDialog();
    if(!dialog||!visible(dialog))return false;
    markFrames(dialog);
    markActions(dialog);
    return true;
  }
  function retry(){[0,40,100,220,420].forEach(ms=>setTimeout(compose,ms));}
  document.addEventListener('click',e=>{
    if(!routeTeam())return;
    const b=e.target?.closest?.('button,a,[role="button"]');
    if(!b)return;
    const t=clean(b.textContent);
    if(/แก้ข้อมูล/.test(t))retry();
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',retry,{once:true});
  else retry();
  window.__RUBJAI_DASHBOARD_VERSION__=VERSION;
  console.info('${MARK}',VERSION);
})();
`;

fs.writeFileSync(cssFile, css, 'utf8');
fs.writeFileSync(jsFile, js, 'utf8');
execFileSync(process.execPath, ['--check', jsFile], {stdio:'pipe'});

let html=fs.readFileSync(indexFile,'utf8');
html=html.replace(/\s*<link[^>]+href=["']\.\/assets\/employee-modal-composition-v915\.css[^>]*>\s*/gi,'\n');
html=html.replace(/\s*<script[^>]+src=["']\.\/assets\/employee-modal-composition-v915\.js[^>]*><\/script>\s*/gi,'\n');
html=html.replace(/<\/head>/i,`  <link rel="stylesheet" href="./assets/employee-modal-composition-v915.css?v=${VERSION}.${BUILD_DATE}">\n</head>`);
html=html.replace(/<\/body>/i,`  <script src="./assets/employee-modal-composition-v915.js?v=${VERSION}.${BUILD_DATE}"></script>\n</body>`);
html=html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i,`$1Dashboard v${VERSION}`);
fs.writeFileSync(indexFile,html,'utf8');

if(fs.existsSync(packageFile)){
  const pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));
  pkg.version=VERSION;
  const deploy=String(pkg?.scripts?.deploy||'');
  if(deploy&&!deploy.includes(SELF)){
    const idx=deploy.lastIndexOf('wrangler deploy');
    const hook=`node ${SELF}`;
    if(idx>=0){
      const left=deploy.slice(0,idx).replace(/\s*&&\s*$/,'').trimEnd();
      pkg.scripts.deploy=`${left} && ${hook} && ${deploy.slice(idx)}`;
    }else pkg.scripts.deploy=`${deploy} && ${hook}`;
  }
  fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n','utf8');
}

const out=fs.readFileSync(indexFile,'utf8');
const checks={
  css:fs.existsSync(cssFile),
  js:fs.existsSync(jsFile),
  cssLinked:out.includes('employee-modal-composition-v915.css?v=9.15.0.20260821'),
  jsLinked:out.includes('employee-modal-composition-v915.js?v=9.15.0.20260821'),
  noHorizontalScroll:css.includes('overflow-x:hidden!important'),
  compactRoleGrid:css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),
  stickyActions:css.includes('.v915-modal-actions'),
};
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
if(failed.length)throw new Error('v9.15 audit failed: '+failed.join(', '));
fs.writeFileSync(path.join(root,'AUDIT_V915.json'),JSON.stringify({version:VERSION,mark:MARK,checks},null,2)+'\n','utf8');
console.log(`✅ Dashboard v${VERSION}`);
console.log('✅ Employee edit modal composition widened without clipping');
console.log('✅ Horizontal scrollbar removed; modal uses vertical scroll only');
console.log('✅ Dashboard access section compacted into the employee form');
console.log('✅ Save / cancel actions stay visible at the bottom');
