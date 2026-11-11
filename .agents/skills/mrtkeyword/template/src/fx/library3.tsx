import React from "react";
import { AbsoluteFill, OffthreadVideo, random, staticFile, useCurrentFrame } from "remotion";
import { BVP, C, FPS, INK, STK, pop, ramp } from "../ui";
import { FxProps, Out, Vid, cue, fitSize, headAt, isVo } from "./common";
import { Cursor, EMOJI, MONO, Over, dark, on0, place } from "./library2";

/* Batch 3 of keyword effects. Same contract as library.tsx / library2.tsx: cue times in `c`, content in `p`,
   overlays on the speaker that also work on a voice-only segment (`place` centres the block there). */

const HAND = "'Segoe Print', 'Comic Sans MS', cursive";
const vnd = (n: number) => Math.round(n).toLocaleString("de-DE");

/* ===== typewriter ===== cues: on · params: text (≤ 40), cps (chars per second, 18) */
export const Typewriter: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), text: string = p.text ?? "Gõ một câu là xong", cps: number = p.cps ?? 18;
  const shown = text.slice(0, Math.max(0, Math.floor((t - on) * cps)));
  const size = Math.min(72, fitSize(text, 72, 1500) * 1.6), y = place(s, size * 2.6, "top");
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 80, right: 80, top: y, display: "flex", justifyContent: "center" }}>
          <div style={{ ...dark, padding: "22px 32px", fontFamily: MONO, fontWeight: 700, fontSize: size, color: "#fff", lineHeight: 1.25, textAlign: "center" }}>
            {shown}<span style={{ color: INK.orange, opacity: Math.floor(t * 3) % 2 ? 0 : 1 }}>▍</span>
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== word-slam ===== cues: hit · params: word (≤ 10), color */
export const WordSlam: React.FC<FxProps> = ({ t, s, c, p }) => {
  const hit = cue(c, "hit", on0(c, s)), word: string = p.word ?? "BÙM!", size = fitSize(word, 230, 980);
  const dt = t - hit, shake = dt >= 0 && dt < 0.35 ? Math.sin(dt * 95) * 22 * (1 - dt / 0.35) : 0;
  const q = pop(t, hit, 320, 14), y = isVo(s) ? 760 - size / 2 : place(s, size * 1.05);
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
      <Vid s={s} />
      {t >= hit && (
        <>
          <AbsoluteFill style={{ background: "#fff", opacity: 0.5 * (1 - ramp(t, hit, 0.18)) }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", transform: `scale(${3 - 2 * q}) rotate(-4deg)`, opacity: Math.min(1, q * 2) }}>
            <Out size={size} fill={p.color ?? INK.yellow}>{word}</Out>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

/* ===== kinetic-pop ===== cues: w1…w4 (the moment each word is spoken) · params: words (≤ 4, each ≤ 10) */
export const KineticPop: React.FC<FxProps> = ({ t, s, c, p }) => {
  const words: string[] = (p.words ?? ["NHANH", "GỌN", "ĐẸP"]).slice(0, 4);
  const times = words.map((_, i) => cue(c, `w${i + 1}`, s.start + 0.4 + i * 0.5));
  const size = Math.min(...words.map((w) => fitSize(w, 120, 900))), y = place(s, words.length * size * 1.05);
  const cols = ["#fff", INK.yellow, "#fff", INK.orange];
  return (
    <Over s={s}>
      <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.05 }}>
        {words.map((w, i) => t >= times[i] && (
          <div key={i} style={{ transform: `scale(${pop(t, times[i], 360, 12)}) rotate(${i % 2 ? 3 : -3}deg)` }}>
            <Out size={size} fill={cols[i]}>{w}</Out>
          </div>
        ))}
      </div>
    </Over>
  );
};

/* ===== arrow-doodle ===== cues: draw · params: label (≤ 16), side ("left" | "right") */
export const ArrowDoodle: React.FC<FxProps> = ({ t, s, c, p }) => {
  const draw = cue(c, "draw", on0(c, s)), right = p.side !== "left";
  const h = isVo(s) ? { x0: 380, y0: 640, x1: 700, y1: 980 } : headAt(s.id, 1);
  const tx = right ? h.x1 + 20 : h.x0 - 20, ty = (h.y0 + h.y1) / 2;
  const lx = right ? 840 : 240, ly = Math.max(150, h.y0 - 60);  // label kept 90 px inside the frame edge
  const k = ramp(t, draw + 0.25, 0.4), dir = right ? 1 : -1;
  return (
    <Over s={s}>
      {t >= draw && (
        <>
          <div style={{ position: "absolute", left: lx - 150, top: ly - 70, width: 300, textAlign: "center", fontFamily: HAND, fontWeight: 700, fontSize: Math.min(50, fitSize(p.label ?? "", 50, 430)), whiteSpace: "nowrap",
            color: INK.yellow, textShadow: "0 3px 0 #0F1E46, 0 0 12px rgba(0,0,0,.5)", transform: `rotate(${-6 * dir}deg) scale(${pop(t, draw, 260, 13)})` }}>{p.label ?? "Đây này!"}</div>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <g fill="none" stroke={INK.yellow} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 4px 0 rgba(15,30,70,.85))" }}>
              <path d={`M ${lx} ${ly + 10} C ${lx} ${ly + 140}, ${tx + 160 * dir} ${ty - 80}, ${tx} ${ty}`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
              {k >= 1 && <path d={`M ${tx + 50 * dir} ${ty - 40} L ${tx} ${ty} L ${tx + 58 * dir} ${ty + 18}`} />}
            </g>
          </svg>
        </>
      )}
    </Over>
  );
};

/* ===== cross-out ===== cues: on, cross · params: text (the wrong way, ≤ 24), label (≤ 8, "SAI") */
export const CrossOut: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), cross = cue(c, "cross", on + 1.0), y = place(s, 190);
  const a = ramp(t, cross, 0.18), b = ramp(t, cross + 0.15, 0.18);
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 120, top: y, width: 840, height: 190, ...dark, display: "grid", placeItems: "center", transform: `scale(${0.85 + 0.15 * pop(t, on)})` }}>
          <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: fitSize(p.text ?? "", 56, 1100), color: t >= cross ? "#9A9AA5" : "#fff", whiteSpace: "nowrap" }}>{p.text ?? "Cách làm cũ"}</div>
          <svg width={840} height={190} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {t >= cross && <line x1={60} y1={30} x2={60 + 720 * a} y2={30 + 130 * a} stroke="#FF3B30" strokeWidth={16} strokeLinecap="round" />}
            {t >= cross + 0.15 && <line x1={780} y1={30} x2={780 - 720 * b} y2={30 + 130 * b} stroke="#FF3B30" strokeWidth={16} strokeLinecap="round" />}
          </svg>
          {t >= cross + 0.3 && <div style={{ position: "absolute", right: -20, top: -40, padding: "6px 22px", borderRadius: 14, background: "#FF3B30", color: "#fff", fontFamily: STK, fontSize: 44,
            transform: `rotate(8deg) scale(${pop(t, cross + 0.3, 320, 12)})` }}>{p.label ?? "SAI"}</div>}
        </div>
      )}
    </Over>
  );
};

