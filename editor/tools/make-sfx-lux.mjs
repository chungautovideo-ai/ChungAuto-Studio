#!/usr/bin/env node
// Nhạc nền "upbeat-light" (tự tổng hợp, không bản quyền) → editor/assets/music. Tiếng hiệu ứng là bản thu CC0 có sẵn trong editor/assets/sfx
//   node editor/tools/make-sfx-lux.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EDITOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;
let seed = 777;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const noise = () => rnd() * 2 - 1;
const len = (s) => Math.round(s * SR);
const coef = (fc) => 1 - Math.exp((-2 * Math.PI * Math.min(fc, SR * 0.45)) / SR);
const TAU = 2 * Math.PI;
const lp = (a) => { let y = 0; return (x) => (y += a * (x - y)); };

// Ghi WAV stereo 16-bit, chuẩn hoá đỉnh −1 dBFS, fade 3ms cuối để không "tách"
function wav(file, L, R) {
  let peak = 0;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.89 / peak : 1, n = L.length, fade = len(0.003);
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const f = Math.min(1, (n - 1 - i) / fade);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g * f)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g * f)) * 32767), 46 + i * 4);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}

// Vang phòng kiểu Freeverb gọn: 6 comb + 2 allpass mỗi kênh, kênh phải lệch delay để rộng stereo
function reverb(x, { size = 0.82, damp = 0.35, mix = 0.3, tail = 1.2, pre = 0.012 } = {}) {
  const n = x.length + len(tail), out = [new Float32Array(n), new Float32Array(n)];
  const combs = [1116, 1188, 1277, 1356, 1422, 1491], aps = [556, 441];
  for (let ch = 0; ch < 2; ch++) {
    const sp = ch * 23, pd = len(pre);
    const cb = combs.map((d) => ({ b: new Float32Array(d + sp), i: 0, s: 0 }));
    const ab = aps.map((d) => ({ b: new Float32Array(d + sp), i: 0 }));
    for (let i = 0; i < n; i++) {
      const dry = i < x.length ? x[i] : 0, inp = (i - pd >= 0 && i - pd < x.length ? x[i - pd] : 0) * 0.015;
      let w = 0;
      for (const c of cb) { const y = c.b[c.i]; c.s = y * (1 - damp) + c.s * damp; c.b[c.i] = inp + c.s * size; c.i = (c.i + 1) % c.b.length; w += y; }
      for (const a of ab) { const y = a.b[a.i]; const v = -w + y; a.b[a.i] = w + y * 0.5; a.i = (a.i + 1) % a.b.length; w = v; }
      out[ch][i] = dry * (1 - mix * 0.5) + w * mix;
    }
  }
  return out;
}
// Mono → stereo có vị trí (pan −1..1, có thể đổi theo thời gian)
const panned = (x, pan = () => 0) => {
  const L = new Float32Array(x.length), R = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { const p = (pan(i / x.length) + 1) * Math.PI / 4; L[i] = x[i] * Math.cos(p); R[i] = x[i] * Math.sin(p); }
  return [L, R];
};
// Vang cho tín hiệu stereo (mỗi kênh vang riêng rồi trộn chéo nhẹ)
function reverbST([L, R], o) {
  const a = reverb(L, o), b = reverb(R, o), n = a[0].length;
  const oL = new Float32Array(n), oR = new Float32Array(n);
  for (let i = 0; i < n; i++) { oL[i] = a[0][i] * 0.8 + b[0][i] * 0.2; oR[i] = b[1][i] * 0.8 + a[1][i] * 0.2; }
  return [oL, oR];
}
// Nhạc nền vui tươi nhẹ: 120 BPM, Đô trưởng (C–G–Am–F), marimba rải 8 nốt + bass + kick / snap / shaker khẽ.
// 48s = đúng 24 ô nhịp → nối lượt (chồng 2s = 1 ô) vẫn khớp phách.
function upbeatLight() {
  const bpm = 120, beat = 60 / bpm, bar = beat * 4, dur = 48, n = len(dur);
  const L = new Float32Array(n), R = new Float32Array(n);
  const add = (t0, d, pan, fn) => {
    const s = len(t0), e = Math.min(n, s + len(d)), pl = Math.cos((pan + 1) * Math.PI / 4), pr = Math.sin((pan + 1) * Math.PI / 4);
    for (let i = s; i < e; i++) { const v = fn((i - s) / SR); L[i] += v * pl; R[i] += v * pr; }
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; // C G Am F
  const marimba = (f) => (t) => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 4 * t) * Math.exp(-t * 30)) * Math.min(1, t / 0.002) * Math.exp(-t * 7) * 0.22;
  const bass = (f) => (t) => Math.tanh(Math.sin(TAU * f * t) * 1.4) * Math.min(1, t / 0.004) * Math.exp(-t * 5) * 0.3;
  const kick = (t) => Math.sin(TAU * (50 + 90 * Math.exp(-t * 35)) * t) * Math.exp(-t * 9) * 0.45;
  const hpN = ((y) => (x) => x - (y += coef(5000) * (x - y)))(0), hpS = ((y) => (x) => x - (y += coef(1800) * (x - y)))(0);
  const shaker = (a) => (t) => hpN(noise()) * Math.exp(-t * 70) * a;
  const snap = (t) => hpS(noise()) * Math.exp(-t * 35) * 0.28 + Math.sin(TAU * 1900 * t) * Math.exp(-t * 60) * 0.05;
  const ARP = [0, 1, 2, 1, 2, 0, 1, 2]; // nhảy nốt kiểu vui
  for (let b = 0; b < dur / bar; b++) {
    const t0 = b * bar, ch = CH[b % 4], intro = b < 2;
    // marimba rải 8 nốt (bè trên 1 quãng tám), lệch trái/phải
    ARP.forEach((k, j) => add(t0 + j * beat / 2, 0.6, j % 2 ? 0.35 : -0.35, marimba(mtof(ch[k] + 12))));
    // pad mềm cả ô nhịp
    add(t0, bar, 0, (t) => ch.reduce((v, m) => v + Math.sin(TAU * mtof(m) * t) * 0.025, 0) * Math.min(1, t / 0.4) * Math.min(1, (bar - t) / 0.3));
    if (intro) continue; // 2 ô đầu chỉ có marimba + pad
    [0, 1.5, 2, 3.5].forEach((k) => add(t0 + k * beat, 0.45, 0, bass(mtof(ch[0] - 24))));
    [0, 2].forEach((k) => add(t0 + k * beat, 0.4, 0, kick));
    [1, 3].forEach((k) => add(t0 + k * beat, 0.25, 0.1, snap));
    for (let j = 0; j < 8; j++) add(t0 + j * beat / 2 + (j % 2 ? 0.03 : 0), 0.08, 0.5, shaker(j % 2 ? 0.07 : 0.11));
  }
  for (let i = 0; i < n; i++) { const t = i / SR, g = Math.min(1, t / 1.5) * Math.min(1, (dur - t) / 2); L[i] *= g; R[i] *= g; }
  return reverbST([L, R], { mix: 0.18, tail: 0.01, size: 0.7, damp: 0.5 }).map((c) => c.subarray(0, n));
}

if (!process.argv[2]) { const [L, R] = upbeatLight(); wav(path.join(EDITOR, "assets", "music", "upbeat-light.wav"), L, R); console.log("✓ nhạc nền: assets/music/upbeat-light.wav"); }

