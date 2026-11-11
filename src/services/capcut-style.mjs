// Learn the owner's editing style from local CapCut drafts (read-only) and package it as an agent skill.
// Drafts are listed by CapCut in root_meta_info.json; draft_content.json is plain JSON in most versions
// (encrypted drafts are reported and skipped). Media files are never read.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const US = 1e6; // CapCut times are microseconds

export function defaultRootMeta() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(base, 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft', 'root_meta_info.json');
}

function readDraft(folder) {
  const text = fs.readFileSync(path.join(folder, 'draft_content.json'), 'utf8');
  if (!text.startsWith('{')) throw Object.assign(new Error('Dự án CapCut đã mã hoá, không đọc được.'), { code: 'ENCRYPTED' });
  return JSON.parse(text);
}

export function listCapcutProjects(rootMeta = defaultRootMeta(), limit = 200) {
  let meta;
  try { meta = JSON.parse(fs.readFileSync(rootMeta, 'utf8')); } catch { return { available: false, projects: [] }; }
  const projects = (meta.all_draft_store || [])
    .filter((d) => d.draft_name && d.draft_fold_path)
    .sort((a, b) => (b.tm_draft_modified || 0) - (a.tm_draft_modified || 0))
    .slice(0, limit)
    .map((d) => ({ name: d.draft_name, duration: Math.round((d.tm_duration || 0) / US), modified: Math.round((d.tm_draft_modified || 0) / 1000), folder: d.draft_fold_path }));
  return { available: true, projects };
}

const count = (map, key, n = 1) => { if (key) map[key] = (map[key] || 0) + n; };
const top = (map, n = 6) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const total = (map) => Object.values(map || {}).reduce((t, c) => t + c, 0);

// Pure: style facts from one parsed draft_content.json (nested compound clips included).
export function analyzeDraft(draft) {
  const out = { duration: (draft.duration || 0) / US, canvas: `${draft.canvas_config?.width || 0}x${draft.canvas_config?.height || 0}`, shots: [], overlayClips: 0, texts: 0,
    captionLines: 0, fonts: {}, textColors: {}, captionFonts: {}, captionColors: {}, textAnims: {}, captionTemplates: {}, transitions: {}, transitionDur: [], effects: {}, stickers: {}, sounds: {}, soundCount: 0,
    musicVolumes: [], speedChanged: 0, keyframes: 0, adjust: {}, vocalEnhance: 0, denoise: 0 };
  // Every draft level counts: finished videos are often compound clips ("Clip ghép") whose real cuts live in materials.drafts[].draft.
  const visit = (d) => {
    const m = d.materials || {}, videoTracks = (d.tracks || []).filter((t) => t.type === 'video');
    const compound = new Set((m.videos || []).filter((v) => !v.path && /^Clip/i.test(v.material_name || '')).map((v) => v.id));
    if (videoTracks[0]) for (const s of videoTracks[0].segments || []) if (!compound.has(s.material_id)) out.shots.push((s.target_timerange?.duration || 0) / US);
    for (const t of videoTracks.slice(1)) out.overlayClips += (t.segments || []).filter((s) => !compound.has(s.material_id)).length;
    for (const t of d.tracks || []) for (const s of t.segments || []) out.keyframes += (s.common_keyframes || []).length;
    for (const t of m.texts || []) {
      const caption = t.type === 'subtitle' || !!t.recognize_task_id; // auto-captions come from CapCut speech recognition
      if (caption) out.captionLines++; else out.texts++;
      try {
        for (const st of JSON.parse(t.content).styles || []) {
          const font = path.basename(st.font?.path || '').replace(/\.(otf|ttf)$/i, '');
          if (!/^[0-9a-f]{12,}$/i.test(font)) count(caption ? out.captionFonts : out.fonts, font); // hash names are CapCut cache ids, not fonts
        }
      } catch {}
      count(caption ? out.captionColors : out.textColors, (t.text_color || '').toLowerCase());
    }
    for (const tt of m.text_templates || []) count(out.captionTemplates, tt.name);
    for (const a of m.material_animations || []) if (a.type === 'sticker_animation') for (const x of a.animations || []) if (x.name) count(out.textAnims, `${x.name} (${x.type})`);
    for (const tr of m.transitions || []) { count(out.transitions, tr.name); if (tr.duration) out.transitionDur.push(tr.duration / US); }
    for (const e of m.video_effects || []) count(out.effects, e.name);
    for (const e of m.effects || []) if (e.type && !e.name) count(out.adjust, e.type);
    for (const s of m.stickers || []) count(out.stickers, s.name);
    for (const a of m.audios || []) if (a.type === 'sound') { out.soundCount++; count(out.sounds, a.name); }
    for (const t of (d.tracks || []).filter((x) => x.type === 'audio')) for (const s of t.segments || []) {
      const mat = (m.audios || []).find((a) => a.id === s.material_id);
      if (mat?.type === 'music' && Number.isFinite(s.volume)) out.musicVolumes.push(s.volume);
    }
    out.speedChanged += (m.speeds || []).filter((s) => (s.speed && Math.abs(s.speed - 1) > 0.01) || s.mode === 1).length;
    out.vocalEnhance += (m.vocal_beautifys || []).length;
    out.denoise += (m.realtime_denoises || []).length;
    for (const sub of m.drafts || []) if (sub.draft) visit(sub.draft);
  };
  visit(draft);
  return out;
}

