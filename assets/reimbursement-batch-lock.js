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
    approver: "อนุมัติหรือตีกลับเอกสารได้ และเมื่อผูกกับสมาชิก LINE ระบบจะส่งงานรออนุมัติเข้า LINE ส่วนตัวของคนนั้นโดยตรง",
    viewer: "เปิดดู Dashboard และรายงานได้อย่างเดียว ไม่มีสิทธิ์แก้ไขข้อมูล",
  };

  let DASH_ACCESS_ME = null;
  let DASH_ACCESS_ROWS = [];
  let DASH_ACCESS_BUSY = false;
  let LINE_MEMBER_ROWS_V726 = [];
  let LINE_MEMBER_MODE_V726 = "";
  let LINE_MEMBER_LOADING_V726 = false;

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
          <div class="field dash-access-line-field-v726" id="dashboardAccessLineFieldV726" hidden>
            <label>LINE ผู้อนุมัติ</label>
            <select id="dashboardAccessLineUserV726">
              <option value="">กำลังโหลดสมาชิก LINE…</option>
            </select>
            <small id="dashboardAccessLineHintV726">เลือกคนใน Workspace นี้ ระบบจะผูก LINE User ID ให้อัตโนมัติ</small>
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
    roleSelect?.addEventListener("change", () => {
      renderAccessRoleHelp();
      renderLineApproverFieldV726();
    });
    document.getElementById("dashboardAccessLineUserV726")?.addEventListener("change", (event) => {
      const row = LINE_MEMBER_ROWS_V726.find((x) => String(x.userId) === String(event.target.value || ""));
      const nameInput = document.getElementById("dashboardAccessName");
      if (row && nameInput && !nameInput.value.trim()) nameInput.value = row.displayName || "";
    });
    document.getElementById("dashboardAccessCreate")?.addEventListener("click", createDashboardAccess);
    document.getElementById("dashboardAccessList")?.addEventListener("click", handleAccessListClick);
    renderAccessRoleHelp();
    renderLineApproverFieldV726();
  }

  function lineMemberOptionsV726(selected = "") {
    const rows = LINE_MEMBER_ROWS_V726.filter((row) => row.active !== false);
    if (!rows.length) {
      return `<option value="">ยังไม่พบสมาชิก · ให้คนนั้นส่งข้อความในกลุ่ม 1 ครั้ง</option>`;
    }
    return `<option value="">เลือกคนที่จะเป็นผู้อนุมัติ</option>` + rows.map((row) => {
      const label = row.displayName || `LINE ${String(row.userId || "").slice(-6)}`;
      return `<option value="${accessEsc(row.userId || "")}" ${String(row.userId) === String(selected) ? "selected" : ""}>${accessEsc(label)}</option>`;
    }).join("");
  }

  function renderLineApproverFieldV726() {
    const role = document.getElementById("dashboardAccessRole")?.value || "accountant";
    const field = document.getElementById("dashboardAccessLineFieldV726");
    const select = document.getElementById("dashboardAccessLineUserV726");
    const hint = document.getElementById("dashboardAccessLineHintV726");
    if (!field || !select) return;

    field.hidden = role !== "approver";
    if (role !== "approver") return;

    const current = select.value || "";
    select.innerHTML = LINE_MEMBER_LOADING_V726
      ? `<option value="">กำลังโหลดสมาชิก LINE…</option>`
      : lineMemberOptionsV726(current);

    if (hint) {
      hint.textContent = LINE_MEMBER_MODE_V726 === "line-full-group"
        ? "ดึงสมาชิกจากกลุ่ม LINE ได้โดยตรง · ผู้อนุมัติควรเพิ่ม LINE OA เป็นเพื่อนเพื่อรับแจ้งเตือนส่วนตัว"
        : "แสดงคนที่ระบบเคยเห็นในกลุ่ม/เคยกรอกข้อมูลผู้เบิก · ถ้าไม่พบ ให้คนนั้นพิมพ์ในกลุ่ม 1 ครั้ง";
    }
  }

  async function loadLineMembersV726() {
    if (DASH_ACCESS_ME?.role !== "owner" || LINE_MEMBER_LOADING_V726) return;
    LINE_MEMBER_LOADING_V726 = true;
    renderLineApproverFieldV726();
    try {
      const out = await accessApi("/api/line-members");
      LINE_MEMBER_ROWS_V726 = Array.isArray(out.members) ? out.members : [];
      LINE_MEMBER_MODE_V726 = String(out.directoryMode || "");
    } catch (error) {
      console.warn("load LINE members", error);
      LINE_MEMBER_ROWS_V726 = [];
      LINE_MEMBER_MODE_V726 = "";
    } finally {
      LINE_MEMBER_LOADING_V726 = false;
      renderLineApproverFieldV726();
    }
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
            <span>${accessEsc(accessRoleLabel(row.role))} · สร้าง ${accessEsc(accessDate(row.createdAt))}${row.role === "approver" ? (row.lineUserId ? " · LINE แจ้งตรง ✓" : " · ยังไม่ผูก LINE") : ""}</span>
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
    const role = document.getElementById("dashboardAccessRole")?.value || "accountant";
    const lineUserId = role === "approver"
      ? (document.getElementById("dashboardAccessLineUserV726")?.value || "")
      : "";
    const selectedLine = LINE_MEMBER_ROWS_V726.find((row) => String(row.userId || "") === String(lineUserId));
    const name = document.getElementById("dashboardAccessName")?.value.trim()
      || selectedLine?.displayName
      || "";

    if (role === "approver" && !lineUserId) {
      accessSetState("เลือก LINE ของผู้อนุมัติก่อน เพื่อให้ระบบส่งงานไปหาเขาโดยตรง", "error");
      document.getElementById("dashboardAccessLineUserV726")?.focus();
      return;
    }

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
        body: JSON.stringify({ name, role, lineUserId }),
      });
      const record = out.record || {};
      if (record.url) await copyText(record.url);
      document.getElementById("dashboardAccessName").value = "";
      if (document.getElementById("dashboardAccessLineUserV726")) document.getElementById("dashboardAccessLineUserV726").value = "";
      accessSetState(
        record.url
          ? `สร้าง ${accessRoleLabel(record.role)} ให้ ${record.name || name} แล้ว${record.role === "approver" && record.lineUserId ? " · ผูก LINE แจ้งเตือนตรงแล้ว" : ""} · คัดลอกลิงก์ไว้ใน Clipboard แล้ว`
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
      if (me.role === "owner") {
        await Promise.all([loadDashboardAccessRows(), loadLineMembersV726()]);
      }
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
    .dash-access-line-field-v726{grid-column:1/-1;background:#f7f7f9;border-radius:12px;padding:10px 12px}
    .dash-access-line-field-v726 small{display:block;color:#86868b;font-size:10px;line-height:1.45;margin-top:6px}
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
/* Dashboard v7.15 — LINE Group Traceability
   - ดูว่าบัญชีนี้ผูก LINE กี่กลุ่ม
   - ดูยอด/สถานะเบิกของแต่ละกลุ่ม
   - ทุกแถวในโต๊ะเบิกจ่ายติดป้ายกลุ่มต้นทาง
*/
(() => {
  "use strict";

  let LINE_GROUPS = { ok:true, rows:[], groupCount:0, workspaceCount:0 };
  let LINE_GROUP_LOADING = false;
  let LINE_GROUP_LAST_LOAD = 0;
  let LINE_GROUP_SELECTED = "";

  function lineGroupApiUrl(refresh = false) {
    const u = new URL(`${WORKER}/api/line-groups`);
    u.searchParams.set("tenant", TENANT);
    u.searchParams.set("k", K);
    if (refresh) u.searchParams.set("refresh", "1");
    return u.toString();
  }

  function lineGroupMoney(v) {
    return "฿" + Number(v || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function lineGroupDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return String(v);
    return d.toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function lineGroupStatusLabel(key, raw = "") {
    if (key === "paid") return "จ่ายแล้ว";
    if (key === "payment") return "รอโอน";
    if (key === "correction") return "ต้องแก้ไข";
    if (key === "rejected") return "ไม่อนุมัติ";
    return raw || "รอตรวจ";
  }

  function lineGroupStatusClass(key) {
    if (key === "paid") return "paid";
    if (key === "payment") return "payment";
    if (key === "correction") return "correction";
    if (key === "rejected") return "rejected";
    return "review";
  }

  function maskGroupId(id = "") {
    const value = String(id || "");
    return value ? `···${value.slice(-6)}` : "—";
  }

  function visibleLineRows() {
    const all = Array.isArray(LINE_GROUPS.rows) ? LINE_GROUPS.rows : [];
    const chats = all.filter((r) => r.sourceType === "group" || r.sourceType === "room");
    return chats.length ? chats : all;
  }

  function ensureLineGroupMonitor() {
    const page = document.getElementById("page-batches");
    if (!page || document.getElementById("lineGroupMonitor")) return;

    const anchor = page.querySelector(".acct-status-strip") || page.firstElementChild;
    const section = document.createElement("section");
    section.id = "lineGroupMonitor";
    section.className = "line-group-monitor line-group-monitor-compact";
    section.innerHTML = `
      <div class="line-group-head">
        <div>
          <div class="head-kicker">LINE WORKSPACES</div>
          <h3>กลุ่ม LINE ที่ส่งรายการเข้าเบิก</h3>
          <p>เช็กได้ว่ามีกี่กลุ่ม แต่ละกลุ่มมีรายการอะไร และรายการบนโต๊ะเบิกจ่ายมาจากกลุ่มไหน</p>
        </div>
        <div class="line-group-head-actions">
          <div class="line-group-total"><span>กลุ่มที่เชื่อม</span><strong id="lineGroupCount">—</strong></div>
          <button class="btn" id="lineGroupRefresh" type="button">อัปเดตกลุ่ม</button>
        </div>
      </div>
      <div class="line-group-cards" id="lineGroupCards">
        <div class="line-group-loading">กำลังอ่าน LINE กลุ่ม…</div>
      </div>
    `;

    if (anchor) page.insertBefore(section, anchor);
    else page.prepend(section);

    document.getElementById("lineGroupRefresh")?.addEventListener("click", () => loadLineGroups(true));
  }

  function renderLineGroupMonitor() {
    ensureLineGroupMonitor();

    const count = document.getElementById("lineGroupCount");
    const cards = document.getElementById("lineGroupCards");
    if (!cards) return;

    const rows = visibleLineRows();
    if (count) count.textContent = String(
      Number(LINE_GROUPS.groupCount || 0) || rows.length || 0
    );

    if (!rows.length) {
      cards.innerHTML = `<div class="line-group-empty">ยังไม่พบ LINE กลุ่มที่ผูกกับบัญชีนี้</div>`;
      return;
    }

    cards.innerHTML = rows.map((row) => {
      const summary = row.summary || {};
      const current = row.isCurrent ? `<span class="line-current">กลุ่มปัจจุบัน</span>` : "";
      const connected = row.connected
        ? `<span class="line-connected">เชื่อมอยู่</span>`
        : `<span class="line-disconnected">ตรวจการเชื่อมต่อ</span>`;

      return `
        <div class="line-group-card">
          <div class="line-group-card-top">
            <div class="line-group-icon">LINE</div>
            <div class="line-group-name">
              <b>${esc(row.groupName || row.businessName || "LINE Group")}</b>
              <span>${esc(row.businessName || "")} · ${esc(maskGroupId(row.groupId || row.sourceId))}</span>
            </div>
            ${connected}
          </div>
          <div class="line-group-card-stats line-group-money-board">
            <div><span>ยอดเบิกรวม</span><strong>${esc(lineGroupMoney(Number(summary.openAmount || 0) + Number(summary.paidAmount || 0)))}</strong><small>${Number(summary.totalCount || 0)} รายการ</small></div>
            <div><span>ยอดรอจ่าย</span><strong>${esc(lineGroupMoney(summary.openAmount || 0))}</strong><small>${Number(summary.openCount || 0)} รายการ</small></div>
            <div><span>จ่ายแล้ว</span><strong>${esc(lineGroupMoney(summary.paidAmount || 0))}</strong><small>${Number(summary.paidCount || 0)} รายการ</small></div>
          </div>
          <div class="line-group-card-foot">
            ${current}
            <span>ล่าสุด ${esc(lineGroupDate(summary.lastActivityAt))}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  async function loadLineGroups(refresh = false) {
    if (LINE_GROUP_LOADING) return;
    LINE_GROUP_LOADING = true;
    ensureLineGroupMonitor();

    const cards = document.getElementById("lineGroupCards");
    const refreshBtn = document.getElementById("lineGroupRefresh");
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "กำลังอัปเดต…";
    }
    if (!LINE_GROUPS.rows?.length && cards) cards.innerHTML = `<div class="line-group-loading">กำลังอ่าน LINE กลุ่มและรายการเบิก…</div>`;

    try {
      const response = await fetch(lineGroupApiUrl(refresh), { cache: "no-store" });
      const raw = await response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: raw }; }
      if (!response.ok || data.ok === false) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      LINE_GROUPS = data;
      window.__LINE_GROUPS = data;
      LINE_GROUP_LAST_LOAD = Date.now();
      renderLineGroupMonitor();
      if (typeof window.renderCashPositionBoard === "function") window.renderCashPositionBoard();
    } catch (error) {
      if (cards) cards.innerHTML = `
        <div class="line-group-error">
          <b>โหลดข้อมูล LINE กลุ่มไม่สำเร็จ</b>
          <span>${esc(error?.message || error)}</span>
          <button class="btn" type="button" id="lineGroupRetry">ลองใหม่</button>
        </div>`;
      document.getElementById("lineGroupRetry")?.addEventListener("click", () => loadLineGroups(true));
    } finally {
      LINE_GROUP_LOADING = false;
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = "อัปเดตกลุ่ม";
      }
    }
  }

  function currentBatchSourceGroup() {
    return BATCH_DATA?.sourceGroup || null;
  }

  function decorateBatchRowsWithSourceGroup() {
    const source = currentBatchSourceGroup();
    const name = String(source?.groupName || "").trim();
    if (!name) return;

    const body = document.getElementById("batchMasterBody");
    if (!body) return;
    body.querySelectorAll("tr").forEach((row) => {
      let badge = row.querySelector(".line-source-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "line-source-badge";
        const target =
          row.querySelector('[data-label="ผู้เบิก"]') ||
          row.querySelector('[data-label="รายการ"]') ||
          row.cells?.[3] ||
          row;
        target.appendChild(badge);
      }
      badge.textContent = `LINE · ${name}`;
      badge.title = `รายการนี้ตั้งเบิกจากกลุ่ม ${name} (${maskGroupId(source.groupId || source.sourceId)})`;
    });
  }

  const renderMasterBeforeLineGroups = renderMasterTable;
  renderMasterTable = function(...args) {
    const result = renderMasterBeforeLineGroups.apply(this, args);
    decorateBatchRowsWithSourceGroup();
    return result;
  };

  const renderBatchesBeforeLineGroups = renderBatches;
  renderBatches = function(...args) {
    const result = renderBatchesBeforeLineGroups.apply(this, args);
    ensureLineGroupMonitor();
    decorateBatchRowsWithSourceGroup();
    if (!LINE_GROUP_LAST_LOAD || Date.now() - LINE_GROUP_LAST_LOAD > 60_000) {
      loadLineGroups(false);
    } else {
      renderLineGroupMonitor();
    }
    return result;
  };

  const style = document.createElement("style");
  style.textContent = `
    .line-group-monitor{margin:0 0 16px;background:#fff;border:1px solid #e5e5e7;border-radius:20px;padding:18px}
    .line-group-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
    .line-group-head h3{margin:4px 0 5px;font-size:18px}.line-group-head p{margin:0;color:#86868b;font-size:12px;line-height:1.55}
    .line-group-head-actions{display:flex;align-items:center;gap:9px}
    .line-group-total{background:#f5f5f7;border-radius:13px;padding:9px 12px;min-width:94px;text-align:center}
    .line-group-total span{display:block;font-size:9px;color:#86868b;font-weight:700}.line-group-total strong{display:block;font-size:20px;margin-top:2px}
    .line-group-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:15px}
    .line-group-card{border:1px solid #e5e5e7;background:#fff;border-radius:16px;padding:13px;text-align:left;color:#1d1d1f}
    .line-group-card:hover,.line-group-card.selected{border-color:#1d1d1f;box-shadow:0 5px 18px rgba(0,0,0,.05)}
    .line-group-card-top{display:flex;align-items:center;gap:9px}.line-group-icon{width:35px;height:35px;border-radius:10px;background:#f2f2f7;display:grid;place-items:center;font-size:9px;font-weight:850}
    .line-group-name{min-width:0;flex:1}.line-group-name b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.line-group-name span{display:block;color:#86868b;font-size:9px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .line-connected,.line-disconnected,.line-current{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:750;white-space:nowrap}
    .line-connected{background:#edf8f0;color:#147a36}.line-disconnected{background:#fff3e8;color:#925c00}.line-current{background:#f2f2f7;color:#525257}
    .line-group-card-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px}
    .line-group-card-stats div{background:#fafafa;border-radius:10px;padding:8px}.line-group-card-stats span{display:block;font-size:8px;color:#86868b}.line-group-card-stats strong{display:block;font-size:13px;margin-top:3px}
    .line-group-card-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;font-size:9px;color:#86868b}
    .line-group-detail{margin-top:12px;background:#f7f7f9;border-radius:16px;padding:14px}
    .line-group-detail-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.line-group-detail-head span{font-size:9px;color:#86868b;font-weight:700}.line-group-detail-head h4{font-size:16px;margin:2px 0}.line-group-detail-head small{color:#86868b;font-size:9px}
    .line-group-detail-actions{display:flex;gap:6px}.line-group-status-mini{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.line-group-status-mini span{background:#fff;border-radius:999px;padding:6px 9px;font-size:10px;color:#6e6e73}.line-group-status-mini b{color:#1d1d1f}
    .line-group-claim-list{background:#fff;border-radius:13px;overflow:hidden}.line-group-claim{display:flex;align-items:center;gap:12px;padding:11px 12px;border-top:1px solid #eeeeef}.line-group-claim:first-child{border-top:0}
    .line-group-claim-main{min-width:0;flex:1}.line-group-claim-main b{display:block;font-size:12px}.line-group-claim-main span,.line-group-claim-main small{display:block;color:#86868b;font-size:9px;margin-top:3px}
    .line-group-claim-right{text-align:right}.line-group-claim-right strong{display:block;font-size:12px}.line-claim-status{display:inline-flex;margin-top:5px;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:750;background:#f2f2f7;color:#5f6368}
    .line-claim-status.paid{background:#edf8f0;color:#147a36}.line-claim-status.payment{background:#eef4ff;color:#2457a7}.line-claim-status.correction,.line-claim-status.rejected{background:#fff0ef;color:#b42318}
    .line-source-badge{display:inline-flex;margin:6px 0 0 7px;border-radius:999px;padding:4px 7px;background:#eef4ff;color:#2457a7;font-size:9px;font-weight:750;vertical-align:middle}
    .line-group-loading,.line-group-empty,.line-group-error{grid-column:1/-1;padding:20px;text-align:center;color:#86868b;background:#fafafa;border-radius:14px;font-size:12px}
    .line-group-error b,.line-group-error span{display:block}.line-group-error span{margin:5px 0 10px;color:#b42318}
    @media(max-width:1000px){.line-group-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:760px){
      .line-group-monitor{padding:14px;margin-bottom:12px}.line-group-head{display:block}.line-group-head-actions{margin-top:10px;justify-content:space-between}
      .line-group-cards{grid-template-columns:1fr}.line-group-card-stats{grid-template-columns:repeat(3,1fr)}
      .line-group-detail-head{display:block}.line-group-detail-actions{margin-top:10px}.line-group-detail-actions .btn{flex:1}
      .line-group-claim{align-items:flex-start}.line-source-badge{display:flex;width:max-content;max-width:100%;margin-left:0}
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    if (currentPageKey() === "batches") {
      ensureLineGroupMonitor();
      loadLineGroups(false);
      decorateBatchRowsWithSourceGroup();
    }
  }, 0);

  console.info("[Dashboard] v7.15 LINE group traceability active");
})();

/* v7.15.1 — compact LINE workspace monitor */
(() => {
  const style = document.createElement("style");
  style.textContent = `
    #lineGroupMonitor.line-group-monitor-compact .line-group-card{
      cursor:default;
      box-shadow:none;
    }
    #lineGroupMonitor.line-group-monitor-compact .line-group-card:hover{
      border-color:#e5e5e7;
      box-shadow:none;
    }
    #lineGroupMonitor .line-group-detail{display:none!important}
  `;
  document.head.appendChild(style);
  console.info("[Dashboard] v7.15.1 compact LINE workspace monitor active");
})();

/* Dashboard v7.16 — Reimbursement Money Board + Manual Cash Position */
(() => {
  "use strict";

  const BALANCE_SETTING_KEY = "finance_balances";
  let BALANCE_EDIT_CHANNEL_ID = "";

  const BANK_LOGO_DIR = "/assets/bank-logos";
  const BANK_LOGO_BASES = {
    kbank: "กสิกร",
    scb: "ไทยพาณิชย์",
    bbl: "กรุงเทพ",
    ktb: "กรุงไทย",
    bay: "กรุงศรีอยุธยา",
    ttb: "ทหารไทยธนชาต",
    gsb: "ออมสิน",
    uob: "ยูโอบี",
    tisco: "ทิสโก้",
    baac: "ธกส",
    lhbank: "แลนด์ แอนด์ เฮ้าส์",
    icbc: "ไอซีบีซี ไทย",
    cimb: "ซีไอเอ็มบี ไทย",
    creditunion: "เครดิตยูเนี่ยน",
  };

  function bankLogoKey(account = {}) {
    const raw = [account.bank, account.label, account.name]
      .filter(Boolean).join(" ").normalize("NFKC").toLowerCase()
      .replace(/\s+/g, " ").trim();
    if (!raw) return "";
    if (/กสิกร|kasikorn|kbank/.test(raw)) return "kbank";
    if (/ไทยพาณิชย์|siam commercial|\bscb\b/.test(raw)) return "scb";
    if (/กรุงเทพ|bangkok bank|\bbbl\b/.test(raw)) return "bbl";
    if (/กรุงไทย|krung thai|krungthai|\bktb\b/.test(raw)) return "ktb";
    if (/กรุงศรี|อยุธยา|krungsri|bank of ayudhya|\bbay\b/.test(raw)) return "bay";
    if (/ทหารไทยธนชาต|ทีทีบี|\bttb\b|tmbthanachart/.test(raw)) return "ttb";
    if (/ออมสิน|government savings|\bgsb\b/.test(raw)) return "gsb";
    if (/ยูโอบี|\buob\b|united overseas/.test(raw)) return "uob";
    if (/ทิสโก้|\btisco\b/.test(raw)) return "tisco";
    if (/ธ\.?ก\.?ส|เพื่อการเกษตร|baac/.test(raw)) return "baac";
    if (/แลนด์\s*แอนด์\s*เฮ้าส์|แลนด์.*เฮ้าส์|land and houses|lh bank|lhbank/.test(raw)) return "lhbank";
    if (/ไอซีบีซี|\bicbc\b/.test(raw)) return "icbc";
    if (/ซีไอเอ็มบี|\bcimb\b/.test(raw)) return "cimb";
    if (/เครดิตยูเนี่ยน|credit union/.test(raw)) return "creditunion";
    return "";
  }

  function bankLogoCandidates(account = {}) {
    const key = bankLogoKey(account);
    const canonical = key ? BANK_LOGO_BASES[key] : "";
    const rawNames = [canonical, account.bank, account.label]
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    const uniqueNames = [...new Set(rawNames)];
    const exts = ["png", "jpg", "jpeg", "webp"];
    return uniqueNames.flatMap((name) => exts.map((ext) =>
      `${BANK_LOGO_DIR}/${encodeURIComponent(name)}.${ext}`
    ));
  }

  function bankLogoMarkup(account = {}) {
    const candidates = bankLogoCandidates(account);
    const fallback = financeChannelIcon(account);
    if (!candidates.length) return `<span class="bank-logo-fallback">${esc(fallback)}</span>`;
    return `<img class="bank-logo-img" src="${escAttr(candidates[0])}" data-bank-logo-list="${escAttr(candidates.join("|"))}" data-bank-logo-index="0" data-bank-logo-fallback="${escAttr(fallback)}" alt="${escAttr(financeChannelTitle(account))}">`;
  }

  function applyBankLogoToNode(node, account = {}) {
    if (!node) return;
    node.classList.add("has-bank-logo");
    node.innerHTML = bankLogoMarkup(account);
  }

  document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("bank-logo-img")) return;
    const list = String(img.dataset.bankLogoList || "").split("|").filter(Boolean);
    const nextIndex = Number(img.dataset.bankLogoIndex || 0) + 1;
    if (nextIndex < list.length) {
      img.dataset.bankLogoIndex = String(nextIndex);
      img.src = list[nextIndex];
      return;
    }
    const span = document.createElement("span");
    span.className = "bank-logo-fallback";
    span.textContent = img.dataset.bankLogoFallback || "FIN";
    img.replaceWith(span);
  }, true);

  function balanceMap() {
    const raw = SETTINGS?.[BALANCE_SETTING_KEY];
    if (!raw) return {};
    if (typeof raw === "object" && !Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function balanceRecord(channelId) {
    return balanceMap()[String(channelId || "")] || {};
  }

  function n(v) {
    const x = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(x) ? x : 0;
  }

  function money(v) {
    return "฿" + n(v).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function updatedText(v) {
    if (!v) return "ยังไม่เคยอัปเดต";
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return "ยังไม่เคยอัปเดต";
    return "อัปเดต " + d.toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function activeAccounts() {
    return financeChannels(false).filter((x) => x.active !== false);
  }

  function totals() {
    const accounts = activeAccounts();
    const balances = balanceMap();
    let totalBalance = 0;
    let updatedCount = 0;

    for (const account of accounts) {
      const rec = balances[account.id];
      if (!rec || rec.balance === "" || rec.balance == null) continue;
      totalBalance += n(rec.balance);
      updatedCount++;
    }

    const groupRows = Array.isArray(window.__LINE_GROUPS?.rows) ? window.__LINE_GROUPS.rows : [];
    const waiting = groupRows.reduce((sum, row) => sum + n(row?.summary?.openAmount), 0);

    return {
      totalBalance,
      waiting,
      after: totalBalance - waiting,
      updatedCount,
      accountCount: accounts.length,
    };
  }

  function ensureModal() {
    if (document.getElementById("cashBalanceModal")) return;
    const modal = document.createElement("div");
    modal.id = "cashBalanceModal";
    modal.className = "cash-balance-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="cash-balance-backdrop" data-cash-close></div>
      <section class="cash-balance-dialog" role="dialog" aria-modal="true">
        <div class="cash-balance-dialog-head">
          <div>
            <span>MANUAL BALANCE</span>
            <h3 id="cashBalanceTitle">อัปเดตยอดคงเหลือ</h3>
            <p id="cashBalanceSubtitle"></p>
          </div>
          <button type="button" class="cash-balance-x" data-cash-close>×</button>
        </div>
        <form id="cashBalanceForm">
          <label>
            <span>ยอดคงเหลือปัจจุบัน</span>
            <div class="cash-balance-input-wrap"><b>฿</b><input id="cashBalanceAmount" type="number" step="0.01" inputmode="decimal" required placeholder="0.00"></div>
          </label>
          <label>
            <span>หมายเหตุ (ไม่บังคับ)</span>
            <input id="cashBalanceNote" maxlength="160" placeholder="เช่น เช็กจาก K PLUS เวลา 10:30">
          </label>
          <div class="cash-balance-info">
            ยอดนี้เป็นตัวเลขที่ทีมอัปเดตเอง ระบบไม่ได้ดึงยอดสดจากธนาคาร และจะบันทึกเวลาอัปเดตล่าสุดทุกครั้ง
          </div>
          <div class="cash-balance-actions">
            <button class="btn" type="button" data-cash-close>ยกเลิก</button>
            <button class="btn solid" id="cashBalanceSave" type="submit">บันทึกยอดล่าสุด</button>
          </div>
        </form>
      </section>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-cash-close]")) closeBalanceModal();
    });
    document.getElementById("cashBalanceForm")?.addEventListener("submit", saveBalance);
  }

  function openBalanceModal(channelId) {
    ensureModal();
    const channel = financeChannels(false).find((x) => String(x.id) === String(channelId));
    if (!channel) return alert("ไม่พบบัญชีนี้");

    BALANCE_EDIT_CHANNEL_ID = String(channel.id);
    const rec = balanceRecord(channel.id);

    document.getElementById("cashBalanceTitle").textContent = `อัปเดตยอด · ${financeChannelTitle(channel)}`;
    document.getElementById("cashBalanceSubtitle").textContent = financeChannelDetail(channel);
    document.getElementById("cashBalanceAmount").value =
      rec.balance === "" || rec.balance == null ? "" : String(rec.balance);
    document.getElementById("cashBalanceNote").value = String(rec.note || "");

    document.getElementById("cashBalanceModal").hidden = false;
    document.body.classList.add("cash-balance-open");
    setTimeout(() => document.getElementById("cashBalanceAmount")?.focus(), 0);
  }

  function closeBalanceModal() {
    const modal = document.getElementById("cashBalanceModal");
    if (modal) modal.hidden = true;
    BALANCE_EDIT_CHANNEL_ID = "";
    document.body.classList.remove("cash-balance-open");
  }

  async function saveBalance(event) {
    event.preventDefault();
    const channelId = BALANCE_EDIT_CHANNEL_ID;
    const value = String(document.getElementById("cashBalanceAmount")?.value ?? "").trim();
    if (!channelId || value === "" || !Number.isFinite(Number(value))) {
      alert("กรอกยอดคงเหลือให้ถูกต้อง");
      return;
    }

    const button = document.getElementById("cashBalanceSave");
    if (button) {
      button.disabled = true;
      button.textContent = "กำลังบันทึก…";
    }

    const map = balanceMap();
    map[channelId] = {
      balance: Number(value),
      note: String(document.getElementById("cashBalanceNote")?.value || "").trim(),
      updatedAt: new Date().toISOString(),
      source: "manual",
    };

    try {
      const ok = await saveSettings({ [BALANCE_SETTING_KEY]: JSON.stringify(map) });
      if (!ok) throw new Error("บันทึกยอดไม่สำเร็จ");
      closeBalanceModal();
      renderCashPositionBoard();
      decorateFinanceCards();
    } catch (error) {
      alert(error?.message || "บันทึกยอดไม่สำเร็จ");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "บันทึกยอดล่าสุด";
      }
    }
  }

  function ensureBoard() {
    const page = document.getElementById("page-batches");
    if (!page || document.getElementById("cashPositionBoard")) return;

    const lineBoard = document.getElementById("lineGroupMonitor");
    const board = document.createElement("section");
    board.id = "cashPositionBoard";
    board.className = "cash-position-board";
    board.innerHTML = `
      <div class="cash-position-head">
        <div>
          <div class="head-kicker">CASH POSITION</div>
          <h3>ยอดเงินแต่ละบัญชี</h3>
          <p>อัปเดตยอดเองเพื่อให้ทีมรู้ว่าตอนนี้มีเงินพร้อมจ่ายเท่าไร · ไม่ได้เชื่อมยอดสดจากธนาคาร</p>
        </div>
        <button class="btn" id="cashManageAccounts" type="button">จัดการบัญชี</button>
      </div>
      <div class="cash-position-summary" id="cashPositionSummary"></div>
      <div class="cash-account-cards" id="cashAccountCards"></div>
    `;

    if (lineBoard) lineBoard.insertAdjacentElement("afterend", board);
    else page.prepend(board);

    document.getElementById("cashManageAccounts")?.addEventListener("click", () => {
      openBusiness("finance", document.querySelector('[data-biz="finance"]'));
    });

    document.getElementById("cashAccountCards")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-update-cash]");
      if (button) openBalanceModal(button.dataset.updateCash || "");
    });
  }

  function renderCashPositionBoard() {
    ensureBoard();
    const summary = document.getElementById("cashPositionSummary");
    const cards = document.getElementById("cashAccountCards");
    if (!summary || !cards) return;

    const t = totals();
    summary.innerHTML = `
      <div class="${t.totalBalance > 0 ? "positive" : t.totalBalance < 0 ? "negative" : ""}"><span>เงินคงเหลือรวม</span><strong>${money(t.totalBalance)}</strong><small>${t.updatedCount}/${t.accountCount} บัญชีมีการอัปเดตยอด</small></div>
      <div class="${t.waiting > 0 ? "positive" : t.waiting < 0 ? "negative" : ""}"><span>ยอดรอจ่ายจากใบเบิก</span><strong>${money(t.waiting)}</strong><small>รวมทุก LINE Workspace</small></div>
      <div class="${t.after > 0 ? "positive" : t.after < 0 ? "negative" : ""}"><span>คงเหลือหลังจ่ายยอดรอ</span><strong>${money(t.after)}</strong><small>${t.after < 0 ? "เงินที่อัปเดตล่าสุดไม่พอยอดรอจ่าย" : "ประมาณการจากยอดที่กรอกล่าสุด"}</small></div>
    `;

    const accounts = activeAccounts();
    if (!accounts.length) {
      cards.innerHTML = `<div class="cash-empty"><b>ยังไม่มีบัญชีสำหรับติดตามยอด</b><span>เพิ่มได้ที่ จัดการธุรกิจ → บัญชีและช่องทางการเงิน</span></div>`;
      return;
    }

    cards.innerHTML = accounts.map((account) => {
      const rec = balanceRecord(account.id);
      const hasBalance = rec.balance !== "" && rec.balance != null;
      return `
        <article class="cash-account-card ${hasBalance && n(rec.balance) > 0 ? "positive" : hasBalance && n(rec.balance) < 0 ? "negative" : ""}">
          <div class="cash-account-top">
            <div class="finance-account-icon has-bank-logo">${bankLogoMarkup(account)}</div>
            <div>
              <b>${esc(financeChannelTitle(account))}</b>
              <span>${esc(financeChannelDetail(account))}</span>
            </div>
          </div>
          <div class="cash-account-balance ${hasBalance ? (n(rec.balance) > 0 ? "positive" : n(rec.balance) < 0 ? "negative" : "") : "empty"}">${hasBalance ? esc(money(rec.balance)) : "ยังไม่ใส่ยอด"}</div>
          <div class="cash-account-meta">
            <span>${esc(updatedText(rec.updatedAt))}</span>
            ${rec.note ? `<small>${esc(rec.note)}</small>` : ""}
          </div>
          <button class="btn small" type="button" data-update-cash="${escAttr(account.id)}">${hasBalance ? "อัปเดตยอด" : "+ ใส่ยอดปัจจุบัน"}</button>
        </article>
      `;
    }).join("");
  }

  function decorateFinanceCards() {
    const list = document.getElementById("financeList");
    if (!list) return;

    const accounts = financeChannels(false);
    list.querySelectorAll(".finance-account-card").forEach((card, index) => {
      const account = accounts[index];
      if (!account) return;

      applyBankLogoToNode(card.querySelector(".finance-account-icon"), account);
      card.querySelector(".finance-balance-inline")?.remove();
      const rec = balanceRecord(account.id);
      const hasBalance = rec.balance !== "" && rec.balance != null;

      const block = document.createElement("div");
      block.className = `finance-balance-inline ${hasBalance && n(rec.balance) > 0 ? "positive" : hasBalance && n(rec.balance) < 0 ? "negative" : ""}`;
      block.innerHTML = `
        <div>
          <span>ยอดคงเหลือล่าสุด</span>
          <strong>${hasBalance ? esc(money(rec.balance)) : "ยังไม่ใส่ยอด"}</strong>
          <small>${esc(updatedText(rec.updatedAt))}</small>
        </div>
        <button class="btn small" type="button" data-finance-balance="${escAttr(account.id)}">${hasBalance ? "อัปเดตยอด" : "+ ใส่ยอด"}</button>
      `;

      const actions = card.querySelector(".finance-account-actions");
      if (actions) card.insertBefore(block, actions);
      else card.appendChild(block);
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-finance-balance]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    openBalanceModal(button.dataset.financeBalance || "");
  });

  const renderBusinessCore = renderBusiness;
  renderBusiness = function(...args) {
    const result = renderBusinessCore.apply(this, args);
    if (BUSINESS_TAB === "finance") decorateFinanceCards();
    return result;
  };

  const renderBatchesCore = renderBatches;
  renderBatches = function(...args) {
    const result = renderBatchesCore.apply(this, args);
    renderCashPositionBoard();
    return result;
  };

  window.renderCashPositionBoard = renderCashPositionBoard;

  const style = document.createElement("style");
  style.textContent = `
    .line-group-money-board div small{display:block;margin-top:3px;font-size:8px;color:#86868b;font-weight:500}
    .cash-position-board{margin:0 0 16px;background:#fff;border:1px solid #e5e5e7;border-radius:20px;padding:18px}
    .cash-position-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
    .cash-position-head h3{margin:4px 0 5px;font-size:18px}.cash-position-head p{margin:0;color:#86868b;font-size:12px;line-height:1.5}
    .cash-position-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:15px}
    .cash-position-summary>div{background:#f7f7f9;border-radius:14px;padding:12px}
    .cash-position-summary span{display:block;color:#86868b;font-size:9px}.cash-position-summary strong{display:block;font-size:19px;margin-top:4px}.cash-position-summary small{display:block;color:#86868b;font-size:9px;margin-top:3px}
    .cash-position-summary .positive strong,.cash-account-card.positive .cash-account-balance,.cash-account-balance.positive,.finance-balance-inline.positive strong{color:#16a34a}
    .cash-position-summary .negative strong,.cash-account-card.negative .cash-account-balance,.cash-account-balance.negative,.finance-balance-inline.negative strong{color:#d92d20}
    .cash-account-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:10px}
    .cash-account-card{border:1px solid #e5e5e7;border-radius:15px;padding:12px;background:#fff}
    .cash-account-top{display:flex;align-items:center;gap:9px;min-width:0}.cash-account-top>div:last-child{min-width:0}
    .cash-account-top b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cash-account-top span{display:block;color:#86868b;font-size:8px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .finance-account-icon.has-bank-logo{overflow:hidden;background:#fff;border:1px solid #ececf0;padding:3px}
    .bank-logo-img{display:block;width:100%;height:100%;object-fit:contain;border-radius:7px;background:#fff}
    .bank-logo-fallback{display:grid;width:100%;height:100%;place-items:center;font-size:10px;font-weight:800;color:#1d1d1f}
    .cash-account-balance{font-size:18px;font-weight:800;margin-top:13px}.cash-account-balance.empty{font-size:12px;color:#86868b;font-weight:650}
    .cash-account-meta{min-height:29px;margin:5px 0 9px}.cash-account-meta span,.cash-account-meta small{display:block;color:#86868b;font-size:8px;line-height:1.4}.cash-account-meta small{color:#6e6e73;margin-top:2px}
    .cash-account-card>.btn{width:100%}
    .cash-empty{grid-column:1/-1;background:#fafafa;border-radius:14px;padding:18px;text-align:center}.cash-empty b,.cash-empty span{display:block}.cash-empty span{font-size:10px;color:#86868b;margin-top:4px}
    .finance-balance-inline{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0;padding:10px 12px;background:#f7f7f9;border-radius:12px}
    .finance-balance-inline span,.finance-balance-inline small{display:block;color:#86868b;font-size:9px}.finance-balance-inline strong{display:block;font-size:16px;margin:2px 0}
    .cash-balance-modal[hidden]{display:none!important}.cash-balance-modal{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:18px}
    .cash-balance-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.28);backdrop-filter:blur(3px)}
    .cash-balance-dialog{position:relative;width:min(440px,100%);background:#fff;border-radius:22px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.2)}
    .cash-balance-dialog-head{display:flex;justify-content:space-between;gap:15px}.cash-balance-dialog-head span{font-size:9px;font-weight:800;letter-spacing:.08em;color:#86868b}.cash-balance-dialog-head h3{margin:4px 0;font-size:20px}.cash-balance-dialog-head p{margin:0;color:#86868b;font-size:10px}
    .cash-balance-x{border:0;background:#f2f2f7;border-radius:50%;width:32px;height:32px;font-size:20px}
    #cashBalanceForm{display:grid;gap:13px;margin-top:18px}#cashBalanceForm label>span{display:block;font-size:10px;font-weight:700;margin-bottom:6px;color:#6e6e73}
    #cashBalanceForm input{width:100%;height:46px;border:1px solid #e5e5e7;border-radius:12px;padding:0 12px;font:inherit}
    .cash-balance-input-wrap{position:relative}.cash-balance-input-wrap b{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:16px}.cash-balance-input-wrap input{padding-left:32px!important;font-size:18px!important;font-weight:750}
    .cash-balance-info{font-size:10px;line-height:1.55;color:#6e6e73;background:#f7f7f9;border-radius:12px;padding:10px 12px}
    .cash-balance-actions{display:flex;justify-content:flex-end;gap:8px}.cash-balance-open{overflow:hidden}
    @media(max-width:1100px){.cash-account-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:760px){
      .cash-position-board{padding:14px}.cash-position-head{display:block}.cash-position-head>.btn{margin-top:10px;width:100%}
      .cash-position-summary{grid-template-columns:1fr}.cash-account-cards{grid-template-columns:1fr}
      .cash-balance-actions .btn{flex:1}
    }
  `;
  document.head.appendChild(style);

  ensureModal();
  setTimeout(() => {
    if (currentPageKey() === "batches") renderCashPositionBoard();
    if (currentPageKey() === "business" && BUSINESS_TAB === "finance") decorateFinanceCards();
  }, 0);

  console.info("[Dashboard] v7.16 cash position active");
})();

/* Dashboard v7.16.3 — Bank / Provider Dropdown */
(() => {
  "use strict";

  const BANK_OPTIONS = [
    ["", "เลือกธนาคาร"],
    ["กสิกร", "ธนาคารกสิกรไทย (KBank)"],
    ["ไทยพาณิชย์", "ธนาคารไทยพาณิชย์ (SCB)"],
    ["กรุงเทพ", "ธนาคารกรุงเทพ (BBL)"],
    ["กรุงไทย", "ธนาคารกรุงไทย (KTB)"],
    ["กรุงศรีอยุธยา", "ธนาคารกรุงศรีอยุธยา (Krungsri)"],
    ["ทหารไทยธนชาต", "ธนาคารทหารไทยธนชาต (ttb)"],
    ["ออมสิน", "ธนาคารออมสิน (GSB)"],
    ["ยูโอบี", "ธนาคารยูโอบี (UOB)"],
    ["ทิสโก้", "ธนาคารทิสโก้ (TISCO)"],
    ["ธกส", "ธ.ก.ส. (BAAC)"],
    ["แลนด์ แอนด์ เฮ้าส์", "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)"],
    ["ไอซีบีซี ไทย", "ธนาคารไอซีบีซี (ไทย) (ICBC)"],
    ["ซีไอเอ็มบี ไทย", "ธนาคารซีไอเอ็มบี ไทย (CIMB)"],
    ["เครดิตยูเนี่ยน", "เครดิตยูเนี่ยน"],
  ];

  function financeTypeNow() {
    return String(document.getElementById("finType")?.value || "bank");
  }

  function bankSelectNeeded(type = financeTypeNow()) {
    return type === "bank" || type === "promptpay";
  }

  function copyControlAttributes(from, to) {
    if (!from || !to) return;
    to.id = "finBank";
    to.name = from.name || "finBank";
    to.className = from.className || "";
    to.disabled = from.disabled;
    to.required = from.required;
    if (from.getAttribute("aria-label")) to.setAttribute("aria-label", from.getAttribute("aria-label"));
  }

  function addLegacyBankOption(select, value) {
    const val = String(value || "").trim();
    if (!val) return;
    if ([...select.options].some((o) => o.value === val)) return;
    const option = document.createElement("option");
    option.value = val;
    option.textContent = `${val} (ข้อมูลเดิม)`;
    select.appendChild(option);
  }

  function makeBankSelect(currentValue = "") {
    const select = document.createElement("select");
    select.innerHTML = BANK_OPTIONS.map(([value, label]) =>
      `<option value="${escAttr(value)}">${esc(label)}</option>`
    ).join("");
    addLegacyBankOption(select, currentValue);
    select.value = String(currentValue || "");
    return select;
  }

  function makeProviderInput(currentValue = "", type = financeTypeNow()) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = String(currentValue || "");
    input.autocomplete = "off";
    input.placeholder = type === "ewallet"
      ? "เช่น TrueMoney, ShopeePay"
      : type === "cash"
        ? "ไม่ต้องระบุสำหรับเงินสด"
        : "ธนาคาร / ผู้ให้บริการ";
    return input;
  }

  function syncFinanceBankControl({ value, focus = false } = {}) {
    const current = document.getElementById("finBank");
    if (!current) return null;
    const type = financeTypeNow();
    const currentValue = value !== undefined ? String(value || "") : String(current.value || "");
    const wantSelect = bankSelectNeeded(type);
    const isSelect = current.tagName === "SELECT";

    if (wantSelect === isSelect) {
      if (wantSelect) addLegacyBankOption(current, currentValue);
      if (value !== undefined) current.value = currentValue;
      current.required = type !== "cash";
      current.disabled = type === "cash";
      if (focus) current.focus();
      return current;
    }

    const next = wantSelect ? makeBankSelect(currentValue) : makeProviderInput(currentValue, type);
    copyControlAttributes(current, next);
    next.required = type !== "cash";
    next.disabled = type === "cash";
    current.replaceWith(next);
    if (focus) next.focus();
    return next;
  }

  function installFinanceTypeListener() {
    const type = document.getElementById("finType");
    if (!type || type.dataset.bankDropdownInstalled === "1") return;
    type.dataset.bankDropdownInstalled = "1";
    type.addEventListener("change", () => {
      const existing = document.getElementById("finBank");
      const oldValue = existing?.value || "";
      const next = syncFinanceBankControl({ value: financeTypeNow() === "cash" ? "" : oldValue });
      if (next && financeTypeNow() === "cash") next.value = "";
    });
  }

  const coreResetFinanceForm = resetFinanceForm;
  resetFinanceForm = function(...args) {
    const result = coreResetFinanceForm.apply(this, args);
    syncFinanceBankControl({ value: "" });
    installFinanceTypeListener();
    return result;
  };

  const coreFillFinanceForm = fillFinanceForm;
  fillFinanceForm = function(index, ...args) {
    const channel = financeChannels(false)[index];
    if (channel && document.getElementById("finType")) {
      document.getElementById("finType").value = channel.type || "bank";
      syncFinanceBankControl({ value: channel.bank || "" });
    }
    const result = coreFillFinanceForm.call(this, index, ...args);
    syncFinanceBankControl({ value: channel?.bank || "" });
    installFinanceTypeListener();
    return result;
  };

  const coreRenderBusinessBankDropdown = renderBusiness;
  renderBusiness = function(...args) {
    const result = coreRenderBusinessBankDropdown.apply(this, args);
    if (BUSINESS_TAB === "finance") {
      syncFinanceBankControl();
      installFinanceTypeListener();
    }
    return result;
  };

  const style = document.createElement("style");
  style.textContent = `
    #finBank{width:100%;min-height:46px}
    #finBank:disabled{opacity:.55;cursor:not-allowed}
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    syncFinanceBankControl();
    installFinanceTypeListener();
  }, 0);

  console.info("[Dashboard] v7.16.3 bank dropdown active");
})();


/* Dashboard v7.17 — FC-style Guided Tours */
(() => {
  "use strict";

  const TOUR_RED = "#ff3b30";
  let tourState = null;
  let tourRaf = 0;
  let tourResizeTimer = 0;

  const tours = {
    overview: {
      title: "ภาพรวมการเงิน",
      steps: [
        { target: "#page-overview .kpis", title: "สรุปตัวเลขสำคัญ", text: "ดูเงินที่จ่ายจริง ยอดรอดำเนินการ และยอดตั้งเบิกทั้งหมดจากตรงนี้" },
        { target: "#trend", title: "แนวโน้มเงินออกจริง", text: "กราฟนี้นับเฉพาะรายการที่บันทึกว่าจ่ายแล้ว เพื่อให้เห็น Cash Out จริง" },
        { target: "#recent", title: "รายการล่าสุด", text: "ดูรายการที่เพิ่งเข้าระบบล่าสุด แล้วเปิดรายละเอียดต่อได้จากหน้านี้" },
      ],
    },
    batches: {
      title: "เบิกจ่าย",
      steps: [
        { target: "#lineGroupMonitor", title: "LINE Workspaces", text: "ดูว่ารายการเบิกมาจาก LINE กลุ่มไหน และแต่ละกลุ่มมียอดเบิกรวม ยอดรอ และยอดที่จ่ายแล้วเท่าไร" },
        { target: "#cashPositionBoard", title: "ยอดเงินพร้อมจ่าย", text: "ดูยอดคงเหลือแต่ละบัญชี เปรียบเทียบกับยอดรอจ่าย และอัปเดตยอดบัญชีล่าสุดได้เอง" },
        { target: "#batchMasterBody", title: "โต๊ะทำงานเบิกจ่าย", text: "งานทั้งหมดอยู่ในตารางนี้ ตั้งแต่รอตรวจ ต้องแก้ รอโอน จนถึงจ่ายแล้ว" },
        { target: "#batchMasterCreate, #mobileBatchDockCreate", title: "รวมเป็นใบเบิก", text: "เลือกรายการที่ต้องการ แล้วรวมเป็นใบเบิกตามรอบได้จากปุ่มนี้" },
        { target: "#batchMasterPaymentInput, #batchMasterBody", title: "บันทึกการโอน", text: "เมื่อเอกสารผ่าน ให้เลือกบัญชีที่จ่าย อัปโหลดหลักฐานการโอน แล้วระบบจะเปลี่ยนสถานะเป็นจ่ายแล้ว" },
      ],
    },
    expenses: {
      title: "ทะเบียนรายจ่าย",
      steps: [
        { target: "#expenseStatusTabs", title: "กรองตามสถานะ", text: "เลือกดูรายการตามสถานะ เช่น รอดำเนินการหรือจ่ายแล้วได้ทันที" },
        { target: "#page-expenses .expense-toolbar", title: "ค้นหาและกรอง", text: "ค้นหาร้าน ผู้เบิก หมวด ช่วงวันที่ หรือเรียงยอดได้จากแถบนี้" },
        { target: "#page-expenses .expense-table-wrap", title: "รายการรายจ่าย", text: "ดูผู้เบิก ยอด สถานะ และเอกสารในตารางเดียว กดรายการเพื่อดูรายละเอียดเพิ่มเติม" },
      ],
    },
    income: {
      title: "รายรับและลูกหนี้",
      steps: [
        { target: "#page-income .income-kpis", title: "สรุปรายรับ", text: "ดูยอดขาย เงินเข้าจริง ลูกหนี้คงค้าง VAT และรายการเกินกำหนด" },
        { target: "#incomeCreate", title: "บันทึกรายรับ", text: "สร้างรายรับหรือ Invoice ใหม่จากปุ่มนี้ และเลือกรับเงินทันทีได้" },
        { target: "#page-income .income-table-wrap", title: "ติดตามลูกหนี้", text: "ดูว่าแต่ละลูกค้ารับเงินแล้วเท่าไร คงค้างเท่าไร และสถานะล่าสุด" },
        { target: "#incomeReconBtn", title: "กระทบเงินเข้า", text: "ใช้จับคู่รายการเงินเข้าจากธนาคารกับรายรับที่บันทึกไว้" },
      ],
    },
    reconciliation: {
      title: "กระทบยอด",
      steps: [
        { target: "#page-reconciliation", title: "กระทบยอดธนาคาร", text: "นำ Statement เข้ามา แล้วตรวจว่ารายการไหนจับคู่กับเงินที่จ่ายหรือรับในระบบแล้ว" },
      ],
    },
    reports: {
      title: "รายงานและภาษี",
      steps: [
        { target: "#page-reports", title: "รายงานสำหรับบัญชี", text: "เลือกช่วงเวลา ตรวจยอด แล้วส่งออกข้อมูลให้ฝ่ายบัญชีจากหน้านี้" },
      ],
    },
    bills: {
      title: "เอกสารทั้งหมด",
      steps: [
        { target: "#page-bills", title: "ศูนย์รวมเอกสาร", text: "ดูใบเบิก ใบแทน หลักฐาน และเอกสารที่ระบบสร้างไว้จากที่นี่" },
      ],
    },
    email: {
      title: "เอกสารจากอีเมล",
      steps: [
        { target: "#page-email", title: "รับเอกสารจาก Gmail", text: "เอกสารที่ระบบพบจาก Gmail จะมาอยู่หน้านี้ให้ตรวจและนำเข้าระบบ" },
      ],
    },
    subscriptions: {
      title: "รายจ่ายประจำ",
      steps: [
        { target: "#page-subscriptions", title: "ติดตามรายจ่ายประจำ", text: "ดูรายการที่เกิดซ้ำและตรวจเอกสารประจำจากหน้านี้" },
      ],
    },
    activity: {
      title: "ประวัติการทำงาน",
      steps: [
        { target: "#page-activity", title: "ประวัติการทำงาน", text: "ดูว่าใครทำอะไรกับรายการและเอกสารล่าสุดในระบบ" },
      ],
    },
    settings: {
      title: "ระบบและการเชื่อมต่อ",
      steps: [
        { target: "#page-settings", title: "ตรวจการเชื่อมต่อ", text: "ใช้หน้านี้ตรวจ Google, Sheet, Drive และการเชื่อมต่อที่ระบบต้องใช้" },
      ],
    },
    billing: {
      title: "แพ็กเกจ",
      steps: [
        { target: "#page-billing", title: "แพ็กเกจและโควตา", text: "ดูแพ็กเกจปัจจุบัน จำนวนเอกสารที่ใช้ และสิทธิ์ของบริษัทจากหน้านี้" },
      ],
    },
    business_profile: {
      title: "ข้อมูลบริษัท",
      steps: [
        { target: "#biz-profile", title: "ข้อมูลบริษัท", text: "กรอกข้อมูลบริษัทที่ใช้ในเอกสารและ Dashboard ให้ครบจากหน้านี้" },
      ],
    },
    business_approver: {
      title: "ผู้อนุมัติและลายเซ็น",
      steps: [
        { target: "#biz-approver", title: "ผู้อนุมัติ", text: "กำหนดชื่อผู้อนุมัติและลายเซ็นที่จะใช้กับเอกสารเบิกจ่าย" },
      ],
    },
    business_finance: {
      title: "บัญชีและช่องทางการเงิน",
      steps: [
        { target: "#finType", title: "เลือกประเภทบัญชี", text: "เลือกว่าช่องทางนี้เป็นบัญชีธนาคาร พร้อมเพย์ e-Wallet หรือเงินสด" },
        { target: "#finBank", title: "เลือกธนาคาร", text: "เลือกธนาคารจาก Dropdown ระบบจะใช้ชื่อเดียวกันกับโลโก้และการตรวจสลิป" },
        { target: "#addFinance", title: "บันทึกช่องทาง", text: "กรอกเลขบัญชีและชื่อบัญชีให้ครบ แล้วบันทึกช่องทางการเงิน" },
        { target: "#financeList", title: "บัญชีที่ใช้งาน", text: "บัญชีทั้งหมดอยู่ตรงนี้ สามารถแก้ไข ปิดใช้งาน ตั้งบัญชีหลัก และอัปเดตยอดคงเหลือได้" },
      ],
    },
    business_team: {
      title: "ทีมและผู้ใช้งาน",
      steps: [
        { target: "#dashboardAccessCard", title: "สิทธิ์เข้า Dashboard", text: "Owner สร้างลิงก์แยกให้บัญชี ผู้อนุมัติ หรือผู้ดูอย่างเดียวได้จากตรงนี้" },
        { target: "#biz-team", title: "ข้อมูลผู้ใช้งาน", text: "จัดการข้อมูลผู้เบิกและข้อมูลบัญชีรับเงินของทีมในบริษัท" },
      ],
    },
    business_categories: {
      title: "หมวดหมู่",
      steps: [
        { target: "#biz-categories", title: "หมวดหมู่ของธุรกิจ", text: "เพิ่มหรือตรวจหมวดหมู่ที่บริษัทใช้กับรายรับและรายจ่าย" },
      ],
    },
  };

  function tourKey() {
    const page = typeof currentPageKey === "function" ? currentPageKey() : "overview";
    if (page === "business") return `business_${String(BUSINESS_TAB || "profile")}`;
    return page;
  }

  function currentTour() {
    return tours[tourKey()] || null;
  }

  function ensureTourButton() {
    const head = document.querySelector(".main > .head");
    if (!head) return;
    let button = document.getElementById("guidedTourButton");
    if (!button) {
      button = document.createElement("button");
      button.id = "guidedTourButton";
      button.type = "button";
      button.className = "guided-tour-button";
      button.innerHTML = `<span>▶</span><b>วิธีใช้หน้านี้</b>`;
      button.addEventListener("click", () => startTour());
      const sync = document.getElementById("syncState");
      if (sync) head.insertBefore(button, sync);
      else head.appendChild(button);
    }
    const tour = currentTour();
    button.hidden = !tour;
    button.title = tour ? `วิธีใช้งาน · ${tour.title}` : "วิธีใช้งาน";
  }

  function ensureTourDom() {
    if (document.getElementById("guidedTourLayer")) return;
    const layer = document.createElement("div");
    layer.id = "guidedTourLayer";
    layer.className = "guided-tour-layer";
    layer.hidden = true;
    layer.innerHTML = `
      <div class="tour-mask tour-mask-top"></div>
      <div class="tour-mask tour-mask-left"></div>
      <div class="tour-mask tour-mask-right"></div>
      <div class="tour-mask tour-mask-bottom"></div>
      <div class="tour-focus-box"><span class="tour-step-pin">1</span></div>
      <section class="tour-card" role="dialog" aria-modal="true" aria-live="polite">
        <div class="tour-card-top"><span class="tour-progress">ขั้นตอน 1 จาก 1</span><button class="tour-close" type="button" aria-label="ปิด">×</button></div>
        <h3 class="tour-title"></h3>
        <p class="tour-text"></p>
        <div class="tour-actions">
          <button class="tour-skip" type="button">ออกจากวิธีใช้</button>
          <div>
            <button class="tour-prev" type="button">ย้อนกลับ</button>
            <button class="tour-next" type="button">ถัดไป</button>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(layer);
    layer.querySelector(".tour-close").addEventListener("click", endTour);
    layer.querySelector(".tour-skip").addEventListener("click", endTour);
    layer.querySelector(".tour-prev").addEventListener("click", () => moveTour(-1));
    layer.querySelector(".tour-next").addEventListener("click", () => moveTour(1));
  }

  function visibleTarget(selector) {
    const nodes = [...document.querySelectorAll(selector)];
    return nodes.find((node) => {
      const r = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return r.width > 0 && r.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }) || null;
  }

  function validSteps(def) {
    return (def?.steps || []).filter((step) => visibleTarget(step.target));
  }

  function startTour() {
    const def = currentTour();
    if (!def) return;
    ensureTourDom();
    const steps = validSteps(def);
    if (!steps.length) return;
    tourState = { key: tourKey(), title: def.title, steps, index: 0 };
    const layer = document.getElementById("guidedTourLayer");
    layer.hidden = false;
    document.body.classList.add("guided-tour-open");
    showTourStep(true);
  }

  function endTour() {
    cancelAnimationFrame(tourRaf);
    tourState = null;
    const layer = document.getElementById("guidedTourLayer");
    if (layer) layer.hidden = true;
    document.body.classList.remove("guided-tour-open");
  }

  function moveTour(delta) {
    if (!tourState) return;
    const next = tourState.index + delta;
    if (next >= tourState.steps.length) {
      endTour();
      return;
    }
    if (next < 0) return;
    tourState.index = next;
    showTourStep(true);
  }

  function setMask(el, left, top, width, height) {
    Object.assign(el.style, {
      left: `${Math.max(0, left)}px`,
      top: `${Math.max(0, top)}px`,
      width: `${Math.max(0, width)}px`,
      height: `${Math.max(0, height)}px`,
    });
  }

  function positionTour() {
    if (!tourState) return;
    const layer = document.getElementById("guidedTourLayer");
    const step = tourState.steps[tourState.index];
    const target = visibleTarget(step.target);
    if (!layer || !target) return;

    const vw = innerWidth;
    const vh = innerHeight;
    const pad = vw <= 760 ? 7 : 10;
    const raw = target.getBoundingClientRect();
    const left = Math.max(6, raw.left - pad);
    const top = Math.max(6, raw.top - pad);
    const right = Math.min(vw - 6, raw.right + pad);
    const bottom = Math.min(vh - 6, raw.bottom + pad);
    const width = Math.max(20, right - left);
    const height = Math.max(20, bottom - top);

    setMask(layer.querySelector(".tour-mask-top"), 0, 0, vw, top);
    setMask(layer.querySelector(".tour-mask-left"), 0, top, left, height);
    setMask(layer.querySelector(".tour-mask-right"), right, top, vw - right, height);
    setMask(layer.querySelector(".tour-mask-bottom"), 0, bottom, vw, vh - bottom);

    const focus = layer.querySelector(".tour-focus-box");
    Object.assign(focus.style, {
      left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
    });

    const pin = layer.querySelector(".tour-step-pin");
    pin.textContent = String(tourState.index + 1);

    const card = layer.querySelector(".tour-card");
    const mobile = vw <= 760;

    if (mobile) {
      // Mobile = stable bottom sheet. Do not chase the highlighted target around the screen.
      // Keep it above the dashboard bottom navigation and safe area.
      card.style.width = `${Math.max(260, vw - 24)}px`;
      card.style.left = "12px";
      card.style.right = "12px";
      card.style.top = "auto";
      card.style.bottom = "calc(92px + env(safe-area-inset-bottom, 0px))";
    } else {
      card.style.bottom = "auto";
      card.style.right = "auto";
      const cardWidth = Math.min(vw - 24, 380);
      card.style.width = `${cardWidth}px`;
      card.style.left = `${Math.min(Math.max(12, left), vw - cardWidth - 12)}px`;
      card.style.top = "12px";

      const cardRect = card.getBoundingClientRect();
      const below = bottom + 14;
      const above = top - cardRect.height - 14;
      let cardTop;
      if (below + cardRect.height <= vh - 12) cardTop = below;
      else if (above >= 12) cardTop = above;
      else cardTop = Math.max(12, Math.min(vh - cardRect.height - 12, vh / 2 - cardRect.height / 2));
      card.style.top = `${cardTop}px`;
    }
  }

  function showTourStep(scroll) {
    if (!tourState) return;
    const layer = document.getElementById("guidedTourLayer");
    const step = tourState.steps[tourState.index];
    const target = visibleTarget(step.target);
    if (!target) {
      moveTour(1);
      return;
    }

    layer.querySelector(".tour-progress").textContent = `ขั้นตอน ${tourState.index + 1} จาก ${tourState.steps.length}`;
    layer.querySelector(".tour-title").textContent = step.title;
    layer.querySelector(".tour-text").textContent = step.text;
    const prev = layer.querySelector(".tour-prev");
    prev.disabled = tourState.index === 0;
    layer.querySelector(".tour-next").textContent = tourState.index === tourState.steps.length - 1 ? "เข้าใจแล้ว" : "ถัดไป";

    const doPosition = () => {
      cancelAnimationFrame(tourRaf);
      tourRaf = requestAnimationFrame(positionTour);
    };

    if (scroll) {
      if (innerWidth <= 760) {
        const rect = target.getBoundingClientRect();
        const desiredTop = Math.max(110, Math.round(innerHeight * 0.22));
        const nextTop = Math.max(0, window.scrollY + rect.top - desiredTop);
        window.scrollTo({ top: nextTop, behavior: "smooth" });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
      setTimeout(doPosition, 260);
      setTimeout(doPosition, 520);
      setTimeout(doPosition, 760);
    } else doPosition();
  }

  const style = document.createElement("style");
  style.textContent = `
    .guided-tour-button{height:36px;border:1px solid #dedee2;background:#fff;color:#1d1d1f;border-radius:12px;padding:0 11px;display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:11px;font-weight:750;white-space:nowrap;cursor:pointer}
    .guided-tour-button:hover{background:#f7f7f9}.guided-tour-button>span{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#1d1d1f;color:#fff;font-size:11px;font-weight:850}
    .guided-tour-layer[hidden]{display:none!important}.guided-tour-layer{position:fixed;inset:0;z-index:2147483000;pointer-events:none}
    .tour-mask{position:fixed;background:rgba(0,0,0,.68);pointer-events:auto;transition:all .18s ease}
    .tour-focus-box{position:fixed;border:4px solid ${TOUR_RED};border-radius:14px;box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 28px rgba(255,59,48,.28);pointer-events:none;transition:all .18s ease;z-index:2}
    .tour-step-pin{position:absolute;left:-14px;top:-14px;width:31px;height:31px;border-radius:50%;background:${TOUR_RED};color:#fff;display:grid;place-items:center;font-size:14px;font-weight:900;box-shadow:0 3px 12px rgba(0,0,0,.28)}
    .tour-card{position:fixed;background:#fff;border-radius:18px;padding:16px;box-shadow:0 18px 60px rgba(0,0,0,.28);pointer-events:auto;z-index:3;color:#1d1d1f}
    .tour-card-top{display:flex;align-items:center;justify-content:space-between}.tour-progress{display:inline-flex;background:#fff0ef;color:#d92d20;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:850}.tour-close{width:28px;height:28px;border:0;border-radius:50%;background:#f2f2f7;color:#6e6e73;font-size:18px;cursor:pointer}
    .tour-title{font-size:18px;margin:12px 0 5px}.tour-text{margin:0;color:#6e6e73;font-size:12px;line-height:1.6}
    .tour-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:15px}.tour-actions>div{display:flex;gap:7px}.tour-actions button{height:36px;border-radius:10px;border:1px solid #dedee2;background:#fff;padding:0 11px;font:inherit;font-size:11px;font-weight:750;cursor:pointer}.tour-actions .tour-next{background:#1d1d1f;color:#fff;border-color:#1d1d1f}.tour-actions .tour-skip{border:0;color:#86868b;background:transparent;padding-left:0}.tour-actions button:disabled{opacity:.35;cursor:default}
    .guided-tour-open{overflow:hidden}
    @media(max-width:760px){
      .guided-tour-button{
        height:38px!important;
        width:auto!important;
        min-width:0!important;
        max-width:max-content!important;
        flex:0 0 auto!important;
        padding:0 12px!important;
        gap:7px!important;
        border-radius:12px!important;
        box-sizing:border-box!important;
      }
      .guided-tour-button b{
        display:inline!important;
        font-size:11px!important;
        white-space:nowrap!important;
      }
      .guided-tour-button>span{
        width:20px!important;
        height:20px!important;
        font-size:9px!important;
        flex:0 0 20px!important;
      }

      .tour-focus-box{
        border-width:4px;
        border-radius:12px;
        box-shadow:0 0 0 2px rgba(255,255,255,.95),0 0 0 9999px rgba(0,0,0,.05),0 0 28px rgba(255,59,48,.42);
      }
      .tour-step-pin{
        left:-10px;
        top:-15px;
        width:34px;
        height:34px;
        font-size:15px;
      }

      .tour-card{
        border-radius:20px;
        padding:16px;
        max-height:min(280px,38vh);
        overflow:auto;
        box-shadow:0 14px 50px rgba(0,0,0,.32);
      }
      .tour-card::before{
        content:"วิธีใช้หน้านี้";
        display:block;
        color:#86868b;
        font-size:9px;
        font-weight:850;
        letter-spacing:.08em;
        margin-bottom:8px;
      }
      .tour-progress{
        font-size:10px;
        padding:6px 9px;
      }
      .tour-title{
        font-size:19px;
        line-height:1.25;
        margin:10px 0 6px;
      }
      .tour-text{
        font-size:13px;
        line-height:1.55;
      }
      .tour-actions{
        margin-top:14px;
        align-items:stretch;
      }
      .tour-actions>div{
        flex:1;
      }
      .tour-actions button{
        min-height:42px;
        height:auto;
        font-size:12px;
      }
      .tour-actions>div .tour-prev,
      .tour-actions>div .tour-next{
        flex:1;
      }
      .tour-actions .tour-skip{
        font-size:10px;
        max-width:76px;
        line-height:1.2;
      }
    }
  `;
  document.head.appendChild(style);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tourState) endTour();
    if (event.key === "ArrowRight" && tourState) moveTour(1);
    if (event.key === "ArrowLeft" && tourState) moveTour(-1);
  });

  addEventListener("resize", () => {
    clearTimeout(tourResizeTimer);
    tourResizeTimer = setTimeout(() => {
      ensureTourButton();
      if (tourState) positionTour();
    }, 80);
  });

  addEventListener("scroll", () => {
    if (tourState) positionTour();
  }, true);

  // หน้า Dashboard เปลี่ยนแบบ SPA — อัปเดตชื่อ/สถานะปุ่มตามหน้าปัจจุบันเสมอ
  const observer = new MutationObserver(() => {
    ensureTourButton();
    if (tourState && tourState.key !== tourKey()) endTour();
  });
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

  setTimeout(ensureTourButton, 0);
  setTimeout(ensureTourButton, 700);
  window.startDashboardTour = startTour;
  console.info("[Dashboard] v7.17 FC-style guided tours active");
})();

/* Dashboard v7.19 — CHILD BUSINESS FLOW
   Account-level Google/Gmail ownership:
   - Root workspace handles account integration
   - Child workspaces setup only business profile, approver/signature, finance
   - Child workspace must never be marked incomplete only because Gmail isn't connected per-tenant
*/
(() => {
  "use strict";

  const CHILD_FLOW_VERSION = "CHILD_BUSINESS_FLOW_V7_19_20260811";

  function currentBusinessRecordV719() {
    const rows = Array.isArray(BUSINESS_INFO?.businesses) ? BUSINESS_INFO.businesses : [];
    return rows.find((b) => b?.isCurrent) || rows.find((b) => String(b?.tenant || "") === String(TENANT)) || null;
  }

  function isChildWorkspaceV719() {
    const current = currentBusinessRecordV719();
    if (current) return current.isRoot === false;
    const root = String(BUSINESS_INFO?.rootTenant || "");
    const now = String(BUSINESS_INFO?.currentTenant || TENANT || "");
    return Boolean(root && now && root !== now);
  }

  function rootBusinessUrlV719() {
    const rows = Array.isArray(BUSINESS_INFO?.businesses) ? BUSINESS_INFO.businesses : [];
    return String(rows.find((b) => b?.isRoot)?.dashboardUrl || "");
  }

  function childSetupV719() {
    const profileMissing = [];
    if (!String(SETTINGS.company_name || "").trim()) profileMissing.push("ชื่อบริษัท");
    if (!String(SETTINGS.tax_id || "").trim()) profileMissing.push("เลขผู้เสียภาษี");
    if (!companyLogoUrl()) profileMissing.push("โลโก้บริษัท");

    const approverMissing = [];
    if (!String(SETTINGS.approver_name || "").trim()) approverMissing.push("ชื่อผู้อนุมัติ");
    if (!hasApproverSignature()) approverMissing.push("ลายเซ็น");

    const financeCount = financeChannels(true).length;

    return {
      company_profile: profileMissing.length === 0,
      company_approver: approverMissing.length === 0,
      finance: financeCount > 0,
      profileMissing,
      approverMissing,
      financeCount,
    };
  }

  const companySetupStateCoreV719 = companySetupState;
  companySetupState = function() {
    if (!isChildWorkspaceV719()) return companySetupStateCoreV719();
    const x = childSetupV719();
    const ready = x.company_profile && x.company_approver && x.finance;
    return {
      // compatibility fields: Gmail is not a requirement for child workspaces
      owner_gmail: true,
      gmailReady: true,
      inheritedAccountIntegration: true,

      company_profile: x.company_profile,
      company_approver: x.company_approver,
      company_documents: x.company_profile && x.company_approver,
      finance: x.finance,
      financeCount: x.financeCount,
      profileMissing: x.profileMissing,
      approverMissing: x.approverMissing,
      documentMissing: [...x.profileMissing, ...x.approverMissing],
      ready,
    };
  };

  function setupStepTextV719(button, label) {
    if (!button) return;
    const spans = button.querySelectorAll("span");
    const target = [...spans].find((node) => !node.classList.contains("step-dot"));
    if (target) target.textContent = label;
  }

  function configureChildSetupDomV719() {
    if (!isChildWorkspaceV719()) return false;

    const steps = [...document.querySelectorAll(".onboard-step")];
    if (steps[0]) {
      steps[0].dataset.step = "company_profile";
      setupStepTextV719(steps[0], "ข้อมูลบริษัท Tax ID และโลโก้");
    }
    if (steps[1]) {
      steps[1].dataset.step = "company_approver";
      setupStepTextV719(steps[1], "ผู้อนุมัติและลายเซ็น");
    }
    if (steps[2]) {
      steps[2].dataset.step = "finance";
      setupStepTextV719(steps[2], "เพิ่มช่องทางการโอนเงิน");
    }

    const title = el("onboardingCard")?.querySelector(".onboarding-head strong");
    if (title) title.textContent = "ตั้งค่าธุรกิจนี้";

    // Full setup gate is normally hidden, but keep its copy correct if it is ever opened.
    const first = el("companySetupGmail");
    if (first) {
      const strong = first.querySelector(".company-setup-copy strong");
      const small = first.querySelector(".company-setup-copy small");
      const button = first.querySelector("[data-company-setup]");
      if (strong) strong.textContent = "ข้อมูลบริษัทและโลโก้";
      if (small) small.textContent = "กรอกชื่อบริษัท เลขผู้เสียภาษี และโลโก้ของธุรกิจนี้";
      if (button) {
        button.dataset.companySetup = "company_profile";
        button.textContent = "ตั้งค่าธุรกิจ";
      }
    }

    const second = el("companySetupDocuments");
    if (second) {
      const strong = second.querySelector(".company-setup-copy strong");
      const small = second.querySelector(".company-setup-copy small");
      const button = second.querySelector("[data-company-setup]");
      if (strong) strong.textContent = "ผู้อนุมัติและลายเซ็น";
      if (small) small.textContent = "กำหนดผู้อนุมัติและลายเซ็นที่ใช้บนเอกสารของธุรกิจนี้";
      if (button) {
        button.dataset.companySetup = "company_approver";
        button.textContent = "ตั้งค่าผู้อนุมัติ";
      }
    }

    return true;
  }

  const renderCompanySetupGateCoreV719 = renderCompanySetupGate;
  renderCompanySetupGate = function(options = {}) {
    if (!isChildWorkspaceV719()) return renderCompanySetupGateCoreV719(options);

    configureChildSetupDomV719();
    const gate = el("companySetupGate");
    const st = companySetupState();
    const order = ["company_profile", "company_approver", "finance"];
    const done = order.filter((key) => st[key]).length;

    if (el("companySetupCount")) el("companySetupCount").textContent = `${done}/3 ขั้นตอน`;
    if (el("companySetupBar")) el("companySetupBar").style.width = `${done / 3 * 100}%`;

    setCompanySetupStep(
      "companySetupGmail",
      st.company_profile,
      st.company_profile ? "ข้อมูลบริษัทและโลโก้พร้อม" : `ยังขาด ${st.profileMissing.join(" · ")}`,
      st.company_profile ? "ตรวจสอบ" : "ตั้งค่าธุรกิจ"
    );
    setCompanySetupStep(
      "companySetupDocuments",
      st.company_approver,
      st.company_approver ? "ผู้อนุมัติและลายเซ็นพร้อม" : `ยังขาด ${st.approverMissing.join(" · ")}`,
      st.company_approver ? "ตรวจสอบ" : "ตั้งค่าผู้อนุมัติ"
    );
    setCompanySetupStep(
      "companySetupFinance",
      st.finance,
      st.finance ? `พร้อมใช้งาน ${st.financeCount} ช่องทาง` : "ยังไม่มีบัญชีหรือช่องทางที่ใช้โอนเงิน",
      st.finance ? "ตรวจสอบ" : "เพิ่มช่องทาง"
    );

    if (gate) gate.hidden = true;
    document.body.classList.remove("company-setup-required");

    if (st.ready) {
      COMPANY_SETUP_ACTIVE = "";
      localStorage.setItem(`company-setup-complete:${TENANT}`, "1");
    } else {
      localStorage.removeItem(`company-setup-complete:${TENANT}`);
    }
  };

  const renderOnboardingCoreV719 = renderOnboarding;
  renderOnboarding = function() {
    if (!isChildWorkspaceV719()) return renderOnboardingCoreV719();

    configureChildSetupDomV719();
    const st = companySetupState();
    const order = ["company_profile", "company_approver", "finance"];
    const done = order.filter((key) => st[key]).length;

    if (el("onboardingCount")) el("onboardingCount").textContent = `${done}/3`;
    if (el("onboardingBar")) el("onboardingBar").style.width = `${done / 3 * 100}%`;

    const card = el("onboardingCard");
    const title = card?.querySelector(".onboarding-head strong");
    if (card) card.classList.toggle("complete", done === 3);
    if (title) title.textContent = done === 3 ? "ธุรกิจพร้อมใช้งาน" : "ตั้งค่าธุรกิจนี้";
    if (done === 3 && card) card.classList.add("closed");

    let foundNext = false;
    document.querySelectorAll(".onboard-step").forEach((button) => {
      const yes = Boolean(st[button.dataset.step]);
      button.classList.toggle("done", yes);
      button.classList.remove("next");
      const dot = button.querySelector(".step-dot");
      if (dot) dot.textContent = yes ? "✓" : "";
      if (!yes && !foundNext) {
        button.classList.add("next");
        foundNext = true;
      }
    });

    renderCompanySetupGate();
  };

  const openCompanySetupStepCoreV719 = openCompanySetupStep;
  openCompanySetupStep = function(step) {
    if (!isChildWorkspaceV719()) return openCompanySetupStepCoreV719(step);

    const actual = step === "owner_gmail" ? "company_profile" : step;
    COMPANY_SETUP_ACTIVE = actual;
    const gate = el("companySetupGate");
    if (gate) gate.hidden = true;
    document.body.classList.remove("company-setup-required");

    if (actual === "company_profile" || actual === "company_documents") {
      openBusiness("profile", document.querySelector('[data-biz="profile"]'));
      return;
    }
    if (actual === "company_approver") {
      openBusiness("approver", document.querySelector('[data-biz="approver"]'));
      return;
    }
    if (actual === "finance") {
      openBusiness("finance", document.querySelector('[data-biz="finance"]'));
      return;
    }
  };

  const renderConnectionHealthBannerCoreV719 = renderConnectionHealthBanner;
  renderConnectionHealthBanner = function() {
    if (!isChildWorkspaceV719()) return renderConnectionHealthBannerCoreV719();

    const businessReady = CONNECTION_HEALTH.business === true;
    const workspaceReady = CONNECTION_HEALTH.workspace === true;

    // Gmail is account-level for child workspaces. It must never create a warning banner here.
    if (businessReady && workspaceReady) {
      const box = ensureConnectionHealthBanner();
      if (box) box.hidden = true;
      DASH_SETUP_BLOCKED = false;
      return;
    }

    // Business/Sheet/Drive issues remain real and must still be shown.
    return renderConnectionHealthBannerCoreV719();
  };

  function ensureChildGmailNoticeV719() {
    const page = el("page-email");
    if (!page) return;

    let notice = el("childAccountGmailNotice");
    if (!isChildWorkspaceV719()) {
      if (notice) notice.remove();
      return;
    }

    if (!notice) {
      notice = document.createElement("div");
      notice.id = "childAccountGmailNotice";
      notice.className = "child-account-gmail-notice";
      page.prepend(notice);
    }

    const rootUrl = rootBusinessUrlV719();
    notice.innerHTML = `
      <div>
        <span class="child-account-gmail-badge">ACCOUNT INTEGRATION</span>
        <strong>ธุรกิจนี้ไม่ต้องเชื่อม Gmail ซ้ำ</strong>
        <p>Google / Gmail จัดการจากธุรกิจหลักของบัญชีนี้ ส่วนเอกสารของ Workspace นี้ยังรับผ่าน LINE ได้ตามปกติ</p>
      </div>
      ${rootUrl ? `<a class="btn" href="${escAttr(rootUrl)}&page=email">ไปจัดการ Gmail ที่ธุรกิจหลัก ↗</a>` : ""}
    `;

    if (el("gmailDisconnected")) el("gmailDisconnected").hidden = true;
    if (el("gmailConnected")) el("gmailConnected").hidden = true;
  }

  const renderEmailInboxCoreV719 = renderEmailInbox;
  renderEmailInbox = function(...args) {
    const result = renderEmailInboxCoreV719.apply(this, args);
    ensureChildGmailNoticeV719();
    return result;
  };

  const renderSettingsCoreV719 = renderSettings;
  renderSettings = function(...args) {
    const result = renderSettingsCoreV719.apply(this, args);
    if (!isChildWorkspaceV719()) return result;

    const gm = el("setGmailState");
    if (gm) {
      gm.className = "integration-state ok";
      gm.innerHTML = `<span class="state-dot"></span><span>จัดการจากธุรกิจหลัก</span>`;
    }
    const action = el("setGmailAction");
    if (action) {
      action.hidden = true;
      action.style.display = "none";
    }
    return result;
  };

  const refreshBusinessesCoreV719 = refreshBusinesses;
  refreshBusinesses = async function(...args) {
    const out = await refreshBusinessesCoreV719.apply(this, args);
    configureChildSetupDomV719();
    renderOnboarding();
    renderConnectionHealthBanner();
    if (currentPageKey() === "settings") renderSettings();
    if (currentPageKey() === "email") ensureChildGmailNoticeV719();
    return out;
  };

  const style = document.createElement("style");
  style.textContent = `
    .child-account-gmail-notice{
      display:flex;align-items:center;justify-content:space-between;gap:18px;
      margin:0 0 16px;padding:16px 18px;border:1px solid #e5e5e7;border-radius:18px;background:#fff
    }
    .child-account-gmail-notice strong{display:block;font-size:15px;margin:4px 0}
    .child-account-gmail-notice p{margin:0;color:#6e6e73;font-size:11px;line-height:1.55}
    .child-account-gmail-badge{font-size:9px;font-weight:800;letter-spacing:.08em;color:#86868b}
    @media(max-width:760px){
      .child-account-gmail-notice{display:block;padding:14px}
      .child-account-gmail-notice .btn{display:flex;width:100%;justify-content:center;margin-top:12px}
    }
  `;
  document.head.appendChild(style);

  // dashboard.js starts async load() before this cumulative patch is parsed.
  // Apply once now; refreshBusinesses wrapper will apply again after BUSINESS_INFO arrives.
  setTimeout(() => {
    configureChildSetupDomV719();
    renderOnboarding();
    renderConnectionHealthBanner();
    if (currentPageKey() === "settings") renderSettings();
    if (currentPageKey() === "email") ensureChildGmailNoticeV719();
  }, 0);

  console.info("[Dashboard]", CHILD_FLOW_VERSION, "active");
})();

/* Dashboard v7.20 — INITIAL LOADING IS NOT AN ERROR
   Never show connection failure or real-looking zero balances before the first health/data check finishes.
*/
(() => {
  "use strict";
  const VERSION = "INITIAL_LOADING_NOT_ERROR_V7_20_20260811";

  let INITIAL_WORKSPACE_LOADING_V720 = true;

  function setInitialLoadingUiV720() {
    if (!INITIAL_WORKSPACE_LOADING_V720) return;

    // A health check has not finished yet. Hide failure UI completely.
    const health = el("connectionHealthBanner");
    if (health) health.hidden = true;

    // Don't present zero as real accounting data before the first data response.
    const placeholders = [
      ["kSpend", "—"],
      ["kCount", "—"],
      ["kPending", "—"],
      ["kPendingCount", "กำลังโหลดข้อมูล…"],
      ["kPaid", "—"],
      ["kPaidCount", "กำลังโหลดข้อมูล…"],
    ];
    placeholders.forEach(([id, value]) => {
      const node = el(id);
      if (node) node.textContent = value;
    });

    const trend = el("trend");
    if (trend && !HAS_LOADED) {
      trend.innerHTML = '<text x="300" y="80" text-anchor="middle" fill="#86868b" font-size="13">กำลังโหลดข้อมูล…</text>';
    }

    const cats = el("cats");
    if (cats && !HAS_LOADED) cats.innerHTML = '<div class="empty">กำลังโหลดข้อมูล…</div>';

    const vendors = el("vendors");
    if (vendors && !HAS_LOADED) vendors.innerHTML = '<div class="empty">กำลังโหลดข้อมูล…</div>';

    const recent = el("recent");
    if (recent && !HAS_LOADED) recent.innerHTML = '<div class="empty">กำลังโหลดข้อมูล…</div>';
  }

  function finishInitialLoadingV720() {
    INITIAL_WORKSPACE_LOADING_V720 = false;
    document.documentElement.classList.remove("workspace-initial-loading-v720");
  }

  document.documentElement.classList.add("workspace-initial-loading-v720");
  setInitialLoadingUiV720();

  // Final guard: checked:false means "unknown / loading", never "broken".
  const renderConnectionHealthBannerCoreV720 = renderConnectionHealthBanner;
  renderConnectionHealthBanner = function(...args) {
    if (CONNECTION_HEALTH?.checked !== true) {
      const box = ensureConnectionHealthBanner();
      if (box) box.hidden = true;
      DASH_SETUP_BLOCKED = false;
      return;
    }
    return renderConnectionHealthBannerCoreV720.apply(this, args);
  };

  // Any real data render means loading is complete.
  const refreshDataCoreV720 = refreshData;
  refreshData = async function(...args) {
    const out = await refreshDataCoreV720.apply(this, args);
    if (out === true || HAS_LOADED) finishInitialLoadingV720();
    return out;
  };

  // Health check completed: only from here can a red warning be legitimate.
  const refreshConnectionHealthCoreV720 = refreshConnectionHealth;
  refreshConnectionHealth = async function(...args) {
    const out = await refreshConnectionHealthCoreV720.apply(this, args);
    if (CONNECTION_HEALTH?.checked === true) {
      finishInitialLoadingV720();
      renderConnectionHealthBanner();
    }
    return out;
  };

  // load() in dashboard.js already started before this cumulative patch was parsed.
  // Watch the actual state transition instead of rendering an error from the initial false values.
  let ticks = 0;
  const timer = setInterval(() => {
    ticks += 1;

    if (CONNECTION_HEALTH?.checked === true) {
      finishInitialLoadingV720();
      clearInterval(timer);
      renderConnectionHealthBanner();
      return;
    }

    if (HAS_LOADED) {
      finishInitialLoadingV720();
      clearInterval(timer);
      return;
    }

    setInitialLoadingUiV720();

    // Safety only: leave the page in loading state rather than inventing a connection error.
    if (ticks >= 120) clearInterval(timer);
  }, 100);

  const style = document.createElement("style");
  style.textContent = `
    .workspace-initial-loading-v720 #connectionHealthBanner{display:none!important}
    .workspace-initial-loading-v720 #kSpend,
    .workspace-initial-loading-v720 #kCount,
    .workspace-initial-loading-v720 #kPending,
    .workspace-initial-loading-v720 #kPaid{
      opacity:.5
    }
    .workspace-initial-loading-v720 .kpi{
      position:relative;
      overflow:hidden
    }
    .workspace-initial-loading-v720 .kpi::after{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);
      transform:translateX(-100%);
      animation:workspaceLoadingSweepV720 1.25s infinite
    }
    @keyframes workspaceLoadingSweepV720{
      to{transform:translateX(100%)}
    }
    @media (prefers-reduced-motion: reduce){
      .workspace-initial-loading-v720 .kpi::after{animation:none}
    }
  `;
  document.head.appendChild(style);

  console.info("[Dashboard]", VERSION, "active");
})();

/* Dashboard v7.21 — UNIFIED BUSINESS READINESS
   Root and child use the same 5-step pattern.
   Gmail Automation is optional, not a business-readiness requirement.
*/
(() => {
  "use strict";

  const VERSION = "UNIFIED_BUSINESS_READINESS_V7_21_20260811";
  const ORDER = ["line_workspace","google_workspace","company_profile","company_approver","finance"];

  function currentBusinessV721() {
    const rows = Array.isArray(BUSINESS_INFO?.businesses) ? BUSINESS_INFO.businesses : [];
    return rows.find((b) => b?.isCurrent) ||
      rows.find((b) => String(b?.tenant || "") === String(TENANT)) ||
      null;
  }

  function isChildV721() {
    const current = currentBusinessV721();
    if (current) return current.isRoot === false;
    const root = String(BUSINESS_INFO?.rootTenant || "");
    const now = String(BUSINESS_INFO?.currentTenant || TENANT || "");
    return Boolean(root && now && root !== now);
  }

  function readinessV721() {
    const profileMissing = [];
    if (!String(SETTINGS.company_name || "").trim()) profileMissing.push("ชื่อบริษัท");
    if (!String(SETTINGS.tax_id || "").trim()) profileMissing.push("Tax ID");
    if (!companyLogoUrl()) profileMissing.push("โลโก้");

    const approverMissing = [];
    if (!String(SETTINGS.approver_name || "").trim()) approverMissing.push("ผู้อนุมัติ");
    if (!hasApproverSignature()) approverMissing.push("ลายเซ็น");

    const financeCount = financeChannels(true).length;
    const googleReady = Boolean(
      (WORKSPACE_LINKS?.sheetUrl && WORKSPACE_LINKS?.driveUrl) ||
      CONNECTION_HEALTH?.workspace === true
    );

    const state = {
      line_workspace: Boolean(TENANT),
      google_workspace: googleReady,
      company_profile: profileMissing.length === 0,
      company_approver: approverMissing.length === 0,
      finance: financeCount > 0,

      profileMissing,
      approverMissing,
      financeCount,
      inheritedAccountIntegration: isChildV721(),

      // compatibility with older setup code
      owner_gmail: true,
      gmailReady: true,
      company_documents: profileMissing.length === 0 && approverMissing.length === 0,
      documentMissing: [...profileMissing, ...approverMissing],
    };

    state.ready = ORDER.every((key) => state[key]);
    return state;
  }

  function ensureStepsV721() {
    const body = el("onboardingSteps");
    if (!body) return;

    const wanted = [
      ["line_workspace", "LINE Workspace"],
      ["google_workspace", "Google / Sheet / Drive"],
      ["company_profile", "ข้อมูลบริษัท Tax ID และโลโก้"],
      ["company_approver", "ผู้อนุมัติและลายเซ็น"],
      ["finance", "ช่องทางการเงิน"],
    ];

    const existing = [...body.querySelectorAll(".onboard-step")];
    const same = existing.length === wanted.length &&
      wanted.every(([key], index) => existing[index]?.dataset.step === key);

    if (!same) {
      body.innerHTML = wanted.map(([key, label]) => `
        <button class="onboard-step" data-step="${key}" type="button">
          <span class="step-dot"></span>
          <span class="step-main"><span class="step-copy">${label}</span><small class="step-note"></small></span>
        </button>
      `).join("");
    }

    const title = el("onboardingCard")?.querySelector(".onboarding-head strong");
    if (title) title.textContent = "ความพร้อมธุรกิจ";
  }

  function setStepV721(button, ready, note = "", inherited = false) {
    if (!button) return;

    button.classList.toggle("done", Boolean(ready));
    button.classList.toggle("inherited", Boolean(inherited));
    button.classList.remove("next");

    const dot = button.querySelector(".step-dot");
    if (dot) dot.textContent = ready ? "✓" : "";

    let main = button.querySelector(".step-main");
    if (!main) {
      const copy = button.querySelector(".step-copy") || button.querySelector("span:last-child");
      main = document.createElement("span");
      main.className = "step-main";
      if (copy) {
        copy.classList.add("step-copy");
        copy.replaceWith(main);
        main.appendChild(copy);
      } else {
        button.appendChild(main);
      }
    }

    let noteEl = main.querySelector(".step-note");
    if (!noteEl) {
      noteEl = document.createElement("small");
      noteEl.className = "step-note";
      main.appendChild(noteEl);
    }

    noteEl.textContent = note;
    noteEl.hidden = !note;
  }

  function renderUnifiedReadinessV721() {
    ensureStepsV721();

    const state = readinessV721();
    const done = ORDER.filter((key) => state[key]).length;

    if (el("onboardingCount")) el("onboardingCount").textContent = `${done}/5`;
    if (el("onboardingBar")) el("onboardingBar").style.width = `${done / 5 * 100}%`;

    const card = el("onboardingCard");
    if (card) {
      card.classList.toggle("complete", done === 5);
      const title = card.querySelector(".onboarding-head strong");
      if (title) title.textContent = "ความพร้อมธุรกิจ";
    }

    const map = Object.fromEntries(
      [...document.querySelectorAll("#onboardingSteps .onboard-step")]
        .map((button) => [button.dataset.step, button])
    );

    setStepV721(
      map.line_workspace,
      state.line_workspace,
      state.line_workspace ? "เชื่อมกับ LINE แล้ว" : "กำลังตรวจสอบ"
    );

    setStepV721(
      map.google_workspace,
      state.google_workspace,
      state.google_workspace
        ? (state.inheritedAccountIntegration ? "ใช้การเชื่อมต่อจากบัญชีหลัก" : "Sheet / Drive พร้อมใช้งาน")
        : "กำลังตรวจสอบ Sheet / Drive",
      state.inheritedAccountIntegration && state.google_workspace
    );

    setStepV721(
      map.company_profile,
      state.company_profile,
      state.company_profile ? "" : `ยังขาด ${state.profileMissing.join(" · ")}`
    );

    setStepV721(
      map.company_approver,
      state.company_approver,
      state.company_approver ? "" : `ยังขาด ${state.approverMissing.join(" · ")}`
    );

    setStepV721(
      map.finance,
      state.finance,
      state.finance ? `${state.financeCount} ช่องทาง` : "ยังไม่มีช่องทางการเงิน"
    );

    let nextFound = false;
    for (const key of ORDER) {
      const button = map[key];
      if (!button) continue;
      if (!state[key] && !nextFound) {
        button.classList.add("next");
        nextFound = true;
      }
    }

    if (state.ready) localStorage.setItem(`company-setup-complete:${TENANT}`, "1");
    else localStorage.removeItem(`company-setup-complete:${TENANT}`);
  }

  // One source of truth for both root + child.
  companySetupState = function() {
    return readinessV721();
  };

  // No separate 3-step root/child sidebar render anymore.
  renderOnboarding = function() {
    renderUnifiedReadinessV721();

    // Don't open the legacy setup gate which has the old Gmail/company combined pattern.
    const gate = el("companySetupGate");
    if (gate) gate.hidden = true;
    document.body.classList.remove("company-setup-required");
  };

  // Keep the hidden legacy gate from flashing an inconsistent 3-step pattern.
  renderCompanySetupGate = function() {
    const gate = el("companySetupGate");
    if (gate) gate.hidden = true;
    document.body.classList.remove("company-setup-required");
  };

  // Use the same click behavior for every business.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("#onboardingSteps .onboard-step");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const step = button.dataset.step;
    const state = readinessV721();

    if (step === "line_workspace") return;

    if (step === "google_workspace") {
      if (isChildV721()) {
        // Child must never be asked to login another Google account.
        if (!state.google_workspace) go("settings");
        return;
      }

      if (!state.google_workspace) {
        const connect = el("connBtn");
        if (connect?.href && connect.getAttribute("href") !== "#") {
          location.href = connect.href;
        } else {
          go("settings");
        }
      } else {
        go("settings");
      }
      return;
    }

    if (step === "company_profile") {
      openBusiness("profile", document.querySelector('[data-biz="profile"]'));
      return;
    }

    if (step === "company_approver") {
      openBusiness("approver", document.querySelector('[data-biz="approver"]'));
      return;
    }

    if (step === "finance") {
      openBusiness("finance", document.querySelector('[data-biz="finance"]'));
    }
  }, true);

  // Repaint after all relevant asynchronous state changes.
  const refreshDataCoreV721 = refreshData;
  refreshData = async function(...args) {
    const out = await refreshDataCoreV721.apply(this, args);
    renderUnifiedReadinessV721();
    return out;
  };

  const refreshBusinessesCoreV721 = refreshBusinesses;
  refreshBusinesses = async function(...args) {
    const out = await refreshBusinessesCoreV721.apply(this, args);
    renderUnifiedReadinessV721();
    return out;
  };

  const refreshConnectionHealthCoreV721 = refreshConnectionHealth;
  refreshConnectionHealth = async function(...args) {
    const out = await refreshConnectionHealthCoreV721.apply(this, args);
    renderUnifiedReadinessV721();
    return out;
  };

  const renderSettingsCoreV721 = renderSettings;
  renderSettings = function(...args) {
    const out = renderSettingsCoreV721.apply(this, args);

    // Gmail is an optional automation integration, not "business readiness".
    const gm = el("setGmailState");
    if (gm && !EMAIL_INFO?.connected) {
      gm.className = "integration-state";
      gm.innerHTML = `<span class="state-dot"></span><span>ไม่บังคับ · เชื่อมเมื่อต้องการรับเอกสารจากอีเมล</span>`;
    }
    return out;
  };

  const style = document.createElement("style");
  style.textContent = `
    #onboardingSteps .onboard-step{
      align-items:flex-start;
    }
    #onboardingSteps .step-main{
      flex:1;
      min-width:0;
      display:flex;
      flex-direction:column;
      align-items:flex-start;
    }
    #onboardingSteps .step-copy{
      display:block;
    }
    #onboardingSteps .step-note{
      display:block;
      margin-top:2px;
      color:#8e8e93;
      font-size:9px;
      line-height:1.3;
      text-align:left;
      font-weight:500;
    }
    #onboardingSteps .onboard-step.inherited .step-note{
      color:#248a3d;
    }
    #onboardingSteps .onboard-step.done .step-copy{
      text-decoration:none!important;
      color:#6e6e73;
    }
    #onboardingSteps .onboard-step.next .step-copy{
      color:#1d1d1f;
      font-weight:750;
    }
  `;
  document.head.appendChild(style);

  setTimeout(renderUnifiedReadinessV721, 0);
  console.info("[Dashboard]", VERSION, "active");
})();

/* Dashboard v7.23 — Mobile Guided Tour clarity */
(() => {
  "use strict";

  function clarifyMobileTourButton() {
    const btn = document.getElementById("guidedTourButton");
    if (!btn) return;
    if (innerWidth <= 760) {
      btn.setAttribute("aria-label", "เปิดวิธีใช้หน้านี้แบบทีละขั้น");
      btn.title = "เปิดวิธีใช้หน้านี้แบบทีละขั้น";
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    @media(max-width:760px){
      .main>.head #guidedTourButton{
        order:90;
        align-self:flex-start;
      }
      .guided-tour-open #guidedTourButton{
        visibility:hidden;
      }
      .guided-tour-open .mobile-bottom-nav,
      .guided-tour-open .bottom-nav{
        pointer-events:none;
      }
    }
  `;
  document.head.appendChild(style);

  setTimeout(clarifyMobileTourButton, 0);
  addEventListener("resize", clarifyMobileTourButton);
  console.info("[Dashboard] v7.23 mobile guided tour clarity active");
})();

/* Dashboard v7.24 — AUTO BACKUP & RESTORE */
(() => {
  "use strict";

  let BACKUP_DATA_V724 = null;
  let BACKUP_LOADING_V724 = false;

  function backupApiV724(path) {
    const url = new URL(`${WORKER}${path}`);
    url.searchParams.set("tenant", TENANT);
    url.searchParams.set("k", K);
    return url.toString();
  }

  function backupDateV724(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("th-TH", {
      timeZone:"Asia/Bangkok",
      day:"numeric",
      month:"short",
      year:"2-digit",
      hour:"2-digit",
      minute:"2-digit",
    });
  }

  function backupKindV724(kind) {
    return kind === "daily" ? "รายวัน" :
      kind === "monthly" ? "รายเดือน" :
      kind === "manual" ? "สำรองเอง" :
      kind === "restore-copy" ? "สำเนากู้คืน" : String(kind || "Backup");
  }

  function backupCanManageV724() {
    const role = String(document.body?.dataset?.dashboardRole || "");
    // Before whoami finishes, do not expose Owner-only actions.
    return role === "owner";
  }

  function ensureBackupPanelV724() {
    const page = document.getElementById("page-settings");
    if (!page || document.getElementById("backupPanelV724")) return;

    const panel = document.createElement("section");
    panel.id = "backupPanelV724";
    panel.className = "backup-panel-v724";
    panel.innerHTML = `
      <div class="backup-head-v724">
        <div>
          <div class="head-kicker">BACKUP & RESTORE</div>
          <h3>สำรองข้อมูลอัตโนมัติ</h3>
          <p>สำรอง Google Sheet ของ Workspace นี้ไว้ใน Google Drive ของบริษัททุกวัน โดยไม่เขียนทับข้อมูลปัจจุบัน</p>
        </div>
        <span class="backup-auto-chip-v724">● Auto Backup</span>
      </div>

      <div class="backup-summary-v724" id="backupSummaryV724">
        <div><span>Backup ล่าสุด</span><strong>กำลังโหลด…</strong><small>กำลังตรวจสอบ</small></div>
        <div><span>รายวัน</span><strong>30 วัน</strong><small>เก็บย้อนหลังอัตโนมัติ</small></div>
        <div><span>รายเดือน</span><strong>12 เดือน</strong><small>เก็บเดือนละ 1 ชุด</small></div>
      </div>

      <div class="backup-actions-v724">
        <button class="btn solid" id="backupNowV724" type="button">สำรองตอนนี้</button>
        <a class="btn" id="backupFolderV724" href="#" target="_blank" rel="noopener" hidden>เปิดโฟลเดอร์ Backup ↗</a>
        <button class="btn" id="backupRefreshV724" type="button">อัปเดต</button>
      </div>

      <div class="backup-note-v724">
        Restore จะสร้าง <b>สำเนาใหม่</b> ให้ตรวจสอบก่อนเสมอ ระบบจะไม่เอา Backup ไปเขียนทับ Sheet ปัจจุบันอัตโนมัติ
      </div>

      <div class="backup-list-v724" id="backupListV724">
        <div class="backup-empty-v724">กำลังโหลดประวัติ Backup…</div>
      </div>
    `;

    page.appendChild(panel);

    document.getElementById("backupNowV724")?.addEventListener("click", () => runManualBackupV724());
    document.getElementById("backupRefreshV724")?.addEventListener("click", () => loadBackupsV724(true));
    document.getElementById("backupListV724")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-restore-backup-v724]");
      if (button) restoreBackupCopyV724(button.dataset.restoreBackupV724 || "", button);
    });
  }

  function renderBackupsV724() {
    ensureBackupPanelV724();
    const data = BACKUP_DATA_V724 || {};
    const status = data.status || {};
    const summary = document.getElementById("backupSummaryV724");
    const list = document.getElementById("backupListV724");
    const folder = document.getElementById("backupFolderV724");
    const nowButton = document.getElementById("backupNowV724");

    if (folder) {
      folder.hidden = !data.backupFolderUrl;
      folder.href = data.backupFolderUrl || "#";
    }
    if (nowButton) nowButton.hidden = !backupCanManageV724();

    if (summary) {
      const bad = status.state === "error";
      summary.innerHTML = `
        <div class="${bad ? "bad" : status.lastSuccessAt ? "ok" : ""}">
          <span>Backup ล่าสุด</span>
          <strong>${status.lastSuccessAt ? esc(backupDateV724(status.lastSuccessAt)) : "ยังไม่มี"}</strong>
          <small>${bad ? esc(status.lastError || "Backup ไม่สำเร็จ") : status.lastSuccessAt ? "สำเร็จ" : "ระบบจะสำรองอัตโนมัติคืนนี้"}</small>
        </div>
        <div><span>รายวัน</span><strong>${Number(data.dailyRetentionDays || 30)} วัน</strong><small>${esc(data.schedule || "ทุกคืน")}</small></div>
        <div><span>รายเดือน</span><strong>${Number(data.monthlyRetentionMonths || 12)} เดือน</strong><small>เก็บเดือนละ 1 ชุด</small></div>
      `;
    }

    if (!list) return;
    const rows = Array.isArray(data.rows) ? data.rows : [];

    if (!rows.length) {
      list.innerHTML = `<div class="backup-empty-v724">ยังไม่มี Backup · ระบบจะสร้างอัตโนมัติในรอบถัดไป หรือ Owner กด “สำรองตอนนี้” ได้เลย</div>`;
      return;
    }

    list.innerHTML = rows.slice(0, 20).map((row) => `
      <article class="backup-row-v724">
        <div class="backup-row-icon-v724">✓</div>
        <div class="backup-row-main-v724">
          <b>${esc(backupKindV724(row.kind))}</b>
          <span>${esc(backupDateV724(row.createdTime || row.createdAt))}</span>
          <small>${esc(row.name || "")}</small>
        </div>
        <div class="backup-row-actions-v724">
          ${row.webViewLink ? `<a class="btn small" href="${escAttr(row.webViewLink)}" target="_blank" rel="noopener">เปิด</a>` : ""}
          ${backupCanManageV724() ? `<button class="btn small" type="button" data-restore-backup-v724="${escAttr(row.id || "")}">กู้เป็นสำเนา</button>` : ""}
        </div>
      </article>
    `).join("");
  }

  async function loadBackupsV724(force = false) {
    ensureBackupPanelV724();
    if (BACKUP_LOADING_V724) return;
    if (!force && BACKUP_DATA_V724) {
      renderBackupsV724();
      return;
    }

    BACKUP_LOADING_V724 = true;
    const refresh = document.getElementById("backupRefreshV724");
    if (refresh) {
      refresh.disabled = true;
      refresh.textContent = "กำลังอัปเดต…";
    }

    try {
      const response = await fetch(backupApiV724("/api/backup-status"), { cache:"no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
      BACKUP_DATA_V724 = data;
      renderBackupsV724();
    } catch (error) {
      const list = document.getElementById("backupListV724");
      if (list) {
        list.innerHTML = `<div class="backup-error-v724"><b>โหลดสถานะ Backup ไม่สำเร็จ</b><span>${esc(error?.message || error)}</span></div>`;
      }
    } finally {
      BACKUP_LOADING_V724 = false;
      if (refresh) {
        refresh.disabled = false;
        refresh.textContent = "อัปเดต";
      }
    }
  }

  async function runManualBackupV724() {
    if (!backupCanManageV724()) return;
    const button = document.getElementById("backupNowV724");
    if (!button || button.disabled) return;

    button.disabled = true;
    button.textContent = "กำลังสำรอง…";

    try {
      const response = await fetch(backupApiV724("/api/backup-now"), {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body:"{}",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.error || "Backup ไม่สำเร็จ");

      button.textContent = "สำรองสำเร็จ ✓";
      BACKUP_DATA_V724 = null;
      setTimeout(() => loadBackupsV724(true), 400);
    } catch (error) {
      alert(`สำรองข้อมูลไม่สำเร็จ\n${error?.message || error}`);
      button.textContent = "ลองสำรองอีกครั้ง";
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = "สำรองตอนนี้";
      }, 1400);
    }
  }

  async function restoreBackupCopyV724(fileId, button) {
    if (!fileId || !backupCanManageV724()) return;

    const ok = confirm(
      "กู้ Backup เป็นสำเนาใหม่?\n\nระบบจะสร้าง Google Sheet สำเนาใหม่ให้ตรวจสอบก่อน และจะไม่แตะข้อมูลปัจจุบัน"
    );
    if (!ok) return;

    const old = button?.textContent || "";
    if (button) {
      button.disabled = true;
      button.textContent = "กำลังกู้…";
    }

    try {
      const response = await fetch(backupApiV724("/api/backup-restore-copy"), {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body:JSON.stringify({ backupFileId:fileId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.error || "กู้ Backup ไม่สำเร็จ");

      const open = confirm("สร้างสำเนากู้คืนสำเร็จแล้ว ✓\n\nต้องการเปิด Google Sheet สำเนานี้เพื่อตรวจสอบเลยไหม?");
      if (open && data.restoreUrl) window.open(data.restoreUrl, "_blank", "noopener");
    } catch (error) {
      alert(`กู้ Backup ไม่สำเร็จ\n${error?.message || error}`);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = old || "กู้เป็นสำเนา";
      }
    }
  }

  // Hook settings rendering/page navigation.
  const renderSettingsCoreV724 = renderSettings;
  renderSettings = function(...args) {
    const out = renderSettingsCoreV724.apply(this, args);
    ensureBackupPanelV724();
    loadBackupsV724(false);
    return out;
  };

  const style = document.createElement("style");
  style.textContent = `
    .backup-panel-v724{
      margin-top:16px;
      padding:18px;
      background:#fff;
      border:1px solid #e5e5e7;
      border-radius:20px;
    }
    .backup-head-v724{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:15px;
    }
    .backup-head-v724 h3{margin:4px 0 5px;font-size:18px}
    .backup-head-v724 p{margin:0;color:#86868b;font-size:11px;line-height:1.55}
    .backup-auto-chip-v724{
      display:inline-flex;
      align-items:center;
      white-space:nowrap;
      background:#edf8f0;
      color:#147a36;
      border-radius:999px;
      padding:7px 10px;
      font-size:10px;
      font-weight:800;
    }
    .backup-summary-v724{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:9px;
      margin-top:15px;
    }
    .backup-summary-v724>div{
      background:#f7f7f9;
      border-radius:14px;
      padding:12px;
    }
    .backup-summary-v724 span,.backup-summary-v724 small{display:block;color:#86868b;font-size:9px}
    .backup-summary-v724 strong{display:block;margin:4px 0;font-size:15px}
    .backup-summary-v724 .ok strong{color:#16a34a}
    .backup-summary-v724 .bad strong,.backup-summary-v724 .bad small{color:#d92d20}
    .backup-actions-v724{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .backup-note-v724{
      margin-top:12px;
      border-radius:12px;
      background:#f7f7f9;
      padding:10px 12px;
      color:#6e6e73;
      font-size:10px;
      line-height:1.55;
    }
    .backup-list-v724{
      margin-top:12px;
      border:1px solid #eeeeef;
      border-radius:14px;
      overflow:hidden;
    }
    .backup-row-v724{
      display:flex;
      align-items:center;
      gap:10px;
      padding:11px 12px;
      border-top:1px solid #eeeeef;
    }
    .backup-row-v724:first-child{border-top:0}
    .backup-row-icon-v724{
      width:28px;height:28px;border-radius:50%;
      display:grid;place-items:center;
      background:#edf8f0;color:#147a36;font-size:11px;font-weight:900;
      flex:0 0 28px;
    }
    .backup-row-main-v724{min-width:0;flex:1}
    .backup-row-main-v724 b{display:block;font-size:11px}
    .backup-row-main-v724 span,.backup-row-main-v724 small{
      display:block;color:#86868b;font-size:9px;margin-top:2px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis
    }
    .backup-row-actions-v724{display:flex;gap:6px}
    .backup-empty-v724,.backup-error-v724{
      padding:18px;text-align:center;color:#86868b;font-size:11px;background:#fafafa;
    }
    .backup-error-v724 b,.backup-error-v724 span{display:block}
    .backup-error-v724 span{margin-top:4px;color:#d92d20}
    @media(max-width:760px){
      .backup-panel-v724{padding:14px;border-radius:17px}
      .backup-head-v724{display:block}
      .backup-auto-chip-v724{margin-top:10px}
      .backup-summary-v724{grid-template-columns:1fr}
      .backup-actions-v724>.btn,.backup-actions-v724>a{flex:1;justify-content:center}
      .backup-row-v724{align-items:flex-start;flex-wrap:wrap}
      .backup-row-main-v724{min-width:calc(100% - 40px)}
      .backup-row-actions-v724{width:100%;padding-left:38px}
      .backup-row-actions-v724 .btn{flex:1}
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    if (currentPageKey() === "settings") {
      ensureBackupPanelV724();
      loadBackupsV724(false);
    }
  }, 0);

  console.info("[Dashboard] v7.24 Auto Backup & Restore active");
})();

/* Dashboard v7.25 — ROLE SECURITY & REVOKE PRIVACY HARDENING
   Security rules:
   - revoked/invalid token => purge cached financial data from this browser
   - approver UI exposes approve/reject only
   - viewer UI is read-only
   - accountant cannot change package
*/
(() => {
  "use strict";

  const VERSION = "ROLE_SECURITY_HARDENING_V7_25_20260811";
  let AUTH_PURGED_V725 = false;

  function roleV725() {
    return String(document.body?.dataset?.dashboardRole || "").trim();
  }

  function purgeSensitiveWorkspaceStateV725() {
    if (AUTH_PURGED_V725) return;
    AUTH_PURGED_V725 = true;

    // Financial rows are cached in sessionStorage by dashboard.js.
    try { sessionStorage.removeItem(`dashboard:last-good:${TENANT}`); } catch {}

    // Readiness flags are not financial data, but clearing them prevents a revoked browser
    // from presenting stale "ready" state as if it were still connected.
    try {
      localStorage.removeItem(`company-setup-complete:${TENANT}`);
      localStorage.removeItem(`document-settings-updated:${TENANT}`);
      localStorage.removeItem(`signature-ready:${TENANT}`);
    } catch {}

    try { ALL = []; } catch {}
    try { LAST_SIGNATURE = ""; } catch {}
    try { CONNECTED = false; } catch {}
    try { HAS_LOADED = true; } catch {}
    try { SETTINGS = {}; } catch {}
    try { WORKSPACE_LINKS = { sheetUrl:"", driveUrl:"" }; } catch {}
    try { EMAIL_DOCS = []; } catch {}
    try { SUBSCRIPTIONS = []; } catch {}
    try { PLAN_INFO = {}; } catch {}
    try {
      BATCH_DATA = {
        pending:{groups:[],itemCount:0,total:0,urgentCount:0,people:0},
        batches:[],
        settings:{}
      };
      BATCH_SELECTED?.clear?.();
      REVIEW_BATCH_SELECTED?.clear?.();
      TRANSFER_SELECTED?.clear?.();
    } catch {}
    try {
      RECON_DATA = {rows:[],paidBatches:[],summary:{}};
      ACTIVE_RECON_ID = "";
    } catch {}
    try {
      INCOME_DATA = {
        ok:true,records:[],payments:[],reconciliation:[],
        reconciliationSummary:{},summary:{},categories:[]
      };
      ACTIVE_INCOME_ID = "";
    } catch {}

    // Clear rendered financial content immediately so revoked users cannot keep reading
    // the old DOM after the API rejects their token.
    [
      "rows","recent","cats","vendors",
      "batchMasterBody","batchDrawerBody",
      "reconBody","reconDrawerBody",
      "incomeBody","incomeReconList",
      "emailList","subscriptionList",
      "billGrid","activityRows","repCatBody"
    ].forEach((id) => {
      try { document.getElementById(id)?.replaceChildren(); } catch {}
    });

    ["kSpend","kPending","kPaid"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = "—";
    });
    ["kCount","kPendingCount","kPaidCount"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = "สิทธิ์ถูกยกเลิก";
    });

    document.body.classList.add("dashboard-access-revoked-v725");
    try { closeGlobalModal?.(); } catch {}
  }

  // dashboard.js used to restore the last-good cache when auth failed.
  // Network/offline failures may still use cache; auth failure must never do so.
  if (typeof recoverDashboardShell === "function") {
    const coreRecoverDashboardShellV725 = recoverDashboardShell;
    recoverDashboardShell = function(reason = "network") {
      if (reason === "auth") {
        purgeSensitiveWorkspaceStateV725();
        return true;
      }
      return coreRecoverDashboardShellV725(reason);
    };
  }

  // Replace the old misleading auth message:
  // "ข้อมูลเดิมยังแสดงได้" is forbidden after revoke.
  if (typeof showNetworkBanner === "function") {
    const coreShowNetworkBannerV725 = showNetworkBanner;
    showNetworkBanner = function(mode, title, detail, retryLabel) {
      if (mode === "auth") {
        purgeSensitiveWorkspaceStateV725();
        return coreShowNetworkBannerV725(
          "auth",
          "สิทธิ์ Dashboard ถูกยกเลิกหรือหมดอายุ",
          "เพื่อความปลอดภัย ข้อมูลที่บันทึกไว้ในเครื่องนี้ถูกล้างแล้ว กรุณาขอลิงก์ใหม่จาก Owner",
          "เปิดใหม่"
        );
      }
      return coreShowNetworkBannerV725(mode, title, detail, retryLabel);
    };
  }

  // Catch 401 from any Worker endpoint, not only the main /api/expenses refresh.
  const coreFetchV725 = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    const response = await coreFetchV725(input, init);
    try {
      const rawUrl =
        typeof input === "string" ? input :
        input instanceof URL ? input.href :
        String(input?.url || "");

      if (
        response.status === 401 &&
        rawUrl &&
        typeof WORKER !== "undefined" &&
        rawUrl.startsWith(String(WORKER))
      ) {
        purgeSensitiveWorkspaceStateV725();
      }
    } catch {}
    return response;
  };

  function setHiddenV725(node, hidden) {
    if (!node) return;
    node.classList.toggle("role-hidden-v725", Boolean(hidden));
    node.setAttribute("aria-hidden", hidden ? "true" : "false");
    if ("disabled" in node && hidden) node.disabled = true;
  }

  function hardenRoleUiV725() {
    const role = roleV725();
    if (!role) return;

    document.body.classList.toggle("role-owner-v725", role === "owner");
    document.body.classList.toggle("role-accountant-v725", role === "accountant");
    document.body.classList.toggle("role-approver-v725", role === "approver");
    document.body.classList.toggle("role-viewer-v725", role === "viewer");

    // Package selection is Owner-only. Accountant may still view usage/package status.
    if (role !== "owner") {
      document.querySelectorAll(".plan-action,[data-select-plan]").forEach((node) => setHiddenV725(node, true));
    }

    // Approver = reimbursement review only. Backend v7.25 enforces this too.
    if (role === "approver") {
      [
        "#batchMasterCreate",
        "#batchMasterUrgent",
        "#batchMasterMarkTransfer",
        "#batchMasterPaymentInput",
        "[data-payment-channel-select]",
        "[data-batch-slip]",
        "[data-open-finance]",
        "[data-open-team]"
      ].forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => {
          const wrapper =
            node.id === "batchMasterPaymentInput"
              ? (node.closest("label") || node)
              : node;
          setHiddenV725(wrapper, true);
        });
      });

      document.querySelectorAll("[data-drawer-action]").forEach((node) => {
        const action = String(node.dataset.drawerAction || "");
        const allowed = new Set(["close","approve","reject","queue-approve","queue-reject"]);
        setHiddenV725(node, !allowed.has(action));
      });

      // Hide areas whose backend endpoints are outside Approver read/write scope.
      [
        '[data-p="income"]',
        '[data-p="reconciliation"]',
        '#businessGroup',
        '[data-p="settings"]',
        '[data-p="billing"]',
        '#connBtn',
        '[data-mobile-page="reconciliation"]',
        '[data-mobile-page="email"]',
        '[data-mobile-page="subscriptions"]',
        '[data-mobile-biz]',
        '[data-mobile-page="settings"]',
        '[data-mobile-page="billing"]'
      ].forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => setHiddenV725(node, true));
      });
    }

    // Viewer = read-only. Remove reimbursement/reconciliation write controls.
    if (role === "viewer") {
      [
        "#batchMasterCreate",
        "#batchMasterUrgent",
        "#batchMasterMarkTransfer",
        "#batchMasterPaymentInput",
        "[data-payment-channel-select]",
        "[data-batch-slip]",
        "[data-open-finance]",
        "[data-open-team]",
        "[data-drawer-action]:not([data-drawer-action='close'])",
        "#reconConfirmSuggested",
        "[data-recon-confirm]",
        "[data-recon-pick]",
        "[data-recon-unlink]",
        "[data-recon-ignore]",
        ".plan-action",
        "[data-select-plan]"
      ].forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => {
          const wrapper =
            node.id === "batchMasterPaymentInput"
              ? (node.closest("label") || node)
              : node;
          setHiddenV725(wrapper, true);
        });
      });

      // Business/configuration pages are not useful to a read-only viewer.
      [
        "#businessGroup",
        "#connBtn",
        '[data-mobile-biz]'
      ].forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => setHiddenV725(node, true));
      });
    }
  }

  // New DOM controls are rendered after API refreshes, so keep applying role restrictions.
  const observerV725 = new MutationObserver(() => hardenRoleUiV725());
  observerV725.observe(document.body, { childList:true, subtree:true });

  // body.dataset.dashboardRole is populated asynchronously by v7.14 /whoami.
  let ticksV725 = 0;
  const roleTimerV725 = setInterval(() => {
    ticksV725 += 1;
    hardenRoleUiV725();
    if (roleV725() || ticksV725 > 100) clearInterval(roleTimerV725);
  }, 100);

  const style = document.createElement("style");
  style.textContent = `
    .role-hidden-v725{display:none!important}
    .dashboard-access-revoked-v725 .page{
      user-select:none;
    }
  `;
  document.head.appendChild(style);

  console.info("[Dashboard]", VERSION, "active");
})();
