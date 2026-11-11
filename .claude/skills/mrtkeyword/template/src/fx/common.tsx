import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import faces from "../faces.json";
import { C, FPS, INK, STK, life, pop, ramp } from "../ui";

/* Shared pieces for every keyword effect.
   Contract: an effect is React.FC<FxProps>. `t` = global time (s); `s` = its A-roll segment (the video inside
   plays from the start of its own <Sequence>); `c` = cue times resolved from spoken words by build_data.py;
   `p` = content params the agent wrote into plan.json; `z` = current punch-in zoom of the clip. */

export type Seg = { id: string; src: string | null; in: number; start: number; end: number };
export type FxProps = { t: number; s: Seg; c: Record<string, number>; p: any; z: number };
export type Head = { x0: number; y0: number; x1: number; y1: number };
export const HEAD = faces as Record<string, Head>;
const ORIGIN_Y = 1920 * 0.32;

/** cue time with fallback: cue(c, "lock", c.on + 1) */
export const cue = (c: Record<string, number>, k: string, fallback: number) => (typeof c[k] === "number" ? c[k] : fallback);

/** head box on screen for a full-frame clip under punch-in zoom z (origin 50% 32%) */
export const headAt = (clip: string, z: number): Head => {
  const h = HEAD[clip] ?? { x0: 300, y0: 250, x1: 780, y1: 900 };
  return { x0: 540 + (h.x0 - 540) * z, x1: 540 + (h.x1 - 540) * z, y0: ORIGIN_Y + (h.y0 - ORIGIN_Y) * z, y1: ORIGIN_Y + (h.y1 - ORIGIN_Y) * z };
};

/** largest font size (≤ size) that keeps one line of Montserrat Black inside maxW px (≈0.74em per char) */
export const fitSize = (text: string, size: number, maxW = 960) => Math.min(size, Math.floor(maxW / Math.max(1, 0.74 * text.length)));

/** the speaker clip; a voice-over segment (src null) has no speaker → brand background instead */
export const Vid: React.FC<{ s: Seg; z?: number; style?: React.CSSProperties }> = ({ s, z = 1, style }) => {
  const t = useCurrentFrame() / FPS;
  if (!s.src) return <OrangeBg t={t} />;
  return (
    <OffthreadVideo src={staticFile(s.src)} trimBefore={Math.round(s.in * FPS)} muted
      style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: "50% 32%", ...style }} />
  );
};
/** voice-over segments center the effect's card: content drawn for the top band shifts down by VO_SHIFT */
export const VO_SHIFT = 480;
export const isVo = (s: Seg) => !s.src;
/** the speaker cut out of the same clip (public/matte_<id>.webm, made by prepare_assets.py) */
export const Matte: React.FC<{ s: Seg; style?: React.CSSProperties }> = ({ s, style }) => (
  <OffthreadVideo src={staticFile(`matte_${s.id}.webm`)} trimBefore={Math.round(s.in * FPS)} transparent muted
    style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, ...style }} />
);

/** orange brand background (60%) with thin moving curves */
export const OrangeBg: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.peach} 0%, #E9A364 50%, ${C.orange} 100%)` }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
      <path d={`M -100 ${300 + Math.sin(t * 0.4) * 30} C 300 100, 700 600, 1200 380`} stroke="#E39A5E" strokeWidth={4} fill="none" />
      <path d={`M -100 ${1500 + Math.cos(t * 0.35) * 30} C 400 1200, 600 1900, 1200 1450`} stroke="#E39A5E" strokeWidth={4} fill="none" />
    </svg>
  </AbsoluteFill>
);

/** big outlined type (two layers: navy outline + hard shadow behind a solid fill — keeps Vietnamese marks crisp) */
export const Out: React.FC<{ children: React.ReactNode; size: number; fill?: string; style?: React.CSSProperties }> = ({ children, size, fill = "#fff", style }) => {
  const base: React.CSSProperties = { gridArea: "1 / 1", fontFamily: STK, fontWeight: 900, fontSize: size, lineHeight: 0.95, letterSpacing: -2, whiteSpace: "nowrap", textAlign: "center" };
  return (
    <div style={{ display: "grid", ...style }}>
      <div style={{ ...base, color: INK.navy, WebkitTextStroke: `${Math.round(size / 7)}px ${INK.navy}`, filter: `drop-shadow(0 ${Math.round(size / 11)}px 0 ${INK.orange})` }}>{children}</div>
      <div style={{ ...base, color: fill, position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
};

/** "#n  /effects keyword" typed like the Claude input */
export const CmdPill: React.FC<{ t: number; t0: number; t1: number; n: number; kw: string; y?: number }> = ({ t, t0, t1, n, kw, y = 1300 }) => {
  if (t < t0 || t > t1) return null;
  const p = pop(t, t0, 240, 16), o = life(t, t0, t1, 0.08, 0.15);
  const full = `/effects ${kw}`;
  const shown = full.slice(0, Math.ceil(full.length * ramp(t, t0 + 0.05, 0.45)));
  const caret = Math.floor(t * 2.5) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: o, transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, height: 90, padding: "0 30px 0 12px", borderRadius: 45, background: "rgba(24,24,28,.92)",
        border: "2px solid rgba(255,255,255,.18)", boxShadow: "0 16px 40px rgba(0,0,0,.4)" }}>
        <div style={{ height: 66, minWidth: 66, padding: "0 16px", borderRadius: 33, background: C.claude, color: "#fff", display: "grid", placeItems: "center", fontFamily: STK, fontSize: 38 }}>#{n}</div>
        <div style={{ fontFamily: "Consolas, 'Courier New', monospace", fontWeight: 700, fontSize: 42, color: "#FFE2D4", whiteSpace: "pre" }}>
          {shown}<span style={{ opacity: caret ? 1 : 0, color: C.claude }}>▍</span>
        </div>
      </div>
    </div>
  );
};
