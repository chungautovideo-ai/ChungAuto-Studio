import fs from 'node:fs';
import path from 'node:path';

// Hiệu ứng văn bản ⭐ CapCut đã chọn trong dự án (project.capcutTextEffect = {id,title}) → dòng hướng dẫn + ảnh bìa mẫu trong gói.
// Chỉ nhận id có trong danh sách effects.json đã lấy từ CapCut, tránh ghi hướng dẫn cho hiệu ứng không còn yêu thích.
export function capcutTextEffectStep(value, catalog) {
  const id = String(value?.id || '');
  if (!/^\d{6,25}$/.test(id)) return null;
  const effect = (catalog?.effects || []).find((e) => e.id === id);
  if (!effect) return null;
  return { effect, instruction: `- Hiệu ứng chữ: chọn toàn bộ chữ phụ đề/chữ nhấn > Văn bản > Hiệu ứng > tab ⭐ (yêu thích) > chọn "${effect.title}" (ID ${effect.id}), bật "Áp dụng cho tất cả phụ đề chính". Ảnh mẫu: 2-hieu-ung-chu.webp.` };
}

export function packageCapcutTextEffect(project, uiDir, outputDir) {
  let catalog = null;
  try { catalog = JSON.parse(fs.readFileSync(path.join(uiDir, 'capcut-text-effects', 'effects.json'), 'utf8')); } catch { return null; }
  const step = capcutTextEffectStep(project.capcutTextEffect, catalog);
  if (!step) return null;
  if (step.effect.cover) try { fs.copyFileSync(path.join(uiDir, 'capcut-text-effects', step.effect.cover), path.join(outputDir, '2-hieu-ung-chu.webp')); } catch {}
  return step.instruction;
}