// Pure: merge several analyses into one style profile with per-minute rates.
export function buildProfile(analyses) {
  const minutes = Math.max(analyses.reduce((t, a) => t + a.duration, 0) / 60, 1 / 60);
  const merged = {};
  for (const k of ['fonts', 'textColors', 'captionFonts', 'captionColors', 'textAnims', 'captionTemplates', 'transitions', 'effects', 'stickers', 'sounds', 'adjust'])
    for (const a of analyses) for (const [n, c] of Object.entries(a[k])) count((merged[k] = merged[k] || {}), n, c);
  const shots = analyses.flatMap((a) => a.shots).filter((s) => s > 0), durs = analyses.flatMap((a) => a.transitionDur);
  const sum = (k) => analyses.reduce((t, a) => t + a[k], 0);
  const vols = analyses.flatMap((a) => a.musicVolumes);
  const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
  return {
    projects: analyses.length, minutes: round(minutes), canvas: analyses[0]?.canvas || '',
    shot: { avg: round(shots.reduce((t, s) => t + s, 0) / (shots.length || 1)), median: round(median(shots)), under2s: Math.round((shots.filter((s) => s < 2).length / (shots.length || 1)) * 100), perMinute: round(shots.length / minutes) },
    textsPerMinute: round(sum('texts') / minutes), captions: sum('captionLines') > 0, captionsPerMinute: round(sum('captionLines') / minutes), captionTemplates: top(merged.captionTemplates || {}, 3),
    captionFonts: top(merged.captionFonts || {}, 2), captionColors: top(merged.captionColors || {}, 2),
    fonts: top(merged.fonts || {}, 4), textColors: top(merged.textColors || {}, 4), textAnims: top(merged.textAnims || {}, 6),
    transitionsPerMinute: round(total(merged.transitions) / minutes), transitions: top(merged.transitions || {}, 5),
    transitionAvg: round(durs.reduce((t, d) => t + d, 0) / (durs.length || 1), 2),
    effects: top(merged.effects || {}, 5), stickersPerMinute: round(total(merged.stickers) / minutes), stickers: top(merged.stickers || {}, 5),
    overlayClipsPerMinute: round(sum('overlayClips') / minutes), soundsPerMinute: round(sum('soundCount') / minutes), sounds: top(merged.sounds || {}, 6),
    musicVolumeDb: vols.length ? round(20 * Math.log10(Math.max(1e-4, median(vols)))) : null, speedChangesPerMinute: round(sum('speedChanged') / minutes),
    keyframesPerMinute: round(sum('keyframes') / minutes), colorAdjust: top(merged.adjust || {}, 5).map(([n]) => n), vocalEnhance: sum('vocalEnhance') > 0, denoise: sum('denoise') > 0,
  };
}

const list = (pairs) => (pairs.length ? pairs.map(([n, c]) => `${n} (${c})`).join(', ') : 'không dùng');

// Pure: SKILL.md text for AI workers. Numbers are measured from the owner's drafts, not guesses.
export function renderStyleSkill(p, names) {
  return `---
name: phong-cach-chu-so-huu
description: "Phong cách edit thật của chủ sở hữu ContentOS, đo từ ${p.projects} dự án CapCut (${p.minutes} phút): nhịp cắt, mật độ chữ, font/màu, hoạt ảnh chữ, phụ đề, chuyển cảnh, hiệu ứng, âm thanh. Dùng khi dựng/sửa video cho chủ sở hữu để ra đúng chất của họ; quy tắc mẫu snapshot và yêu cầu người dùng vẫn thắng."
---

# Phong cách edit của chủ sở hữu (học từ CapCut)

Nguồn: ${names.map((n) => `\`${n}\``).join(', ')} · khung ${p.canvas}. Con số đo trực tiếp từ dự án CapCut (draft_content.json), không suy đoán. Áp bằng công cụ có sẵn của ContentOS; không tải hiệu ứng / âm thanh / sticker của CapCut.

