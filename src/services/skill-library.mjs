// Read-only catalogue of agent skills installed in the app (.agents/skills, .claude/skills).
// Skill text is data for AI workers; the UI only lists and previews it, never executes it.
import fs from 'node:fs';
import path from 'node:path';

const SKILL_DIRS = ['.agents/skills', '.claude/skills'];
const MAX_SKILL_BYTES = 256 * 1024;
const NAME_RE = /^[a-z0-9][a-z0-9._-]{0,80}$/i;

// Ordered: first matching rule wins.
const CATEGORY_RULES = [
  ['editing', 'Dựng & cắt video', /ghost-editor|rea-video|mrtkeyword|video-edit|ffmpeg|short-form|talking|edit-video|reverse-any|create-video|music-to-video|video-toolkit|website-to-video|video-download|video-understand|video-translate/],
  ['captions', 'Phụ đề & chữ', /caption|lower-third|subtitle|speech-to-text|text-appearance/],
  ['motion', 'Đồ họa chuyển động', /remotion|hyperframes|gsap|motion|lottie|framer|manim|threejs|svg-character|slideshow|countdown|style-sampling|visual-style|figma|pose-library|character-animation|synthetic-screen|playwright-recording/],
  ['data', 'Dữ liệu & infographic', /chart|infographic|presentation|d3|mermaid|data/],
  ['audio', 'Giọng nói & âm thanh', /tts|speech|voice|music|sound|lyria|acestep|elevenlabs|audio/],
  ['generative', 'AI tạo ảnh & video', /seedance|kling|ltx|flux|bfl|minimax|grok|gemini|heygen|avatar|faceswap|comfyui|dashscope|doubao|atlas|3d-asset|ai-video|media-use/],
  ['dev', 'Kỹ thuật & code', /ponytail|vercel|tailwind|web-design|setup|provider|agents|license|upgrade|docs/],
];
const CATEGORY_LABELS = Object.fromEntries([...CATEGORY_RULES.map(([id, label]) => [id, label]), ['contentos', 'Quy trình ContentOS'], ['other', 'Khác']]);

const PACK_LABELS = {
  'remotion-dev/skills': 'Remotion',
  'heygen-com/hyperframes': 'HyperFrames',
  'calesthio/OpenMontage': 'OpenMontage',
  'kurbaitaev/ghost-editor': 'Ghost Editor',
  'JuneYaooo/rea-video': 'REA Video (phân tích video)',
  'Phucanh-MRT/mrtkeyword': 'MRT Keyword',
  'iart-ai/tiktok-video-skills': 'TikTok Video',
  'iart-ai/data-animation-skills': 'Data Animation',
};

export function parseFrontmatter(text) {
  const match = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (pair) { key = pair[1]; meta[key] = unquote(pair[2]); continue; }
    // YAML folded/continued scalars: append indented lines to the previous key.
    if (key && /^\s+\S/.test(line)) meta[key] = `${meta[key] && !/^[>|]-?$/.test(meta[key]) ? meta[key] + ' ' : ''}${line.trim()}`;
  }
  return { meta, body: text.slice(match[0].length) };
}

const unquote = value => value.trim().replace(/^(['"])([\s\S]*)\1$/, '$2');

export function categorize(name, packId) {
  if (packId === 'contentos') return 'contentos';
  const id = name.toLowerCase();
  for (const [category, , pattern] of CATEGORY_RULES) if (pattern.test(id)) return category;
  return 'other';
}

function readLock(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'skills-lock.json'), 'utf8')).skills || {}; } catch { return {}; }
}

function packOf(name, lock) {
  const source = lock[name]?.source;
  if (source) return { id: source, label: PACK_LABELS[source] || source.split('/').pop() };
  if (/^ponytail/.test(name)) return { id: 'ponytail', label: 'Ponytail' };
  if (name === 'ffmpeg-skill') return { id: 'ffmpeg-skill', label: 'FFmpeg Skill' };
  if (/^(contentos-|phong-cach-chu-so-huu|mkt-|phan-tich|tao-canh|setup-kit)/.test(name)) return { id: 'contentos', label: 'ContentOS' };
  return { id: 'local', label: 'Cài thủ công' };
}

function skillFile(root, name) {
  for (const dir of SKILL_DIRS) {
    const file = path.join(root, dir, name, 'SKILL.md');
    if (fs.existsSync(file)) return file;
  }
  return null;
}

export function createSkillLibrary(root) {
  // Scanning ~260 files on the NAS drive blocks the event loop ~0.7 s; rescan only when a skill folder or the lock changes.
  // shortcut: edits inside an existing SKILL.md don't bump the folder mtime, restart the server to refresh descriptions.
  let cache = null, cacheKey = '';
  const stamp = () => [...SKILL_DIRS, 'skills-lock.json'].map(p => { try { return fs.statSync(path.join(root, p)).mtimeMs; } catch { return 0; } }).join('|');
  function list() {
    const key = stamp();
    if (cache && key === cacheKey) return cache;
    cacheKey = key;
    return (cache = scan());
  }
  function scan() {
    const lock = readLock(root);
    const seen = new Map();
    for (const dir of SKILL_DIRS) {
      const base = path.join(root, dir);
      let entries = [];
      try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch { continue; }
      for (const entry of entries) {
        if (!entry.isDirectory() || seen.has(entry.name) || !NAME_RE.test(entry.name)) continue;
        let text;
        try { text = fs.readFileSync(path.join(base, entry.name, 'SKILL.md'), 'utf8').slice(0, 8192); } catch { continue; }
        const { meta } = parseFrontmatter(text);
        const pack = packOf(entry.name, lock);
        const category = categorize(entry.name, pack.id);
        seen.set(entry.name, {
          name: entry.name,
          title: meta.name || entry.name,
          description: (meta.description || '').slice(0, 600),
          pack: pack.id, packLabel: pack.label,
          category, categoryLabel: CATEGORY_LABELS[category],
          agents: SKILL_DIRS.filter(d => fs.existsSync(path.join(root, d, entry.name, 'SKILL.md'))).map(d => d.startsWith('.claude') ? 'claude' : 'codex'),
        });
      }
    }
    const skills = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
    const count = key => Object.entries(skills.reduce((acc, s) => ({ ...acc, [s[key]]: (acc[s[key]] || 0) + 1 }), {}));
    return {
      total: skills.length,
      skills,
      categories: count('category').map(([id, n]) => ({ id, label: CATEGORY_LABELS[id], count: n })),
      packs: count('pack').map(([id, n]) => ({ id, label: skills.find(s => s.pack === id).packLabel, count: n })).sort((a, b) => b.count - a.count),
    };
  }

  function detail(name) {
    if (typeof name !== 'string' || !NAME_RE.test(name)) throw Object.assign(new Error('Tên skill không hợp lệ.'), { status: 400 });
    const file = skillFile(root, name);
    if (!file) throw Object.assign(new Error('Không tìm thấy skill.'), { status: 404 });
    const raw = fs.readFileSync(file, 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const files = fs.readdirSync(path.dirname(file), { withFileTypes: true }).map(e => (e.isDirectory() ? e.name + '/' : e.name)).sort();
    return {
      name, title: meta.name || name, description: meta.description || '',
      body: body.length > MAX_SKILL_BYTES ? body.slice(0, MAX_SKILL_BYTES) + '\n\n…(đã rút gọn)' : body,
      files, path: path.relative(root, file).replaceAll('\\', '/'),
    };
  }

  return { list, detail };
}
