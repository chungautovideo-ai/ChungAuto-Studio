import React from "react";
import { AbsoluteFill, random } from "remotion";
import { BVP, C, INK, MONT, STK, pop, ramp } from "../ui";
import { FxProps, Out, Vid, cue, fitSize, headAt, isVo } from "./common";

/* Batch 2 of keyword effects (from the "122 effects for vertical talking-head videos" catalogue).
   Same contract as library.tsx: cue times in `c`, content in `p`. Every effect is an overlay on the speaker,
   and works on a voice-over segment too (Vid draws the brand background, `place` centres the block). */

export const on0 = (c: Record<string, number>, s: { start: number }) => cue(c, "on", s.start + 0.3);
export const MONO = "Consolas, 'Courier New', monospace";
export const EMOJI = "'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
export const dark: React.CSSProperties = {
  background: "rgba(14,16,24,.84)", border: "2px solid rgba(255,255,255,.16)", borderRadius: 32,
  boxShadow: "0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.12)", backdropFilter: "blur(16px)",
};

/** top y for a block of height hgt: voice-over → centred; "top" → above the head when it fits; else the chest band above captions */
export const place = (s: FxProps["s"], hgt: number, pref: "top" | "chest" = "chest", z = 1) => {
  if (isVo(s)) return 760 - hgt / 2;
  const h = headAt(s.id, z);
  if (pref === "top" && h.y0 - 30 - hgt >= 60) return h.y0 - 30 - hgt;
  return Math.min(1410 - hgt, h.y1 + 40);
};
export const Over: React.FC<{ s: FxProps["s"]; z?: number; children: React.ReactNode }> = ({ s, z = 1, children }) => (
  <AbsoluteFill><Vid s={s} z={z} />{children}</AbsoluteFill>
);
export const Cursor: React.FC<{ x: number; y: number; down?: boolean }> = ({ x, y, down }) => (
  <svg width={60} height={70} style={{ position: "absolute", left: x - 8, top: y - 4, transform: `scale(${down ? 0.85 : 1})`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))" }}>
    <path d="M8 4 L8 52 L20 40 L30 62 L38 58 L28 37 L46 37 Z" fill="#fff" stroke="#111" strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

/* ===== punch-headline ===== cues: on · params: text, hl (word drawn in yellow) — the punch-in comes from keywords.json "punch" */
export const PunchHeadline: React.FC<FxProps> = ({ t, s, c, p, z }) => {
  const on = on0(c, s), text: string = p.text ?? "TIÊU ĐỀ";
  const h = headAt(s.id, z);
  let size = fitSize(text, 128, 960), y = 60;
  if (!isVo(s) && size > h.y0 - 80) { size = Math.min(size, 96); y = place(s, size * 1.1); }
  if (isVo(s)) y = 760 - size / 2;
  const q = pop(t, on, 260, 15);
  const words = text.split(/(\s+)/).map((w, i) => w === p.hl ? <span key={i} style={{ color: INK.yellow }}>{w}</span> : w);
  return (
    <Over s={s} z={z}>
      {t >= on && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", transform: `scale(${1.6 - 0.6 * q})`, opacity: Math.min(1, q * 2) }}>
          <Out size={size}>{words}</Out>
        </div>
      )}
    </Over>
  );
};

