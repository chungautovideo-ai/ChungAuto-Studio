// Pure timeline math for CapCut-style editing (split, delete left/right of playhead, snapping).
// All times are output seconds; callers convert to source time with the project timemap.

// Nearest snap point within tolerance, or null.
export function snapTo(t, points, tolerance) {
  let best = null;
  for (const p of points) {
    const d = Math.abs(p - t);
    if (d <= tolerance && (best === null || d < Math.abs(best - t))) best = p;
  }
  return best;
}

// Split [start, start+dur) at `at` → two spans, or null when `at` is too close to an edge.
export function splitSpan(start, dur, at, min = 0.1) {
  if (!(at > start + min && at < start + dur - min)) return null;
  return [{ start, dur: at - start }, { start: at, dur: start + dur - at }];
}

// Rows (tracks) inside one lane, CapCut-style: an item's chosen `row` wins when that row is free at its time,
// the rest pack into the lowest free row; empty rows collapse. items: [{id,start,end,row?}] → {rowOf: Map(id→row), count}.
export function packRows(items) {
  const rows = [], rowOf = new Map();
  const free = (k, s, e) => !(rows[k] || []).some(([a, b]) => s < b - 1e-6 && e > a + 1e-6);
  const put = (k, it) => { (rows[k] = rows[k] || []).push([it.start, it.end]); rowOf.set(it.id, k); };
  const sorted = items.slice().sort((a, b) => a.start - b.start);
  for (const it of sorted) if (Number.isInteger(it.row) && it.row >= 0 && free(it.row, it.start, it.end)) put(it.row, it);
  for (const it of sorted) if (!rowOf.has(it.id)) { let k = 0; while (!free(k, it.start, it.end)) k++; put(k, it); }
  const used = [...new Set(rowOf.values())].sort((a, b) => a - b), remap = new Map(used.map((r, i) => [r, i]));
  for (const [id, r] of rowOf) rowOf.set(id, remap.get(r));
  return { rowOf, count: Math.max(1, used.length) };
}

// Mono 16-bit PCM WAV from Float32 samples (voice-over recorded in the editor; WAV plays in preview and export alike).
export function encodeWav(samples, sampleRate) {
  const n = samples.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const tag = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  tag(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); tag(8, "WAVE"); tag(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); tag(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return buf;
}

// Delete the part left ("left", CapCut Q) or right ("right", CapCut W) of `at`; returns the kept span or null.
export function trimSpan(start, dur, at, side, min = 0.1) {
  const parts = splitSpan(start, dur, at, min);
  return parts ? parts[side === "left" ? 1 : 0] : null;
}
