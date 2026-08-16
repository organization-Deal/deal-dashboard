import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const htmlFile=path.join(root,"admin.html");
const jsFile=path.join(root,"assets","admin.js");
const cssFile=path.join(root,"assets","admin.css");
const MARK="ADMIN_PIN_UI_V7_58_20260816";

for(const f of [htmlFile,jsFile,cssFile]){
  if(!fs.existsSync(f))throw new Error("ไม่พบ "+path.relative(root,f));
}

let html=fs.readFileSync(htmlFile,"utf8");
let js=fs.readFileSync(jsFile,"utf8");
let css=fs.readFileSync(cssFile,"utf8");

if(html.includes(MARK)||js.includes(MARK)){
  console.log("ℹ️ "+MARK+" already present");
  process.exit(0);
}

const oldLogin=`    <p>หลังบ้านสำหรับทีมบริษัทเท่านั้น ใส่ ADMIN_KEY เพื่อเข้าใช้งาน</p>
    <input id="adminKeyInput" type="password" autocomplete="current-password" placeholder="ADMIN_KEY" required>
    <button id="loginSubmit" type="submit">เข้าสู่หลังบ้าน</button>
    <div id="loginStatus" class="login-status" role="status" aria-live="polite">พร้อมตรวจสอบ ADMIN_KEY</div>
    <small>Key จะเก็บเฉพาะ Session ของแท็บนี้ ไม่บันทึกถาวรในเครื่อง · Admin UI v7.13.2</small>`;

const newLogin=`    <p>ใส่รหัสหลังบ้าน 6 หลักเพื่อยืนยันตัวตน</p>
    <!-- ${MARK} -->
    <div class="pin-row" id="adminPinInputs" aria-label="รหัสหลังบ้าน 6 หลัก">
      <input class="pin-digit" data-pin-index="0" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="one-time-code" aria-label="หลักที่ 1">
      <input class="pin-digit" data-pin-index="1" inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="หลักที่ 2">
      <input class="pin-digit" data-pin-index="2" inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="หลักที่ 3">
      <input class="pin-digit" data-pin-index="3" inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="หลักที่ 4">
      <input class="pin-digit" data-pin-index="4" inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="หลักที่ 5">
      <input class="pin-digit" data-pin-index="5" inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="หลักที่ 6">
    </div>
    <button id="loginSubmit" type="submit">ยืนยันรหัส</button>
    <div id="loginStatus" class="login-status" role="status" aria-live="polite">กรอกรหัส 6 หลัก</div>
    <small>รหัสใช้เฉพาะตอนเข้าสู่ระบบ จากนั้นใช้ Session ชั่วคราวในแท็บนี้ · ไม่เก็บ PIN ไว้ในเครื่อง</small>`;

if(!html.includes(oldLogin))throw new Error("หา login HTML anchor ไม่เจอ");
html=html.replace(oldLogin,newLogin);
html=html.replace('./assets/admin.css?v=7.13','./assets/admin.css?v=7.58');
html=html.replace("./assets/admin.js?v=7.13.2","./assets/admin.js?v=7.58");
html=html.replace("Admin UI v7.13.1","Admin UI v7.58");

css += `

/* ${MARK} */
.pin-row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:18px 0 12px}
.login-card .pin-digit{width:100%;height:58px;margin:0;padding:0;text-align:center;border:1.5px solid #d2d2d7;border-radius:14px;background:#fff;font-size:25px;font-weight:800;line-height:1;color:#1d1d1f;caret-color:#1d1d1f;transition:border-color .15s,box-shadow .15s,transform .15s}
.login-card .pin-digit:focus{outline:none;border-color:#1d1d1f;box-shadow:0 0 0 3px rgba(29,29,31,.09);transform:translateY(-1px)}
.login-card .pin-digit[aria-invalid="true"]{border-color:#ff3b30;background:#fff8f7}
@media(max-width:480px){.login-card{padding:24px 20px}.pin-row{gap:7px}.login-card .pin-digit{height:52px;border-radius:12px;font-size:22px}}
`;

js=js.replace('const ADMIN_UI_VERSION = "7.13.1";','const ADMIN_UI_VERSION = "7.58";');
js=js.replace('let KEY = sessionStorage.getItem("ops:adminKey") || "";','let KEY = sessionStorage.getItem("ops:adminSession") || ""; // '+MARK);

const oldBusy=`  function setLoginBusy(busy) {
    const btn=$("loginSubmit") || $("loginForm")?.querySelector('button[type="submit"]');
    const input=$("adminKeyInput");
    if(btn){ btn.disabled=busy; btn.textContent=busy?"กำลังตรวจสอบ…":"เข้าสู่หลังบ้าน"; }
    if(input) input.disabled=busy;
  }`;