/* ===== countdown ===== cues: on · params: from (3), step (s per digit, 0.7), label, end (shown after 1) */
export const Countdown: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), from: number = p.from ?? 3, step: number = p.step ?? 0.7;
  const k = Math.floor((t - on) / step), val = k < from ? String(from - k) : p.end ?? "▶";
  const flip = ramp(t, on + Math.min(k, from) * step, 0.14);
  const y = place(s, 300, "top");
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transform: `scale(${0.8 + 0.2 * pop(t, on)})` }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: "0.3em", color: "#FFD9BF" }}>{p.label ?? "BẮT ĐẦU SAU"}</div>
          <div style={{ position: "relative", minWidth: 210, height: 240, padding: "0 30px", borderRadius: 24, background: "linear-gradient(180deg,#24262E 0 49%,#111318 51% 100%)",
            boxShadow: "0 20px 50px rgba(0,0,0,.5)", display: "grid", placeItems: "center", transform: `scaleY(${0.25 + 0.75 * flip})` }}>
            <div style={{ fontFamily: STK, fontSize: fitSize(val, 190, 420), color: "#FF8A3D", textShadow: "0 0 30px rgba(255,120,40,.6)" }}>{val}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 3, background: "#000" }} />
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== progress-ring ===== cues: on, done · params: value (%), label */
export const ProgressRing: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), done = cue(c, "done", on + 1.4), v: number = p.value ?? 86;
  const k = ramp(t, on, Math.max(0.4, done - on)), R = 100, L = 2 * Math.PI * R;
  const y = place(s, 300), x = isVo(s) ? 390 : 760;
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: x, top: y, width: 300, height: 300, borderRadius: "50%", ...dark, display: "grid", placeItems: "center", transform: `scale(${pop(t, on, 220, 14)})` }}>
          <svg width={260} height={260} style={{ position: "absolute" }}>
            <circle cx={130} cy={130} r={R} stroke="rgba(255,255,255,.12)" strokeWidth={18} fill="none" />
            <circle cx={130} cy={130} r={R} stroke={INK.orange} strokeWidth={18} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - (v / 100) * k)}
              transform="rotate(-90 130 130)" style={{ filter: "drop-shadow(0 0 10px rgba(255,122,26,.7))" }} />
          </svg>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: STK, fontSize: 76, color: "#fff", lineHeight: 1 }}>{Math.round(v * k)}%</div>
            <div style={{ fontFamily: BVP, fontWeight: 700, fontSize: 24, color: "#C9CBD6", marginTop: 6, maxWidth: 180 }}>{p.label ?? "hoàn thành"}</div>
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== poll ===== cues: card, pick · params: q, options [{t, p}] (≤ 4, p = % after voting), win (index), votes */
export const Poll: React.FC<FxProps> = ({ t, s, c, p }) => {
  const cardT = cue(c, "card", s.start + 0.6), pick = cue(c, "pick", cardT + 1.4);
  const opts: { t: string; p: number }[] = (p.options ?? [{ t: "Có", p: 72 }, { t: "Không", p: 28 }]).slice(0, 4);
  const win: number = p.win ?? 0, hgt = 150 + opts.length * 92, y = place(s, hgt);
  const fill = ramp(t, pick + 0.15, 0.9);
  const rowY = (i: number) => y + 118 + i * 92 + 34;
  const cur = { x: 900 - 560 * ramp(t, pick - 0.7, 0.6), y: rowY(win) + 80 * (1 - ramp(t, pick - 0.7, 0.6)) };
  return (
    <Over s={s}>
      {t >= cardT && (
        <div style={{ position: "absolute", left: 90, top: y, width: 900, padding: "28px 36px", ...dark, transform: `scale(${0.85 + 0.15 * pop(t, cardT)})` }}>
          <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 40, color: "#fff", whiteSpace: "nowrap", overflow: "hidden" }}>📊 {p.q ?? "Bạn chọn gì?"}</div>
          {opts.map((o, i) => (
            <div key={i} style={{ position: "relative", height: 74, marginTop: 18, borderRadius: 20, background: "rgba(255,255,255,.08)", overflow: "hidden",
              boxShadow: i === win && fill > 0.95 ? `0 0 0 3px ${C.green}, 0 0 24px rgba(46,204,113,.5)` : "none" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${o.p * fill}%`, background: i === win ? C.green : "rgba(255,255,255,.22)" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", height: "100%", padding: "0 22px", fontFamily: BVP, fontWeight: 800, fontSize: 34, color: "#fff" }}>
                {i === win && t >= pick ? "✓ " : ""}{o.t}
                <span style={{ marginLeft: "auto", opacity: fill }}>{Math.round(o.p * fill)}%</span>
              </div>
            </div>
          ))}
          <div style={{ fontFamily: MONO, fontSize: 24, color: "#9EA2B3", marginTop: 14 }}>{Math.round((p.votes ?? 12400) * fill).toLocaleString("de-DE")} lượt bình chọn</div>
        </div>
      )}
      {t >= pick - 0.7 && t < pick + 0.6 && <Cursor x={cur.x} y={cur.y} down={t >= pick && t < pick + 0.15} />}
    </Over>
  );
};

/* ===== star-review ===== cues: card, stars · params: name, quote, avatar (letter), stars (1–5) */
export const StarReview: React.FC<FxProps> = ({ t, s, c, p }) => {
  const cardT = cue(c, "card", s.start + 0.5), starT = cue(c, "stars", cardT + 0.6);
  const quote: string[] = String(p.quote ?? "Xem xong làm theo được luôn").split(" "), n: number = p.stars ?? 5;
  const y = place(s, 300, "top");
  return (
    <Over s={s}>
      {t >= cardT && (
        <div style={{ position: "absolute", left: 80, top: y, width: 920, padding: "26px 34px", ...dark, transform: `translateY(${(1 - pop(t, cardT)) * -60}px)`, opacity: ramp(t, cardT, 0.2) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: INK.blue, color: "#fff", display: "grid", placeItems: "center", fontFamily: STK, fontSize: 36 }}>{p.avatar ?? String(p.name ?? "N")[0]}</div>
            <div>
              <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 32, color: "#fff" }}>{p.name ?? "Người xem"}</div>
              <div style={{ fontSize: 40, letterSpacing: 4 }}>
                {Array.from({ length: 5 }, (_, i) => <span key={i} style={{ color: i < n && t >= starT + i * 0.15 ? "#FFC83D" : "rgba(255,255,255,.2)",
                  display: "inline-block", transform: `scale(${i < n && t >= starT + i * 0.15 ? 0.7 + 0.3 * pop(t, starT + i * 0.15, 300, 12) : 1})` }}>★</span>)}
              </div>
            </div>
          </div>
          <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 40, color: "#fff", marginTop: 14, lineHeight: 1.25 }}>
            “{quote.map((w, i) => <span key={i} style={{ opacity: ramp(t, starT + 0.8 + i * 0.12, 0.12) }}>{w} </span>)}”
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== terminal-command ===== cues: type, done · params: cmd, lines (≤ 3) */
export const TerminalCommand: React.FC<FxProps> = ({ t, s, c, p }) => {
  const typeT = cue(c, "type", s.start + 0.5), doneT = cue(c, "done", typeT + 1.8);
  const cmd: string = p.cmd ?? 'claude "dựng video này"', lines: string[] = (p.lines ?? ["Cắt khoảng lặng", "Thêm phụ đề", "Xuất 1080p"]).slice(0, 3);
  const typed = cmd.slice(0, Math.ceil(cmd.length * ramp(t, typeT, 0.8))), spin = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
  const y = place(s, 330);
  return (
    <Over s={s}>
      {t >= typeT - 0.2 && (
        <div style={{ position: "absolute", left: 70, top: y, width: 940, ...dark, borderRadius: 24, overflow: "hidden", transform: `perspective(1400px) rotateX(8deg) scale(${0.85 + 0.15 * pop(t, typeT - 0.2)})` }}>
          <div style={{ height: 46, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "rgba(255,255,255,.06)" }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((col) => <div key={col} style={{ width: 16, height: 16, borderRadius: 8, background: col }} />)}
            <span style={{ marginLeft: 12, fontFamily: MONO, fontSize: 22, color: "#8B8FA0" }}>terminal</span>
          </div>
          <div style={{ padding: "18px 26px 24px", fontFamily: MONO, fontSize: 32, color: "#E6E6E6", lineHeight: 1.6 }}>
            <div><span style={{ color: C.claude }}>›</span> {typed}<span style={{ opacity: Math.floor(t * 3) % 2 ? 0 : 1, color: C.claude }}>▍</span></div>
            {lines.map((l, i) => {
              const t0 = typeT + 0.9 + i * 0.2, ok = t >= doneT + i * 0.35;
              if (t < t0) return null;
              return <div key={i} style={{ whiteSpace: "nowrap" }}><span style={{ color: ok ? C.green : INK.orange }}>{ok ? "✓" : spin[Math.floor(t * 12) % spin.length]}</span> {l}</div>;
            })}
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== slot-word ===== cues: on, lock · params: before, options [...], after — the last option is the one it locks on */
export const SlotWord: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), lock = cue(c, "lock", on + 1.4);
  const opts: string[] = p.options ?? ["chậm", "khó", "đắt", "NHANH"];
  const word = t >= lock ? opts[opts.length - 1] : opts[Math.floor((t - on) / 0.09) % Math.max(1, opts.length - 1)];
  const longest = opts.reduce((a, b) => (b.length > a.length ? b : a), "");
  const size = fitSize(`${p.before ?? ""} ${longest} ${p.after ?? ""}`, 76, 980);
  const y = place(s, size * 1.6, "top");
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", alignItems: "center", gap: size * 0.25, fontFamily: STK, fontSize: size, color: "#fff",
          whiteSpace: "nowrap", textShadow: `0 ${size / 12}px 0 ${INK.navy}`, opacity: ramp(t, on, 0.2) }}>
          {p.before && <span>{p.before}</span>}
          <span style={{ padding: `0 ${size * 0.2}px`, borderRadius: size * 0.2, background: t >= lock ? INK.orange : "rgba(15,30,70,.75)", overflow: "hidden",
            transform: `scale(${t >= lock ? 0.8 + 0.2 * pop(t, lock, 300, 12) : 1})`, filter: t >= lock ? "none" : "blur(1.5px)" }}>{word}</span>
          {p.after && <span>{p.after}</span>}
        </div>
      )}
    </Over>
  );
};

/* ===== strike-replace ===== cues: strike, swap · params: old, new */
export const StrikeReplace: React.FC<FxProps> = ({ t, s, c, p }) => {
  const strike = cue(c, "strike", s.start + 0.6), swap = cue(c, "swap", strike + 0.9);
  const o: string = p.old ?? "KHÓ", n: string = p.new ?? "DỄ", size = fitSize(o.length > n.length ? o : n, 150, 900);
  const y = place(s, size * 1.1, "top");
  const drop = ramp(t, swap, 0.45), rise = pop(t, swap + 0.1, 200, 14);
  return (
    <Over s={s}>
      {t >= strike - 0.4 && drop < 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y + drop * 500, display: "flex", justifyContent: "center", opacity: (1 - drop) * ramp(t, strike - 0.4, 0.2), transform: `rotate(${drop * 14}deg)` }}>
          <div style={{ position: "relative" }}>
            <Out size={size} fill="#E8E8E8">{o}</Out>
            <div style={{ position: "absolute", left: -10, top: "48%", height: size / 9, width: `${(100 + 4) * ramp(t, strike, 0.3)}%`, background: INK.orange, borderRadius: 8, transform: "rotate(-4deg)" }} />
          </div>
        </div>
      )}
      {t >= swap + 0.1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y + (1 - rise) * 160, display: "flex", justifyContent: "center", opacity: Math.min(1, rise * 2) }}>
          <Out size={size} fill={INK.yellow}>{n}</Out>
        </div>
      )}
    </Over>
  );
};

/* ===== confetti-milestone ===== cues: hit · params: value (text, e.g. "10.000"), label */
export const ConfettiMilestone: React.FC<FxProps> = ({ t, s, c, p }) => {
  const hit = cue(c, "hit", on0(c, s)), val: string = String(p.value ?? "10.000"), size = fitSize(val, 170, 900);
  const y = place(s, size * 1.4, "top"), q = pop(t, hit, 260, 12), dt = t - hit;
  const cols = [INK.orange, INK.blue, "#fff", INK.yellow];
  return (
    <Over s={s}>
      {t >= hit && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${2.2 - 1.2 * q})`, opacity: Math.min(1, q * 2) }}>
            {p.label && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: "0.3em", color: "#fff", marginBottom: 6 }}>{p.label}</div>}
            <Out size={size}>{val}</Out>
          </div>
          {dt < 2.6 && Array.from({ length: 70 }, (_, i) => {
            const side = i % 2 ? 1 : -1, vx = side * -(260 + random(`vx${i}`) * 520), vy = -(1100 + random(`vy${i}`) * 900);
            const x = (side > 0 ? 1080 : 0) + vx * dt, yy = 1500 + vy * dt + 1100 * dt * dt;
            return <div key={i} style={{ position: "absolute", left: x, top: yy, width: 16, height: 26, background: cols[i % 4], borderRadius: 3,
              transform: `rotate(${dt * 600 * (random(`r${i}`) - 0.5)}deg)`, opacity: 1 - ramp(t, hit + 1.8, 0.8) }} />;
          })}
        </>
      )}
    </Over>
  );
};

