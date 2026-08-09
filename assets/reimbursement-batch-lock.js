/* Dashboard v7.9 — Prevent duplicate reimbursement merge
   กฎ:
   1) รวมใบเบิกได้เฉพาะรายการย่อย (queue) ที่ยังไม่เคยรวม
   2) ใบเบิกหลักที่สร้างแล้วห้ามถูกเลือกไปรวมซ้ำ
   3) การ์ดใบเบิกหลักต้องแสดงรหัส "รวมใบเบิกแล้ว · <code>"
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

  function decorateAlreadyMergedRows() {
    const body = document.getElementById("batchMasterBody");
    if (!body) return;

    body.querySelectorAll("tr[data-open-batch]").forEach((row) => {
      const batch = findBatchById(row.dataset.openBatch);
      const code = existingBatchCode(batch);
      if (!code) return;

      row.classList.add("already-merged-batch");

      // ป้องกัน checkbox หลงเหลือจาก render เดิม
      row.querySelectorAll("[data-master-merge-id], .master-checkbox").forEach((node) => node.remove());

      let badge = row.querySelector(".already-merged-badge");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "already-merged-badge";

        // วางใต้สถานะ จะเห็นชัดทั้ง desktop และ mobile card
        const target = row.querySelector('[data-label="สถานะ"]') || row.cells?.[2] || row;
        target.appendChild(badge);
      }
      badge.textContent = `รวมใบเบิกแล้ว · ${code}`;
      badge.title = `รายการนี้ถูกสร้างเป็นใบเบิกหลักแล้ว (${code}) และไม่สามารถรวมซ้ำได้`;
    });
  }

  // เดิม v7.7 อนุญาตทั้ง queue และ batch(review) ให้รวมใหม่ได้
  // v7.9: อนุญาตเฉพาะรายการย่อยที่ยังไม่เคยรวมเท่านั้น
  reviewMergeSelectable = function reviewMergeSelectableNoDuplicate(row) {
    return !!(row && row.kind === "queue" && row.statusKey === "review");
  };

  // ใบเบิกหลักที่เคยถูกเลือกค้างจาก UI เดิม ต้องล้างออกทันที
  try { REVIEW_BATCH_SELECTED.clear(); } catch {}

  const originalRenderMasterTable = renderMasterTable;
  renderMasterTable = function renderMasterTableNoDuplicateMerge(...args) {
    try { REVIEW_BATCH_SELECTED.clear(); } catch {}
    const result = originalRenderMasterTable.apply(this, args);
    decorateAlreadyMergedRows();
    return result;
  };

  // render ที่อาจเกิดก่อน patch ถูกโหลด
  queueMicrotask(() => {
    try {
      if (currentPageKey() === "batches") {
        renderMasterTable();
      } else {
        decorateAlreadyMergedRows();
      }
    } catch (error) {
      console.warn("v7.9 reimbursement batch lock initial decorate", error);
    }
  });

  // ป้องกัน DOM refresh ภายในหน้าแล้ว badge หาย
  const body = document.getElementById("batchMasterBody");
  if (body) {
    const observer = new MutationObserver(() => decorateAlreadyMergedRows());
    observer.observe(body, { childList: true, subtree: true });
  }

  const style = document.createElement("style");
  style.textContent = `
    .already-merged-badge{
      display:inline-flex;
      align-items:center;
      gap:6px;
      margin-top:8px;
      padding:5px 9px;
      border-radius:999px;
      border:1px solid rgba(0,0,0,.08);
      background:#f2f2f7;
      color:#5f6368;
      font-size:11px;
      line-height:1.2;
      font-weight:700;
      letter-spacing:-.01em;
      white-space:normal;
    }
    .already-merged-batch .sticky-select{
      pointer-events:none;
    }
    @media(max-width:860px){
      .already-merged-badge{
        display:flex;
        width:max-content;
        max-width:100%;
        font-size:12px;
        margin-top:8px;
        padding:6px 10px;
      }
      .already-merged-batch .sticky-select:empty{
        display:none!important;
      }
    }
  `;
  document.head.appendChild(style);

  console.info("[Dashboard] v7.9 duplicate reimbursement merge lock active");
})();
