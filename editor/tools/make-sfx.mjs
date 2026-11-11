#!/usr/bin/env node
// Tổng hợp nhạc nền (tự tạo, không bản quyền) → editor/assets/music/*.wav. Tiếng hiệu ứng là bản thu CC0 có sẵn trong editor/assets/sfx
//   node editor/tools/make-sfx.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EDITOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;
let seed = 12345;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const noise = () => rnd() * 2 - 1;

function wav(file, data) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.89 / peak : 1;
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + data.length * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * g)) * 32767), 44 + i * 2));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}
const len = (s) => Math.round(s * SR);
// Bộ lọc 1 cực
const lp = (a) => { let y = 0; return (x) => (y += a * (x - y)); };
const hp = (a) => { const l = lp(a); return (x) => x - l(x); };
const coef = (fc) => 1 - Math.exp((-2 * Math.PI * fc) / SR);

// Nhạc nền beat bass dày ~96 BPM (808 + clap + hi-hat + pad), 48 giây
function musicBed() {
  const bpm = 96, beat = 60 / bpm, dur = 48, n = len(dur), out = new Float32Array(n);
  const add = (t0, fn, d) => { const s = len(t0), e = Math.min(n, s + len(d)); for (let i = s; i < e; i++) out[i] += fn((i - s) / SR); };
  const kick = (t) => { const f = 46 + 80 * Math.exp(-t * 25); return Math.tanh(Math.sin(2 * Math.PI * f * t) * 2) * Math.exp(-t * 2.6) * 0.8; };
  const clapL = hp(coef(900));
  const clap = (t) => clapL(noise()) * (Math.exp(-t * 30) + (t > 0.012 ? 0.6 * Math.exp(-(t - 0.012) * 30) : 0)) * 0.5;
  const hatL = hp(coef(7000));
  const hat = (t) => hatL(noise()) * Math.exp(-t * 90) * 0.22;
  const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 196, 261.6], [196, 246.9, 293.7]];
  const bars = Math.ceil(dur / (beat * 4));
  for (let b = 0; b < bars; b++) {
    const t0 = b * beat * 4, ch = chords[b % 4];
    [0, 1.5, 2.5].forEach((k) => add(t0 + k * beat, kick, 1.2));
    [1, 3].forEach((k) => add(t0 + k * beat, clap, 0.3));
    for (let k = 0; k < 8; k++) add(t0 + k * beat * 0.5, hat, 0.08);
    if (b % 2) add(t0 + 3.75 * beat, hat, 0.08);
    add(t0, (t) => ch.reduce((v, f) => v + Math.sin(2 * Math.PI * f * t) * 0.06, 0) * Math.min(1, t * 2) * Math.max(0, 1 - t / (beat * 4)), beat * 4);
  }
  for (let i = 0; i < n; i++) { const t = i / SR; out[i] *= Math.min(1, t / 0.8) * Math.min(1, (dur - t) / 2); }
  return out;
}

// Nhạc nền nhẹ (pad ấm + nhịp kick rất khẽ) — video mẫu dùng nền nhạc mỏng, lực nằm ở SFX chuyển cảnh
function ambientPad() {
  const dur = 48, n = len(dur), out = new Float32Array(n), bpm = 96, beat = 60 / bpm;
  const chords = [[110, 220, 261.6, 329.6], [87.3, 174.6, 220, 261.6], [65.4, 130.8, 196, 261.6], [98, 196, 246.9, 293.7]];
  const barLen = beat * 4, l = lp(coef(1800));
  for (let i = 0; i < n; i++) {
    const t = i / SR, bar = Math.floor(t / barLen), ch = chords[bar % 4], tb = t - bar * barLen;
    const swell = Math.min(1, tb / 0.6) * Math.min(1, (barLen - tb) / 0.4 + 0.4);
    let v = 0;
    ch.forEach((f, k) => { v += Math.sin(2 * Math.PI * f * t + k) * (k ? 0.08 : 0.12) + Math.sin(2 * Math.PI * f * 1.003 * t) * 0.04; });
    out[i] = l(v) * swell;
    const tk = t % (beat * 2);
    out[i] += Math.sin(2 * Math.PI * (44 + 50 * Math.exp(-tk * 25)) * tk) * Math.exp(-tk * 6) * 0.18;
  }
  for (let i = 0; i < n; i++) { const t = i / SR; out[i] *= Math.min(1, t / 1.5) * Math.min(1, (dur - t) / 2); }
  return out;
}

wav(path.join(EDITOR, "assets", "music", "beat-bass.wav"), musicBed());
wav(path.join(EDITOR, "assets", "music", "ambient-pad.wav"), ambientPad());
console.log("✓ nhạc nền assets/music/beat-bass.wav, ambient-pad.wav");