/* ===== check-stamp ===== cues: hit · params: label (≤ 18) */
export const CheckStamp: React.FC<FxProps> = ({ t, s, c, p }) => {
  const hit = cue(c, "hit", on0(c, s)), y = place(s, 330), k = ramp(t, hit + 0.15, 0.3);
  return (
    <Over s={s}>
      {t >= hit && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <svg width={240} height={240} style={{ transform: `scale(${pop(t, hit, 300, 11)})`, filter: "drop-shadow(0 12px 24px rgba(0,0,0,.4))" }}>
            <circle cx={120} cy={120} r={108} fill={C.green} stroke="#fff" strokeWidth={10} />
            <path d="M 66 124 L 104 162 L 176 86" fill="none" stroke="#fff" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
          </svg>
          {p.label && <div style={{ opacity: ramp(t, hit + 0.4, 0.2) }}><Out size={fitSize(p.label, 64, 900)}>{p.label}</Out></div>}
        </div>
      )}
    </Over>
  );
};

/* ===== price-tag ===== cues: on, cut · params: old, new (price text), label (≤ 18) */
export const PriceTag: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), cut = cue(c, "cut", on + 1.0), y = place(s, 260);
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 180, top: y, width: 720, height: 260, borderRadius: "36px 36px 36px 36px", background: "linear-gradient(150deg,#FFE9C9,#FFD08A)",
          boxShadow: "0 24px 50px rgba(0,0,0,.35)", transform: `rotate(-4deg) scale(${0.8 + 0.2 * pop(t, on, 220, 12)})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", left: 30, top: 30, width: 34, height: 34, borderRadius: 17, background: "#fff", boxShadow: "inset 0 2px 4px rgba(0,0,0,.3)" }} />
          <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 32, color: "#8A5A1A", letterSpacing: "0.15em" }}>{p.label ?? "GIÁ HÔM NAY"}</div>
          <div style={{ position: "relative", fontFamily: STK, fontSize: t >= cut ? 44 : 88, color: t >= cut ? "#9A7B55" : C.ink, transition: "none" }}>
            {p.old ?? "990.000đ"}
            {t >= cut && <div style={{ position: "absolute", left: -8, right: -8, top: "52%", height: 7, background: "#E53935", transform: `scaleX(${ramp(t, cut, 0.2)})`, transformOrigin: "left" }} />}
          </div>
          {t >= cut + 0.2 && <div style={{ fontFamily: STK, fontSize: fitSize(p.new ?? "", 104, 640), color: "#E53935", transform: `scale(${pop(t, cut + 0.2, 320, 12)})` }}>{p.new ?? "0đ"}</div>}
        </div>
      )}
    </Over>
  );
};

/* ===== progress-bar ===== cues: on, done · params: label (≤ 24), value (%, 100) */
export const ProgressBar: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), done = cue(c, "done", on + 1.6), v: number = p.value ?? 100;
  const k = Math.min(1, Math.max(0, (t - on) / Math.max(0.3, done - on))), eased = 1 - Math.pow(1 - k, 2), y = place(s, 190);
  const full = k >= 1;
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 90, top: y, width: 900, padding: "26px 34px", ...dark, transform: `scale(${0.85 + 0.15 * pop(t, on)})` }}>
          <div style={{ display: "flex", fontFamily: BVP, fontWeight: 800, fontSize: 36, color: "#fff" }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{full && v >= 100 ? "✓ " : ""}{p.label ?? "Đang xử lý…"}</span>
            <span style={{ marginLeft: "auto", fontFamily: MONO, color: full ? C.green : INK.orange }}>{Math.round(v * eased)}%</span>
          </div>
          <div style={{ marginTop: 18, height: 34, borderRadius: 17, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${v * eased}%`, borderRadius: 17, background: full ? C.green : `linear-gradient(90deg, ${INK.orange}, #FFB066)`,
              backgroundImage: full ? undefined : "repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 14px, transparent 14px 28px)" }} />
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== glass-pie ===== cues: on, slice · params: value (% of the highlighted slice), label, rest (label of the rest) */
export const GlassPie: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), slice = cue(c, "slice", on + 1.2), v: number = p.value ?? 70, y = place(s, 340);
  const k = ramp(t, on, 0.9), out = 24 * ramp(t, slice, 0.25), R = 120, a1 = (v / 100) * Math.PI * 2 * k;
  const arc = (from: number, to: number, r: number, dx = 0, dy = 0) => {
    const x0 = 150 + dx + r * Math.sin(from), y0 = 150 + dy - r * Math.cos(from), x1 = 150 + dx + r * Math.sin(to), y1 = 150 + dy - r * Math.cos(to);
    return `M ${150 + dx} ${150 + dy} L ${x0} ${y0} A ${r} ${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${x1} ${y1} Z`;
  };
  const mid = a1 / 2;
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 110, top: y, width: 860, height: 340, ...dark, display: "flex", alignItems: "center", gap: 20, padding: "0 30px", transform: `scale(${0.85 + 0.15 * pop(t, on)})` }}>
          <svg width={300} height={300}>
            <circle cx={150} cy={150} r={R} fill="rgba(255,255,255,.14)" />
            {a1 > 0.01 && <path d={arc(0, Math.min(a1, Math.PI * 2 - 0.001), R, out * Math.sin(mid), -out * Math.cos(mid))} fill={INK.orange} style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,.4))" }} />}
          </svg>
          <div>
            <div style={{ fontFamily: STK, fontSize: 96, color: "#fff", lineHeight: 1 }}>{Math.round(v * k)}%</div>
            <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 34, color: INK.orange, marginTop: 8 }}>{p.label ?? "người dùng"}</div>
            {p.rest && <div style={{ fontFamily: BVP, fontWeight: 600, fontSize: 26, color: "#A8ABB8", marginTop: 6 }}>{p.rest}</div>}
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== glass-compare ===== cues: on, grow · params: a {label, value}, b {label, value}, unit (≤ 8), delta (≤ 10) */
export const GlassCompare: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), grow = cue(c, "grow", on + 0.8), y = place(s, 360);
  const A = p.a ?? { label: "TRƯỚC", value: 3 }, B = p.b ?? { label: "SAU", value: 10 }, max = Math.max(A.value, B.value) || 1;
  const bar = (it: { label: string; value: number }, i: number) => {
    const k = pop(t, grow + i * 0.35, 120, 16), hgt = 200 * (it.value / max) * k;
    return (
      <div key={i} style={{ width: 230, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 300 }}>
        <div style={{ fontFamily: STK, fontSize: 52, color: "#fff", opacity: Math.min(1, k * 2) }}>{vnd(it.value * Math.min(1, k))}{p.unit ? ` ${p.unit}` : ""}</div>
        <div style={{ width: 150, height: hgt, borderRadius: "18px 18px 6px 6px", background: i ? `linear-gradient(180deg, #7CF29A, ${C.green})` : "rgba(255,255,255,.35)", marginTop: 8 }} />
        <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 30, color: i ? C.green : "#C9CBD6", marginTop: 10 }}>{it.label}</div>
      </div>
    );
  };
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 140, top: y, width: 800, height: 360, ...dark, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 60, paddingBottom: 26,
          transform: `scale(${0.85 + 0.15 * pop(t, on)})` }}>
          {bar(A, 0)}{bar(B, 1)}
          {p.delta && t >= grow + 0.9 && <div style={{ position: "absolute", right: 24, top: 20, padding: "6px 18px", borderRadius: 16, background: C.green, color: "#fff", fontFamily: BVP, fontWeight: 900, fontSize: 34,
            transform: `scale(${pop(t, grow + 0.9, 300, 12)})` }}>{p.delta}</div>}
        </div>
      )}
    </Over>
  );
};

