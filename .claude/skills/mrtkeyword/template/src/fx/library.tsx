import React from "react";
import { AbsoluteFill, Freeze, Img, random, staticFile } from "remotion";
import { CREAM, HalfCard, ORANGE_BG } from "../kit2";
import { BVP, C, FPS, INK, MONT, STK, Sticker, life, pop, ramp } from "../ui";
import { FX2 } from "./library2";
import { FX3 } from "./library3";
import { CmdPill, FxProps, HEAD, Matte, OrangeBg, Out, VO_SHIFT, Vid, cue, fitSize, headAt, isVo } from "./common";

/* The keyword effects. Each reads its cue times from `c` (names listed in keywords.json → "cues") and its
   content from `p` (keywords.json → "params"). Missing cues fall back to sensible offsets from c.on /
   the segment start, missing params to neutral defaults, so a sparse plan still renders. */

const on0 = (c: Record<string, number>, s: { start: number }) => cue(c, "on", s.start + 0.3);
const half = (s: FxProps["s"], bg: string, children: React.ReactNode) => isVo(s) ? (
  <AbsoluteFill style={{ background: bg }}>
    <AbsoluteFill style={{ transform: `translateY(${VO_SHIFT}px) scale(1.1)`, transformOrigin: "540px 320px" }}>{children}</AbsoluteFill>
  </AbsoluteFill>
) : (
  <HalfCard src={s.src!} trim={s.in} matte={`matte_${s.id}.webm`} head={HEAD[s.id]} shift={520} bg={bg}>{children}</HalfCard>
);
/** two-tone title shown in the upper area of a half-card scene until its main card appears */
const HalfTitle: React.FC<{ t: number; t0: number; t1: number; a: string; b: string }> = ({ t, t0, t1, a, b }) => {
  if (t < t0 || t >= t1) return null;
  const size = fitSize(`${a} ${b}`, 120, 940);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", transform: `scale(${pop(t, t0)}) rotate(-3deg)` }}>
      <Out size={size}>{a} <span style={{ color: INK.yellow }}>{b}</span></Out>
    </div>
  );
};
const glass: React.CSSProperties = {
  background: "linear-gradient(150deg, rgba(255,255,255,.42), rgba(255,255,255,.14))", border: "3px solid rgba(255,255,255,.65)",
  backdropFilter: "blur(18px)", boxShadow: "0 30px 60px rgba(120,50,0,.25), inset 0 1px 0 rgba(255,255,255,.8)",
};

/* ===== text-behind ===== cues: on, w2, w3 · params: rows [[top, bottom], …] (one pair per cue), shift */
export const TextBehind: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s);
  if (t < on) return <Vid s={s} />;
  const rows: string[][] = p.rows ?? [["TEXT", "BEHIND"]];
  const times = [on, c.w2, c.w3].filter((x) => typeof x === "number").slice(0, rows.length);
  const k = Math.max(0, times.filter((x) => t >= x).length - 1);
  const [l1, l2] = rows[k], t0 = times[k];
  const a = pop(t, t0, 170, 15), b = pop(t, t0 + 0.12, 170, 15);
  return (
    <AbsoluteFill>
      <OrangeBg t={t} />
      {/* the second line runs into the head, so the matte drawn on top makes it read as "behind" */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Out size={fitSize(l1, 240)} style={{ transform: `translateX(${(1 - a) * -900}px)` }}>{l1}</Out>
        <Out size={fitSize(l2 ?? "", 200)} fill={INK.yellow} style={{ marginTop: 6, transform: `translateX(${(1 - b) * 900}px)` }}>{l2}</Out>
      </div>
      <Matte s={s} style={{ top: p.shift ?? 200 }} />
    </AbsoluteFill>
  );
};

