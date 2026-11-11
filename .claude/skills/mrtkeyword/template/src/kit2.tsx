import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { BVP, C, FPS, INK, MONT, STK } from "./ui";

/* Template set B ("half card, head breaks out at ear level" + clean explainer motion graphics).
   Idea taken from a sample video the user liked; catalogue: references/effects-catalog.md §B.
   Every component reads the frame of its own <Sequence>. */

const useT = () => useCurrentFrame() / FPS;
const sp = (t: number, t0 = 0, damping = 14, stiffness = 170) =>
  t < t0 ? 0 : spring({ frame: (t - t0) * FPS, fps: FPS, config: { damping, stiffness } });
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const CREAM = "linear-gradient(180deg, #FFF8F1 0%, #FDEBDD 55%, #F9D9C2 100%)";
export const ORANGE_BG = `radial-gradient(circle at 50% 30%, #F7B26A, ${C.orange} 55%, #C9600F 100%)`;

/* ---------- B1 · HALF CARD: speaker in a bottom card whose top edge sits at ear level; the head above the
   edge is the matte, so it pops out over the background. Upper area (0 … cardTop) is free for graphics. ---------- */
export const halfCardTop = (head: { y0: number; y1: number }, shift = 0) =>
  Math.round(shift + head.y0 + (head.y1 - head.y0) * 0.5); // ≈ ear line: half way between hair top and chin

export const HalfCard: React.FC<{
  src: string; trim?: number; matte: string; head: { y0: number; y1: number };
  shift?: number;     // move the whole speaker down (px) so more space is left for graphics
  bg?: string;        // background above the card
  radius?: number;
  children?: React.ReactNode; // graphics for the upper area
}> = ({ src, trim = 0, matte, head, shift = 520, bg = CREAM, radius = 56, children }) => {
  const top = halfCardTop(head, shift);
  const vid: React.CSSProperties = { position: "absolute", left: 0, top: shift, width: 1080, height: 1920 };
  return (
    <AbsoluteFill style={{ background: bg }}>
      {children}
      {/* card: the clip, clipped below the ear line with rounded top corners */}
      <div style={{ position: "absolute", left: 0, right: 0, top, bottom: 0, overflow: "hidden", borderRadius: `${radius}px ${radius}px 0 0`,
        boxShadow: "0 -12px 40px rgba(120,60,10,.18)" }}>
        <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(trim * FPS)} muted style={{ ...vid, top: shift - top }} />
      </div>
      {/* head: matte drawn only ABOVE the card edge (+2 px overlap so there is no seam) */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${1920 - top - 2}px 0)` }}>
        <OffthreadVideo src={staticFile(matte)} trimBefore={Math.round(trim * FPS)} transparent muted style={vid} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- B2 · NODE CARD + MIND MAP: logo card on the left, branches draw on, numbered badges ---------- */
export const NodeCard: React.FC<{ t: number; t0: number; icon: React.ReactNode; label: string; x: number; y: number; w?: number; badge?: number }> = ({ t, t0, icon, label, x, y, w = 380, badge }) => {
  const p = sp(t, t0, 13);
  if (t < t0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: 132, borderRadius: 26, background: "#fff", display: "flex", alignItems: "center", gap: 22, padding: "0 26px",
      boxShadow: "0 14px 34px rgba(150,70,10,.14)", transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 30}px)`, opacity: Math.min(1, p * 1.5) }}>
      <div style={{ width: 84, height: 84, borderRadius: 18, display: "grid", placeItems: "center", fontSize: 56, background: "#FFF2E6" }}>{icon}</div>
      <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 38, color: C.ink, textTransform: "uppercase" }}>{label}</div>
      {badge !== undefined && (
        <div style={{ position: "absolute", left: -18, top: -18, width: 48, height: 48, borderRadius: 24, background: INK.orange, color: "#fff",
          fontFamily: STK, fontSize: 28, display: "grid", placeItems: "center", transform: `scale(${sp(t, t0 + 0.15, 9)})` }}>{badge}</div>
      )}
    </div>
  );
};

