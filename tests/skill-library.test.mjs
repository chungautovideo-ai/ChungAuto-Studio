import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSkillLibrary, parseFrontmatter, categorize } from '../src/services/skill-library.mjs';

function skill(root, dir, name, front) {
  fs.mkdirSync(path.join(root, dir, name), { recursive: true });
  fs.writeFileSync(path.join(root, dir, name, 'SKILL.md'), `---\n${front}\n---\n# ${name}\nBody`);
}

test('parseFrontmatter reads quoted, folded and plain values', () => {
  const { meta, body } = parseFrontmatter('---\nname: "a-b"\ndescription: >\n  line one\n  line two\nx: 1\n---\nHello');
  assert.equal(meta.name, 'a-b');
  assert.equal(meta.description, 'line one line two');
  assert.equal(body, 'Hello');
  assert.deepEqual(parseFrontmatter('no front').meta, {});
});

test('categorize maps skill names to user-facing groups', () => {
  assert.equal(categorize('remotion-captions', 'x'), 'captions');
  assert.equal(categorize('ghost-editor', 'x'), 'editing');
  assert.equal(categorize('chart-animation', 'x'), 'data');
  assert.equal(categorize('mkt-edit-talking-head', 'contentos'), 'contentos');
  assert.equal(categorize('zzz', 'x'), 'other');
});

test('skill library lists both agent folders once, groups by pack and rejects traversal', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cos-skills-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  skill(root, '.agents/skills', 'remotion-render', 'name: remotion-render\ndescription: Export a Remotion video');
  skill(root, '.claude/skills', 'remotion-render', 'name: remotion-render\ndescription: dup');
  skill(root, '.claude/skills', 'ponytail', 'name: ponytail\ndescription: lazy');
  fs.mkdirSync(path.join(root, '.agents/skills/empty'), { recursive: true });
  fs.writeFileSync(path.join(root, 'skills-lock.json'), JSON.stringify({ skills: { 'remotion-render': { source: 'remotion-dev/skills' } } }));
  const library = createSkillLibrary(root);
  const state = library.list();
  assert.equal(state.total, 2);
  const remotion = state.skills.find(s => s.name === 'remotion-render');
  assert.equal(remotion.packLabel, 'Remotion');
  assert.equal(remotion.description, 'Export a Remotion video');
  assert.deepEqual(remotion.agents, ['codex', 'claude']);
  assert.equal(state.skills.find(s => s.name === 'ponytail').pack, 'ponytail');
  // No identity check on the cache: SMB/NAS folders may report a settled mtime late, which only costs one rescan.
  skill(root, '.agents/skills', 'contentos-new', 'name: contentos-new\ndescription: house');
  const rescanned = library.list();
  assert.equal(rescanned.total, 3, 'a new skill folder triggers a rescan');
  assert.equal(rescanned.skills.find(s => s.name === 'contentos-new').pack, 'contentos');
  const detail = library.detail('remotion-render');
  assert.match(detail.body, /# remotion-render/);
  assert.deepEqual(detail.files, ['SKILL.md']);
  assert.throws(() => library.detail('../etc'), /không hợp lệ/);
  assert.throws(() => library.detail('missing'), /Không tìm thấy/);
});
