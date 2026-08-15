import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const file=path.join(root,"assets","dashboard.js");
const MARK="GMAIL_RETURN_OVERVIEW_V7_55_20260815";

if(!fs.existsSync(file)) throw new Error("ไม่พบ assets/dashboard.js");
let src=fs.readFileSync(file,"utf8");

if(src.includes(MARK)){
  console.log("ℹ️ "+MARK+" already present");
  process.exit(0);
}

const oldBlock=`  if(connected){
    COMPANY_SETUP_ACTIVE="";
    renderCompanySetupGate({force:!companySetupState().ready});
    const next=new URL(location.href);
    next.searchParams.delete("gmail");
    history.replaceState(null,"",next.pathname+next.search+next.hash);
  }else{`;

const newBlock=`  if(connected){
    COMPANY_SETUP_ACTIVE="";
    renderCompanySetupGate({force:!companySetupState().ready});
    const next=new URL(location.href);
    next.searchParams.delete("gmail");
    // ${MARK}
    // Gmail OAuth is finished: return the owner to the financial overview.
    // Do not leave ?page=email stuck in the URL forever after OAuth callback.
    next.searchParams.set("page","overview");
    next.searchParams.delete("biz");
    history.replaceState(null,"",next.pathname+next.search+next.hash);
    openPage("overview",document.querySelector('[data-p="overview"]'),{soft:true,skipFetch:true,bypassSetup:true});
  }else{`;

if(!src.includes(oldBlock)){
  throw new Error("หา confirmGmailOAuthReturn anchor ไม่เจอ — หยุดก่อนเพื่อไม่แก้ผิดเวอร์ชัน");
}

src=src.replace(oldBlock,newBlock);

fs.writeFileSync(file,src);
execFileSync(process.execPath,["--check",file],{stdio:"inherit"});
console.log("✅ "+MARK+" ready");
console.log("✅ Gmail OAuth callback now returns to page=overview");
console.log("✅ normal manual page refresh behavior remains unchanged");