/* ===== glass-quote ===== cues: on · params: quote (≤ 60), name, role, avatar */
export const GlassQuote: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), words: string[] = String(p.quote ?? "Làm ít, ra nhiều.").split(" "), y = place(s, 330);
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 80, top: y, width: 920, padding: "30px 40px", ...dark, transform: `translateY(${(1 - pop(t, on)) * 60}px)`, opacity: ramp(t, on, 0.2) }}>
          <div style={{ position: "absolute", left: 24, top: -30, fontFamily: "Georgia, serif", fontSize: 160, color: INK.orange, lineHeight: 1 }}>“</div>
          <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 44, color: "#fff", lineHeight: 1.3, paddingLeft: 40 }}>
            {words.map((w, i) => <span key={i} style={{ opacity: ramp(t, on + 0.3 + i * 0.1, 0.12) }}>{w} </span>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, paddingLeft: 40, opacity: ramp(t, on + 0.4 + words.length * 0.1, 0.25) }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, background: INK.blue, color: "#fff", display: "grid", placeItems: "center", fontFamily: STK, fontSize: 30 }}>{p.avatar ?? String(p.name ?? "A")[0]}</div>
            <div>
              <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 30, color: "#fff" }}>{p.name ?? "Tên người nói"}</div>
              {p.role && <div style={{ fontFamily: BVP, fontWeight: 600, fontSize: 24, color: "#A8ABB8" }}>{p.role}</div>}
            </div>
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== chat-bubble ===== cues: m1…m4 (each message) · params: name, msgs [{me: bool, t}] (≤ 4, each ≤ 34) */
export const ChatBubble: React.FC<FxProps> = ({ t, s, c, p }) => {
  const msgs: { me?: boolean; t: string }[] = (p.msgs ?? [{ me: true, t: "Có cách nào làm video nhanh không?" }, { t: "Có! Gõ một lệnh là xong 😎" }]).slice(0, 4);
  const times = msgs.map((_, i) => cue(c, `m${i + 1}`, s.start + 0.5 + i * 1.1));
  const hgt = 110 + msgs.length * 110, y = place(s, hgt);
  return (
    <Over s={s}>
      {t >= times[0] - 0.3 && (
        <div style={{ position: "absolute", left: 110, top: y, width: 860, padding: "18px 26px 24px", ...dark, transform: `scale(${0.85 + 0.15 * pop(t, times[0] - 0.3)})` }}>
          <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 30, color: "#fff", borderBottom: "1px solid rgba(255,255,255,.12)", paddingBottom: 12 }}>💬 {p.name ?? "Tin nhắn"}</div>
          {msgs.map((m, i) => {
            const t0 = times[i], typing = !m.me && t >= t0 - 0.6 && t < t0;
            if (t < t0 && !typing) return null;
            return (
              <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start", marginTop: 16 }}>
                <div style={{ maxWidth: 640, padding: "14px 22px", borderRadius: 26, background: m.me ? INK.blue : "rgba(255,255,255,.14)", color: "#fff", fontFamily: BVP, fontWeight: 700, fontSize: 34,
                  transform: `scale(${typing ? 1 : pop(t, t0, 300, 14)})`, transformOrigin: m.me ? "right center" : "left center" }}>
                  {typing ? "●".repeat(1 + (Math.floor(t * 6) % 3)) : m.t}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Over>
  );
};

/* ===== search-bar ===== cues: type, results · params: query (≤ 30), results (≤ 3, each ≤ 34) */
export const SearchBar: React.FC<FxProps> = ({ t, s, c, p }) => {
  const typeT = cue(c, "type", s.start + 0.4), resT = cue(c, "results", typeT + 1.3);
  const q: string = p.query ?? "cách làm video nhanh", res: string[] = (p.results ?? ["Dựng video bằng Claude", "Mẫu hiệu ứng có sẵn", "Tự động từ A đến Z"]).slice(0, 3);
  const typed = q.slice(0, Math.ceil(q.length * ramp(t, typeT, 0.9))), y = place(s, 120 + (t >= resT ? res.length * 84 + 20 : 0), "top");
  return (
    <Over s={s}>
      {t >= typeT - 0.2 && (
        <div style={{ position: "absolute", left: 90, top: y, width: 900, borderRadius: 40, background: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,.35)", overflow: "hidden",
          transform: `scale(${0.85 + 0.15 * pop(t, typeT - 0.2)})` }}>
          <div style={{ height: 110, display: "flex", alignItems: "center", gap: 20, padding: "0 32px", fontFamily: BVP, fontWeight: 700, fontSize: 38, color: C.ink }}>
            <span style={{ fontSize: 40 }}>🔍</span>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{typed}<span style={{ color: INK.blue, opacity: Math.floor(t * 3) % 2 ? 0 : 1 }}>|</span></span>
          </div>
          {t >= resT && res.map((r, i) => (
            <div key={i} style={{ height: 84, display: "flex", alignItems: "center", gap: 18, padding: "0 32px", borderTop: "1px solid #EEE", fontFamily: BVP, fontWeight: 700, fontSize: 32,
              color: i === 0 ? INK.blue : "#333", opacity: ramp(t, resT + i * 0.15, 0.15) }}>
              <span style={{ color: "#999" }}>↗</span>{r}
            </div>
          ))}
        </div>
      )}
    </Over>
  );
};

/* ===== bank-notify ===== cues: on · params: amount (number), bank (≤ 14), note (≤ 30) */
export const BankNotify: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), amt: number = p.amount ?? 5000000, k = ramp(t, on + 0.3, 0.8);
  const top = isVo(s) ? 680 : 70;
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 70, top: top + (pop(t, on, 200, 16) - 1) * 240, width: 940, height: 190, borderRadius: 40, background: "rgba(245,245,247,.96)",
          boxShadow: "0 18px 40px rgba(0,0,0,.35)", display: "flex", alignItems: "center", gap: 24, padding: "0 30px" }}>
          <div style={{ width: 110, height: 110, borderRadius: 26, background: C.green, color: "#fff", display: "grid", placeItems: "center", fontFamily: STK, fontSize: 60 }}>₫</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", fontFamily: BVP, fontWeight: 600, fontSize: 28, color: "#666" }}>{String(p.bank ?? "Ngân hàng").toUpperCase()}<span style={{ marginLeft: "auto" }}>bây giờ</span></div>
            <div style={{ fontFamily: STK, fontSize: 56, color: C.green }}>+{vnd(amt * k)}đ</div>
            <div style={{ fontFamily: BVP, fontWeight: 600, fontSize: 26, color: "#444", whiteSpace: "nowrap", overflow: "hidden" }}>{p.note ?? "Nhận tiền thành công"}</div>
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== like-burst ===== cues: on · params: icons (≤ 3 emoji), count (number reached) */
export const LikeBurst: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), icons: string[] = p.icons ?? ["❤️", "👍", "🔥"], dt = t - on;
  const count: number = p.count ?? 1200;
  return (
    <Over s={s}>
      {dt >= 0 && Array.from({ length: 26 }, (_, i) => {
        const t0 = (i % 13) * 0.12 + Math.floor(i / 13) * 0.05, life = dt - t0;
        if (life < 0 || life > 2.2) return null;
        const x = 120 + random(`lx${i}`) * 840 + Math.sin(life * 3 + i) * 30, y = 1500 - life * (420 + random(`ly${i}`) * 300);
        return <div key={i} style={{ position: "absolute", left: x, top: y, fontFamily: EMOJI, fontSize: 60 + random(`ls${i}`) * 50, opacity: 1 - life / 2.2,
          transform: `scale(${Math.min(1, life * 4)}) rotate(${(random(`lr${i}`) - 0.5) * 40}deg)` }}>{icons[i % icons.length]}</div>;
      })}
      {dt >= 0 && (
        <div style={{ position: "absolute", right: 60, top: isVo(s) ? 700 : 1200, padding: "12px 26px", borderRadius: 30, ...dark, fontFamily: STK, fontSize: 52, color: "#fff",
          transform: `scale(${pop(t, on, 260, 13)})` }}>{icons[0]} {vnd(count * ramp(t, on, 1.6))}</div>
      )}
    </Over>
  );
};

