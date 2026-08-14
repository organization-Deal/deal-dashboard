import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const indexFile=path.join(root,"index.html");
const headersFile=path.join(root,"_headers");
const MARK="DASHBOARD_CORE_CACHE_FIX_V7_49_20260814";

if(!fs.existsSync(indexFile)) throw new Error("ไม่พบ index.html");
if(!fs.existsSync(headersFile)) throw new Error("ไม่พบ _headers");

let html=fs.readFileSync(indexFile,"utf8");

// บังคับเปลี่ยน cache key ของ core dashboard ทุก client ทันที
html=html.replace(
  /<script src="\.\/assets\/dashboard\.js\?v=[^"]+"><\/script>/,
  `<script src="./assets/dashboard.js?v=7.49.20260814"></script>`
);

if(!html.includes(MARK)){
  html=html.replace("</body>",`<!-- ${MARK} -->
</body>`);
}
fs.writeFileSync(indexFile,html);

let headers=fs.readFileSync(headersFile,"utf8");

// core dashboard เปลี่ยนบ่อยมากระหว่างช่วงพัฒนา ห้าม cache 24 ชั่วโมง
const rule=`/assets/dashboard.js
  Cache-Control: no-cache, no-store, must-revalidate
`;
if(!headers.includes("/assets/dashboard.js\n")){
  headers=headers.trimEnd()+"\n"+rule;
}else{
  headers=headers.replace(
    /\/assets\/dashboard\.js\n(?:[ \t]+[^\n]+\n)*/g,
    rule
  );
}

// index และ patch JS ที่เราแก้บ่อย ควร revalidate เสมอระหว่าง Beta
const betaRule=`/assets/*v7*.js
  Cache-Control: no-cache, must-revalidate
`;
if(!headers.includes("/assets/*v7*.js")){
  headers=headers.trimEnd()+"\n"+betaRule;
}

fs.writeFileSync(headersFile,headers);

console.log("✅ "+MARK+" ready");
console.log("✅ dashboard.js cache key -> v7.49.20260814");
console.log("✅ dashboard.js Cache-Control -> no-store");
