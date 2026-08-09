/* Dashboard Core SME v7.3 — focused production UI */
const API = "https://accoutingsuppor02.organization-23c.workers.dev/api/expenses";
const WORKER = "https://accoutingsuppor02.organization-23c.workers.dev";
const QS = new URLSearchParams(location.search);
const TENANT = QS.get("tenant") || "";
const K = QS.get("k") || "";
const CONAME = QS.get("name") || "บริษัทของคุณ";
const ROUTE_PAGE_RAW = QS.get("page") || "overview";
const ROUTE_PAGE = ROUTE_PAGE_RAW === "reimburse" ? "batches" : ROUTE_PAGE_RAW;
const ROUTE_BIZ = QS.get("biz") || "profile";
const EXPENSE_DATA_PAGES = new Set(["overview","expenses","reports","bills","activity","settings","business"]);
let ROUTE_BOOTSTRAPPING = true;
let CONNECTED = false;
let SETTINGS = {};
let WORKSPACE_LINKS = {sheetUrl:"",driveUrl:""};
let TEAM_EDIT_INDEX = -1;
let FINANCE_EDIT_INDEX = -1;
let TEAM_RENDERED = [];
let BUSINESS_TAB = "profile";
let EMAIL_DOCS = [];
let SUBSCRIPTIONS = [];
let PLAN_INFO = {};
let PLAN_CYCLE = "monthly";
let EMAIL_INFO = {};
let EMAIL_LOADING = false;
let EMAIL_SYNCING = false;
let BATCH_DATA = {pending:{groups:[],itemCount:0,total:0,urgentCount:0,people:0},batches:[],settings:{}};
let RECON_DATA = {rows:[],paidBatches:[],summary:{}};
let INCOME_DATA = {ok:true,records:[],payments:[],reconciliation:[],reconciliationSummary:{},summary:{},categories:[]};
let INCOME_LOADING = false;
let ACTIVE_INCOME_ID = "";
let RECON_LOADING = false;
let RECON_FILTER = "all";
let ACTIVE_RECON_ID = "";
let RECON_CHANNEL_ID = "";
let BATCH_LOADING = false;
let BATCH_STAGE = "all";
let ACTIVE_BATCH_ID = "";
let REJECT_BATCH_ID = "";
let PAYMENT_BATCH_ID = "";
let BATCH_POLL_TICK = 0;
const BATCH_SELECTED = new Set();
const REVIEW_BATCH_SELECTED = new Set();
const TRANSFER_SELECTED = new Set();

// Performance v5.8: ยังซิงก์อัตโนมัติ แต่ลด request/render churn ที่ไม่จำเป็น
// ปุ่ม “อัปเดต” ยังสั่งซิงก์ทันทีได้เหมือนเดิม
const REFRESH_MS = 60000;
const FOREGROUND_DEBOUNCE_MS = 15000;
const EXPENSE_PAGE_SIZE = 100;
const INCOME_PAGE_SIZE = 100;
const DOCUMENT_PAGE_SIZE = 100;
const ACTIVITY_PAGE_SIZE = 150;
const BATCH_PAGE_SIZE = 100;
const EMAIL_PAGE_SIZE = 100;
const RECON_PAGE_SIZE = 100;
let EXPENSE_PAGE = 1;
let INCOME_PAGE = 1;
let DOCUMENT_PAGE = 1;
let ACTIVITY_PAGE = 1;
let BATCH_PAGE = 1;
let EMAIL_PAGE = 1;
let RECON_PAGE = 1;
let XLSX_LOADING_PROMISE = null;
let ALL = [];
let LAST_SIGNATURE = "";
let REFRESH_TIMER = null;
let REFRESHING = false;
let HAS_LOADED = false;
let EMAIL_POLL_TICK = 0;
let LAST_FOREGROUND_REFRESH = 0;
// v7.4 Resilient Mobile Load: never destroy the Dashboard on a transient network/API error.
const DASH_CACHE_KEY=`dashboard:last-good:${TENANT}`;
const DASH_CACHE_MAX_ROWS=750;
const DASH_CACHE_MAX_BYTES=3_500_000;
let DASH_RETRY_TIMER=null;
let DASH_FAILURE_COUNT=0;
let DASH_AUTH_BLOCKED=false;
const SETTINGS_SIGNAL_KEY=`document-settings-updated:${TENANT}`;
const SIGNATURE_READY_KEY=`signature-ready:${TENANT}`;
let LAST_SETTINGS_SIGNAL=localStorage.getItem(SETTINGS_SIGNAL_KEY)||"";
let COMPANY_SETUP_ACTIVE="";


const el=id=>document.getElementById(id);

function routeUrl(page,extra={}){
  const q=new URLSearchParams(location.search);
  q.set("page",page||"overview");
  if(extra.biz)q.set("biz",extra.biz);else q.delete("biz");
  return `${location.pathname}?${q.toString()}`;
}
function hardNavigate(page,extra={}){
  const next=page==="reimburse"?"batches":page;
  const current=currentPageKey();
  if(next===current && (!extra.biz || extra.biz===BUSINESS_TAB))return false;
  location.assign(routeUrl(next,extra));
  return true;
}

function currentPageKey(){
  const node=document.querySelector(".page.show");
  return node?.id?.replace(/^page-/,"")||"overview";
}
function releaseImageNodes(root){
  if(!root)return;
  root.querySelectorAll?.("img").forEach(img=>{try{img.removeAttribute("srcset");img.src="";}catch{}});
}
function releasePageDom(page){
  const ids={expenses:["rows","expenseDrawerBody"],income:["incomeBody","incomeReconList"],bills:["billGrid"],activity:["activityRows"],email:["emailList"],subscriptions:["subscriptionList"],batches:["batchMasterBody","batchDrawerBody"],reconciliation:["reconBody","reconDrawerBody"],reports:["repCatBody"]}[page]||[];
  ids.forEach(id=>{const node=el(id);if(node){releaseImageNodes(node);node.replaceChildren();}});
}
function releasePageData(page,nextPage=""){
  if(page==="batches"&&nextPage!=="batches"){BATCH_DATA={pending:{groups:[],itemCount:0,total:0,urgentCount:0,people:0},batches:[],settings:{}};BATCH_SELECTED.clear();REVIEW_BATCH_SELECTED.clear();TRANSFER_SELECTED.clear();}
  if(page==="reconciliation"&&nextPage!=="reconciliation"){RECON_DATA={rows:[],paidBatches:[],summary:{}};ACTIVE_RECON_ID="";}
  if(page==="income"&&nextPage!=="income"){INCOME_DATA={ok:true,records:[],payments:[],reconciliation:[],reconciliationSummary:{},summary:{},categories:[]};}
  const emailFamily=new Set(["email","subscriptions"]);if(emailFamily.has(page)&&!emailFamily.has(nextPage))EMAIL_DOCS=[];
}
function renderLocalPage(page=currentPageKey()){
  if(page==="overview"){renderKPIs();renderTrend();renderCats();renderVendors();renderRecent();return;}
  if(page==="expenses"){renderExp();return;}
  if(page==="reports"){buildRepMonths();renderReport();return;}
  if(page==="bills"){renderBills();return;}
  if(page==="activity"){renderActivity();return;}
  if(page==="settings"){renderSettings();return;}
  if(page==="business"){renderBusiness();return;}
  if(page==="reimburse"){renderReim();return;}
  if(page==="email"){renderEmailInbox();return;}
  if(page==="subscriptions"){renderSubscriptions();return;}
  if(page==="batches"){renderBatches();return;}
  if(page==="reconciliation"){renderReconciliation();return;}
  if(page==="income"){renderIncome();return;}
  if(page==="billing"){renderSubscription();return;}
}
function closeGlobalModal(){
  const modal=el("modal"),body=el("modalBody");
  if(modal)modal.classList.remove("show");
  setTimeout(()=>{if(body&&(!modal||!modal.classList.contains("show"))){releaseImageNodes(body);body.replaceChildren();}},80);
}
function ensureXlsx(){
  if(window.XLSX)return Promise.resolve(window.XLSX);
  if(XLSX_LOADING_PROMISE)return XLSX_LOADING_PROMISE;
  XLSX_LOADING_PROMISE=new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    s.async=true;
    s.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error("โหลดตัวอ่าน Excel ไม่สำเร็จ"));
    s.onerror=()=>reject(new Error("โหลดตัวอ่าน Excel ไม่สำเร็จ กรุณาลองใหม่หรือใช้ CSV"));
    document.head.appendChild(s);
  }).catch(err=>{XLSX_LOADING_PROMISE=null;throw err;});
  return XLSX_LOADING_PROMISE;
}

// แสดงสถานะรอสำหรับทุกคำสั่ง POST และกันการกดซ้ำระหว่างระบบทำงาน
let OPERATION_DEPTH=0;
let OPERATION_SHOW_TIMER=null;
let OPERATION_SLOW_TIMER=null;
let OPERATION_VERY_SLOW_TIMER=null;
let OPERATION_SHOWN_AT=0;
let LAST_OPERATION_ACTION={text:"",node:null,at:0};
const NATIVE_FETCH=window.fetch.bind(window);

function operationClean(value){return String(value||"").replace(/\s+/g," ").trim();}
function operationCopy(text){
  const t=operationClean(text);
  if(/ตีกลับ|ส่งกลับ|แก้ไข/.test(t))return ["กำลังตีกลับเอกสาร…","ระบบกำลังบันทึกเหตุผลและแจ้งกลับไปยัง LINE"];
  if(/เอกสารผ่าน|ตรวจเอกสาร|ตรวจและยืนยัน|อนุมัติ/.test(t))return ["กำลังตรวจเอกสาร…","ระบบกำลังสร้างเอกสารและอัปเดตสถานะ กรุณาอย่ากดซ้ำ"];
  if(/โอน|จ่าย|หลักฐาน/.test(t))return ["กำลังบันทึกการโอน…","ระบบกำลังอัปโหลดหลักฐาน บันทึกสถานะ และแจ้ง LINE"];
  if(/สร้าง|รวม|ใบเบิก|PDF/.test(t))return ["กำลังสร้างใบเบิก…","ระบบกำลังรวมรายการและจัดทำเอกสาร PDF"];
  if(/ซิงก์|อัปเดต|refresh/i.test(t))return ["กำลังอัปเดตข้อมูล…","กำลังอ่านข้อมูลล่าสุดจากระบบ"];
  if(/อัปโหลด|upload/i.test(t))return ["กำลังอัปโหลดไฟล์…","กรุณาอย่าปิดหน้านี้จนกว่าการอัปโหลดจะเสร็จ"];
  if(/เชื่อม|connect|login/i.test(t))return ["กำลังเชื่อมต่อ…","ระบบกำลังตรวจสอบและบันทึกการเชื่อมต่อ"];
  if(/บันทึก|ยืนยัน|save|confirm/i.test(t))return ["กำลังบันทึกข้อมูล…","ระบบกำลังทำงาน กรุณาอย่ากดซ้ำหรือปิดหน้านี้"];
  return ["กำลังดำเนินการ…","ระบบกำลังทำงาน กรุณาอย่ากดซ้ำหรือปิดหน้านี้"];
}
function operationCurrentText(){return Date.now()-LAST_OPERATION_ACTION.at<8000?LAST_OPERATION_ACTION.text:"";}
function operationSetCopy(title,detail){if(el("operationTitle"))el("operationTitle").textContent=title;if(el("operationDetail"))el("operationDetail").textContent=detail;}
function operationLockAction(){
  const node=LAST_OPERATION_ACTION.node;
  if(!node||!node.isConnected||node.dataset.operationLock==="1")return;
  node.dataset.operationLock="1";
  node.dataset.operationWasDisabled=node.disabled?"1":"0";
  if("disabled" in node)node.disabled=true;
}
function operationUnlockAction(){
  const node=LAST_OPERATION_ACTION.node;
  if(!node||!node.isConnected||node.dataset.operationLock!=="1")return;
  if("disabled" in node&&node.dataset.operationWasDisabled!=="1")node.disabled=false;
  delete node.dataset.operationLock;
  delete node.dataset.operationWasDisabled;
}
function beginOperation(label=""){
  OPERATION_DEPTH+=1;
  operationLockAction();
  const [title,detail]=operationCopy(label||operationCurrentText());
  clearTimeout(OPERATION_SHOW_TIMER);
  OPERATION_SHOW_TIMER=setTimeout(()=>{
    if(OPERATION_DEPTH<1)return;
    operationSetCopy(title,detail);
    el("operationOverlay").hidden=false;
    document.body.classList.add("operation-busy");
    OPERATION_SHOWN_AT=Date.now();
    clearTimeout(OPERATION_SLOW_TIMER);
    clearTimeout(OPERATION_VERY_SLOW_TIMER);
    OPERATION_SLOW_TIMER=setTimeout(()=>{if(OPERATION_DEPTH>0)operationSetCopy(title,"ยังทำงานอยู่… บางขั้นตอนต้องสร้าง PDF และแจ้ง LINE");},5000);
    OPERATION_VERY_SLOW_TIMER=setTimeout(()=>{if(OPERATION_DEPTH>0)operationSetCopy(title,"ใช้เวลานานกว่าปกติ แต่ระบบยังทำงานอยู่ กรุณารอต่อและอย่ากดซ้ำ");},15000);
  },160);
}
function endOperation(){
  OPERATION_DEPTH=Math.max(0,OPERATION_DEPTH-1);
  if(OPERATION_DEPTH>0)return;
  clearTimeout(OPERATION_SHOW_TIMER);
  clearTimeout(OPERATION_SLOW_TIMER);
  clearTimeout(OPERATION_VERY_SLOW_TIMER);
  const wait=Math.max(0,420-(Date.now()-OPERATION_SHOWN_AT));
  setTimeout(()=>{
    if(OPERATION_DEPTH>0)return;
    if(el("operationOverlay"))el("operationOverlay").hidden=true;
    document.body.classList.remove("operation-busy");
    operationUnlockAction();
  },wait);
}

document.addEventListener("pointerdown",event=>{
  const node=event.target.closest("button,a,[role=button],input[type=submit]");
  if(!node)return;
  LAST_OPERATION_ACTION={text:operationClean(node.textContent||node.value||node.getAttribute("aria-label")||""),node,at:Date.now()};
},true);

document.addEventListener("click",event=>{
  const node=event.target.closest("button,[role=button],input[type=submit]");
  if(!node)return;
  if(node.dataset.operationLock==="1"){
    event.preventDefault();
    event.stopImmediatePropagation();
  }
},true);

window.fetch=async function(input,init){
  const method=operationClean((init&&init.method)||(input&&input.method)||"GET").toUpperCase();
  const shouldWait=!['GET','HEAD','OPTIONS'].includes(method);
  if(shouldWait)beginOperation(operationCurrentText());
  try{return await NATIVE_FETCH(input,init);}
  finally{if(shouldWait)endOperation();}
};



const THMON=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const baht=n=>"฿"+Number(n||0).toLocaleString("th-TH",{minimumFractionDigits:0,maximumFractionDigits:2});
let RANGE="this";

// ปี พ.ศ. → ค.ศ. + parse
function pdate(s){
  if(!s) return null;
  const m=String(s).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(!m) return null;
  let y=+m[1]; if(y>2400) y-=543;
  return new Date(y,+m[2]-1,+m[3]);
}
function cdate(s){
  if(!s) return null;
  const d=new Date(s);
  return Number.isNaN(d.getTime())?null:d;
}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function fmtDate(d,withTime=false){
  if(!d) return "—";
  const opt={day:"numeric",month:"short",year:"numeric"};
  if(withTime){opt.hour="2-digit";opt.minute="2-digit";}
  return d.toLocaleString("th-TH",opt);
}
function dateFor(r,basis="transaction"){return basis==="recorded"?cdate(r.createdAt):pdate(r.dateISO||r.date);}
function dayGap(r){
  const tx=pdate(r.dateISO||r.date), cr=cdate(r.createdAt);
  if(!tx||!cr) return null;
  const a=Date.UTC(tx.getFullYear(),tx.getMonth(),tx.getDate());
  const b=Date.UTC(cr.getFullYear(),cr.getMonth(),cr.getDate());
  return Math.round((b-a)/86400000);
}
function gapBadge(r){
  const gap=dayGap(r);
  if(gap==null||gap===0) return "";
  if(gap>0) return `<span class="late">ย้อนหลัง ${gap} วัน</span>`;
  return `<span class="late future">วันที่รายการหลังวันบันทึก ${Math.abs(gap)} วัน</span>`;
}
function inRange(r,basis="transaction"){
  const d=dateFor(r,basis); if(!d) return RANGE==="all";
  const now=new Date();
  if(RANGE==="all") return true;
  if(RANGE==="this") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  if(RANGE==="last"){const lm=new Date(now.getFullYear(),now.getMonth()-1,1);return d.getMonth()===lm.getMonth()&&d.getFullYear()===lm.getFullYear();}
  return true;
}
const scoped=(basis="transaction")=>ALL.filter(r=>inRange(r,basis));