/* ===== calendar-flip ===== cues: on, done · params: from (1), to (30), label (month / note ≤ 14) */
export const CalendarFlip: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), done = cue(c, "done", on + 1.6), from: number = p.from ?? 1, to: number = p.to ?? 30;
  const k = ramp(t, on + 0.2, Math.max(0.3, done - on - 0.2)), day = Math.round(from + (to - from) * k), y = place(s, 340, "top");
  const flick = (t * 20) % 1;
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 340, top: y, width: 400, height: 340, borderRadius: 30, background: "#fff", overflow: "hidden", boxShadow: "0 24px 50px rgba(0,0,0,.4)",
          transform: `rotate(-3deg) scale(${pop(t, on, 240, 13)})` }}>
          <div style={{ height: 96, background: "#E53935", color: "#fff", display: "grid", placeItems: "center", fontFamily: BVP, fontWeight: 900, fontSize: 40, letterSpacing: "0.1em" }}>{p.label ?? "NGÀY"}</div>
          <div style={{ height: 244, display: "grid", placeItems: "center", fontFamily: STK, fontSize: 170, color: C.ink, transform: `scaleY(${k < 1 ? 0.75 + 0.25 * flick : 1})` }}>{day}</div>
          {k >= 1 && <svg width={400} height={340} style={{ position: "absolute", inset: 0 }}><ellipse cx={200} cy={218} rx={130} ry={96} fill="none" stroke={INK.orange} strokeWidth={9}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ramp(t, done, 0.35)} transform="rotate(-6 200 218)" /></svg>}
        </div>
      )}
    </Over>
  );
};

