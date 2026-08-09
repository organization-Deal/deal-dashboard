(() => {
  "use strict";
  const API = "https://accoutingsuppor02.organization-23c.workers.dev";
  const $ = (id) => document.getElementById(id);
  let KEY = sessionStorage.getItem("ops:adminKey") || "";
  let PAGE = "overview";
  let OVERVIEW = null, CUSTOMERS = [], PILOTS = [], ERRORS = [], AUDIT = [];

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const fmtDate = (v, time = false) => { const d = new Date(v || ""); if (!Number.isFinite(d.getTime())) return "—"; return d.toLocaleString("th-TH", { timeZone:"Asia/Bangkok", year:"numeric", month:"short", day:"numeric", ...(time?{hour:"2-digit",minute:"2-digit"}:{}) }); };
  const money = (v) => Number(v || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });
  const planLabel = (s={}) => s.betaActive ? "Trial Business" : s.status === "active" ? (s.planName || s.effectivePlan || "Paid") : s.status === "not_started" ? "ยังไม่เริ่ม" : "Free";
  const attentionLabel = (r={}) => r.attention === "critical" ? "ต้องแก้ด่วน" : r.attention === "warning" ? "ควรดู" : "ปกติ";
  const statusPill = (text, cls="ok") => `<span class="status-pill ${esc(cls)}">${esc(text)}</span>`;
  const toast = (msg) => { const n=$("toast"); n.textContent=msg; n.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>n.hidden=true,2600); };

  function apiUrl(path, params={}) { const u=new URL(API+path); u.searchParams.set("key",KEY); Object.entries(params).forEach(([k,v])=>v!==undefined&&v!==null&&u.searchParams.set(k,String(v))); return u.toString(); }
  async function api(path, opts={}, params={}) {
    const res = await fetch(apiUrl(path,params), { ...opts, headers:{"content-type":"application/json",...(opts.headers||{})} });
    const data = await res.json().catch(()=>({}));
    if (res.status===401) { logout(false); throw new Error("ADMIN_KEY ไม่ถูกต้อง"); }
    if (!res.ok || data.ok===false) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data;
  }
  async function action(body) { return api("/admin/ops/action", { method:"POST", body:JSON.stringify(body) }); }

  function loginSuccess() { $("loginGate").hidden=true; $("opsShell").hidden=false; loadPage("overview",true); }
  function logout(show=true) { sessionStorage.removeItem("ops:adminKey"); KEY=""; $("opsShell").hidden=true; $("loginGate").hidden=false; if(show) toast("ออกจากหลังบ้านแล้ว"); }

  async function validateKey() {
    if (!KEY) return;
    try { await api("/admin/ops/overview"); loginSuccess(); } catch(e) { $("adminKeyInput").value=""; }
  }

  function setPage(page) {
    PAGE=page;
    document.querySelectorAll(".ops-page").forEach(n=>n.classList.toggle("show",n.id===`page-${page}`));
    document.querySelectorAll(".ops-nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
    const titles={overview:"ภาพรวม",customers:"ลูกค้า",pilot:"Pilot Requests",subscriptions:"Trial & Packages",operations:"Operations",audit:"Audit Log"};
    $("pageTitle").textContent=titles[page]||page;
  }

  function kpi(label,value,sub="") { return `<div class="kpi"><div class="label">${esc(label)}</div><strong>${esc(value)}</strong><small>${esc(sub)}</small></div>`; }
  function healthCard(name, data={}) {
    const st=data.status||"ok"; let detail="";
    if(name==="Cron") detail=data.lastRunAt?`ล่าสุด ${fmtDate(data.lastRunAt,true)}`:"ยังไม่มี heartbeat";
    if(name==="Google") detail=`${data.connected||0}/${data.total||0} บริษัท`;
    if(name==="Gmail") detail=`เชื่อม ${data.connected||0} · Reconnect ${data.reconnect||0}`;
    if(name==="Errors") detail=`24 ชม. ${data.last24h||0} รายการ`;
    if(name==="OCR") detail=data.configured?`พร้อม · ${data.model||""}`:"ยังไม่ได้ตั้ง Key";
    if(name==="LINE") detail=data.configured?"Webhook/Token พร้อม":"Config ไม่ครบ";
    return `<div class="health ${esc(st)}"><div class="health-top"><b>${esc(name)}</b><span class="dot"></span></div><small>${esc(detail)}</small></div>`;
  }

  function renderOverview() {
    const d=OVERVIEW||{counts:{},health:{},attention:[],pilotLatest:[]}, c=d.counts||{};
    $("overviewKpis").innerHTML=[
      kpi("ลูกค้าทั้งหมด",c.customers||0,`${c.attention||0} ต้องดูแล`),
      kpi("Trial Business",c.trial||0,`${c.trial7||0} หมดใน ≤7 วัน`),
      kpi("Paid",c.paid||0,"แพ็กเกจ Active"),
      kpi("Free",c.free||0,`${c.notStarted||0} ยังไม่เริ่ม Trial`),
      kpi("Pilot รอดำเนินการ",c.pilotPending||0,"รอทีมเปิดสิทธิ์"),
      kpi("Gmail Reconnect",c.gmailReconnect||0,"ควรติดต่อช่วยลูกค้า")
    ].join("");
    const h=d.health||{};
    $("healthGrid").innerHTML=[healthCard("LINE",h.line),healthCard("Google",h.google),healthCard("Gmail",h.gmail),healthCard("OCR",h.ocr),healthCard("Cron",h.cron),healthCard("Errors",h.errors)].join("");
    $("attentionList").innerHTML=d.attention?.length?d.attention.map(r=>`<div class="mini-row" data-open-customer="${esc(r.rootTenant)}"><div class="mini-main"><b>${esc(r.companyName)}</b><small>${esc((r.attentionReasons||[]).join(" · ")||r.rootTenant)}</small></div>${statusPill(attentionLabel(r),r.attention)}</div>`).join(""):`<div class="empty">ตอนนี้ไม่มีลูกค้าที่ต้องเร่งแก้</div>`;
    $("pilotLatest").innerHTML=d.pilotLatest?.length?d.pilotLatest.map(r=>`<div class="mini-row"><div class="mini-main"><b>${esc(r.businessName)}</b><small>${esc(r.email)} · ${esc(r.status)}</small></div><span class="mono">${fmtDate(r.createdAt,true)}</span></div>`).join(""):`<div class="empty">ยังไม่มีคำขอ Pilot</div>`;
  }

  function customerMatches(r) {
    const q=$("customerSearch").value.trim().toLowerCase(), f=$("customerFilter").value;
    const text=[r.companyName,r.rootTenant,r.gmail?.email].join(" ").toLowerCase();
    if(q&&!text.includes(q)) return false;
    if(f==="critical"&&r.attention!=="critical")return false;
    if(f==="warning"&&r.attention!=="warning")return false;
    if(f==="trial"&&!r.subscription?.betaActive)return false;
    if(f==="paid"&&r.subscription?.status!=="active")return false;
    if(f==="free"&&r.subscription?.status!=="free")return false;
    return true;
  }
  function renderCustomers() {
    const rows=CUSTOMERS.filter(customerMatches);
    $("customerBody").innerHTML=rows.length?rows.map(r=>{
      const s=r.subscription||{}, u=r.usage||{};
      const trial=s.betaActive?`${s.daysRemaining} วัน`:(s.status==="not_started"?"ยังไม่เริ่ม":"—");
      const google=r.googleConnected?statusPill("พร้อม","ok"):statusPill("ไม่เชื่อม","critical");
      const gmail=r.gmail?.reconnectRequired?statusPill("Reconnect","critical"):r.gmail?.connected?statusPill("พร้อม","ok"):statusPill("ยังไม่เชื่อม","warning");
      return `<tr data-customer="${esc(r.rootTenant)}"><td><b>${esc(r.companyName)}</b><br><span class="mono">${esc(r.rootTenant)}</span></td><td>${esc(planLabel(s))}</td><td>${esc(trial)}</td><td><b>${money(u.documents)} / ${money(s.documentLimit||0)}</b><div class="progress"><i style="width:${Math.min(100,Number(u.percent||0))}%"></i></div></td><td>${r.businessCount||1} / ${s.businessLimit||1}</td><td>${google}</td><td>${gmail}</td><td>${statusPill(attentionLabel(r),r.attention)}</td></tr>`;
    }).join(""):`<tr><td colspan="8"><div class="empty">ไม่พบลูกค้า</div></td></tr>`;
  }

  const PILOT_STATUS={pending_google_test_user:"รอเพิ่ม Test User",google_test_user_added:"เพิ่ม Test User แล้ว",contacted:"ติดต่อแล้ว",onboarding:"กำลัง Onboard",trial_started:"เริ่ม Trial",converted:"เป็นลูกค้าแล้ว",rejected:"ไม่ดำเนินการ"};
  function renderPilots() {
    const q=$("pilotSearch").value.trim().toLowerCase(); const rows=PILOTS.filter(r=>!q||[r.businessName,r.email,r.contactName,r.referrer].join(" ").toLowerCase().includes(q));
    $("pilotBody").innerHTML=rows.length?rows.map(r=>`<tr><td>${fmtDate(r.createdAt,true)}</td><td><b>${esc(r.businessName)}</b><br><small>${esc(r.contactName)} · ${esc(r.contact||"")}</small></td><td><a href="mailto:${encodeURIComponent(r.email)}">${esc(r.email)}</a></td><td>${esc(r.referrer||"—")}</td><td>${statusPill(PILOT_STATUS[r.status]||r.status,r.status==="rejected"?"critical":r.status==="converted"?"ok":"warning")}</td><td><div class="row-actions"><select data-pilot-status="${esc(r.id)}">${Object.entries(PILOT_STATUS).map(([v,l])=>`<option value="${v}" ${v===r.status?"selected":""}>${esc(l)}</option>`).join("")}</select><button data-pilot-save="${esc(r.id)}">บันทึก</button></div></td></tr>`).join(""):`<tr><td colspan="6"><div class="empty">ยังไม่มีคำขอ</div></td></tr>`;
  }

  function renderSubscriptions() {
    const f=$("subscriptionFilter")?.value||"";
    const rows=CUSTOMERS.filter(r=>{
      const s=r.subscription||{};
      if(!f)return true;
      if(f==="trial")return s.betaActive;
      if(f==="active")return s.status==="active";
      if(f==="free")return s.status==="free";
      if(f==="not_started")return s.status==="not_started";
      return true;
    });
    $("subscriptionBody").innerHTML=rows.length?rows.map(r=>{const s=r.subscription||{},u=r.usage||{};return `<tr data-customer="${esc(r.rootTenant)}"><td><b>${esc(r.companyName)}</b><br><span class="mono">${esc(r.rootTenant)}</span></td><td>${esc(planLabel(s))}</td><td>${s.betaActive?fmtDate(s.trialEndsAt):"—"}</td><td>${s.betaActive?`${s.daysRemaining} วัน`:"—"}</td><td><b>${money(u.documents)} / ${money(s.documentLimit||0)}</b><div class="progress"><i style="width:${Math.min(100,Number(u.percent||0))}%"></i></div></td><td>${r.businessCount||1} / ${s.businessLimit||1}</td><td>${statusPill(attentionLabel(r),r.attention)}</td></tr>`;}).join(""):`<tr><td colspan="7"><div class="empty">ไม่พบข้อมูลแพ็กเกจ</div></td></tr>`;
  }

  function renderOperations() {
    const h=OVERVIEW?.health||{};
    $("operationsHealth").innerHTML=[healthCard("LINE",h.line),healthCard("Google",h.google),healthCard("Gmail",h.gmail),healthCard("OCR",h.ocr),healthCard("Cron",h.cron),healthCard("Errors",h.errors)].join("");
    const issues=CUSTOMERS.filter(r=>!r.googleConnected||!r.gmail?.connected||r.gmail?.reconnectRequired||r.setup?.ready===false);
    $("connectionIssues").innerHTML=issues.length?issues.slice(0,30).map(r=>`<div class="mini-row" data-open-customer="${esc(r.rootTenant)}"><div class="mini-main"><b>${esc(r.companyName)}</b><small>${esc((r.attentionReasons||[]).join(" · ")||"ตรวจการเชื่อมต่อ")}</small></div>${statusPill(attentionLabel(r),r.attention)}</div>`).join(""):`<div class="empty">การเชื่อมต่อปกติ</div>`;
    $("errorList").innerHTML=ERRORS.length?ERRORS.slice(0,40).map(r=>`<div class="mini-row"><div class="mini-main"><b>${esc(r.area||"error")}</b><small>${esc(r.message||"")}${r.tenant?` · ${esc(r.tenant)}`:""}</small></div><span class="mono">${fmtDate(r.createdAt,true)}</span></div>`).join(""):`<div class="empty">ยังไม่มี Error ที่บันทึกไว้</div>`;
  }

  function renderAudit() {
    $("auditBody").innerHTML=AUDIT.length?AUDIT.map(r=>`<tr><td>${fmtDate(r.createdAt,true)}</td><td><b>${esc(r.action)}</b></td><td><span class="mono">${esc(r.tenant||"—")}</span></td><td><span class="mono">${esc(JSON.stringify(r.detail||{}).slice(0,500))}</span></td></tr>`).join(""):`<tr><td colspan="4"><div class="empty">ยังไม่มี Admin action</div></td></tr>`;
  }

  async function loadPage(page=PAGE) {
    setPage(page); $("lastUpdated").textContent="กำลังอัปเดต…";
    try {
      if(page==="overview"){
        OVERVIEW=await api("/admin/ops/overview"); renderOverview();
      } else if(page==="customers"){
        const d=await api("/admin/ops/customers"); CUSTOMERS=d.rows||[]; renderCustomers();
      } else if(page==="pilot"){
        PILOTS=(await api("/admin/ops/pilot")).rows||[]; renderPilots();
      } else if(page==="subscriptions"){
        const d=await api("/admin/ops/customers"); CUSTOMERS=d.rows||[]; renderSubscriptions();
      } else if(page==="operations"){
        const [ov,cu,er]=await Promise.all([api("/admin/ops/overview"),api("/admin/ops/customers",{}, {deep:1}),api("/admin/ops/errors",{}, {limit:100})]);
        OVERVIEW=ov; CUSTOMERS=cu.rows||[]; ERRORS=er.rows||[]; renderOperations();
      } else if(page==="audit"){
        AUDIT=(await api("/admin/ops/audit",{}, {limit:200})).rows||[]; renderAudit();
      }
      $("lastUpdated").textContent=`อัปเดต ${new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})}`;
    } catch(e) { toast(e.message); $("lastUpdated").textContent="อัปเดตไม่สำเร็จ"; }
  }

  function detailItem(label,value){return `<div class="detail-item"><span>${esc(label)}</span><b>${esc(value??"—")}</b></div>`;}
  async function openCustomer(tenant) {
    $("drawerBackdrop").hidden=false; $("drawerTitle").textContent="กำลังโหลด…"; $("drawerTenant").textContent=tenant; $("drawerBody").innerHTML='<div class="empty">กำลังอ่านข้อมูลลูกค้า…</div>';
    try {
      const d=await api("/admin/ops/customer",{}, {tenant,refresh:0}), r=d.customer, s=r.subscription||{}, u=r.usage||{}, w=r.workflow||{};
      $("drawerTitle").textContent=r.companyName; $("drawerTenant").textContent=r.rootTenant;
      const bizLinks=(r.businessesDetail||[]).map(b=>`<div class="mini-row"><div class="mini-main"><b>${esc(b.name||b.tenant)}</b><small>${esc(b.tenant)}</small></div>${b.dashboardUrl?`<a class="mini-btn" href="${esc(b.dashboardUrl)}" target="_blank" rel="noopener">เปิด Dashboard ↗</a>`:""}</div>`).join("");
      $("drawerBody").innerHTML=`
        <div class="detail-card"><h3>สถานะลูกค้า</h3><div class="detail-grid">${detailItem("แพ็กเกจ",planLabel(s))}${detailItem("Trial เหลือ",s.betaActive?`${s.daysRemaining} วัน`:"—")}${detailItem("เอกสารเดือนนี้",`${money(u.documents)} / ${money(s.documentLimit||0)}`)}${detailItem("ธุรกิจ",`${r.businessCount||1} / ${s.businessLimit||1}`)}${detailItem("Google",r.googleConnected?"เชื่อมแล้ว":"ไม่เชื่อม")}${detailItem("Gmail",r.gmail?.reconnectRequired?"ต้องเชื่อมใหม่":r.gmail?.connected?`เชื่อมแล้ว ${r.gmail.email||""}`:"ยังไม่เชื่อม")}</div></div>
        <div class="detail-card"><h3>Workflow</h3><div class="detail-grid">${detailItem("รายการรอสร้างใบเบิก",w.pendingItems??"—")}${detailItem("รอตรวจ",w.review??"—")}${detailItem("รอโอน",w.payment??"—")}${detailItem("จ่ายแล้ว",w.paid??"—")}${detailItem("ต้องแก้ไข",w.correction??"—")}${detailItem("Setup",r.setup?.ready===false?`ขาด ${(r.setup.missing||[]).join(", ")}`:"พร้อม / ยังไม่ได้ตรวจ")}</div></div>
        <div class="detail-card"><h3>ธุรกิจในบัญชี</h3>${bizLinks||'<div class="empty">ไม่พบธุรกิจ</div>'}</div>
        <div class="detail-card"><h3>จัดการ Package / Trial</h3><div class="action-grid"><button class="primary" data-customer-action="activate_plan" data-plan="starter">Activate Starter</button><button class="primary" data-customer-action="activate_plan" data-plan="pro">Activate Pro</button><button class="primary" data-customer-action="activate_plan" data-plan="business">Activate Business</button><button data-customer-action="set_free">เปลี่ยนเป็น Free</button><button data-customer-action="extend_trial" data-days="7">ต่อ Trial +7 วัน</button><button data-customer-action="extend_trial" data-days="14">ต่อ Trial +14 วัน</button></div></div>
        <div class="detail-card"><h3>Operations</h3><div class="action-grid"><button data-customer-action="sync_gmail">Sync Gmail ตอนนี้</button><button data-customer-action="refresh_usage">Refresh Usage</button><button class="warn" data-customer-action="reset_dashboard_link">Reset Dashboard Link</button></div></div>
        <div class="detail-card"><h3>Internal Note / Feedback</h3><textarea id="customerAdminNote" placeholder="จด Feedback หรือเรื่องที่ต้องตาม…">${esc(r.adminNote||"")}</textarea><div class="action-grid" style="margin-top:8px"><button class="primary" data-customer-action="save_note">บันทึก Note</button></div></div>`;
      $("drawerBody").dataset.tenant=r.rootTenant;
    } catch(e) { $("drawerTitle").textContent="โหลดไม่สำเร็จ"; $("drawerBody").innerHTML=`<div class="empty error-msg">${esc(e.message)}</div>`; }
  }

  async function doCustomerAction(btn) {
    const tenant=$("drawerBody").dataset.tenant; if(!tenant)return;
    const type=btn.dataset.customerAction; const body={action:type,tenant};
    if(type==="activate_plan"){body.plan=btn.dataset.plan;body.cycle="monthly";if(!confirm(`Activate ${body.plan} ให้ลูกค้านี้?`))return;}
    if(type==="set_free"&&!confirm("เปลี่ยนลูกค้าเป็น Free?"))return;
    if(type==="extend_trial"){body.days=Number(btn.dataset.days||7);if(!confirm(`ต่อ Trial +${body.days} วัน?`))return;}
    if(type==="reset_dashboard_link"&&!confirm("Reset Dashboard Link? ลิงก์เดิมจะใช้ไม่ได้ทันที"))return;
    if(type==="save_note")body.note=$("customerAdminNote")?.value||"";
    btn.disabled=true;
    try{const out=await action(body);if(type==="reset_dashboard_link"&&out.dashboardUrl){await navigator.clipboard?.writeText(out.dashboardUrl).catch(()=>{});toast("Reset แล้ว · คัดลอกลิงก์ใหม่ให้แล้ว");}else toast("บันทึกแล้ว");await openCustomer(tenant);await loadPage(PAGE);}catch(e){toast(e.message);}finally{btn.disabled=false;}
  }

  document.addEventListener("click", async e => {
    const nav=e.target.closest("[data-page]"); if(nav){loadPage(nav.dataset.page);return;}
    const customer=e.target.closest("[data-customer],[data-open-customer]"); if(customer){openCustomer(customer.dataset.customer||customer.dataset.openCustomer);return;}
    const pilotBtn=e.target.closest("[data-pilot-save]"); if(pilotBtn){const id=pilotBtn.dataset.pilotSave,sel=document.querySelector(`[data-pilot-status="${CSS.escape(id)}"]`);pilotBtn.disabled=true;try{await action({action:"pilot_status",id,status:sel.value});toast("อัปเดต Pilot แล้ว");await loadPage("pilot");}catch(err){toast(err.message)}finally{pilotBtn.disabled=false;}return;}
    const act=e.target.closest("[data-customer-action]"); if(act){doCustomerAction(act);return;}
  });

  $("loginForm").addEventListener("submit", async e=>{e.preventDefault();KEY=$("adminKeyInput").value.trim();sessionStorage.setItem("ops:adminKey",KEY);try{await api("/admin/ops/overview");loginSuccess();}catch(err){sessionStorage.removeItem("ops:adminKey");KEY="";toast(err.message);}});
  $("logoutBtn").addEventListener("click",()=>logout());
  $("refreshBtn").addEventListener("click",()=>loadPage(PAGE));
  $("customerSearch").addEventListener("input",renderCustomers); $("customerFilter").addEventListener("change",renderCustomers); $("pilotSearch").addEventListener("input",renderPilots); $("subscriptionFilter").addEventListener("change",renderSubscriptions);
  $("deepCustomerRefresh").addEventListener("click",async()=>{try{const d=await api("/admin/ops/customers",{}, {deep:1,refresh:1});CUSTOMERS=d.rows||[];renderCustomers();renderSubscriptions();toast("ตรวจเชิงลึกแล้ว");}catch(e){toast(e.message)}}); $("subscriptionRefreshUsage").addEventListener("click",async()=>{try{const d=await api("/admin/ops/customers",{}, {deep:0,refresh:1});CUSTOMERS=d.rows||[];renderSubscriptions();renderCustomers();toast("Refresh Usage ทั้งหมดแล้ว");}catch(e){toast(e.message)}});
  $("drawerClose").addEventListener("click",()=>$("drawerBackdrop").hidden=true); $("drawerBackdrop").addEventListener("click",e=>{if(e.target===$("drawerBackdrop"))$("drawerBackdrop").hidden=true;});
  $("openPilotForm").addEventListener("click",()=>window.open("https://deal-dashboard.organization-23c.workers.dev/pilot.html","_blank","noopener"));

  const q=new URLSearchParams(location.search); if(q.get("key")){KEY=q.get("key");sessionStorage.setItem("ops:adminKey",KEY);q.delete("key");history.replaceState(null,"",location.pathname+(q.toString()?`?${q}`:""));}
  if(KEY) validateKey(); else $("loginGate").hidden=false;
})();