/* ---------- OVERVIEW ---------- */
function renderKPIs(){
  const D=scoped();
  const total=D.reduce((s,r)=>s+ +r.amount,0);
  const pend=D.filter(r=>r.status==="รอเบิก"), paid=D.filter(r=>r.status==="จ่ายแล้ว");
  el("kSpend").textContent=baht(total);
  el("kCount").textContent=D.length;
  el("kPending").textContent=baht(pend.reduce((s,r)=>s+ +r.amount,0)); el("kPendingCount").textContent=pend.length+" รายการ";
  el("kPaid").textContent=baht(paid.reduce((s,r)=>s+ +r.amount,0)); el("kPaidCount").textContent=paid.length+" รายการ";
  // เทียบเดือนนี้ vs เดือนก่อน
  const now=new Date();
  const sumMon=(mo,yr)=>ALL.filter(r=>{const d=pdate(r.date);return d&&d.getMonth()===mo&&d.getFullYear()===yr;}).reduce((s,r)=>s+ +r.amount,0);
  const cur=sumMon(now.getMonth(),now.getFullYear());
  const lm=new Date(now.getFullYear(),now.getMonth()-1,1);
  const prev=sumMon(lm.getMonth(),lm.getFullYear());
  const cmp=el("kSpendCmp");
  if(prev>0){const diff=((cur-prev)/prev)*100;const up=diff>=0;cmp.textContent=(up?"▲ +":"▼ ")+diff.toFixed(0)+"% เทียบเดือนก่อน";cmp.style.color="rgba(255,255,255,.62)";}
  else cmp.textContent="";
}
function renderTrend(){
  const D=scoped().slice().sort((a,b)=>pdate(a.date)-pdate(b.date));
  const svg=el("trend");
  if(!D.length){svg.innerHTML='<text x="300" y="80" text-anchor="middle" fill="#86868b" font-size="13">ยังไม่มีข้อมูล</text>';return;}
  const byDay={};
  D.forEach(r=>{const d=pdate(r.date);const k=d?d.toISOString().slice(0,10):"?";byDay[k]=(byDay[k]||0)+ +r.amount;});
  const keys=Object.keys(byDay).sort(); const vals=keys.map(k=>byDay[k]);
  const max=Math.max(...vals,1), W=600,H=150,pad=8;
  const x=i=>keys.length<2?W/2:pad+(i/(keys.length-1))*(W-2*pad);
  const y=v=>H-pad-(v/max)*(H-2*pad);
  let line=vals.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area=`${pad},${H-pad} ${line} ${x(keys.length-1)},${H-pad}`;
  svg.innerHTML=`<polygon points="${area}" fill="#1d1d1f" opacity="0.06"/>
    <polyline points="${line}" fill="none" stroke="#1d1d1f" stroke-width="2.5" stroke-linejoin="round"/>
    ${vals.map((v,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="#1d1d1f"/>`).join("")}`;
}
function renderCats(){
  const map={}; scoped().forEach(r=>map[r.category]=(map[r.category]||0)+ +r.amount);
  const arr=Object.entries(map).sort((a,b)=>b[1]-a[1]); const max=arr.length?arr[0][1]:1;
  el("cats").innerHTML=arr.length?arr.map(([n,v])=>`<div class="catrow"><div class="top"><span>${n}</span><span class="cv">${baht(v)}</span></div><div class="track"><div class="fill" style="width:${Math.max(6,(v/max)*100)}%"></div></div></div>`).join(""):'<div class="empty">ยังไม่มีข้อมูล</div>';
}
function renderVendors(){
  const map={}; scoped().forEach(r=>{const k=r.vendor||"ไม่ระบุ";map[k]=(map[k]||0)+ +r.amount;});
  const arr=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5); const max=arr.length?arr[0][1]:1;
  el("vendors").innerHTML=arr.length?arr.map(([n,v])=>`<div class="catrow"><div class="top"><span>${n}</span><span class="cv">${baht(v)}</span></div><div class="track"><div class="fill" style="width:${Math.max(6,(v/max)*100)}%;background:var(--orange)"></div></div></div>`).join(""):'<div class="empty">ยังไม่มีข้อมูล</div>';
}
function renderRecent(){
  const D=ALL.slice().sort((a,b)=>(cdate(b.createdAt)?.getTime()||0)-(cdate(a.createdAt)?.getTime()||0)).slice(0,5);
  el("recent").innerHTML=D.length?D.map(r=>rowHTML(r,{primary:"recorded"})).join(""):'<div class="empty">ยังไม่มีรายการ</div>';
}
function rowHTML(r,{primary="transaction"}={}){
  const tx=pdate(r.dateISO||r.date);
  const cr=cdate(r.createdAt);
  const mainDate=primary==="recorded"?(cr||tx):(tx||cr);
  const dd=mainDate?mainDate.getDate():"–"; const mm=mainDate?THMON[mainDate.getMonth()]:"";
  const badge=r.status==="จ่ายแล้ว"?"paid":"pending";
  const docs=[];
  if(r.img) docs.push(`<a href="${esc(r.img)}" target="_blank" rel="noopener">หลักฐาน</a>`);
  if(r.claimPdfUrl) docs.push(`<a href="${esc(r.claimPdfUrl)}" target="_blank" rel="noopener">ใบขอเบิก</a>`);
  if(r.receiptPdfUrl) docs.push(`<a href="${esc(r.receiptPdfUrl)}" target="_blank" rel="noopener">ใบแทน</a>`);
  return `<div class="row">
    <div class="rdate"><div class="d">${dd}</div><div class="m">${mm}</div></div>
    <div class="rmeta"><div class="nm">${esc(r.vendor||"-")}</div><div class="ds">${esc(r.note||"")}${r.sender?" · "+esc(r.sender):""}</div>
      <div class="dateinfo"><span>วันที่รายการ <b>${fmtDate(tx)}</b></span><span>บันทึก <b>${fmtDate(cr,true)}</b></span>${gapBadge(r)}</div>
      <div class="chips"><span class="chip">${esc(r.category||"-")}</span><span class="badge ${badge}">${esc(r.status||"รอเบิก")}</span></div></div>
    <div class="ramt"><div class="n">${baht(r.amount)}</div><div style="display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap;margin-top:4px">${docs.join("")}</div></div>
  </div>`;
}

/* ---------- EXPENSES ---------- */
function buildCatFilter(){
  const node=el("fCat"); if(!node)return;
  const current=node.value;
  const cats=[...new Set(ALL.map(r=>r.category).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"th"));
  node.innerHTML='<option value="">ทุกหมวด</option>'+cats.map(c=>`<option value="${escAttr(c)}">${esc(c)}</option>`).join("");
  if([...node.options].some(o=>o.value===current)) node.value=current;
}
function buildSenderFilter(){
  const node=el("fSender"); if(!node)return;
  const current=node.value;
  const senders=[...new Set(ALL.map(r=>String(r.sender||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"th"));
  node.innerHTML='<option value="">ผู้เบิกทั้งหมด</option>'+senders.map(v=>`<option value="${escAttr(v)}">${esc(v)}</option>`).join("");
  if([...node.options].some(o=>o.value===current)) node.value=current;
}
function expenseStatusClass(status){
  const s=String(status||"รอเบิก");
  if(s==="จ่ายแล้ว")return "paid";
  if(/ต้องแก้|ตีกลับ|ไม่ผ่าน|ยกเลิก|ปฏิเสธ/.test(s))return "needs-action";
  return "";
}
function renderExpenseStatusTabs(){
  const node=el("expenseStatusTabs"); if(!node)return;
  const basis=el("fDateBasis")?.value||"transaction";
  const rows=scoped(basis);
  const counts={}; rows.forEach(r=>{const st=String(r.status||"รอเบิก");counts[st]=(counts[st]||0)+1;});
  const preferred=["รอเบิก","จ่ายแล้ว"];
  const rest=Object.keys(counts).filter(x=>!preferred.includes(x)).sort((a,b)=>a.localeCompare(b,"th"));
  const statuses=["",...preferred,...rest];
  const active=el("fStatus")?.value||"";
  node.innerHTML=statuses.map(st=>{
    const label=st||"ทั้งหมด",count=st?(counts[st]||0):rows.length;
    return `<button type="button" class="expense-status-tab ${active===st?"active":""}" data-exp-status="${escAttr(st)}" role="tab" aria-selected="${active===st?"true":"false"}"><span>${esc(label)}</span><span class="count">${count}</span></button>`;
  }).join("");
}
function filteredExp(){
  const q=(el("q")?.value||"").trim().toLowerCase(),st=el("fStatus")?.value||"",ct=el("fCat")?.value||"",sender=el("fSender")?.value||"",so=el("fSort")?.value||"new";
  const basis=el("fDateBasis")?.value||"transaction";
  let list=scoped(basis).filter(r=>{
    if(st&&String(r.status||"รอเบิก")!==st)return false;
    if(ct&&String(r.category||"")!==ct)return false;
    if(sender&&String(r.sender||"")!==sender)return false;
    if(q){
      const hay=[r.vendor,r.note,r.sender,r.category,r.status,r.amount].filter(v=>v!=null).join(" ").toLowerCase();
      if(!hay.includes(q))return false;
    }
    return true;
  });
  list.sort((a,b)=>{
    if(so==="hi")return +b.amount- +a.amount;
    if(so==="lo")return +a.amount- +b.amount;
    const da=dateFor(a,basis)?.getTime()||0,db=dateFor(b,basis)?.getTime()||0;
    return so==="old"?da-db:db-da;
  });
  return list;
}
function expenseDocsHTML(r,{drawer=false}={}){
  const docs=[];
  if(r.img)docs.push(["หลักฐาน",r.img]);
  if(r.claimPdfUrl)docs.push(["ใบขอเบิก",r.claimPdfUrl]);
  if(r.receiptPdfUrl)docs.push(["ใบแทน",r.receiptPdfUrl]);
  if(!docs.length)return drawer?'<div class="expense-doc-empty">ยังไม่มีเอกสารแนบ</div>':'<span class="expense-doc-empty">—</span>';
  if(drawer)return docs.map(([label,url])=>`<a href="${escAttr(url)}" target="_blank" rel="noopener">${esc(label)}</a>`).join("");
  return docs.map(([label,url])=>`<a class="expense-doc-link" href="${escAttr(url)}" target="_blank" rel="noopener">${esc(label)}</a>`).join("");
}
function expenseRowHTML(r){
  const idx=ALL.indexOf(r),tx=pdate(r.dateISO||r.date),cr=cdate(r.createdAt),status=String(r.status||"รอเบิก");
  return `<tr data-exp-open="${idx}">
    <td class="expense-date-cell" data-label="วันที่รายการ"><span class="expense-date-main">${fmtDate(tx)}</span><span class="expense-date-sub">บันทึก ${fmtDate(cr,true)}</span>${gapBadge(r)}</td>
    <td class="expense-vendor-cell"><div class="expense-vendor"><strong>${esc(r.vendor||"ไม่ระบุร้านค้า")}</strong><small>${esc(r.note||"ไม่มีรายละเอียด")}</small></div></td>
    <td class="expense-category-cell" data-label="หมวด"><span class="expense-category">${esc(r.category||"ไม่ระบุ")}</span></td>
    <td class="expense-sender-cell" data-label="ผู้เบิก"><span class="expense-sender">${esc(r.sender||"—")}</span></td>
    <td class="num expense-amount-cell" data-label="ยอดสุทธิ"><span class="expense-amount">${baht(r.amount)}</span></td>
    <td class="expense-status-cell" data-label="สถานะ"><span class="expense-state ${expenseStatusClass(status)}">${esc(status)}</span></td>
    <td class="expense-doc-cell" data-label="เอกสาร"><div class="expense-docs">${expenseDocsHTML(r)}</div></td>
    <td class="expense-detail-cell expense-detail-col"><button type="button" class="expense-more-btn" data-exp-open="${idx}">ดู</button></td>
  </tr>`;
}
function renderExp(){
  renderExpenseStatusTabs();
  const list=filteredExp(),sum=list.reduce((s,r)=>s+ +r.amount,0),paid=list.filter(r=>String(r.status)==="จ่ายแล้ว"),pending=list.filter(r=>String(r.status)!=="จ่ายแล้ว");
  const pages=Math.max(1,Math.ceil(list.length/EXPENSE_PAGE_SIZE));EXPENSE_PAGE=Math.min(Math.max(1,EXPENSE_PAGE),pages);
  const start=(EXPENSE_PAGE-1)*EXPENSE_PAGE_SIZE,end=Math.min(list.length,start+EXPENSE_PAGE_SIZE),visible=list.slice(start,end);
  el("expSum").textContent=`แสดง ${list.length?start+1:0}-${end} จาก ${list.length} รายการ · รวม ${baht(sum)} · รอดำเนินการ ${pending.length} · จ่ายแล้ว ${paid.length}`;
  el("rows").innerHTML=visible.length?visible.map(expenseRowHTML).join(""):'<tr class="expense-empty-row"><td colspan="8"><div class="expense-empty-state">ไม่พบรายการตามตัวกรองนี้</div></td></tr>';
  const pager=el("expensePager");if(pager){pager.hidden=list.length<=EXPENSE_PAGE_SIZE;pager.innerHTML=`<button type="button" onclick="changeExpensePage(-1)" ${EXPENSE_PAGE<=1?"disabled":""}>‹ ก่อนหน้า</button><span class="page-info">หน้า ${EXPENSE_PAGE}/${pages}</span><button type="button" onclick="changeExpensePage(1)" ${EXPENSE_PAGE>=pages?"disabled":""}>ถัดไป ›</button>`;}
}
function changeExpensePage(delta){EXPENSE_PAGE+=Number(delta||0);renderExp();el("page-expenses")?.scrollIntoView({block:"start",behavior:"smooth"});}
function openExpenseDrawer(index){
  const r=ALL[Number(index)]; if(!r)return;
  const tx=pdate(r.dateISO||r.date),cr=cdate(r.createdAt),status=String(r.status||"รอเบิก");
  el("expenseDrawerTitle").textContent=r.vendor||"รายละเอียดรายจ่าย";
  el("expenseDrawerBody").innerHTML=`
    <div class="expense-drawer-amount">${baht(r.amount)}</div>
    <div class="expense-drawer-vendor">${esc(r.vendor||"ไม่ระบุร้านค้า")}</div>
    <div class="expense-drawer-note">${esc(r.note||"ไม่มีรายละเอียดเพิ่มเติม")}</div>
    <span class="expense-state ${expenseStatusClass(status)}">${esc(status)}</span>
    <div class="expense-detail-grid">
      <div><span>วันที่รายการ</span><strong>${fmtDate(tx)}</strong></div>
      <div><span>วันที่บันทึก</span><strong>${fmtDate(cr,true)}</strong></div>
      <div><span>หมวด</span><strong>${esc(r.category||"—")}</strong></div>
      <div><span>ผู้เบิก</span><strong>${esc(r.sender||"—")}</strong></div>
    </div>
    <div class="expense-drawer-section"><h4>เอกสารประกอบ</h4><div class="expense-drawer-docs">${expenseDocsHTML(r,{drawer:true})}</div></div>`;
  const drawer=el("expenseDrawer"),backdrop=el("expenseDrawerBackdrop");
  backdrop.hidden=false; drawer.setAttribute("aria-hidden","false");
  requestAnimationFrame(()=>drawer.classList.add("open"));
}
function closeExpenseDrawer(){
  const drawer=el("expenseDrawer"),backdrop=el("expenseDrawerBackdrop"); if(!drawer)return;
  drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true");
  setTimeout(()=>{if(backdrop&&!drawer.classList.contains("open"))backdrop.hidden=true;},220);
}

/* ---------- REIMBURSE ---------- */
function renderReim(){
  const pend=ALL.filter(r=>r.status==="รอเบิก");
  el("reimTotal").textContent="รวมรอเบิกทั้งหมด "+baht(pend.reduce((s,r)=>s+ +r.amount,0));
  const by={};
  pend.forEach(r=>{const k=r.sender||"ไม่ระบุ";(by[k]=by[k]||{n:0,sum:0,oldest:null});by[k].n++;by[k].sum+= +r.amount;const d=pdate(r.date);if(d&&(!by[k].oldest||d<by[k].oldest))by[k].oldest=d;});
  const now=new Date();
  const rows=Object.entries(by).sort((a,b)=>b[1].sum-a[1].sum);
  el("reimBody").innerHTML=rows.length?rows.map(([nm,o])=>{
    const days=o.oldest?Math.round((now-o.oldest)/86400000):0;
    return `<tr><td>${nm}</td><td class="num">${o.n}</td><td class="num">${baht(o.sum)}</td><td class="num">${days} วัน</td></tr>`;
  }).join(""):'<tr><td colspan="4" class="empty">ไม่มีรายการรอเบิก 🎉</td></tr>';
}

/* ---------- REPORTS ---------- */
function monthKeys(){
  const set=new Set();
  ALL.forEach(r=>{const d=pdate(r.date);if(d)set.add(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));});
  return [...set].sort().reverse();
}
function buildRepMonths(){
  const current=el("repMonth").value;
  const ks=monthKeys();
  el("repMonth").innerHTML=ks.map(k=>{const[y,m]=k.split("-");return `<option value="${k}">${THMON[+m-1]} ${(+y)+543}</option>`;}).join("")||'<option value="">—</option>';
  if(ks.includes(current)) el("repMonth").value=current;
}
function repData(){
  const k=el("repMonth").value;
  if(!k) return [];
  return ALL.filter(r=>{const d=pdate(r.date);return d&&(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"))===k;});
}
function renderReport(){
  const D=repData(),k=el("repMonth").value||"";
  const[y,m]=k.split("-"); el("repMonLabel").textContent=m?`${THMON[+m-1]} ${(+y)+543}`:"";
  const map={}; D.forEach(r=>{(map[r.category]=map[r.category]||{n:0,s:0});map[r.category].n++;map[r.category].s+= +r.amount;});
  const arr=Object.entries(map).sort((a,b)=>b[1].s-a[1].s);
  el("repCatBody").innerHTML=arr.length?arr.map(([n,o])=>`<tr><td>${n}</td><td class="num">${o.n}</td><td class="num">${baht(o.s)}</td></tr>`).join(""):'<tr><td colspan="3" class="empty">ไม่มีข้อมูลเดือนนี้</td></tr>';
  const total=D.reduce((s,r)=>s+ +r.amount,0);
  const base=total/1.07, vat=total-base;
  const svc=D.filter(r=>/บริการ|จ้างงาน/.test(r.category||"")).reduce((s,r)=>s+ +r.amount,0);
  const wht=(svc/1.07)*0.03;
  el("txTotal").textContent=baht(total); el("txBase").textContent=baht(base);
  el("txVat").textContent=baht(vat); el("txWht").textContent=baht(wht);
}

/* ---------- ACCOUNTING DOCUMENT CENTER ---------- */
function documentRows(){return ALL.filter(r=>r.img||r.claimPdfUrl||r.receiptPdfUrl);}
function documentMeta(r){
  const source=!!r.img, claim=!!r.claimPdfUrl, receipt=!!r.receiptPdfUrl;
  const count=[source,claim,receipt].filter(Boolean).length;
  const duplicate=!!String(r.duplicateStatus||"").trim();
  return {source,claim,receipt,count,complete:count===3,duplicate};
}
function documentMonthKey(r){const d=pdate(r.dateISO||r.date);return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`:"";}
function buildDocumentMonths(rows){
  const select=el("docMonth");if(!select)return;
  const current=select.value;
  const keys=[...new Set(rows.map(documentMonthKey).filter(Boolean))].sort().reverse();
  select.innerHTML='<option value="">ทุกเดือน</option>'+keys.map(k=>{const[y,m]=k.split("-");return `<option value="${k}">${THMON[+m-1]} ${+y+543}</option>`;}).join("");
  if(keys.includes(current))select.value=current;
}
function filteredDocuments(){
  const q=(el("docQ")?.value||"").trim().toLowerCase();
  const status=el("docStatus")?.value||"";
  const month=el("docMonth")?.value||"";
  const sort=el("docSort")?.value||"new";
  let rows=documentRows().filter(r=>{
    const m=documentMeta(r);
    const hay=[r.vendor,r.note,r.category,r.sender,r.payerName,r.transferor,r.docType,r.id].join(" ").toLowerCase();
    if(q&&!hay.includes(q))return false;
    if(month&&documentMonthKey(r)!==month)return false;
    if(status==="complete"&&!m.complete)return false;
    if(status==="missing"&&m.complete)return false;
    if(status==="no-source"&&m.source)return false;
    if(status==="no-claim"&&m.claim)return false;
    if(status==="no-receipt"&&m.receipt)return false;
    if(status==="duplicate"&&!m.duplicate)return false;
    return true;
  });
  rows.sort((a,b)=>{
    const ma=documentMeta(a),mb=documentMeta(b);
    if(sort==="recorded")return (cdate(b.createdAt)?.getTime()||0)-(cdate(a.createdAt)?.getTime()||0);
    if(sort==="amount")return (+b.amount||0)-(+a.amount||0);
    if(sort==="incomplete")return (ma.complete-mb.complete)||((pdate(b.dateISO||b.date)?.getTime()||0)-(pdate(a.dateISO||a.date)?.getTime()||0));
    return (pdate(b.dateISO||b.date)?.getTime()||0)-(pdate(a.dateISO||a.date)?.getTime()||0);
  });
  return rows;
}
function docLink(ok,url,label){return ok?`<a class="doc-link" href="${escAttr(url)}" target="_blank" rel="noopener">${label}</a>`:`<span class="doc-link missing">${label}</span>`;}
function renderBills(){
  const all=documentRows();buildDocumentMonths(all);
  const complete=all.filter(r=>documentMeta(r).complete).length;
  const duplicate=all.filter(r=>documentMeta(r).duplicate).length;
  el("docKAll").textContent=all.length;
  el("docKComplete").textContent=complete;
  el("docKMissing").textContent=all.length-complete;
  el("docKDuplicate").textContent=duplicate;
  const rows=filteredDocuments();
  const pages=Math.max(1,Math.ceil(rows.length/DOCUMENT_PAGE_SIZE));DOCUMENT_PAGE=Math.min(Math.max(1,DOCUMENT_PAGE),pages);
  const start=(DOCUMENT_PAGE-1)*DOCUMENT_PAGE_SIZE,end=Math.min(rows.length,start+DOCUMENT_PAGE_SIZE),visible=rows.slice(start,end);
  el("billGrid").innerHTML=visible.length?visible.map(r=>{
    const m=documentMeta(r), tx=pdate(r.dateISO||r.date), cr=cdate(r.createdAt);
    const missing=[];if(!m.source)missing.push("หลักฐาน");if(!m.claim)missing.push("ใบขอเบิก");if(!m.receipt)missing.push("ใบแทน");
    const primary=esc(r.vendor||r.note||"ไม่ระบุรายการ");
    const sub=[r.category,r.note&&r.note!==r.vendor?r.note:""].filter(Boolean).map(esc).join(" · ")||"ไม่มีรายละเอียดเพิ่มเติม";
    const person=esc(r.sender||r.payerName||"—");
    return `<tr>
      <td class="doc-date" data-label="วันที่รายการ">${fmtDate(tx)}<small>บันทึก ${fmtDate(cr,true)}</small></td>
      <td class="doc-main" data-label="รายการ / ผู้รับ"><strong>${primary}</strong><small>${sub}${m.duplicate?` · <span style="color:var(--red)">${esc(r.duplicateStatus)}</span>`:""}</small></td>
      <td data-label="ผู้เบิก"><div class="doc-person">${person}</div></td>
      <td class="num" data-label="จำนวนเงิน"><b>${baht(r.amount)}</b></td>
      <td data-label="ชุดเอกสาร"><div class="doc-links">${docLink(m.source,r.img,"หลักฐาน")}${docLink(m.claim,r.claimPdfUrl,"ใบขอเบิก")}${docLink(m.receipt,r.receiptPdfUrl,"ใบแทน")}</div></td>
      <td data-label="สถานะ"><span class="doc-state ${m.complete?"":"missing"}">${m.complete?"เอกสารครบ":`ขาด ${missing.join(" / ")}`} <span class="state-count">${m.count}/3</span></span>${m.duplicate?'<br><span class="doc-state duplicate">สงสัยเบิกซ้ำ</span>':""}</td>
    </tr>`;
  }).join(""):'<tr class="doc-empty"><td colspan="6">ไม่พบรายการตามตัวกรอง<br><small>ลองเปลี่ยนสถานะ เดือน หรือคำค้นหา</small></td></tr>';
  el("docFooter").innerHTML=`<span>แสดง ${rows.length?start+1:0}-${end} จาก ${rows.length.toLocaleString("th-TH")} รายการ · ทั้งหมด ${all.length.toLocaleString("th-TH")}</span>${rows.length>DOCUMENT_PAGE_SIZE?`<span style="margin-left:12px"><button class="btn small" type="button" onclick="changeDocumentPage(-1)" ${DOCUMENT_PAGE<=1?"disabled":""}>‹</button> หน้า ${DOCUMENT_PAGE}/${pages} <button class="btn small" type="button" onclick="changeDocumentPage(1)" ${DOCUMENT_PAGE>=pages?"disabled":""}>›</button></span>`:""}`;
}
function changeDocumentPage(delta){DOCUMENT_PAGE+=Number(delta||0);renderBills();el("page-bills")?.scrollIntoView({block:"start",behavior:"smooth"});}
function exportDocumentCSV(){
  const head=["วันที่รายการ","วันที่บันทึก","ผู้รับ/ร้าน","ผู้เบิก","หมวด","รายละเอียด","จำนวนเงิน","หลักฐาน","ใบขอเบิก","ใบแทน","ความครบถ้วน","สถานะเบิกซ้ำ"];
  const body=filteredDocuments().map(r=>{const m=documentMeta(r);return [r.dateISO||r.date,r.createdAt,r.vendor,r.sender||r.payerName,r.category,r.note,r.amount,r.img,r.claimPdfUrl,r.receiptPdfUrl,`${m.count}/3`,r.duplicateStatus].map(v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`).join(",");});
  download("accounting-documents.csv",[head.join(","),...body].join("\n"));
}
function showBill(url){
  if(!url||url==="#")return;
  const previewUrl=compactImageUrl(url,1200);
  el("modalBody").innerHTML=`<img src="${escAttr(previewUrl)}" loading="lazy" decoding="async" alt="บิล"><div style="margin-top:10px"><a class="btn" href="${escAttr(url)}" target="_blank" rel="noopener">เปิดใน Google Drive ↗</a></div>`;
  el("modal").classList.add("show");
}

/* ---------- ACTIVITY ---------- */
function renderActivity(){
  const rows=ALL.slice().sort((a,b)=>(cdate(b.createdAt)?.getTime()||0)-(cdate(a.createdAt)?.getTime()||0));
  const limit=Math.min(rows.length,ACTIVITY_PAGE*ACTIVITY_PAGE_SIZE),visible=rows.slice(0,limit);
  el("activityRows").innerHTML=visible.length?visible.map(r=>{
    const tx=pdate(r.dateISO||r.date),cr=cdate(r.createdAt);
    const docs=[];
    if(r.img) docs.push(`<a class="micro-link" href="${esc(r.img)}" target="_blank" rel="noopener">หลักฐาน</a>`);
    if(r.claimPdfUrl) docs.push(`<a class="micro-link" href="${esc(r.claimPdfUrl)}" target="_blank" rel="noopener">ใบเบิก</a>`);
    if(r.receiptPdfUrl) docs.push(`<a class="micro-link" href="${esc(r.receiptPdfUrl)}" target="_blank" rel="noopener">ใบแทน</a>`);
    return `<div class="log-item">
      <div class="log-time">${fmtDate(cr,true)}</div>
      <div class="log-main"><div class="title">บันทึกรายการ ${esc(r.vendor||r.note||"ไม่ระบุรายการ")} · ${baht(r.amount)}</div>
      <div class="sub">วันที่รายการตามหลักฐาน: ${fmtDate(tx)} · ผู้ส่ง: ${esc(r.sender||r.payerName||"—")} ${gapBadge(r)}</div></div>
      <div class="log-docs">${docs.join("")}</div>
    </div>`;
  }).join(""):'<div class="empty">ยังไม่มีประวัติการบันทึก</div>';
  if(rows.length>limit)el("activityRows").insertAdjacentHTML("beforeend",`<div style="padding:14px;text-align:center"><button class="btn" type="button" onclick="ACTIVITY_PAGE++;renderActivity()">โหลดเพิ่ม · เหลือ ${(rows.length-limit).toLocaleString("th-TH")} รายการ</button></div>`);
}



/* ---------- MULTI BUSINESS / PRO WORKSPACES ---------- */
let BUSINESS_INFO={ok:false,businesses:[],businessCount:1,businessLimit:1,canAddBusiness:false};
let BUSINESS_PAIR_POLL=null;
function businessInitial(name){return String(name||"D").trim().replace(/\s+/g,"").slice(0,1).toUpperCase()||"D";}
function businessPlanLabel(){
  if(BUSINESS_INFO.betaActive)return `Beta Pro · ${BUSINESS_INFO.businessCount||1}/${BUSINESS_INFO.businessLimit||3} ธุรกิจ`;
  return `${BUSINESS_INFO.planName||"แพ็กเกจฟรี"} · ${BUSINESS_INFO.businessCount||1}/${BUSINESS_INFO.businessLimit||1} ธุรกิจ`;
}
function renderBusinessSwitcher(){
  const current=(BUSINESS_INFO.businesses||[]).find(x=>x.isCurrent)||(BUSINESS_INFO.businesses||[])[0];
  const currentName=current?.name||SETTINGS.company_name||"ธุรกิจปัจจุบัน";
  const currentInitial=businessInitial(currentName||"D");
  const currentMeta=businessPlanLabel();
  if(el("businessSwitcherMeta"))el("businessSwitcherMeta").textContent=currentMeta;
  if(el("mobileWorkspaceMeta"))el("mobileWorkspaceMeta").textContent=currentMeta;
  applyWorkspaceBranding();
  const menu=el("businessSwitcherMenu");if(!menu)return;
  const rows=(BUSINESS_INFO.businesses||[]).map((b,i)=>`<button type="button" class="business-menu-item ${b.isCurrent?"current":""}" ${b.locked?'data-locked-business="1"':`data-switch-business="${escAttr(b.dashboardUrl||"")}"`} ${b.isCurrent?"disabled":""}><span class="business-menu-mark">${esc(businessInitial(b.name))}</span><span class="business-menu-copy"><strong>${esc(b.name||`ธุรกิจ ${i+1}`)}</strong><small>${b.locked?"ต้องใช้ Pro เพื่อเปิด Workspace นี้":(b.isRoot?"ธุรกิจหลัก":"Workspace เพิ่มเติม")}</small></span>${b.locked?'<span class="new-badge beta">PRO</span>':(b.isCurrent?'<span class="business-current-check">✓</span>':"")}</button>`).join("");
  const locked=!BUSINESS_INFO.canAddBusiness;
  const addCopy=locked&&Number(BUSINESS_INFO.businessLimit||1)<=1?"เพิ่มธุรกิจ · ต้องใช้ Pro":`เพิ่มธุรกิจใหม่ · ${BUSINESS_INFO.businessCount||0}/${BUSINESS_INFO.businessLimit||1}`;
  menu.innerHTML=`<div class="business-menu-label">YOUR BUSINESSES</div>${rows}<button class="business-add-btn ${locked?"locked":""}" type="button" data-add-business><span>＋ ${esc(addCopy)}</span><span>${locked?"PRO":"เพิ่ม"}</span></button>`;
}
async function refreshBusinesses({quiet=false}={}){
  try{
    const res=await fetch(apiUrl("/api/businesses")+`&_=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.ok!==true)throw new Error(data.reason||data.error||("HTTP "+res.status));
    BUSINESS_INFO=data;renderBusinessSwitcher();
    if(el("billingBusinessUsage"))el("billingBusinessUsage").textContent=`${data.businessCount||1} / ${data.businessLimit||1}`;
    return true;
  }catch(err){console.warn("business workspace refresh failed",err);if(!quiet&&el("businessSwitcherMeta"))el("businessSwitcherMeta").textContent="โหลดธุรกิจไม่สำเร็จ";return false;}
}
function closeBusinessSwitcher(){const w=el("businessSwitcher"),m=el("businessSwitcherMenu"),b=el("businessSwitcherBtn");if(w)w.classList.remove("open");if(m)m.hidden=true;if(b)b.setAttribute("aria-expanded","false");}
function toggleBusinessSwitcher(){const w=el("businessSwitcher"),m=el("businessSwitcherMenu"),b=el("businessSwitcherBtn");if(!w||!m||!b)return;const open=m.hidden;m.hidden=!open;w.classList.toggle("open",open);b.setAttribute("aria-expanded",open?"true":"false");if(open)refreshBusinesses({quiet:true});}
function businessManagerHtml(){
  const items=(BUSINESS_INFO.businesses||[]).map((b,i)=>`<button class="business-menu-item ${b.isCurrent?"current":""}" style="border:1px solid #ececf0;margin-bottom:7px" type="button" ${b.locked?'data-locked-business="1"':`data-switch-business="${escAttr(b.dashboardUrl||"")}"`} ${b.isCurrent?"disabled":""}><span class="business-menu-mark">${esc(businessInitial(b.name))}</span><span class="business-menu-copy"><strong>${esc(b.name||`ธุรกิจ ${i+1}`)}</strong><small>${b.locked?"แพ็กเกจ Pro ขึ้นไป":(b.isCurrent?"กำลังใช้งาน":"กดเพื่อสลับ Workspace")}</small></span>${b.locked?'<span class="new-badge beta">PRO</span>':(b.isCurrent?'<span class="business-current-check">✓</span>':"")}</button>`).join("");
  const can=BUSINESS_INFO.canAddBusiness===true;
  return `<h3 style="margin:0">ธุรกิจของคุณ</h3><p style="color:#6e6e73;font-size:12px;margin:6px 0 17px">${esc(businessPlanLabel())}</p>${items}<button class="btn solid" style="width:100%;margin-top:7px" type="button" data-add-business>${can?"＋ เพิ่มธุรกิจใหม่":"อัปเกรด Pro เพื่อเพิ่มธุรกิจ"}</button>`;
}
function openBusinessManager(){el("modalBody").innerHTML=businessManagerHtml();el("modal").classList.add("show");}
async function startAddBusiness(){
  if(!BUSINESS_INFO.canAddBusiness){
    closeBusinessSwitcher();closeGlobalModal();openPage("billing",document.querySelector('[data-p="billing"]'));window.scrollTo({top:0,behavior:"smooth"});
    setTimeout(()=>alert("การเพิ่มธุรกิจที่ 2–3 ใช้แพ็กเกจ Pro ขึ้นไป"),100);return;
  }
  try{
    const before=Number(BUSINESS_INFO.businessCount||0);
    const res=await fetch(apiUrl("/api/businesses/invite"),{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.ok!==true){if(data.reason==="business_limit"){BUSINESS_INFO={...BUSINESS_INFO,...data};renderBusinessSwitcher();return startAddBusiness();}throw new Error(data.message||data.reason||"สร้างรหัสไม่สำเร็จ");}
    closeBusinessSwitcher();
    el("modalBody").innerHTML=`<h3 style="margin:0">เพิ่มธุรกิจใหม่</h3><p style="color:#6e6e73;font-size:12px;margin:6px 0 0">Pro รองรับสูงสุด ${data.businessLimit||3} ธุรกิจ · แต่ละธุรกิจแยก Sheet, Drive และข้อมูลบัญชีออกจากกัน</p><div class="business-link-code" id="businessPairCode">${esc(data.code)}</div><div class="business-link-steps"><div class="business-link-step"><b>1</b><span>สร้างหรือเปิด <strong>กลุ่ม LINE ของธุรกิจใหม่</strong> แล้วเพิ่ม LINE OA รับจ่ายแบบไม่จำกัดเข้ากลุ่ม</span></div><div class="business-link-step"><b>2</b><span>พิมพ์ในกลุ่มว่า <strong>เชื่อมธุรกิจ ${esc(data.code)}</strong></span></div><div class="business-link-step"><b>3</b><span>ระบบจะสร้าง Workspace แยกให้ธุรกิจนั้น แล้วธุรกิจใหม่จะโผล่ในตัวสลับด้านซ้ายอัตโนมัติ</span></div></div><div class="business-link-note">รหัสมีอายุ 30 นาที · อย่าส่งรหัสนี้ให้บุคคลอื่น เพราะผู้ที่มีรหัสสามารถนำกลุ่ม LINE มาผูกกับบัญชีนี้ได้</div><div class="business-link-actions"><button class="btn" type="button" data-copy-business-code="${escAttr(data.code)}">คัดลอกรหัส</button><button class="btn solid" type="button" data-refresh-businesses>ตรวจว่าผูกแล้วหรือยัง</button></div><div class="save-state" id="businessPairState" style="display:block;margin-top:11px">กำลังรอธุรกิจใหม่…</div>`;
    el("modal").classList.add("show");
    clearInterval(BUSINESS_PAIR_POLL);let tries=0;
    BUSINESS_PAIR_POLL=setInterval(async()=>{tries++;const ok=await refreshBusinesses({quiet:true});if(ok&&Number(BUSINESS_INFO.businessCount||0)>before){clearInterval(BUSINESS_PAIR_POLL);BUSINESS_PAIR_POLL=null;if(el("businessPairState"))el("businessPairState").textContent="เชื่อมธุรกิจสำเร็จ ✓ ปิดหน้าต่างนี้แล้วสลับ Workspace ได้เลย";renderBusinessSwitcher();}else if(tries>=30){clearInterval(BUSINESS_PAIR_POLL);BUSINESS_PAIR_POLL=null;if(el("businessPairState"))el("businessPairState").textContent="ยังไม่พบธุรกิจใหม่ · กดตรวจอีกครั้งหลังส่งรหัสในกลุ่ม LINE";}},4000);
  }catch(err){console.error(err);alert("สร้างรหัสเพิ่มธุรกิจไม่สำเร็จ: "+String(err.message||err));}
}

/* ---------- SUBSCRIPTION / BETA / UPGRADE ---------- */
const PLAN_CATALOG={
  free:{id:"free",name:"ฟรี",monthly:0,annual:0,documents:10,businesses:1,features:["เอกสาร 10 รายการ/เดือน","1 ธุรกิจ","LINE Bot + Dashboard","Gmail 1 บัญชี","ผู้ใช้งานใน LINE ไม่จำกัด"]},
  starter:{id:"starter",name:"Starter",monthly:199,annual:1990,documents:50,businesses:1,features:["เอกสาร 50 รายการ/เดือน","1 ธุรกิจ","ตั้งเบิก ตรวจ อนุมัติ และตีกลับ","PDF ใบเบิก + ใบแทน","แจ้งผลการโอนกลับ LINE","Gmail 1 บัญชี","ผู้ใช้งานไม่จำกัด"]},
  pro:{id:"pro",name:"Pro",monthly:399,annual:3990,documents:300,businesses:3,recommended:true,features:["เอกสาร 300 รายการ/เดือน","สูงสุด 3 ธุรกิจในบัญชีเดียว","ทุกอย่างใน Starter","รอบเบิกปกติและรอบด่วน","รวมหลายรายการเป็นใบเบิกหลัก","หลายช่องทางการเงิน + กระทบยอด","รายจ่ายประจำ + ประวัติ + Export"]},
  business:{id:"business",name:"Business",monthly:990,annual:9900,documents:1500,businesses:10,features:["เอกสาร 1,500 รายการ/เดือน","สูงสุด 10 ธุรกิจ","ทุกอย่างใน Pro","รองรับทีมที่มีปริมาณเอกสารสูง","Workflow รายงาน / Export / Backup","Priority support","พร้อมขยาย Workflow อนุมัติระดับองค์กร"]},
};
function planMoney(v){return Number(v||0).toLocaleString("th-TH");}
function planDate(value){const d=cdate(value);return d?fmtDate(d):"—";}
function renderPricing(){
  const grid=el("pricingGrid");if(!grid)return;
  const requested=String(PLAN_INFO.requestedPlan||"");
  const current=String(PLAN_INFO.effectivePlan||"");
  grid.innerHTML=Object.values(PLAN_CATALOG).map(p=>{
    const price=PLAN_CYCLE==="annual"?p.annual:p.monthly;
    const perMonth=PLAN_CYCLE==="annual"&&price?Math.round(price/12):price;
    const selected=requested===p.id&&String(PLAN_INFO.requestedCycle||"monthly")===PLAN_CYCLE;
    const active=!PLAN_INFO.betaActive&&PLAN_INFO.status==="active"&&current===p.id;
    let action=PLAN_INFO.betaActive?(p.id==="free"?"เลือก Free หลัง Beta":"เลือกแพ็กเกจนี้หลัง Beta"):(active?"แพ็กเกจปัจจุบัน":"แจ้งเลือกแพ็กเกจนี้");
    if(selected)action="เลือกไว้แล้ว";
    const billed=PLAN_CYCLE==="annual"&&price?`ชำระ ${planMoney(price)} บาท/ปี · เฉลี่ย ${planMoney(perMonth)} บาท/เดือน`:(p.id==="free"?"ไม่มีค่าบริการ":"ชำระรายเดือน ยกเลิกการต่ออายุได้ก่อนรอบถัดไป");
    return `<article class="pricing-card ${p.recommended?"recommended":""}">${p.recommended?'<span class="pricing-ribbon">แนะนำ</span>':""}<div class="pricing-name">แพ็กเกจ</div><h4>${esc(p.name)}</h4><div class="pricing-price"><strong>${price?planMoney(price):"0"} บาท</strong><span>/${PLAN_CYCLE==="annual"?"ปี":"เดือน"}</span></div><div class="pricing-billed">${esc(billed)}</div><div class="pricing-docs"><strong>${planMoney(p.documents)} เอกสาร</strong><span>ต่อเดือน</span></div><ul class="pricing-features">${p.features.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><button type="button" class="plan-action ${p.recommended?"primary":""}" data-select-plan="${p.id}" ${active||selected?"disabled":""}>${esc(action)}</button></article>`;
  }).join("");
}
function renderSubscription(){
  if(!PLAN_INFO||PLAN_INFO.ok!==true)return;
  const used=Number(PLAN_INFO.usage?.documents||0),limit=PLAN_INFO.documentLimit==null?null:Number(PLAN_INFO.documentLimit||0);
  const banner=el("betaPlanBanner");if(banner)banner.hidden=false;
  if(el("betaPlanBadge"))el("betaPlanBadge").textContent=PLAN_INFO.betaActive?"BETA FREE":String(PLAN_INFO.planName||"PLAN").toUpperCase();
  if(el("betaPlanTitle"))el("betaPlanTitle").textContent=PLAN_INFO.betaActive?`ใช้ฟรีทุกฟีเจอร์ Pro อีก ${PLAN_INFO.daysRemaining||0} วัน`:`แพ็กเกจ ${PLAN_INFO.planName||"ฟรี"}`;
  if(el("betaPlanSub"))el("betaPlanSub").textContent=PLAN_INFO.betaActive?`Beta ฟรีถึง ${planDate(PLAN_INFO.trialEndsAt)} · ${PLAN_INFO.businessCount||1}/${PLAN_INFO.businessLimit||3} ธุรกิจ · เดือนนี้ ${used} เอกสาร`:(limit?`${PLAN_INFO.businessCount||1}/${PLAN_INFO.businessLimit||1} ธุรกิจ · เดือนนี้ ${used}/${limit} เอกสาร`:`เดือนนี้ ${used} เอกสาร`);
  if(el("billingCurrentName"))el("billingCurrentName").textContent=PLAN_INFO.betaActive?"Beta ฟรี · สิทธิ์ Pro":`แพ็กเกจ ${PLAN_INFO.planName||"ฟรี"}`;
  if(el("billingCurrentDesc"))el("billingCurrentDesc").textContent=PLAN_INFO.betaActive?"ช่วงทดสอบระบบ ใช้ Workflow Pro ได้ฟรี ไม่มีการตัดเงิน และไม่จำกัดจำนวนเอกสารจนกว่าจะสิ้นสุด Beta":"รายการเดิมยังใช้งานได้ตามปกติ โควตาเอกสารใหม่จะรีเซ็ตทุกต้นเดือน";
  if(el("billingTrialText"))el("billingTrialText").textContent=PLAN_INFO.betaActive?`ฟรีถึง ${planDate(PLAN_INFO.trialEndsAt)} · เหลือ ${PLAN_INFO.daysRemaining||0} วัน`:`${PLAN_INFO.usage?.month||"เดือนปัจจุบัน"}`;
  if(el("billingUsageNumber"))el("billingUsageNumber").textContent=limit?`${planMoney(used)} / ${planMoney(limit)}`:`${planMoney(used)}`;
  if(el("billingUsageSub"))el("billingUsageSub").textContent=limit?`เอกสารที่บันทึกใน ${PLAN_INFO.usage?.month||"เดือนนี้"}`:`เอกสารที่บันทึกเดือนนี้ · Beta ไม่จำกัด`;
  if(el("billingBusinessUsage"))el("billingBusinessUsage").textContent=`${PLAN_INFO.businessCount||1} / ${PLAN_INFO.businessLimit||1}`;
  const bar=el("billingUsageBar");if(bar)bar.style.width=limit?`${Math.min(100,Number(PLAN_INFO.usage?.percent||0))}%`:`${Math.min(100,Math.round(used/300*100))}%`;
  const state=el("billingUsageState");if(state){state.className="billing-usage-state";if(PLAN_INFO.betaActive)state.textContent="ช่วง Beta ไม่จำกัดจำนวนเอกสาร และยังไม่มีการเรียกเก็บเงิน";else if(PLAN_INFO.usage?.threshold==="limit"){state.classList.add("limit");state.textContent="โควตาครบแล้ว · ระบบหยุดรับเอกสารใหม่จนกว่าโควตาจะเพิ่มหรือเริ่มเดือนใหม่";}else if(["warning80","warning90"].includes(PLAN_INFO.usage?.threshold)){state.classList.add("warn");state.textContent=`ใช้โควตาแล้ว ${PLAN_INFO.usage?.percent||0}% · แนะนำให้เตรียมอัปเกรดก่อนเต็ม`; }else state.textContent=`เหลือ ${Math.max(0,limit-used)} เอกสารในเดือนนี้`;}
  const req=el("billingRequest");if(req){const requested=PLAN_INFO.requestedPlanName||"";req.hidden=!requested;req.textContent=requested?`เลือกไว้หลัง Beta: ${requested} · ${PLAN_INFO.requestedCycle==="annual"?"รายปี":"รายเดือน"} (ยังไม่เรียกเก็บเงิน)`:"";}
  renderPricing();
}
async function refreshSubscription({quiet=false}={}){
  try{
    const res=await fetch(apiUrl("/api/subscription")+`&_=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.ok!==true)throw new Error(data.reason||data.error||("HTTP "+res.status));
    PLAN_INFO=data;renderSubscription();return true;
  }catch(err){console.warn("subscription refresh failed",err);if(!quiet&&el("billingUsageState"))el("billingUsageState").textContent="โหลดข้อมูลแพ็กเกจไม่สำเร็จ กรุณากดอัปเดต";return false;}
}
async function requestUpgrade(plan){
  const p=PLAN_CATALOG[plan];if(!p)return;
  const label=PLAN_CYCLE==="annual"?`${planMoney(p.annual)} บาท/ปี`:`${planMoney(p.monthly)} บาท/เดือน`;
  if(!confirm(`เลือกแพ็กเกจ ${p.name} (${label}) ไว้หลังช่วง Beta?\n\nตอนนี้ยังไม่มีการเรียกเก็บเงินจริง`))return;
  try{
    const res=await fetch(apiUrl("/api/subscription/request-upgrade"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({plan,cycle:PLAN_CYCLE})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.ok!==true)throw new Error(data.reason||data.error||("HTTP "+res.status));
    PLAN_INFO=data;renderSubscription();
    alert(`บันทึกแพ็กเกจ ${p.name} ไว้แล้ว\nช่วง Beta ยังใช้ฟรีเหมือนเดิม และจะไม่มีการตัดเงินอัตโนมัติ`);
  }catch(err){console.error(err);alert("บันทึกแพ็กเกจไม่สำเร็จ กรุณาลองใหม่");}
}

/* ---------- BUSINESS MANAGEMENT / ONBOARDING ---------- */
function apiUrl(path){return `${WORKER}${path}?tenant=${encodeURIComponent(TENANT)}&k=${encodeURIComponent(K)}`;}
function parseSettingList(key){
  const raw=SETTINGS[key];
  if(Array.isArray(raw)) return raw;
  if(!raw) return [];
  try{const v=JSON.parse(raw);return Array.isArray(v)?v:[];}catch{return String(raw).split(",").map(x=>x.trim()).filter(Boolean);}
}
function financeChannelHash(value){let h=2166136261;const text=String(value||"");for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36).toUpperCase();}
function financeBool(value,fallback=false){if(value===true||value===false)return value;const raw=String(value??"").trim().toLowerCase();if(!raw)return fallback;return !["false","0","no","off","inactive","ปิด"].includes(raw);}
function normalizeFinanceChannel(raw={},index=0){const type=String(raw.type||raw.channelType||"bank").trim().toLowerCase()||"bank",bank=String(raw.bank||raw.provider||raw.wallet||"").trim(),number=String(raw.number||raw.accountNo||raw.account||raw.phone||"").trim(),label=String(raw.label||raw.nickname||raw.name||bank||`ช่องทางการเงิน ${index+1}`).trim(),name=String(raw.ownerName||raw.accountName||raw.name||"").trim(),seed=[type,bank,number,label,index].join("|").toLowerCase(),autoDefault=type!=="cash";return{id:String(raw.id||raw.channelId||`FIN_${financeChannelHash(seed)}`).trim(),label,type,bank,number,name,currency:String(raw.currency||"THB").toUpperCase(),active:financeBool(raw.active,true),canReceive:financeBool(raw.canReceive??raw.receiveEnabled,autoDefault),canPay:financeBool(raw.canPay??raw.payEnabled,autoDefault),autoDetect:financeBool(raw.autoDetect??raw.trackTransfers,autoDefault),isDefault:financeBool(raw.isDefault??raw.default,false),createdAt:String(raw.createdAt||""),updatedAt:String(raw.updatedAt||"")};}
function financeChannels(activeOnly=false){const list=parseSettingList("payment_channels").map(normalizeFinanceChannel);return activeOnly?list.filter(x=>x.active):list;}
function financeChannelTitle(channel={}){return channel.label||channel.bank||"ช่องทางการเงิน";}
function financeChannelDetail(channel={}){const tail=String(channel.number||"").replace(/\D/g,"").slice(-4),parts=[channel.bank&&channel.bank!==channel.label?channel.bank:"",tail?`••••${tail}`:"",channel.name||""].filter(Boolean);return parts.join(" · ")||"ยังไม่ระบุรายละเอียด";}
function financeChannelIcon(channel={}){return String(channel.bank||channel.label||"FIN").replace(/[^A-Za-zก-๙]/g,"").slice(0,3).toUpperCase()||"FIN";}
function financeChannelOptions(selectedId="",{placeholder=true,includeInactive=false}={}){const channels=financeChannels(false).filter(x=>(includeInactive||x.active)&&x.canPay!==false);return `${placeholder?'<option value="">เลือกบัญชีที่ใช้จ่าย</option>':""}${channels.map(x=>`<option value="${escAttr(x.id)}" ${String(x.id)===String(selectedId)?"selected":""}>${esc(financeChannelTitle(x))} · ${esc(financeChannelDetail(x))}${x.active?"":" (ปิดใช้งาน)"}</option>`).join("")}`;}
function resetFinanceForm(){FINANCE_EDIT_INDEX=-1;if(el("financeFormTitle"))el("financeFormTitle").textContent="เพิ่มช่องทางการเงิน";["finLabel","finBank","finNumber","finName"].forEach(id=>{if(el(id))el(id).value="";});if(el("finType"))el("finType").value="bank";if(el("finReceive"))el("finReceive").checked=true;if(el("finPay"))el("finPay").checked=true;if(el("finAutoDetect"))el("finAutoDetect").checked=true;if(el("finDefault"))el("finDefault").checked=false;if(el("finActive"))el("finActive").checked=true;if(el("addFinance"))el("addFinance").textContent="บันทึกช่องทาง";if(el("cancelFinanceEdit"))el("cancelFinanceEdit").hidden=true;}
function fillFinanceForm(index){const channel=financeChannels(false)[index];if(!channel)return;FINANCE_EDIT_INDEX=index;el("financeFormTitle").textContent="แก้ไขช่องทางการเงิน";el("finType").value=channel.type||"bank";el("finLabel").value=channel.label||"";el("finBank").value=channel.bank||"";el("finNumber").value=channel.number||"";el("finName").value=channel.name||"";el("finReceive").checked=channel.canReceive!==false;el("finPay").checked=channel.canPay!==false;el("finAutoDetect").checked=channel.autoDetect!==false;el("finDefault").checked=channel.isDefault===true;el("finActive").checked=channel.active!==false;el("addFinance").textContent="บันทึกการแก้ไข";el("cancelFinanceEdit").hidden=false;el("finLabel").focus();}
async function saveFinanceChannel(){const type=el("finType").value,label=el("finLabel").value.trim(),bank=el("finBank").value.trim(),number=el("finNumber").value.trim(),name=el("finName").value.trim(),canReceive=el("finReceive").checked,canPay=el("finPay").checked,autoDetect=el("finAutoDetect").checked,isDefault=el("finDefault").checked,active=el("finActive").checked;if(!label)return alert("กรอกชื่อเรียกของช่องทางก่อน");if(type!=="cash"&&!bank)return alert("กรอกธนาคารหรือผู้ให้บริการก่อน");if(type!=="cash"&&!number)return alert("กรอกเลขบัญชีหรือหมายเลขก่อน");if(autoDetect&&!canReceive&&!canPay)return alert("ถ้าจะใช้ตรวจสลิปอัตโนมัติ ต้องเลือกอย่างน้อยว่าใช้รับเงินหรือใช้จ่ายเงิน");const now=new Date().toISOString(),channels=financeChannels(false);const previous=FINANCE_EDIT_INDEX>=0?channels[FINANCE_EDIT_INDEX]:null;const channel={id:previous?.id||`FIN_${crypto.randomUUID().replace(/-/g,"").slice(0,12)}`,label,type,bank,number,name,currency:"THB",active:isDefault?true:active,canReceive,canPay,autoDetect,isDefault,createdAt:previous?.createdAt||now,updatedAt:now};if(isDefault)channels.forEach(x=>x.isDefault=false);if(FINANCE_EDIT_INDEX>=0)channels[FINANCE_EDIT_INDEX]=channel;else channels.push(channel);if(await saveSettings({payment_channels:JSON.stringify(channels)},"financeSaveState")){resetFinanceForm();await refreshBatchData({quiet:true}).catch(()=>{});COMPANY_SETUP_ACTIVE="";renderCompanySetupGate({force:!companySetupState().ready});}}
async function updateFinanceChannel(index,patch){const channels=financeChannels(false);if(!channels[index])return;channels[index]={...channels[index],...patch,updatedAt:new Date().toISOString()};if(patch.isDefault){channels.forEach((x,i)=>x.isDefault=i===index);channels[index].active=true;}if(await saveSettings({payment_channels:JSON.stringify(channels)},"financeSaveState")){await refreshBatchData({quiet:true}).catch(()=>{});if(el("page-reconciliation")?.classList.contains("show"))await refreshReconciliation({quiet:true}).catch(()=>{});}}
async function saveSettings(patch,stateId=""){
  const state=stateId?el(stateId):null;
  if(state) state.textContent="กำลังบันทึก…";
  try{
    const body={...SETTINGS,...patch};
    const res=await fetch(apiUrl("/api/settings"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    if(!res.ok) throw new Error("HTTP "+res.status);
    SETTINGS=await res.json();
    syncSignatureReadyMarker();
    if(state) state.textContent="บันทึกแล้ว";
    renderBusiness();renderOnboarding();renderSettings();
    setTimeout(()=>{if(state)state.textContent="";},1800);
    return true;
  }catch(err){console.error("save settings failed",err);if(state)state.textContent="บันทึกไม่สำเร็จ";return false;}
}
async function refreshSettings(){
  try{
    const res=await fetch(apiUrl("/api/settings")+`&_=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});
    if(!res.ok) throw new Error("HTTP "+res.status);
    SETTINGS=await res.json();
    syncSignatureReadyMarker();
    const page=currentPageKey();
    if(page==="business")renderBusiness();
    if(page==="settings")renderSettings();
    renderOnboarding();applyWorkspaceBranding();
    return true;
  }catch(err){console.warn("settings refresh failed",err);return false;}
}
function setWorkspaceLink(id,url,title){
  const link=el(id);if(!link)return;
  if(url){link.href=url;link.classList.remove("is-loading");link.removeAttribute("aria-disabled");link.title=title;}
  else{link.href="#";link.classList.add("is-loading");link.setAttribute("aria-disabled","true");link.title="ยังไม่มีลิงก์สำหรับบริษัทนี้";}
}
async function refreshWorkspaceLinks(){
  try{
    const res=await fetch(apiUrl("/api/workspace-links")+`&_=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||("HTTP "+res.status));
    WORKSPACE_LINKS={sheetUrl:String(data.sheetUrl||""),driveUrl:String(data.driveUrl||"")};
    setWorkspaceLink("openSheetLink",WORKSPACE_LINKS.sheetUrl,"เปิด Google Sheet ของบริษัทในแท็บใหม่");
    setWorkspaceLink("openDriveLink",WORKSPACE_LINKS.driveUrl,"เปิด Google Drive ที่เก็บเอกสารในแท็บใหม่");
    return true;
  }catch(err){
    console.warn("workspace links refresh failed",err);
    setWorkspaceLink("openSheetLink","","");setWorkspaceLink("openDriveLink","","");
    return false;
  }
}
function escAttr(v){return esc(v).replace(/`/g,"&#96;");}
function approverSignatureUrl(){
  return String(SETTINGS.approver_sign_url||SETTINGS.approverSignUrl||SETTINGS.approver_signature_url||SETTINGS.signature_url||"").trim();
}
function hasApproverSignature(){
  return Boolean(approverSignatureUrl()||localStorage.getItem(SIGNATURE_READY_KEY)==="1");
}
function compactImageUrl(url,size=160){
  const raw=String(url||"").trim();if(!raw)return "";
  const patterns=[/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,/drive\.google\.com\/uc\?[^#]*id=([a-zA-Z0-9_-]+)/,/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,/[?&]id=([a-zA-Z0-9_-]{15,})/];
  for(const re of patterns){const mm=raw.match(re);if(mm?.[1])return `https://drive.google.com/thumbnail?id=${encodeURIComponent(mm[1])}&sz=w${Math.max(64,Math.min(1600,Number(size)||160))}`;}
  return raw;
}
function companyLogoUrl(){
  return String(SETTINGS.logo_url||SETTINGS.company_logo_url||SETTINGS.logoUrl||"").trim();
}
function setAvatarNode(node,name,logoUrl){
  if(!node)return;
  const initial=businessInitial(name||"D"),displayUrl=compactImageUrl(logoUrl,128);
  if(displayUrl){
    node.classList.add("has-image");const old=node.querySelector("img");
    if(old&&old.dataset.memorySrc===displayUrl){old.alt=name||"โลโก้บริษัท";}else{releaseImageNodes(node);node.replaceChildren();const img=document.createElement("img");img.src=displayUrl;img.alt=name||"โลโก้บริษัท";img.loading="lazy";img.decoding="async";img.fetchPriority="low";img.dataset.memorySrc=displayUrl;node.appendChild(img);}
    node.setAttribute("aria-label",name||"โลโก้บริษัท");
  }else{releaseImageNodes(node);node.classList.remove("has-image");if(node.textContent!==initial)node.textContent=initial;node.removeAttribute("aria-label");}
}
function applyWorkspaceBranding(){
  const current=(BUSINESS_INFO.businesses||[]).find(x=>x.isCurrent)||(BUSINESS_INFO.businesses||[])[0]||{};
  const companyName=String(current.name||SETTINGS.company_name||CONAME||"บริษัทของคุณ").trim()||"บริษัทของคุณ";
  const logoUrl=companyLogoUrl();
  const subText=String(SETTINGS.company_tax_id||"").trim()?`เลขผู้เสียภาษี ${String(SETTINGS.company_tax_id).trim()}`:"";
  if(el("brandName"))el("brandName").textContent=companyName;
  if(el("brandSub"))el("brandSub").textContent=subText;
  if(el("coName"))el("coName").textContent=companyName;
  if(el("businessSwitcherName"))el("businessSwitcherName").textContent=companyName;
  if(el("mobileWorkspaceName"))el("mobileWorkspaceName").textContent=companyName;
  setAvatarNode(el("brandLogo"),companyName,logoUrl);
  setAvatarNode(el("businessSwitcherAvatar"),companyName,logoUrl);
  setAvatarNode(el("mobileWorkspaceAvatar"),companyName,logoUrl);
  setAvatarNode(el("companyMenuAvatar"),companyName,logoUrl);
  setAvatarNode(el("whoAvatar"),companyName,logoUrl);
}
function companySetupState(){
  const documentChecks=[
    ["ชื่อบริษัท",String(SETTINGS.company_name||"").trim()],
    ["เลขผู้เสียภาษี",String(SETTINGS.tax_id||"").trim()],
    ["ชื่อผู้อนุมัติ",String(SETTINGS.approver_name||"").trim()],
    ["โลโก้บริษัท",companyLogoUrl()],
    ["ลายเซ็นผู้อนุมัติ",approverSignatureUrl()],
  ];
  const documentMissing=documentChecks.filter(([,value])=>!value).map(([label])=>label);
  const gmailReady=EMAIL_INFO.connected===true&&EMAIL_INFO.reconnectRequired!==true;
  const financeCount=financeChannels(true).length;
  return {
    owner_gmail:gmailReady,
    company_documents:documentMissing.length===0,
    finance:financeCount>0,
    gmailReady,financeCount,documentMissing,
    ready:gmailReady&&documentMissing.length===0&&financeCount>0,
  };
}
function companySetupWorkspaceOpen(){
  const emailOpen=el("page-email")?.classList.contains("show");
  const settingsOpen=el("page-settings")?.classList.contains("show");
  const billingOpen=el("page-billing")?.classList.contains("show");
  const businessOpen=el("page-business")?.classList.contains("show")&&["profile","approver","finance"].includes(BUSINESS_TAB);
  return Boolean(emailOpen||settingsOpen||billingOpen||businessOpen||COMPANY_SETUP_ACTIVE);
}
function setCompanySetupStep(id,ready,detail,buttonText){
  const row=el(id);if(!row)return;
  row.classList.toggle("done",ready);row.classList.toggle("current",!ready);
  const icon=row.querySelector(".company-setup-icon");if(icon&&ready)icon.textContent="✓";
  const detailNode=row.querySelector("small");if(detailNode)detailNode.textContent=detail;
  const button=row.querySelector("[data-company-setup]");if(button){button.textContent=buttonText;button.classList.toggle("solid",!ready);}
}
function renderCompanySetupGate({force=false}={}){
  const gate=el("companySetupGate");if(!gate||!HAS_LOADED)return;
  const st=companySetupState();
  const done=[st.owner_gmail,st.company_documents,st.finance].filter(Boolean).length;
  if(el("companySetupCount"))el("companySetupCount").textContent=`${done}/3 ขั้นตอน`;
  if(el("companySetupBar"))el("companySetupBar").style.width=`${done/3*100}%`;
  const gmailDetail=st.owner_gmail?`เชื่อมแล้ว${EMAIL_INFO.email?` · ${EMAIL_INFO.email}`:""}`:(EMAIL_INFO.reconnectRequired?"สิทธิ์ Gmail หมดอายุ กรุณาเชื่อมใหม่":"ยังไม่ได้เชื่อม Gmail เจ้าของธุรกิจ");
  const documentDetail=st.company_documents?"ข้อมูลบริษัท โลโก้ และลายเซ็นพร้อมสร้างเอกสาร":`ยังขาด ${st.documentMissing.join(" · ")}`;
  const financeDetail=st.finance?`พร้อมใช้งาน ${st.financeCount} ช่องทาง`:"ยังไม่มีบัญชีหรือช่องทางที่ใช้โอนเงิน";
  setCompanySetupStep("companySetupGmail",st.owner_gmail,gmailDetail,st.owner_gmail?"ตรวจสอบ":"เชื่อม Gmail");
  setCompanySetupStep("companySetupDocuments",st.company_documents,documentDetail,st.company_documents?"ตรวจสอบ":"ตั้งค่าเอกสาร");
  setCompanySetupStep("companySetupFinance",st.finance,financeDetail,st.finance?"ตรวจสอบ":"เพิ่มช่องทาง");

  // v5.0: Company Setup is intentionally non-blocking.
  // Never auto-open the full-screen gate from refresh, OAuth callback, sync or page navigation.
  // The sidebar checklist remains the single setup entry point.
  gate.hidden=true;
  document.body.classList.remove("company-setup-required");
  if(st.ready){
    COMPANY_SETUP_ACTIVE="";
    localStorage.setItem(`company-setup-complete:${TENANT}`,"1");
  }else{
    localStorage.removeItem(`company-setup-complete:${TENANT}`);
  }
  void force;
}

function openCompanySetupStep(step){
  COMPANY_SETUP_ACTIVE=step;
  const gate=el("companySetupGate");if(gate)gate.hidden=true;
  document.body.classList.remove("company-setup-required");
  if(step==="owner_gmail"){
    if(EMAIL_INFO.connected===true&&EMAIL_INFO.reconnectRequired!==true){openPage("email",document.querySelector('[data-p="email"]'));return;}
    beginOperation("เชื่อม Gmail เจ้าของธุรกิจ");
    location.href=WORKER+`/gmail/connect?tenant=${encodeURIComponent(TENANT)}&k=${encodeURIComponent(K)}`;return;
  }
  if(step==="company_documents"){
    beginOperation("เปิดตั้งค่าข้อมูลบริษัท โลโก้ และลายเซ็น");
    const qs=`?tenant=${encodeURIComponent(TENANT)}&k=${encodeURIComponent(K)}&setup=1`;
    location.href=location.origin+"/receipt"+qs;return;
  }
  if(step==="finance"){
    openBusiness("finance",document.querySelector('[data-biz="finance"]'));return;
  }
}
function requireCompanySetup(target=""){
  // v5.0: Missing setup must never block Dashboard navigation.
  // Keep the checklist visible so the owner can finish setup when convenient.
  if(!companySetupState().ready){
    const card=el("onboardingCard");
    if(card)card.classList.remove("closed");
  }
  void target;
  return false;
}

function syncSignatureReadyMarker(){
  if(approverSignatureUrl()) localStorage.setItem(SIGNATURE_READY_KEY,"1");
  LAST_SETTINGS_SIGNAL=localStorage.getItem(SETTINGS_SIGNAL_KEY)||"";
}
async function refreshSettingsIfAssetChanged(force=false){
  if(!HAS_LOADED&&!force)return false;
  const signal=localStorage.getItem(SETTINGS_SIGNAL_KEY)||"";
  if(!force&&signal===LAST_SETTINGS_SIGNAL)return false;
  LAST_SETTINGS_SIGNAL=signal;
  return refreshSettings();
}
function setBusinessTab(tab){
  BUSINESS_TAB=tab;
  document.querySelectorAll(".business-tab").forEach(x=>x.classList.remove("show"));
  const target=el("biz-"+tab);if(target)target.classList.add("show");
  document.querySelectorAll(".subnavlink[data-biz]").forEach(x=>x.classList.toggle("active",x.dataset.biz===tab));
  renderBusiness();
}
function openPage(p,source=null,opts={}){
  const previous=currentPageKey();
  if(p==="reimburse")p="batches";
  if(!opts.bypassSetup&&requireCompanySetup(p))return;
  if(!opts.soft&&!ROUTE_BOOTSTRAPPING&&p!==previous){hardNavigate(p);return;}
  COMPANY_SETUP_ACTIVE=(p==="email"||p==="settings"||p==="billing")?p:"";
  document.querySelectorAll(".navlink,.subnavlink").forEach(x=>x.classList.remove("active"));
  if(source)source.classList.add("active");
  if(el("mobileMoreNav")&&!['overview','batches','expenses','income'].includes(p))el("mobileMoreNav").classList.add("active");
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("show"));
  const page=el("page-"+p);if(page)page.classList.add("show");
  if(previous&&previous!==p){releasePageDom(previous);releasePageData(previous,p);}
  el("pageTitle").textContent=TITLES[p]||"จัดการธุรกิจ";
  el("rangeSel").style.display=(p==="overview"||p==="expenses")?"flex":"none";
  if(p==="expenses"){
    localStorage.setItem(`sheet-checked:${TENANT}`,"1");
    renderOnboarding();
  }
  renderLocalPage(p);
  if(!opts.skipFetch){
    if(p==="email"||p==="subscriptions") refreshEmailData({scope:p});
    if(p==="billing") Promise.all([refreshSubscription({quiet:true}),refreshBusinesses({quiet:true})]);
    if(p==="batches") refreshBatchData();
    if(p==="reconciliation") refreshReconciliation();
    if(p==="income") refreshIncome({quiet:true,withReconciliation:false});
  }
}
function openBusiness(tab,source=null,opts={}){
  const previous=currentPageKey();
  if(!opts.bypassSetup&&!["profile","approver","finance"].includes(tab)&&requireCompanySetup("business"))return;
  if(!opts.soft&&!ROUTE_BOOTSTRAPPING&&previous!=="business"){hardNavigate("business",{biz:tab});return;}
  COMPANY_SETUP_ACTIVE=tab;
  const gate=el("companySetupGate");if(gate)gate.hidden=true;
  document.body.classList.remove("company-setup-required");
  document.querySelectorAll(".navlink,.subnavlink").forEach(x=>x.classList.remove("active"));
  if(source)source.classList.add("active");
  if(el("mobileMoreNav"))el("mobileMoreNav").classList.add("active");
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("show"));
  el("page-business").classList.add("show");
  if(previous&&previous!=="business"){releasePageDom(previous);releasePageData(previous,"business");}
  el("pageTitle").textContent={profile:"ข้อมูลธุรกิจ",approver:"ผู้อนุมัติค่าใช้จ่าย",categories:"หมวดหมู่",finance:"ช่องทางการเงิน",team:"ทีมของฉัน"}[tab]||"จัดการธุรกิจ";
  el("rangeSel").style.display="none";
  setBusinessTab(tab);
}
function renderBusiness(){
  if(!el("bizCompany"))return;
  el("bizCompany").value=SETTINGS.company_name||"";
  el("bizAddress").value=String(SETTINGS.company_address||"").replace(/\\n/g,"\n");
  el("bizTaxId").value=SETTINGS.tax_id||"";
  el("bizApprover").value=SETTINGS.approver_name||"";
  const qs=`?tenant=${encodeURIComponent(TENANT)}&k=${encodeURIComponent(K)}`;
  el("openAssetSettings").href=location.origin+"/receipt"+qs;
  el("openSignatureSettings").href=location.origin+"/receipt"+qs;
  const readiness=[
    ["ชื่อธุรกิจ",SETTINGS.company_name||"ยังไม่กรอก"],
    ["เลขผู้เสียภาษี",SETTINGS.tax_id||"ยังไม่กรอก"],
    ["ผู้อนุมัติ",SETTINGS.approver_name||"ยังไม่กรอก"],
    ["ลายเซ็น",hasApproverSignature()?"พร้อมใช้งาน":"ยังไม่อัปโหลด"],
  ];
  el("businessReadiness").innerHTML=readiness.map(([k,v])=>`<div class="summary-item"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("");
  const signatureUrl=approverSignatureUrl();
  const signatureReady=hasApproverSignature();
  const signaturePreview=compactImageUrl(signatureUrl,420);
  el("signatureStatus").innerHTML=`<div class="status-line ${signatureReady?"ok":""}"><span class="light"></span><span>${signatureReady?"มีลายเซ็นพร้อมใช้ในเอกสารใหม่":"ยังไม่มีลายเซ็นผู้อนุมัติ"}</span></div>${signaturePreview?`<div style="margin-top:14px"><img src="${escAttr(signaturePreview)}" loading="lazy" decoding="async" alt="ลายเซ็น" style="max-width:220px;max-height:90px;object-fit:contain;border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff"></div>`:""}`;

  const custom=parseSettingList("custom_categories");
  el("customCategoryTags").innerHTML=custom.length?custom.map((c,i)=>`<span class="manage-tag">${esc(c)}<button data-remove-category="${i}" aria-label="ลบ">×</button></span>`).join(""):'<span style="font-size:12px;color:var(--muted)">ยังไม่มีหมวดที่เพิ่มเอง</span>';
  const detected=[...new Set(ALL.map(r=>r.category).filter(Boolean))];
  el("detectedCategoryTags").innerHTML=detected.length?detected.map(c=>`<span class="manage-tag detected">${esc(c)}</span>`).join(""):'<span style="font-size:12px;color:var(--muted)">ยังไม่พบหมวดจากรายการ</span>';

  const channels=financeChannels(false);
  el("financeList").innerHTML=channels.length?channels.map((x,i)=>`<div class="finance-account-card ${x.active?"":"inactive"}"><div class="finance-account-main"><div class="finance-account-icon">${esc(financeChannelIcon(x))}</div><div class="finance-account-copy"><strong>${esc(financeChannelTitle(x))}${x.isDefault?'<span class="finance-badge default">บัญชีหลัก</span>':""}${x.canReceive?'<span class="finance-badge" style="background:#edf8ef;color:#248a3d">รับเงิน</span>':""}${x.canPay?'<span class="finance-badge">จ่ายเงิน</span>':""}${x.autoDetect?'<span class="finance-badge" style="background:#eef3ff;color:#3159a7">Auto สลิป</span>':""}${x.active?'<span class="finance-badge">เปิดใช้งาน</span>':'<span class="finance-badge" style="background:#eee;color:#666">ปิดใช้งาน</span>'}</strong><small>${esc(financeChannelDetail(x))} · ${esc(({bank:"บัญชีธนาคาร",promptpay:"พร้อมเพย์",ewallet:"e-Wallet",cash:"เงินสด / เงินทดรอง"})[x.type]||x.type)}</small></div></div><div class="finance-account-actions"><button class="btn small" data-edit-finance="${i}">แก้ไข</button>${x.isDefault?"":`<button class="btn small" data-default-finance="${i}">ตั้งเป็นบัญชีหลัก</button>`}<button class="btn small" data-toggle-finance="${i}">${x.active?"ปิดใช้งาน":"เปิดใช้งาน"}</button></div></div>`).join(""):'<div class="finance-empty"><b>ยังไม่มีช่องทางการเงิน</b><br><span>เพิ่มบัญชีต้นทางอย่างน้อย 1 บัญชีก่อนเริ่มจ่ายและกระทบยอด</span></div>';

  const members=parseSettingList("team_members");
  const detectedMap=new Map();
  ALL.forEach(r=>{
    const name=String(r.payerName||r.sender||"").trim();
    const lineUserId=String(r.payerId||"").trim();
    if(!name&&!lineUserId)return;
    const key=lineUserId||name.toLowerCase();
    if(!detectedMap.has(key))detectedMap.set(key,{name:name||"สมาชิกจาก LINE",lineUserId,role:"ผู้ส่งรายการจาก LINE",source:"detected"});
  });
  const matched=(x)=>members.some(m=>(x.lineUserId&&String(m.lineUserId||"")===x.lineUserId)||String(m.name||"").trim().toLowerCase()===String(x.name||"").trim().toLowerCase());
  const combined=[...members.map((x,i)=>({...x,source:"saved",savedIndex:i})),...[...detectedMap.values()].filter(x=>!matched(x))];
  TEAM_RENDERED=combined;
  el("teamList").innerHTML=combined.length?combined.map((x,i)=>{
    const bank=[x.bank,x.accountNo].filter(Boolean).join(" · ");
    const owner=x.accountName?`ชื่อบัญชี ${esc(x.accountName)}`:"";
    const complete=Boolean(x.name&&x.bank&&x.accountNo&&x.accountName);
    const lineMeta=x.lineUserId?`LINE ···${esc(String(x.lineUserId).slice(-6))}`:"ยังไม่ผูก LINE";
    const state=`<span class="member-state ${complete?"ready":"missing"}">${complete?"พร้อมรับเงิน":"ข้อมูลบัญชีไม่ครบ"}</span>`;
    const actions=x.source==="saved"
      ?`<div class="team-row-actions"><button class="btn small" data-edit-team="${x.savedIndex}">แก้ไข</button><button class="icon-btn" data-remove-team="${x.savedIndex}" aria-label="ลบ">×</button></div>`
      :`<div class="team-row-actions"><button class="btn small solid" data-prefill-team="${i}">เพิ่มข้อมูล</button></div>`;
    return `<div class="list-card-row"><div><strong>${esc(x.name||"—")}</strong><div class="sub">${esc(x.role||"สมาชิก")}${bank?` · ${esc(bank)}`:""}${owner?`<br>${owner}`:""}<br>${lineMeta}</div></div><div>${state}</div>${actions}</div>`;
  }).join(""):'<div class="empty-compact">ยังไม่มีข้อมูลสมาชิก</div>';
}
function onboardingState(){
  const st=companySetupState();
  return {owner_gmail:st.owner_gmail,company_documents:st.company_documents,finance:st.finance};
}
function renderOnboarding(){
  const st=onboardingState();const order=["owner_gmail","company_documents","finance"];
  const done=order.filter(k=>st[k]).length;
  el("onboardingCount").textContent=`${done}/3`;
  el("onboardingBar").style.width=`${done/3*100}%`;
  const onboardingCard=el("onboardingCard"),onboardingTitle=onboardingCard?.querySelector(".onboarding-head strong");
  if(onboardingCard)onboardingCard.classList.toggle("complete",done===3);
  if(onboardingTitle)onboardingTitle.textContent=done===3?"บริษัทพร้อมใช้งาน":"ตั้งค่าบริษัท";
  if(done===3&&onboardingCard)onboardingCard.classList.add("closed");
  let foundNext=false;
  document.querySelectorAll(".onboard-step").forEach(b=>{
    const yes=st[b.dataset.step];b.classList.toggle("done",yes);b.classList.remove("next");
    b.querySelector(".step-dot").textContent=yes?"✓":"";
    if(!yes&&!foundNext){b.classList.add("next");foundNext=true;}
  });
  renderCompanySetupGate();
}
function onboardAction(step){
  openCompanySetupStep(step);
}


/* ---------- EMAIL INBOX / SUBSCRIPTIONS ---------- */
function currencyAmount(amount,currency="THB"){
  const n=Number(amount||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
  return String(currency||"THB").toUpperCase()==="THB"?`฿${n}`:`${esc(currency||"")} ${n}`;
}
function emailStatusClass(status){
  if(status==="รอตรวจสอบ")return "review";
  if(status==="บันทึกแล้ว")return "done";
  if(status==="สงสัยซ้ำ")return "dup";
  if(status==="อ่านไม่สำเร็จ")return "error";
  return "skip";
}
function emailFiltered(){
  const q=(el("emailQ")?.value||"").trim().toLowerCase();
  const status=el("emailStatus")?.value||"";
  return EMAIL_DOCS.filter(r=>{
    if(status&&r.status!==status)return false;
    if(!q)return true;
    return [r.vendor,r.invoiceNo,r.subject,r.filename,r.note,r.from].join(" ").toLowerCase().includes(q);
  });
}
function emailItemHTML(r){
  const original=r.driveUrl?`<a class="btn small" href="${escAttr(r.driveUrl)}" target="_blank" rel="noopener">เปิดไฟล์ต้นฉบับ</a>`:"";
  const approve=(r.status!=="บันทึกแล้ว"&&r.status!=="ไม่ใช่เอกสาร"&&r.status!=="ข้ามแล้ว")?`<button class="btn small solid" data-email-action="approve" data-id="${escAttr(r.id)}">บันทึกรายจ่าย</button>`:"";
  const edit=(r.status!=="บันทึกแล้ว")?`<button class="btn small ghost" data-email-action="edit" data-id="${escAttr(r.id)}">แก้ไข</button>`:"";
  const ignore=(r.status!=="บันทึกแล้ว"&&r.status!=="ข้ามแล้ว")?`<button class="btn small danger" data-email-action="ignore" data-id="${escAttr(r.id)}">ข้าม</button>`:"";
  const tx=pdate(r.documentDate), received=cdate(r.receivedAt);
  return `<div class="email-item">
    <div>
      <div class="email-title">${esc(r.vendor||r.subject||r.filename||"ไม่ระบุเอกสาร")}</div>
      <div class="email-sub">${esc(r.docType||"รอตรวจประเภท")} ${r.invoiceNo?`· เลขที่ ${esc(r.invoiceNo)}`:""}<br>${esc(r.subject||"")}<br>จาก ${esc(r.from||"—")} · ได้รับ ${fmtDate(received,true)}</div>
      <div class="email-meta"><span class="email-status ${emailStatusClass(r.status)}">${esc(r.status||"รอตรวจสอบ")}</span>${r.category?`<span class="chip">${esc(r.category)}</span>`:""}${r.isSubscription?'<span class="chip">รายจ่ายประจำ</span>':""}${tx?`<span class="chip">วันที่ ${fmtDate(tx)}</span>`:""}</div>
      ${r.flag?`<div class="email-warning">${esc(r.flag)}</div>`:""}
      ${r.duplicateStatus?`<div class="email-duplicate">สงสัยซ้ำ: ${esc(r.duplicateStatus)}${r.duplicateOf?` · อ้างอิง ${esc(r.duplicateOf)}`:""}</div>`:""}
      ${r.bodyPreview?`<details class="email-preview"><summary>ดูข้อความในอีเมล</summary><div>${esc(r.bodyPreview)}</div></details>`:""}
    </div>
    <div><div class="email-amt">${r.amount?currencyAmount(r.amount,r.currency):"—"}</div><div class="email-sub" style="text-align:right">${r.vatAmount?`VAT ${currencyAmount(r.vatAmount,r.currency)}`:""}</div><div class="email-actions">${original}${edit}${ignore}${approve}</div></div>
  </div>`;
}
function renderEmailInbox(){
  if(!el("emailList"))return;
  el("emailKReview").textContent=EMAIL_DOCS.filter(x=>x.status==="รอตรวจสอบ").length;
  el("emailKDuplicate").textContent=EMAIL_DOCS.filter(x=>x.status==="สงสัยซ้ำ").length;
  el("emailKDone").textContent=EMAIL_DOCS.filter(x=>x.status==="บันทึกแล้ว").length;
  el("emailKSubscription").textContent=SUBSCRIPTIONS.length;
  const rows=emailFiltered();
  const emailPages=Math.max(1,Math.ceil(rows.length/EMAIL_PAGE_SIZE));EMAIL_PAGE=Math.min(Math.max(1,EMAIL_PAGE),emailPages);
  const emailStart=(EMAIL_PAGE-1)*EMAIL_PAGE_SIZE,emailEnd=Math.min(rows.length,emailStart+EMAIL_PAGE_SIZE),visibleEmail=rows.slice(emailStart,emailEnd);
  el("emailList").innerHTML=visibleEmail.length?visibleEmail.map(emailItemHTML).join(""):'<div class="email-empty">ยังไม่มีเอกสารจากอีเมล<br><br>กดเชื่อมต่อ Gmail แล้วระบบจะค้นหาใบเสร็จ ใบกำกับภาษี และ Subscription ให้อัตโนมัติ</div>';
  if(rows.length>EMAIL_PAGE_SIZE)el("emailList").insertAdjacentHTML("beforeend",`<div style="grid-column:1/-1;display:flex;justify-content:center;gap:10px;align-items:center;padding:12px"><button class="btn small" type="button" onclick="changeEmailPage(-1)" ${EMAIL_PAGE<=1?"disabled":""}>‹</button><span>หน้า ${EMAIL_PAGE}/${emailPages}</span><button class="btn small" type="button" onclick="changeEmailPage(1)" ${EMAIL_PAGE>=emailPages?"disabled":""}>›</button></div>`);
  const connected=EMAIL_INFO.connected===true;
  if(el("gmailDisconnected"))el("gmailDisconnected").hidden=connected;
  if(el("gmailConnected"))el("gmailConnected").hidden=!connected;
  if(el("gmailAccount"))el("gmailAccount").textContent=EMAIL_INFO.email||"บัญชี Gmail";
  if(el("gmailMeta")){
    const last=EMAIL_INFO.lastSyncAt?fmtDate(cdate(EMAIL_INFO.lastSyncAt),true):"ยังไม่เคยซิงก์";
    el("gmailMeta").textContent=EMAIL_INFO.reconnectRequired?"สิทธิ์หมดอายุ · กรุณาเชื่อมใหม่":`ซิงก์ล่าสุด ${last} · รอบล่าสุดพบ ${Number(EMAIL_INFO.lastSyncCount||0)} เอกสาร`;
  }
  if(el("emailInboxState")){
    el("emailInboxState").textContent=connected?"ระบบตรวจอีเมลอัตโนมัติและเก็บไฟล์ไว้ใน Google Drive ของบริษัท":EMAIL_INFO.reconnectRequired?"สิทธิ์ Gmail หมดอายุ กรุณาเชื่อมต่อใหม่":"เชื่อมเพื่อเริ่มค้นหาเอกสารจากอีเมล";
  }
  if(el("gmailIntegrationCard"))el("gmailIntegrationCard").classList.toggle("needs-action",EMAIL_INFO.reconnectRequired===true);
  if(el("gmailDisconnectedState")){
    el("gmailDisconnectedState").className="integration-state "+(EMAIL_INFO.reconnectRequired?"bad":"");
    el("gmailDisconnectedState").innerHTML=`<span class="state-dot"></span><span>${EMAIL_INFO.reconnectRequired?"สิทธิ์หมดอายุ · ต้องเชื่อมใหม่":"ยังไม่ได้เชื่อมต่อ"}</span>`;
  }
}
function changeEmailPage(delta){EMAIL_PAGE+=Number(delta||0);renderEmailInbox();el("page-email")?.scrollIntoView({block:"start",behavior:"smooth"});}
function renderSubscriptions(){
  if(!el("subscriptionList"))return;
  const total=SUBSCRIPTIONS.length;
  el("subscriptionList").innerHTML=total?SUBSCRIPTIONS.map(x=>`<div class="sub-card"><div class="sub-name">${esc(x.name)}</div><div class="sub-vendor">${esc(x.vendor||"")}</div><div class="sub-amount">${currencyAmount(x.lastAmount,x.currency)}</div><div class="sub-foot">พบ ${x.count} รอบ${x.variable?" · ยอดแปรผัน":""}<br>ล่าสุด ${fmtDate(pdate(x.lastDate)||cdate(x.lastDate))}<br>คาดว่ารอบถัดไป ${fmtDate(pdate(x.nextExpected))}</div></div>`).join(""):'<div class="email-empty" style="grid-column:1/-1">ยังไม่พบรายจ่ายประจำ<br><br>เมื่อระบบได้รับใบแจ้งหนี้หรือใบเสร็จ Subscription จากอีเมล จะสรุปให้ตรงนี้อัตโนมัติ</div>';
}
async function refreshGmailConnectionStatus({retries=1,delayMs=350}={}){
  let lastError=null;
  for(let attempt=0;attempt<Math.max(1,retries);attempt++){
    try{
      const stamp=`&_=${Date.now()}`;
      const res=await fetch(apiUrl("/api/gmail-status")+stamp,{cache:"no-store"});
      if(!res.ok)throw new Error(`Gmail status ${res.status}`);
      EMAIL_INFO=await res.json();
      const page=currentPageKey();
      if(page==="email")renderEmailInbox();
      if(page==="settings")renderSettings();
      renderOnboarding();
      if(EMAIL_INFO.connected===true&&EMAIL_INFO.reconnectRequired!==true)return true;
    }catch(err){lastError=err;console.warn("gmail status refresh failed",err);}
    if(attempt<retries-1)await new Promise(resolve=>setTimeout(resolve,delayMs));
  }
  if(lastError)console.warn("gmail status unavailable after retry",lastError);
  return EMAIL_INFO.connected===true&&EMAIL_INFO.reconnectRequired!==true;
}

async function refreshEmailData({manual=false,scope=currentPageKey()}={}){
  if(EMAIL_LOADING)return false;
  EMAIL_LOADING=true;
  if(manual&&el("emailInboxState"))el("emailInboxState").textContent="กำลังอัปเดต…";
  let statusOk=false,docsOk=false,subsOk=false;
  try{
    // Gmail connection status is independent from inbox/subscription APIs.
    // Never let a temporary inbox error make Company Setup think Gmail is disconnected.
    statusOk=await refreshGmailConnectionStatus({retries:1});
    const stamp=`&_=${Date.now()}`;
    const needDocs=scope==="email"||scope==="all";
    const needSubs=scope==="subscriptions"||scope==="all";
    const jobs=[];
    if(needDocs)jobs.push(fetch(apiUrl("/api/email-documents")+stamp,{cache:"no-store"}).then(r=>({kind:"docs",r})));
    if(needSubs)jobs.push(fetch(apiUrl("/api/subscriptions")+stamp,{cache:"no-store"}).then(r=>({kind:"subs",r})));
    const results=await Promise.allSettled(jobs);
    for(const result of results){
      if(result.status!=="fulfilled"){console.warn("email data refresh failed",result.reason);continue;}
      const {kind,r}=result.value;if(!r.ok){console.warn("email data refresh failed",kind,r.status);continue;}
      if(kind==="docs"){EMAIL_DOCS=await r.json();docsOk=true;}
      if(kind==="subs"){SUBSCRIPTIONS=await r.json();subsOk=true;}
    }
    if(!needDocs)docsOk=true;if(!needSubs)subsOk=true;
    if(scope==="email"||scope==="all")renderEmailInbox();
    if(scope==="subscriptions"||scope==="all")renderSubscriptions();
    renderOnboarding();if(currentPageKey()==="settings")renderSettings();
    if(manual&&(!docsOk||!subsOk)&&el("emailInboxState"))el("emailInboxState").textContent="เชื่อม Gmail แล้ว แต่ข้อมูลบางส่วนกำลังซิงก์ใหม่";
    return statusOk;
  }catch(err){
    console.error("email inbox refresh failed",err);
    renderOnboarding();
    if(el("emailInboxState"))el("emailInboxState").textContent=EMAIL_INFO.connected?"เชื่อม Gmail แล้ว · กำลังโหลดเอกสารใหม่":"โหลดสถานะ Gmail ไม่สำเร็จ";
    return statusOk;
  }finally{EMAIL_LOADING=false;}
}

async function confirmGmailOAuthReturn(){
  if(QS.get("gmail")!=="connected")return false;
  if(el("companySetupGmailDetail"))el("companySetupGmailDetail").textContent="กำลังยืนยันการเชื่อม Gmail…";
  const connected=await refreshGmailConnectionStatus({retries:8,delayMs:450});
  if(connected){
    COMPANY_SETUP_ACTIVE="";
    renderCompanySetupGate({force:!companySetupState().ready});
    const next=new URL(location.href);
    next.searchParams.delete("gmail");
    history.replaceState(null,"",next.pathname+next.search+next.hash);
  }else{
    renderCompanySetupGate({force:true});
  }
  return connected;
}
async function emailPost(path,body){
  const res=await fetch(apiUrl(path),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body||{})});
  let data={};try{data=await res.json();}catch{}
  return {res,data};
}
async function syncGmail({manual=true}={}){
  if(EMAIL_SYNCING||!EMAIL_INFO.connected)return false;
  EMAIL_SYNCING=true;
  if(el("gmailSyncNow")){el("gmailSyncNow").disabled=true;el("gmailSyncNow").textContent="กำลังซิงก์…";}
  if(el("emailInboxState"))el("emailInboxState").textContent="กำลังค้นหาเอกสารใหม่ใน Gmail…";
  try{
    const {res,data}=await emailPost("/api/gmail-sync",{maxMessages:manual?20:8,notify:true});
    if(!res.ok){if(data.reconnectRequired){EMAIL_INFO=data;renderEmailInbox();}throw new Error(data.reason||data.detail||"ซิงก์ไม่สำเร็จ");}
    const emailPageOpen=el("page-email")?.classList.contains("show")||el("page-subscriptions")?.classList.contains("show");
    if(manual||emailPageOpen)await refreshEmailData();else await refreshGmailConnectionStatus({retries:1});
    if(manual&&data.imported===0)alert("ซิงก์เรียบร้อย ยังไม่พบเอกสารใหม่");
    return true;
  }catch(err){console.error(err);if(manual)alert("ซิงก์ Gmail ไม่สำเร็จ: "+String(err.message||err));return false;}
  finally{EMAIL_SYNCING=false;if(el("gmailSyncNow")){el("gmailSyncNow").disabled=false;el("gmailSyncNow").textContent="ซิงก์ตอนนี้";}}
}
async function approveEmail(id,force=false){
  const {res,data}=await emailPost("/api/email-approve",{id,force});
  if(res.status===409&&data.reason==="duplicate"){
    const reasons=(data.duplicateCheck?.matches||[]).map(x=>`${x.reason} · ${x.vendor||""} ${baht(x.amount)}`).join("\n");
    if(confirm(`ระบบพบรายการที่อาจซ้ำ\n\n${reasons}\n\nต้องการบันทึกซ้ำอยู่ดีหรือไม่?`))return approveEmail(id,true);
    return;
  }
  if(!res.ok){alert(data.hint||data.reason||"บันทึกไม่สำเร็จ");return;}
  await Promise.all([refreshEmailData(),refreshData({manual:true})]);
}
function openEmailEditor(id){
  const r=EMAIL_DOCS.find(x=>x.id===id);if(!r)return;
  el("modalBody").innerHTML=`<h3 style="margin-top:0">ตรวจเอกสารจากอีเมล</h3>
    <div class="form-grid" style="margin-top:16px">
      <label><span>ผู้ขาย/ผู้ให้บริการ</span><input id="emVendor" value="${escAttr(r.vendor||"")}"></label>
      <label><span>เลขที่เอกสาร</span><input id="emInvoice" value="${escAttr(r.invoiceNo||"")}"></label>
      <label><span>วันที่เอกสาร</span><input id="emDate" type="date" value="${escAttr(r.documentDate||"")}"></label>
      <label><span>วันครบกำหนด</span><input id="emDue" type="date" value="${escAttr(r.dueDate||"")}"></label>
      <label><span>ยอดรวม</span><input id="emAmount" type="number" step="0.01" value="${escAttr(r.amount||0)}"></label>
      <label><span>สกุลเงิน</span><input id="emCurrency" value="${escAttr(r.currency||"THB")}"></label>
      <label><span>ก่อน VAT</span><input id="emSubtotal" type="number" step="0.01" value="${escAttr(r.subtotal||0)}"></label>
      <label><span>VAT</span><input id="emVat" type="number" step="0.01" value="${escAttr(r.vatAmount||0)}"></label>
      <label><span>หมวด</span><input id="emCategory" value="${escAttr(r.category||"")}"></label>
      <label><span>รอบบริการ</span><input id="emPeriod" value="${escAttr(r.servicePeriod||"")}"></label>
      <label style="grid-column:1/-1"><span>รายละเอียด</span><textarea id="emNote" rows="3">${esc(r.note||"")}</textarea></label>
      <label style="grid-column:1/-1;display:flex;align-items:center;gap:9px"><input id="emSubscription" type="checkbox" ${r.isSubscription?"checked":""} style="width:auto"><span>ติดตามเป็นรายจ่ายประจำ / Subscription</span></label>
      <label style="grid-column:1/-1"><span>ชื่อบริการ/แพ็กเกจ</span><input id="emSubscriptionName" value="${escAttr(r.subscriptionName||"")}"></label>
    </div>
    <div style="display:flex;gap:9px;justify-content:flex-end;margin-top:18px"><button class="btn" id="emCancel">ยกเลิก</button><button class="btn solid" id="emSave">บันทึกการแก้ไข</button></div>`;
  el("modal").classList.add("show");
  el("emCancel").onclick=closeGlobalModal;
  el("emSave").onclick=async()=>{
    const patch={vendor:el("emVendor").value.trim(),invoiceNo:el("emInvoice").value.trim(),documentDate:el("emDate").value,dueDate:el("emDue").value,amount:+el("emAmount").value||0,currency:el("emCurrency").value.trim().toUpperCase(),subtotal:+el("emSubtotal").value||0,vatAmount:+el("emVat").value||0,category:el("emCategory").value.trim(),servicePeriod:el("emPeriod").value.trim(),note:el("emNote").value.trim(),isSubscription:el("emSubscription").checked,subscriptionName:el("emSubscriptionName").value.trim()};
    const {res,data}=await emailPost("/api/email-update",{id,patch});if(!res.ok){alert(data.reason||"บันทึกไม่สำเร็จ");return;}closeGlobalModal();await refreshEmailData();
  };
}


/* ---------- REIMBURSEMENT BATCHES: ONE ACCOUNTING TABLE V4 ---------- */
const BATCH_WEEKDAYS=["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const DASHBOARD_UI_VERSION="MODULAR_ROUTE_V6_0_20260809";
console.info("Dashboard UI",DASHBOARD_UI_VERSION);
const EXPECTED_BATCH_CONTRACT="REIMBURSEMENT_ACCOUNTING_TABLE_V6";
const BATCH_STATUS_META={
  queue:{label:"รอตรวจเอกสาร",hint:"รายการย่อยที่ยืนยันแล้วและยังรวมเป็นใบเบิกหลักได้",order:2},
  review:{label:"รอตรวจเอกสาร",hint:"ตรวจหลักฐานและเอกสารก่อนอนุมัติ",order:2},
  correction:{label:"ต้องแก้ไข",hint:"รอพนักงานแก้ไขหรือแนบเอกสาร",order:1},
  rejected:{label:"ไม่อนุมัติ",hint:"ใบเบิกถูกปฏิเสธหรือยกเลิก",order:9},
  payment:{label:"รอโอนเงิน",hint:"เอกสารผ่านแล้ว พร้อมทำรายการโอน",order:3},
  paid:{label:"จ่ายแล้ว",hint:"ปิดงานเรียบร้อย",order:8},
  missing:{label:"ข้อมูลบัญชีไม่ครบ",hint:"ต้องเพิ่มบัญชีรับเงินก่อน",order:0},
};
function batchDate(v){const d=pdate(v)||cdate(v);return d?fmtDate(d):"—";}
function batchReceiptDate(row={}){
  const values=row.kind==="queue"?[row.receiptDate||row.raw?.dateISO||row.raw?.dateText||row.raw?.date]:(row.raw?.items||[]).map(item=>item.dateISO||item.dateText||item.date);
  const dates=values.map(v=>pdate(v)||cdate(v)).filter(Boolean).sort((a,b)=>a-b);
  if(!dates.length)return "—";
  const first=dates[0],last=dates[dates.length-1];
  const firstKey=`${first.getFullYear()}-${first.getMonth()}-${first.getDate()}`,lastKey=`${last.getFullYear()}-${last.getMonth()}-${last.getDate()}`;
  return firstKey===lastKey?fmtDate(first):`${fmtDate(first)} – ${fmtDate(last)}`;
}
function batchSettingsText(){const s=BATCH_DATA.settings||{};const hh=String(Number(s.hour??11)).padStart(2,"0"),mm=String(Number(s.minute??0)).padStart(2,"0");return `${BATCH_WEEKDAYS[Number(s.weekday??1)]||"จันทร์"} ${hh}:${mm} น.`;}
function splitLinks(v){return String(v||"").split(",").map(x=>x.trim()).filter(Boolean);}
function uniqueLinks(rows){return [...new Set(rows.filter(Boolean))];}
function batchStep(b={}){
  const status=String(b.status||"");
  if(status==="จ่ายแล้ว"||b.paymentSlipUrl)return "paid";
  if(["ยกเลิก","ไม่อนุมัติ","rejected","Rejected"].includes(status))return "rejected";
  if(["ต้องแก้ไข","ตีกลับ"].includes(status))return "correction";
  if(b.workflowStep)return b.workflowStep==="proof"?"payment":b.workflowStep;
  if(["รอตรวจเอกสาร","รออนุมัติ","รวมรอบแล้ว"].includes(status))return "review";
  return "payment";
}
function rowStatus(row){if(row.statusKey==="missing")return BATCH_STATUS_META.missing;return BATCH_STATUS_META[row.statusKey]||{label:"กำลังดำเนินการ",hint:"",order:9};}
function itemLinks(item={}){
  const links=[];
  const add=(label,url)=>{if(url)links.push({label,url});};
  add("รูปหลักฐาน",item.imageUrl);
  splitLinks(item.attReceipt).forEach((u,i)=>add(i?`ใบเสร็จ ${i+1}`:"ใบเสร็จ",u));
  splitLinks(item.attTax).forEach((u,i)=>add(i?`ใบกำกับ ${i+1}`:"ใบกำกับภาษี",u));
  splitLinks(item.attSlip).forEach((u,i)=>add(i?`สลิป ${i+1}`:"สลิปต้นฉบับ",u));
  splitLinks(item.attOther).forEach((u,i)=>add(i?`เอกสารอื่น ${i+1}`:"เอกสารอื่น",u));
  
  return links.filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
}
function itemDocumentReady(item={}){return itemLinks(item).length>0;}
function batchDocumentStats(b={}){
  const items=Array.isArray(b.items)?b.items:[];
  if(!items.length)return {ready:0,total:Number(b.itemCount||0)||1,pct:0};
  const ready=items.filter(itemDocumentReady).length;
  return {ready,total:items.length,pct:Math.round(ready/items.length*100)};
}
function masterPendingRows(){
  const out=[];
  (BATCH_DATA.pending?.groups||[]).forEach((g,gi)=>(g.items||[]).forEach(r=>{
    const urgent=r.batchType==="ด่วน"||r.batchStatus==="ขอเบิกด่วน";
    out.push({kind:"queue",id:String(r.id||""),groupIndex:gi,statusKey:g.profileComplete===false?"missing":"review",priority:urgent?"urgent":"normal",claimDate:r.createdAt||r.submittedAt||r.recordedAt||r.dateISO||r.dateText||"",receiptDate:r.dateISO||r.dateText||r.date||"",payerName:g.payerName||"—",accountName:g.accountName||"",bank:g.bank||"",accountNo:g.accountNo||g.accountMasked||"",amount:Number(r.amount||0),title:`รายการย่อย ${r.id||""}`,note:`${r.vendor||"ไม่ระบุผู้รับ"} · ${r.note||r.category||"—"}`,raw:r,group:g});
  }));
  return out;
}
function masterBatchRows(){
  return (BATCH_DATA.batches||[]).filter(b=>!["ถูกรวมแล้ว","merged"].includes(String(b.status||"").trim())).map(b=>{
    const step=batchStep(b),urgent=b.type==="ด่วน";
    return {kind:"batch",id:String(b.id||b.docId||""),statusKey:b.profileComplete===false&&step!=="paid"?"missing":step,workflowStep:step,priority:urgent?"urgent":"normal",claimDate:b.createdAt||b.submittedAt||b.updatedAt||"",receiptDate:b.periodStart||"",payerName:b.payerName||"—",accountName:b.accountName||"",bank:b.bank||"",accountNo:b.accountNo||"",amount:Number(b.total||0),title:b.docId||b.runNo||"—",note:`ใบเบิกหลัก · ${Number(b.itemCount||0)} รายการย่อย · ${urgent?"ด่วน":"ปกติ"}`,raw:b};
  });
}
function allMasterRows(){return [...masterPendingRows(),...masterBatchRows()];}
function masterFilteredRows(){
  const q=String(el("batchMasterSearch")?.value||"").trim().toLowerCase();
  const status=el("batchMasterStatus")?.value||BATCH_STAGE||"all";
  let rows=allMasterRows();
  if(status!=="all")rows=rows.filter(r=>r.statusKey===status||(status===r.workflowStep&&r.statusKey!=="missing"));
  if(q)rows=rows.filter(r=>[r.payerName,r.accountName,r.bank,r.accountNo,r.title,r.note,r.raw?.runNo,r.raw?.docId,r.raw?.rejectionReason,r.raw?.paymentChannelLabel,r.raw?.paymentChannelBank,r.raw?.paymentChannelNumber,...(r.raw?.items||[]).flatMap(x=>[x.vendor,x.note,x.category])].some(v=>String(v||"").toLowerCase().includes(q)));
  rows.sort((a,b)=>{
    const dateDiff=(Date.parse(b.claimDate||0)||0)-(Date.parse(a.claimDate||0)||0);if(dateDiff)return dateDiff;
    const ua=a.priority==="urgent"?-1:0,ub=b.priority==="urgent"?-1:0;if(ua!==ub)return ua-ub;
    const oa=rowStatus(a).order,ob=rowStatus(b).order;if(oa!==ob)return oa-ob;
    return String(b.id||"").localeCompare(String(a.id||""),"th",{numeric:true});
  });
  return rows;
}
function selectedPaymentRows(){const map=new Map(masterBatchRows().filter(r=>r.workflowStep==="payment"&&r.statusKey!=="missing").map(r=>[r.id,r.raw]));return [...TRANSFER_SELECTED].map(id=>map.get(id)).filter(Boolean);}
function setStatusFilter(value){BATCH_PAGE=1;BATCH_STAGE=value||"all";if(el("batchMasterStatus"))el("batchMasterStatus").value=BATCH_STAGE;document.querySelectorAll("[data-batch-filter]").forEach(b=>b.classList.toggle("active",b.dataset.batchFilter===BATCH_STAGE));renderMasterTable();}
function updateStatusCounts(){
  const rows=allMasterRows(),count=k=>rows.filter(r=>r.statusKey===k||(r.workflowStep===k&&r.statusKey!=="missing")).length;
  const map={statusAllCount:rows.length,statusQueueCount:count("queue"),statusReviewCount:count("review"),statusCorrectionCount:count("correction"),statusRejectedCount:count("rejected"),statusPaymentCount:count("payment"),statusPaidCount:count("paid")};
  Object.entries(map).forEach(([id,n])=>{if(el(id))el(id).textContent=Number(n||0).toLocaleString("th-TH");});
}
function reviewMergeSelectable(row){return row?.statusKey==="review"&&(row.kind==="queue"||(row.kind==="batch"&&row.workflowStep==="review"));}
function reviewMergeSelected(row){return row.kind==="queue"?BATCH_SELECTED.has(row.id):REVIEW_BATCH_SELECTED.has(row.id);}
function setReviewMergeSelected(row,selected){const set=row.kind==="queue"?BATCH_SELECTED:REVIEW_BATCH_SELECTED;if(selected)set.add(row.id);else set.delete(row.id);}
function updateMasterSelection(){
  const qn=BATCH_SELECTED.size+REVIEW_BATCH_SELECTED.size;
  const pieces=[];if(BATCH_SELECTED.size)pieces.push(`${BATCH_SELECTED.size} รายการย่อย`);if(REVIEW_BATCH_SELECTED.size)pieces.push(`${REVIEW_BATCH_SELECTED.size} ใบเบิก`);
  const text=qn?`เลือก ${pieces.join(" + ")}`:"ยังไม่ได้เลือกรายการ";
  if(el("batchMasterSelected"))el("batchMasterSelected").textContent=text;
  if(el("batchBulkHint"))el("batchBulkHint").textContent=qn?"รวมทุกแถวที่เลือกเป็นใบเบิกหลักใหม่":"เลือกหลายรายการเพื่อรวมเป็นใบเบิก (ฟีเจอร์เสริม ไม่ใช่ขั้นตอนบังคับ)";
  if(el("batchMasterCreate"))el("batchMasterCreate").disabled=!qn;
  const visible=masterFilteredRows().filter(reviewMergeSelectable);
  const checked=visible.filter(reviewMergeSelected).length;
  const head=el("batchMasterHeaderCheck");if(head){head.checked=visible.length>0&&checked===visible.length;head.indeterminate=checked>0&&checked<visible.length;}
}
function batchPaymentChannels(){const fromApi=Array.isArray(BATCH_DATA.paymentChannels)?BATCH_DATA.paymentChannels.map(normalizeFinanceChannel):[];return (fromApi.length?fromApi:financeChannels(false));}
function batchChannelById(id){return batchPaymentChannels().find(x=>String(x.id)===String(id))||null;}
function batchChannelSnapshot(b={}){return batchChannelById(b.paymentChannelId)||(b.paymentChannelId?{id:b.paymentChannelId,label:b.paymentChannelLabel||b.paymentChannelBank||"บัญชีที่จ่าย",type:b.paymentChannelType||"bank",bank:b.paymentChannelBank||"",number:b.paymentChannelNumber||"",name:b.paymentChannelName||"",active:false}:null);}
function batchChannelOptions(selectedId="",placeholder="เลือกบัญชีที่ใช้จ่าย"){const channels=batchPaymentChannels().filter(x=>x.active||String(x.id)===String(selectedId));return `<option value="">${esc(placeholder)}</option>${channels.map(x=>`<option value="${escAttr(x.id)}" ${String(x.id)===String(selectedId)?"selected":""}>${esc(financeChannelTitle(x))} · ${esc(financeChannelDetail(x))}</option>`).join("")}`;}
function paymentChannelCell(row){if(row.kind!=="batch")return `<span class="payment-proof-empty">สร้างใบเบิกก่อน</span>`;const b=row.raw||{},channel=batchChannelSnapshot(b),canAssign=row.workflowStep==="payment"||(row.workflowStep==="paid"&&String(b.reconcileStatus||"")!=="กระทบยอดแล้ว");if(canAssign){const channels=batchPaymentChannels().filter(x=>x.active||String(x.id)===String(b.paymentChannelId||""));if(!channels.length)return `<button class="btn small" data-open-finance>สร้างช่องทางการเงิน</button>`;return `<select class="payment-channel-select" data-payment-channel-select data-batch-id="${escAttr(row.id)}" aria-label="บัญชีที่ใช้จ่าย">${batchChannelOptions(b.paymentChannelId,row.workflowStep==="paid"?"ระบุบัญชีที่จ่ายย้อนหลัง":"เลือกบัญชีที่ใช้จ่าย")}</select>`;}if(channel)return `<span class="payment-source-card"><strong>${esc(financeChannelTitle(channel))}</strong><small>${esc(financeChannelDetail(channel))}</small></span>`;if(row.workflowStep==="paid")return `<span class="payment-source-missing">ไม่ระบุบัญชีที่จ่าย</span>`;return `<span class="payment-proof-empty">เลือกหลังเอกสารผ่าน</span>`;}
async function assignBatchPaymentChannel(batchId,paymentChannelId,{quiet=false}={}){if(!batchId||!paymentChannelId)throw new Error("กรุณาเลือกช่องทางการเงิน");const out=await batchPost("/api/batch-workflow",{batchId,action:"assign_payment_channel",payload:{paymentChannelId}});await refreshBatchData({quiet:true});if(!quiet){const channel=out.paymentChannel||batchChannelById(paymentChannelId);if(channel)console.info("payment channel assigned",financeChannelTitle(channel));}return out;}

function documentCell(row){
  if(row.kind==="queue"){
    const item=row.raw||{},links=itemLinks(item),ready=itemDocumentReady(item)?1:0;
    const docs=[];
    if(item.claimPdfUrl)docs.push(`<a href="${escAttr(item.claimPdfUrl)}" target="_blank" rel="noopener">เปิดใบเบิกรายการ</a>`);
    if(item.receiptPdfUrl)docs.push(`<a href="${escAttr(item.receiptPdfUrl)}" target="_blank" rel="noopener">เปิดใบแทน</a>`);
    if(!docs.length&&links.length)docs.push(`<a href="${escAttr(links[0].url)}" target="_blank" rel="noopener">เปิดหลักฐาน</a>`);
    return `<div class="acct-doc-state ${ready?"":"bad"}"><span>${ready?"เอกสารพร้อมตรวจ":"ยังขาดหลักฐาน"}</span></div><div class="drawer-links">${docs.join("")}</div>`;
  }
  const st=batchDocumentStats(row.raw);
  return `<div class="acct-doc-state ${st.ready===st.total?"":"bad"}"><div class="acct-doc-meter"><i style="width:${st.pct}%"></i></div><span>${st.ready}/${st.total} รายการย่อย</span></div>${row.raw.pdfUrl?`<div class="drawer-links"><a href="${escAttr(row.raw.pdfUrl)}" target="_blank" rel="noopener">เปิดใบเบิกหลัก</a></div>`:""}`;
}
function issueCell(row){
  const b=row.raw||{};
  if(row.statusKey==="missing")return `<div class="acct-issue bad">ข้อมูลบัญชีไม่ครบ: ${esc((b.missingProfileFields||row.group?.missingProfileFields||[]).join(", ")||"กรุณาเพิ่มบัญชีรับเงิน")}</div>`;
  if(row.workflowStep==="correction")return `<div class="acct-issue bad">${esc(b.rejectionReason||"รอผู้เบิกแก้ไข")}</div><div class="master-secondary">LINE: ${esc(b.lineNotifyStatus||"—")}</div>`;
  if(row.workflowStep==="rejected")return `<div class="acct-issue bad">${esc(b.rejectionReason||"ใบเบิกถูกปฏิเสธหรือยกเลิก")}</div>`;
  if(row.workflowStep==="payment"){const b=row.raw||{};return `<div class="acct-issue">${b.paymentChannelId?"พร้อมโอนจากบัญชีที่เลือก":"เลือกบัญชีที่ใช้จ่าย แล้วโอนพร้อมแนบหลักฐาน"}</div>`;}
  if(row.workflowStep==="paid"){const reconciled=String(b.reconcileStatus||"")==="กระทบยอดแล้ว";return `<div class="acct-issue">${reconciled?"กระทบยอดแล้ว":"ยังไม่กระทบยอดธนาคาร"}</div><div class="master-secondary ${String(b.lineNotifyStatus||"").includes("ไม่สำเร็จ")?"acct-line-fail":""}">LINE: ${esc(b.lineNotifyStatus||"—")}</div>`;}
  const duplicate=(b.items||[]).filter(x=>x.duplicateStatus).length;
  return `<div class="acct-issue">${duplicate?`พบรายการอาจซ้ำ ${duplicate} รายการ`:rowStatus(row).hint}</div>`;
}
function paymentProofCell(row){
  const b=row.raw||{};
  if(row.kind!=="batch")return `<span class="payment-proof-empty">—</span>`;
  if(b.paymentSlipUrl){
    const paidAt=batchDate(b.paymentSlipAt||b.paidAt||b.updatedAt);
    return `<div class="payment-proof-cell"><a class="payment-proof-link" href="${escAttr(b.paymentSlipUrl)}" target="_blank" rel="noopener">เปิดหลักฐานการโอน</a><span class="payment-proof-meta">${paidAt}${b.lineNotifyStatus?` · LINE ${esc(b.lineNotifyStatus)}`:""}</span></div>`;
  }
  if(row.workflowStep==="payment")return `<span class="payment-proof-empty">ยังไม่ได้แนบ</span>`;
  return `<span class="payment-proof-empty">—</span>`;
}
function nextActionCell(row){
  if(row.statusKey==="missing")return `<button class="btn" data-open-team>เพิ่มข้อมูลบัญชี</button>`;
  if(row.kind==="queue")return `<button class="btn primary-next" data-open-queue-review="${escAttr(row.id)}">ดูรายละเอียดและตรวจ</button>`;
  const step=row.workflowStep;
  if(step==="payment")return `<button class="btn solid primary-next" data-pay-batch="${escAttr(row.id)}">โอนและแนบหลักฐาน</button>`;
  const label=step==="review"?"ตรวจเอกสาร":step==="correction"?"ดูรายการแก้ไข":step==="rejected"?"ดูรายละเอียด":step==="paid"?"ดูรายละเอียด":"เปิด";
  return `<button class="btn ${step==="review"?"primary-next":""}" data-open-batch-button="${escAttr(row.id)}">${label}</button>`;
}
function renderMasterTable(){
  const body=el("batchMasterBody");if(!body)return;
  updateStatusCounts();
  const pending=masterPendingRows(),batches=masterBatchRows();
  const validQueue=new Set(pending.filter(r=>r.statusKey==="review").map(r=>r.id));[...BATCH_SELECTED].forEach(id=>{if(!validQueue.has(id))BATCH_SELECTED.delete(id);});
  const validReviewBatches=new Set(batches.filter(r=>r.workflowStep==="review"&&r.statusKey==="review").map(r=>r.id));[...REVIEW_BATCH_SELECTED].forEach(id=>{if(!validReviewBatches.has(id))REVIEW_BATCH_SELECTED.delete(id);});
  const validPayment=new Set(batches.filter(r=>r.workflowStep==="payment"&&r.statusKey!=="missing").map(r=>r.id));[...TRANSFER_SELECTED].forEach(id=>{if(!validPayment.has(id))TRANSFER_SELECTED.delete(id);});
  const rows=masterFilteredRows();
  const batchPages=Math.max(1,Math.ceil(rows.length/BATCH_PAGE_SIZE));BATCH_PAGE=Math.min(Math.max(1,BATCH_PAGE),batchPages);
  const batchStart=(BATCH_PAGE-1)*BATCH_PAGE_SIZE,batchEnd=Math.min(rows.length,batchStart+BATCH_PAGE_SIZE),visibleRows=rows.slice(batchStart,batchEnd);
  body.innerHTML=visibleRows.length?visibleRows.map(row=>{
    const b=row.raw||{},isQueue=row.kind==="queue",selectable=reviewMergeSelectable(row),checked=reviewMergeSelected(row);
    const checkbox=selectable?`<input class="master-checkbox" type="checkbox" data-master-merge-kind="${escAttr(row.kind)}" data-master-merge-id="${escAttr(row.id)}" ${checked?"checked":""}>`:"";
    const accountNo=row.accountNo||"";
    const rowClass=row.statusKey==="paid"?"row-paid":["correction","rejected"].includes(row.statusKey)?"row-correction":"";
    return `<tr class="${rowClass}" role="button" tabindex="0" aria-label="เปิดดูรายละเอียด ${escAttr(row.title)}" ${isQueue?`data-open-queue="${escAttr(row.id)}"`:`data-open-batch="${escAttr(row.id)}"`}>
      <td class="sticky-select" data-label="เลือก">${checkbox}</td>
      <td data-label="ประเภท"><span class="acct-priority ${row.priority}">${row.priority==="urgent"?"ด่วน":"ปกติ"}</span></td>
      <td class="sticky-status" data-label="สถานะ"><span class="master-status ${escAttr(row.statusKey)}">${esc(rowStatus(row).label)}</span></td>
      <td data-label="วันที่ตั้งเบิก"><span class="master-primary">${batchDate(row.claimDate)}</span></td>
      <td data-label="วันที่เอกสาร"><span class="master-secondary">${batchReceiptDate(row)}</span></td>
      <td data-label="ผู้เบิก"><span class="master-primary">${esc(row.payerName)}</span><span class="master-secondary">${esc(row.accountName||"")}</span></td>
      <td data-label="รายการ"><span class="master-primary">${esc(row.title)}</span><span class="master-secondary">${esc(row.note)}</span></td>
      <td class="master-money" data-label="ยอดเงิน">${baht(row.amount)}</td>
      <td data-label="บัญชีรับเงิน"><span class="master-account">${esc(row.bank||"—")} ${esc(accountNo||"—")}<small>${esc(row.accountName||"ชื่อบัญชีไม่ครบ")}</small></span>${accountNo?`<button class="copy-mini" data-copy-account="${escAttr(accountNo)}">คัดลอก</button>`:""}</td>
      <td data-label="บัญชีที่จ่าย">${paymentChannelCell(row)}</td>
      <td data-label="เอกสาร">${documentCell(row)}</td>
      <td data-label="สิ่งที่ต้องทำ">${issueCell(row)}</td>
      <td data-label="หลักฐานโอน">${paymentProofCell(row)}</td>
      <td data-label="ดำเนินการ"><div class="acct-next">${nextActionCell(row)}</div></td>
    </tr>`;
  }).join(""):`<tr><td colspan="14"><div class="master-empty"><b>ไม่มีงานในสถานะนี้</b>ลองเลือก “ทุกสถานะ” หรือเปลี่ยนคำค้นหา</div></td></tr>`;
  if(rows.length>BATCH_PAGE_SIZE)body.insertAdjacentHTML("beforeend",`<tr><td colspan="14"><div style="display:flex;justify-content:center;gap:10px;align-items:center;padding:12px"><button class="btn small" type="button" onclick="changeBatchPage(-1)" ${BATCH_PAGE<=1?"disabled":""}>‹ ก่อนหน้า</button><span>หน้า ${BATCH_PAGE}/${batchPages} · ${batchStart+1}-${batchEnd} จาก ${rows.length}</span><button class="btn small" type="button" onclick="changeBatchPage(1)" ${BATCH_PAGE>=batchPages?"disabled":""}>ถัดไป ›</button></div></td></tr>`);
  updateMasterSelection();
}
function changeBatchPage(delta){BATCH_PAGE+=Number(delta||0);renderMasterTable();el("page-batches")?.scrollIntoView({block:"start",behavior:"smooth"});}
function renderQueueDrawer(queueId){
  const row=masterPendingRows().find(x=>String(x.id)===String(queueId));
  if(!row){closeBatchDrawer();return;}
  const item=row.raw||{};
  const links=itemLinks(item);
  ACTIVE_BATCH_ID=`queue:${row.id}`;
  const meta=BATCH_STATUS_META.review;
  el("batchDrawerKicker").textContent=meta.label;
  el("batchDrawerTitle").textContent=item.claimPdfUrl?`รายการเบิก ${item.id||row.id||""}`:(item.vendor||item.note||`รายการเบิก ${item.id||row.id||""}`);

  const mainLinks=[];
  if(item.claimPdfUrl)mainLinks.push(`<a class="main-claim-link" href="${escAttr(item.claimPdfUrl)}" target="_blank" rel="noopener">เปิดใบเบิกรายการ PDF</a>`);
  if(item.receiptPdfUrl)mainLinks.push(`<a href="${escAttr(item.receiptPdfUrl)}" target="_blank" rel="noopener">เปิดใบแทนใบเสร็จ</a>`);
  links.forEach(x=>mainLinks.push(`<a href="${escAttr(x.url)}" target="_blank" rel="noopener">${esc(x.label||"เปิดหลักฐาน")}</a>`));

  const itemLinksHtml=links.length?links.map(x=>`<a href="${escAttr(x.url)}" target="_blank" rel="noopener">${esc(x.label||"หลักฐาน")}</a>`).join(""):"ไม่มีเอกสารแนบ";
  const auditDate=batchDate(row.claimDate);

  el("batchDrawerBody").innerHTML=`
    <div class="drawer-summary">
      <div class="cell"><span>ผู้เบิก / ผู้รับเงิน</span><strong>${esc(row.payerName||"—")}</strong></div>
      <div class="cell"><span>ยอดรวม</span><strong>${baht(row.amount)}</strong></div>
      <div class="cell"><span>บัญชีรับเงิน</span><strong>${esc(row.bank||"—")} ${esc(row.accountNo||"—")}</strong></div>
      <div class="cell"><span>บัญชีที่ใช้จ่าย</span><strong>เลือกหลังเอกสารผ่าน</strong><small>ยังไม่เข้าสู่ขั้นตอนโอนเงิน</small></div>
      <div class="cell"><span>จำนวนรายการ</span><strong>1 รายการ · ${row.priority==="urgent"?"ด่วน":"ปกติ"}</strong></div>
      <div class="cell"><span>การกระทบยอด</span><strong>ยังไม่กระทบยอด</strong><small>เริ่มหลังจ่ายเงินแล้ว</small></div>
    </div>
    <div class="drawer-section main-claim-card">
      <h4>เอกสารหลัก</h4>
      <p class="master-secondary">รายการนี้อยู่ในขั้นตอนตรวจเอกสารแล้ว ไม่ต้องรวมใบเบิกก่อน การรวมหลายรายการเป็นเพียงฟีเจอร์เสริมจาก Checkbox บนตาราง</p>
      <div class="drawer-links">${mainLinks.length?mainLinks.join(""):"ยังไม่มีไฟล์เอกสาร แต่สามารถตรวจหลักฐานจากรายการด้านล่างได้"}</div>
    </div>
    <div class="drawer-section">
      <h4>รายการย่อยในรายการนี้</h4>
      <div class="drawer-items">
        <div class="drawer-item">
          <div class="drawer-item-top"><b>1. ${esc(item.vendor||item.note||item.category||"ไม่ระบุรายการ")}</b><strong>${baht(row.amount)}</strong></div>
          <div class="drawer-item-meta">${batchReceiptDate(row)} · ${esc(item.category||"ไม่ระบุหมวด")}${item.transferor?` · ผู้โอน ${esc(item.transferor)}`:""}</div>
          <div class="drawer-links">${itemLinksHtml}</div>
        </div>
      </div>
    </div>
    <div class="drawer-section">
      <h4>ประวัติ Workflow</h4>
      <div class="audit-list">
        <div class="audit-entry"><i></i><div><b>ผู้เบิกยืนยันรายการ</b><span>${auditDate}</span></div></div>
        <div class="audit-entry"><i></i><div><b>เข้าสู่รอตรวจเอกสาร</b><span>${auditDate}</span></div></div>
      </div>
    </div>`;

  el("batchDrawerFooter").innerHTML=`
    <button class="btn" data-drawer-action="close">ปิด</button>
    <button class="btn danger" data-drawer-action="queue-reject">ตีกลับ</button>
    <button class="btn solid" data-drawer-action="queue-approve">เอกสารผ่าน</button>`;
}
function openQueueReview(id){openBatchDrawer(`queue:${String(id||"")}`);}

function renderBatches(){
  const st=BATCH_DATA.settings||{};
  if(el("batchNext"))el("batchNext").textContent=st.enabled?batchSettingsText():"ปิดอยู่";
  if(el("batchEnabled"))el("batchEnabled").checked=st.enabled===true;
  if(el("batchWeekday"))el("batchWeekday").value=String(Number(st.weekday??1));
  if(el("batchTime"))el("batchTime").value=`${String(Number(st.hour??11)).padStart(2,"0")}:${String(Number(st.minute??0)).padStart(2,"0")}`;
  const mergeItems=st.mergeItems!==false;
  if(el("batchMergeItems"))el("batchMergeItems").checked=mergeItems;
  if(el("batchMaxItems")){el("batchMaxItems").value=String(Number(st.maxItems||10));el("batchMaxItems").disabled=!mergeItems;}
  renderMasterTable();if(ACTIVE_BATCH_ID)renderBatchDrawer(ACTIVE_BATCH_ID);
}
function accountingApiError(data={},res=null){
  const raw=String(data.message||data.hint||data.reason||data.error||"");
  if(res?.status===429||data.error==="sheets_rate_limited"||/Sheets 429|RESOURCE_EXHAUSTED|Quota exceeded/i.test(raw)){
    return "Google Sheets ถูกเรียกถี่เกินไป ระบบหยุดยิงซ้ำแล้ว กรุณารอประมาณ 1 นาทีแล้วกดอัปเดตอีกครั้ง";
  }
  return raw||`HTTP ${res?.status||"error"}`;
}
async function batchPost(path,body={}){
  const res=await fetch(apiUrl(path),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data.ok===false)throw new Error(accountingApiError(data,res));
  return data;
}
async function refreshBatchData({quiet=false}={}){
  if(BATCH_LOADING)return false;BATCH_LOADING=true;const b=el("batchMasterRefresh"),old=b?.textContent;if(!quiet&&b){b.disabled=true;b.textContent="กำลังอัปเดต…";}
  try{const res=await fetch(apiUrl("/api/batches"),{cache:"no-store",headers:{"cache-control":"no-cache"}}),data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(accountingApiError(data,res));if(data.ok!==true||!data.pending||!Array.isArray(data.batches))throw new Error("รูปแบบข้อมูลใบเบิกไม่ถูกต้อง");if(!String(data.version||"").startsWith(EXPECTED_BATCH_CONTRACT))console.warn("batch contract mismatch",data.version);BATCH_DATA=data;renderBatches();return true;}catch(err){console.error("batch refresh failed",err);if(!quiet)alert("โหลดตารางเบิกจ่ายไม่สำเร็จ: "+err.message);return false;}finally{BATCH_LOADING=false;if(b){b.disabled=false;b.textContent=old||"อัปเดต";}}
}
function clearAccountingSelection(){BATCH_SELECTED.clear();REVIEW_BATCH_SELECTED.clear();TRANSFER_SELECTED.clear();renderMasterTable();}
async function createBatchFromSelection(type="ปกติ"){
  const expenseIds=[...BATCH_SELECTED],batchIds=[...REVIEW_BATCH_SELECTED],selectedCount=expenseIds.length+batchIds.length;if(!selectedCount)return;
  const urgent=type==="ด่วน";
  const summary=[expenseIds.length?`${expenseIds.length} รายการย่อย`:"",batchIds.length?`${batchIds.length} ใบเบิกเดิม`:""].filter(Boolean).join(" และ ");
  if(!confirm(`${urgent?"สร้างใบเบิกด่วน":"รวมเป็นใบเบิกหลักใหม่"}จาก ${summary}?

ใบเบิกเดิมที่เลือกจะถูกเก็บประวัติว่า “ถูกรวมแล้ว”`))return;
  const button=urgent?el("batchMasterUrgent"):el("batchMasterCreate"),old=button?.textContent;if(button){button.disabled=true;button.textContent="กำลังรวม…";}
  try{
    const out=urgent?await batchPost("/api/batch-urgent",{expenseIds}):await batchPost("/api/batch-close",{expenseIds,batchIds});
    const docs=(out.batches||[]).map(x=>x.docId).filter(Boolean);
    alert(out.itemCount?`สร้างใบเบิกสำเร็จ${docs.length?`
${docs.join(", ")}`:""}
${out.itemCount} รายการย่อย · ${baht(out.total)}${out.mergedBatchCount?`
รวมใบเบิกเดิม ${out.mergedBatchCount} ใบ`:""}`:(out.message||"ไม่มีรายการ"));
    BATCH_SELECTED.clear();REVIEW_BATCH_SELECTED.clear();await refreshBatchData({quiet:true});setStatusFilter("review");
  }catch(err){alert("รวมใบเบิกไม่สำเร็จ: "+err.message);}finally{if(button){button.disabled=false;button.textContent=old||"รวมเป็นใบเบิก";}}
}
function markSelectedTransfers(){
  const rows=selectedPaymentRows();
  if(!rows.length)return alert("เลือกใบเบิกรอโอนอย่างน้อย 1 ใบ");
  const input=el("batchMasterPaymentInput");
  if(!input)return;
  input.value="";
  input.click();
}
async function uploadSelectedPaymentSlips(input){
  const rows=selectedPaymentRows(),files=[...(input.files||[])];
  if(!rows.length||!files.length){input.value="";return;}
  if(files.length!==1&&files.length!==rows.length){
    alert(`เลือกหลักฐาน 1 ไฟล์เพื่อใช้กับทุกใบเบิก หรือเลือก ${rows.length} ไฟล์ให้ตรงกับจำนวนใบเบิก`);
    input.value="";return;
  }
  const sameFile=files.length===1;
  const total=rows.reduce((sum,b)=>sum+Number(b.total||0),0);
  const message=sameFile&&rows.length>1
    ?`ใช้หลักฐานไฟล์นี้กับ ${rows.length} ใบเบิก รวม ${baht(total)} และปิดงานทั้งหมดเป็นจ่ายแล้ว?`
    :`ยืนยันแนบหลักฐานและบันทึกว่าจ่ายแล้ว ${rows.length} ใบเบิก รวม ${baht(total)}?`;
  if(!confirm(message)){input.value="";return;}
  const button=el("batchMasterMarkTransfer"),old=button?.textContent;
  if(button){button.disabled=true;button.textContent="กำลังบันทึก…";}
  let success=0;const failed=[];
  try{
    for(let i=0;i<rows.length;i++){
      const b=rows[i],file=sameFile?files[0]:files[i];
      try{await uploadBatchPaymentSlipFile(String(b.id||b.docId),file,{confirmBefore:false,refresh:false,quiet:true});success++;}
      catch(e){failed.push(`${b.docId||b.id}: ${e.message}`);}
    }
    TRANSFER_SELECTED.clear();
    await refreshBatchData({quiet:true});
    alert(`บันทึกจ่ายแล้ว ${success} ใบเบิก${failed.length?`\nไม่สำเร็จ ${failed.length} ใบ`:""}`);
  }finally{
    input.value="";
    if(button){button.disabled=false;button.textContent=old||"บันทึกว่าโอนแล้ว";}
  }
}
function transferCsv(rows){const cell=v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`;const head=["ลำดับ","วันที่สร้าง","รหัสรอบจ่าย","เลขที่ใบเบิก","ผู้รับเงิน","ธนาคาร","เลขบัญชี","ชื่อบัญชี","จำนวนรายการย่อย","ยอดโอน","สถานะ"];const body=rows.map((b,i)=>[i+1,b.createdAt||"",b.runNo||"",b.docId||"",b.payerName||"",b.bank||"",b.accountNo||"",b.accountName||"",Number(b.itemCount||0),Number(b.total||0).toFixed(2),BATCH_STATUS_META[batchStep(b)]?.label||b.status||""].map(cell).join(","));return "\ufeff"+[head.map(cell).join(","),...body].join("\n");}
function exportMasterTransfers(){const selected=selectedPaymentRows();const visible=masterFilteredRows().filter(r=>r.kind==="batch"&&r.workflowStep==="payment"&&r.statusKey!=="missing").map(r=>r.raw);const rows=selected.length?selected:visible;if(!rows.length)return alert("ไม่มีใบเบิกรอโอนให้ส่งออก");download(`reimbursement-transfer-${new Date().toISOString().slice(0,10)}.csv`,transferCsv(rows));}
async function copyAccountNumber(value){try{await navigator.clipboard.writeText(String(value||""));}catch(_){const ta=document.createElement("textarea");ta.value=String(value||"");document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();}}
function auditLabel(action){return ({created:"สร้างใบเบิกหลัก",documents_approved:"เอกสารผ่าน",documents_rejected:"ตีกลับให้แก้ไข",correction_notified:"แจ้ง LINE ให้แก้ไข",correction_resubmitted:"ผู้เบิกส่งกลับตรวจ",payment_channel_assigned:"เลือกบัญชีที่ใช้จ่าย",transfer_set:"เริ่มบันทึกการจ่าย",payment_slip_uploaded:"แนบหลักฐานและบันทึกว่าจ่ายแล้ว",line_notified:"แจ้ง LINE ว่าจ่ายแล้ว",payment_notification_retried:"ส่ง LINE ซ้ำ",bank_reconciled:"กระทบยอดธนาคารแล้ว",bank_reconciliation_unlinked:"ยกเลิกการกระทบยอด",status_changed:"เปลี่ยนสถานะ"})[action]||String(action||"อัปเดต");}
function renderBatchDrawer(batchId){
  const requestedId=String(batchId||"");
  if(requestedId.startsWith("queue:"))return renderQueueDrawer(requestedId.slice(6));
  const b=(BATCH_DATA.batches||[]).find(x=>String(x.id||x.docId)===requestedId);if(!b){closeBatchDrawer();return;}ACTIVE_BATCH_ID=String(b.id||b.docId);const step=batchStep(b),meta=BATCH_STATUS_META[b.profileComplete===false&&step!=="paid"?"missing":step]||BATCH_STATUS_META.review;
  el("batchDrawerKicker").textContent=meta.label;el("batchDrawerTitle").textContent=b.docId||b.runNo||"ใบเบิก";
  const items=Array.isArray(b.items)?b.items:[];
  const itemHtml=items.length?items.map((item,i)=>{const links=itemLinks(item);return `<div class="drawer-item"><div class="drawer-item-top"><b>${i+1}. ${esc(item.vendor||item.note||"ไม่ระบุรายการ")}</b><strong>${baht(item.amount)}</strong></div><div class="drawer-item-meta">${batchDate(item.dateISO||item.createdAt)} · ${esc(item.category||"ไม่ระบุหมวด")}${item.transferor?` · ผู้โอน ${esc(item.transferor)}`:""}</div><div class="drawer-links">${links.length?links.map(x=>`<a href="${escAttr(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(""):"ไม่มีเอกสารแนบ"}</div></div>`;}).join(""):"<div class='master-secondary'>ไม่พบรายการย่อยใน Contract</div>";
  const audits=Array.isArray(b.auditEvents)?b.auditEvents:[];
  const auditHtml=audits.length?audits.slice().reverse().slice(0,12).map(a=>`<div class="audit-entry"><i></i><div><b>${esc(auditLabel(a.action))}</b><span>${batchDate(a.at)}${a.detail?.reason?` · ${esc(a.detail.reason)}`:""}</span></div></div>`).join(""):"<span class='master-secondary'>ยังไม่มีประวัติ</span>";
  el("batchDrawerBody").innerHTML=`
    <div class="drawer-summary"><div class="cell"><span>ผู้เบิก / ผู้รับเงิน</span><strong>${esc(b.payerName||"—")}</strong></div><div class="cell"><span>ยอดรวม</span><strong>${baht(b.total)}</strong></div><div class="cell"><span>บัญชีรับเงิน</span><strong>${esc(b.bank||"—")} ${esc(b.accountNo||"—")}</strong></div><div class="cell"><span>บัญชีที่ใช้จ่าย</span><strong>${esc(financeChannelTitle(batchChannelSnapshot(b)||{})||"ยังไม่เลือก")}</strong><small>${esc(batchChannelSnapshot(b)?financeChannelDetail(batchChannelSnapshot(b)):"เลือกก่อนโอนเงิน")}</small></div><div class="cell"><span>จำนวนรายการ</span><strong>${Number(b.itemCount||items.length||0)} รายการ · ${b.type==="ด่วน"?"ด่วน":"ปกติ"}</strong></div><div class="cell"><span>การกระทบยอด</span><strong>${String(b.reconcileStatus||"")==="กระทบยอดแล้ว"?"กระทบยอดแล้ว":"ยังไม่กระทบยอด"}</strong>${b.reconciledAt?`<small>${batchDate(b.reconciledAt)}</small>`:""}</div></div>
    ${b.rejectionReason?`<div class="drawer-reason"><b>เหตุผลที่ต้องแก้ไข</b><br>${esc(b.rejectionReason)}</div>`:""}
    <div class="drawer-section main-claim-card"><h4>ใบเบิกหลัก</h4><p class="master-secondary">PDF ฉบับเดียวรวมตารางสรุป ใบแทน และหลักฐานของรายการย่อยทั้งหมด</p><div class="drawer-links">${b.pdfUrl?`<a class="main-claim-link" href="${escAttr(b.pdfUrl)}" target="_blank" rel="noopener">เปิดใบเบิกหลัก PDF</a>`:"ยังไม่มีใบเบิกหลัก"}${b.paymentSlipUrl?`<a href="${escAttr(b.paymentSlipUrl)}" target="_blank" rel="noopener">เปิดหลักฐานการโอน</a>`:""}</div></div>
    <div class="drawer-section"><h4>รายการย่อยในใบเบิกนี้</h4><div class="drawer-items">${itemHtml}</div></div>
    <div class="drawer-section"><h4>ประวัติ Workflow</h4><div class="audit-list">${auditHtml}</div></div>`;
  const footer=[];
  footer.push(`<button class="btn" data-drawer-action="close">ปิด</button>`);
  if(b.profileComplete===false)footer.push(`<button class="btn solid" data-open-team>เพิ่มข้อมูลบัญชี</button>`);
  else if(step==="review"){footer.push(`<button class="btn danger" data-drawer-action="reject">ตีกลับ</button><button class="btn solid" data-drawer-action="approve">เอกสารผ่าน</button>`);}
  else if(step==="correction"){footer.push(`<button class="btn solid" data-drawer-action="resubmit">รับกลับมาตรวจอีกครั้ง</button>`);}
  else if(step==="payment"){footer.push(`<button class="btn solid" data-drawer-action="open-payment">โอนและแนบหลักฐาน</button>`);}
  else if(step==="paid"){
    if(String(b.lineNotifyStatus||"").includes("ไม่สำเร็จ"))footer.push(`<button class="btn" data-drawer-action="retry-line">ส่ง LINE ซ้ำ</button>`);
    if(String(b.reconcileStatus||"")!=="กระทบยอดแล้ว")footer.push(`<button class="btn solid" data-drawer-action="open-reconciliation">ไปหน้ากระทบยอด</button>`);
  }
  el("batchDrawerFooter").innerHTML=footer.join("");
}
function openBatchDrawer(id){ACTIVE_BATCH_ID=String(id||"");el("batchDrawerBackdrop").hidden=false;document.body.style.overflow="hidden";renderBatchDrawer(ACTIVE_BATCH_ID);}
function closeBatchDrawer(){ACTIVE_BATCH_ID="";if(el("batchDrawerBackdrop"))el("batchDrawerBackdrop").hidden=true;if(el("batchRejectBackdrop")?.hidden!==false)document.body.style.overflow="";}
function openRejectDialog(targetId){
  const requested=String(targetId||"");
  let items=[];
  if(requested.startsWith("queue:")){
    const row=masterPendingRows().find(x=>String(x.id)===requested.slice(6));
    if(!row)return;
    const item=row.raw||{};
    REJECT_BATCH_ID=requested;
    items=[item];
  }else{
    const b=(BATCH_DATA.batches||[]).find(x=>String(x.id||x.docId)===requested);
    if(!b)return;
    REJECT_BATCH_ID=String(b.id||b.docId);
    items=b.items||[];
  }
  el("batchRejectDetail").value="";
  el("batchRejectReason").value="เอกสารไม่ครบ";
  el("batchRejectItems").innerHTML=items.map((item,i)=>`<label><input type="checkbox" data-reject-item="${escAttr(item.id)}" checked><span>${i+1}. ${esc(item.vendor||item.note||"รายการ")}</span><small>${baht(item.amount)}</small></label>`).join("")||"<span class='master-secondary'>ตีกลับรายการนี้</span>";
  el("batchRejectBackdrop").hidden=false;
  document.body.style.overflow="hidden";
}
function closeRejectDialog(){REJECT_BATCH_ID="";el("batchRejectBackdrop").hidden=true;if(el("batchDrawerBackdrop")?.hidden!==false)document.body.style.overflow="";}
async function submitBatchReject(){
  if(!REJECT_BATCH_ID)return;
  const base=el("batchRejectReason").value,detail=el("batchRejectDetail").value.trim(),reason=detail?`${base}: ${detail}`:base,itemIds=[...document.querySelectorAll("[data-reject-item]:checked")].map(x=>x.dataset.rejectItem);
  const btn=el("batchRejectSubmit"),old=btn.textContent;btn.disabled=true;btn.textContent="กำลังแจ้ง LINE…";
  try{
    const isQueue=String(REJECT_BATCH_ID).startsWith("queue:");
    const out=isQueue
      ?await batchPost("/api/expense-workflow",{expenseId:String(REJECT_BATCH_ID).slice(6),action:"reject",payload:{reason,itemIds}})
      :await batchPost("/api/batch-workflow",{batchId:REJECT_BATCH_ID,action:"reject",payload:{reason,itemIds}});
    closeRejectDialog();closeBatchDrawer();await refreshBatchData({quiet:true});
    alert(`ตีกลับแล้ว\nLINE: ${out.notificationStatus||"ตรวจสอบในระบบ"}`);
  }catch(e){alert("ตีกลับไม่สำเร็จ: "+e.message);}finally{btn.disabled=false;btn.textContent=old;}
}
async function runDrawerAction(action){
  if(action==="close")return closeBatchDrawer();
  if(String(ACTIVE_BATCH_ID).startsWith("queue:")){
    const queueId=String(ACTIVE_BATCH_ID).slice(6);
    if(action==="queue-reject")return openRejectDialog(ACTIVE_BATCH_ID);
    if(action==="queue-approve"){
      if(!confirm("ยืนยันว่าเอกสารรายการนี้ผ่านและพร้อมเข้าสู่ขั้นตอนโอนเงิน?"))return;
      await batchPost("/api/expense-workflow",{expenseId:queueId,action:"approve",payload:{}});
      closeBatchDrawer();
      await refreshBatchData({quiet:true});
      setStatusFilter("payment");
    }
    return;
  }
  const b=(BATCH_DATA.batches||[]).find(x=>String(x.id||x.docId)===String(ACTIVE_BATCH_ID));if(!b)return;
  if(action==="open-payment")return openPaymentDialog(ACTIVE_BATCH_ID);
  if(action==="open-reconciliation"){closeBatchDrawer();RECON_CHANNEL_ID=String(b.paymentChannelId||"");openPage("reconciliation");return;}
  if(action==="reject")return openRejectDialog(ACTIVE_BATCH_ID);
  if(action==="approve"){if(!confirm("ยืนยันว่าเอกสารทั้งหมดผ่านและพร้อมโอนเงิน?"))return;await batchPost("/api/batch-workflow",{batchId:ACTIVE_BATCH_ID,action:"approve"});}
  if(action==="resubmit"){if(!confirm("รับรายการกลับเข้าสถานะรอตรวจเอกสารอีกครั้ง?"))return;await batchPost("/api/batch-workflow",{batchId:ACTIVE_BATCH_ID,action:"resubmit"});}
  if(action==="retry-line"){await batchPost("/api/batch-workflow",{batchId:ACTIVE_BATCH_ID,action:"retry_payment_notification"});}
  await refreshBatchData({quiet:true});
}
async function uploadBatchPaymentSlipFile(batchId,file,{paymentChannelId="",confirmBefore=true,refresh=true,quiet=false}={}){
  if(!batchId||!file)throw new Error("กรุณาเลือกไฟล์หลักฐานการโอน");
  const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
  if(file.size>12*1024*1024)throw new Error("ไฟล์ต้องไม่เกิน 12 MB");
  if(file.type&&!allowed.includes(file.type))throw new Error("รองรับ JPG, PNG, WEBP และ PDF เท่านั้น");
  if(confirmBefore&&!confirm("ยืนยันแนบหลักฐานนี้ บันทึกว่าจ่ายแล้ว และส่ง LINE ให้ผู้เบิก?"))return {cancelled:true};
  const form=new FormData();form.append("batchId",batchId);form.append("paymentChannelId",paymentChannelId||"");form.append("file",file,file.name);
  const res=await fetch(apiUrl("/api/batch-payment-slip"),{method:"POST",body:form}),data=await res.json().catch(()=>({}));
  if(!res.ok||data.ok===false)throw new Error(accountingApiError(data,res));
  if(refresh)await refreshBatchData({quiet:true});
  if(!quiet)alert(`ปิดงานเรียบร้อย\nLINE: ${data.lineNotifyStatus||"ตรวจสอบในระบบ"}`);
  return data;
}
async function uploadBatchPaymentSlip(input){
  const batchId=input.dataset.batchId||input.closest("[data-open-batch]")?.dataset.openBatch||ACTIVE_BATCH_ID,file=input.files?.[0];
  if(!batchId||!file)return;
  input.disabled=true;
  const batch=(BATCH_DATA.batches||[]).find(x=>String(x.id||x.docId)===String(batchId));
  try{await uploadBatchPaymentSlipFile(batchId,file,{paymentChannelId:batch?.paymentChannelId||""});}
  catch(e){alert("บันทึกการจ่ายไม่สำเร็จ: "+e.message);}
  finally{input.disabled=false;input.value="";}
}

function openPaymentDialog(batchId){const b=(BATCH_DATA.batches||[]).find(x=>String(x.id||x.docId)===String(batchId));if(!b)return;const channels=batchPaymentChannels().filter(x=>x.active);if(!channels.length){if(confirm("ยังไม่มีช่องทางการเงิน ต้องการไปสร้างตอนนี้หรือไม่?")){closeBatchDrawer();openBusiness("finance");}return;}PAYMENT_BATCH_ID=String(b.id||b.docId);el("batchPaymentTitle").textContent=b.docId||"โอนและแนบหลักฐาน";el("batchPaymentSummary").innerHTML=`<div><span>ผู้รับเงิน</span><strong>${esc(b.payerName||"—")}</strong></div><div><span>ยอดที่ต้องโอน</span><strong>${baht(b.total)}</strong></div><div><span>บัญชีรับเงิน</span><strong>${esc(b.bank||"—")} ${esc(b.accountNo||"—")}</strong></div><div><span>รายการย่อย</span><strong>${Number(b.itemCount||0)} รายการ</strong></div>`;el("batchPaymentChannel").innerHTML=batchChannelOptions(b.paymentChannelId,"เลือกบัญชีที่ใช้จ่าย");if(!b.paymentChannelId){const def=channels.find(x=>x.isDefault)||channels[0];if(def)el("batchPaymentChannel").value=def.id;}el("batchPaymentFile").value="";el("batchPaymentBackdrop").hidden=false;document.body.style.overflow="hidden";}
function closePaymentDialog(){PAYMENT_BATCH_ID="";if(el("batchPaymentBackdrop"))el("batchPaymentBackdrop").hidden=true;if(el("batchDrawerBackdrop")?.hidden===false||el("batchRejectBackdrop")?.hidden===false)return;document.body.style.overflow="";}
async function submitBatchPayment(){const batchId=PAYMENT_BATCH_ID,channelId=el("batchPaymentChannel").value,file=el("batchPaymentFile").files?.[0];if(!batchId)return;if(!channelId)return alert("เลือกบัญชีที่ใช้จ่ายก่อน");if(!file)return alert("เลือกหลักฐานการโอนก่อน");if(!confirm("ยืนยันว่ารายการนี้โอนเงินจริงแล้ว ระบบจะปิดงานและส่ง LINE ให้ผู้เบิกทันที?"))return;const btn=el("batchPaymentSubmit"),old=btn.textContent;btn.disabled=true;btn.textContent="กำลังบันทึก…";try{await uploadBatchPaymentSlipFile(batchId,file,{paymentChannelId:channelId,confirmBefore:false,refresh:true,quiet:true});closePaymentDialog();closeBatchDrawer();alert("บันทึกว่าจ่ายแล้วและส่งหลักฐานให้ผู้เบิกเรียบร้อย");}catch(err){alert("บันทึกการจ่ายไม่สำเร็จ: "+err.message);}finally{btn.disabled=false;btn.textContent=old;}}

/* ---------- BANK RECONCILIATION ---------- */
function reconStatusMeta(status){
  return ({"กระทบยอดแล้ว":{label:"กระทบยอดแล้ว",cls:"reconciled"},"แนะนำอัตโนมัติ":{label:"ระบบจับคู่ให้",cls:"suggested"},"ต้องตรวจ":{label:"ต้องตรวจ",cls:"review"},"ไม่พบคู่":{label:"ไม่พบคู่",cls:"unmatched"},"ข้าม":{label:"ข้ามแล้ว",cls:"ignored"}})[status]||{label:status||"ยังไม่จับคู่",cls:"review"};
}
function reconDate(value){const d=pdate(value)||cdate(value);return d?fmtDate(d):"—";}
function reconApiError(data,res){if(res?.status===429)return "Google Sheets ถูกเรียกถี่เกินไป กรุณารอประมาณ 1 นาทีแล้วลองใหม่";return data?.message||data?.hint||data?.error||data?.reason||`HTTP ${res?.status||""}`;}
async function reconciliationPost(path,body){const res=await fetch(apiUrl(path),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body||{})});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok===false)throw new Error(reconApiError(data,res));return data;}
async function refreshReconciliation({quiet=false}={}){if(RECON_LOADING)return false;RECON_LOADING=true;const btn=el("reconRefresh"),old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent="กำลังอัปเดต…";}try{const channelParam=RECON_CHANNEL_ID?`&channelId=${encodeURIComponent(RECON_CHANNEL_ID)}`:"",res=await fetch(apiUrl("/api/reconciliation")+channelParam+`&_=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}}),data=await res.json().catch(()=>({}));if(!res.ok||data.ok!==true)throw new Error(reconApiError(data,res));RECON_DATA=data;RECON_CHANNEL_ID=String(data.selectedChannelId||"");renderReconciliation();return true;}catch(err){console.error("reconciliation refresh failed",err);if(!quiet)alert("โหลดกระทบยอดไม่สำเร็จ: "+err.message);return false;}finally{RECON_LOADING=false;if(btn){btn.disabled=false;btn.textContent=old||"อัปเดต";}}}
function reconFilteredRows(){const q=(el("reconSearch")?.value||"").trim().toLowerCase(),filter=RECON_FILTER||"all";return (RECON_DATA.rows||[]).filter(row=>{const meta=reconStatusMeta(row.displayStatus);if(filter!=="all"&&meta.cls!==filter)return false;if(!q)return true;const b=row.linkedBatch||row.suggestion?.best||{};return [row.description,row.reference,row.sourceFile,row.sourceAccount,b.docId,b.payerName].join(" ").toLowerCase().includes(q);});}
function reconBatchSummary(batch){if(!batch)return "—";return `<div class="recon-match"><b>${esc(batch.docId||"ใบเบิก")}</b><span>${esc(batch.payerName||"—")} · ${baht(batch.total||batch.amount||0)}</span></div>`;}
function reconProof(batch){if(!batch)return "—";const links=[];if(batch.paymentSlipUrl)links.push(`<a class="payment-proof-link" href="${escAttr(batch.paymentSlipUrl)}" target="_blank" rel="noopener">หลักฐานโอน</a>`);if(batch.pdfUrl)links.push(`<a class="btn small" href="${escAttr(batch.pdfUrl)}" target="_blank" rel="noopener">ใบเบิก</a>`);return links.join(" ")||"—";}
function reconRowClass(row){const cls=reconStatusMeta(row.displayStatus).cls;return cls==="reconciled"?"reconciled":cls==="unmatched"?"unmatched":cls==="review"?"review":"";}
function renderReconciliation(){
  if(!el("reconBody"))return;
  const channels=Array.isArray(RECON_DATA.accountOverview)?RECON_DATA.accountOverview:[];
  const selected=RECON_DATA.selectedChannel||channels.find(x=>String(x.id)===String(RECON_CHANNEL_ID))||null;
  const ready=channels.some(x=>x.active!==false)&&!!selected;
  el("reconPrereq").hidden=ready;
  el("reconWorkspace").hidden=!ready;
  if(!ready){el("reconConfirmSuggested").disabled=true;return;}
  el("reconAccountStrip").innerHTML=channels.filter(x=>x.active!==false).map(x=>`<button class="recon-account-card ${String(x.id)===String(RECON_CHANNEL_ID)?"active":""}" type="button" data-recon-channel="${escAttr(x.id)}"><div class="top"><b>${esc(financeChannelTitle(x))}</b><span class="count">รอ ${Number(x.waitingCount||0)}</span></div><small>${esc(financeChannelDetail(x))}</small></button>`).join("");
  const overview=channels.find(x=>String(x.id)===String(RECON_CHANNEL_ID))||selected;
  el("reconAccountLogo").textContent=financeChannelIcon(selected);el("reconAccountTitle").textContent=financeChannelTitle(selected);el("reconAccountDetail").textContent=financeChannelDetail(selected);
  el("reconImportIcon").textContent=financeChannelIcon(selected);el("reconImportAccount").textContent=financeChannelTitle(selected);el("reconImportAccountDetail").textContent=financeChannelDetail(selected);
  const summary=RECON_DATA.summary||{};
  el("reconPaidCount").textContent=Number(overview?.paidBatchCount??summary.paidBatches?.count??0).toLocaleString("th-TH");
  el("reconStatementCount").textContent=Number(overview?.statementCount??summary.statementRows??0).toLocaleString("th-TH");
  el("reconWaitingCount").textContent=Number(overview?.waitingCount??summary.unreconciledPaidBatches?.count??0).toLocaleString("th-TH");
  el("reconDoneCount").textContent=Number(overview?.reconciledCount??summary.reconciled?.count??0).toLocaleString("th-TH");
  const unassigned=Array.isArray(RECON_DATA.unassignedPaidBatches)?RECON_DATA.unassignedPaidBatches:[];
  el("reconUnassignedWarning").hidden=!unassigned.length;el("reconUnassignedText").textContent=unassigned.length?`มีใบเบิกจ่ายแล้ว ${unassigned.length} ใบที่ยังไม่ได้ระบุบัญชีต้นทาง จึงยังนำมากระทบยอดไม่ได้`:"";
  el("reconKAll").textContent=Number(summary.statementRows||0);el("reconKSuggested").textContent=Number(summary.suggested?.count||0);el("reconKReview").textContent=Number(summary.review?.count||0);el("reconKUnmatched").textContent=Number(summary.unmatched?.count||0);el("reconKDone").textContent=Number(summary.reconciled?.count||0);
  const rows=reconFilteredRows();el("reconTableMeta").textContent=`${financeChannelTitle(selected)} · แสดง ${rows.length} จาก ${Number(summary.statementRows||0)} รายการ · เงินออก ${baht(rows.reduce((sum,row)=>sum+Number(row.amount||0),0))} · ใบเบิกรอกระทบยอด ${Number(summary.unreconciledPaidBatches?.count||0)} ใบ`;
  const reconPages=Math.max(1,Math.ceil(rows.length/RECON_PAGE_SIZE));RECON_PAGE=Math.min(Math.max(1,RECON_PAGE),reconPages);
  const reconStart=(RECON_PAGE-1)*RECON_PAGE_SIZE,reconEnd=Math.min(rows.length,reconStart+RECON_PAGE_SIZE),visibleRecon=rows.slice(reconStart,reconEnd);
  el("reconConfirmSuggested").disabled=!Number(summary.suggested?.count||0);
  el("reconBody").innerHTML=visibleRecon.length?visibleRecon.map(row=>{const meta=reconStatusMeta(row.displayStatus),batch=row.linkedBatch||row.suggestion?.best||null,diff=batch?Number(row.amount||0)-Number(batch.total||batch.amount||0):null;const action=row.displayStatus==="กระทบยอดแล้ว"?`<button class="btn small" data-recon-open="${escAttr(row.id)}">ดูรายละเอียด</button>`:row.suggestion?.best?`<button class="btn small solid" data-recon-confirm="${escAttr(row.id)}" data-batch-id="${escAttr(row.suggestion.best.batchId)}">ยืนยันคู่</button><button class="btn small" data-recon-open="${escAttr(row.id)}">เลือกเอง</button>`:`<button class="btn small solid" data-recon-open="${escAttr(row.id)}">เลือกใบเบิก</button>`;return `<tr class="${reconRowClass(row)}" data-recon-row="${escAttr(row.id)}"><td><span class="recon-status ${meta.cls}">${esc(meta.label)}</span></td><td>${reconDate(row.transactionDate)}</td><td><div class="recon-detail"><b>${esc(row.description||"ไม่ระบุรายละเอียด")}</b><span>${row.reference?`อ้างอิง ${esc(row.reference)} · `:""}${esc(row.sourceFile||"")}</span></div></td><td class="num recon-amount">${baht(row.amount)}</td><td>${reconBatchSummary(batch)}</td><td>${batch?reconDate(batch.paidDate||batch.paidAt):"—"}</td><td class="num"><span class="recon-diff ${diff==null?"":Math.abs(diff)<=.01?"ok":"bad"}">${diff==null?"—":(diff>0?"+":"")+baht(diff).replace("฿","")}</span></td><td>${reconProof(batch)}</td><td><div class="recon-action-cell">${action}</div></td></tr>`;}).join(""):`<tr><td colspan="9"><div class="recon-empty">${(RECON_DATA.rows||[]).length?"ไม่พบรายการตามตัวกรอง":`ยังไม่มี Statement ของ ${esc(financeChannelTitle(selected))}<br><small>เลือกไฟล์ Statement ด้านบนเพื่อเริ่มกระทบยอด</small>`}</div></td></tr>`;
  if(rows.length>RECON_PAGE_SIZE)el("reconBody").insertAdjacentHTML("beforeend",`<tr><td colspan="9"><div style="display:flex;justify-content:center;gap:10px;align-items:center;padding:12px"><button class="btn small" type="button" onclick="changeReconPage(-1)" ${RECON_PAGE<=1?"disabled":""}>‹</button><span>หน้า ${RECON_PAGE}/${reconPages} · ${reconStart+1}-${reconEnd}</span><button class="btn small" type="button" onclick="changeReconPage(1)" ${RECON_PAGE>=reconPages?"disabled":""}>›</button></div></td></tr>`);
  document.querySelectorAll("[data-recon-filter]").forEach(btn=>btn.classList.toggle("active",btn.dataset.reconFilter===RECON_FILTER));if(el("reconStatus"))el("reconStatus").value=RECON_FILTER;
  if(ACTIVE_RECON_ID)renderReconDrawer(ACTIVE_RECON_ID);
}

function changeReconPage(delta){RECON_PAGE+=Number(delta||0);renderReconciliation();el("page-reconciliation")?.scrollIntoView({block:"start",behavior:"smooth"});}
function reconCandidateRows(row,query=""){const q=String(query||"").trim().toLowerCase(),seen=new Set(),out=[];for(const c of row.suggestion?.candidates||[]){if(!seen.has(c.batchId)){seen.add(c.batchId);out.push({...c,isBest:c.batchId===row.suggestion?.best?.batchId});}}for(const b of RECON_DATA.paidBatches||[]){if(seen.has(b.id)||String(b.reconcileStatus||"")==="กระทบยอดแล้ว")continue;const diff=Math.abs(Number(row.amount||0)-Number(b.total||0));out.push({batchId:b.id,docId:b.docId,payerName:b.payerName,amount:b.total,paidDate:b.paidAt,paymentSlipUrl:b.paymentSlipUrl,pdfUrl:b.pdfUrl,score:0,gapDays:999,amountDiff:diff,isBest:false});seen.add(b.id);}return out.filter(c=>!q||[c.docId,c.payerName,c.amount,c.paidDate].join(" ").toLowerCase().includes(q)).sort((a,b)=>a.amountDiff-b.amountDiff||b.score-a.score||String(b.paidDate).localeCompare(String(a.paidDate))).slice(0,30);}
function renderReconDrawer(id,query=""){const row=(RECON_DATA.rows||[]).find(x=>String(x.id)===String(id));if(!row){closeReconDrawer();return;}ACTIVE_RECON_ID=String(row.id);const meta=reconStatusMeta(row.displayStatus);el("reconDrawerKicker").textContent=meta.label;el("reconDrawerTitle").textContent=`${reconDate(row.transactionDate)} · ${baht(row.amount)}`;if(row.displayStatus==="กระทบยอดแล้ว"&&row.linkedBatch){const b=row.linkedBatch;el("reconDrawerBody").innerHTML=`<div class="drawer-summary"><div class="cell"><span>รายละเอียดธนาคาร</span><strong>${esc(row.description||"—")}</strong></div><div class="cell"><span>เลขอ้างอิง</span><strong>${esc(row.reference||"—")}</strong></div><div class="cell"><span>ใบเบิกที่จับคู่</span><strong>${esc(b.docId||"—")}</strong></div><div class="cell"><span>ผู้เบิก</span><strong>${esc(b.payerName||"—")}</strong></div></div><div class="drawer-section"><h4>เอกสารยืนยัน</h4><div class="drawer-links">${b.paymentSlipUrl?`<a href="${escAttr(b.paymentSlipUrl)}" target="_blank" rel="noopener">เปิดหลักฐานการโอน</a>`:""}${b.pdfUrl?`<a class="main-claim-link" href="${escAttr(b.pdfUrl)}" target="_blank" rel="noopener">เปิดใบเบิกหลัก</a>`:""}</div></div><div class="drawer-section"><h4>ข้อมูลกระทบยอด</h4><p class="master-secondary">กระทบยอดเมื่อ ${reconDate(row.matchedAt)} · โดย ${esc(row.matchedBy||"Dashboard")}${row.note?`<br>หมายเหตุ: ${esc(row.note)}`:""}</p></div>`;el("reconDrawerFooter").innerHTML=`<button class="btn" data-recon-close>ปิด</button><button class="btn danger" data-recon-unlink="${escAttr(row.id)}">ยกเลิกการจับคู่</button>`;return;}
  const candidates=reconCandidateRows(row,query);el("reconDrawerBody").innerHTML=`<div class="drawer-summary"><div class="cell"><span>วันที่ธนาคาร</span><strong>${reconDate(row.transactionDate)}</strong></div><div class="cell"><span>ยอดเงินออก</span><strong>${baht(row.amount)}</strong></div><div class="cell"><span>รายละเอียด</span><strong>${esc(row.description||"—")}</strong></div><div class="cell"><span>อ้างอิง</span><strong>${esc(row.reference||"—")}</strong></div></div><div class="drawer-section"><h4>เลือกใบเบิกที่ตรงกับรายการนี้</h4><input class="recon-search" id="reconCandidateSearch" placeholder="ค้นหาเลขใบเบิกหรือชื่อผู้เบิก" value="${escAttr(query)}"><div class="candidate-list">${candidates.length?candidates.map(c=>`<div class="recon-candidate ${c.isBest?"best":""}"><div><b>${esc(c.docId||"ใบเบิก")}${c.isBest?" · ระบบแนะนำ":""}</b><small>${esc(c.payerName||"—")} · จ่าย ${reconDate(c.paidDate)} · ส่วนต่าง ${baht(Number(row.amount||0)-Number(c.amount||0))}</small><div class="drawer-links">${c.paymentSlipUrl?`<a href="${escAttr(c.paymentSlipUrl)}" target="_blank" rel="noopener">หลักฐานโอน</a>`:""}${c.pdfUrl?`<a href="${escAttr(c.pdfUrl)}" target="_blank" rel="noopener">ใบเบิก</a>`:""}</div></div><div class="amount">${baht(c.amount)}<br><button class="btn small ${Math.abs(Number(row.amount)-Number(c.amount))<=.01?"solid":"danger"}" data-recon-pick="${escAttr(row.id)}" data-batch-id="${escAttr(c.batchId)}" data-force="${Math.abs(Number(row.amount)-Number(c.amount))>.01?"1":"0"}">จับคู่</button></div></div>`).join(""):`<div class="recon-empty">ไม่พบใบเบิกที่ค้นหา</div>`}</div></div>`;el("reconDrawerFooter").innerHTML=`<button class="btn" data-recon-close>ปิด</button><button class="btn" data-recon-ignore="${escAttr(row.id)}">ข้ามรายการธนาคารนี้</button>`;const search=el("reconCandidateSearch");if(search){search.oninput=()=>renderReconDrawer(row.id,search.value);if(query){search.focus();search.setSelectionRange(query.length,query.length);}}}
function openReconDrawer(id){ACTIVE_RECON_ID=String(id||"");el("reconDrawerBackdrop").hidden=false;document.body.style.overflow="hidden";renderReconDrawer(ACTIVE_RECON_ID);}
function closeReconDrawer(){ACTIVE_RECON_ID="";if(el("reconDrawerBackdrop"))el("reconDrawerBackdrop").hidden=true;if(el("batchDrawerBackdrop")?.hidden!==false&&el("batchRejectBackdrop")?.hidden!==false)document.body.style.overflow="";}
async function confirmReconPairs(pairs,{force=false,quiet=false}={}){if(!pairs.length)return;const out=await reconciliationPost("/api/reconciliation-confirm",{pairs,force,matchedBy:"Dashboard"});await Promise.all([refreshReconciliation({quiet:true}),refreshBatchData({quiet:true})]);if(!quiet)alert(`กระทบยอดสำเร็จ ${out.confirmed||pairs.length} รายการ${out.errors?.length?`
ข้าม ${out.errors.length} รายการที่จับคู่ไม่ได้`:""}`);return out;}
async function confirmSuggestedReconciliations(){const pairs=(RECON_DATA.rows||[]).filter(r=>r.displayStatus==="แนะนำอัตโนมัติ"&&r.suggestion?.best).map(r=>({reconciliationId:r.id,batchId:r.suggestion.best.batchId,score:r.suggestion.best.score}));if(!pairs.length)return alert("ไม่มีรายการที่ระบบมั่นใจพอให้ยืนยันอัตโนมัติ");if(!confirm(`ยืนยันกระทบยอด ${pairs.length} รายการที่ยอดและวันที่ตรงกัน?`))return;const btn=el("reconConfirmSuggested"),old=btn.textContent;btn.disabled=true;btn.textContent="กำลังยืนยัน…";try{await confirmReconPairs(pairs);}catch(err){alert("ยืนยันกระทบยอดไม่สำเร็จ: "+err.message);}finally{btn.disabled=false;btn.textContent=old;}}
function normalizeStatementHeader(v){return String(v??"").toLowerCase().replace(/[\s._\-\/()]/g,"");}
function parseCsvRows(text){const rows=[];let row=[],field="",quote=false;for(let i=0;i<text.length;i++){const ch=text[i];if(quote){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quote=false;else field+=ch;}else if(ch==='"')quote=true;else if(ch===','){row.push(field);field="";}else if(ch==='\n'){row.push(field);rows.push(row);row=[];field="";}else if(ch!=='\r')field+=ch;}row.push(field);if(row.some(x=>String(x).trim()))rows.push(row);return rows;}
function statementDateValue(v){if(v instanceof Date&&!Number.isNaN(v.getTime()))return v.toISOString().slice(0,10);if(typeof v==="number"&&v>20000&&v<100000){const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*86400000);return d.toISOString().slice(0,10);}const raw=String(v??"").trim(),m=raw.match(/(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})/);if(!m)return "";let a=+m[1],b=+m[2],c=+m[3],y,mo,d;if(String(m[1]).length===4){y=a;mo=b;d=c;}else{d=a;mo=b;y=c;}if(y>2400)y-=543;if(y<100)y+=2000;if(y<2000||mo<1||mo>12||d<1||d>31)return "";return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function statementNumber(v){if(typeof v==="number")return Number.isFinite(v)?v:0;let raw=String(v??"").trim();if(!raw)return 0;const neg=/^\(.*\)$/.test(raw);raw=raw.replace(/[(),฿\s]/g,"").replace(/[^0-9+\-.]/g,"");const n=Number(raw);return Number.isFinite(n)?(neg?-Math.abs(n):n):0;}
function findStatementColumns(rows){const aliases={date:["วันที่","date","transactiondate","postingdate","valuedate","วันทำรายการ"],debit:["ถอน","เงินออก","debit","debitamount","withdrawal","จ่ายออก"],credit:["ฝาก","เงินเข้า","credit","creditamount","deposit"],amount:["จำนวนเงิน","amount","ยอดเงิน","transactionamount"],description:["รายการ","รายละเอียด","description","particulars","memo","narrative","transactiondetail"],reference:["เลขอ้างอิง","อ้างอิง","reference","referenceno","ref","transactionid"],type:["ประเภท","type","direction","transactiontype","drcr"]};let best=null;for(let r=0;r<Math.min(rows.length,30);r++){const hdr=(rows[r]||[]).map(normalizeStatementHeader),cols={};let score=0;for(const [key,names] of Object.entries(aliases)){const idx=hdr.findIndex(h=>names.some(n=>h===n||h.includes(n)));if(idx>=0){cols[key]=idx;score++;}}if(cols.date>=0&&(cols.debit>=0||cols.amount>=0)&&score>(best?.score||0))best={row:r,cols,score};}return best;}
function normalizeStatementRows(rows,sourceAccount=""){const found=findStatementColumns(rows);if(!found)throw new Error("หาแถวหัวตารางไม่เจอ ต้องมีคอลัมน์วันที่และยอดเงินออก/ถอน");const out=[];for(let i=found.row+1;i<rows.length;i++){const cells=rows[i]||[],date=statementDateValue(cells[found.cols.date]);if(!date)continue;const debit=found.cols.debit>=0?Math.abs(statementNumber(cells[found.cols.debit])):0,credit=found.cols.credit>=0?Math.abs(statementNumber(cells[found.cols.credit])):0,generic=found.cols.amount>=0?statementNumber(cells[found.cols.amount]):0,type=found.cols.type>=0?String(cells[found.cols.type]||""):"";if(credit>0&&!debit)continue;let amount=debit;if(!amount&&generic){if(generic<0)amount=Math.abs(generic);else if(!/เงินเข้า|credit|deposit|cr/i.test(type))amount=Math.abs(generic);}if(!(amount>0))continue;out.push({transactionDate:date,amount,direction:"เงินออก",description:found.cols.description>=0?String(cells[found.cols.description]||"").trim():"",reference:found.cols.reference>=0?String(cells[found.cols.reference]||"").trim():"",sourceAccount,raw:{row:i+1,values:cells.map(v=>v instanceof Date?v.toISOString():v)}});}return out;}
async function parseStatementFile(file){const ext=String(file.name||"").split(".").pop().toLowerCase();let rows;if(ext==="csv"||file.type.includes("csv")){rows=parseCsvRows(await file.text());}else{const XLSX=await ensureXlsx();const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});const ws=wb.Sheets[wb.SheetNames[0]];rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:""});}const channel=RECON_DATA.selectedChannel||{};return normalizeStatementRows(rows,[financeChannelTitle(channel),financeChannelDetail(channel)].filter(Boolean).join(" · "));}
async function importStatementFile(file){if(!file)return;if(!RECON_CHANNEL_ID){alert("เลือกช่องทางการเงินก่อนนำเข้า Statement");el("reconFile").value="";return;}el("reconFileName").value=file.name;try{const rows=await parseStatementFile(file);if(!rows.length)throw new Error("ไม่พบรายการเงินออกในไฟล์นี้");const total=rows.reduce((s,r)=>s+r.amount,0),channel=RECON_DATA.selectedChannel||{};if(!confirm(`นำเข้า Statement ของ ${financeChannelTitle(channel)}\nพบเงินออก ${rows.length} รายการ รวม ${baht(total)}\n\nเริ่มกระทบยอดบัญชีนี้เลยไหม?`))return;const out=await reconciliationPost("/api/reconciliation-import",{fileName:file.name,sourceChannelId:RECON_CHANNEL_ID,rows});await refreshReconciliation({quiet:true});alert(`นำเข้าแล้ว ${out.imported} รายการ${out.skippedDuplicate?`\nข้ามรายการซ้ำ ${out.skippedDuplicate}`:""}${out.skippedInvalid?`\nข้ามข้อมูลไม่ครบ ${out.skippedInvalid}`:""}`);}catch(err){alert("นำเข้า Statement ไม่สำเร็จ: "+err.message);}finally{el("reconFile").value="";}}



/* ---------- SETTINGS ---------- */
function renderSettings(){
  if(el("setConn"))el("setConn").textContent=CONNECTED?"เชื่อมแล้ว":"ยังไม่เชื่อม";
  if(el("setTenant"))el("setTenant").textContent=TENANT||"—";
  if(el("setRows"))el("setRows").textContent=ALL.length+" รายการ";
  if(el("setCats"))el("setCats").textContent=[...new Set(ALL.map(r=>r.category).filter(Boolean))].join(", ")||"—";
  applyWorkspaceBranding();

  const gs=el("setGoogleState"),ga=el("setGoogleAction");
  if(gs){gs.className="integration-state "+(CONNECTED?"ok":"warn");gs.innerHTML=`<span class="state-dot"></span><span>${CONNECTED?"เชื่อมต่อแล้ว":"ยังไม่ได้เชื่อมต่อ"}</span>`;}
  if(ga){ga.href=WORKER+"/oauth/connect?tenant="+encodeURIComponent(TENANT);ga.textContent=CONNECTED?"เชื่อมต่อใหม่":"เชื่อมต่อ Google";ga.className="btn "+(CONNECTED?"":"solid");}

  const gmailConnected=EMAIL_INFO.connected===true;
  const gm=el("setGmailState");
  if(gm){const bad=EMAIL_INFO.reconnectRequired===true;gm.className="integration-state "+(gmailConnected?"ok":bad?"bad":"warn");gm.innerHTML=`<span class="state-dot"></span><span>${gmailConnected?"เชื่อมต่อแล้ว":bad?"สิทธิ์หมดอายุ":"ยังไม่ได้เชื่อมต่อ"}</span>`;}
  if(el("setGmailAction"))el("setGmailAction").textContent=gmailConnected?"เปิดกล่องเอกสาร":"เชื่อมต่อ Gmail";

  const financeReady=financeChannels(true).length>0,financeState=el("setFinanceState");
  if(financeState){financeState.className="integration-state "+(financeReady?"ok":"warn");financeState.innerHTML=`<span class="state-dot"></span><span>${financeReady?`พร้อมใช้งาน ${financeChannels(true).length} ช่องทาง`:"ยังไม่มีช่องทางการเงิน"}</span>`;}
  renderCompanySetupGate();
}

/* ---------- EXPORT ---------- */
function toCSV(rows){
  const head=["วันที่รายการ","วันที่บันทึก","ย้อนหลัง (วัน)","ยอด","ร้าน/ผู้รับ","ผู้โอน","หมวด","รายละเอียด","ผู้ส่ง","สถานะ","หลักฐาน","ใบเบิก PDF","ใบแทน PDF"];
  const body=rows.map(r=>[r.dateISO||r.date,r.createdAt,dayGap(r),r.amount,r.vendor,r.transferor,r.category,r.note,r.sender,r.status,r.img,r.claimPdfUrl,r.receiptPdfUrl].map(v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`).join(","));
  return "\ufeff"+[head.join(","),...body].join("\n");
}
function download(name,text){
  const b=new Blob([text],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(b),a=document.createElement("a");
  a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* ---------- NAV / DRAW ---------- */
const TITLES={overview:"ภาพรวม",expenses:"รายจ่าย",income:"รายรับ",reimburse:"เบิกจ่าย",batches:"เบิกจ่าย",reconciliation:"กระทบยอดธนาคาร",reports:"รายงานและภาษี",bills:"ศูนย์เอกสารบัญชี",email:"เอกสารจากอีเมล",subscriptions:"รายจ่ายประจำ",activity:"ประวัติการบันทึก",billing:"แพ็กเกจ",settings:"ตั้งค่าการใช้งาน",business:"จัดการธุรกิจ"};

function closeMobileMore(){const box=el("mobileMoreBackdrop");if(box)box.hidden=true;document.body.classList.remove("mobile-more-open");}
function openMobileMore(){const box=el("mobileMoreBackdrop");if(!box)return;closeBusinessSwitcher();box.hidden=false;document.body.classList.add("mobile-more-open");}
if(el("mobileMoreNav"))el("mobileMoreNav").addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openMobileMore();});
if(el("mobileMoreClose"))el("mobileMoreClose").onclick=closeMobileMore;
if(el("mobileMoreBackdrop"))el("mobileMoreBackdrop").addEventListener("click",e=>{if(e.target===el("mobileMoreBackdrop"))closeMobileMore();});
document.querySelectorAll("[data-mobile-page]").forEach(b=>b.addEventListener("click",()=>{const p=b.dataset.mobilePage;closeMobileMore();openPage(p,document.querySelector(`[data-p="${p}"]`));window.scrollTo({top:0,behavior:"smooth"});}));
document.querySelectorAll("[data-mobile-biz]").forEach(b=>b.addEventListener("click",()=>{const tab=b.dataset.mobileBiz;closeMobileMore();openBusiness(tab);window.scrollTo({top:0,behavior:"smooth"});}));
document.querySelectorAll("[data-mobile-external]").forEach(b=>b.addEventListener("click",()=>{
  const kind=b.dataset.mobileExternal;
  const target=kind==="files"?el("filesLink"):kind==="receipt"?el("receiptLink"):kind==="google"?el("connBtn"):kind==="sheet"?el("openSheetLink"):kind==="drive"?el("openDriveLink"):null;
  const href=target?.getAttribute("href")||"";
  if(!href||href==="#")return;
  closeMobileMore();
  if(kind==="sheet"||kind==="drive")window.open(href,"_blank","noopener,noreferrer");else location.href=href;
}));

document.querySelectorAll("[data-p]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.p,b)));
if(el("businessSwitcherBtn"))el("businessSwitcherBtn").addEventListener("click",e=>{e.stopPropagation();toggleBusinessSwitcher();});
if(el("mobileWorkspaceCard"))el("mobileWorkspaceCard").addEventListener("click",async()=>{await refreshBusinesses({quiet:true});openBusinessManager();});
if(document.querySelector(".company-menu"))document.querySelector(".company-menu").addEventListener("click",async()=>{await refreshBusinesses({quiet:true});openBusinessManager();});
document.addEventListener("click",e=>{
  const lockedBiz=e.target.closest("[data-locked-business]");if(lockedBiz){e.preventDefault();el("modal").classList.remove("show");closeBusinessSwitcher();openPage("billing",document.querySelector('[data-p="billing"]'));window.scrollTo({top:0,behavior:"smooth"});setTimeout(()=>alert("Workspace นี้ต้องใช้แพ็กเกจ Pro ขึ้นไป"),100);return;}
  const sw=e.target.closest("[data-switch-business]");if(sw){e.preventDefault();const url=sw.dataset.switchBusiness;if(url)location.href=url;return;}
  const add=e.target.closest("[data-add-business]");if(add){e.preventDefault();startAddBusiness();return;}
  const copy=e.target.closest("[data-copy-business-code]");if(copy){e.preventDefault();const code=copy.dataset.copyBusinessCode||"";navigator.clipboard?.writeText(code).then(()=>{copy.textContent="คัดลอกแล้ว ✓";}).catch(()=>prompt("คัดลอกรหัสนี้",code));return;}
  const refresh=e.target.closest("[data-refresh-businesses]");if(refresh){e.preventDefault();refreshBusinesses().then(()=>{if(el("businessPairState"))el("businessPairState").textContent=`พบ ${BUSINESS_INFO.businessCount||1}/${BUSINESS_INFO.businessLimit||1} ธุรกิจ`;});return;}
  if(!e.target.closest("#businessSwitcher"))closeBusinessSwitcher();
});
document.querySelectorAll("[data-plan-cycle]").forEach(b=>b.addEventListener("click",()=>{PLAN_CYCLE=b.dataset.planCycle==="annual"?"annual":"monthly";document.querySelectorAll("[data-plan-cycle]").forEach(x=>x.classList.toggle("on",x.dataset.planCycle===PLAN_CYCLE));renderPricing();}));
document.addEventListener("click",e=>{const open=e.target.closest("[data-open-billing]");if(open){e.preventDefault();openPage("billing",document.querySelector('[data-p="billing"]'));window.scrollTo({top:0,behavior:"smooth"});return;}const select=e.target.closest("[data-select-plan]");if(select){e.preventDefault();requestUpgrade(select.dataset.selectPlan);}});

document.querySelectorAll("[data-biz]").forEach(b=>b.addEventListener("click",()=>openBusiness(b.dataset.biz,b)));
el("businessToggle").addEventListener("click",()=>el("businessGroup").classList.toggle("closed"));
el("onboardingToggle").addEventListener("click",()=>el("onboardingCard").classList.toggle("closed"));
document.querySelectorAll(".onboard-step").forEach(b=>b.addEventListener("click",()=>onboardAction(b.dataset.step)));
document.querySelectorAll("[data-company-setup]").forEach(b=>b.addEventListener("click",()=>openCompanySetupStep(b.dataset.companySetup)));

// จัดการข้อมูลธุรกิจ
el("saveBusiness").onclick=async()=>{const ok=await saveSettings({company_name:el("bizCompany").value.trim(),company_address:el("bizAddress").value.trim().replace(/\n/g,"\\n"),tax_id:el("bizTaxId").value.trim()},"bizSaveState");if(ok){openPage("overview",document.querySelector('.navlink[data-p="overview"]'));window.scrollTo({top:0,behavior:"smooth"});}};
el("saveApprover").onclick=async()=>{const ok=await saveSettings({approver_name:el("bizApprover").value.trim()},"approverSaveState");if(ok){openPage("overview",document.querySelector('.navlink[data-p="overview"]'));window.scrollTo({top:0,behavior:"smooth"});}};
el("addCategory").onclick=async()=>{const name=el("newCategory").value.trim();if(!name)return;const a=parseSettingList("custom_categories");if(!a.includes(name))a.push(name);if(await saveSettings({custom_categories:JSON.stringify(a)})){el("newCategory").value="";}};
el("customCategoryTags").addEventListener("click",async e=>{const b=e.target.closest("[data-remove-category]");if(!b)return;const a=parseSettingList("custom_categories");a.splice(+b.dataset.removeCategory,1);await saveSettings({custom_categories:JSON.stringify(a)});});
el("addFinance").onclick=saveFinanceChannel;
el("cancelFinanceEdit").onclick=resetFinanceForm;
el("financeList").addEventListener("click",async e=>{const edit=e.target.closest("[data-edit-finance]");if(edit)return fillFinanceForm(+edit.dataset.editFinance);const def=e.target.closest("[data-default-finance]");if(def)return updateFinanceChannel(+def.dataset.defaultFinance,{isDefault:true});const toggle=e.target.closest("[data-toggle-finance]");if(toggle){const index=+toggle.dataset.toggleFinance,channel=financeChannels(false)[index];if(!channel)return;if(channel.isDefault&&channel.active)return alert("บัญชีหลักต้องเปิดใช้งานอยู่ กรุณาตั้งบัญชีอื่นเป็นบัญชีหลักก่อน");return updateFinanceChannel(index,{active:!channel.active});}});
function resetTeamForm(){TEAM_EDIT_INDEX=-1;["teamName","teamRole","teamLineId","teamBank","teamAccountNo","teamAccountName"].forEach(id=>el(id).value="");el("addTeam").textContent="บันทึกสมาชิก";el("cancelTeamEdit").hidden=true;el("teamSaveState").textContent="";}
function fillTeamForm(x={},editIndex=-1){TEAM_EDIT_INDEX=editIndex;el("teamName").value=x.name||"";el("teamRole").value=x.role||"พนักงาน";el("teamLineId").value=x.lineUserId||x.payerId||"";el("teamBank").value=x.bank||"";el("teamAccountNo").value=x.accountNo||"";el("teamAccountName").value=x.accountName||x.name||"";el("addTeam").textContent=editIndex>=0?"บันทึกการแก้ไข":"เพิ่มสมาชิก";el("cancelTeamEdit").hidden=false;el("teamName").focus();window.scrollTo({top:Math.max(0,el("biz-team").offsetTop-20),behavior:"smooth"});}
el("cancelTeamEdit").onclick=resetTeamForm;
el("addTeam").onclick=async()=>{const x={name:el("teamName").value.trim(),role:el("teamRole").value.trim()||"พนักงาน",lineUserId:el("teamLineId").value.trim(),bank:el("teamBank").value.trim(),accountNo:el("teamAccountNo").value.trim(),accountName:el("teamAccountName").value.trim(),updatedAt:new Date().toISOString()};if(!x.name)return alert("กรอกชื่อสมาชิกก่อน");const a=parseSettingList("team_members");if(TEAM_EDIT_INDEX>=0&&a[TEAM_EDIT_INDEX])a[TEAM_EDIT_INDEX]={...a[TEAM_EDIT_INDEX],...x};else{const found=a.findIndex(m=>(x.lineUserId&&String(m.lineUserId||"")===x.lineUserId)||String(m.name||"").trim().toLowerCase()===x.name.toLowerCase());if(found>=0)a[found]={...a[found],...x};else a.push(x);}if(await saveSettings({team_members:JSON.stringify(a)},"teamSaveState"))resetTeamForm();};
el("teamList").addEventListener("click",async e=>{const edit=e.target.closest("[data-edit-team]");if(edit){const a=parseSettingList("team_members");return fillTeamForm(a[+edit.dataset.editTeam]||{},+edit.dataset.editTeam);}const pre=e.target.closest("[data-prefill-team]");if(pre)return fillTeamForm(TEAM_RENDERED[+pre.dataset.prefillTeam]||{},-1);const b=e.target.closest("[data-remove-team]");if(!b)return;const a=parseSettingList("team_members");if(!confirm(`ลบ ${a[+b.dataset.removeTeam]?.name||"สมาชิกนี้"} ออกจากทีม?`))return;a.splice(+b.dataset.removeTeam,1);if(await saveSettings({team_members:JSON.stringify(a)},"teamSaveState"))resetTeamForm();});




if(el("batchMasterSearch"))el("batchMasterSearch").addEventListener("input",()=>{BATCH_PAGE=1;renderMasterTable();});
if(el("batchMasterStatus"))el("batchMasterStatus").addEventListener("change",e=>setStatusFilter(e.target.value));
if(el("batchStatusStrip"))el("batchStatusStrip").addEventListener("click",e=>{const b=e.target.closest("[data-batch-filter]");if(b)setStatusFilter(b.dataset.batchFilter);});
if(el("batchMasterRefresh"))el("batchMasterRefresh").onclick=()=>refreshBatchData();
if(el("batchMasterCreate"))el("batchMasterCreate").onclick=()=>createBatchFromSelection("ปกติ");
if(el("batchMasterUrgent"))el("batchMasterUrgent").onclick=()=>createBatchFromSelection("ด่วน");
if(el("batchMasterMarkTransfer"))el("batchMasterMarkTransfer").onclick=markSelectedTransfers;
if(el("batchMasterPaymentInput"))el("batchMasterPaymentInput").addEventListener("change",e=>uploadSelectedPaymentSlips(e.target));
if(el("batchMasterExport"))el("batchMasterExport").onclick=exportMasterTransfers;
function masterToggleVisible(should){
  masterFilteredRows().forEach(row=>{if(reviewMergeSelectable(row))setReviewMergeSelected(row,should);});
  renderMasterTable();
}
if(el("batchMasterHeaderCheck"))el("batchMasterHeaderCheck").onchange=e=>masterToggleVisible(e.target.checked);
if(el("batchMasterBody"))el("batchMasterBody").addEventListener("change",async e=>{
  if(e.target.matches("[data-master-merge-id]")){
    const id=String(e.target.dataset.masterMergeId||""),kind=String(e.target.dataset.masterMergeKind||"queue");
    const row=allMasterRows().find(x=>x.kind===kind&&String(x.id)===id);
    if(row){TRANSFER_SELECTED.clear();setReviewMergeSelected(row,e.target.checked);}
    return renderMasterTable();
  }
  if(e.target.matches("[data-payment-channel-select]")){const select=e.target,batchId=select.dataset.batchId,channelId=select.value;if(!channelId)return;select.disabled=true;try{await assignBatchPaymentChannel(batchId,channelId,{quiet:true});}catch(err){alert("เลือกบัญชีที่จ่ายไม่สำเร็จ: "+err.message);await refreshBatchData({quiet:true});}finally{select.disabled=false;}return;}
  if(e.target.matches("[data-batch-slip]"))uploadBatchPaymentSlip(e.target);
});
function openAccountingMasterRow(row){
  if(!row)return;
  if(row.matches("[data-open-queue]"))return openQueueReview(row.dataset.openQueue);
  if(row.matches("[data-open-batch]"))return openBatchDrawer(row.dataset.openBatch);
}
if(el("batchMasterBody"))el("batchMasterBody").addEventListener("click",e=>{
  const team=e.target.closest("[data-open-team]");if(team){e.stopPropagation();return openBusiness("team");}
  const finance=e.target.closest("[data-open-finance]");if(finance){e.stopPropagation();return openBusiness("finance");}
  const pay=e.target.closest("[data-pay-batch]");if(pay){e.stopPropagation();return openPaymentDialog(pay.dataset.payBatch);}
  const copy=e.target.closest("[data-copy-account]");if(copy){e.stopPropagation();return copyAccountNumber(copy.dataset.copyAccount).then(()=>{const old=copy.textContent;copy.textContent="คัดลอกแล้ว";setTimeout(()=>copy.textContent=old,900);});}
  const queueReview=e.target.closest("[data-open-queue-review]");if(queueReview){e.stopPropagation();return openQueueReview(queueReview.dataset.openQueueReview);}
  const button=e.target.closest("[data-open-batch-button]");if(button){e.stopPropagation();return openBatchDrawer(button.dataset.openBatchButton);}
  if(e.target.closest("a,button,input,label,select,textarea"))return;
  openAccountingMasterRow(e.target.closest("tr[data-open-queue],tr[data-open-batch]"));
});
if(el("batchMasterBody"))el("batchMasterBody").addEventListener("keydown",e=>{
  if(!["Enter"," "].includes(e.key)||e.target.closest("a,button,input,label,select,textarea"))return;
  const row=e.target.closest("tr[data-open-queue],tr[data-open-batch]");if(!row)return;
  e.preventDefault();openAccountingMasterRow(row);
});
if(el("batchDrawerClose"))el("batchDrawerClose").onclick=closeBatchDrawer;
if(el("batchDrawerBackdrop"))el("batchDrawerBackdrop").addEventListener("click",e=>{if(e.target===el("batchDrawerBackdrop"))closeBatchDrawer();});
if(el("batchDrawerFooter"))el("batchDrawerFooter").addEventListener("click",e=>{const team=e.target.closest("[data-open-team]");if(team){closeBatchDrawer();return openBusiness("team");}const finance=e.target.closest("[data-open-finance]");if(finance){closeBatchDrawer();return openBusiness("finance");}const b=e.target.closest("[data-drawer-action]");if(b)runDrawerAction(b.dataset.drawerAction).catch(err=>alert("ดำเนินการไม่สำเร็จ: "+err.message));});
if(el("batchDrawerFooter"))el("batchDrawerFooter").addEventListener("change",e=>{if(e.target.matches("[data-batch-slip]"))uploadBatchPaymentSlip(e.target);});
if(el("batchRejectClose"))el("batchRejectClose").onclick=closeRejectDialog;
if(el("batchRejectCancel"))el("batchRejectCancel").onclick=closeRejectDialog;
if(el("batchRejectSubmit"))el("batchRejectSubmit").onclick=submitBatchReject;
if(el("batchRejectBackdrop"))el("batchRejectBackdrop").addEventListener("click",e=>{if(e.target===el("batchRejectBackdrop"))closeRejectDialog();});
if(el("batchPaymentClose"))el("batchPaymentClose").onclick=closePaymentDialog;
if(el("batchPaymentCancel"))el("batchPaymentCancel").onclick=closePaymentDialog;
if(el("batchPaymentSubmit"))el("batchPaymentSubmit").onclick=submitBatchPayment;
if(el("batchPaymentBackdrop"))el("batchPaymentBackdrop").addEventListener("click",e=>{if(e.target===el("batchPaymentBackdrop"))closePaymentDialog();});
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(el("reconDrawerBackdrop")?.hidden===false)closeReconDrawer();else if(el("batchPaymentBackdrop")?.hidden===false)closePaymentDialog();else if(el("batchRejectBackdrop")?.hidden===false)closeRejectDialog();else if(el("batchDrawerBackdrop")?.hidden===false)closeBatchDrawer();});
if(el("batchMergeItems"))el("batchMergeItems").addEventListener("change",()=>{if(el("batchMaxItems"))el("batchMaxItems").disabled=!el("batchMergeItems").checked;});
if(el("batchSaveSettings"))el("batchSaveSettings").onclick=async()=>{const [h,m]=String(el("batchTime").value||"11:00").split(":").map(Number);const ok=await saveSettings({batch_enabled:el("batchEnabled").checked?"TRUE":"FALSE",batch_merge_items:el("batchMergeItems").checked?"TRUE":"FALSE",batch_weekday:String(el("batchWeekday").value||1),batch_hour:String(Number.isFinite(h)?h:11),batch_minute:String(Number.isFinite(m)?m:0),batch_max_items:String(Math.max(1,Math.min(10,Number(el("batchMaxItems").value||10)))),batch_timezone:"Asia/Bangkok"},"batchSaveState");if(ok)await refreshBatchData({quiet:true});};