/* ===== scoreboard ===== cues: on, done · params: value (text of digits, e.g. "12.400"), label (≤ 20) */
export const Scoreboard: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), done = cue(c, "done", on + 1.4), val: string = String(p.value ?? "12.400");
  const chars = val.split(""), cw = Math.min(110, 900 / chars.length), y = place(s, cw * 1.5 + 70, "top");
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transform: `scale(${0.85 + 0.15 * pop(t, on)})` }}>
          {p.label && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: "0.3em", color: "#FFD9BF" }}>{p.label}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            {chars.map((ch, i) => {
              const lockT = on + (done - on) * ((i + 1) / chars.length), locked = t >= lockT || !/\d/.test(ch);
              const shown = locked ? ch : String(Math.floor(random(`sb${i}-${Math.floor(t * 18)}`) * 10));
              return /\d/.test(ch) ? (
                <div key={i} style={{ position: "relative", width: cw, height: cw * 1.4, borderRadius: 12, background: "linear-gradient(180deg,#24262E 0 49%,#111318 51% 100%)", display: "grid", placeItems: "center",
                  fontFamily: STK, fontSize: cw * 1.05, color: locked ? "#FFC83D" : "#fff", boxShadow: "0 10px 20px rgba(0,0,0,.4)" }}>
                  {shown}<div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 3, background: "#000" }} />
                </div>
              ) : <div key={i} style={{ alignSelf: "flex-end", fontFamily: STK, fontSize: cw, color: "#fff", width: cw * 0.4, textAlign: "center" }}>{ch}</div>;
            })}
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== rec-frame ===== cues: on · params: label (≤ 14, e.g. "4K · 30FPS") */
export const RecFrame: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), k = ramp(t, on, 0.25), secs = Math.max(0, t - on);
  const tc = `00:${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(Math.floor(secs % 60)).padStart(2, "0")}:${String(Math.floor((secs * FPS) % FPS)).padStart(2, "0")}`;
  const L = 110, W = 8, m = 60 + 40 * (1 - k), col = "rgba(255,255,255,.92)";
  const corner = (st: React.CSSProperties) => <div style={{ position: "absolute", width: L, height: L, ...st }} />;
  return (
    <Over s={s}>
      {t >= on && (
        <AbsoluteFill style={{ opacity: k, fontFamily: MONO, fontWeight: 700, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,.6)" }}>
          {corner({ left: m, top: m + 40, borderLeft: `${W}px solid ${col}`, borderTop: `${W}px solid ${col}` })}
          {corner({ right: m, top: m + 40, borderRight: `${W}px solid ${col}`, borderTop: `${W}px solid ${col}` })}
          {corner({ left: m, bottom: m + 340, borderLeft: `${W}px solid ${col}`, borderBottom: `${W}px solid ${col}` })}
          {corner({ right: m, bottom: m + 340, borderRight: `${W}px solid ${col}`, borderBottom: `${W}px solid ${col}` })}
          <div style={{ position: "absolute", left: m + 30, top: m + 70, display: "flex", alignItems: "center", gap: 14, fontSize: 40 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: "#FF3B30", opacity: Math.floor(t * 2) % 2 ? 0.2 : 1 }} />REC
          </div>
          <div style={{ position: "absolute", right: m + 30, top: m + 70, fontSize: 36 }}>{tc}</div>
          <div style={{ position: "absolute", left: m + 30, bottom: m + 370, fontSize: 30 }}>{p.label ?? "4K · 30FPS"}</div>
          <div style={{ position: "absolute", right: m + 30, bottom: m + 370, fontSize: 30 }}>▮▮▮▯ 78%</div>
        </AbsoluteFill>
      )}
    </Over>
  );
};