/* ===== locked-on ===== cues: on, lock · params: label */
export const LockedOn: React.FC<FxProps> = ({ t, s, c, p, z }) => {
  const h = headAt(s.id, z), on = on0(c, s), lockT = cue(c, "lock", on + 1.2);
  const close = ramp(t, on, lockT - on), locked = t >= lockT;
  const m = 20 + 160 * (1 - close), col = locked ? "#FF3B30" : "#FFFFFF";
  const pulse = locked ? 1 + 0.06 * Math.max(0, 1 - (t - lockT) * 4) : 1;
  const L = 90, W = 10;
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <div style={{ position: "absolute", left: x - (sx < 0 ? L : 0), top: y - (sy < 0 ? L : 0), width: L, height: L,
      borderLeft: sx > 0 ? `${W}px solid ${col}` : undefined, borderRight: sx < 0 ? `${W}px solid ${col}` : undefined,
      borderTop: sy > 0 ? `${W}px solid ${col}` : undefined, borderBottom: sy < 0 ? `${W}px solid ${col}` : undefined,
      filter: `drop-shadow(0 0 ${locked ? 14 : 6}px ${col})` }} />
  );
  const x0 = h.x0 - m, x1 = h.x1 + m, y0 = h.y0 - m, y1 = h.y1 + m;
  return (
    <AbsoluteFill>
      <Vid s={s} z={z} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 35%, transparent 45%, rgba(0,0,0,.45) 100%)" }} />
      {t >= on && (
        <AbsoluteFill style={{ opacity: ramp(t, on, 0.15), transform: `scale(${pulse})`, transformOrigin: `${(x0 + x1) / 2}px ${(y0 + y1) / 2}px` }}>
          {corner(x0, y0, 1, 1)}{corner(x1, y0, -1, 1)}{corner(x0, y1, 1, -1)}{corner(x1, y1, -1, -1)}
        </AbsoluteFill>
      )}
      {locked && (
        <div style={{ position: "absolute", left: Math.max(40, x0 + 100), top: Math.max(70, y0 - 78), padding: "8px 18px", background: "#FF3B30", color: "#fff",
          fontFamily: "Consolas, monospace", fontWeight: 700, fontSize: 40, letterSpacing: 3, transform: `scale(${pop(t, lockT, 300, 14)})`, transformOrigin: "left center" }}>
          ● {p.label ?? "LOCKED ON"}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ===== scribble ===== cues: ring, arrow */
export const Scribble: React.FC<FxProps> = ({ t, s, c, z }) => {
  const h = headAt(s.id, z), ringT = cue(c, "ring", on0(c, s)), arrowT = cue(c, "arrow", ringT + 1.0);
  const cx = (h.x0 + h.x1) / 2, cy = (h.y0 + h.y1) / 2, rx = (h.x1 - h.x0) / 2 + 45, ry = (h.y1 - h.y0) / 2 + 40;
  const pts: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -Math.PI / 2 + (i / 64) * Math.PI * 2.15;
    const w = 1 + 0.04 * Math.sin(i * 1.7) + 0.03 * (random(`r${i}`) - 0.5);
    pts.push(`${i ? "L" : "M"} ${cx + Math.cos(a) * rx * w} ${cy + Math.sin(a) * ry * w}`);
  }
  const ring = ramp(t, ringT, 0.55), arrow = ramp(t, arrowT, 0.35);
  return (
    <AbsoluteFill>
      <Vid s={s} z={z} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {t >= ringT && <path d={pts.join(" ")} fill="none" stroke="#FF2E88" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} style={{ filter: "drop-shadow(0 4px 0 rgba(0,0,0,.35))" }} />}
        {t >= arrowT && (
          <g fill="none" stroke={INK.yellow} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 4px 0 rgba(15,30,70,.8))" }}>
            <path d={`M 1040 ${cy + 200} C 1000 ${cy + 80}, 960 ${cy + 20}, ${h.x1 + 30} ${cy + 10}`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arrow} />
            {arrow >= 1 && <path d={`M ${h.x1 + 70} ${cy - 25} L ${h.x1 + 27} ${cy + 10} L ${h.x1 + 75} ${cy + 40}`} />}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/* ===== glass-graph ===== cues: card, run · params: title [a,b], label, value, unit, delta, bars */
export const GlassGraph: React.FC<FxProps> = ({ t, s, c, p }) => {
  const cardT = cue(c, "card", s.start + 1.2), runT = cue(c, "run", cardT + 0.8);
  const bars: number[] = p.bars ?? [22, 30, 27, 41, 48, 57, 70, 100];
  const grow = (i: number) => pop(t, runT - 0.4 + i * 0.09, 120, 16);
  const n = Math.round((p.value ?? 650) * ramp(t, runT, 1.4));
  const [ta, tb] = p.title ?? ["GLASS", "GRAPH"];
  return half(s, ORANGE_BG, <>
    <HalfTitle t={t} t0={s.start + 0.15} t1={cardT} a={ta} b={tb} />
    {t >= cardT && (
      <div style={{ position: "absolute", left: 90, top: 130, width: 900, height: 400, borderRadius: 44, padding: "30px 44px", ...glass,
        transform: `scale(${0.85 + 0.15 * pop(t, cardT)})`, opacity: Math.min(1, pop(t, cardT) * 1.5) }}>
        <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 32, letterSpacing: "0.2em", color: INK.navy }}>{p.label ?? "DOANH THU / THÁNG"}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
          <div style={{ fontFamily: STK, fontSize: 116, color: "#fff", lineHeight: 1, textShadow: `0 6px 0 ${INK.navy}` }}>{n.toLocaleString("de-DE")}</div>
          <div style={{ fontFamily: STK, fontSize: 56, color: INK.navy }}>{p.unit ?? "TRIỆU"}</div>
          {p.delta && <div style={{ marginLeft: "auto", fontFamily: BVP, fontWeight: 900, fontSize: 36, color: "#fff", background: C.green, borderRadius: 20, padding: "6px 18px",
            opacity: ramp(t, runT + 1.2, 0.2) }}>{p.delta}</div>}
        </div>
        <div style={{ position: "absolute", left: 44, right: 44, bottom: 30, height: 150, display: "flex", alignItems: "flex-end", gap: 22 }}>
          {bars.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${v * grow(i)}%`, borderRadius: "14px 14px 6px 6px",
              background: i === bars.length - 1 ? `linear-gradient(180deg, #7CF29A, ${C.green})` : "rgba(255,255,255,.75)" }} />
          ))}
        </div>
      </div>
    )}
  </>);
};