/* ===== hanging-sign ===== cues: drop · params: text, dot (blinking dot, default true) */
export const HangingSign: React.FC<FxProps> = ({ t, s, c, p }) => {
  const drop = cue(c, "drop", on0(c, s)), text: string = p.text ?? "ĐANG QUAY", size = fitSize(text, 74, 600);
  const H = 150, yEnd = isVo(s) ? 700 : Math.max(70, Math.min(place(s, H, "top"), 120));
  const fall = pop(t, drop, 140, 9), dt = t - drop, swing = 7 * Math.sin(dt * 7) * Math.exp(-dt * 1.6);
  const top = -260 + (yEnd + 260) * fall;
  return (
    <Over s={s}>
      {t >= drop && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: top + H, transformOrigin: "540px 0px", transform: `rotate(${swing}deg)` }}>
          <div style={{ position: "absolute", left: 260, top: 0, width: 3, height: top + 10, background: "#C9CCD6" }} />
          <div style={{ position: "absolute", left: 817, top: 0, width: 3, height: top + 10, background: "#C9CCD6" }} />
          <div style={{ position: "absolute", left: 200, top, width: 680, height: H, ...dark, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
            {p.dot !== false && <div style={{ width: 30, height: 30, borderRadius: 15, background: "#FF3B30", opacity: Math.floor(t * 2) % 2 ? 0.25 : 1, boxShadow: "0 0 16px #FF3B30" }} />}
            <div style={{ fontFamily: STK, fontSize: size, color: "#fff", whiteSpace: "nowrap" }}>{text}</div>
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== mind-map ===== cues: root, branches · params: root, nodes (≤ 4) */
export const MindMap2: React.FC<FxProps> = ({ t, s, c, p }) => {
  const rootT = cue(c, "root", s.start + 0.5), brT = cue(c, "branches", rootT + 0.8);
  const nodes: string[] = (p.nodes ?? ["Ý 1", "Ý 2", "Ý 3", "Ý 4"]).slice(0, 4), dy = isVo(s) ? 420 : 0;
  const R = { x: 540, y: 120 + dy };
  const pos = [[150, 430], [930, 430], [150, 760], [930, 760]].map(([x, y]) => ({ x, y: y + dy }));
  return (
    <Over s={s}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {nodes.map((_, i) => {
          const q = pos[i], k = ramp(t, brT + i * 0.3, 0.45);
          return t >= brT + i * 0.3 && <path key={i} d={`M ${R.x} ${R.y + 40} C ${R.x} ${R.y + 200}, ${q.x} ${q.y - 220}, ${q.x} ${q.y - 40}`} fill="none" stroke={INK.orange}
            strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} style={{ filter: "drop-shadow(0 0 8px rgba(255,122,26,.6))" }} />;
        })}
      </svg>
      {t >= rootT && (
        <div style={{ position: "absolute", left: R.x - 170, top: R.y - 42, width: 340, height: 84, borderRadius: 42, background: INK.orange, color: "#fff", display: "grid", placeItems: "center",
          fontFamily: STK, fontSize: fitSize(p.root ?? "Ý TƯỞNG", 44, 300), transform: `scale(${pop(t, rootT, 260, 13)})`, boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>{p.root ?? "Ý TƯỞNG"}</div>
      )}
      {nodes.map((n, i) => {
        const t0 = brT + i * 0.3 + 0.4, q = pos[i];
        return t >= t0 && (
          <div key={i} style={{ position: "absolute", left: q.x - 120, top: q.y - 40, width: 240, padding: "14px 12px", ...dark, borderRadius: 22, textAlign: "center",
            fontFamily: BVP, fontWeight: 800, fontSize: 28, color: "#fff", transform: `scale(${pop(t, t0, 260, 13)})` }}>
            <span style={{ color: INK.orange }}>{i + 1}</span> {n}
          </div>
        );
      })}
    </Over>
  );
};

/* ===== milestone-timeline ===== cues: n1…n4 (each milestone lights) · params: items [{y, t}] (≤ 4), now (label for the last one) */
export const MilestoneTimeline: React.FC<FxProps> = ({ t, s, c, p }) => {
  const items: { y: string; t: string }[] = (p.items ?? [{ y: "2024", t: "Bắt đầu" }, { y: "2025", t: "Tăng tốc" }, { y: "2026", t: "Bây giờ" }]).slice(0, 4);
  const times = items.map((_, i) => cue(c, `n${i + 1}`, s.start + 0.6 + i * 1.0));
  const y = place(s, 300), cur = times.filter((x) => t >= x).length - 1, X0 = 130, W = 740, step = W / Math.max(1, items.length - 1);
  const xs = items.map((_, i) => (items.length === 1 ? W / 2 : i * step));
  return (
    <Over s={s}>
      {t >= times[0] - 0.2 && (
        <div style={{ position: "absolute", left: 40, top: y, width: 1000, height: 300, ...dark, transform: `scale(${0.85 + 0.15 * pop(t, times[0] - 0.2)})` }}>
          <div style={{ position: "absolute", left: X0, top: 150, width: W, height: 6, background: "rgba(255,255,255,.15)", borderRadius: 3 }} />
          <div style={{ position: "absolute", left: X0, top: 150, height: 6, width: cur < 0 ? 0 : xs[cur], background: INK.orange, borderRadius: 3 }} />
          {items.map((it, i) => {
            const lit = i <= cur, now = i === cur;
            return (
              <div key={i} style={{ position: "absolute", left: X0 + xs[i] - 110, top: 40, width: 220, textAlign: "center", opacity: lit ? 1 : 0.35 }}>
                <div style={{ fontFamily: STK, fontSize: now ? 52 : 40, color: lit ? "#fff" : "#9EA2B3" }}>{it.y}</div>
                <div style={{ width: now ? 34 : 24, height: now ? 34 : 24, borderRadius: 17, margin: `${now ? 26 : 32}px auto 0`, background: lit ? INK.orange : "#555", boxShadow: now ? "0 0 20px rgba(255,122,26,.8)" : "none" }} />
                <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 28, color: "#fff", marginTop: 18, whiteSpace: "nowrap" }}>{it.t}</div>
                {now && i === items.length - 1 && p.now && <div style={{ display: "inline-block", marginTop: 8, padding: "4px 14px", borderRadius: 12, background: C.green, fontFamily: MONO, fontWeight: 700, fontSize: 22, color: "#fff" }}>{p.now}</div>}
              </div>
            );
          })}
        </div>
      )}
    </Over>
  );
};

/* ===== cinema-bars ===== cues: on, title · params: title, credit */
export const CinemaBars: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), titleT = cue(c, "title", on + 0.6), k = ramp(t, on, 0.5), BAR = 250;
  const grain = Math.floor(t * 24);
  return (
    <AbsoluteFill>
      <Vid s={s} style={{ filter: `sepia(${0.28 * k}) contrast(${1 + 0.1 * k}) saturate(${1 - 0.15 * k})` }} />
      <AbsoluteFill style={{ opacity: 0.18 * k, backgroundImage: "radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.5px)", backgroundSize: "5px 5px",
        backgroundPosition: `${random(`gx${grain}`) * 5}px ${random(`gy${grain}`) * 5}px`, mixBlendMode: "overlay" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)", opacity: k }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: BAR * k, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BAR * k, background: "#000" }} />
      {t >= titleT && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1920 - BAR + 60, textAlign: "center", opacity: ramp(t, titleT, 0.6) }}>
          <div style={{ fontFamily: BVP, fontWeight: 600, fontSize: fitSize(p.title ?? "", 54, 900 / 1.4), letterSpacing: "0.35em", color: "#F3E6D0" }}>{p.title ?? ""}</div>
          {p.credit && <div style={{ fontFamily: BVP, fontWeight: 600, fontSize: 24, letterSpacing: "0.3em", color: "#A89B86", marginTop: 14 }}>{p.credit}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ===== incoming-call ===== cues: ring, answer · params: name, sub, avatar */
export const IncomingCall: React.FC<FxProps> = ({ t, s, c, p }) => {
  const ring = cue(c, "ring", s.start + 0.4), ans = cue(c, "answer", ring + 1.6), y = place(s, 200, "top");
  const on = t >= ans, wob = on ? 0 : Math.sin(t * 40) * 3 * (Math.floor((t - ring) * 1.5) % 2 ? 0 : 1);
  const secs = Math.max(0, Math.floor(t - ans));
  const pulse = ((t - ring) * 1.2) % 1;
  return (
    <Over s={s}>
      {t >= ring && (
        <div style={{ position: "absolute", left: 70, top: y, width: 940, height: 200, ...dark, borderRadius: 100, display: "flex", alignItems: "center", gap: 24, padding: "0 28px",
          transform: `translateY(${(1 - pop(t, ring)) * -80}px) rotate(${wob}deg)` }}>
          <div style={{ position: "relative", width: 130, height: 130 }}>
            {!on && <div style={{ position: "absolute", inset: -24 * pulse, borderRadius: "50%", border: `4px solid ${C.claude}`, opacity: 1 - pulse }} />}
            <div style={{ width: 130, height: 130, borderRadius: 65, background: `linear-gradient(135deg, ${C.claude}, ${INK.orange})`, display: "grid", placeItems: "center", fontFamily: STK, fontSize: 56, color: "#fff" }}>{p.avatar ?? "AI"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 42, color: "#fff", whiteSpace: "nowrap" }}>{p.name ?? "Trợ lý AI"}</div>
            <div style={{ fontFamily: MONO, fontSize: 28, color: on ? C.green : "#B5B8C6" }}>{on ? `Đã kết nối · 00:0${secs}` : p.sub ?? "Cuộc gọi đến…"}</div>
          </div>
          {!on && <div style={{ width: 96, height: 96, borderRadius: 48, background: "#FF3B30", display: "grid", placeItems: "center", fontSize: 44, color: "#fff" }}>✕</div>}
          <div style={{ width: 96, height: 96, borderRadius: 48, background: on ? "#FF3B30" : C.green, display: "grid", placeItems: "center", fontSize: 44, color: "#fff",
            transform: `scale(${t >= ans - 0.1 && t < ans + 0.15 ? 0.85 : 1})` }}>{on ? "✕" : "✆"}</div>
        </div>
      )}
      {t >= ans - 0.7 && t < ans + 0.4 && <Cursor x={930} y={y + 100 + 260 * (1 - ramp(t, ans - 0.7, 0.6))} down={t >= ans - 0.1} />}
    </Over>
  );
};

/* ===== head-stickers ===== cues: on · params: icons (≤ 5 emoji) */
export const HeadStickers: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), icons: string[] = (p.icons ?? ["🔥", "⭐", "✅", "❤️", "⚡"]).slice(0, 5);
  const h = isVo(s) ? { x0: 330, y0: 520, x1: 750, y1: 1000 } : headAt(s.id, 1);
  const cx = (h.x0 + h.x1) / 2, w = h.x1 - h.x0;
  const slots = [[h.x0 - 90, h.y0 + 40], [h.x1 + 90, h.y0 + 40], [h.x0 - 120, (h.y0 + h.y1) / 2 + 60], [h.x1 + 120, (h.y0 + h.y1) / 2 + 60], [cx, h.y0 - 70]]
    .map(([x, y]) => [Math.max(80, Math.min(1000, x)), Math.max(90, y)]);
  return (
    <Over s={s}>
      {icons.map((ic, i) => {
        const t0 = on + i * 0.14;
        if (t < t0) return null;
        const [x, y] = slots[i], q = pop(t, t0, 300, 10), rot = Math.sin(t * 6 + i) * 10;
        return <div key={i} style={{ position: "absolute", left: x - 70, top: y - 70, width: 140, height: 140, display: "grid", placeItems: "center", fontFamily: EMOJI, fontSize: Math.min(120, w * 0.22),
          transform: `scale(${q}) rotate(${rot}deg)`, filter: "drop-shadow(0 0 0 #fff) drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff) drop-shadow(0 10px 14px rgba(0,0,0,.4))" }}>{ic}</div>;
      })}
    </Over>
  );
};