/* ===== glitch-cut ===== cues: hit · params: none — an RGB-split, sliced glitch for ~0.4 s at the cue (works as a cut accent) */
const Channel: React.FC<{ s: FxProps["s"]; id: string; dx: number }> = ({ s, id, dx }) => (
  s.src ? <OffthreadVideo src={staticFile(s.src)} trimBefore={Math.round(s.in * FPS)} muted
    style={{ position: "absolute", left: dx, top: 0, width: 1080, height: 1920, filter: `url(#${id})`, mixBlendMode: "screen" }} /> : null
);
export const GlitchCut: React.FC<FxProps> = ({ t, s, c }) => {
  const hit = cue(c, "hit", on0(c, s)), dt = t - hit, active = dt >= 0 && dt < 0.4;
  const f = useCurrentFrame(), amt = active ? 26 * (1 - dt / 0.4) * (0.5 + random(`g${f}`)) : 0;
  if (!active) return <Vid s={s} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="gr"><feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id="gg"><feColorMatrix values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id="gb"><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" /></filter>
      </svg>
      {s.src ? <><Channel s={s} id="gr" dx={-amt} /><Channel s={s} id="gg" dx={0} /><Channel s={s} id="gb" dx={amt} /></> : <Vid s={s} />}
      {Array.from({ length: 6 }, (_, i) => {
        const y = random(`gy${f}-${i}`) * 1920, h = 20 + random(`gh${f}-${i}`) * 90;
        return <div key={i} style={{ position: "absolute", left: 0, right: 0, top: y, height: h, background: i % 2 ? "rgba(255,0,80,.25)" : "rgba(0,220,255,.22)",
          transform: `translateX(${(random(`gx${f}-${i}`) - 0.5) * 120}px)`, mixBlendMode: "screen" }} />;
      })}
    </AbsoluteFill>
  );
};

