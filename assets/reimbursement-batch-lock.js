/* Dashboard v7.11 — Reimbursement + expense status sync
   - หน้า "รายจ่าย" ใช้ source of truth เดียวกับ "เบิกจ่าย"
   - paid=true / batchStatus=จ่ายแล้ว / มี reimbursedAt => จ่ายแล้ว
   - workflow status จาก batchStatus มีสิทธิ์เหนือ legacy status "รอเบิก"
   - รวมใบเบิกได้เฉพาะ queue item ที่ยังไม่เคยสร้างใบเบิกหลัก
*/
(() => {
  "use strict";

  function existingBatchCode(batch = {}) {
    return String(batch.docId || batch.runNo || batch.id || "").trim();
  }

  function findBatchById(id) {
    const key = String(id || "");
    return (BATCH_DATA?.batches || []).find((b) =>
      [b.id, b.docId, b.runNo].some((v) => String(v || "") === key)
    ) || null;
  }

  function boolish(value) {
    if (value === true || value === 1) return true;
    const s = String(value ?? "").trim().toLowerCase();
    return ["true", "1", "yes", "y", "ใช่", "จ่ายแล้ว", "paid"].includes(s);
  }

  function effectiveExpenseStatus(row = {}) {
    const batchStatus = String(row.batchStatus || "").trim();
    const legacyStatus = String(row.status || "").trim();

    const paid =
      boolish(row.paid) ||
      batchStatus === "จ่ายแล้ว" ||
      !!String(row.reimbursedAt || "").trim();

    if (paid) return "จ่ายแล้ว";

    const workflowStatuses = new Set([
      "รอตรวจเอกสาร",
      "ต้องแก้ไข",
      "รอโอนเงิน",
      "รอหลักฐานการโอน",
      "ขอเบิกด่วน",
      "ยกเลิก",
      "ไม่อนุมัติ",
    ]);

    if (workflowStatuses.has(batchStatus)) return batchStatus;
    return legacyStatus || "รอเบิก";
  }

  function syncExpenseStatuses() {
    if (!Array.isArray(ALL)) return;
    for (const row of ALL) {
      const effective = effectiveExpenseStatus(row);
      if (effective && row.status !== effective) row.status = effective;
    }
  }

  function decorateAlreadyMergedRows() {
    const body = document.getElementById("batchMasterBody");
    if (!body) return;

    body.querySelectorAll("tr[data-open-batch]").forEach((row) => {
      row.querySelectorAll("[data-master-merge-id], .master-checkbox").forEach((node) => node.remove());

      const batch = findBatchById(row.dataset.openBatch);
      const code = existingBatchCode(batch);
      if (!code) return;

      let badge = row.querySelector(".already-merged-badge");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "already-merged-badge";
        const target = row.querySelector('[data-label="สถานะ"]') || row.cells?.[2] || row;
        target.appendChild(badge);
      }
      const text = `รวมใบเบิกแล้ว · ${code}`;
      if (badge.textContent !== text) badge.textContent = text;
    });
  }

  // ใบเบิกหลักที่สร้างแล้วห้ามนำไปสร้างใบเบิกหลักซ้ำ
  reviewMergeSelectable = function(row) {
    return !!(row && row.kind === "queue" && row.statusKey === "review");
  };

  try { REVIEW_BATCH_SELECTED.clear(); } catch {}

  const coreRenderMasterTable = renderMasterTable;
  renderMasterTable = function(...args) {
    try { REVIEW_BATCH_SELECTED.clear(); } catch {}
    const result = coreRenderMasterTable.apply(this, args);
    decorateAlreadyMergedRows();
    return result;
  };

  // ทุกครั้งก่อน render หน้า expense ให้ reconcile legacy status กับ workflow status ก่อน
  const coreRenderExp = renderExp;
  renderExp = function(...args) {
    syncExpenseStatuses();
    return coreRenderExp.apply(this, args);
  };

  const coreRenderRecent = renderRecent;
  renderRecent = function(...args) {
    syncExpenseStatuses();
    return coreRenderRecent.apply(this, args);
  };

  if (typeof renderReport === "function") {
    const coreRenderReport = renderReport;
    renderReport = function(...args) {
      syncExpenseStatuses();
      return coreRenderReport.apply(this, args);
    };
  }

  const coreRenderLocalPage = renderLocalPage;
  renderLocalPage = function(...args) {
    syncExpenseStatuses();
    return coreRenderLocalPage.apply(this, args);
  };

  // กรณี data โหลดเสร็จก่อน patch
  setTimeout(() => {
    try {
      syncExpenseStatuses();
      const page = currentPageKey();
      if (page === "batches" && BATCH_DATA) renderMasterTable();
      else if (page === "expenses") renderExp();
      else if (page === "overview") renderRecent();
    } catch (error) {
      console.warn("v7.11 status sync redraw", error);
    }
  }, 0);

  const style = document.createElement("style");
  style.textContent = `
    .already-merged-badge{
      display:inline-flex;align-items:center;margin-top:8px;padding:5px 9px;
      border-radius:999px;border:1px solid rgba(0,0,0,.08);
      background:#f2f2f7;color:#5f6368;font-size:11px;font-weight:700;
      line-height:1.2;white-space:normal
    }
    @media(max-width:860px){
      .already-merged-badge{font-size:12px;padding:6px 10px}
      tr[data-open-batch] .sticky-select:empty{display:none!important}
    }
  `;
  document.head.appendChild(style);

  console.info("[Dashboard] v7.11 expense paid-status sync active");
})();


