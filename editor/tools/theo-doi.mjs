#!/usr/bin/env node
// Bám theo 1 vùng trên video gốc để đồ hoạ / chữ dính vào người, vật: vị trí, cỡ, góc xoay (Track Motion trong After Effects).
//   node editor/tools/theo-doi.mjs <thư mục dự án> --box x,y,w,h --from <giây> --to <giây> [--block <id khối>] [--fps 15]
// --box: vùng cần bám ở khung đầu, toạ độ khung hình lúc chưa zoom. Chọn cả mặt hoặc cả vật, vùng càng rộng và nhiều chi tiết thì cỡ, góc xoay càng chuẩn.
// Có --block: ghi vào blocks[].follow trong project.json. Không có: in danh sách mốc [giây gốc, x, y, cỡ, xoay].
// Giây là giây trên video gốc, build tự đổi sang giây sau khi cắt. Khối bám theo tự đi cùng zoom và dời người của camera.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const a = process.argv.slice(2);
const opt = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
const dir = a[0] && path.resolve(a[0]), file = dir && path.join(dir, "project.json");
if (!file || !fs.existsSync(file) || !opt("--box") || opt("--from") == null || opt("--to") == null) {
  console.error("Dùng: theo-doi.mjs <dự án> --box x,y,w,h --from s --to s [--block id] [--fps 15]");
  process.exit(1);
}
const originalProject = fs.readFileSync(file);
const P = JSON.parse(originalProject);
// This legacy tracker measures one primary source in composed coordinates.
// Never silently apply its clock to a multi-source timeline or a candidate job.
if (P.source?.timeline === 'segments') { console.error('✗ Tracker này chỉ hỗ trợ một nguồn A-roll; chưa hỗ trợ timeline nhiều nguồn.'); process.exit(1); }
const pendingFile=path.join(dir,'work','ai-job.json');
if(fs.existsSync(pendingFile)){
  const job=JSON.parse(fs.readFileSync(pendingFile,'utf8'));
  if(job.candidate&&['waiting','working'].includes(job.status)){console.error('✗ Dự án đang có candidate AI; không sửa project gốc bằng tracker legacy.');process.exit(1);}
}
const video = path.join(dir, P.source?.video || "inputs/raw.mp4");
if (!fs.existsSync(video)) { console.error("✗ Không thấy " + video); process.exit(1); }
const FPS = Number(opt("--fps", 15)), t0 = Number(opt("--from")), t1 = Number(opt("--to"));
const box=opt('--box').split(',').map(Number);
if(!Number.isFinite(FPS)||FPS<1||FPS>30||!Number.isFinite(t0)||!Number.isFinite(t1)||t0<0||t1<=t0||t1-t0>15||box.length!==4||box.some(v=>!Number.isFinite(v))||box[0]<0||box[1]<0||box[2]<24||box[3]<24){console.error('✗ Cần fps1–30, khoảng nguồn0–15giây và vùng x,y,w,h hợp lệ (cỡ tối thiểu24px).');process.exit(1);}
// đo trong đúng khung hình của dự án (video được phủ kín khung như lúc dựng), ở nửa độ phân giải cho nhanh
const wide = P.format === "16:9", K = 2, WK = (wide ? 1920 : 1080) / K, HK = (wide ? 1080 : 1920) / K;
const fx = P.camera?.faceX ?? 0.5, fy = wide ? (P.camera?.faceY ?? 0.36) : 0.5;
if(box[0]+box[2]>WK*K||box[1]+box[3]>HK*K){console.error('✗ Vùng tracking vượt khung dự án.');process.exit(1);}
const buf = execFileSync("ffmpeg", ["-v", "error", "-ss", String(t0), "-t", String(t1 - t0), "-i", video,
  "-vf", `fps=${FPS},scale=${WK}:${HK}:force_original_aspect_ratio=increase,crop=${WK}:${HK}:(iw-ow)*${fx}:(ih-oh)*${fy}`, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 2 ** 32 });
