/* Dashboard v7.8 — Cash-basis Overview
   หน้า Overview = เงินออกจริง
   - จ่ายจริงแล้ว / กราฟ / หมวด / ร้าน: เฉพาะรายการที่จ่ายแล้ว
   - รอดำเนินการ: รายการที่ยังไม่จ่าย
   - ยอดตั้งเบิกทั้งหมด: รายการทั้งหมดในช่วงที่เลือก
   ไม่เปลี่ยนข้อมูล ไม่เขียน Sheet และไม่แตะ workflow เบิกจ่าย
*/
(() => {
  "use strict";

  const truthy = (value) => {
    if (value === true || value === 1) return true;
    const s = String(value ?? "").trim().toLowerCase();
    return ["true", "1", "yes", "y", "ใช่", "จ่ายแล้ว", "paid"].includes(s);
  };

  const isPaidExpense = (row = {}) => {
    const status = String(row.status || "").trim();
    const batchStatus = String(row.batchStatus || "").trim();
    return (
      status === "จ่ายแล้ว" ||
      batchStatus === "จ่ายแล้ว" ||
      truthy(row.paid) ||
      Boolean(String(row.reimbursedAt || "").trim())
    );
  };

  const paidScoped = () => scoped().filter(isPaidExpense);

  renderKPIs = function renderKPIsCashBasis() {
    const D = scoped();
    const paid = D.filter(isPaidExpense);
    const pending = D.filter((r) => !isPaidExpense(r));

    const totalClaimed = D.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const paidTotal = paid.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const pendingTotal = pending.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    el("kSpend").textContent = baht(paidTotal);
    el("kCount").textContent = D.length;

    el("kPending").textContent = baht(pendingTotal);
    el("kPendingCount").textContent = pending.length + " รายการ";

    // การ์ดที่ 4 ใช้ id เดิมเพื่อไม่กระทบโครงหน้า แต่ความหมายใหม่คือยอดตั้งเบิกทั้งหมด
    el("kPaid").textContent = baht(totalClaimed);
    el("kPaidCount").textContent = D.length + " รายการ";

    // เปรียบเทียบ "เงินออกจริง" เดือนนี้กับเดือนก่อนเท่านั้น
    const now = new Date();
    const sumPaidMonth = (month, year) =>
      ALL.filter((r) => {
        if (!isPaidExpense(r)) return false;
        const d = pdate(r.dateISO || r.date);
        return d && d.getMonth() === month && d.getFullYear() === year;
      }).reduce((s, r) => s + (Number(r.amount) || 0), 0);

    const cur = sumPaidMonth(now.getMonth(), now.getFullYear());
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prev = sumPaidMonth(lm.getMonth(), lm.getFullYear());
    const cmp = el("kSpendCmp");

    if (!cmp) return;
    if (prev > 0) {
      const diff = ((cur - prev) / prev) * 100;
      const up = diff >= 0;
      cmp.textContent = (up ? "▲ +" : "▼ ") + diff.toFixed(0) + "% เงินออกจริงเทียบเดือนก่อน";
      cmp.style.color = "rgba(255,255,255,.62)";
    } else if (cur > 0) {
      cmp.textContent = "เงินออกจริงเดือนนี้";
      cmp.style.color = "rgba(255,255,255,.62)";
    } else {
      cmp.textContent = "ยังไม่มีรายการที่จ่ายจริง";
      cmp.style.color = "rgba(255,255,255,.62)";
    }
  };

  renderTrend = function renderTrendCashBasis() {
    const D = paidScoped()
      .slice()
      .sort((a, b) => {
        const ad = pdate(a.dateISO || a.date);
        const bd = pdate(b.dateISO || b.date);
        return (ad?.getTime() || 0) - (bd?.getTime() || 0);
      });

    const svg = el("trend");
    if (!svg) return;

    if (!D.length) {
      svg.innerHTML =
        '<text x="300" y="80" text-anchor="middle" fill="#86868b" font-size="13">ยังไม่มีรายการที่จ่ายจริง</text>';
      return;
    }

    const byDay = {};
    D.forEach((r) => {
      const d = pdate(r.dateISO || r.date);
      const k = d ? d.toISOString().slice(0, 10) : "?";
      byDay[k] = (byDay[k] || 0) + (Number(r.amount) || 0);
    });

    const keys = Object.keys(byDay).sort();
    const vals = keys.map((k) => byDay[k]);
    const max = Math.max(...vals, 1), W = 600, H = 150, pad = 8;
    const x = (i) => keys.length < 2 ? W / 2 : pad + (i / (keys.length - 1)) * (W - 2 * pad);
    const y = (v) => H - pad - (v / max) * (H - 2 * pad);
    const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const area = `${pad},${H-pad} ${line} ${x(keys.length - 1)},${H-pad}`;

    svg.innerHTML =
      `<polygon points="${area}" fill="#1d1d1f" opacity="0.06"/>` +
      `<polyline points="${line}" fill="none" stroke="#1d1d1f" stroke-width="2.5" stroke-linejoin="round"/>` +
      vals.map((v, i) =>
        `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="#1d1d1f"/>`
      ).join("");
  };

  renderCats = function renderCatsCashBasis() {
    const map = {};
    paidScoped().forEach((r) => {
      const key = String(r.category || "ไม่ระบุ").trim() || "ไม่ระบุ";
      map[key] = (map[key] || 0) + (Number(r.amount) || 0);
    });
    const arr = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const max = arr.length ? arr[0][1] : 1;
    el("cats").innerHTML = arr.length
      ? arr.map(([n, v]) =>
          `<div class="catrow"><div class="top"><span>${esc(n)}</span><span class="cv">${baht(v)}</span></div>` +
          `<div class="track"><div class="fill" style="width:${Math.max(6, (v/max)*100)}%"></div></div></div>`
        ).join("")
      : '<div class="empty">ยังไม่มีรายการที่จ่ายจริง</div>';
  };

  renderVendors = function renderVendorsCashBasis() {
    const map = {};
    paidScoped().forEach((r) => {
      const key = String(r.vendor || "ไม่ระบุ").trim() || "ไม่ระบุ";
      map[key] = (map[key] || 0) + (Number(r.amount) || 0);
    });
    const arr = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = arr.length ? arr[0][1] : 1;
    el("vendors").innerHTML = arr.length
      ? arr.map(([n, v]) =>
          `<div class="catrow"><div class="top"><span>${esc(n)}</span><span class="cv">${baht(v)}</span></div>` +
          `<div class="track"><div class="fill" style="width:${Math.max(6, (v/max)*100)}%;background:var(--orange)"></div></div></div>`
        ).join("")
      : '<div class="empty">ยังไม่มีรายการที่จ่ายจริง</div>';
  };

  // ถ้า core โหลดข้อมูลเสร็จก่อน patch นี้ ให้ redraw Overview ทันที
  try {
    if (typeof HAS_LOADED !== "undefined" && HAS_LOADED && currentPageKey() === "overview") {
      renderKPIs();
      renderTrend();
      renderCats();
      renderVendors();
    }
  } catch (error) {
    console.warn("cash-basis overview initial redraw", error);
  }

  console.info("[Dashboard] v7.8 cash-basis overview active");
})();