if(el("reconRefresh"))el("reconRefresh").onclick=()=>refreshReconciliation();
if(el("reconAccountStrip"))el("reconAccountStrip").addEventListener("click",e=>{const b=e.target.closest("[data-recon-channel]");if(!b||String(b.dataset.reconChannel)===String(RECON_CHANNEL_ID))return;RECON_CHANNEL_ID=String(b.dataset.reconChannel||"");RECON_FILTER="all";ACTIVE_RECON_ID="";refreshReconciliation();});
if(el("reconConfirmSuggested"))el("reconConfirmSuggested").onclick=confirmSuggestedReconciliations;
if(el("reconFile"))el("reconFile").addEventListener("change",e=>importStatementFile(e.target.files?.[0]));
if(el("reconSearch"))el("reconSearch").addEventListener("input",()=>{RECON_PAGE=1;renderReconciliation();});
if(el("reconStatus"))el("reconStatus").addEventListener("change",e=>{RECON_PAGE=1;RECON_FILTER=e.target.value;renderReconciliation();});
if(el("reconKpis"))el("reconKpis").addEventListener("click",e=>{const b=e.target.closest("[data-recon-filter]");if(!b)return;RECON_PAGE=1;RECON_FILTER=b.dataset.reconFilter;renderReconciliation();});
if(el("reconBody"))el("reconBody").addEventListener("click",async e=>{if(e.target.closest("a"))return;const confirmBtn=e.target.closest("[data-recon-confirm]");if(confirmBtn){e.stopPropagation();if(!confirm("ยืนยันว่ารายการธนาคารนี้ตรงกับใบเบิกที่ระบบแนะนำ?"))return;try{await confirmReconPairs([{reconciliationId:confirmBtn.dataset.reconConfirm,batchId:confirmBtn.dataset.batchId,score:100}]);}catch(err){alert("กระทบยอดไม่สำเร็จ: "+err.message);}return;}const open=e.target.closest("[data-recon-open]")||e.target.closest("[data-recon-row]");if(open)openReconDrawer(open.dataset.reconOpen||open.dataset.reconRow);});
if(el("reconDrawerClose"))el("reconDrawerClose").onclick=closeReconDrawer;
if(el("reconDrawerBackdrop"))el("reconDrawerBackdrop").addEventListener("click",e=>{if(e.target===el("reconDrawerBackdrop"))closeReconDrawer();});
if(el("reconDrawerFooter"))el("reconDrawerFooter").addEventListener("click",async e=>{if(e.target.closest("[data-recon-close]"))return closeReconDrawer();const unlink=e.target.closest("[data-recon-unlink]");if(unlink){if(!confirm("ยกเลิกการจับคู่รายการธนาคารกับใบเบิกนี้?"))return;try{await reconciliationPost("/api/reconciliation-unlink",{reconciliationId:unlink.dataset.reconUnlink});closeReconDrawer();await Promise.all([refreshReconciliation({quiet:true}),refreshBatchData({quiet:true})]);}catch(err){alert("ยกเลิกการจับคู่ไม่สำเร็จ: "+err.message);}return;}const ignore=e.target.closest("[data-recon-ignore]");if(ignore){if(!confirm("ข้ามรายการธนาคารนี้? ใช้กับค่าธรรมเนียม หรือรายการที่ไม่เกี่ยวกับใบเบิก"))return;try{await reconciliationPost("/api/reconciliation-ignore",{reconciliationId:ignore.dataset.reconIgnore,note:"ข้ามจาก Dashboard"});closeReconDrawer();await refreshReconciliation({quiet:true});}catch(err){alert("ข้ามรายการไม่สำเร็จ: "+err.message);}}});
if(el("reconDrawerBody"))el("reconDrawerBody").addEventListener("click",async e=>{const pick=e.target.closest("[data-recon-pick]");if(!pick)return;const force=pick.dataset.force==="1";const msg=force?"ยอดเงินไม่ตรงกัน ต้องการจับคู่แบบบังคับและเก็บเป็นข้อยกเว้นหรือไม่?":"ยืนยันจับคู่รายการธนาคารกับใบเบิกนี้?";if(!confirm(msg))return;try{await confirmReconPairs([{reconciliationId:pick.dataset.reconPick,batchId:pick.dataset.batchId,score:force?0:100,note:force?"จับคู่ยอดต่างโดยผู้ใช้":""}],{force});closeReconDrawer();}catch(err){alert("กระทบยอดไม่สำเร็จ: "+err.message);}});

