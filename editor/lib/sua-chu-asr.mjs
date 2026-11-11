// Sửa chữ sau nhận giọng: từ riêng ChungAuto/ngành xe bị Whisper viết sai, câu Whisper bịa khi im lặng.
// Từ điển: config/tu-dien-asr.json (người dùng sửa được). Giữ mốc thời gian từng từ để phụ đề/chữ nhấn vẫn khớp lời.
import fs from 'node:fs';
import path from 'node:path';

const LETTER = String.raw`[\p{L}\p{N}]`;
const hasLetter = s => new RegExp(LETTER, 'u').test(s);
const ms = x => Math.round(x * 1000) / 1000;

export function docTuDien(root) {
  const file = path.join(root, 'config', 'tu-dien-asr.json');
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw new Error(`Từ điển nhận giọng lỗi (${file}): ${error.message}`); }
  compileRules(data); // lỗi regex hiện ngay, trước khi chạy Whisper
  return data;
}

// Câu gợi từ vựng cho whisper --prompt (chỉ tiếng Việt).
export function promptArgs(tuDien, language) {
  const goiY = String(tuDien?.goiY || '').trim();
  return language === 'vi' && goiY ? ['--prompt', goiY] : [];
}

function compileRules({ sua = [], boCau = [] } = {}) {
  const rule = (pattern, to) => {
    try { return [new RegExp(`(?<!${LETTER})(?:${pattern})(?!${LETTER})`, 'giu'), to]; }
    catch (error) { throw new Error(`Quy tắc từ điển nhận giọng sai: ${pattern} (${error.message})`); }
  };
  return [...boCau.map(p => rule(p, '')), ...sua.map(([p, to]) => rule(p, to))];
}

// Thay từ i..j bằng tokens: cùng số từ thì giữ mốc từng từ, khác thì chia khoảng thời gian theo độ dài chữ.
function replaceRange(old, tokens) {
  if (tokens.length === old.length) return old.map((w, k) => ({ ...w, word: tokens[k] }));
  const start = old[0].start, end = old.at(-1).end, total = tokens.reduce((n, t) => n + t.length, 0);
  let t = start;
  return tokens.map((word, k) => {
    const next = k === tokens.length - 1 ? end : t + (end - start) * word.length / total;
    const w = { ...old[0], word, start: ms(t), end: ms(Math.max(next, t + 0.05)) };
    t = next;
    return w;
  });
}

// words: [{word,start,end}] của Whisper → {words, fixes:[{tu,thanh,start}]}. Không đổi mảng đầu vào.
export function suaChu(words, tuDien = {}) {
  const out = words.map(w => ({ ...w }));
  const fixes = [];
  for (const [re, to] of compileRules(tuDien)) {
    let text = '';
    const starts = out.map(w => { const s = text.length; text += w.word + ' '; return s; });
    const wordAt = pos => { let k = 0; while (k + 1 < starts.length && starts[k + 1] <= pos) k++; return k; };
    const edits = [...text.matchAll(re)].filter(m => m[0].trim())
      .map(m => ({ i: wordAt(m.index), j: wordAt(m.index + m[0].length - 1), a: m.index, b: m.index + m[0].length }));
    let limit = Infinity;
    for (const { i, j, a, b } of edits.reverse()) {
      if (j >= limit) continue; // hai chỗ khớp chạm cùng một từ: giữ chỗ sau
      const old = out.slice(i, j + 1), before = old.map(w => w.word).join(' ');
      const after = before.slice(0, a - starts[i]) + to + before.slice(b - starts[i]);
      if (after === before) continue;
      const tokens = [];
      for (const tok of after.split(/\s+/).filter(Boolean)) {
        if (hasLetter(tok)) tokens.push(tok);
        else if (tokens.length) tokens[tokens.length - 1] += tok; // dấu câu sót lại bám vào từ trước
      }
      out.splice(i, old.length, ...(tokens.length ? replaceRange(old, tokens) : []));
      fixes.push({ tu: before, thanh: tokens.join(' '), start: old[0].start });
      limit = i;
    }
  }
  return { words: out, fixes: fixes.sort((x, y) => x.start - y.start) };
}