/* ===== decode-word ===== cues: on, done · params: word, status [running, done] */
export const DecodeWord: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), done = cue(c, "done", on + 1.2), word: string = p.word ?? "GIẢI MÃ";
  const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*", size = fitSize(word, 130, 940), y = place(s, size * 1.5, "top");
  const shown = word.split("").map((ch, i) => {
    if (ch === " " || t >= on + (done - on) * ((i + 1) / word.length)) return ch;
    return POOL[Math.floor(random(`d${i}-${Math.floor(t * 20)}`) * POOL.length)];
  }).join("");
  const [run, ok] = p.status ?? ["ĐANG GIẢI MÃ…", "XONG ✓"];
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ padding: "4px 16px", borderRadius: 10, background: t >= done ? C.green : "rgba(15,30,70,.8)", fontFamily: MONO, fontWeight: 700, fontSize: 26, color: "#fff" }}>{t >= done ? ok : run}</div>
          <div style={{ fontFamily: t >= done ? STK : MONO, fontWeight: 900, fontSize: size, color: "#fff", whiteSpace: "pre", textShadow: `0 ${size / 12}px 0 ${INK.navy}, 0 0 24px rgba(0,0,0,.4)`,
            transform: `scale(${t >= done ? 0.9 + 0.1 * pop(t, done, 300, 12) : 1})` }}>{shown}</div>
        </div>
      )}
    </Over>
  );
};

