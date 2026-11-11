import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeDraft, buildProfile, renderStyleSkill, learnCapcutStyle, listCapcutProjects } from '../src/services/capcut-style.mjs';

const S = 1e6;
const draft = {
  duration: 60 * S, canvas_config: { width: 1080, height: 1920 },
  tracks: [{ type: 'video', segments: [{ material_id: 'cmp', target_timerange: { duration: 60 * S } }] }],
  materials: {
    videos: [{ id: 'cmp', path: '', material_name: 'Clip ghép1' }],
    drafts: [{ draft: {
      duration: 60 * S,
      tracks: [
        { type: 'video', segments: [{ material_id: 'v1', target_timerange: { duration: 1.5 * S } }, { material_id: 'v1', target_timerange: { duration: 4 * S }, common_keyframes: [{}] }] },
        { type: 'audio', segments: [{ material_id: 'm1', volume: 0.1 }] },
      ],
      materials: {
        videos: [{ id: 'v1', path: 'a.mp4' }],
        texts: [
          { recognize_task_id: 'x', text_color: '#F4C70F', content: JSON.stringify({ styles: [{ font: { path: 'C:/f/iCielPanton-Black.otf' } }] }) },
          { text_color: '#FFFFFF', content: JSON.stringify({ styles: [{ font: { path: 'C:/cache/771741000e3098b8' } }] }) },
        ],
        text_templates: [{ name: '逐词高亮-黄' }],
        material_animations: [{ type: 'sticker_animation', animations: [{ name: 'Trượt xuống', type: 'in' }, { name: '', type: 'caption' }] }],
        transitions: [{ name: 'Bên trái', duration: 0.4 * S }],
        audios: [{ id: 'm1', type: 'music' }, { id: 's1', type: 'sound', name: 'Ding' }],
        speeds: [{ speed: 2 }], realtime_denoises: [{}],
      },
    } }],
  },
};

test('analyzeDraft looks inside compound clips and separates captions from accent text', () => {
  const a = analyzeDraft(draft);
  assert.deepEqual(a.shots, [1.5, 4]);
  assert.equal(a.captionLines, 1);
  assert.equal(a.texts, 1);
  assert.deepEqual(a.captionFonts, { 'iCielPanton-Black': 1 });
  assert.deepEqual(a.fonts, {});
  assert.deepEqual(a.textAnims, { 'Trượt xuống (in)': 1 });
  assert.equal(a.soundCount, 1);
  assert.deepEqual(a.musicVolumes, [0.1]);
  assert.equal(a.keyframes, 1);
});

test('buildProfile rates per minute and renderStyleSkill writes a valid skill header', () => {
  const p = buildProfile([analyzeDraft(draft)]);
  assert.equal(p.minutes, 1);
  assert.equal(p.shot.under2s, 50);
  assert.equal(p.musicVolumeDb, -20);
  assert.equal(p.captions, true);
  const skill = renderStyleSkill(p, ['1026']);
  assert.match(skill, /^---\nname: phong-cach-chu-so-huu\n/);
  assert.match(skill, /iCielPanton-Black/);
});

test('learnCapcutStyle writes both agent folders, skips missing and encrypted drafts', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cos-capcut-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const ok = path.join(root, 'drafts', 'A'), enc = path.join(root, 'drafts', 'B');
  fs.mkdirSync(ok, { recursive: true }); fs.mkdirSync(enc, { recursive: true });
  fs.writeFileSync(path.join(ok, 'draft_content.json'), JSON.stringify(draft));
  fs.writeFileSync(path.join(enc, 'draft_content.json'), 'ZW5jcnlwdGVk');
  const meta = path.join(root, 'root_meta_info.json');
  fs.writeFileSync(meta, JSON.stringify({ all_draft_store: [{ draft_name: 'A', draft_fold_path: ok, tm_duration: 60 * S, tm_draft_modified: 2 }, { draft_name: 'B', draft_fold_path: enc, tm_draft_modified: 1 }] }));
  assert.deepEqual(listCapcutProjects(meta).projects.map((p) => p.name), ['A', 'B']);
  const r = learnCapcutStyle(root, ['A', 'B', 'C'], { rootMeta: meta });
  assert.deepEqual(r.used, ['A']);
  assert.deepEqual(r.skipped.map((s) => s.reason), ['đã mã hoá', 'không có trong danh sách CapCut']);
  for (const dir of ['.agents/skills', '.claude/skills']) assert.ok(fs.existsSync(path.join(root, dir, 'phong-cach-chu-so-huu', 'SKILL.md')));
  assert.throws(() => learnCapcutStyle(root, [], { rootMeta: meta }), /1–50/);
});
