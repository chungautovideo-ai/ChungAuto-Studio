// Mẫu video (template): một bộ phong cách dựng + skill cho AI.
// Dùng chung cho server (Node) và editor (trình duyệt).
//
// template.json:
// {
//   id, name, version, tier (free | pro | premium), tags[], industries[] (ngành nghề phù hợp — website lọc theo trường này), description,
//   brand:        { fontTitle, fontSub, fontLabel, c1, c2, c3, sub, caption{style,size,color,active,uppercase} },
//   captions:     { enabled, y, maxWords, hideOnScenes },
//   transitions:  { cut },
//   camera:       { color{brightness,contrast,saturate,temp,vignette} },
//   audio:        { autoSfx, sfxVolume, musicVolume },
//   texts:        { fxCycle[], y, size },     // hiệu ứng chữ xen kẽ theo thứ tự
//   scenes:       { tIn },
//   brolls:       { mode, tIn },
//   skill:        "SKILL.md"                  // quy tắc dựng cho AI (file cạnh template.json)
//   presets:      [{ id, group: "chu"|"dohoa", name, desc, dur, bg, html, css, anim, fields }]  // thành phần có sẵn: thẻ xem trước trong editor, bấm là chèn khối đồ hoạ
// }

import { applyAutomotiveOptions } from "./automotive-options.js";

const clone = (o) => JSON.parse(JSON.stringify(o ?? null));

// Áp dụng mẫu lên project. Giữ nguyên nội dung (lời nói, đoạn cắt, chữ, cảnh, phụ đề đã sửa),
// chỉ thay phong cách. restyle=true thì đổi luôn hiệu ứng/vị trí các mục đã có theo mẫu.
export function applyTemplate(project, tpl, { restyle = true } = {}) {
  const p = clone(project);
  if (tpl.brand) p.brand = clone(tpl.brand);
  if (tpl.captions) {
    const lines = p.captions?.lines || [];
    p.captions = { ...(p.captions || {}), ...clone(tpl.captions), lines };
  }
  if (tpl.transitions) p.transitions = { ...(p.transitions || {}), ...clone(tpl.transitions) };
  if (tpl.camera?.color) p.camera = { ...(p.camera || {}), color: clone(tpl.camera.color) };
  if (tpl.audio) p.audio = { ...(p.audio || {}), ...clone(tpl.audio) };
  if (restyle) {
    const cyc = tpl.texts?.fxCycle?.length ? tpl.texts.fxCycle : null;
    (p.texts || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0)).forEach((t, i) => {
      if (cyc) t.fx = cyc[i % cyc.length];
      if (tpl.texts?.y != null) { t.y = tpl.texts.y; delete t.x; }
      if (tpl.texts?.size != null) t.size = tpl.texts.size;
    });
    for (const s of p.scenes || []) if (tpl.scenes?.tIn) s.tIn = tpl.scenes.tIn;
    for (const b of p.brolls || []) {
      if (tpl.brolls?.tIn) b.tIn = tpl.brolls.tIn;
      if (tpl.brolls?.mode) b.mode = tpl.brolls.mode;
    }
    for (const s of p.segments || []) delete s.tIn; // dùng chuyển cảnh mặc định của mẫu
  }
  p.template = { id: tpl.id, name: tpl.name, version: tpl.version || 1 };
  // Explicit per-project automotive choices win over the template; templates never add policy.
  if (!project.automotiveOptions) return p;
  const next = applyAutomotiveOptions(p, project.automotiveOptions, { base: project, sfxLevel: project.audio?.sfxLevel });
  if (next.automotiveOptions.music === "keep" && project.audio?.music === undefined) delete next.audio.music;
  return next;
}

// Lấy phong cách của project hiện tại thành mẫu mới (để tự tạo thư viện).
export function extractTemplate(project, meta = {}) {
  const p = project || {};
  const fx = (p.texts || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0)).map((t) => t.fx || "words");
  return {
    id: meta.id, name: meta.name, version: 1,
    tags: meta.tags || [], industries: meta.industries || [], description: meta.description || "",
    brand: clone(p.brand) || undefined,
    captions: p.captions ? { enabled: !!p.captions.enabled, y: p.captions.y, maxWords: p.captions.maxWords, hideOnScenes: !!p.captions.hideOnScenes } : undefined,
    transitions: clone(p.transitions) || undefined,
    camera: p.camera?.color ? { color: clone(p.camera.color) } : undefined,
    audio: p.audio ? Object.fromEntries(['autoSfx','sfxLevel','sfxVolume','musicVolume','musicLoop','musicFadeIn','musicFadeOut','musicSpeechLevel','duckNarration','duckSourceSpeech','duckFade','duckLevel',
      // Built-in music is portable; private media paths, clips and timing stay with the project.
      ...( (['kit:upbeat-light','kit:ambient-pad','kit:beat-bass'].includes(p.audio.music)||/^kit:capcut-[\w-]+$/.test(p.audio.music||''))?['music']:[])
    ].filter(key=>p.audio[key]!==undefined).map(key=>[key,clone(p.audio[key])])) : undefined,
    texts: fx.length ? { fxCycle: [...new Set(fx)] } : undefined,
    scenes: p.scenes?.[0]?.tIn ? { tIn: p.scenes[0].tIn } : undefined,
    skill: "SKILL.md",
  };
}