/* Dashboard v7.12 — Commercial Pilot / Package truth
   Trial = Business 60 วันต่อบัญชี, 1,500 รายการ/เดือน, 10 ธุรกิจ
   Billing ช่วง Pilot = ทีมงานยืนยันการชำระเงินแบบ manual ก่อนเปิดแพ็กเกจ
*/
(() => {
  "use strict";

  // แพ็กเกจช่วง Launch ต่างกันที่ volume + จำนวนธุรกิจ ไม่ขาย feature gating ที่ backend ยังไม่ได้ล็อก
  if (typeof PLAN_CATALOG !== "undefined") {
    Object.assign(PLAN_CATALOG.free, {
      recommended: false,
      features: ["10 รายการ/เดือน", "1 ธุรกิจ", "ฟีเจอร์หลักของระบบ", "LINE Bot + Dashboard", "Gmail Automation (Beta) เมื่อได้รับสิทธิ์"],
    });
    Object.assign(PLAN_CATALOG.starter, {
      recommended: false,
      features: ["50 รายการ/เดือน", "1 ธุรกิจ", "ฟีเจอร์หลักของระบบ", "LINE + Dashboard + เอกสารอัตโนมัติ", "Gmail Automation (Beta) เมื่อได้รับสิทธิ์"],
    });
    Object.assign(PLAN_CATALOG.pro, {
      recommended: false,
      features: ["300 รายการ/เดือน", "สูงสุด 3 ธุรกิจ", "ฟีเจอร์หลักของระบบ", "เหมาะกับทีมที่มีหลายธุรกิจ", "Gmail Automation (Beta) เมื่อได้รับสิทธิ์"],
    });
    Object.assign(PLAN_CATALOG.business, {
      recommended: true,
      features: ["1,500 รายการ/เดือน", "สูงสุด 10 ธุรกิจ", "ฟีเจอร์หลักของระบบ", "เหมาะกับทีมที่มีปริมาณเอกสารสูง", "Gmail Automation (Beta) เมื่อได้รับสิทธิ์"],
    });
  }

  renderPricing = function renderPricingPilot() {
    const grid = el("pricingGrid"); if (!grid) return;
    const requested = String(PLAN_INFO.requestedPlan || "");
    const current = String(PLAN_INFO.effectivePlan || "");
    grid.innerHTML = Object.values(PLAN_CATALOG).map((p) => {
      const price = PLAN_CYCLE === "annual" ? p.annual : p.monthly;
      const perMonth = PLAN_CYCLE === "annual" && price ? Math.round(price / 12) : price;
      const selected = requested === p.id && String(PLAN_INFO.requestedCycle || "monthly") === PLAN_CYCLE;
      const active = !PLAN_INFO.betaActive && PLAN_INFO.status === "active" && current === p.id;
      let action = PLAN_INFO.betaActive
        ? (p.id === "free" ? "เลือก Free หลังทดลองใช้ฟรี" : "เลือกแพ็กเกจหลังทดลองใช้ฟรี")
        : (active ? "แพ็กเกจปัจจุบัน" : "แจ้งเลือกแพ็กเกจนี้");
      if (selected) action = "เลือกไว้แล้ว";
      const billed = PLAN_CYCLE === "annual" && price
        ? `ชำระ ${planMoney(price)} บาท/ปี · เฉลี่ย ${planMoney(perMonth)} บาท/เดือน`
        : (p.id === "free" ? "ไม่มีค่าบริการ" : "ชำระรายเดือน · ทีมงานยืนยันการเปิดแพ็กเกจหลังตรวจสอบการชำระเงิน");
      return `<article class="pricing-card ${p.recommended ? "recommended" : ""}">${p.recommended ? '<span class="pricing-ribbon">เหมาะกับช่วงทดลองใช้</span>' : ""}<div class="pricing-name">แพ็กเกจ</div><h4>${esc(p.name)}</h4><div class="pricing-price"><strong>${price ? planMoney(price) : "0"} บาท</strong><span>/${PLAN_CYCLE === "annual" ? "ปี" : "เดือน"}</span></div><div class="pricing-billed">${esc(billed)}</div><div class="pricing-docs"><strong>${planMoney(p.documents)} รายการ</strong><span>ต่อเดือน</span></div><ul class="pricing-features">${p.features.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><button type="button" class="plan-action ${p.recommended ? "primary" : ""}" data-select-plan="${p.id}" ${active || selected ? "disabled" : ""}>${esc(action)}</button></article>`;
    }).join("");
  };

  renderSubscription = function renderSubscriptionPilot() {
    if (!PLAN_INFO || PLAN_INFO.ok !== true) return;
    const used = Number(PLAN_INFO.usage?.documents || 0);
    const limit = PLAN_INFO.documentLimit == null ? null : Number(PLAN_INFO.documentLimit || 0);
    const banner = el("betaPlanBanner"); if (banner) banner.hidden = false;
    if (el("betaPlanBadge")) el("betaPlanBadge").textContent = PLAN_INFO.betaActive ? "60-DAY FREE TRIAL" : String(PLAN_INFO.planName || "PLAN").toUpperCase();
    if (el("betaPlanTitle")) el("betaPlanTitle").textContent = PLAN_INFO.betaActive ? `ทดลองใช้ Business ฟรี อีก ${PLAN_INFO.daysRemaining || 0} วัน` : `แพ็กเกจ ${PLAN_INFO.planName || "ฟรี"}`;
    if (el("betaPlanSub")) el("betaPlanSub").textContent = PLAN_INFO.betaActive
      ? `เริ่มนับจากวันเริ่มใช้งาน · ถึง ${planDate(PLAN_INFO.trialEndsAt)} · ${PLAN_INFO.businessCount || 1}/${PLAN_INFO.businessLimit || 10} ธุรกิจ · เดือนนี้ ${used}/${limit || 1500} รายการ`
      : (limit ? `${PLAN_INFO.businessCount || 1}/${PLAN_INFO.businessLimit || 1} ธุรกิจ · เดือนนี้ ${used}/${limit} รายการ` : `เดือนนี้ ${used} รายการ`);
    if (el("billingCurrentName")) el("billingCurrentName").textContent = PLAN_INFO.betaActive ? "ทดลองใช้ Business ฟรี 60 วัน" : `แพ็กเกจ ${PLAN_INFO.planName || "ฟรี"}`;
    if (el("billingCurrentDesc")) el("billingCurrentDesc").textContent = PLAN_INFO.betaActive
      ? "ทดลองใช้สิทธิ์ระดับ Business เต็ม 60 วัน ไม่มีการตัดเงินอัตโนมัติ · 1,500 รายการ/เดือน · สูงสุด 10 ธุรกิจ"
      : "รายการเดิมยังใช้งานได้ตามปกติ โควตารายการใหม่จะรีเซ็ตทุกต้นเดือน";
    if (el("billingTrialText")) el("billingTrialText").textContent = PLAN_INFO.betaActive ? `ฟรีถึง ${planDate(PLAN_INFO.trialEndsAt)} · เหลือ ${PLAN_INFO.daysRemaining || 0} วัน` : `${PLAN_INFO.usage?.month || "เดือนปัจจุบัน"}`;
    if (el("billingUsageNumber")) el("billingUsageNumber").textContent = limit ? `${planMoney(used)} / ${planMoney(limit)}` : `${planMoney(used)}`;
    if (el("billingUsageSub")) el("billingUsageSub").textContent = limit ? `รายการที่บันทึกใน ${PLAN_INFO.usage?.month || "เดือนนี้"}` : "รายการที่บันทึกเดือนนี้";
    if (el("billingBusinessUsage")) el("billingBusinessUsage").textContent = `${PLAN_INFO.businessCount || 1} / ${PLAN_INFO.businessLimit || 1}`;
    const bar = el("billingUsageBar"); if (bar) bar.style.width = limit ? `${Math.min(100, Number(PLAN_INFO.usage?.percent || 0))}%` : "0%";
    const state = el("billingUsageState");
    if (state) {
      state.className = "billing-usage-state";
      if (PLAN_INFO.betaActive) state.textContent = `ทดลองใช้ Business · ${used}/${limit || 1500} รายการเดือนนี้ · ยังไม่มีการเรียกเก็บเงิน`;
      else if (PLAN_INFO.usage?.threshold === "limit") { state.classList.add("limit"); state.textContent = "โควตาครบแล้ว · ระบบหยุดรับรายการใหม่จนกว่าโควตาจะเพิ่มหรือเริ่มเดือนใหม่"; }
      else if (["warning80", "warning90"].includes(PLAN_INFO.usage?.threshold)) { state.classList.add("warn"); state.textContent = `ใช้โควตาแล้ว ${PLAN_INFO.usage?.percent || 0}% · แนะนำให้เตรียมอัปเกรดก่อนเต็ม`; }
      else state.textContent = limit ? `เหลือ ${Math.max(0, limit - used)} รายการในเดือนนี้` : `ใช้ไป ${used} รายการ`;
    }
    const req = el("billingRequest");
    if (req) {
      const requested = PLAN_INFO.requestedPlanName || "";
      req.hidden = !requested;
      req.textContent = requested ? `เลือกไว้หลังทดลองใช้ฟรี: ${requested} · ${PLAN_INFO.requestedCycle === "annual" ? "รายปี" : "รายเดือน"} · ทีมงานจะยืนยันการชำระเงินก่อนเปิดแพ็กเกจ` : "";
    }
    renderPricing();
  };

  requestUpgrade = async function requestUpgradePilot(plan) {
    const p = PLAN_CATALOG[plan]; if (!p) return;
    const label = PLAN_CYCLE === "annual" ? `${planMoney(p.annual)} บาท/ปี` : `${planMoney(p.monthly)} บาท/เดือน`;
    if (!confirm(`เลือกแพ็กเกจ ${p.name} (${label}) ไว้หลังทดลองใช้ฟรี 60 วัน?\n\nช่วง Pilot ยังไม่มีการตัดเงินอัตโนมัติ ทีมงานจะติดต่อยืนยันการชำระเงินก่อนเปิดแพ็กเกจ`)) return;
    try {
      const res = await fetch(apiUrl("/api/subscription/request-upgrade"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan, cycle: PLAN_CYCLE }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) throw new Error(data.reason || data.error || ("HTTP " + res.status));
      PLAN_INFO = data; renderSubscription();
      alert(`บันทึกแพ็กเกจ ${p.name} ไว้แล้ว\nทดลองใช้ฟรี Business ต่อจนครบ 60 วัน · ทีมงานจะติดต่อยืนยันการชำระเงินก่อนเปิดแพ็กเกจ`);
    } catch (err) {
      console.error(err); alert("บันทึกแพ็กเกจไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  console.info("[Dashboard] v7.12 commercial pilot package mode active");
})();
/* Dashboard v7.14 — Team Dashboard Access
   ใช้ backend role-token ที่มีอยู่แล้ว:
   owner / accountant / approver / viewer
   แยกจาก team_members ซึ่งเป็นข้อมูลผู้เบิกและบัญชีรับเงิน
*/
(() => {
  "use strict";

  const ACCESS_ROLE_LABELS = {
    owner: "เจ้าของ",
    accountant: "แอดมิน / บัญชี",
    approver: "ผู้อนุมัติ",
    viewer: "ดูอย่างเดียว",
  };

  const ACCESS_ROLE_DESC = {
    accountant: "ดูและทำงานบัญชี/เบิกจ่ายได้ รวมตรวจเบิก โอน แนบหลักฐาน กระทบยอด และรายงาน แต่จัดการแพ็กเกจ/สิทธิ์ทีมไม่ได้",
    approver: "ดูงานที่เกี่ยวข้องและอนุมัติหรือตีกลับเอกสารได้ โดยไม่เข้าถึงการจัดการแพ็กเกจและสิทธิ์ทีม",
    viewer: "เปิดดู Dashboard และรายงานได้อย่างเดียว ไม่มีสิทธิ์แก้ไขข้อมูล",
  };

  let DASH_ACCESS_ME = null;
  let DASH_ACCESS_ROWS = [];
  let DASH_ACCESS_BUSY = false;

  const accessEsc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));

  function accessEndpoint(path) {
    const u = new URL(`${WORKER}${path}`);
    u.searchParams.set("tenant", TENANT);
    u.searchParams.set("k", K);
    return u.toString();
  }

  async function accessApi(path, options = {}) {
    let response;
    try {
      response = await fetch(accessEndpoint(path), {
        ...options,
        headers: {
          "content-type": "application/json",
          ...(options.headers || {}),
        },
      });
    } catch (error) {
      throw new Error(`ติดต่อ Worker ไม่ได้: ${error?.message || error}`);
    }

    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; }
    catch { data = { error: raw.slice(0, 220) }; }

    if (response.status === 401) throw new Error("ลิงก์ Dashboard นี้หมดอายุหรือถูกยกเลิกสิทธิ์แล้ว");
    if (response.status === 403) throw new Error(data.error === "owner_only" ? "เฉพาะ Owner เท่านั้นที่จัดการสิทธิ์ทีมได้" : "ไม่มีสิทธิ์ทำรายการนี้");
    if (!response.ok || data.ok === false) throw new Error(data.message || data.error || `HTTP ${response.status}`);
    return data;
  }

  function accessRoleLabel(role) {
    return ACCESS_ROLE_LABELS[String(role || "")] || String(role || "ผู้ใช้งาน");
  }

  function shortToken(token = "") {
    const t = String(token || "");
    return t.length > 10 ? `${t.slice(0, 4)}••••${t.slice(-4)}` : "••••••••";
  }

  function accessDate(value) {
    const d = new Date(value || "");
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function accessSetState(message = "", type = "") {
    const node = document.getElementById("dashboardAccessState");
    if (!node) return;
    node.textContent = message;
    node.className = `dash-access-state ${type}`.trim();
  }

  function ensureDashboardAccessCard() {
    const tab = document.getElementById("biz-team");
    const grid = tab?.querySelector(".biz-grid") || tab;
    if (!grid || document.getElementById("dashboardAccessCard")) return;

    const card = document.createElement("div");
    card.className = "card dashboard-access-card";
    card.id = "dashboardAccessCard";
    card.innerHTML = `
      <div class="dash-access-head">
        <div>
          <div class="dash-access-kicker">DASHBOARD ACCESS</div>
          <h3>สิทธิ์เข้า Dashboard</h3>
          <div class="cs">แยกลิงก์ให้แต่ละคน ไม่ต้องแชร์ลิงก์ Owner ของบริษัท</div>
        </div>
        <span class="dash-access-current" id="dashboardAccessCurrent">กำลังตรวจสิทธิ์…</span>
      </div>

      <div class="accounting-note dash-access-warning" style="margin:14px 0">
        <span>สำคัญ</span>
        <span><b>ลิงก์ Dashboard หลักของ Owner คือกุญแจเจ้าของ</b> อย่าส่งลิงก์นี้ให้พนักงาน ให้สร้างลิงก์เฉพาะคนด้านล่างแทน เมื่อพนักงานออกสามารถยกเลิกเฉพาะลิงก์คนนั้นได้ทันที</span>
      </div>

      <div id="dashboardAccessOwnerTools" hidden>
        <div class="dash-access-form">
          <div class="field">
            <label>ชื่อผู้ใช้งาน</label>
            <input id="dashboardAccessName" maxlength="120" placeholder="เช่น แนน ฝ่ายบัญชี">
          </div>
          <div class="field">
            <label>สิทธิ์</label>
            <select id="dashboardAccessRole">
              <option value="accountant">แอดมิน / บัญชี</option>
              <option value="approver">ผู้อนุมัติ</option>
              <option value="viewer">ดูอย่างเดียว</option>
            </select>
          </div>
          <div class="dash-access-role-help" id="dashboardAccessRoleHelp"></div>
          <button class="btn solid" type="button" id="dashboardAccessCreate">สร้างสิทธิ์และลิงก์</button>
        </div>
        <div class="dash-access-state" id="dashboardAccessState"></div>
        <div class="dash-access-list" id="dashboardAccessList">
          <div class="empty">กำลังโหลดผู้ใช้งาน…</div>
        </div>
      </div>

      <div id="dashboardAccessMemberInfo" hidden>
        <div class="dash-access-member-box">
          <b id="dashboardAccessMemberTitle">สิทธิ์ของคุณ</b>
          <span id="dashboardAccessMemberDesc"></span>
        </div>
      </div>
    `;

    if (grid.firstChild) grid.insertBefore(card, grid.firstChild);
    else grid.appendChild(card);

    const roleSelect = document.getElementById("dashboardAccessRole");
    roleSelect?.addEventListener("change", renderAccessRoleHelp);
    document.getElementById("dashboardAccessCreate")?.addEventListener("click", createDashboardAccess);
    document.getElementById("dashboardAccessList")?.addEventListener("click", handleAccessListClick);
    renderAccessRoleHelp();
  }

  function renderAccessRoleHelp() {
    const role = document.getElementById("dashboardAccessRole")?.value || "accountant";
    const node = document.getElementById("dashboardAccessRoleHelp");
    if (node) node.textContent = ACCESS_ROLE_DESC[role] || "";
  }

  function updateWorkspaceIdentity() {
    if (!DASH_ACCESS_ME) return;
    const who = document.getElementById("whoName");
    const wrapper = who?.parentElement;
    const small = wrapper?.querySelector("small");
    const label = accessRoleLabel(DASH_ACCESS_ME.role);

    if (who) who.textContent = DASH_ACCESS_ME.name || label;
    if (small) small.textContent = DASH_ACCESS_ME.role === "owner" ? "Workspace owner" : label;

    document.body.dataset.dashboardRole = String(DASH_ACCESS_ME.role || "");
  }

  function renderDashboardAccess() {
    ensureDashboardAccessCard();
    if (!DASH_ACCESS_ME) return;

    const current = document.getElementById("dashboardAccessCurrent");
    if (current) current.textContent = `คุณ: ${accessRoleLabel(DASH_ACCESS_ME.role)}`;

    const ownerTools = document.getElementById("dashboardAccessOwnerTools");
    const memberInfo = document.getElementById("dashboardAccessMemberInfo");
    const isOwner = DASH_ACCESS_ME.role === "owner";

    if (ownerTools) ownerTools.hidden = !isOwner;
    if (memberInfo) memberInfo.hidden = isOwner;

    if (!isOwner) {
      const title = document.getElementById("dashboardAccessMemberTitle");
      const desc = document.getElementById("dashboardAccessMemberDesc");
      if (title) title.textContent = `${DASH_ACCESS_ME.name || "ผู้ใช้งาน"} · ${accessRoleLabel(DASH_ACCESS_ME.role)}`;
      if (desc) {
        desc.textContent =
          DASH_ACCESS_ME.role === "accountant" ? ACCESS_ROLE_DESC.accountant :
          DASH_ACCESS_ME.role === "approver" ? ACCESS_ROLE_DESC.approver :
          ACCESS_ROLE_DESC.viewer;
      }
      return;
    }

    const list = document.getElementById("dashboardAccessList");
    if (!list) return;

    if (!DASH_ACCESS_ROWS.length) {
      list.innerHTML = `
        <div class="dash-access-empty">
          <b>ยังไม่มีลิงก์พนักงาน</b>
          <span>ตอนนี้มีเฉพาะ Owner ใช้งาน Dashboard อยู่</span>
        </div>`;
      return;
    }

    list.innerHTML = DASH_ACCESS_ROWS.map((row) => `
      <div class="dash-access-row" data-access-token="${accessEsc(row.token || "")}">
        <div class="dash-access-person">
          <div class="dash-access-avatar">${accessEsc(String(row.name || "U").trim().slice(0, 1).toUpperCase())}</div>
          <div>
            <b>${accessEsc(row.name || accessRoleLabel(row.role))}</b>
            <span>${accessEsc(accessRoleLabel(row.role))} · สร้าง ${accessEsc(accessDate(row.createdAt))}</span>
          </div>
        </div>
        <div class="dash-access-token">${accessEsc(shortToken(row.token))}</div>
        <div class="dash-access-actions">
          <button class="btn small" type="button" data-access-copy="${accessEsc(row.url || "")}">คัดลอกลิงก์</button>
          <a class="btn small" href="${accessEsc(row.url || "#")}" target="_blank" rel="noopener">เปิดทดสอบ</a>
          <button class="btn small danger" type="button" data-access-revoke="${accessEsc(row.token || "")}" data-access-name="${accessEsc(row.name || "")}">ยกเลิกสิทธิ์</button>
        </div>
      </div>
    `).join("");
  }

  async function copyText(value) {
    const text = String(value || "");
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  async function createDashboardAccess() {
    if (DASH_ACCESS_BUSY) return;
    const name = document.getElementById("dashboardAccessName")?.value.trim() || "";
    const role = document.getElementById("dashboardAccessRole")?.value || "accountant";
    if (!name) {
      accessSetState("กรอกชื่อผู้ใช้งานก่อน", "error");
      document.getElementById("dashboardAccessName")?.focus();
      return;
    }

    DASH_ACCESS_BUSY = true;
    const btn = document.getElementById("dashboardAccessCreate");
    if (btn) { btn.disabled = true; btn.textContent = "กำลังสร้างสิทธิ์…"; }
    accessSetState("กำลังสร้างลิงก์เฉพาะผู้ใช้งาน…", "loading");

    try {
      const out = await accessApi("/api/accounting/access", {
        method: "POST",
        body: JSON.stringify({ name, role }),
      });
      const record = out.record || {};
      if (record.url) await copyText(record.url);
      document.getElementById("dashboardAccessName").value = "";
      accessSetState(
        record.url
          ? `สร้าง ${accessRoleLabel(record.role)} ให้ ${record.name || name} แล้ว · คัดลอกลิงก์ไว้ใน Clipboard แล้ว`
          : "สร้างสิทธิ์แล้ว",
        "success"
      );
      await loadDashboardAccessRows();
    } catch (error) {
      accessSetState(error?.message || "สร้างสิทธิ์ไม่สำเร็จ", "error");
    } finally {
      DASH_ACCESS_BUSY = false;
      if (btn) { btn.disabled = false; btn.textContent = "สร้างสิทธิ์และลิงก์"; }
    }
  }

  async function handleAccessListClick(event) {
    const copy = event.target.closest("[data-access-copy]");
    if (copy) {
      const ok = await copyText(copy.dataset.accessCopy || "");
      accessSetState(ok ? "คัดลอกลิงก์แล้ว" : "คัดลอกไม่สำเร็จ", ok ? "success" : "error");
      return;
    }

    const revoke = event.target.closest("[data-access-revoke]");
    if (!revoke) return;
    const token = revoke.dataset.accessRevoke || "";
    const name = revoke.dataset.accessName || "ผู้ใช้งานนี้";
    if (!token || !confirm(`ยกเลิกสิทธิ์ของ ${name}?\n\nลิงก์ของคนนี้จะเข้า Dashboard ไม่ได้ทันที แต่ Owner และผู้ใช้งานคนอื่นไม่กระทบ`)) return;

    revoke.disabled = true;
    accessSetState(`กำลังยกเลิกสิทธิ์ ${name}…`, "loading");
    try {
      await accessApi("/api/accounting/access-revoke", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      accessSetState(`ยกเลิกสิทธิ์ ${name} แล้ว`, "success");
      await loadDashboardAccessRows();
    } catch (error) {
      accessSetState(error?.message || "ยกเลิกสิทธิ์ไม่สำเร็จ", "error");
      revoke.disabled = false;
    }
  }

  async function loadDashboardAccessRows() {
    if (DASH_ACCESS_ME?.role !== "owner") return;
    try {
      const out = await accessApi("/api/accounting/access");
      DASH_ACCESS_ROWS = Array.isArray(out.rows) ? out.rows : [];
      renderDashboardAccess();
    } catch (error) {
      accessSetState(error?.message || "โหลดรายชื่อสิทธิ์ไม่สำเร็จ", "error");
    }
  }

  async function bootDashboardAccess() {
    ensureDashboardAccessCard();
    try {
      const me = await accessApi("/api/accounting/whoami");
      DASH_ACCESS_ME = me;
      updateWorkspaceIdentity();
      renderDashboardAccess();
      if (me.role === "owner") await loadDashboardAccessRows();
    } catch (error) {
      const current = document.getElementById("dashboardAccessCurrent");
      if (current) current.textContent = "ตรวจสิทธิ์ไม่สำเร็จ";
      accessSetState(error?.message || "ตรวจสิทธิ์ Dashboard ไม่สำเร็จ", "error");
    }
  }

  const accessStyle = document.createElement("style");
  accessStyle.textContent = `
    .dashboard-access-card{grid-column:1/-1}
    .dash-access-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .dash-access-kicker{font-size:10px;font-weight:800;letter-spacing:.11em;color:#86868b;margin-bottom:5px}
    .dash-access-current{display:inline-flex;padding:6px 10px;border-radius:999px;background:#f2f2f7;color:#525257;font-size:11px;font-weight:750;white-space:nowrap}
    .dash-access-warning span:first-child{white-space:nowrap}
    .dash-access-form{display:grid;grid-template-columns:minmax(180px,1fr) minmax(180px,.7fr);gap:10px;align-items:end;margin-top:12px}
    .dash-access-form .field{margin:0}
    .dash-access-form select,.dash-access-form input{width:100%;min-height:44px}
    .dash-access-role-help{grid-column:1/-1;background:#f5f5f7;border-radius:12px;padding:10px 12px;color:#6e6e73;font-size:12px;line-height:1.55}
    .dash-access-form #dashboardAccessCreate{grid-column:1/-1;justify-self:start}
    .dash-access-state{min-height:20px;margin:10px 0;font-size:12px;color:#6e6e73}
    .dash-access-state.success{color:#147a36}.dash-access-state.error{color:#b42318}.dash-access-state.loading{color:#6e6e73}
    .dash-access-list{border-top:1px solid #eeeeef;margin-top:4px}
    .dash-access-row{display:grid;grid-template-columns:minmax(180px,1fr) 110px auto;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid #eeeeef}
    .dash-access-person{display:flex;align-items:center;gap:10px;min-width:0}
    .dash-access-avatar{width:36px;height:36px;border-radius:11px;background:#1d1d1f;color:#fff;display:grid;place-items:center;font-weight:800;flex:0 0 auto}
    .dash-access-person b{display:block;font-size:13px}.dash-access-person span{display:block;color:#86868b;font-size:11px;margin-top:3px}
    .dash-access-token{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:#86868b}
    .dash-access-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
    .dash-access-actions .danger{color:#b42318}
    .dash-access-empty,.dash-access-member-box{padding:18px;background:#f8f8fa;border-radius:14px;margin-top:12px}
    .dash-access-empty b,.dash-access-member-box b{display:block;font-size:13px}
    .dash-access-empty span,.dash-access-member-box span{display:block;color:#6e6e73;font-size:12px;line-height:1.6;margin-top:5px}
    @media(max-width:760px){
      .dash-access-head{display:block}.dash-access-current{margin-top:10px}
      .dash-access-form{grid-template-columns:1fr}
      .dash-access-role-help,.dash-access-form #dashboardAccessCreate{grid-column:1}
      .dash-access-form #dashboardAccessCreate{width:100%}
      .dash-access-row{grid-template-columns:1fr}
      .dash-access-token{display:none}
      .dash-access-actions{justify-content:stretch}
      .dash-access-actions .btn,.dash-access-actions a{flex:1;text-align:center;justify-content:center}
    }
  `;
  document.head.appendChild(accessStyle);

  // เริ่มหลัง core dashboard สร้าง DOM และ globals แล้ว
  setTimeout(bootDashboardAccess, 0);

  console.info("[Dashboard] v7.14 team dashboard access active");
})();