if(el("emailQ"))el("emailQ").addEventListener("input",()=>{EMAIL_PAGE=1;renderEmailInbox();});
if(el("emailStatus"))el("emailStatus").addEventListener("change",()=>{EMAIL_PAGE=1;renderEmailInbox();});
if(el("emailRefresh"))el("emailRefresh").onclick=async()=>{await refreshEmailData({manual:true});if(EMAIL_INFO.connected)await syncGmail({manual:true});};
if(el("connectGmail"))el("connectGmail").onclick=()=>{location.href=WORKER+`/gmail/connect?tenant=${encodeURIComponent(TENANT)}&k=${encodeURIComponent(K)}`;};
if(el("gmailSyncNow"))el("gmailSyncNow").onclick=()=>syncGmail({manual:true});
if(el("gmailDisconnect"))el("gmailDisconnect").onclick=async()=>{if(!confirm("ยกเลิกการเชื่อมต่อ Gmail? ระบบจะหยุดดึงเอกสารใหม่ แต่ข้อมูลที่บันทึกไว้จะไม่หาย"))return;const {res}=await emailPost("/api/gmail-disconnect",{});if(!res.ok){alert("ยกเลิกการเชื่อมต่อไม่สำเร็จ");return;}EMAIL_INFO={connected:false};renderEmailInbox();renderOnboarding();renderSettings();};
if(el("setGmailAction"))el("setGmailAction").onclick=()=>{if(EMAIL_INFO.connected)return openPage("email",document.querySelector('[data-p="email"]'));location.href=WORKER+`/gmail/connect?tenant=${encodeURIComponent(TENANT)}&k=${encodeURIComponent(K)}`;};
if(el("showLineInfo"))el("showLineInfo").onclick=()=>onboardAction("line");
if(el("emailList"))el("emailList").addEventListener("click",async e=>{const b=e.target.closest("[data-email-action]");if(!b)return;const id=b.dataset.id,act=b.dataset.emailAction;if(act==="approve")return approveEmail(id);if(act==="edit")return openEmailEditor(id);if(act==="ignore"){if(!confirm("ข้ามเอกสารนี้และไม่นำไปบันทึกรายจ่าย?"))return;await emailPost("/api/email-ignore",{id});await refreshEmailData();}});

