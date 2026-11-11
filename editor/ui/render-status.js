// Mô tả trạng thái xuất video cho editor (và test): đọc job từ /api/render (render.json hoặc việc trong bộ nhớ)
// rồi trả nhãn / % / bước / lý do lỗi dễ hiểu. Không đoán %: chỉ dùng số tiến trình render đã báo; chưa có thì đánh dấu indeterminate.

// Mã thoát Windows khi tiến trình nhận Ctrl+C / Ctrl+Break (0xC000013A).
export const EXIT_CTRL_C = 3221225478;

const PROGRESS_LINE = /^\s*@hf-progress\b|[█░▒▓]{3,}|^\s*\[INFO\]\s*\[Render:trace\]/;

// Bỏ dòng thanh tiến độ / @hf-progress / trace để còn lại dòng có nội dung (lỗi, cảnh báo, thông báo).
export function cleanRenderLog(log, max = 8) {
  const out = [];
  for (const raw of String(log || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || PROGRESS_LINE.test(line)) continue;
    if (out[out.length - 1] === line) continue;
    out.push(line.length > 240 ? line.slice(0, 237) + "…" : line);
  }
  return out.slice(-max);
}

// Bước hiện tại từ dòng @hf-progress cuối trong log: { code, done, total, pct } hoặc null.
export function lastRenderStage(log) {
  const text = String(log || "");
  const found = text.match(/@hf-progress\s*(\{[^\r\n]*\})/g);
  if (!found) return null;
  for (let i = found.length - 1; i >= 0; i--) {
    try { const j = JSON.parse(found[i].replace(/^@hf-progress\s*/, "")); if (j && j.code) return j; } catch { /* dòng bị cắt giữa chừng */ }
  }
  return null;
}

export function formatElapsed(ms) {
  const s = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const fmtSec = (n) => `${Math.round(Number(n) || 0)}s`;

function stageText(job) {
  const st = lastRenderStage(job.log);
  if (!st) return "";
  if (st.code === "capture" && st.total) return `Chụp khung hình ${st.done}/${st.total}`;
  if (st.code === "assemble" && st.total) return `Ghép hình và âm thanh ${fmtSec(st.done)}/${fmtSec(st.total)}`;
  if (st.code === "encode") return "Mã hoá video";
  if (st.total) return `${st.code} ${st.done}/${st.total}`;
  return "";
}

// Lý do lỗi dễ hiểu từ log + mã thoát; luôn kèm vài dòng gốc đã lọc để người dùng/AI tra.
export function explainRenderFailure(job) {
  const log = String(job.log || "");
  const lines = cleanRenderLog(log, 6);
  let headline = "Xuất video không thành công", reason = "";
  if (/Tiến trình xuất bị dừng giữa chừng/.test(log)) {
    headline = "Tiến trình xuất bị dừng giữa chừng";
    reason = "Tiến trình render đã tắt trước khi xong (máy khởi động lại, cửa sổ bị đóng hoặc bị buộc dừng). Xuất lại để chạy từ đầu.";
  } else if (/Không tạo được bản chụp render|Không tạo bản chụp|bản chụp render/i.test(log)) {
    headline = "Không chuẩn bị được bản chụp dự án";
    reason = "Thiếu file tư liệu, hết dung lượng ổ đĩa hoặc dự án vừa đổi. Xem dòng chi tiết bên dưới.";
  } else if (/Không xác minh\/lưu được bản xuất/.test(log)) {
    headline = "Render xong nhưng không lưu được bản xuất";
    reason = "File không khớp kích thước/thời lượng của bản chụp hoặc không ghi được vào thư mục lưu.";
  } else if (/revision|phiên bản|đã thay đổi|đã đổi/i.test(log) && !/hf-progress/.test(log)) {
    headline = "Dự án đã đổi trong lúc chờ xuất";
    reason = "Lưu xong rồi bấm Xuất video lại để dùng bản mới nhất.";
  } else if (job.exitCode === EXIT_CTRL_C) {
    headline = "Tiến trình render bị ngắt";
    reason = "Tiến trình render thoát bằng mã Ctrl+C (0xC000013A) trước khi báo hoàn tất.";
  } else if (typeof job.exitCode === "number" && job.exitCode !== 0) {
    headline = "Tiến trình render báo lỗi";
    reason = `Mã thoát ${job.exitCode}.`;
  } else if (job.listener === false && job.waitingAi) {
    headline = "Chưa có AI nhận việc xuất";
    reason = "Mở Claude hoặc Codex trong thư mục phần mềm rồi giao lại việc.";
  } else if (lines.length) {
    reason = lines[lines.length - 1];
  }
  return { headline, reason, lines };
}

// Trạng thái hiển thị. now chỉ để tính thời gian đã chạy (test truyền giá trị cố định).
export function describeRender(job, now = Date.now()) {
  if (!job || (job.running === false && job.ok == null && !job.cancelled && !job.startedAt)) return { state: "idle" };
  const quality = job.quality === "final" ? "Xuất video" : "Dựng nháp";
  const title = job.capcut ? "Gói CapCut" : quality;
  const pct = Math.max(0, Math.min(100, Math.round(Number(job.progress) || 0)));
  const elapsed = job.startedAt ? formatElapsed((job.finishedAt || now) - job.startedAt) : "";
  const base = { title, pct, elapsed, startedAt: job.startedAt || 0, finishedAt: job.finishedAt || 0 };
  if (job.running) {
    if (job.waitingAi) {
      const taken = job.aiStatus === "working";
      return { ...base, state: "waiting", tone: "info", indeterminate: true, pct: 0, label: taken ? "AI đã nhận việc" : "Chờ AI nhận việc",
        detail: taken ? "AI đang chuẩn bị bản chụp dự án; chưa có % vì render chưa bắt đầu." : job.listener ? "Đã gửi việc cho AI đang chờ." : "Chưa có Claude / Codex nào đang chờ việc.", canCancel: true };
    }
    if (job.waitingResource) return { ...base, state: "waiting", tone: "info", indeterminate: true, pct: 0, label: "Chờ lượt render", detail: "Máy đang bận render việc khác; sẽ tự chạy khi tới lượt.", canCancel: true };
    if (job.finalizing) return { ...base, state: "finalizing", tone: "info", pct: Math.max(pct, 99), indeterminate: false, label: "Đang hoàn tất", detail: "Kiểm file, chuẩn hoá âm lượng và lưu vào thư mục xuất.", canCancel: false };
    const stage = stageText(job);
    const preparing = pct === 0 && !stage;
    return { ...base, state: "running", tone: "info", indeterminate: preparing, label: preparing ? "Đang chuẩn bị" : `Đang xuất ${pct}%`,
      detail: preparing ? "Chụp bản dựng và sao tư liệu; bước này chưa có %." : stage || "Đang render…", canCancel: !job.cancel, cancelling: !!job.cancel };
  }
  if (job.ok) return { ...base, state: "done", tone: "ok", pct: 100, label: "Xuất xong", detail: job.exitNote || "", warnings: job.warnings || [] };
  if (job.cancelled) return { ...base, state: "cancelled", tone: "muted", label: "Đã huỷ", detail: "Bạn đã huỷ xuất video." };
  const error = explainRenderFailure(job);
  return { ...base, state: "failed", tone: "error", label: "Xuất lỗi", detail: error.headline, error };
}