## Nhịp cắt
- Độ dài cảnh trung bình ${p.shot.avg}s, trung vị ${p.shot.median}s; ${p.shot.under2s}% cảnh ngắn hơn 2s; ~${p.shot.perMinute} cảnh/phút.
- Đổi tốc độ ${p.speedChangesPerMinute} lần/phút · keyframe (zoom / di chuyển) ${p.keyframesPerMinute}/phút → \`zooms[]\` mật độ tương đương.
- Lớp video chồng (cảnh trám / PiP) ${p.overlayClipsPerMinute}/phút → \`brolls[]\` mode pip / full.

## Chữ
- Chữ nhấn ${p.textsPerMinute} chữ/phút. Font: ${list(p.fonts)}. Màu: ${list(p.textColors)}.
- Hoạt ảnh chữ hay dùng: ${list(p.textAnims)} → chọn \`fx\` gần nhất (bật / lắc → words, slide; gõ → type; quét → mask, marker).
- Phụ đề: ${p.captions ? `luôn bật (~${p.captionsPerMinute} dòng/phút); mẫu ${list(p.captionTemplates)}; font ${list(p.captionFonts)}; màu ${list(p.captionColors)} → \`captions.enabled: true\`, \`brand.caption\` cùng font/màu, tô từ đang nói` : 'ít dùng'}.

## Chuyển cảnh, hiệu ứng, sticker
- Chuyển cảnh ${p.transitionsPerMinute}/phút, trung bình ${p.transitionAvg}s. Hay dùng: ${list(p.transitions)} → \`segments[].tIn\` / \`transitions.cut\` (flash, slide, zoom, blur gần nghĩa nhất).
- Hiệu ứng video: ${list(p.effects)}. Chỉnh màu: ${p.colorAdjust.join(', ') || 'không'} (chỉ áp khi người dùng yêu cầu chỉnh màu).
- Sticker: ${list(p.stickers)} (~${p.stickersPerMinute}/phút) → khối đồ hoạ / icon hợp lời nói, không chèn trang trí lạc đề.

## Âm thanh
- Tiếng hiệu ứng ${p.soundsPerMinute}/phút. Hay dùng: ${list(p.sounds)} → \`audio.sfx\` loại gần nghĩa (ding, pop, whoosh…).
- Nhạc nền ${p.musicVolumeDb === null ? 'chưa đo được' : `khoảng ${p.musicVolumeDb} dB so với gốc`}.${p.vocalEnhance ? ' Có làm đẹp giọng.' : ''}${p.denoise ? ' Có lọc ồn → cân nhắc `audio.clean`.' : ''}

## Cách dùng
1. Đọc cùng SKILL.md của mẫu đã snapshot và \`contentos-edit-standards\`.
2. Khi mẫu không quy định, lấy nhịp cắt, mật độ chữ, chuyển cảnh, âm thanh theo các con số trên.
3. Ghi trong tóm tắt bàn giao điểm đã theo phong cách chủ sở hữu và điểm chưa có tương đương trong ContentOS.
`;
}

// Analyze the chosen drafts and write the skill into both agent folders.
export function learnCapcutStyle(appRoot, names, { rootMeta = defaultRootMeta() } = {}) {
  if (!Array.isArray(names) || !names.length || names.length > 50) throw Object.assign(new Error('Chọn 1–50 dự án CapCut.'), { status: 400 });
  const { available, projects } = listCapcutProjects(rootMeta, 5000);
  if (!available) throw Object.assign(new Error('Không thấy CapCut trên máy này.'), { status: 404 });
  const analyses = [], used = [], skipped = [];
  for (const name of names) {
    const p = projects.find((x) => x.name === name);
    if (!p) { skipped.push({ name, reason: 'không có trong danh sách CapCut' }); continue; }
    try { analyses.push(analyzeDraft(readDraft(p.folder))); used.push(name); } catch (e) { skipped.push({ name, reason: e.code === 'ENCRYPTED' ? 'đã mã hoá' : 'không đọc được' }); }
  }
  if (!analyses.length) throw Object.assign(new Error('Không đọc được dự án nào đã chọn.'), { status: 422 });
  const profile = buildProfile(analyses), skill = renderStyleSkill(profile, used), written = [];
  for (const dir of ['.agents/skills', '.claude/skills']) {
    const folder = path.join(appRoot, dir, 'phong-cach-chu-so-huu');
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'SKILL.md'), skill);
    fs.writeFileSync(path.join(folder, 'profile.json'), JSON.stringify({ learnedAt: new Date().toISOString(), projects: used, profile }, null, 2) + '\n');
    written.push(`${dir}/phong-cach-chu-so-huu/SKILL.md`);
  }
  return { profile, used, skipped, written };
}