/* ===== ios-toggles ===== cues: on, flip · params: items (≤ 4 labels), result */
export const IosToggles: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), flip = cue(c, "flip", on + 0.6), items: string[] = (p.items ?? ["Tự cắt lặng", "Phụ đề", "Nhạc nền"]).slice(0, 4);
  const hgt = 60 + items.length * 96 + (p.result ? 70 : 0), y = place(s, hgt), dots = [INK.orange, INK.blue, C.green, C.purple];
  const allOn = t >= flip + (items.length - 1) * 0.4 + 0.3;
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 140, top: y, width: 800, padding: "20px 30px", ...dark, transform: `scale(${0.85 + 0.15 * pop(t, on)})` }}>
          {items.map((it, i) => {
            const k = ramp(t, flip + i * 0.4, 0.18);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, height: 96, borderTop: i ? "1px solid rgba(255,255,255,.1)" : "none" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: dots[i] }} />
                <div style={{ flex: 1, fontFamily: BVP, fontWeight: 800, fontSize: 36, color: "#fff", whiteSpace: "nowrap" }}>{it}</div>
                <div style={{ width: 110, height: 64, borderRadius: 32, background: k > 0.5 ? C.green : "rgba(255,255,255,.2)", position: "relative" }}>
                  <div style={{ position: "absolute", top: 4, left: 4 + 46 * k, width: 56, height: 56, borderRadius: 28, background: "#fff", boxShadow: "0 3px 8px rgba(0,0,0,.3)" }} />
                </div>
              </div>
            );
          })}
          {p.result && allOn && <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 34, color: C.green, paddingTop: 16, opacity: ramp(t, flip + items.length * 0.4, 0.3) }}>✓ {p.result}</div>}
        </div>
      )}
    </Over>
  );
};

