// Chia lời nói thành các đoạn NGẮN (theo câu / cụm ý, ~2–6s) để người dùng tích giữ / bỏ từng chỗ lặp, vấp.
// Điểm chia: chỗ ngừng giữa 2 từ, ưu tiên khoảng lặng dài và từ mở câu ("thì", "và", "sau đấy"…).
// Các đoạn nối liền nhau (out đoạn trước = in đoạn sau) nên video không đổi khi tất cả cùng được giữ.
// Dùng chung cho tool Node và editor (trình duyệt).

const STARTERS = new Set(["thì", "và", "nhưng", "sau", "bởi", "hoặc", "nếu", "đầu", "ví", "chứ", "chúng", "còn", "rồi", "khi"]);
// Từ cuối câu (cắt SAU từ này rất tự nhiên) · từ nối (không được kết thúc đoạn bằng từ này)
const ENDERS = new Set(["nhé", "nhá", "ạ", "thôi", "luôn", "rồi", "hạn", "nào", "sao", "nhiều"]);
const GLUE = new Set(["và", "trong", "cho", "của", "là", "những", "cái", "các", "như", "mà", "để", "với", "về", "một", "được", "có", "đang", "sẽ", "đã", "này", "nó", "thì", "rất", "vào", "ra", "nếu", "khi", "hay", "hoặc", "bằng"]);
const clean = (w) => w.toLowerCase().replace(/[.,!?…]/g, "");
const r3 = (n) => Math.round(n * 1000) / 1000;

// words: [{ w, s, e }] đã sắp theo thời gian · [a, b]: khoảng giây gốc cần chia
// → [{ in, out, text }] liền nhau, phủ đúng [a, b]
export function splitShort(words, a, b, { min = 2.2, target = 4, max = 6.5 } = {}) {
  const ws = words.filter((x) => x.s >= a - 0.02 && x.s < b);
  if (ws.length < 2 || b - a <= max) return [{ in: r3(a), out: r3(b), text: ws.map((x) => x.w).join(" ") }];
  const cuts = []; // chỉ số từ bắt đầu đoạn mới
  let start = a, best = null;
  for (let i = 1; i < ws.length; i++) {
    const gap = Math.max(0, ws[i].s - ws[i - 1].e), at = (ws[i - 1].e + ws[i].s) / 2, len = at - start;
    const next = clean(ws[i].w), prev = clean(ws[i - 1].w);
    const score = gap * 4 + (STARTERS.has(next) ? 1 : 0) + (ENDERS.has(prev) ? 0.8 : 0) + (/[.,!?…]$/.test(ws[i - 1].w) ? 1 : 0)
      - (GLUE.has(prev) ? 1.5 : 0);
    if (len >= min && (!best || score > best.score)) best = { i, at, score };
    // cắt ngay ở chỗ ngừng rõ khi đã đủ dài, hoặc cắt ở điểm tốt nhất khi sắp quá dài
    const strong = len >= target && score >= 0.9;
    if ((strong || len >= max) && best && b - best.at >= min * 0.6) { cuts.push(best); start = best.at; best = null; }
  }
  const pts = [a, ...cuts.map((c) => c.at), b];
  return pts.slice(0, -1).map((p, k) => ({
    in: r3(p), out: r3(pts[k + 1]),
    text: ws.filter((x) => x.s >= p - 0.02 && x.s < pts[k + 1] - 0.02).map((x) => x.w).join(" "),
  }));
}
