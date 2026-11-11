#!/usr/bin/env node
// Lấy bộ "Hiệu ứng" văn bản đã yêu thích (⭐) trong CapCut máy này → editor/ui/capcut-text-effects (effects.json + ảnh bìa).
// Đọc cache phản hồi máy chủ của CapCut (ressdk_db/*/rp.db), chỉ đọc, không đụng tài khoản. Chạy lại sau khi favorite thêm trong CapCut.
//   node editor/tools/capcut-favorites.mjs
// shortcut: chỉ thấy hiệu ứng CapCut đã từng tải danh mục trên máy này; favorite chưa mở panel lần nào sẽ thiếu tới khi mở panel Hiệu ứng.
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "editor", "ui", "capcut-text-effects");
const DB_ROOT = path.join(process.env.LOCALAPPDATA || "", "CapCut", "User Data", "Cache", "ressdk_db");

// Bản ghi mới nhất của mỗi hiệu ứng thắng: bỏ yêu thích sau đó thì không lấy.
export function collectFavorites(responses) {
  const latest = new Map();
  const walk = (o, t) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { for (const x of o) walk(x, t); return; }
    if (typeof o.has_favorited === "boolean" && o.effect_id) {
      const id = String(o.effect_id), prev = latest.get(id);
      if (!prev || t >= prev.t) latest.set(id, { t, item: o });
    }
    for (const k in o) walk(o[k], t);
  };
  for (const r of responses) if (/_flower_capcutpc/.test(r.url)) walk(r.body, r.t);
  return [...latest.values()].map((x) => x.item).filter((x) => x.has_favorited)
    .sort((a, b) => (b.favorite_time || 0) - (a.favorite_time || 0))
    .map((x) => ({ id: String(x.effect_id), title: String(x.title || "").trim(), favoriteTime: x.favorite_time || 0,
      coverUrl: x.cover_url?.small || x.cover_url?.static_img || "", vip: /"is_vip":true/.test(x.business_info?.json_str || "") }));
}

function readResponses() {
  if (!fs.existsSync(DB_ROOT)) throw new Error("Không thấy dữ liệu CapCut: " + DB_ROOT);
  const out = [];
  for (const d of fs.readdirSync(DB_ROOT)) {
    const f = path.join(DB_ROOT, d, "rp.db");
    if (!fs.existsSync(f)) continue;
    let db;
    try { db = new DatabaseSync(f, { readOnly: true }); } catch { continue; }
    try {
      for (const r of db.prepare("select url, response_body b, timestamp t from http_cache where url like '%_flower_capcutpc%'").all()) {
        try { out.push({ url: String(r.url), t: String(r.t), body: JSON.parse(String(r.b)) }); } catch {}
      }
    } finally { db.close(); }
  }
  return out;
}

async function main() {
  const list = collectFavorites(readResponses());
  if (!list.length) throw new Error("Chưa thấy hiệu ứng văn bản yêu thích nào. Mở CapCut > Văn bản > Hiệu ứng > ⭐ rồi chạy lại.");
  fs.mkdirSync(path.join(OUT, "covers"), { recursive: true });
  const effects = [];
  for (const e of list) {
    const cover = `covers/${e.id}.webp`, file = path.join(OUT, cover);
    if (!fs.existsSync(file) && e.coverUrl) {
      try {
        const res = await fetch(e.coverUrl);
        if (!res.ok) throw new Error("HTTP " + res.status);
        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      } catch (err) { console.warn(`! Không tải được ảnh bìa ${e.title}: ${err.message}`); }
    }
    effects.push({ id: e.id, title: e.title, favoriteTime: e.favoriteTime, vip: e.vip, ...(fs.existsSync(file) ? { cover } : {}) });
  }
  fs.writeFileSync(path.join(OUT, "effects.json"), JSON.stringify({ schemaVersion: 1, source: "CapCut ⭐ Văn bản > Hiệu ứng", updatedAt: new Date().toISOString(), effects }, null, 2) + "\n");
  console.log(`✓ ${effects.length} hiệu ứng văn bản yêu thích → ${path.relative(ROOT, OUT)}`);
}

const same = (a, b) => { try { return fs.realpathSync(a).toLowerCase() === fs.realpathSync(b).toLowerCase(); } catch { return false; } };
if (process.argv[1] && same(process.argv[1], fileURLToPath(import.meta.url))) {
  main().catch((e) => { console.error("✗ " + e.message); process.exit(1); });
}