document.addEventListener("click",e=>{const finance=e.target.closest("[data-open-finance]");if(finance){e.preventDefault();openBusiness("finance");return;}const recon=e.target.closest("[data-open-reconciliation]");if(recon){e.preventDefault();openPage("reconciliation",document.querySelector('[data-p="reconciliation"]'));return;}const batches=e.target.closest("[data-open-batches]");if(batches){e.preventDefault();openPage("batches",document.querySelector('[data-p="batches"]'));}});

el("rangeSel").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
  el("rangeSel").querySelectorAll("button").forEach(x=>x.classList.remove("on"));b.classList.add("on");RANGE=b.dataset.r;drawScoped();
}));
["q","fStatus","fCat","fSender","fDateBasis","fSort"].forEach(id=>{const e=el(id);if(e)e.addEventListener("input",()=>{EXPENSE_PAGE=1;renderExp();});});
el("expCsv").onclick=()=>download("expenses.csv",toCSV(filteredExp()));
if(el("expenseStatusTabs"))el("expenseStatusTabs").addEventListener("click",e=>{const b=e.target.closest("[data-exp-status]");if(!b)return;el("fStatus").value=b.dataset.expStatus||"";EXPENSE_PAGE=1;renderExp();});
if(el("rows"))el("rows").addEventListener("click",e=>{if(e.target.closest("a"))return;const open=e.target.closest("[data-exp-open]");if(open)openExpenseDrawer(open.dataset.expOpen);});
if(el("expenseDrawerClose"))el("expenseDrawerClose").onclick=closeExpenseDrawer;
if(el("expenseDrawerBackdrop"))el("expenseDrawerBackdrop").onclick=closeExpenseDrawer;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&el("expenseDrawer")?.classList.contains("open"))closeExpenseDrawer();});
el("repMonth").onchange=renderReport;
el("repCsv").onclick=()=>download("report.csv",toCSV(repData()));
el("repPrint").onclick=()=>window.print();
["docQ","docStatus","docMonth","docSort"].forEach(id=>{const node=el(id);if(node)node.addEventListener(id==="docQ"?"input":"change",()=>{DOCUMENT_PAGE=1;renderBills();});});
if(el("docCsv"))el("docCsv").onclick=exportDocumentCSV;