export const MindMap: React.FC<{
  rootIcon: React.ReactNode; rootLabel: string; tag?: string;
  items: { icon: React.ReactNode; label: string; at: number }[]; at?: number; numbered?: boolean; top?: number;
}> = ({ rootIcon, rootLabel, tag, items, at = 0, numbered, top = 220 }) => {
  const t = useT();
  const rootX = 70, rootY = top + items.length * 80 - 90, branchX = 520;
  const pr = sp(t, at, 12);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {items.map((it, i) => {
          const y = top + i * 170 + 66, k = ramp(t, it.at - 0.25, it.at);
          const d = `M ${rootX + 290} ${rootY + 90} C ${rootX + 380} ${rootY + 90}, ${branchX - 120} ${y}, ${branchX} ${y}`;
          return <path key={i} d={d} stroke={INK.orange} strokeWidth={5} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} strokeLinecap="round" />;
        })}
      </svg>
      <div style={{ position: "absolute", left: rootX, top: rootY, width: 290, height: 190, borderRadius: 30, background: "#fff", border: `5px solid ${INK.orange}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 16px 40px rgba(150,70,10,.18)",
        transform: `scale(${0.5 + 0.5 * pr})`, opacity: pr }}>
        <div style={{ fontSize: 76 }}>{rootIcon}</div>
        <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 30, color: C.ink, textTransform: "uppercase" }}>{rootLabel}</div>
      </div>
      {tag && t > at + 0.3 && (
        <div style={{ position: "absolute", left: rootX + 20, top: rootY + 214, padding: "10px 26px", borderRadius: 999, background: INK.orange, color: "#fff",
          fontFamily: STK, fontSize: 30, transform: `scale(${sp(t, at + 0.3, 10)})`, boxShadow: "0 8px 20px rgba(255,122,26,.4)" }}>{tag}</div>
      )}
      {items.map((it, i) => <NodeCard key={i} t={t} t0={it.at} icon={it.icon} label={it.label} x={branchX} y={top + i * 170} badge={numbered ? i + 1 : undefined} />)}
    </AbsoluteFill>
  );
};

/* ---------- B3 · COUNTER TAG: logo + number counting up ("36+") + small orange tag, then category chips ---------- */
export const CounterTag: React.FC<{ icon: React.ReactNode; value: number; suffix?: string; tag: string; chips?: { icon: React.ReactNode; label: string }[]; at?: number; y?: number }> = ({ icon, value, suffix = "+", tag, chips = [], at = 0, y = 260 }) => {
  const t = useT();
  const p = sp(t, at, 13);
  const n = Math.round(value * ramp(t, at + 0.2, at + 1.0));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: "50%", top: y, transform: `translateX(-50%) scale(${0.6 + 0.4 * p})`, opacity: p, display: "flex", alignItems: "center", gap: 26,
        padding: "26px 40px", borderRadius: 30, background: "#fff", border: `4px solid ${INK.orange}`, boxShadow: "0 16px 40px rgba(150,70,10,.18)" }}>
        <div style={{ fontSize: 80 }}>{icon}</div>
        <div>
          <div style={{ fontFamily: STK, fontSize: 120, lineHeight: 1, color: C.ink }}>{n}<span style={{ color: INK.orange }}>{suffix}</span></div>
          <div style={{ marginTop: 8, padding: "6px 18px", borderRadius: 999, background: INK.orange, color: "#fff", fontFamily: STK, fontSize: 24, textAlign: "center" }}>{tag}</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: y + 280, display: "flex", justifyContent: "center", gap: 26 }}>
        {chips.map((c, i) => {
          const q = sp(t, at + 1.0 + i * 0.22, 12);
          return (
            <div key={i} style={{ width: 170, padding: "20px 10px", borderRadius: 22, background: "#fff", textAlign: "center", boxShadow: "0 10px 26px rgba(150,70,10,.14)",
              transform: `translateY(${(1 - q) * 60}px) scale(${0.7 + 0.3 * q})`, opacity: q }}>
              <div style={{ fontSize: 64 }}>{c.icon}</div>
              <div style={{ fontFamily: BVP, fontWeight: 800, fontSize: 24, color: C.ink, textTransform: "uppercase" }}>{c.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- B4 · SCREEN HIGHLIGHT: real screenshot on a tilted card, a red rounded box glows around the part
   being talked about (boxes appear in order), the rest dims ---------- */
export const ScreenHighlight: React.FC<{ img: string; boxes: { x: number; y: number; w: number; h: number; at: number }[]; at?: number; top?: number; tilt?: number; label?: string }> = ({ img, boxes, at = 0, top = 160, tilt = -4, label }) => {
  const t = useT();
  const p = sp(t, at, 15);
  const W = 960, H = 620;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 60, top, width: W, height: H, borderRadius: 28, overflow: "hidden", background: "#fff", boxShadow: "0 30px 70px rgba(80,30,0,.28)",
        transform: `perspective(1800px) rotateX(${(1 - p) * 30}deg) rotateZ(${tilt * p}deg) translateY(${(1 - p) * 120}px)`, opacity: p }}>
        <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {boxes.some((b) => t >= b.at) && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.45)" }} />}
        {boxes.map((b, i) => {
          if (t < b.at) return null;
          const q = sp(t, b.at, 11);
          const glow = 0.6 + 0.4 * Math.sin((t - b.at) * 6);
          return (
            <div key={i} style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 22, border: `7px solid ${C.red}`,
              boxShadow: `0 0 ${24 * glow}px rgba(229,57,53,.75), inset 0 0 0 9999px rgba(255,255,255,0)`, transform: `scale(${1.15 - 0.15 * q})`, opacity: q,
              backdropFilter: "brightness(1.15)" }} />
          );
        })}
      </div>
      {label && <div style={{ position: "absolute", left: 0, right: 0, top: top - 70, textAlign: "center", fontFamily: STK, fontSize: 40, color: C.ink, opacity: p }}>{label}</div>}
    </AbsoluteFill>
  );
};

/* ---------- B5 · PHOTO STACK: product / result photos fly in and stack with slight rotation ---------- */
export const PhotoStack: React.FC<{ imgs: string[]; at?: number; top?: number; bg?: boolean }> = ({ imgs, at = 0, top = 180, bg = false }) => {
  const t = useT();
  const slots = [[90, 0, -6], [560, 30, 5], [330, 360, -2], [80, 520, 4], [600, 560, -5]];
  return (
    <AbsoluteFill style={{ background: bg ? ORANGE_BG : undefined }}>
      {imgs.slice(0, 5).map((src, i) => {
        const q = sp(t, at + i * 0.18, 12);
        const [x, y, r] = slots[i];
        return <Img key={i} src={staticFile(src)} style={{ position: "absolute", left: x, top: top + y, width: 380, height: 500, objectFit: "cover", borderRadius: 18,
          border: "8px solid #fff", boxShadow: "0 20px 50px rgba(0,0,0,.3)", transform: `translateY(${(1 - q) * 500}px) rotate(${r * q}deg) scale(${0.8 + 0.2 * q})`, opacity: Math.min(1, q * 2) }} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------- B6 · BEFORE / AFTER: two photos, AFTER slides over with labels ---------- */
export const BeforeAfter: React.FC<{ before: string; after: string; at?: number; top?: number }> = ({ before, after, at = 0, top = 120 }) => {
  const t = useT();
  const a = sp(t, at, 14), b = sp(t, at + 0.5, 13);
  const tag = (txt: string, bgc: string) => <div style={{ position: "absolute", top: -30, left: 20, padding: "8px 22px", borderRadius: 12, background: bgc, color: "#fff", fontFamily: STK, fontSize: 34 }}>{txt}</div>;
  return (
    <AbsoluteFill style={{ background: ORANGE_BG }}>
      <div style={{ position: "absolute", left: 50, top: top + 420, width: 440, height: 600, transform: `translateX(${(1 - a) * -600}px) rotate(-3deg)` }}>
        <Img src={staticFile(before)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16, border: "6px solid #fff", filter: "saturate(.7)" }} />{tag("BEFORE", INK.navy)}
      </div>
      <div style={{ position: "absolute", left: 560, top, width: 470, height: 820, transform: `translateX(${(1 - b) * 700}px) rotate(3deg)` }}>
        <Img src={staticFile(after)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16, border: "6px solid #fff", boxShadow: "0 30px 60px rgba(0,0,0,.35)" }} />{tag("AFTER", C.red)}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- B7 · DEAL CARDS: big discount cards ("60% OFF"), date card ("20 → 30") ---------- */
export const DealCards: React.FC<{ deals: { value: string; note: string }[]; title?: string; at?: number; top?: number }> = ({ deals, title, at = 0, top = 260 }) => {
  const t = useT();
  return (
    <AbsoluteFill>
      {title && <div style={{ position: "absolute", left: 0, right: 0, top: top - 110, textAlign: "center", fontFamily: MONT, fontWeight: 300, fontSize: 56, color: C.ink, opacity: ramp(t, at, at + 0.3) }}>{title}</div>}
      <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", gap: 30 }}>
        {deals.map((d, i) => {
          const q = sp(t, at + 0.2 + i * 0.2, 10);
          return (
            <div key={i} style={{ width: 440, padding: "34px 30px", borderRadius: 30, background: "#fff", boxShadow: "0 20px 50px rgba(15,30,70,.25)", transform: `scale(${0.5 + 0.5 * q}) rotate(${(1 - q) * (i ? 8 : -8)}deg)`, opacity: q }}>
              <div style={{ fontFamily: STK, fontSize: 130, lineHeight: 1, color: C.ink }}>{d.value}<span style={{ fontSize: 50 }}> OFF</span></div>
              <div style={{ marginTop: 10, fontFamily: BVP, fontWeight: 600, fontSize: 30, color: "#666" }}>{d.note}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const DateCard: React.FC<{ month: string; from: string; to: string; at?: number; y?: number }> = ({ month, from, to, at = 0, y = 330 }) => {
  const t = useT();
  const p = sp(t, at, 11), k = ramp(t, at + 0.35, at + 0.8);
  return (
    <div style={{ position: "absolute", left: "50%", top: y, width: 460, transform: `translateX(-50%) scale(${0.6 + 0.4 * p})`, opacity: p, borderRadius: 28, overflow: "hidden", background: "#fff", boxShadow: "0 18px 44px rgba(150,70,10,.2)" }}>
      <div style={{ background: INK.orange, color: "#fff", textAlign: "center", fontFamily: STK, fontSize: 30, padding: "10px 0" }}>{month}</div>
      <div style={{ textAlign: "center", fontFamily: STK, fontSize: 96, color: C.ink, padding: "14px 0" }}>{from} <span style={{ color: INK.orange, opacity: k }}>→</span> <span style={{ opacity: k }}>{to}</span></div>
    </div>
  );
};

/* ---------- B8 · OUTRO: speaker shrinks into a circle, channel name lands above, cursor clicks a subscribe badge ---------- */
export const OutroCircle: React.FC<{ src: string; trim?: number; channel: string; at?: number }> = ({ src, trim = 0, channel, at = 0 }) => {
  const t = useT();
  const p = sp(t, at, 15), c = ramp(t, at + 0.9, at + 1.3);
  const R = interpolate(p, [0, 1], [1500, 330]);
  const clicked = t > at + 1.35;
  return (
    <AbsoluteFill style={{ background: ORANGE_BG }}>
      <div style={{ position: "absolute", left: 540 - R, top: 980 - R, width: R * 2, height: R * 2, borderRadius: "50%", overflow: "hidden", border: `${12 * p}px solid #fff`, boxShadow: "0 30px 70px rgba(0,0,0,.3)" }}>
        <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(trim * FPS)} muted style={{ position: "absolute", left: R - 540, top: R - 760, width: 1080, height: 1920 }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: STK, fontStyle: "normal", fontSize: 120, color: "#FFE9A8",
        WebkitTextStroke: "4px #7a2d00", paintOrder: "stroke fill", transform: `translateY(${(1 - sp(t, at + 0.5, 12)) * -80}px)`, opacity: ramp(t, at + 0.5, at + 0.7) }}>{channel}</div>
      <div style={{ position: "absolute", left: 470, top: 1280, width: 140, height: 140, borderRadius: 30, background: clicked ? C.red : "#FFD60A", display: "grid", placeItems: "center",
        fontSize: 70, transform: `scale(${sp(t, at + 0.8, 10) * (clicked && t < at + 1.5 ? 0.9 : 1)})` }}>{clicked ? "✓" : "＋"}</div>
      <div style={{ position: "absolute", left: 560 + (1 - c) * 220, top: 1340 + (1 - c) * 220, fontSize: 90, opacity: c, transform: `scale(${clicked && t < at + 1.5 ? 0.85 : 1})` }}>👆</div>
    </AbsoluteFill>
  );
};

/* ---------- B9 · CAPTION PILL: short white caption on a dark translucent pill (the sample's subtitle look) ---------- */
export const CaptionPill: React.FC<{ text: string; y: number }> = ({ text, y }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
    <div style={{ padding: "6px 16px", borderRadius: 10, background: "rgba(40,30,25,.55)", fontFamily: MONT, fontWeight: 800, fontSize: 52, color: "#fff" }}>{text}</div>
  </div>
);