/* ===== reel-orbit ===== cues: on · params: thumbs (clip ids under public/thumbs) */
export const ReelOrbit: React.FC<FxProps> = ({ t, s, c, p }) => {
  const ids: string[] = p.thumbs ?? [];
  const intro = pop(t, on0(c, s) - 0.1, 90, 14);
  const cards = ids.map((id, i) => {
    const a = (t - s.start) * 1.15 + (i / Math.max(1, ids.length)) * Math.PI * 2, depth = Math.sin(a);
    return { id, i, depth, x: 540 + Math.cos(a) * 430 * intro, y: 850 + depth * 320 * intro, sc: 0.7 + 0.35 * (depth + 1) / 2 };
  });
  const card = (q: (typeof cards)[number]) => (
    <div key={q.i} style={{ position: "absolute", left: q.x - 75, top: q.y - 133, width: 150, height: 266, borderRadius: 18, overflow: "hidden",
      border: "5px solid #fff", boxShadow: "0 16px 34px rgba(0,0,0,.35)", transform: `scale(${q.sc * intro})`, opacity: 0.6 + 0.4 * (q.depth + 1) / 2 }}>
      <Img src={staticFile(`thumbs/${q.id}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
  return (
    <AbsoluteFill>
      <OrangeBg t={t} />
      {cards.filter((q) => q.depth < 0).map(card)}
      <Matte s={s} />
      {cards.filter((q) => q.depth >= 0).map(card)}
    </AbsoluteFill>
  );
};

/* ===== match-cut ===== cues: on, box · params: masthead, sub, word */
export const MatchCut: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), boxT = cue(c, "box", on + 1.5);
  if (t < on) return <Vid s={s} />;
  const lines = (n: number, seed: string) => Array.from({ length: n }, (_, i) => (
    <div key={i} style={{ height: 14, margin: "14px 0", background: "#A9A39A", width: `${70 + random(`${seed}${i}`) * 30}%`, borderRadius: 3 }} />
  ));
  const box = ramp(t, boxT, 0.35);
  return (
    <AbsoluteFill style={{ background: "#F2ECDF" }}>
      <div style={{ position: "absolute", left: 40, right: 40, top: 50, height: 165, borderTop: "6px solid #1d1d1d", borderBottom: "3px solid #1d1d1d", textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900, fontSize: fitSize(p.masthead ?? "THE AI TIMES", 92, 1180), color: "#111", letterSpacing: 2, marginTop: 4, whiteSpace: "nowrap" }}>{p.masthead ?? "THE AI TIMES"}</div>
        <div style={{ fontFamily: MONT, fontWeight: 600, fontSize: 24, color: "#444", letterSpacing: "0.25em" }}>{p.sub ?? "SỐ ĐẶC BIỆT"}</div>
      </div>
      <div style={{ position: "absolute", left: 30, top: 270, width: 185 }}>{lines(28, "l")}</div>
      <div style={{ position: "absolute", left: 800, top: 270, width: 250 }}>
        {lines(10, "r")}
        <div style={{ position: "relative", margin: "18px 0", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: fitSize(p.word ?? "TỪ KHOÁ", 40, 300), color: "#111", textAlign: "center", whiteSpace: "nowrap" }}>
          {p.word ?? "TỪ KHOÁ"}
          {t >= boxT && (
            <svg width={260} height={110} style={{ position: "absolute", left: -10, top: -22, overflow: "visible" }}>
              <path d="M 12 18 L 246 10 L 250 92 L 8 98 Z" fill="none" stroke="#E0201B" strokeWidth={9} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - box} />
            </svg>
          )}
        </div>
        {lines(14, "q")}
      </div>
      {isVo(s) ? (
        <div style={{ position: "absolute", left: 250, top: 300, width: 520, color: "#111" }}>
          {/* Georgia breaks stacked Vietnamese marks → headline in Be Vietnam Pro */}
          <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 64, lineHeight: 1.12, opacity: ramp(t, on + 0.2, 0.3) }}>{p.headline}</div>
          <div style={{ marginTop: 26, height: 560, background: "#D9D2C4", display: "grid", placeItems: "center", fontSize: 150, opacity: ramp(t, on + 0.4, 0.3) }}>{p.icon ?? "📰"}</div>
        </div>
      ) : <Matte s={s} />}
    </AbsoluteFill>
  );
};

/* ===== task-list ===== cues: list, tick · params: title, items */
export const TaskList: React.FC<FxProps> = ({ t, s, c, p }) => {
  const listT = cue(c, "list", s.start + 1.0), tickT = cue(c, "tick", listT + 1.0);
  const items: string[] = p.items ?? ["Việc 1", "Việc 2", "Việc 3", "Việc 4"];
  return half(s, CREAM, t >= listT && (
    <div style={{ position: "absolute", left: 110, top: 110, width: 860, height: 420, borderRadius: 36, background: "#fff", padding: "28px 44px",
      boxShadow: "0 24px 50px rgba(150,70,10,.18)", transform: `scale(${0.85 + 0.15 * pop(t, listT)})` }}>
      <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 46, color: C.ink }}>📋 {p.title ?? "VIỆC HÔM NAY"}</div>
      {items.slice(0, 4).map((it, i) => {
        const tick = t >= tickT + i * 0.28, ap = pop(t, listT + 0.1 + i * 0.12, 260, 16);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 18, opacity: ap, transform: `translateX(${(1 - ap) * 60}px)` }}>
            <div style={{ width: 58, height: 58, borderRadius: 14, border: `5px solid ${tick ? C.green : "#C9C9C9"}`, background: tick ? C.green : "#fff",
              display: "grid", placeItems: "center", color: "#fff", fontSize: 40, fontWeight: 900 }}>{tick ? "✓" : ""}</div>
            <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 42, color: tick ? "#9A9A9A" : C.ink, textDecoration: tick ? "line-through" : "none", whiteSpace: "nowrap" }}>{it}</div>
          </div>
        );
      })}
    </div>
  ));
};

/* ===== messages ===== cues: n1, n2, n3 · params: notes [{app, mark, bg, msg}] */
export const Messages: React.FC<FxProps> = ({ t, s, c, p }) => {
  const notes: any[] = p.notes ?? [{ app: "Claude", mark: "✳", bg: C.claude, msg: "Video đã dựng xong ✅" }];
  const base = on0(c, s);
  const times = notes.map((_, i) => cue(c, `n${i + 1}`, base + i * 1.2));
  return (
    <AbsoluteFill>
      <Vid s={s} />
      {notes.map((n, i) => {
        // over a speaker one banner at a time slides in at the top; on a voice-over they stack in the middle
        const vo = isVo(s), t0 = times[i], t1 = !vo && i + 1 < notes.length ? times[i + 1] : s.end + 0.12;
        if (t < t0 || t > t1) return null;
        const inn = pop(t, t0, 200, 18), out = vo ? 0 : ramp(t, t1 - 0.18, 0.18);
        const top = vo ? 520 + i * 200 + (1 - inn) * 120 : 70 + (inn - 1) * 220 - out * 220;
        return (
          <div key={i} style={{ position: "absolute", left: 90, top, opacity: vo ? Math.min(1, inn * 1.5) : 1, width: 900, height: 165, borderRadius: 40,
            background: "rgba(245,245,247,.94)", boxShadow: "0 18px 40px rgba(0,0,0,.35)", display: "flex", alignItems: "center", gap: 26, padding: "0 30px" }}>
            <div style={{ width: 100, height: 100, borderRadius: 24, background: n.bg ?? INK.blue, color: "#fff", display: "grid", placeItems: "center", fontFamily: STK, fontSize: 54 }}>{n.mark ?? n.app?.[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", fontFamily: BVP, fontWeight: 600, fontSize: 30, color: "#666" }}>{String(n.app).toUpperCase()}<span style={{ marginLeft: "auto" }}>bây giờ</span></div>
              <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 40, color: C.ink, marginTop: 4, whiteSpace: "nowrap" }}>{n.msg}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ===== led-sign ===== cues: on, bright, swap · params: text, text2 */
export const LedSign: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), bright = cue(c, "bright", on + 0.8), swap = cue(c, "swap", 1e9);
  const dim = ramp(t, on - 0.6, 0.4);
  const flick = t < on ? 0 : t < on + 0.45 ? (random(`f${Math.floor(t * 18)}`) > 0.45 ? 0.9 : 0.15) : 1;
  const glow = t >= bright ? 1 : 0.7;
  const text = t >= swap && p.text2 ? p.text2 : p.text ?? "AI LÀM HẾT";
  return (
    <AbsoluteFill>
      <Vid s={s} style={{ filter: `brightness(${1 - 0.45 * dim}) saturate(${1 - 0.3 * dim})` }} />
      {t >= on - 0.05 && (
        <div style={{ position: "absolute", left: 90, top: isVo(s) ? 110 + VO_SHIFT : 110, width: 900, height: 240, borderRadius: 26, background: "#140C04", border: "6px solid #3A2A18",
          boxShadow: `0 0 ${60 * glow * flick}px rgba(255,170,40,${0.55 * flick}), 0 20px 40px rgba(0,0,0,.6)`, display: "grid", placeItems: "center", overflow: "hidden",
          transform: `scale(${0.9 + 0.1 * pop(t, on - 0.05)})` }}>
          <div style={{ fontFamily: STK, fontSize: fitSize(text, 124, 820), letterSpacing: 4, whiteSpace: "nowrap", color: "#FFB52E", opacity: flick,
            textShadow: `0 0 ${18 * glow}px #FF9F1A, 0 0 ${46 * glow}px #FF7A00` }}>{text}</div>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, transparent 45%, #140C04 62%)", backgroundSize: "14px 14px" }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ===== edit-timeline ===== cues: on, panel · params: caps */
export const EditTimeline: React.FC<FxProps> = ({ t, s, c, p }) => {
  const on = on0(c, s), panelT = cue(c, "panel", on + 1.2);
  if (t < on) return <Vid s={s} />;
  const k = pop(t, on, 150, 18), sc = 1 - 0.5 * k, panel = pop(t, panelT, 170, 17);
  const ph = ramp(t, panelT, s.end - panelT);
  const caps: string[] = p.caps ?? ["Đoạn 1", "Đoạn 2", "Đoạn 3"];
  const thumbs: string[] = p.thumbs ?? [];
  return (
    <AbsoluteFill style={{ background: "#141417" }}>
      <div style={{ position: "absolute", left: 30, top: 90, width: 220, height: 960, borderRadius: 24, background: "#1E1E23", opacity: k, transform: `translateX(${(1 - k) * -260}px)`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 26, paddingTop: 40 }}>
        {["✂", "T", "♪", "✦", "◐", "⤢"].map((ic, i) => (
          <div key={i} style={{ width: 120, height: 120, borderRadius: 26, background: i === 1 ? C.claude : "#2A2A31", color: "#fff", display: "grid", placeItems: "center", fontSize: 58, fontFamily: BVP, fontWeight: 900 }}>{ic}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 830, top: 90, width: 220, height: 960, borderRadius: 24, background: "#1E1E23", opacity: k, transform: `translateX(${(1 - k) * 260}px)`, padding: 22 }}>
        {[["Scale", "100%"], ["Opacity", "100"], ["Font", "Mont"], ["Size", "64"], ["Speed", "1.0x"]].map(([a, b], i) => (
          <div key={i} style={{ marginBottom: 30 }}>
            <div style={{ fontFamily: MONT, fontWeight: 600, fontSize: 24, color: "#8B8B96" }}>{a}</div>
            <div style={{ marginTop: 8, height: 54, borderRadius: 12, background: "#2A2A31", color: "#fff", fontFamily: BVP, fontWeight: 800, fontSize: 30, display: "flex", alignItems: "center", paddingLeft: 16 }}>{b}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 270 * k, top: 90 * k, width: 1080 * sc, height: 1920 * sc, borderRadius: 24 * k, overflow: "hidden", border: `${4 * k}px solid #33333B` }}>
        <Vid s={s} style={{ transform: `scale(${sc})`, transformOrigin: "0 0" }} />
        <div style={{ position: "absolute", left: 20, top: 20, fontFamily: "Consolas, monospace", fontSize: 30, color: "#fff", opacity: k }}>
          <span style={{ color: "#FF3B30" }}>● REC</span> 00:00:{String(Math.floor(t - s.start)).padStart(2, "0")}
        </div>
      </div>
      {t >= panelT && (
        <div style={{ position: "absolute", left: 40, top: 1080, width: 1000, height: 320, borderRadius: 24, background: "#1E1E23", overflow: "hidden", transform: `translateY(${(1 - panel) * 380}px)` }}>
          <div style={{ height: 40 }} />
          {[
            { tag: "V1", node: <div style={{ display: "flex", gap: 4 }}>{thumbs.map((id) => <Img key={id} src={staticFile(`thumbs/${id}.jpg`)} style={{ width: 92, height: 76, objectFit: "cover", borderRadius: 6 }} />)}</div> },
            { tag: "A1", node: <div style={{ display: "flex", alignItems: "center", gap: 3, height: 70 }}>{Array.from({ length: 150 }, (_, i) => <div key={i} style={{ width: 3, height: 10 + 56 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11)), background: "#3DDC84", borderRadius: 2 }} />)}</div> },
            { tag: "T1", node: <div style={{ display: "flex", gap: 8 }}>{caps.map((x, i) => <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "#7C4DFF", color: "#fff", fontFamily: BVP, fontWeight: 800, fontSize: 24, whiteSpace: "nowrap", opacity: ph > i / caps.length ? 1 : 0.25 }}>{x}</div>)}</div> },
          ].map((r) => (
            <div key={r.tag} style={{ display: "flex", alignItems: "center", height: 90, borderTop: "1px solid #2E2E36" }}>
              <div style={{ width: 80, textAlign: "center", fontFamily: MONT, fontWeight: 800, fontSize: 26, color: "#8B8B96" }}>{r.tag}</div>
              <div style={{ flex: 1, overflow: "hidden" }}>{r.node}</div>
            </div>
          ))}
          <div style={{ position: "absolute", left: 80 + ph * 900, top: 34, bottom: 0, width: 4, background: "#FF3B30" }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ===== face-scan ===== cues: mesh, panel · params: rows [[label, value]] */
export const FaceScan: React.FC<FxProps> = ({ t, s, c, p }) => {
  const h = headAt(s.id, 1), meshT = cue(c, "mesh", on0(c, s)), panelT = cue(c, "panel", meshT + 0.8);
  const sweep = ((t - meshT) * 0.9) % 1;
  const cx = (h.x0 + h.x1) / 2, cy = (h.y0 + h.y1) / 2, rx = (h.x1 - h.x0) / 2, ry = (h.y1 - h.y0) / 2;
  const grid: React.ReactNode[] = [];
  for (let i = 1; i < 9; i++) {
    const y = h.y0 + ((h.y1 - h.y0) * i) / 9, x = h.x0 + ((h.x1 - h.x0) * i) / 9;
    grid.push(<line key={`h${i}`} x1={h.x0} y1={y} x2={h.x1} y2={y} />, <line key={`v${i}`} x1={x} y1={h.y0} x2={x} y2={h.y1} />);
  }
  const rows: string[][] = p.rows ?? [["FACE ID", "ĐÃ KHỚP ✓"], ["ĐỘ TỰ TIN", "98.7%"], ["CẢM XÚC", "HÀO HỨNG"]];
  return (
    <AbsoluteFill>
      <Vid s={s} />
      {t >= meshT - 0.1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: life(t, meshT - 0.1, s.end + 0.1, 0.2, 0.2) }}>
          <defs><clipPath id="fc"><ellipse cx={cx} cy={cy} rx={rx} ry={ry} /></clipPath></defs>
          <g clipPath="url(#fc)" stroke="#38E1FF" strokeWidth={1.5} opacity={0.35}>{grid}</g>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#38E1FF" strokeWidth={4} strokeDasharray="14 10" opacity={0.8} />
          <rect clipPath="url(#fc)" x={h.x0} y={h.y0 + (h.y1 - h.y0) * sweep - 6} width={h.x1 - h.x0} height={12} fill="#38E1FF" opacity={0.55} />
        </svg>
      )}
      {t >= panelT && (
        <div style={{ position: "absolute", left: 70, top: h.y1 + 50, width: 520, padding: "22px 28px", borderRadius: 22, background: "rgba(5,20,30,.78)",
          border: "2px solid #38E1FF", transform: `translateX(${(1 - pop(t, panelT, 200, 16)) * -600}px)` }}>
          {rows.map(([a, b], i) => (
            <div key={a} style={{ display: "flex", justifyContent: "space-between", fontFamily: "Consolas, monospace", fontSize: 32, color: "#BFF6FF", marginTop: i ? 10 : 0,
              opacity: ramp(t, panelT + 0.2 + i * 0.25, 0.15) }}><span>{a}</span><b style={{ color: "#38E1FF" }}>{b}</b></div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ===== neon-outline ===== cues: on, dark */
export const NeonOutline: React.FC<FxProps> = ({ t, s, c }) => {
  const onT = on0(c, s), on = ramp(t, onT - 0.1, 0.35), dark = ramp(t, cue(c, "dark", onT + 1.5) - 0.2, 0.5);
  const pulse = 0.85 + 0.15 * Math.sin(t * 9);
  return (
    <AbsoluteFill style={{ background: "#05060F" }}>
      <Vid s={s} style={{ filter: `brightness(${1 - 0.55 * on - 0.38 * dark}) saturate(${1 - 0.5 * on})` }} />
      {on > 0 && <Matte s={s} style={{ filter: `drop-shadow(0 0 ${6 * on}px #38E1FF) drop-shadow(0 0 ${18 * on * pulse}px #38E1FF) drop-shadow(0 0 ${36 * on * pulse}px #FF2EC4)` }} />}
    </AbsoluteFill>
  );
};

/* ===== glass-counter ===== cues: card, done · params: title [a,b], label, value, delta */
export const GlassCounter: React.FC<FxProps> = ({ t, s, c, p }) => {
  const cardT = cue(c, "card", s.start + 1.0), doneT = cue(c, "done", cardT + 1.5);
  const k = ramp(t, cardT, doneT - cardT + 1.0), target = p.value ?? 1_000_000;
  const txt = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString("de-DE");
  const [ta, tb] = p.title ?? ["GLASS", "COUNTER"];
  return half(s, ORANGE_BG, <>
    <HalfTitle t={t} t0={s.start + 0.15} t1={cardT} a={ta} b={tb} />
    {t >= cardT && (
      <div style={{ position: "absolute", left: 80, top: 120, width: 920, height: 400, borderRadius: 44, padding: "34px 44px", ...glass,
        transform: `scale(${0.85 + 0.15 * pop(t, cardT)})`, textAlign: "center" }}>
        <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 36, letterSpacing: "0.25em", color: INK.navy }}>{p.label ?? "▶ LƯỢT XEM"}</div>
        <div style={{ fontFamily: STK, fontSize: fitSize(target.toLocaleString("de-DE"), 170, 820), lineHeight: 1.05, color: "#fff", textShadow: `0 8px 0 ${INK.navy}`, whiteSpace: "nowrap" }}>{txt}</div>
        {p.delta && <div style={{ display: "inline-block", marginTop: 8, fontFamily: BVP, fontWeight: 900, fontSize: 38, color: "#fff", background: C.green, borderRadius: 20, padding: "6px 22px",
          opacity: ramp(t, doneT, 0.3) }}>{p.delta}</div>}
      </div>
    )}
  </>);
};

/* ===== ai-prompt ===== cues: card, type, answer · params: ask, answer, app */
export const AiPrompt: React.FC<FxProps> = ({ t, s, c, p }) => {
  const cardT = cue(c, "card", s.start + 0.8), typeT = cue(c, "type", cardT + 0.6), ansT = cue(c, "answer", typeT + 1.2);
  const ask: string = p.ask ?? "/effects glass-counter";
  const typed = ask.slice(0, Math.ceil(ask.length * ramp(t, typeT - 0.3, 0.9)));
  return half(s, CREAM, t >= cardT && (
    <div style={{ position: "absolute", left: 70, top: 110, width: 940, height: 420, borderRadius: 32, background: "#1E1E22", overflow: "hidden",
      boxShadow: "0 26px 60px rgba(0,0,0,.3)", transform: `scale(${0.85 + 0.15 * pop(t, cardT)})` }}>
      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 24px", background: "#2A2A30", fontFamily: BVP, fontWeight: 800, fontSize: 28, color: "#ddd" }}>
        <span style={{ color: C.claude, fontSize: 34 }}>✳</span> {p.app ?? "Claude"}
      </div>
      <div style={{ padding: "26px 30px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ alignSelf: "flex-end", maxWidth: 760, background: "#3A3A42", color: "#fff", borderRadius: 22, padding: "16px 22px", fontFamily: "Consolas, monospace", fontSize: 32 }}>
          {typed}<span style={{ opacity: Math.floor(t * 3) % 2 ? 0 : 1, color: C.claude }}>▍</span>
        </div>
        {t >= typeT + 0.65 && t < ansT && <div style={{ fontFamily: BVP, fontSize: 40, color: C.claude, letterSpacing: 6 }}>{"●".repeat(1 + (Math.floor(t * 6) % 3))}</div>}
        {t >= ansT && (
          <div style={{ maxWidth: 780, background: "#FAF3EC", color: C.ink, borderRadius: 22, padding: "18px 24px", fontFamily: BVP, fontWeight: 800, fontSize: 34,
            transform: `translateY(${(1 - pop(t, ansT, 220, 16)) * 30}px)`, opacity: ramp(t, ansT, 0.15) }}>{p.answer ?? "✅ Xong!"}</div>
        )}
      </div>
    </div>
  ));
};

/* ===== stamp-hit ===== cues: hit, swap · params: text, text2 */
export const StampHit: React.FC<FxProps> = ({ t, s, c, p }) => {
  const h = headAt(s.id, 1), hit = cue(c, "hit", on0(c, s)), swap = cue(c, "swap", 1e9);
  const shake = t >= hit && t < hit + 0.3 ? Math.sin((t - hit) * 90) * 14 * (1 - (t - hit) / 0.3) : 0;
  const q = ramp(t, hit - 0.12, 0.12);
  const text = t >= swap && p.text2 ? p.text2 : p.text ?? "ĐÃ KIỂM CHỨNG";
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <Vid s={s} />
      {t >= hit - 0.12 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: h.y1 + 70, display: "flex", justifyContent: "center" }}>
          <div style={{ transform: `scale(${2.6 - 1.6 * q}) rotate(-10deg)`, opacity: q, padding: "18px 40px", border: "12px solid #E0201B", borderRadius: 18,
            color: "#E0201B", fontFamily: STK, fontSize: fitSize(text, 68, 760), letterSpacing: 3, whiteSpace: "nowrap", background: "rgba(255,255,255,.12)" }}>{text}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ===== photo-snap ===== cues: snap · params: caption, img (a picture under public/, e.g. a screenshot of a post) */
export const PhotoSnap: React.FC<FxProps> = ({ t, s, c, p }) => {
  const snap = cue(c, "snap", on0(c, s));
  if (p.img && t < snap && !isVo(s)) return <Vid s={s} />; // speaker stays full until the picture drops in
  if (p.img) {
    // a real picture the speaker talks about: polaroid drops into the top band, speaker stays (half card) — or centered on a voice-over
    const q = pop(t, snap + 0.12, 120, 14);
    return half(s, ORANGE_BG, <>
      {t >= snap && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "18px 18px 70px", borderRadius: 8, boxShadow: "0 30px 70px rgba(80,30,0,.35)",
            transform: `translateY(${(1 - q) * -120}px) rotate(${-3 * q}deg) scale(${1.4 - 0.4 * q})`, opacity: Math.min(1, q * 2) }}>
            <Img src={staticFile(p.img)} style={{ display: "block", maxWidth: 820, maxHeight: 470, objectFit: "contain" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: "'Segoe Print', 'Comic Sans MS', cursive", fontSize: 38, color: "#333", whiteSpace: "nowrap" }}>{p.caption ?? ""}</div>
          </div>
        </div>
      )}
      {t >= snap && t < snap + 0.25 && <AbsoluteFill style={{ background: "#fff", opacity: 1 - ramp(t, snap, 0.25) }} />}
    </>);
  }
  if (t < snap) return <Vid s={s} />;
  const q = pop(t, snap + 0.12, 120, 14);
  return (
    <AbsoluteFill>
      <OrangeBg t={t} />
      <div style={{ position: "absolute", left: 210, top: 170, width: 660, height: 1000, background: "#fff", padding: "26px 26px 120px", borderRadius: 8,
        boxShadow: "0 30px 70px rgba(80,30,0,.35)", transform: `translateY(${(1 - q) * -120}px) rotate(${-6 * q}deg) scale(${1.5 - 0.5 * q})` }}>
        <div style={{ position: "relative", width: 608, height: 854, overflow: "hidden", background: "#111" }}>
          <Freeze frame={Math.round((snap - s.start) * FPS)}>
            <Vid s={s} style={{ transform: "scale(0.6)", transformOrigin: "0 0", left: -20, top: -150 }} />
          </Freeze>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: "'Segoe Print', 'Comic Sans MS', cursive", fontSize: 44, color: "#333" }}>{p.caption ?? "✨"}</div>
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: 1 - ramp(t, snap, 0.25) }} />
    </AbsoluteFill>
  );
};

/* ===== clone-crowd ===== cues: on, c1, c2 */
export const CloneCrowd: React.FC<FxProps> = ({ t, s, c }) => {
  const on = on0(c, s);
  if (t < on) return <Vid s={s} />;
  const l = pop(t, cue(c, "c1", on + 0.8), 140, 15), r = pop(t, cue(c, "c2", on + 1.3) - 0.3, 140, 15);
  const side = (k: number, dir: number) => (
    <Matte s={s} style={{ transform: `translateX(${dir * 330 * k}px) translateY(${80 * k}px) scale(${1 - 0.22 * k})`, transformOrigin: "50% 60%",
      filter: `brightness(${1 - 0.12 * k}) drop-shadow(0 20px 30px rgba(0,0,0,.35))`, opacity: Math.min(1, k * 1.4) }} />
  );
  return (
    <AbsoluteFill>
      <OrangeBg t={t} />
      {side(l, -1)}{side(r, 1)}
      <Matte s={s} style={{ filter: "drop-shadow(0 24px 40px rgba(0,0,0,.4))" }} />
    </AbsoluteFill>
  );
};

/* ===== sticky-note ===== cues: n1, n2 · params: notes [{text, color}] (≤ 4) */
const NOTE_SLOTS = [[80, 110, 540, -4, 48], [640, 130, 360, 5, 36], [660, 360, 340, -3, 36], [110, 430, 450, 3, 34]];
export const StickyNote: React.FC<FxProps> = ({ t, s, c, p }) => {
  const n1 = cue(c, "n1", s.start + 1.0), n2 = cue(c, "n2", n1 + 1.0);
  const notes: any[] = (p.notes ?? [{ text: "MẸO" }]).slice(0, 4);
  const colors = ["#FFE45C", "#FF9EC4", "#9ED8FF", "#B8F5A0"];
  const cork = "radial-gradient(circle at 20% 30%, #D9A86C 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, #B7834A 0 2px, transparent 3px), #C99358";
  return half(s, cork, notes.map((n, i) => {
    const t0 = i === 0 ? n1 : n2 + (i - 1) * 0.35;
    if (t < t0) return null;
    const [x, y, w, rot, size] = NOTE_SLOTS[i], q = pop(t, t0, 260, 13);
    return (
      <div key={i} style={{ position: "absolute", left: x, top: y, width: w, padding: "30px 26px", background: n.color ?? colors[i], boxShadow: "0 14px 24px rgba(0,0,0,.28)",
        transform: `rotate(${rot}deg) scale(${1.4 - 0.4 * q})`, opacity: Math.min(1, q * 2), fontFamily: BVP, fontWeight: 800, fontSize: size, color: "#2B2B2B", lineHeight: 1.25 }}>
        <div style={{ position: "absolute", left: "50%", top: -16, width: 120, height: 34, marginLeft: -60, background: "rgba(255,255,255,.55)", transform: "rotate(-3deg)" }} />
        {n.text}
      </div>
    );
  }));
};

/* ===== spotlight ===== cues: dim, full */
export const Spotlight: React.FC<FxProps> = ({ t, s, c }) => {
  const h = headAt(s.id, 1), cx = (h.x0 + h.x1) / 2, cy = (h.y0 + h.y1) / 2;
  const dim = cue(c, "dim", on0(c, s)), full = cue(c, "full", dim + 1.2);
  const k = ramp(t, dim - 0.2, full - dim + 0.4), r = 1400 - 1000 * k;
  return (
    <AbsoluteFill>
      <Vid s={s} />
      <AbsoluteFill style={{ background: `radial-gradient(circle ${r}px at ${cx}px ${cy}px, transparent 0%, transparent 55%, rgba(0,0,0,${0.92 * k}) 100%)` }} />
    </AbsoluteFill>
  );
};

/* ===== comment-pop ===== cues: on · params: comments [{u, m}] (≤ 6, 3 rows per side below the chin) */
export const CommentPop: React.FC<FxProps> = ({ t, s, c, p }) => {
  const h = headAt(s.id, 1), on = on0(c, s);
  const list: any[] = (p.comments ?? [{ u: "Minh", m: "Hay quá 🔥" }, { u: "Lan", m: "Xin bộ lệnh" }]).slice(0, 6);
  const colors = ["#2563EB", "#E91E63", "#2ECC71", "#FF7A1A", "#8E44AD", "#0EA5E9"];
  return (
    <AbsoluteFill>
      <Vid s={s} />
      {list.map((it, i) => {
        const t0 = on + i * 0.42;
        if (t < t0) return null;
        const left = i % 2 === 0, yEnd = h.y1 + 50 + Math.floor(i / 2) * 115, yStart = h.y1 + 380;
        return (
          <div key={i} style={{ position: "absolute", top: yStart - (yStart - yEnd) * ramp(t, t0, 0.5), left: left ? 40 : undefined, right: left ? undefined : 40,
            display: "flex", alignItems: "center", gap: 14, padding: "12px 22px 12px 12px", borderRadius: 40, background: "rgba(255,255,255,.95)",
            boxShadow: "0 10px 26px rgba(0,0,0,.3)", opacity: Math.min(1, (t - t0) * 5), transform: `scale(${0.7 + 0.3 * pop(t, t0, 280, 14)})` }}>
            <div style={{ width: 58, height: 58, borderRadius: 29, background: colors[i], color: "#fff", display: "grid", placeItems: "center", fontFamily: STK, fontSize: 28 }}>{String(it.u)[0]}</div>
            <div>
              <div style={{ fontFamily: BVP, fontWeight: 600, fontSize: 22, color: "#777" }}>{it.u}</div>
              <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 34, color: C.ink, whiteSpace: "nowrap" }}>{it.m}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ===== end-wall ===== cues: wall, swap · params: items (≤ 20 pills), sticker */
export const EndWall: React.FC<FxProps> = ({ t, s, c, p }) => {
  const q = pop(t, s.start, 120, 16);
  const R = 1400 - (1400 - 290) * q, CX = 540, CY = 1080, Z = 1 - 0.25 * q;
  const h = HEAD[s.id], fx = (h.x0 + h.x1) / 2, fy = (h.y0 + h.y1) / 2;
  const wall = cue(c, "wall", s.start + 0.5), swap = cue(c, "swap", 1e9), dim = ramp(t, swap - 0.1, 0.3);
  const items: string[] = (p.items ?? []).slice(0, 20);
  return (
    <AbsoluteFill>
      <OrangeBg t={t} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 130, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, opacity: 1 - dim }}>
        {items.map((k, i) => (
          <div key={k + i} style={{ height: 70, borderRadius: 35, display: "grid", placeItems: "center", fontFamily: "Consolas, monospace", fontWeight: 700, fontSize: 24,
            color: i % 2 ? "#fff" : INK.navy, background: i % 2 ? INK.navy : "#fff", transform: `scale(${pop(t, wall + i * 0.07, 300, 14)})` }}>{k}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: CX - R, top: CY - R, width: R * 2, height: R * 2, borderRadius: "50%", overflow: "hidden", border: `${12 * q}px solid #fff`, boxShadow: "0 30px 70px rgba(0,0,0,.3)" }}>
        <Vid s={s} style={{ transform: `scale(${Z})`, transformOrigin: "0 0", left: R - fx * Z, top: R - fy * Z }} />
      </div>
      {p.sticker && <Sticker t={t} t0={swap} t1={s.end + 0.12} text={p.sticker} y={250} size={104} />}
    </AbsoluteFill>
  );
};

/* ===== cta-circle ===== cues: type, send · params: code, avatar */
export const CtaCircle: React.FC<FxProps> = ({ t, s, c, p }) => {
  const q = pop(t, s.start, 120, 16);
  const R = 1400 - (1400 - 320) * q, CX = 540, CY = 860, Z = 1 - 0.2 * q;
  const h = HEAD[s.id], fx = (h.x0 + h.x1) / 2, fy = (h.y0 + h.y1) / 2;
  const code: string = p.code ?? "comment";
  const typeT = cue(c, "type", s.start + 0.8), sendT = cue(c, "send", typeT + 1.5);
  const typed = code.slice(0, Math.ceil(code.length * ramp(t, typeT, 0.5))), sent = t >= sendT;
  return (
    <AbsoluteFill>
      <OrangeBg t={t} />
      <div style={{ position: "absolute", left: CX - R, top: CY - R, width: R * 2, height: R * 2, borderRadius: "50%", overflow: "hidden", border: `${12 * q}px solid #fff`, boxShadow: "0 30px 70px rgba(0,0,0,.3)" }}>
        <Vid s={s} style={{ transform: `scale(${Z})`, transformOrigin: "0 0", left: R - fx * Z, top: R - fy * Z }} />
      </div>
      {t >= typeT - 0.1 && (
        <div style={{ position: "absolute", left: 140, top: 1220, width: 800, height: 150, borderRadius: 75, background: "#fff", display: "flex", alignItems: "center", gap: 24, padding: "0 20px",
          boxShadow: "0 20px 44px rgba(0,0,0,.25)", transform: `scale(${0.8 + 0.2 * pop(t, typeT - 0.1)})` }}>
          <div style={{ width: 104, height: 104, borderRadius: 52, background: INK.blue, color: "#fff", display: "grid", placeItems: "center", fontFamily: STK, fontSize: 50 }}>{p.avatar ?? "B"}</div>
          <div style={{ flex: 1, fontFamily: BVP, fontWeight: 800, fontSize: 56, color: typed ? C.ink : "#aaa", whiteSpace: "nowrap" }}>{typed || "Thêm bình luận…"}</div>
          <div style={{ width: 104, height: 104, borderRadius: 52, background: sent ? C.green : typed.length === code.length ? INK.blue : "#ddd", color: "#fff", display: "grid", placeItems: "center", fontSize: 54, fontWeight: 900 }}>{sent ? "✓" : "➤"}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* registry: keyword name → component (names = keywords.json keys) */
export const FX: Record<string, React.FC<FxProps>> = {
  "text-behind": TextBehind, "locked-on": LockedOn, scribble: Scribble, "glass-graph": GlassGraph, "reel-orbit": ReelOrbit,
  "match-cut": MatchCut, "task-list": TaskList, messages: Messages, "led-sign": LedSign, "edit-timeline": EditTimeline,
  "face-scan": FaceScan, "neon-outline": NeonOutline, "glass-counter": GlassCounter, "ai-prompt": AiPrompt, "stamp-hit": StampHit,
  "photo-snap": PhotoSnap, "clone-crowd": CloneCrowd, "sticky-note": StickyNote, spotlight: Spotlight, "comment-pop": CommentPop,
  "end-wall": EndWall, "cta-circle": CtaCircle,
  ...FX2, // batch 2 (library2.tsx)
  ...FX3, // batch 3 (library3.tsx)
};
export { CmdPill };