function drawScoped(){const p=currentPageKey();if(p==="overview"){renderKPIs();renderTrend();renderCats();renderVendors();renderRecent();}else if(p==="expenses")renderExp();}
function drawAll(){buildCatFilter();buildSenderFilter();renderOnboarding();renderLocalPage(currentPageKey());
  applyWorkspaceBranding();
  // ส่ง k ต่อไปทุกลิงก์ ไม่งั้นหน้าปลายทางจะโดน 401
  const qs="?tenant="+encodeURIComponent(TENANT)+"&k="+encodeURIComponent(K);
  el("filesLink").href=location.origin+"/files"+qs;
  el("receiptLink").href=location.origin+"/receipt"+qs;
  // เชื่อมแล้วก็ไม่ต้องโชว์ปุ่มเชื่อมอีก
  el("connBtn").href=WORKER+"/oauth/connect?tenant="+encodeURIComponent(TENANT);
  el("connBtn").style.display=CONNECTED?"none":"flex";
}

/* ---------- INCOME / ACCOUNTS RECEIVABLE ---------- */
function incomeNum(v){const n=Number(String(v??0).replace(/,/g,""));return Number.isFinite(n)?n:0;}
function incomeRound(v){return Math.round((incomeNum(v)+Number.EPSILON)*100)/100;}
function incomeToday(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;}
function incomeDateLabel(v){const d=pdate(v);return d?fmtDate(d):"—";}
function incomeMonthKey(v){const m=String(v||"").match(/^(\d{4})-(\d{2})/);return m?`${m[1]}-${m[2]}`:"";}
function incomeMonthLabel(key){const d=pdate(`${key}-01`);return d?d.toLocaleDateString("th-TH",{month:"long",year:"numeric"}):key;}
function incomeIsOverdue(r){return r&&r.status!=="ยกเลิก"&&incomeNum(r.outstanding)>.009&&r.dueDate&&String(r.dueDate)<incomeToday();}
function incomeChannelsOptions(selected=""){const list=financeChannels(true).filter(x=>x.canReceive!==false);return `<option value="">เลือกช่องทางรับเงิน</option>${list.map(x=>`<option value="${escAttr(x.id)}" ${String(x.id)===String(selected)?"selected":""}>${esc(financeChannelTitle(x))} · ${esc(financeChannelDetail(x))}</option>`).join("")}`;}
function incomeChannelName(id){const c=financeChannels(false).find(x=>String(x.id)===String(id));return c?`${financeChannelTitle(c)}${financeChannelDetail(c)?` · ${financeChannelDetail(c)}`:""}`:(id||"—");}
function incomeStatusBadge(r){
  let label=String(r.status||"รอรับเงิน"),cls="";
  if(label==="รับครบแล้ว")cls="paid";
  else if(label==="รับบางส่วน")cls="partial";
  else if(label==="ยกเลิก")cls="cancelled";
  else if(incomeIsOverdue(r)){label="เกินกำหนด";cls="overdue";}
  return `<span class="income-status ${cls}">${esc(label)}</span>`;
}
function incomeCategoryOptions(selected=""){
  const cats=Array.from(new Set([...(INCOME_DATA.categories||[]),"ขายสินค้า","ค่าบริการ","ค่าสมาชิก / Subscription","ค่าเช่า","ค่าคอมมิชชั่น / ค่านายหน้า","ค่าธรรมเนียม","รายได้จากโครงการ","ดอกเบี้ย / รายได้ทางการเงิน","รายได้อื่น"]));
  return cats.map(c=>`<option value="${escAttr(c)}" ${c===selected?"selected":""}>${esc(c)}</option>`).join("");
}
function incomeRecordById(id){return (INCOME_DATA.records||[]).find(r=>String(r.id)===String(id))||null;}
function incomePaymentsFor(id){return (INCOME_DATA.payments||[]).filter(p=>String(p.incomeId)===String(id)).sort((a,b)=>String(b.receivedDate||b.createdAt||"").localeCompare(String(a.receivedDate||a.createdAt||"")));}
function incomeFilterRows(){
  const q=String(el("incomeQ")?.value||"").trim().toLowerCase();
  const status=String(el("incomeStatus")?.value||"");
  const cat=String(el("incomeCategory")?.value||"");
  const month=String(el("incomeMonth")?.value||"");
  let rows=[...(INCOME_DATA.records||[])];
  if(month)rows=rows.filter(r=>incomeMonthKey(r.issueDate)===month);
  if(cat)rows=rows.filter(r=>String(r.category||"")===cat);
  if(status==="overdue")rows=rows.filter(incomeIsOverdue);
  else if(status)rows=rows.filter(r=>String(r.status||"")===status);
  if(q)rows=rows.filter(r=>[r.customer,r.customerTaxId,r.description,r.category,r.invoiceNo,r.taxInvoiceNo,r.receiptNo,r.referenceNo].join(" ").toLowerCase().includes(q));
  return rows.sort((a,b)=>String(b.issueDate||b.createdAt||"").localeCompare(String(a.issueDate||a.createdAt||""))||String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
}
function incomeKpiRows(){
  const month=String(el("incomeMonth")?.value||"");
  return (INCOME_DATA.records||[]).filter(r=>r.status!=="ยกเลิก"&&(!month||incomeMonthKey(r.issueDate)===month));
}
function incomeTotals(rows){
  const sum=k=>incomeRound(rows.reduce((a,r)=>a+incomeNum(r[k]),0));
  const overdue=rows.filter(incomeIsOverdue);
  return {gross:sum("grossAmount"),cash:sum("cashReceived"),wht:sum("whtCreditReceived"),outstanding:sum("outstanding"),vat:sum("vatAmount"),waiting:rows.filter(r=>["รอรับเงิน","รับบางส่วน"].includes(r.status)).length,overdue:incomeRound(overdue.reduce((a,r)=>a+incomeNum(r.outstanding),0)),overdueCount:overdue.length};
}
function buildIncomeFilters(){
  const catSel=el("incomeCategory"),monthSel=el("incomeMonth");
  if(catSel){const cur=catSel.value;catSel.innerHTML='<option value="">ทุกประเภทรายได้</option>'+incomeCategoryOptions(cur);if([...catSel.options].some(o=>o.value===cur))catSel.value=cur;}
  if(monthSel){const cur=monthSel.value;const keys=Array.from(new Set((INCOME_DATA.records||[]).map(r=>incomeMonthKey(r.issueDate)).filter(Boolean))).sort().reverse();monthSel.innerHTML='<option value="">ทุกเดือน</option>'+keys.map(k=>`<option value="${k}">${esc(incomeMonthLabel(k))}</option>`).join("");if(keys.includes(cur))monthSel.value=cur;}
}
function renderIncome(){
  buildIncomeFilters();
  const base=incomeKpiRows(),t=incomeTotals(base),rows=incomeFilterRows();
  if(el("incomeKGross"))el("incomeKGross").textContent=baht(t.gross);
  if(el("incomeKCount"))el("incomeKCount").textContent=`${base.length.toLocaleString("th-TH")} รายการ`;
  if(el("incomeKCash"))el("incomeKCash").textContent=baht(t.cash);
  if(el("incomeKWht"))el("incomeKWht").textContent=`WHT เครดิต ${baht(t.wht)}`;
  if(el("incomeKOutstanding"))el("incomeKOutstanding").textContent=baht(t.outstanding);
  if(el("incomeKWaiting"))el("incomeKWaiting").textContent=`${t.waiting.toLocaleString("th-TH")} รายการรอรับ`;
  if(el("incomeKVat"))el("incomeKVat").textContent=baht(t.vat);
  if(el("incomeKOverdue"))el("incomeKOverdue").textContent=baht(t.overdue);
  if(el("incomeKOverdueCount"))el("incomeKOverdueCount").textContent=`${t.overdueCount.toLocaleString("th-TH")} รายการ`;
  const pages=Math.max(1,Math.ceil(rows.length/INCOME_PAGE_SIZE));INCOME_PAGE=Math.min(Math.max(1,INCOME_PAGE),pages);
  const start=(INCOME_PAGE-1)*INCOME_PAGE_SIZE,end=Math.min(rows.length,start+INCOME_PAGE_SIZE),visible=rows.slice(start,end);
  if(el("incomeTableMeta"))el("incomeTableMeta").textContent=`แสดง ${rows.length?start+1:0}-${end} จาก ${rows.length.toLocaleString("th-TH")} รายการที่กรอง · ทั้งหมด ${(INCOME_DATA.records||[]).length.toLocaleString("th-TH")} รายการ · ยอดตัดลูกหนี้นับเงินเข้าจริง + เครดิตหัก ณ ที่จ่าย`;
  const body=el("incomeBody");if(!body)return;
  const pager=el("incomePager");if(pager){pager.hidden=rows.length<=INCOME_PAGE_SIZE;pager.innerHTML=`<button type="button" onclick="changeIncomePage(-1)" ${INCOME_PAGE<=1?"disabled":""}>‹ ก่อนหน้า</button><span class="page-info">หน้า ${INCOME_PAGE}/${pages}</span><button type="button" onclick="changeIncomePage(1)" ${INCOME_PAGE>=pages?"disabled":""}>ถัดไป ›</button>`;}
  if(!rows.length){body.innerHTML='<tr><td colspan="7"><div class="income-empty">ยังไม่มีรายการตามตัวกรองนี้<br><small>กด “+ บันทึกรายรับ” หรือส่งหลักฐานเงินเข้าใน LINE แล้วเลือกประเภทรายการเป็น “รายรับ”</small></div></td></tr>';return;}
  body.innerHTML=visible.map(r=>{
    const docs=[r.invoiceNo&&`INV ${r.invoiceNo}`,r.taxInvoiceNo&&`Tax ${r.taxInvoiceNo}`,r.receiptNo&&`Receipt ${r.receiptNo}`].filter(Boolean);
    const received=incomeNum(r.cashReceived),wht=incomeNum(r.whtCreditReceived),out=incomeNum(r.outstanding);
    const canReceive=r.status!=="ยกเลิก"&&out>.009;
    const canCancel=r.status!=="ยกเลิก"&&incomeNum(r.settledAmount)<=.009;
    return `<tr>
      <td class="main" data-label="วันที่ / ลูกค้า"><strong>${esc(r.customer||"ลูกค้าทั่วไป")}</strong><small>${incomeDateLabel(r.issueDate)}${r.dueDate?` · ครบกำหนด ${incomeDateLabel(r.dueDate)}`:""}</small><small>${esc(r.category||"รายได้อื่น")}</small></td>
      <td class="doc" data-label="เอกสาร"><strong>${esc(r.documentType||"รายรับทั่วไป")}</strong><small>${docs.length?esc(docs.join(" · ")):"ยังไม่ระบุเลขเอกสาร"}</small></td>
      <td class="num" data-label="ยอดตามเอกสาร"><strong>${baht(r.grossAmount)}</strong><small>ฐาน ${baht(r.subtotal)}${incomeNum(r.vatAmount)>0?` + VAT ${baht(r.vatAmount)}`:""}</small></td>
      <td class="num" data-label="รับแล้ว + WHT"><strong>${baht(received+wht)}</strong><small>เงินเข้า ${baht(received)}${wht>0?` · WHT ${baht(wht)}`:""}</small></td>
      <td class="num" data-label="คงค้าง"><strong>${baht(out)}</strong>${incomeNum(r.expectedWhtAmount)>0?`<small>คาด WHT ${baht(r.expectedWhtAmount)}</small>`:""}</td>
      <td data-label="สถานะ">${incomeStatusBadge(r)}</td>
      <td class="actions"><button class="income-action" type="button" onclick="showIncomeDetail('${escAttr(r.id)}')">รายละเอียด</button>${canReceive?`<button class="income-action primary" type="button" onclick="openIncomePayment('${escAttr(r.id)}')">รับเงิน</button>`:""}<button class="income-action" type="button" onclick="openIncomeEdit('${escAttr(r.id)}')">แก้ข้อมูล</button>${canCancel?`<button class="income-action danger" type="button" onclick="cancelIncome('${escAttr(r.id)}')">ยกเลิก</button>`:""}</td>
    </tr>`;
  }).join("");
  if(incomeReconModalOpen())renderIncomeRecon();
}
function changeIncomePage(delta){INCOME_PAGE+=Number(delta||0);renderIncome();el("page-income")?.scrollIntoView({block:"start",behavior:"smooth"});}
async function refreshIncome({quiet=false,withReconciliation=false}={}){
  if(INCOME_LOADING)return false;
  INCOME_LOADING=true;
  if(!quiet&&el("incomeTableMeta"))el("incomeTableMeta").textContent="กำลังโหลดข้อมูลรายรับ…";
  try{
    const res=await fetch(apiUrl("/api/income")+`&reconciliation=${withReconciliation?"1":"0"}&_=${Date.now()}`,{cache:"no-store",headers:{accept:"application/json","cache-control":"no-cache"}});
    const data=await res.json().catch(()=>({}));
    if(res.status===401||res.status===403){fatal("🔒","<b>ลิงก์นี้ใช้ไม่ได้แล้ว</b><br><br>พิมพ์ <b>แดชบอร์ด</b> ในกลุ่ม LINE เพื่อขอลิงก์ใหม่");return false;}
    if(!res.ok||data.ok===false)throw new Error(data.message||data.error||`HTTP ${res.status}`);
    INCOME_DATA={ok:true,records:Array.isArray(data.records)?data.records:[],payments:Array.isArray(data.payments)?data.payments:[],reconciliation:Array.isArray(data.reconciliation)?data.reconciliation:[],reconciliationSummary:data.reconciliationSummary||{},summary:data.summary||{},categories:Array.isArray(data.categories)?data.categories:[]};
    renderIncome();return true;
  }catch(err){console.error("income refresh",err);if(el("incomeTableMeta"))el("incomeTableMeta").textContent="โหลดรายรับไม่สำเร็จ — กดอัปเดตเพื่อลองใหม่";return false;}
  finally{INCOME_LOADING=false;}
}
function incomeCalcPreview(){
  const amount=Math.max(0,incomeNum(el("incAmount")?.value)),mode=el("incPriceMode")?.value||"no_vat",rate=mode==="no_vat"?0:Math.max(0,incomeNum(el("incVatRate")?.value));
  let base=amount,vat=0,gross=amount;
  if(mode==="inclusive"&&rate>0){gross=amount;base=gross/(1+rate/100);vat=gross-base;}
  else if(mode==="exclusive"&&rate>0){base=amount;vat=base*rate/100;gross=base+vat;}
  base=incomeRound(base);vat=incomeRound(vat);gross=incomeRound(gross);
  const wr=Math.max(0,incomeNum(el("incExpectedWht")?.value)),wht=incomeRound(base*wr/100),cash=incomeRound(Math.max(0,gross-wht));
  if(el("incPreviewBase"))el("incPreviewBase").textContent=baht(base);
  if(el("incPreviewVat"))el("incPreviewVat").textContent=baht(vat);
  if(el("incPreviewGross"))el("incPreviewGross").textContent=baht(gross);
  if(el("incPreviewCash"))el("incPreviewCash").textContent=baht(cash);
  return {base,vat,gross,wht,cash};
}
function resetIncomeEditor(){
  const today=incomeToday();el("incomeForm")?.reset();
  if(el("incIssueDate"))el("incIssueDate").value=today;if(el("incReceivedDate"))el("incReceivedDate").value=today;
  if(el("incCustomerBranch"))el("incCustomerBranch").value="สำนักงานใหญ่";
  if(el("incPriceMode"))el("incPriceMode").value="no_vat";if(el("incVatRate"))el("incVatRate").value="7";if(el("incExpectedWht"))el("incExpectedWht").value="0";
  if(el("incCategory"))el("incCategory").innerHTML=incomeCategoryOptions("รายได้อื่น");
  if(el("incPaymentChannel"))el("incPaymentChannel").innerHTML=incomeChannelsOptions();
  if(el("incInitialPayment"))el("incInitialPayment").hidden=true;
  incomeCalcPreview();
}
function openIncomeEditor(){resetIncomeEditor();const m=el("incomeEditor");if(m){m.classList.add("show");m.setAttribute("aria-hidden","false");}setTimeout(()=>el("incCustomer")?.focus(),50);}
function closeIncomeEditor(){const m=el("incomeEditor");if(m){m.classList.remove("show");m.setAttribute("aria-hidden","true");}}
function toggleIncomePaidNow(){const checked=!!el("incPaidNow")?.checked,box=el("incInitialPayment"),calc=incomeCalcPreview();if(box)box.hidden=!checked;if(checked){if(el("incReceivedDate")&&!el("incReceivedDate").value)el("incReceivedDate").value=incomeToday();if(el("incCashAmount")&&!incomeNum(el("incCashAmount").value))el("incCashAmount").value=calc.cash.toFixed(2);if(el("incWhtAmount")&&!incomeNum(el("incWhtAmount").value)&&calc.wht>0)el("incWhtAmount").value=calc.wht.toFixed(2);}}
async function incomeFileToPayload(file){
  if(!file)return null;if(file.size>8*1024*1024)throw new Error(`ไฟล์ ${file.name} ใหญ่เกิน 8 MB`);
  const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||""));r.onerror=()=>reject(new Error("อ่านไฟล์ไม่สำเร็จ"));r.readAsDataURL(file);});
  const base64=data.includes(",")?data.split(",").pop():data;
  return {base64,mediaType:file.type||"application/octet-stream",name:file.name||`income-${Date.now()}`};
}
async function uploadIncomeFile(file){
  if(!file)return "";const payload=await incomeFileToPayload(file);
  const res=await fetch(apiUrl("/api/income-upload"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||"อัปโหลดไฟล์ไม่สำเร็จ");return data.url||"";
}
async function saveIncome(event){
  event?.preventDefault();
  const customer=String(el("incCustomer")?.value||"").trim(),amount=incomeNum(el("incAmount")?.value),taxId=String(el("incCustomerTaxId")?.value||"").replace(/\D/g,"");
  if(!customer)return alert("กรอกชื่อลูกค้า / ผู้จ่ายก่อน");if(!(amount>0))return alert("กรอกยอดรายรับก่อน");if(taxId&&taxId.length!==13)return alert("เลขผู้เสียภาษีลูกค้าต้องมี 13 หลัก หรือเว้นว่างถ้าไม่มี");
  try{
    const payload={issueDate:el("incIssueDate").value,dueDate:el("incDueDate").value,customer,customerTaxId:taxId,customerBranch:el("incCustomerBranch").value.trim(),category:el("incCategory").value,description:el("incDescription").value.trim(),documentType:el("incDocumentType").value,invoiceNo:el("incInvoiceNo").value.trim(),taxInvoiceNo:el("incTaxInvoiceNo").value.trim(),receiptNo:el("incReceiptNo").value.trim(),amount,priceMode:el("incPriceMode").value,vatRate:incomeNum(el("incVatRate").value),expectedWhtRate:incomeNum(el("incExpectedWht").value),note:el("incNote").value.trim(),source:"Dashboard"};
    if(el("incPaidNow").checked){
      const cash=incomeNum(el("incCashAmount").value),wht=incomeNum(el("incWhtAmount").value);if(!(cash>0||wht>0))throw new Error("กรอกเงินเข้าจริงหรือยอดหัก ณ ที่จ่ายก่อน");
      const [slipUrl,whtCertificateUrl]=await Promise.all([uploadIncomeFile(el("incInitialSlip")?.files?.[0]),uploadIncomeFile(el("incInitialWhtCert")?.files?.[0])]);
      payload.initialPayment={cashAmount:cash,whtAmount:wht,receivedDate:el("incReceivedDate").value||incomeToday(),paymentChannelId:el("incPaymentChannel").value,referenceNo:el("incPaymentRef").value.trim(),slipUrl,whtCertificateUrl,source:"Dashboard"};
    }
    const res=await fetch(apiUrl("/api/income-create"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||"บันทึกรายรับไม่สำเร็จ");
    closeIncomeEditor();await refreshIncome();
  }catch(err){console.error(err);alert(err.message||"บันทึกรายรับไม่สำเร็จ");}
}
function openIncomePayment(id){
  const r=incomeRecordById(id);if(!r)return;ACTIVE_INCOME_ID=id;
  el("incomePaymentId").value=id;el("incomePaymentTitle").textContent=`รับชำระ · ${r.customer||"ลูกค้า"}`;el("incomePaymentSubtitle").textContent=[r.invoiceNo&&`INV ${r.invoiceNo}`,r.description].filter(Boolean).join(" · ")||"บันทึกเงินเข้าจริงและหัก ณ ที่จ่าย";
  el("incomePayGross").textContent=baht(r.grossAmount);el("incomePaySettled").textContent=baht(r.settledAmount);el("incomePayOutstanding").textContent=baht(r.outstanding);el("incomePayDate").value=incomeToday();el("incomePayChannel").innerHTML=incomeChannelsOptions(r.paymentChannelId||"");el("incomePayRef").value="";el("incomePayNote").value="";el("incomePaySlip").value="";el("incomePayWhtCert").value="";
  const outstanding=incomeNum(r.outstanding),expectedRemaining=Math.min(outstanding,Math.max(0,incomeNum(r.expectedWhtAmount)-incomeNum(r.whtCreditReceived)));el("incomePayWht").value=expectedRemaining>0?expectedRemaining.toFixed(2):"0";el("incomePayCash").value=Math.max(0,outstanding-expectedRemaining).toFixed(2);incomePaymentPreview();
  const m=el("incomePaymentModal");m.classList.add("show");m.setAttribute("aria-hidden","false");
}
function closeIncomePayment(){const m=el("incomePaymentModal");if(m){m.classList.remove("show");m.setAttribute("aria-hidden","true");}ACTIVE_INCOME_ID="";}
function incomePaymentPreview(){const r=incomeRecordById(el("incomePaymentId")?.value),cash=Math.max(0,incomeNum(el("incomePayCash")?.value)),wht=Math.max(0,incomeNum(el("incomePayWht")?.value)),settled=incomeRound(cash+wht),out=incomeNum(r?.outstanding);if(el("incomePayPreview"))el("incomePayPreview").textContent=`ยอดตัดลูกหนี้ ${baht(settled)} = เงินเข้าจริง ${baht(cash)} + WHT ${baht(wht)}${r?` · หลังบันทึกคงเหลือ ${baht(Math.max(0,out-settled))}`:""}`;return {cash,wht,settled,out};}
async function saveIncomePayment(event){
  event?.preventDefault();const id=el("incomePaymentId").value,r=incomeRecordById(id);if(!r)return;
  const p=incomePaymentPreview();if(!(p.settled>0))return alert("กรอกเงินเข้าจริงหรือยอดหัก ณ ที่จ่ายก่อน");if(p.settled>p.out+.01)return alert(`ยอดที่ตัด ${baht(p.settled)} มากกว่ายอดค้าง ${baht(p.out)}`);
  try{
    const [slipUrl,whtCertificateUrl]=await Promise.all([uploadIncomeFile(el("incomePaySlip")?.files?.[0]),uploadIncomeFile(el("incomePayWhtCert")?.files?.[0])]);
    const body={incomeId:id,cashAmount:p.cash,whtAmount:p.wht,receivedDate:el("incomePayDate").value||incomeToday(),paymentChannelId:el("incomePayChannel").value,referenceNo:el("incomePayRef").value.trim(),slipUrl,whtCertificateUrl,note:el("incomePayNote").value.trim(),source:"Dashboard"};
    const res=await fetch(apiUrl("/api/income-payment"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||"บันทึกรับชำระไม่สำเร็จ");closeIncomePayment();await refreshIncome();showIncomeDetail(id);
  }catch(err){console.error(err);alert(err.message||"บันทึกรับชำระไม่สำเร็จ");}
}
function showIncomeDetail(id){
  const r=incomeRecordById(id);if(!r)return;const payments=incomePaymentsFor(id),docs=[r.invoiceNo&&`Invoice ${r.invoiceNo}`,r.taxInvoiceNo&&`ใบกำกับ ${r.taxInvoiceNo}`,r.receiptNo&&`ใบเสร็จ ${r.receiptNo}`].filter(Boolean);
  el("modalBody").innerHTML=`<div class="cs">รายรับ / ลูกหนี้</div><h2 style="margin:5px 0 4px">${esc(r.customer||"ลูกค้าทั่วไป")}</h2><div class="cs">${esc(r.description||r.category||"รายรับ")}</div>
    <div class="income-detail-grid"><div><span>วันที่ขาย / เอกสาร</span><strong>${incomeDateLabel(r.issueDate)}</strong></div><div><span>ครบกำหนด</span><strong>${incomeDateLabel(r.dueDate)}</strong></div><div><span>ยอดตามเอกสาร</span><strong>${baht(r.grossAmount)}</strong></div><div><span>ลูกหนี้คงค้าง</span><strong>${baht(r.outstanding)}</strong></div><div><span>ฐาน / VAT</span><strong>${baht(r.subtotal)} / ${baht(r.vatAmount)}</strong></div><div><span>WHT ที่ได้รับ</span><strong>${baht(r.whtCreditReceived)}</strong></div><div><span>เลขเอกสาร</span><strong>${esc(docs.join(" · ")||"—")}</strong></div><div><span>สถานะ</span><strong>${incomeStatusBadge(r)}</strong></div></div>
    ${r.customerTaxId?`<div class="note" style="margin:10px 0">เลขผู้เสียภาษีลูกค้า ${esc(r.customerTaxId)} · ${esc(r.customerBranch||"สำนักงานใหญ่")}</div>`:""}
    ${r.note?`<div class="note" style="margin:10px 0"><b>หมายเหตุ</b><br>${esc(r.note)}</div>`:""}
    ${r.attachmentUrl?`<p><a class="btn" href="${escAttr(r.attachmentUrl)}" target="_blank" rel="noopener">เปิดเอกสารต้นทาง ↗</a></p>`:""}
    <h3 style="margin-top:20px">ประวัติรับชำระ</h3><div class="income-payment-history">${payments.length?payments.map(p=>`<div class="income-payment-row"><div><strong>${incomeDateLabel(p.receivedDate)} · ตัดลูกหนี้ ${baht(p.settledAmount)}</strong><small>เงินเข้าจริง ${baht(p.cashAmount)}${incomeNum(p.whtAmount)>0?` · WHT ${baht(p.whtAmount)}`:""}${p.paymentChannelId?` · ${esc(incomeChannelName(p.paymentChannelId))}`:""}</small>${p.referenceNo?`<small>อ้างอิง ${esc(p.referenceNo)}</small>`:""}</div><div>${p.slipUrl?`<a class="income-action" href="${escAttr(p.slipUrl)}" target="_blank" rel="noopener">สลิป</a>`:`<button class="income-action" onclick="attachIncomePaymentFile('${escAttr(p.paymentId)}','slipUrl')">+ สลิป</button>`}${incomeNum(p.whtAmount)>0?(p.whtCertificateUrl?`<a class="income-action" href="${escAttr(p.whtCertificateUrl)}" target="_blank" rel="noopener">50 ทวิ</a>`:`<button class="income-action" onclick="attachIncomePaymentFile('${escAttr(p.paymentId)}','whtCertificateUrl')">+ 50 ทวิ</button>`):""}</div></div>`).join(""):'<div class="income-empty" style="padding:18px">ยังไม่มีการรับชำระ</div>'}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px"><button class="btn" onclick="openIncomeEdit('${escAttr(r.id)}')">แก้ข้อมูลลูกค้า/เอกสาร</button>${r.status!=="ยกเลิก"&&incomeNum(r.outstanding)>.009?`<button class="btn solid" onclick="closeGlobalModal();openIncomePayment('${escAttr(r.id)}')">+ รับชำระ</button>`:""}</div>`;
  el("modal").classList.add("show");
}
function openIncomeEdit(id){
  const r=incomeRecordById(id);if(!r)return;
  el("modalBody").innerHTML=`<div class="cs">แก้ข้อมูลรายรับ</div><h2 style="margin:5px 0 14px">${esc(r.customer||"รายรับ")}</h2><form id="incomeEditForm" class="income-form"><input type="hidden" id="incomeEditId" value="${escAttr(r.id)}"><div><label>ลูกค้า / ผู้จ่าย</label><input id="incomeEditCustomer" value="${escAttr(r.customer||"")}"></div><div><label>เลขผู้เสียภาษี</label><input id="incomeEditTaxId" value="${escAttr(r.customerTaxId||"")}" maxlength="13"></div><div><label>สาขา</label><input id="incomeEditBranch" value="${escAttr(r.customerBranch||"")}"></div><div><label>วันครบกำหนด</label><input id="incomeEditDue" type="date" value="${escAttr(r.dueDate||"")}"></div><div><label>ประเภทรายได้</label><select id="incomeEditCategory">${incomeCategoryOptions(r.category)}</select></div><div><label>ประเภทเอกสาร</label><input id="incomeEditDocType" value="${escAttr(r.documentType||"")}"></div><div><label>Invoice / ใบวางบิล</label><input id="incomeEditInvoice" value="${escAttr(r.invoiceNo||"")}"></div><div><label>เลขใบกำกับภาษี</label><input id="incomeEditTaxInvoice" value="${escAttr(r.taxInvoiceNo||"")}"></div><div><label>เลขใบเสร็จ</label><input id="incomeEditReceipt" value="${escAttr(r.receiptNo||"")}"></div><div class="full"><label>รายละเอียด</label><input id="incomeEditDescription" value="${escAttr(r.description||"")}"></div><div class="full"><label>หมายเหตุ</label><textarea id="incomeEditNote">${esc(r.note||"")}</textarea></div><div class="income-tax-note full" style="margin:0"><span>ล็อกยอด</span><span>ยอด, VAT และยอดรับชำระไม่แก้จากหน้านี้เพื่อรักษาประวัติทางบัญชี ถ้ายอดต้นฉบับผิดและยังไม่รับเงิน ให้ยกเลิกรายการแล้วสร้างใหม่</span></div><div class="income-modal-actions"><button class="btn" type="button" onclick="showIncomeDetail('${escAttr(r.id)}')">ยกเลิก</button><button class="btn solid" type="submit">บันทึกการแก้ไข</button></div></form>`;
  el("modal").classList.add("show");el("incomeEditForm").addEventListener("submit",saveIncomeEdit);
}
async function saveIncomeEdit(event){
  event.preventDefault();const id=el("incomeEditId").value,tax=String(el("incomeEditTaxId").value||"").replace(/\D/g,"");if(tax&&tax.length!==13)return alert("เลขผู้เสียภาษีต้องมี 13 หลัก หรือเว้นว่าง");
  const patch={customer:el("incomeEditCustomer").value.trim(),customerTaxId:tax,customerBranch:el("incomeEditBranch").value.trim(),dueDate:el("incomeEditDue").value,category:el("incomeEditCategory").value,documentType:el("incomeEditDocType").value.trim(),invoiceNo:el("incomeEditInvoice").value.trim(),taxInvoiceNo:el("incomeEditTaxInvoice").value.trim(),receiptNo:el("incomeEditReceipt").value.trim(),description:el("incomeEditDescription").value.trim(),note:el("incomeEditNote").value.trim()};
  try{const res=await fetch(apiUrl("/api/income-update"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,patch})});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||"แก้ไขไม่สำเร็จ");await refreshIncome({quiet:true});showIncomeDetail(id);}catch(err){alert(err.message||"แก้ไขไม่สำเร็จ");}
}
async function cancelIncome(id){const r=incomeRecordById(id);if(!r)return;if(!confirm(`ยกเลิกรายการของ ${r.customer||"ลูกค้า"} ยอด ${baht(r.grossAmount)}?\n\nใช้ได้เฉพาะรายการที่ยังไม่รับชำระ`))return;try{const res=await fetch(apiUrl("/api/income-update"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,patch:{status:"ยกเลิก"}})});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||"ยกเลิกไม่สำเร็จ");await refreshIncome();}catch(err){alert(err.message||"ยกเลิกไม่สำเร็จ");}}
async function attachIncomePaymentFile(paymentId,field){
  const input=document.createElement("input");input.type="file";input.accept="image/*,.pdf,application/pdf";input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const url=await uploadIncomeFile(file);const res=await fetch(apiUrl("/api/income-payment-update"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({paymentId,patch:{[field]:url}})});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||"บันทึกไฟล์ไม่สำเร็จ");const payment=(INCOME_DATA.payments||[]).find(x=>x.paymentId===paymentId);await refreshIncome({quiet:true});if(payment)showIncomeDetail(payment.incomeId);}catch(err){alert(err.message||"อัปโหลดไม่สำเร็จ");}};input.click();
}
function csvCell(v){const s=String(v??"");return `"${s.replace(/"/g,'""')}"`;}
function downloadCsv(name,headers,rows){const text='\uFEFF'+[headers,...rows].map(r=>r.map(csvCell).join(",")).join("\r\n"),blob=new Blob([text],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function exportIncomeCsv(){const rows=incomeFilterRows();downloadCsv(`income-${incomeToday()}.csv`,["วันที่ขาย","วันครบกำหนด","ลูกค้า","เลขผู้เสียภาษี","สาขา","ประเภทรายได้","รายละเอียด","ประเภทเอกสาร","Invoice","เลขใบกำกับภาษี","เลขใบเสร็จ","ฐานก่อน VAT","VAT %","VAT","ยอดตามเอกสาร","คาด WHT %","คาด WHT","เงินเข้าจริง","WHT ที่ได้รับ","ยอดตัดแล้ว","คงค้าง","สถานะ"],rows.map(r=>[r.issueDate,r.dueDate,r.customer,r.customerTaxId,r.customerBranch,r.category,r.description,r.documentType,r.invoiceNo,r.taxInvoiceNo,r.receiptNo,r.subtotal,r.vatRate,r.vatAmount,r.grossAmount,r.expectedWhtRate,r.expectedWhtAmount,r.cashReceived,r.whtCreditReceived,r.settledAmount,r.outstanding,r.status]));}
function exportIncomeVatCsv(){const rows=incomeFilterRows().filter(r=>r.status!=="ยกเลิก"&&incomeNum(r.vatAmount)>0);downloadCsv(`sales-vat-${incomeToday()}.csv`,["วันที่","เลขใบกำกับภาษี","ลูกค้า","เลขผู้เสียภาษี","สาขา","รายละเอียด","ฐานภาษี","VAT","ยอดรวม"],rows.map(r=>[r.issueDate,r.taxInvoiceNo,r.customer,r.customerTaxId,r.customerBranch,r.description,r.subtotal,r.vatAmount,r.grossAmount]));}
function incomeReconModalOpen(){return el("incomeReconModal")?.classList.contains("show");}
function incomeReconRows(){
  const channel=String(el("incomeReconChannel")?.value||"");
  return (INCOME_DATA.reconciliation||[]).filter(r=>!channel||String(r.paymentChannelId||"")===channel);
}
function incomeReconStateMeta(status){
  const s=String(status||"");
  if(s==="กระทบยอดแล้ว")return {label:"กระทบแล้ว",cls:"done"};
  if(s==="แนะนำอัตโนมัติ")return {label:"ระบบแนะนำ",cls:"suggest"};
  if(s==="ต้องตรวจ")return {label:"ต้องตรวจ",cls:"review"};
  if(s==="ข้าม")return {label:"ข้าม",cls:""};
  return {label:"ยังไม่พบคู่",cls:"none"};
}
function incomeReconCandidateLabel(c){
  if(!c)return "—";
  const count=Number(c.count||c.paymentIds?.length||1);
  const docs=String(c.invoiceNo||"").trim();
  return `${c.customer||"ลูกค้า"}${docs?` · ${docs}`:""}${count>1?` · ${count} รายการ`:""}`;
}
function incomeUnreconciledPayments(row){
  const linked=new Set((INCOME_DATA.reconciliation||[]).filter(x=>String(x.status||"")==="กระทบยอดแล้ว").flatMap(x=>String(x.paymentId||"").split(",").map(v=>v.trim()).filter(Boolean)));
  return (INCOME_DATA.payments||[]).filter(p=>incomeNum(p.cashAmount)>0&&!linked.has(String(p.paymentId||""))&&String(p.reconcileStatus||"")!=="กระทบยอดแล้ว"&&(!row.paymentChannelId||!p.paymentChannelId||String(row.paymentChannelId)===String(p.paymentChannelId))).map(p=>{const inc=incomeRecordById(p.incomeId)||{};return {...p,customer:inc.customer||"ลูกค้า",invoiceNo:inc.invoiceNo||inc.taxInvoiceNo||inc.receiptNo||"",diff:Math.abs(incomeNum(row.amount)-incomeNum(p.cashAmount))};}).sort((a,b)=>a.diff-b.diff||String(b.receivedDate||"").localeCompare(String(a.receivedDate||""))).slice(0,30);
}
function renderIncomeRecon(){
  const modal=el("incomeReconModal");if(!modal)return;
  const channelSel=el("incomeReconChannel"),current=String(channelSel?.value||"");
  if(channelSel){channelSel.innerHTML=incomeChannelsOptions(current);if(current&&[...channelSel.options].some(o=>o.value===current))channelSel.value=current;else if(!channelSel.value){const first=financeChannels(true)[0];if(first)channelSel.value=first.id;}}
  const rows=incomeReconRows(),summary={suggested:0,reconciled:0,review:0,unmatched:0},channel=String(channelSel?.value||"");
  for(const r of rows){if(r.displayStatus==="แนะนำอัตโนมัติ")summary.suggested++;if(r.displayStatus==="กระทบยอดแล้ว")summary.reconciled++;if(r.displayStatus==="ต้องตรวจ")summary.review++;if(r.displayStatus==="ไม่พบคู่")summary.unmatched++;}
  const waiting=(INCOME_DATA.payments||[]).filter(p=>incomeNum(p.cashAmount)>0&&String(p.reconcileStatus||"")!=="กระทบยอดแล้ว"&&(!channel||!p.paymentChannelId||String(p.paymentChannelId)===channel));
  if(el("incomeReconKRows"))el("incomeReconKRows").textContent=rows.length.toLocaleString("th-TH");
  if(el("incomeReconKSuggest"))el("incomeReconKSuggest").textContent=summary.suggested.toLocaleString("th-TH");
  if(el("incomeReconKDone"))el("incomeReconKDone").textContent=summary.reconciled.toLocaleString("th-TH");
  if(el("incomeReconKWaiting"))el("incomeReconKWaiting").textContent=waiting.length.toLocaleString("th-TH");
  if(el("incomeReconConfirmAll"))el("incomeReconConfirmAll").disabled=!summary.suggested;
  const list=el("incomeReconList");if(!list)return;
  if(!rows.length){list.innerHTML='<div class="income-empty">ยังไม่มี Statement เงินเข้าของบัญชีนี้<br><small>เลือกบัญชี แล้วกด “เลือก Statement” เพื่อเริ่มกระทบยอด</small></div>';return;}
  list.innerHTML=rows.map(row=>{
    const meta=incomeReconStateMeta(row.displayStatus),best=row.suggestion?.best||null,linked=Array.isArray(row.linkedPayments)?row.linkedPayments:[],manual=incomeUnreconciledPayments(row);
    let matchHtml="";
    if(row.displayStatus==="กระทบยอดแล้ว"){
      const label=linked.length?linked.map(p=>`${p.customer||"ลูกค้า"}${p.invoiceNo?` · ${p.invoiceNo}`:""}`).join(" + "):"รายการรับชำระ";
      matchHtml=`<strong>${esc(label)}</strong><small>${linked.length} รายการรับชำระ · เงินเข้ารวม ${baht(linked.reduce((a,p)=>a+incomeNum(p.cashAmount),0))}</small>`;
    }else if(best){
      matchHtml=`<strong>${esc(incomeReconCandidateLabel(best))}</strong><small>เงินเข้าที่บันทึก ${baht(best.cashAmount)} · วันที่ ${incomeDateLabel(best.receivedDate)}${best.whtAmount?` · WHT ${baht(best.whtAmount)}`:""}</small>`;
    }else matchHtml='<strong>ยังไม่พบคู่ที่ยอดตรง</strong><small>เลือกจากรายการรับชำระด้านล่างได้</small>';
    const manualOptions=manual.map(p=>`<option value="${escAttr(p.paymentId)}">${esc(p.customer)}${p.invoiceNo?` · ${esc(p.invoiceNo)}`:""} · ${baht(p.cashAmount)} · ${incomeDateLabel(p.receivedDate)}${p.diff>.01?` · ต่าง ${baht(p.diff)}`:""}</option>`).join("");
    const action=row.displayStatus==="กระทบยอดแล้ว"?`<button class="btn small" type="button" onclick="unlinkIncomeRecon('${escAttr(row.id)}')">ยกเลิกจับคู่</button>`:`${best?`<button class="btn small solid" type="button" onclick="confirmIncomeRecon('${escAttr(row.id)}','${escAttr((best.paymentIds||[best.paymentId]).join(','))}',false)">ยืนยันคู่</button>`:""}<button class="btn small" type="button" onclick="ignoreIncomeRecon('${escAttr(row.id)}')">ข้าม</button>`;
    return `<div class="income-recon-row"><div class="income-recon-bank"><span class="income-recon-state ${meta.cls}">${esc(meta.label)}</span><strong class="income-recon-amount">${baht(row.amount)}</strong><small>${incomeDateLabel(row.transactionDate)} · ${esc(row.description||"ไม่ระบุรายละเอียด")}${row.reference?`<br>อ้างอิง ${esc(row.reference)}`:""}${row.sourceFile?` · ${esc(row.sourceFile)}`:""}</small></div><div class="income-recon-match">${matchHtml}${row.displayStatus!=="กระทบยอดแล้ว"&&manualOptions?`<div class="income-recon-manual"><select id="incomeReconPick_${escAttr(row.id)}"><option value="">เลือกจับคู่เอง…</option>${manualOptions}</select><button class="btn small" type="button" onclick="confirmIncomeReconManual('${escAttr(row.id)}')">จับคู่</button></div>`:""}</div><div class="income-recon-actions">${action}</div></div>`;
  }).join("");
}
async function openIncomeRecon(){
  if(!financeChannels(true).length)return alert("ยังไม่มีช่องทางการเงิน กรุณาเพิ่มบัญชีธนาคาร/ช่องทางรับเงินในตั้งค่าก่อน");
  if(!(INCOME_DATA.reconciliation||[]).length)await refreshIncome({quiet:true,withReconciliation:true});
  const modal=el("incomeReconModal");if(!modal)return;modal.classList.add("show");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";renderIncomeRecon();
}
function closeIncomeRecon(){const modal=el("incomeReconModal");if(!modal)return;modal.classList.remove("show");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";INCOME_DATA.reconciliation=[];INCOME_DATA.reconciliationSummary={};if(el("incomeReconList"))el("incomeReconList").replaceChildren();}
function findIncomeStatementColumns(rows){
  const aliases={date:["วันที่","date","transactiondate","postingdate","valuedate","วันทำรายการ"],debit:["ถอน","เงินออก","debit","debitamount","withdrawal","จ่ายออก"],credit:["ฝาก","เงินเข้า","credit","creditamount","deposit","รับเงิน"],amount:["จำนวนเงิน","amount","ยอดเงิน","transactionamount"],description:["รายการ","รายละเอียด","description","particulars","memo","narrative","transactiondetail"],reference:["เลขอ้างอิง","อ้างอิง","reference","referenceno","ref","transactionid"],type:["ประเภท","type","direction","transactiontype","drcr"]};
  let best=null;for(let r=0;r<Math.min(rows.length,30);r++){const hdr=(rows[r]||[]).map(normalizeStatementHeader),cols={};let score=0;for(const [key,names] of Object.entries(aliases)){const idx=hdr.findIndex(h=>names.some(n=>h===n||h.includes(n)));if(idx>=0){cols[key]=idx;score++;}}if(cols.date>=0&&(cols.credit>=0||cols.amount>=0)&&score>(best?.score||0))best={row:r,cols,score};}return best;
}
function normalizeIncomingStatementRows(rows){
  const found=findIncomeStatementColumns(rows);if(!found)throw new Error("หาแถวหัวตารางไม่เจอ ต้องมีคอลัมน์วันที่และเงินเข้า/ฝาก/Credit");const out=[];
  for(let i=found.row+1;i<rows.length;i++){const cells=rows[i]||[],date=statementDateValue(cells[found.cols.date]);if(!date)continue;const debit=found.cols.debit>=0?Math.abs(statementNumber(cells[found.cols.debit])):0,credit=found.cols.credit>=0?Math.abs(statementNumber(cells[found.cols.credit])):0,generic=found.cols.amount>=0?statementNumber(cells[found.cols.amount]):0,type=found.cols.type>=0?String(cells[found.cols.type]||""):"";if(debit>0&&!credit)continue;let amount=credit;if(!amount&&generic){if(/เงินเข้า|credit|deposit|รับเงิน|\bcr\b/i.test(type))amount=Math.abs(generic);else if(/เงินออก|debit|withdraw|จ่ายออก|\bdr\b/i.test(type))continue;else if(generic>0)amount=generic;}if(!(amount>0))continue;out.push({transactionDate:date,amount,direction:"เงินเข้า",description:found.cols.description>=0?String(cells[found.cols.description]||"").trim():"",reference:found.cols.reference>=0?String(cells[found.cols.reference]||"").trim():"",raw:{row:i+1,values:cells.map(v=>v instanceof Date?v.toISOString():v)}});}return out;
}
async function parseIncomingStatementFile(file){
  const ext=String(file.name||"").split(".").pop().toLowerCase();let rows;if(ext==="csv"||file.type.includes("csv"))rows=parseCsvRows(await file.text());else{const XLSX=await ensureXlsx();const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]];rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:""});}return normalizeIncomingStatementRows(rows);
}
async function incomeReconPost(path,payload){const res=await fetch(apiUrl(path),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload||{})}),data=await res.json().catch(()=>({}));if(!res.ok||data.ok!==true)throw new Error(data.message||data.error||data.reason||`HTTP ${res.status}`);return data;}
async function importIncomeStatementFile(file){
  if(!file)return;const channel=String(el("incomeReconChannel")?.value||"");if(!channel){alert("เลือกบัญชี/ช่องทางรับเงินก่อน");el("incomeReconFile").value="";return;}
  try{const rows=await parseIncomingStatementFile(file);if(!rows.length)throw new Error("ไม่พบรายการเงินเข้าในไฟล์นี้");const total=rows.reduce((s,r)=>s+incomeNum(r.amount),0);if(!confirm(`พบเงินเข้า ${rows.length} รายการ รวม ${baht(total)}\n\nนำเข้าเพื่อกระทบยอดกับรายการรับชำระไหม?`))return;const out=await incomeReconPost("/api/income-reconciliation-import",{fileName:file.name,paymentChannelId:channel,rows});await refreshIncome({quiet:true,withReconciliation:true});renderIncomeRecon();alert(`นำเข้าแล้ว ${out.imported||0} รายการ${out.skippedDuplicate?`\nข้ามรายการซ้ำ ${out.skippedDuplicate}`:""}${out.skippedInvalid?`\nข้ามข้อมูลไม่ครบ ${out.skippedInvalid}`:""}`);}catch(err){alert("นำเข้า Statement เงินเข้าไม่สำเร็จ: "+err.message);}finally{el("incomeReconFile").value="";}
}
async function confirmIncomeRecon(rowId,paymentIdsCsv,force=false){
  const ids=String(paymentIdsCsv||"").split(",").map(x=>x.trim()).filter(Boolean);if(!ids.length)return;const row=(INCOME_DATA.reconciliation||[]).find(r=>String(r.id)===String(rowId));const ps=ids.map(id=>(INCOME_DATA.payments||[]).find(p=>String(p.paymentId)===id)).filter(Boolean);const total=ps.reduce((a,p)=>a+incomeNum(p.cashAmount),0);if(row&&Math.abs(incomeNum(row.amount)-total)>.01&&!force){if(!confirm(`ยอด Statement ${baht(row.amount)} ไม่เท่ากับยอดรับชำระ ${baht(total)}\nยืนยันจับคู่แบบ manual ใช่ไหม?`))return;force=true;}
  try{await incomeReconPost("/api/income-reconciliation-confirm",{pairs:[{reconciliationId:rowId,paymentIds:ids}],force,matchedBy:"Dashboard"});await refreshIncome({quiet:true,withReconciliation:true});renderIncomeRecon();}catch(err){alert("กระทบยอดไม่สำเร็จ: "+err.message);}
}
function confirmIncomeReconManual(rowId){const sel=el(`incomeReconPick_${rowId}`);if(!sel?.value)return alert("เลือกรายการรับชำระก่อน");confirmIncomeRecon(rowId,sel.value,false);}
async function confirmIncomeReconSuggestedAll(){
  const pairs=incomeReconRows().filter(r=>r.displayStatus==="แนะนำอัตโนมัติ"&&r.suggestion?.best).map(r=>({reconciliationId:r.id,paymentIds:r.suggestion.best.paymentIds||[r.suggestion.best.paymentId],score:r.suggestion.best.score}));if(!pairs.length)return alert("ไม่มีรายการที่ระบบมั่นใจพอให้ยืนยัน");if(!confirm(`ยืนยันกระทบยอดเงินเข้า ${pairs.length} รายการที่ระบบแนะนำ?`))return;try{const out=await incomeReconPost("/api/income-reconciliation-confirm",{pairs,matchedBy:"Dashboard"});await refreshIncome({quiet:true,withReconciliation:true});renderIncomeRecon();alert(`กระทบยอดสำเร็จ ${out.confirmed||pairs.length} รายการ`);}catch(err){alert("ยืนยันไม่สำเร็จ: "+err.message);}
}
async function ignoreIncomeRecon(id){if(!confirm("ข้ามรายการเงินเข้านี้จากการกระทบยอด?"))return;try{await incomeReconPost("/api/income-reconciliation-ignore",{reconciliationId:id});await refreshIncome({quiet:true,withReconciliation:true});renderIncomeRecon();}catch(err){alert(err.message||"ข้ามรายการไม่สำเร็จ");}}
async function unlinkIncomeRecon(id){if(!confirm("ยกเลิกการจับคู่รายการเงินเข้านี้?"))return;try{await incomeReconPost("/api/income-reconciliation-unlink",{reconciliationId:id});await refreshIncome({quiet:true,withReconciliation:true});renderIncomeRecon();}catch(err){alert(err.message||"ยกเลิกการจับคู่ไม่สำเร็จ");}}

