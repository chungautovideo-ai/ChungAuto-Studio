// Giọng nói AI (gói Premium): gọi API ElevenLabs / Vbee bằng khoá của chính người dùng. Không cài gì thêm.
// Khoá lưu trong workspace/giong/ket-noi.json trên máy, không gửi lên máy chủ AutoSocial.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
async function audioBytes(response){
 const chunks=[];let total=0;
 for await(const chunk of response.body){total+=chunk.length;if(total>40*1024**2)throw new Error('Audio vượt 40 MB.');chunks.push(chunk);}
 return Buffer.concat(chunks);
}

const VBEE_MAX = 300; // API sync của Vbee nhận tối đa 300 ký tự mỗi lần
const CAT = (s, max) => {
  const out = [];
  let cur = "";
  for (const cau of s.replace(/\s+/g, " ").match(/[^.!?…\n]+[.!?…]*\s*/g) || [s]) {
    for (let c = cau; c; ) {
      const phan = c.length > max ? c.slice(0, c.lastIndexOf(" ", max) > 0 ? c.lastIndexOf(" ", max) : max) : c;
      c = c.slice(phan.length);
      if ((cur + phan).length > max) { if (cur.trim()) out.push(cur.trim()); cur = ""; }
      cur += phan;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};

export function giongApi({ root, ffmpeg = "ffmpeg", workspaceId, fetcher = fetch, configStore }) {
  if(workspaceId!==undefined&&!/^[a-zA-Z0-9-]+$/.test(workspaceId))throw new Error('Workspace không hợp lệ.');
  const fetch=fetcher;
  const DATA = workspaceId?path.join(root,'workspace','contentos','voice',workspaceId):path.join(root, "workspace", "giong"), KQ = path.join(DATA, "ket-qua"), CFG = path.join(DATA, "ket-noi.json");
  const doc = () => { if(configStore)return configStore.read();try { return JSON.parse(fs.readFileSync(CFG, "utf8")); } catch { return {}; } };
  const ghi = (c) => { if(configStore)return configStore.write(c);fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(CFG, JSON.stringify(c, null, 2)); };
  const che = (k) => (k ? "••••" + String(k).slice(-4) : "");
  const hd11 = (c) => ({ "xi-api-key": c.elevenlabs?.key || "" });
  const hdVbee = (c) => ({ Authorization: "Bearer " + (c.vbee?.token || ""), "App-Id": c.vbee?.appId || "" });
  const loiApi = async (r, ncc) => {
    const j = await r.json().catch(() => ({}));
    const m = j.detail?.message || j.detail?.status || j.error?.message || (typeof j.detail === "string" ? j.detail : "");
    return new Error(r.status === 401 ? `Khoá ${ncc} không đúng hoặc đã hết hạn.` : `${ncc} báo lỗi${m ? ": " + m : ` ${r.status}`}`);
  };

  async function danhSach(ncc, c = doc()) {
    if (ncc === "elevenlabs") {
      const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: hd11(c), signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw await loiApi(r, "ElevenLabs");
      return (await r.json()).voices.map((v) => ({ ma: v.voice_id, ten: v.name, rieng: v.category !== "premade" })).sort((a, b) => b.rieng - a.rieng);
    }
    if (ncc === "vbee") {
      const r = await fetch("https://vbee.vn/api/public/v1/voices?voiceOwnership=VBEE&languageCode=vi-VN&limit=100", { headers: hdVbee(c), signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw await loiApi(r, "Vbee");
      const j = await r.json();
      if (j.error_code || !j.result?.voices) throw new Error("App ID hoặc Token Vbee không đúng."); // Vbee báo lỗi kèm mã HTTP 200
      return j.result.voices.map((v) => ({ ma: v.code, ten: v.name || v.code, rieng: false }));
    }
    throw new Error("Chọn dịch vụ giọng nói.");
  }

  async function ketNoi(b) {
    const c = doc();
    if (b.ncc === "elevenlabs") c.elevenlabs = { key: String(b.key || "").trim() };
    else if (b.ncc === "vbee") c.vbee = { appId: String(b.appId || "").trim(), token: String(b.token || "").trim() };
    else throw new Error("Chọn dịch vụ giọng nói.");
    const voices=await danhSach(b.ncc,c);
    ghi(c);return voices; // Chỉ lưu sau khi provider xác nhận kết nối.
  }
  function boKetNoi(ncc) { const c = doc(); delete c[ncc]; ghi(c); }

  async function tao({ ncc, ma, text, narration }) {
    const noiDung = String(text || "").trim();
    if(noiDung.length>5000)throw new Error('Lời đọc tối đa 5.000 ký tự mỗi lượt; chia kịch bản trước khi tạo audio.');
    if(narration&&(narration.workspaceId!==workspaceId||typeof narration.scriptId!=='string'||!Number.isInteger(narration.version)||narration.textHash!==crypto.createHash('sha256').update(noiDung).digest('hex')))throw new Error('Lời đọc không khớp bản kịch bản đã duyệt.');
    if (!noiDung) throw new Error("Nhập nội dung cần đọc.");
    if (!ma) throw new Error("Chọn giọng đọc.");
    const c = doc();
    let buf;
    if (ncc === "elevenlabs") {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(ma)}?output_format=mp3_44100_128`, {
        method: "POST", headers: { ...hd11(c), "Content-Type": "application/json" }, body: JSON.stringify({ text: noiDung, model_id: "eleven_multilingual_v2" }), signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw await loiApi(r, "ElevenLabs");
      buf = await audioBytes(r);
    } else if (ncc === "vbee") {
      const phan = [];
      for (const doan of CAT(noiDung, VBEE_MAX)) {
        const r = await fetch("https://api.vbee.vn/v1/tts", { method: "POST", headers: { ...hdVbee(c), "Content-Type": "application/json" },
          body: JSON.stringify({ text: doan, voiceCode: ma, outputFormat: "mp3", bitrate: 128, speed: 1.0, mode: "sync" }), signal: AbortSignal.timeout(120000) });
        if (!r.ok) throw await loiApi(r, "Vbee");
        const b = await audioBytes(r);
        // Vbee báo lỗi kèm mã HTTP 200 (JSON có error_code): không lưu thành file mp3
        if (/json/i.test(r.headers.get("content-type") || "") || b[0] === 0x7b) {
          let j = {}; try { j = JSON.parse(b.toString("utf8")); } catch {}
          if (j.error_code || j.status === 0 || !j.result?.audio_link) throw new Error(`Vbee báo lỗi${j.error_message || j.message ? ": " + (j.error_message || j.message) : ""}. Kiểm tra App ID, Token và giọng đọc.`);
          const a = await fetch(j.result.audio_link, { signal: AbortSignal.timeout(120000) });
          if (!a.ok) throw new Error("Không tải được audio từ Vbee.");
          phan.push(await audioBytes(a));
          continue;
        }
        phan.push(b);
      }
      buf = Buffer.concat(phan);
    } else throw new Error("Chọn dịch vụ giọng nói.");
    fs.mkdirSync(KQ, { recursive: true });
    const id = crypto.randomBytes(6).toString("hex");
    const file=path.join(KQ,`${id}.mp3`),temp=path.join(KQ,`.${id}.mp3`);
    try{
      if(buf.length>40*1024**2)throw new Error('Audio vượt 40 MB.');
      fs.writeFileSync(temp,buf,{flag:'wx'});
      const {stdout}=await run('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_type:format=duration','-of','json',temp],{windowsHide:true,timeout:20000,maxBuffer:1024*1024});
      const probe=JSON.parse(stdout),duration=Number(probe.format?.duration);
      if(!probe.streams?.length||!Number.isFinite(duration)||duration<=0)throw new Error('Provider không trả audio hợp lệ.');
      await run(ffmpeg,['-nostdin','-v','error','-xerror','-i',temp,'-map','0:a:0','-f','null','-'],{windowsHide:true,timeout:45000,maxBuffer:1024*1024});
      const m = { id, workspaceId:workspaceId||null, ncc, voiceId:ma, text: noiDung.slice(0, 160), textHash:crypto.createHash('sha256').update(noiDung).digest('hex'),...(narration?{narration:{workspaceId:narration.workspaceId,scriptId:narration.scriptId,version:narration.version,scriptHash:narration.scriptHash,textHash:narration.textHash}}:{}), luc: Date.now(),duration,bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex') };
      fs.renameSync(temp,file);
      try{fs.writeFileSync(path.join(KQ, `${id}.json`), JSON.stringify(m),{flag:'wx'});}catch(error){fs.rmSync(file,{force:true});throw error;}
      return m;
    }finally{fs.rmSync(temp,{force:true});}
  }

  // Sao chép giọng: chỉ ElevenLabs có API, Vbee làm trong Vbee Studio rồi hiện ở danh sách giọng
  async function saoChep(buf, ten) {
    const c = doc();
    if (!c.elevenlabs?.key) throw new Error("Kết nối ElevenLabs trước.");
    fs.mkdirSync(DATA, { recursive: true });
    const tam = path.join(DATA, `${crypto.randomBytes(5).toString("hex")}.tam`), mp3 = tam + ".mp3";
    fs.writeFileSync(tam, buf);
    try {
      await new Promise((ok, no) => {
        const p = spawn(ffmpeg, ["-v", "error", "-y", "-i", tam, "-vn", "-t", "180", "-ac", "1", "-b:a", "128k", mp3], { windowsHide: true });
        p.on("error", no); p.on("close", (x) => (x ? no(new Error("x")) : ok()));
      }).catch(() => { throw new Error("Không đọc được file này, hãy dùng file âm thanh hoặc video khác."); });
      const f = new FormData();
      f.append("name", String(ten || "Giọng của tôi").slice(0, 60));
      f.append("files", new Blob([fs.readFileSync(mp3)], { type: "audio/mpeg" }), "mau.mp3");
      const r = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: hd11(c), body: f, signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw await loiApi(r, "ElevenLabs");
      return (await r.json()).voice_id;
    } finally { for (const x of [tam, mp3]) fs.rmSync(x, { force: true }); }
  }

  const dsKq = () => { try { return fs.readdirSync(KQ).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(KQ, f), "utf8"))).filter((x) => fs.existsSync(path.join(KQ, `${x.id}.mp3`))).sort((a, b) => b.luc - a.luc).slice(0, 30); } catch { return []; } };
  const trangThai = () => { const c = doc(); return { ketNoi: { elevenlabs: c.elevenlabs?.key ? che(c.elevenlabs.key) : "", vbee: c.vbee?.token ? che(c.vbee.token) : "" }, kq: dsKq() }; };
  const fileKq = (id) => (/^[a-f0-9]{12}$/.test(id) ? path.join(KQ, `${id}.mp3`) : null);
  return { trangThai, ketNoi, boKetNoi, danhSach, tao, saoChep, fileKq };
}
