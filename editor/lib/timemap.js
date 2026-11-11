// Quy đổi thời gian giữa video gốc (source) và video sau khi cắt (output).
import {endCardDuration} from './end-card.js';
// Mọi mốc "at" trong project.json là giờ của video gốc, nên bật/tắt một đoạn cắt
// thì chữ, zoom, cảnh minh hoạ tự dịch theo mà không lệch lời nói.
// Dùng chung cho build (Node) và editor (trình duyệt).

export function keptSegments(project) {
  return (project.segments || [])
    .filter((s) => s.keep !== false && s.out > s.in)
    .slice()
    .sort((a, b) => a.in - b.in);
}

// Tốc độ phát: từng đoạn (seg.speed) > cả video (project.speed) > 1. Đoạn tăng tốc ngắn lại trong video xuất.
export function speedOf(project, seg) {
  const r = Number(seg?.speed) || Number(project.speed) || 1;
  return Math.max(0.25, Math.min(4, r));
}

export function makeTimemap(project) {
  const segs = [];
  let acc = 0;
  for (const s of keptSegments(project)) {
    const rate = speedOf(project, s), len = (s.out - s.in) / rate;
    segs.push({ id: s.id, in: s.in, out: s.out, outStart: acc, outEnd: acc + len, rate, ...Object.fromEntries(['audioEnvelope','audioVolume','audioFadeIn','audioFadeOut','fit','crop','transform','color','motionZoom','src','mediaStart','mediaInfo'].filter(k=>s[k]!==undefined).map(k=>[k,s[k]])) });
    acc += len;
  }
  const contentTotal=acc,total=acc+endCardDuration(project);

  // Mốc rơi vào đoạn đã cắt bỏ thì dời sang đầu đoạn giữ lại kế tiếp.
  function srcToOut(t) {
    if (!segs.length) return 0;
    for (const s of segs) {
      if (t < s.in) return s.outStart;
      if (t <= s.out) return s.outStart + (t - s.in) / s.rate;
    }
    return contentTotal;
  }

  function outToSrc(o) {
    if (!segs.length) return 0;
    for (const s of segs) {
      if (o <= s.outEnd) return s.in + Math.max(0, o - s.outStart) * s.rate;
    }
    return segs[segs.length - 1].out;
  }

  // Mốc gốc t có nằm trong đoạn được giữ không (dùng cho phụ đề, transcript).
  function isKept(t) {
    return segs.some((s) => t >= s.in && t <= s.out);
  }

  return { segs, total, contentTotal, srcToOut, outToSrc, isKept };
}

// Gộp các đoạn giữ nối liền nhau (chỉ chia nhỏ để dễ tích giữ / bỏ, không có điểm cắt thật) → khi dựng
// phát liền mạch 1 lượt video, không chuyển cảnh / tiếng cắt ở giữa câu. Đoạn có chuyển cảnh riêng (tIn) giữ nguyên.
export function mergeContiguous(segs, project) {
  const out = [];
  for (const s of segs) {
    const last = out[out.length - 1], seg = (project.segments || []).find((x) => x.id === s.id);
    if (last && Math.abs(s.in - last.out) < 0.002 && !seg?.tIn && !last.src && !s.src && !last.audioEnvelope && !s.audioEnvelope && !last.motionZoom && !s.motionZoom && last.fit===s.fit && JSON.stringify(last.crop??null)===JSON.stringify(s.crop??null) && JSON.stringify(last.transform??null)===JSON.stringify(s.transform??null) && JSON.stringify(last.color??null)===JSON.stringify(s.color??null) && ![last.audioFadeIn,last.audioFadeOut,s.audioFadeIn,s.audioFadeOut].some(v=>v!==undefined) && last.rate === s.rate && (last.audioVolume??1)===(s.audioVolume??1)) { last.out = s.out; last.outEnd = s.outEnd; continue; }
    out.push({ ...s });
  }
  return out;
}

export const round3 =(n) => Math.round(n * 1000) / 1000;