/* ===== follow-click ===== cues: tap · params: name, handle, followers (number), avatar */
export const FollowClick: React.FC<FxProps> = ({ t, s, c, p }) => {
  const tap = cue(c, "tap", s.start + 1.4), show = Math.min(tap - 0.9, s.start + 0.3), y = place(s, 190);
  const done = t >= tap, base: number = p.followers ?? 12400, cnt = Math.round(base + (p.gain ?? 1) * ramp(t, tap + 0.1, 0.4));
  const mv = ramp(t, tap - 0.8, 0.7), cur = { x: 1040 - 170 * mv, y: y + 95 + 300 * (1 - mv) };
  return (
    <Over s={s}>
      {t >= show && (
        <div style={{ position: "absolute", left: 70, top: y, width: 940, height: 190, ...dark, display: "flex", alignItems: "center", gap: 22, padding: "0 28px", transform: `scale(${0.85 + 0.15 * pop(t, show)})` }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, background: INK.blue, border: "4px solid #fff", display: "grid", placeItems: "center", fontFamily: STK, fontSize: 52, color: "#fff" }}>{p.avatar ?? String(p.name ?? "B")[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 40, color: "#fff", whiteSpace: "nowrap" }}>{p.name ?? "Kênh của bạn"} <span style={{ color: INK.blue }}>●</span></div>
            <div style={{ fontFamily: MONO, fontSize: 26, color: "#A3A7B7", whiteSpace: "nowrap" }}>{p.handle ?? "@kenh"} · {cnt.toLocaleString("de-DE")} người theo dõi</div>
          </div>
          <div style={{ padding: "18px 28px", borderRadius: 22, background: done ? "rgba(255,255,255,.16)" : "#FE2C55", fontFamily: BVP, fontWeight: 900, fontSize: 32, color: "#fff", whiteSpace: "nowrap",
            transform: `scale(${t >= tap - 0.08 && t < tap + 0.15 ? 0.88 : 1})` }}>{done ? "✓ Đang theo dõi" : "Theo dõi"}</div>
        </div>
      )}
      {t >= tap - 0.8 && t < tap + 0.5 && <Cursor x={cur.x} y={cur.y} down={t >= tap - 0.08 && t < tap + 0.15} />}
    </Over>
  );
};

export const FX2: Record<string, React.FC<FxProps>> = {
  "punch-headline": PunchHeadline, countdown: Countdown, "progress-ring": ProgressRing, poll: Poll, "star-review": StarReview,
  "terminal-command": TerminalCommand, "slot-word": SlotWord, "strike-replace": StrikeReplace, "confetti-milestone": ConfettiMilestone,
  "hanging-sign": HangingSign, "mind-map": MindMap2, "milestone-timeline": MilestoneTimeline, "cinema-bars": CinemaBars,
  "incoming-call": IncomingCall, "head-stickers": HeadStickers, "decode-word": DecodeWord, "ios-toggles": IosToggles, "follow-click": FollowClick,
};