const N = Math.floor(buf.length / (WK * HK));
if (N < 2 || N < Math.ceil((t1-t0)*FPS)-1) { console.error("✗ Nguồn không đủ khung cho khoảng tracking; chưa ghi kết quả."); process.exit(1); }
const [bx, by, bw, bh] = opt("--box").split(",").map((v) => Number(v) / K);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const at = (f, x, y) => buf[f * WK * HK + y * WK + x];
const PS = clamp(Math.round(Math.min(bw, bh) / 2.5), 12, 40), R = 10;
const grab = (f, x, y) => { const t = new Float32Array(PS * PS); for (let j = 0; j < PS; j++) for (let i = 0; i < PS; i++) t[j * PS + i] = at(f, x + i, y + j); return t; };

// các mảnh nhỏ trong vùng, chỉ giữ mảnh có chi tiết (vùng phẳng không bám được)
let pts = [];
for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
  const x = Math.round(bx + ((bw - PS) * c) / 3), y = Math.round(by + ((bh - PS) * r) / 3);
  if (x < 0 || y < 0 || x + PS >= WK || y + PS >= HK) continue;
  const t = grab(0, x, y), m = t.reduce((s, v) => s + v, 0) / t.length, sd = Math.sqrt(t.reduce((s, v) => s + (v - m) ** 2, 0) / t.length);
  if (sd > 6) pts.push({ x0: x + PS / 2, y0: y + PS / 2, tpl: t });
}
if (pts.length < 3) { console.error("✗ Vùng quá phẳng, không đủ chi tiết để bám. Chọn vùng có mặt, logo, hoa văn"); process.exit(1); }
const cx0 = bx + bw / 2, cy0 = by + bh / 2;

// khớp phép dời + phóng + xoay giữa vị trí đầu và vị trí hiện tại của các mảnh
function fit(list) {
  const n = list.length, ax = list.reduce((s, p) => s + p.x0, 0) / n, ay = list.reduce((s, p) => s + p.y0, 0) / n, cx = list.reduce((s, p) => s + p.x, 0) / n, cy = list.reduce((s, p) => s + p.y, 0) / n;
  let dd = 0, A = 0, B = 0;
  for (const p of list) { const u = p.x0 - ax, v = p.y0 - ay, U = p.x - cx, V = p.y - cy; dd += u * u + v * v; A += u * U + v * V; B += u * V - v * U; }
  const c = A / dd, s = B / dd;
  return { c, s, tx: cx - (c * ax - s * ay), ty: cy - (s * ax + c * ay) };
}
const apply = (T, x, y) => [T.c * x - T.s * y + T.tx, T.s * x + T.c * y + T.ty];

