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