function bindIncomeUi(){
  el("incomeCreate")?.addEventListener("click",openIncomeEditor);el("incomeRefresh")?.addEventListener("click",()=>refreshIncome());el("incomeReconBtn")?.addEventListener("click",openIncomeRecon);el("incomeForm")?.addEventListener("submit",saveIncome);el("incomePaymentForm")?.addEventListener("submit",saveIncomePayment);
  ["incAmount","incPriceMode","incVatRate","incExpectedWht"].forEach(id=>el(id)?.addEventListener("input",()=>{incomeCalcPreview();if(el("incPaidNow")?.checked)toggleIncomePaidNow();}));el("incPaidNow")?.addEventListener("change",toggleIncomePaidNow);["incomePayCash","incomePayWht"].forEach(id=>el(id)?.addEventListener("input",incomePaymentPreview));
  document.querySelectorAll("[data-income-close]").forEach(b=>b.addEventListener("click",()=>{const mode=b.dataset.incomeClose;if(mode==="payment")closeIncomePayment();else if(mode==="recon")closeIncomeRecon();else closeIncomeEditor();}));
  ["incomeQ","incomeStatus","incomeCategory","incomeMonth"].forEach(id=>{el(id)?.addEventListener(id==="incomeQ"?"input":"change",()=>{INCOME_PAGE=1;renderIncome();});});el("incomeCsv")?.addEventListener("click",exportIncomeCsv);el("incomeVatCsv")?.addEventListener("click",exportIncomeVatCsv);
  el("incomeReconChannel")?.addEventListener("change",renderIncomeRecon);el("incomeReconFile")?.addEventListener("change",e=>importIncomeStatementFile(e.target.files?.[0]));el("incomeReconConfirmAll")?.addEventListener("click",confirmIncomeReconSuggestedAll);
  ["incomeEditor","incomePaymentModal","incomeReconModal"].forEach(id=>el(id)?.addEventListener("click",e=>{if(e.target!==e.currentTarget)return;if(id==="incomeEditor")closeIncomeEditor();else if(id==="incomePaymentModal")closeIncomePayment();else closeIncomeRecon();}));
}
bindIncomeUi();