const newBusy=`  function pinInputs(){return [...document.querySelectorAll(".pin-digit")];}
  function pinValue(){return pinInputs().map(n=>String(n.value||"").replace(/\\D/g,"").slice(0,1)).join("");}
  function clearPin({focus=true,error=false}={}){
    pinInputs().forEach((n,i)=>{n.value="";n.toggleAttribute("aria-invalid",error);if(focus&&i===0)setTimeout(()=>n.focus(),0);});
  }
  function setLoginBusy(busy) {
    const btn=$("loginSubmit") || $("loginForm")?.querySelector('button[type="submit"]');
    if(btn){ btn.disabled=busy; btn.textContent=busy?"กำลังตรวจสอบ…":"ยืนยันรหัส"; }
    pinInputs().forEach(n=>n.disabled=busy);
  }`;

if(!js.includes(oldBusy))throw new Error("หา setLoginBusy anchor ไม่เจอ");
js=js.replace(oldBusy,newBusy);

js=js.replace(
`    if(/ADMIN_KEY|unauthorized|401/i.test(raw)) return "ADMIN_KEY ไม่ถูกต้อง · ตรวจค่าที่ตั้งไว้ใน Cloudflare Variables and Secrets แล้วลองใหม่";`,
`    if(/invalid_pin/i.test(raw)) return "รหัส 6 หลักไม่ถูกต้อง";
    if(/too_many_attempts|429/i.test(raw)) return "ลองรหัสผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่";
    if(/admin_pin_not_configured/i.test(raw)) return "ยังไม่ได้ตั้ง ADMIN_PIN 6 หลักใน Cloudflare Variables and Secrets";
    if(/session_expired|unauthorized|401/i.test(raw)) return "Session หมดอายุ กรุณาใส่รหัส 6 หลักอีกครั้ง";`
);

const oldApiUrl='  function apiUrl(path, params={}) { const u=new URL(API+path); u.searchParams.set("key",KEY); Object.entries(params).forEach(([k,v])=>v!==undefined&&v!==null&&u.searchParams.set(k,String(v))); return u.toString(); }';
const newApiUrl='  function apiUrl(path, params={}) { const u=new URL(API+path); Object.entries(params).forEach(([k,v])=>v!==undefined&&v!==null&&u.searchParams.set(k,String(v))); return u.toString(); }';
if(!js.includes(oldApiUrl))throw new Error("หา apiUrl anchor ไม่เจอ");
js=js.replace(oldApiUrl,newApiUrl);

const oldFetch='res = await fetch(apiUrl(path,params), { ...opts, signal:opts.signal||controller.signal, headers:{"content-type":"application/json",...(opts.headers||{})} });';
const newFetch='res = await fetch(apiUrl(path,params), { ...opts, signal:opts.signal||controller.signal, headers:{"content-type":"application/json",...(KEY?{"authorization":`Bearer ${KEY}`}:{ }),...(opts.headers||{})} });';
if(!js.includes(oldFetch))throw new Error("หา api fetch anchor ไม่เจอ");
js=js.replace(oldFetch,newFetch);

js=js.replace(
'    if(res.status===401) throw new Error("ADMIN_KEY ไม่ถูกต้อง");',
'    if(res.status===401) throw new Error(data.error==="invalid_pin"?"invalid_pin":(path==="/admin/ops/login"?"invalid_pin":"session_expired"));\\n    if(res.status===429) throw new Error("too_many_attempts");'
);

const oldLogout='  function logout(show=true) { sessionStorage.removeItem("ops:adminKey"); KEY=""; $("opsShell").hidden=true; $("loginGate").hidden=false; setLoginBusy(false); setLoginStatus("พร้อมตรวจสอบ ADMIN_KEY", "info"); if(show) toast("ออกจากหลังบ้านแล้ว"); }';
const newLogout=`  function logout(show=true) {
    const oldSession=KEY;
    if(oldSession){
      fetch(API+"/admin/ops/logout",{method:"POST",headers:{"content-type":"application/json","authorization":\`Bearer \${oldSession}\`}}).catch(()=>{});
    }
    sessionStorage.removeItem("ops:adminSession"); KEY="";
    $("opsShell").hidden=true; $("loginGate").hidden=false; setLoginBusy(false);
    setLoginStatus("กรอกรหัส 6 หลัก", "info"); clearPin({focus:true});
    if(show) toast("ออกจากหลังบ้านแล้ว");
  }`;
if(!js.includes(oldLogout))throw new Error("หา logout anchor ไม่เจอ");
js=js.replace(oldLogout,newLogout);

const oldValidate=`  async function validateKey() {
    if (!KEY) return;
    setLoginBusy(true); setLoginStatus("กำลังตรวจสอบ Session เดิม…", "loading");
    try { await api("/admin/ops/overview"); loginSuccess(); }
    catch(e) { sessionStorage.removeItem("ops:adminKey"); KEY=""; $("adminKeyInput").value=""; setLoginStatus(friendlyLoginError(e),"error"); }
    finally { setLoginBusy(false); }
  }`;
