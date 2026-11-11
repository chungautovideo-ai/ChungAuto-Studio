// Gợi ý cắt tự động cho segments: đoạn chỉ có tiếng đệm (ờ, à, ừm…) và lần nói trước của một câu được nói lại.
// Chỉ trả danh sách {id, reason} — người gọi quyết định đặt keep:false và in lý do cho AI/người dựng soát lại.
// shortcut: so khớp theo chữ (đầu câu trùng / Jaccard ≥ 0.6), chưa nghe âm thanh; Whisper gộp câu nói lại thì không thấy được.
const FILLERS = new Set(['ờ', 'ơ', 'à', 'ừ', 'ừm', 'ờm', 'ưm', 'ậm', 'ạ', 'hmm', 'hm', 'uh', 'um', 'umm', 'ah', 'eh', 'ơ kìa']);
const words = (t) => String(t || '').normalize('NFC').toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
const LOOKAHEAD = 2; // lần nói lại thường nằm ngay 1–2 đoạn sau

function isRetake(a, b) {
  if (!a.length || !b.length) return false;
  const n = Math.min(3, a.length);
  if (a.length <= b.length && a.slice(0, n).every((w, i) => w === b[i])) return true; // bỏ dở rồi nói lại từ đầu
  const A = new Set(a), B = new Set(b), common = [...A].filter((w) => B.has(w)).length;
  return a.length >= 4 && common / new Set([...A, ...B]).size >= 0.6; // nói lại gần như y câu, đổi vài từ
}

export function autoCutMarks(segments) {
  const live = (segments || []).filter((s) => s.keep !== false).map((s) => ({id: s.id, w: words(s.text)}));
  const marks = [];
  live.forEach((s, i) => {
    if (s.w.length && s.w.every((w) => FILLERS.has(w))) return marks.push({id: s.id, reason: 'chỉ có tiếng đệm'});
    const later = live.slice(i + 1, i + 1 + LOOKAHEAD).find((t) => !t.w.every((w) => FILLERS.has(w)) && isRetake(s.w, t.w));
    if (later) marks.push({id: s.id, reason: `nói lại ở ${later.id}`});
  });
  return marks;
}