/* ---------- REALTIME LOAD ---------- */
function fatal(icon,msg){
  // ใช้เฉพาะกรณีเปิดมาด้วย URL ที่ใช้งานไม่ได้จริง ๆ เช่นไม่มี tenant/token
  if(REFRESH_TIMER) clearInterval(REFRESH_TIMER);
  document.body.innerHTML='<div class="fatal"><span class="ic">'+icon+'</span>'+msg+'</div>';
}

function ensureNetworkBanner(){
  let box=el("networkRecoveryBanner");
  if(box)return box;
  const main=document.querySelector(".main");
  if(!main)return null;
  box=document.createElement("div");
  box.id="networkRecoveryBanner";
  box.className="network-recovery-banner";
  box.hidden=true;
  box.innerHTML=`<span class="network-recovery-dot" aria-hidden="true"></span><div class="network-recovery-copy"><strong id="networkRecoveryTitle">กำลังเชื่อมต่อ…</strong><small id="networkRecoveryDetail">กำลังโหลดข้อมูลล่าสุด</small></div><button type="button" id="networkRecoveryRetry">ลองใหม่</button>`;
  main.prepend(box);
  box.querySelector("#networkRecoveryRetry")?.addEventListener("click",()=>{
    if(DASH_AUTH_BLOCKED){location.reload();return;}
    clearDashboardRetry();
    refreshData({manual:true});
  });
  return box;
}
function showNetworkBanner(mode,title,detail,retryLabel="ลองใหม่"){
  const box=ensureNetworkBanner();if(!box)return;
  box.hidden=false;box.dataset.mode=mode||"warn";
  const t=el("networkRecoveryTitle"),d=el("networkRecoveryDetail"),b=el("networkRecoveryRetry");
  if(t)t.textContent=title||"เชื่อมต่อไม่สำเร็จ";if(d)d.textContent=detail||"ระบบจะลองใหม่ให้อัตโนมัติ";if(b)b.textContent=retryLabel;
}
function hideNetworkBanner(){const box=el("networkRecoveryBanner");if(box)box.hidden=true;}
function clearDashboardRetry(){if(DASH_RETRY_TIMER){clearTimeout(DASH_RETRY_TIMER);DASH_RETRY_TIMER=null;}}
function scheduleDashboardRetry(){
  if(DASH_AUTH_BLOCKED||document.hidden)return;
  clearDashboardRetry();
  const waits=[2500,5000,10000,20000,30000,60000];
  const wait=waits[Math.min(Math.max(DASH_FAILURE_COUNT-1,0),waits.length-1)];
  DASH_RETRY_TIMER=setTimeout(()=>{DASH_RETRY_TIMER=null;refreshData({manual:false});},wait);
}
function saveDashboardCache(rows){
  try{
    const safe=(Array.isArray(rows)?rows:[]).slice(0,DASH_CACHE_MAX_ROWS);
    const payload=JSON.stringify({savedAt:Date.now(),rows:safe});
    if(payload.length<=DASH_CACHE_MAX_BYTES)sessionStorage.setItem(DASH_CACHE_KEY,payload);
  }catch(err){console.debug("dashboard cache skipped",err);}
}
function loadDashboardCache(){
  try{
    const raw=sessionStorage.getItem(DASH_CACHE_KEY);if(!raw)return null;
    const parsed=JSON.parse(raw);if(!Array.isArray(parsed?.rows))return null;
    return {savedAt:Number(parsed.savedAt)||0,rows:cleanRows(parsed.rows)};
  }catch{return null;}
}
function cachedAgeLabel(savedAt){
  if(!savedAt)return "ข้อมูลที่บันทึกไว้ล่าสุด";
  const mins=Math.max(0,Math.round((Date.now()-savedAt)/60000));
  if(mins<1)return "ข้อมูลล่าสุดเมื่อสักครู่";if(mins<60)return `ข้อมูลล่าสุดประมาณ ${mins} นาทีที่แล้ว`;
  const hours=Math.round(mins/60);if(hours<24)return `ข้อมูลล่าสุดประมาณ ${hours} ชั่วโมงที่แล้ว`;
  return `ข้อมูลล่าสุด ${new Date(savedAt).toLocaleDateString("th-TH")}`;
}
function recoverDashboardShell(reason="network"){
  if(HAS_LOADED)return false;
  const cached=loadDashboardCache();
  if(cached?.rows?.length){
    ALL=cached.rows;LAST_SIGNATURE=rowsSignature(ALL);CONNECTED=false;HAS_LOADED=true;drawAll();
    showNetworkBanner("warn","อัปเดตข้อมูลไม่ได้",`${cachedAgeLabel(cached.savedAt)} · ระบบกำลังลองเชื่อมต่อใหม่`);
    return true;
  }
  ALL=[];CONNECTED=false;HAS_LOADED=true;
  try{drawAll();}catch(err){console.debug("empty dashboard render skipped",err);}
  showNetworkBanner("warn",reason==="offline"?"ตอนนี้ออฟไลน์":"กำลังเชื่อมต่อระบบ",reason==="offline"?"ยังใช้งานหน้าเดิมได้ และระบบจะอัปเดตทันทีเมื่ออินเทอร์เน็ตกลับมา":"ยังโหลดข้อมูลล่าสุดไม่ได้ ระบบจะลองใหม่ให้อัตโนมัติ");
  return true;
}

function syncStatus(mode,text){
  const box=el("syncState"), btn=el("syncBtn"), txt=el("syncText");
  if(!box||!txt) return;
  box.classList.remove("ok","syncing","error");
  box.classList.add(mode);
  txt.textContent=text;
  if(btn) btn.disabled=mode==="syncing";
}

function clockTime(d=new Date()){
  return d.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}

function cleanRows(rows){
  return rows.filter(r=>r&&(r.date||r.amount||r.vendor));
}

function rowsSignature(rows){
  let h=2166136261>>>0;
  const feed=s=>{s=String(s??"");for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}h^=31;h=Math.imul(h,16777619)>>>0;};
  const keys=["id","dateISO","date","amount","vendor","category","note","sender","payerName","status","img","claimPdfUrl","receiptPdfUrl","duplicateStatus","createdAt"];
  feed(rows.length);
  for(const row of rows)for(const key of keys)feed(row?.[key]);
  return `${rows.length}:${h.toString(16)}`;
}

async function refreshData({initial=false,manual=false}={}){
  if(REFRESHING) return false;
  if(!navigator.onLine){
    syncStatus("error","ออฟไลน์ — รอเชื่อมต่อ");
    recoverDashboardShell("offline");
    showNetworkBanner("offline","ตอนนี้ออฟไลน์","ยังดูข้อมูลล่าสุดที่มีอยู่ได้ ระบบจะอัปเดตเองเมื่ออินเทอร์เน็ตกลับมา");
    return false;
  }
  REFRESHING=true;
  syncStatus("syncing",manual?"กำลังอัปเดต…":"กำลังซิงก์…");
  try{
    const u=`${API}?tenant=${encodeURIComponent(TENANT)}&k=${encodeURIComponent(K)}&view=dashboard&_=${Date.now()}`;
    const res=await fetch(u,{method:"GET",cache:"no-store",headers:{"accept":"application/json","cache-control":"no-cache"}});

    if(res.status===401||res.status===403){
      DASH_AUTH_BLOCKED=true;clearDashboardRetry();
      recoverDashboardShell("auth");
      showNetworkBanner("auth","ลิงก์ Dashboard หมดอายุ","ข้อมูลเดิมยังแสดงได้ แต่ต้องเปิด Dashboard จาก LINE ใหม่ก่อนอัปเดตข้อมูล","เปิดใหม่");
      syncStatus("error","ลิงก์หมดอายุ");
      return false;
    }
    if(!res.ok) throw new Error("HTTP "+res.status);

    const rows=await res.json();
    if(!Array.isArray(rows)) throw new Error("invalid response");

    const next=cleanRows(rows);
    const sig=rowsSignature(next);
    const changed=!HAS_LOADED||sig!==LAST_SIGNATURE;
    if(changed){ALL=next;LAST_SIGNATURE=sig;CONNECTED=true;drawAll();}
    else CONNECTED=true;

    HAS_LOADED=true;DASH_FAILURE_COUNT=0;DASH_AUTH_BLOCKED=false;clearDashboardRetry();saveDashboardCache(next);hideNetworkBanner();
    syncStatus("ok",changed?`อัปเดตแล้ว ${clockTime()}`:`ข้อมูลล่าสุด ${clockTime()}`);
    return true;
  }catch(e){
    console.error("dashboard refresh failed",e);
    DASH_FAILURE_COUNT+=1;
    recoverDashboardShell("network");
    const isServer=/HTTP 5\d\d/.test(String(e?.message||""));
    showNetworkBanner("warn",isServer?"ระบบตอบช้ากว่าปกติ":"อัปเดตข้อมูลไม่ได้","ยังใช้งานหน้าที่โหลดไว้ได้ · ระบบกำลังลองใหม่ให้อัตโนมัติ");
    syncStatus("error","เชื่อมต่อไม่สำเร็จ — กำลังลองใหม่");
    scheduleDashboardRetry();
    return false;
  }finally{
    REFRESHING=false;
    const btn=el("syncBtn"); if(btn) btn.disabled=false;
  }
}

function refreshVisiblePage({manual=false}={}){
  if(document.hidden||!HAS_LOADED||DASH_AUTH_BLOCKED)return;
  const now=Date.now();
  if(!manual&&now-LAST_FOREGROUND_REFRESH<FOREGROUND_DEBOUNCE_MS)return;
  LAST_FOREGROUND_REFRESH=now;

  const batchOpen=el("page-batches")?.classList.contains("show");
  const reconciliationOpen=el("page-reconciliation")?.classList.contains("show");
  const incomeOpen=el("page-income")?.classList.contains("show");
  const emailOpen=el("page-email")?.classList.contains("show")||el("page-subscriptions")?.classList.contains("show");
  const billingOpen=el("page-billing")?.classList.contains("show");
  const currentKey=currentPageKey();

  // หน้าเบิกจ่าย/กระทบยอด/รายรับใช้ API ของตัวเอง ไม่ยิง /api/expenses ซ้ำ
  if(batchOpen){
    if(BATCH_SELECTED.size===0&&REVIEW_BATCH_SELECTED.size===0&&TRANSFER_SELECTED.size===0)refreshBatchData({quiet:true});
  }else if(reconciliationOpen){
    refreshReconciliation({quiet:true});
  }else if(incomeOpen){
    refreshIncome({quiet:true,withReconciliation:incomeReconModalOpen()});
  }else{
    refreshData({manual});
  }

  EMAIL_POLL_TICK++;
  if(emailOpen&&(manual||EMAIL_POLL_TICK%4===0))refreshEmailData();
  if(billingOpen&&(manual||EMAIL_POLL_TICK%4===0))refreshSubscription({quiet:true});
}

function startRealtime(){
  if(REFRESH_TIMER) clearInterval(REFRESH_TIMER);
  REFRESH_TIMER=setInterval(()=>refreshVisiblePage(),REFRESH_MS);
}
window.dashboardMemoryReport=function(){
  const heap=performance.memory?{usedMB:Math.round(performance.memory.usedJSHeapSize/1048576),totalMB:Math.round(performance.memory.totalJSHeapSize/1048576),limitMB:Math.round(performance.memory.jsHeapSizeLimit/1048576)}:null;
  return {page:currentPageKey(),heap,domNodes:document.getElementsByTagName("*").length,images:document.images.length,expenses:ALL.length,emailDocs:EMAIL_DOCS.length,batches:(BATCH_DATA.batches||[]).length,reconRows:(RECON_DATA.rows||[]).length,incomeRecords:(INCOME_DATA.records||[]).length,incomePayments:(INCOME_DATA.payments||[]).length};
};
window.dashboardDeepMemoryReport=async function(){
  const base=window.dashboardMemoryReport();
  if(typeof performance.measureUserAgentSpecificMemory!=="function")return {...base,deepMemory:"browser_not_supported"};
  try{const m=await performance.measureUserAgentSpecificMemory();return {...base,userAgentSpecificMB:Math.round((m.bytes||0)/1048576),breakdown:m.breakdown||[]};}
  catch(err){return {...base,deepMemory:"unavailable",error:String(err?.message||err)};}
};
window.addEventListener("pagehide",()=>{clearDashboardRetry();if(REFRESH_TIMER){clearInterval(REFRESH_TIMER);REFRESH_TIMER=null;}if(BUSINESS_PAIR_POLL){clearInterval(BUSINESS_PAIR_POLL);BUSINESS_PAIR_POLL=null;}releaseImageNodes(document);ALL=[];EMAIL_DOCS=[];SUBSCRIPTIONS=[];BATCH_DATA={pending:{groups:[],itemCount:0,total:0,urgentCount:0,people:0},batches:[],settings:{}};RECON_DATA={rows:[],paidBatches:[],summary:{}};INCOME_DATA={ok:true,records:[],payments:[],reconciliation:[],reconciliationSummary:{},summary:{},categories:[]};});

async function load(){
  if(!TENANT||!K){
    fatal("⚠️","<b>ลิงก์ไม่สมบูรณ์</b><br><br>กรุณาเปิดแดชบอร์ดจากปุ่มในแชท LINE<br>หรือพิมพ์ <b>แดชบอร์ด</b> ในกลุ่มเพื่อขอลิงก์ใหม่");
    return;
  }
  const target=el("page-"+ROUTE_PAGE)?ROUTE_PAGE:"overview";
  const source=document.querySelector(`[data-p="${target}"]`);
  if(target==="business")openBusiness(ROUTE_BIZ,document.querySelector(`[data-biz="${ROUTE_BIZ}"]`),{soft:true,bypassSetup:true});
  else openPage(target,source,{soft:true,skipFetch:true,bypassSetup:true});

  const [settingsOk]=await Promise.all([
    refreshSettings(),
    refreshBusinesses({quiet:true}),
    refreshWorkspaceLinks(),
    refreshGmailConnectionStatus({retries:1}),
    (target==="billing"||target==="overview")?refreshSubscription({quiet:true}):Promise.resolve(true),
  ]);
  CONNECTED=Boolean(settingsOk);

  let primaryOk=true;
  if(EXPENSE_DATA_PAGES.has(target)){
    primaryOk=await refreshData({initial:true});
  }else{
    HAS_LOADED=true;syncStatus("ok",`พร้อมใช้งาน ${clockTime()}`);
    if(target==="batches")primaryOk=await refreshBatchData({quiet:true});
    else if(target==="reconciliation")primaryOk=await refreshReconciliation({quiet:true});
    else if(target==="income")primaryOk=await refreshIncome({quiet:true,withReconciliation:false});
    else if(target==="email"||target==="subscriptions")primaryOk=await refreshEmailData({scope:target});
    else renderLocalPage(target);
  }

  if(QS.get("gmail")==="connected")await confirmGmailOAuthReturn();
  renderOnboarding();applyWorkspaceBranding();renderCompanySetupGate({force:!companySetupState().ready});
  if(target==="email"||target==="subscriptions"){
    const last=Date.parse(EMAIL_INFO.lastSyncAt||"");
    if(EMAIL_INFO.connected&&(!Number.isFinite(last)||Date.now()-last>10*60*1000))syncGmail({manual:false});
  }
  ROUTE_BOOTSTRAPPING=false;
  // แม้ API รอบแรกพลาด หน้าเว็บยังคงอยู่และ retry ต่อเบื้องหลัง
  if(HAS_LOADED)startRealtime();
  if(primaryOk===false&&!DASH_AUTH_BLOCKED)scheduleDashboardRetry();
}

el("syncBtn").addEventListener("click",async()=>{const reconOpen=el("page-reconciliation")?.classList.contains("show");const incomeOpen=el("page-income")?.classList.contains("show");const batchOpen=el("page-batches")?.classList.contains("show");const billingOpen=el("page-billing")?.classList.contains("show");if(reconOpen)await Promise.all([refreshReconciliation(),refreshSettings(),refreshWorkspaceLinks()]);else if(incomeOpen)await Promise.all([refreshIncome({withReconciliation:incomeReconModalOpen()}),refreshSettings(),refreshWorkspaceLinks()]);else if(batchOpen)await Promise.all([refreshBatchData(),refreshSettings(),refreshWorkspaceLinks()]);else if(billingOpen)await Promise.all([refreshSubscription(),refreshBusinesses(),refreshSettings(),refreshWorkspaceLinks()]);else await Promise.all([refreshData({manual:true}),refreshSettings(),refreshWorkspaceLinks()]);});
document.addEventListener("visibilitychange",()=>{
  if(!document.hidden&&HAS_LOADED){refreshVisiblePage();refreshSettingsIfAssetChanged();}
});
window.addEventListener("focus",()=>{if(HAS_LOADED)refreshVisiblePage();});
window.addEventListener("pageshow",()=>{if(HAS_LOADED)refreshSettingsIfAssetChanged(true);});
window.addEventListener("storage",e=>{if(e.key===SETTINGS_SIGNAL_KEY||e.key===SIGNATURE_READY_KEY){renderOnboarding();refreshSettingsIfAssetChanged(true);}});
window.addEventListener("online",()=>{DASH_FAILURE_COUNT=0;showNetworkBanner("syncing","กลับมาออนไลน์แล้ว","กำลังอัปเดตข้อมูลล่าสุด…");syncStatus("syncing","กลับมาออนไลน์ — กำลังซิงก์…");refreshData({manual:true});refreshSettingsIfAssetChanged(true);});
window.addEventListener("offline",()=>{clearDashboardRetry();recoverDashboardShell("offline");showNetworkBanner("offline","ตอนนี้ออฟไลน์","ยังดูข้อมูลล่าสุดที่มีอยู่ได้ ระบบจะอัปเดตเองเมื่ออินเทอร์เน็ตกลับมา");syncStatus("error","ออฟไลน์ — รอเชื่อมต่อ");});

load();
