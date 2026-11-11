#!/usr/bin/env node
// Cài mẫu edit từ file .zip người dùng tải lên (việc "cài mẫu" giao cho AI qua editor).
//   node editor/tools/cai-mau.mjs <file.zip>
// Giải nén, kiểm tra từng mẫu (<id>/template.json hợp lệ), chép vào editor/templates/<id>/ rồi in tóm tắt để AI báo người dùng:
// tên, gói, số chữ / hiệu ứng / cảnh trám, thành phần cần tách nền, có SKILL.md không.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {installTemplatePackage} from '../../src/services/template-package.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const TEMPLATES = path.join(ROOT, "editor", "templates");
const APP_VER = JSON.parse(fs.readFileSync(path.join(ROOT, "editor", "version.json"), "utf8")).version;
const older = (a, b) => { const p = String(a).split(".").map(Number), q = String(b).split(".").map(Number); for (let i = 0; i < 3; i++) if ((p[i] || 0) !== (q[i] || 0)) return (p[i] || 0) < (q[i] || 0); return false; };
const zipFile=process.argv[2];
if(!zipFile||!fs.existsSync(zipFile)){console.error('✗ Cần đường dẫn file .zip mẫu edit');process.exit(1);}
try{
 const installed=installTemplatePackage(TEMPLATES,fs.readFileSync(zipFile),{check:t=>{if(t.minApp&&older(APP_VER,t.minApp))throw new Error(`Mẫu cần phần mềm ${t.minApp}, máy đang dùng ${APP_VER}.`);}});
 for(const {id,template:t,referenceCount,hasSkill} of installed){const presets=t.presets||[];console.log(`✓ Cài mẫu “${t.name}” → editor/templates/${id}/\n   Phiên bản ${t.version||1} · ${presets.length} preset · ${referenceCount} chuyên đề\n   Quy tắc dựng: ${hasSkill?'SKILL.md':'THIẾU SKILL.md — tải lại mẫu'}`);}
}catch(error){console.error('✗ Cài mẫu thất bại: '+error.message);process.exitCode=1;}