// Trel: từ khung gốc tham chiếu tới khung hiện tại · Tref: từ khung đầu tới khung tham chiếu.
// Mẫu được phóng, xoay theo Trel rồi mới so, nên không bị trôi dần khi vật to lên hoặc nghiêng đi
const ID = { c: 1, s: 0, tx: 0, ty: 0 }, REKEY = 30;
const join = (A, B) => ({ c: A.c * B.c - A.s * B.s, s: A.s * B.c + A.c * B.s, tx: A.c * B.tx - A.s * B.ty + A.tx, ty: A.s * B.tx + A.c * B.ty + A.ty }); // B trước, A sau
let Tref = ID, Trel = ID;
for (const p of pts) { p.x = p.x0; p.y = p.y0; }
const raw = [[t0, cx0, cy0, 1, 0]];
for (let f = 1; f < N; f++) {
  for (const p of pts) {
    const [px, py] = apply(Trel, p.x0, p.y0), ox = Math.round(px), oy = Math.round(py), m = PS * 1.5;
    let best = Infinity, bestX = ox, bestY = oy;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const x = ox + dx, y = oy + dy;
      if (x < m || y < m || x >= WK - m || y >= HK - m) continue;
      let e = 0;
      for (let j = 0; j < PS && e < best; j += 2) for (let i = 0; i < PS; i += 2) {
        const u = i - PS / 2, v = j - PS / 2;
        e += Math.abs(at(f, Math.round(x + Trel.c * u - Trel.s * v), Math.round(y + Trel.s * u + Trel.c * v)) - p.tpl[j * PS + i]);
      }
      e += Math.hypot(dx, dy) * 0.5; // cùng độ khớp thì chọn chỗ gần dự đoán
      if (e < best) { best = e; bestX = x; bestY = y; }
    }
    p.x = bestX; p.y = bestY; p.err = best / ((PS / 2) ** 2);
  }
  let good = pts.filter((q) => q.err < 30);
  if (good.length >= 3) {
    let F = fit(good);
    const res = (q) => { const [x, y] = apply(F, q.x0, q.y0); return Math.hypot(x - q.x, y - q.y); };
    const ok = good.filter((q) => res(q) <= 3);
    if (ok.length >= 3) F = fit(ok);
    Trel = F;
    const checked=good.filter(q=>res(q)<=3);
    const scale=Math.hypot(F.c,F.s);
    if(checked.length<3||checked.length/good.length<.6||!Number.isFinite(scale)||scale<.5||scale>2){console.error(`✗ Tracking không nhất quán tại giây ${(t0+f/FPS).toFixed(3)}; chưa ghi kết quả. Chia đoạn hoặc chọn lại vùng.`);process.exit(1);}
  } else {
    console.error(`✗ Mất dấu tại giây ${(t0+f/FPS).toFixed(3)}; chưa ghi kết quả. Chia đoạn hoặc chọn lại vùng.`);
    process.exit(1);
  }
  const T = join(Trel, Tref), [x, y] = apply(T, cx0, cy0);
  raw.push([+(t0 + f / FPS).toFixed(3), x, y, Math.hypot(T.c, T.s), (Math.atan2(T.s, T.c) * 180) / Math.PI]);
  // lấy lại mẫu định kỳ theo dáng mới của vật (người nói đổi nét mặt, ánh sáng)
  if (f % REKEY === 0 && good.length >= 3) {
    const keep = Trel;
    Tref = T; Trel = ID;
    for (const p of pts) {
      const [qx, qy] = apply(keep, p.x0, p.y0);
      p.x0 = clamp(qx, PS * 2, WK - PS * 2); p.y0 = clamp(qy, PS * 2, HK - PS * 2);
      p.tpl = grab(f, Math.round(p.x0 - PS / 2), Math.round(p.y0 - PS / 2));
    }
  }
}
// làm mượt rồi đổi về khung gốc
const sm = raw.map((k, i) => {
  const av = (j, w) => { const q = raw.slice(Math.max(0, i - w), i + w + 1); return q.reduce((s, r) => s + r[j], 0) / q.length; };
  return [k[0], Math.round(av(1, 2) * K), Math.round(av(2, 2) * K), +av(3, 3).toFixed(4), +av(4, 3).toFixed(2)];
});
const ra = (j) => { const v = sm.map((k) => k[j]); return `${Math.min(...v)}–${Math.max(...v)}`; };
console.log(`✓ ${sm.length} mốc · ${pts.length} mảnh · x ${ra(1)} · y ${ra(2)} · cỡ ×${ra(3)} · xoay ${ra(4)}° · cần xem lại toàn đoạn`);
const blockId = opt("--block");
if (blockId) {
  const b = (P.blocks || []).find((q) => String(q.id) === blockId);
  if (!b) { console.error("✗ Không có khối " + blockId); process.exit(1); }
  b.follow = sm;
  if(!fs.readFileSync(file).equals(originalProject)){console.error('✗ Dự án đã đổi khi tracking; chưa ghi kết quả.');process.exit(1);}
  fs.writeFileSync(file, JSON.stringify(P, null, 2));
  console.log(`✓ Đã ghi vào khối ${blockId}. Chạy lại: node editor/lib/build.mjs ${path.relative(process.cwd(), dir)}`);
} else console.log(JSON.stringify(sm));