/* ===== film-grain ===== cues: on · params: stamp (date stamp text, optional, e.g. "02 11 2026") */
export const FilmGrain: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), k = ramp(t, on, 0.5), g = Math.floor(t * 24);
  return (
    <AbsoluteFill>
      <Vid s={s} style={{ filter: `sepia(${0.35 * k}) saturate(${1 - 0.2 * k}) contrast(${1 + 0.08 * k}) brightness(${1 - 0.04 * k})` }} />
      <AbsoluteFill style={{ opacity: 0.22 * k, backgroundImage: "radial-gradient(rgba(255,255,255,.55) 1px, transparent 1.6px)", backgroundSize: "4px 4px",
        backgroundPosition: `${random(`fx${g}`) * 4}px ${random(`fy${g}`) * 4}px`, mixBlendMode: "overlay" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(40,20,0,.55) 100%)", opacity: k }} />
      {p.stamp && <div style={{ position: "absolute", right: 70, bottom: 520, fontFamily: MONO, fontWeight: 700, fontSize: 40, color: "#FF9A3C", textShadow: "0 0 8px rgba(255,120,30,.7)", opacity: k }}>{p.stamp}</div>}
    </AbsoluteFill>
  );
};

/* ===== name-bar ===== cues: on · params: name (≤ 20), role (≤ 30) */
export const NameBar: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), bar = ramp(t, on, 0.25), slide = pop(t, on + 0.2, 200, 16), y = place(s, 170);
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 90, top: y, height: 170, display: "flex", alignItems: "stretch", gap: 22 }}>
          <div style={{ width: 14, borderRadius: 7, background: INK.orange, transform: `scaleY(${bar})`, transformOrigin: "top", boxShadow: "0 0 18px rgba(255,122,26,.7)" }} />
          <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ transform: `translateX(${(slide - 1) * 600}px)` }}>
              <div style={{ fontFamily: STK, fontSize: fitSize(p.name ?? "", 84, 820), color: "#fff", textShadow: "0 4px 0 #0F1E46, 0 0 18px rgba(0,0,0,.5)", whiteSpace: "nowrap" }}>{p.name ?? "Tên của bạn"}</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: "#FFD9BF", letterSpacing: "0.12em", opacity: ramp(t, on + 0.5, 0.25), whiteSpace: "nowrap" }}>{p.role ?? "Nhà sáng tạo nội dung"}</div>
            </div>
          </div>
        </div>
      )}
    </Over>
  );
};