const newValidate=`  async function validateKey() {
    if (!KEY) return;
    setLoginBusy(true); setLoginStatus("กำลังตรวจสอบ Session เดิม…", "loading");
    try { await api("/admin/ops/overview"); loginSuccess(); }
    catch(e) { sessionStorage.removeItem("ops:adminSession"); KEY=""; setLoginStatus(friendlyLoginError(e),"error"); clearPin({focus:true}); }
    finally { setLoginBusy(false); }
  }`;
if(!js.includes(oldValidate))throw new Error("หา validateKey anchor ไม่เจอ");
js=js.replace(oldValidate,newValidate);

const loginStart=js.indexOf('  $("loginForm").addEventListener("submit", async e=>{');
const loginEnd=js.indexOf('  $("logoutBtn").addEventListener("click",()=>logout());',loginStart);
if(loginStart<0||loginEnd<0)throw new Error("หา login submit block ไม่เจอ");

const newLoginJs=`  async function submitPin(){
    const candidate=pinValue();
    if(candidate.length!==6){
      setLoginStatus("กรอกรหัสให้ครบ 6 หลัก","error");
      pinInputs().find(n=>!n.value)?.focus();
      return;
    }
    setLoginBusy(true);
    setLoginStatus("กำลังตรวจสอบรหัส…","loading");
    try{
      const out=await api("/admin/ops/login",{method:"POST",body:JSON.stringify({pin:candidate})});
      if(!out?.session)throw new Error("session_missing");
      KEY=out.session;
      sessionStorage.setItem("ops:adminSession",KEY);
      clearPin({focus:false});
      loginSuccess();
    }catch(err){
      KEY="";
      sessionStorage.removeItem("ops:adminSession");
      clearPin({focus:true,error:true});
      setLoginStatus(friendlyLoginError(err),"error");
      toast(friendlyLoginError(err));
    }finally{setLoginBusy(false);}
  }

  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();await submitPin();});

  pinInputs().forEach((input,index,all)=>{
    input.addEventListener("input",()=>{
      input.value=String(input.value||"").replace(/\\D/g,"").slice(-1);
      input.removeAttribute("aria-invalid");
      if(input.value&&index<all.length-1)all[index+1].focus();
      if(pinValue().length===6)setTimeout(()=>submitPin(),40);
    });
    input.addEventListener("keydown",e=>{
      if(e.key==="Backspace"&&!input.value&&index>0){all[index-1].value="";all[index-1].focus();}
      if(e.key==="ArrowLeft"&&index>0)all[index-1].focus();
      if(e.key==="ArrowRight"&&index<all.length-1)all[index+1].focus();
    });
    input.addEventListener("paste",e=>{
      const digits=(e.clipboardData?.getData("text")||"").replace(/\\D/g,"").slice(0,6);
      if(!digits)return;
      e.preventDefault();
      digits.split("").forEach((d,i)=>{if(all[i])all[i].value=d;});
      (all[Math.min(digits.length,6)-1]||all[0]).focus();
      if(digits.length===6)setTimeout(()=>submitPin(),40);
    });
  });

`;
js=js.slice(0,loginStart)+newLoginJs+js.slice(loginEnd);

const oldQuery='  const q=new URLSearchParams(location.search); if(q.get("key")){KEY=q.get("key");sessionStorage.setItem("ops:adminKey",KEY);q.delete("key");history.replaceState(null,"",location.pathname+(q.toString()?`?${q}`:""));}';
const newQuery='  const q=new URLSearchParams(location.search); if(q.has("key")){q.delete("key");history.replaceState(null,"",location.pathname+(q.toString()?`?${q}`:""));}';
if(!js.includes(oldQuery))throw new Error("หา legacy key query anchor ไม่เจอ");
js=js.replace(oldQuery,newQuery);

js=js.replace(
'  if(KEY) validateKey(); else { $("loginGate").hidden=false; setLoginStatus("พร้อมตรวจสอบ ADMIN_KEY", "info"); }',
'  if(KEY) validateKey(); else { $("loginGate").hidden=false; setLoginStatus("กรอกรหัส 6 หลัก", "info"); clearPin({focus:true}); }'
);

fs.writeFileSync(htmlFile,html);
fs.writeFileSync(jsFile,js);
fs.writeFileSync(cssFile,css);

execFileSync(process.execPath,["--check",jsFile],{stdio:"inherit"});
for(const [name,text,required] of [
  ["admin.html",html,MARK],
  ["admin.js",js,"ops:adminSession"],
  ["admin.css",css,".pin-row"],
]){
  if(!text.includes(required))throw new Error(name+" patch ไม่ครบ");
}

console.log("✅ "+MARK+" ready");
console.log("✅ 6-box PIN UI enabled");
console.log("✅ PIN is never stored in browser storage");
console.log("✅ temporary admin session stored only in sessionStorage");
console.log("✅ paste / auto-advance / backspace UX enabled");