/* ===== news-ticker ===== cues: on · params: tag (≤ 8, "LIVE"), headline (≤ 34), ticker (one long line) */
export const NewsTicker: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), y = isVo(s) ? 720 : 1180, k = pop(t, on, 200, 16);
  const ticker: string = p.ticker ?? "Tin nóng • Cập nhật liên tục • ";
  const line = `${ticker}   •   ${ticker}   •   ${ticker}`, x = -((t - on) * 160) % 900;
  return (
    <Over s={s}>
      {t >= on && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: `translateX(${(1 - k) * -1100}px)` }}>
          <div style={{ display: "flex", alignItems: "stretch", margin: "0 40px", height: 110, borderRadius: "18px 18px 0 0", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,.4)" }}>
            <div style={{ background: "#E53935", color: "#fff", fontFamily: STK, fontSize: 44, display: "flex", alignItems: "center", gap: 10, padding: "0 24px" }}>
              <span style={{ opacity: Math.floor(t * 2) % 2 ? 0.3 : 1 }}>●</span>{p.tag ?? "LIVE"}
            </div>
            <div style={{ flex: 1, background: "#fff", display: "flex", alignItems: "center", padding: "0 24px", fontFamily: BVP, fontWeight: 900, fontSize: fitSize(p.headline ?? "", 44, 1100), color: C.ink, whiteSpace: "nowrap" }}>{p.headline ?? "Tiêu đề tin"}</div>
          </div>
          <div style={{ margin: "0 40px", height: 60, background: "#0F1E46", borderRadius: "0 0 18px 18px", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div style={{ whiteSpace: "nowrap", fontFamily: BVP, fontWeight: 700, fontSize: 30, color: "#fff", transform: `translateX(${x}px)` }}>{line}</div>
          </div>
        </div>
      )}
    </Over>
  );
};

export const FX3: Record<string, React.FC<FxProps>> = {
  typewriter: Typewriter, "word-slam": WordSlam, "kinetic-pop": KineticPop, "arrow-doodle": ArrowDoodle, "cross-out": CrossOut,
  "check-stamp": CheckStamp, "price-tag": PriceTag, "progress-bar": ProgressBar, "glass-pie": GlassPie, "glass-compare": GlassCompare,
  "glass-quote": GlassQuote, "chat-bubble": ChatBubble, "search-bar": SearchBar, "bank-notify": BankNotify, "like-burst": LikeBurst,
  "calendar-flip": CalendarFlip, scoreboard: Scoreboard, "rec-frame": RecFrame, "glitch-cut": GlitchCut, "film-grain": FilmGrain,
  "name-bar": NameBar, "news-ticker": NewsTicker,
};
