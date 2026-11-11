import React from "react";
import { Easing, interpolate, spring } from "remotion";

export const FPS = 30;
export const C = {
  orange: "#ED9324",
  orangeDeep: "#D9730D",
  peach: "#F9CFB5",
  cream: "#FFF7EF",
  ink: "#1B1B1F",
  red: "#E53935",
  green: "#2ECC71",
  claude: "#D97757",
  flow: "#4285F4",
  remotion: "#0B84F3",
  purple: "#8E44AD",
};

/** 0→1 spring that starts at t0 (seconds); 0 before t0 */
export const pop = (t: number, t0: number, stiffness = 180, damping = 13) =>
  t < t0 ? 0 : spring({ frame: (t - t0) * FPS, fps: FPS, config: { stiffness, damping } });

/** linear 0→1 over [t0, t0+d] */
export const ramp = (t: number, t0: number, d: number) =>
  interpolate(t, [t0, t0 + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

/** fade-in at t0, fade-out ending at t1 */
export const life = (t: number, t0: number, t1: number, fin = 0.15, fout = 0.2) =>
  Math.min(ramp(t, t0, fin), 1 - ramp(t, t1 - fout, fout));

export const BVP = "'BVP', 'Be Vietnam Pro', sans-serif";
export const MONT = "'Mont', 'Montserrat', sans-serif";
export const INK = { navy: "#0F1E46", blue: "#2563EB", orange: "#FF7A1A", yellow: "#FFD60A" };
export const STK ="'MontBlack', 'Montserrat', sans-serif";

/** Big sticker text: upright Montserrat Black, solid punchy fill over a thick black outline layer drawn
 * behind it (keeps Vietnamese diacritics crisp), hard drop shadow. "yellow"/"dark" = text on a bold tag. */
export const Sticker: React.FC<{
  t: number; t0: number; t1: number; text: string; y: number; size?: number;
  variant?: "fire" | "white" | "yellow" | "dark"; rotate?: number; shake?: boolean; hl?: string;
}> = ({ t, t0, t1, text, y, size = 96, variant = "fire", rotate = -3, shake, hl }) => {
  if (t < t0 || t > t1) return null;
  const p = pop(t, t0, 220, 11);
  const o = life(t, t0, t1, 0.06, 0.18);
  const sx = shake ? Math.sin((t - t0) * 60) * 10 * (1 - ramp(t, t0, 0.5)) : 0;
  const base: React.CSSProperties = {
    gridArea: "1 / 1", fontFamily: STK, fontWeight: 900, fontSize: size, lineHeight: 1.12, textAlign: "center",
    letterSpacing: -0.5, whiteSpace: "pre-line",
  };
  const wrap: React.CSSProperties = {
    position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center",
    transform: `translateX(${sx}px) scale(${0.4 + 0.6 * p}) rotate(${rotate}deg)`, opacity: o,
  };
  // palette (60-30-10 on the orange base): white text, navy ink for outline/shadow, complementary blue accent
  if (variant === "yellow" || variant === "dark") {
    const bg = variant === "yellow" ? INK.blue : INK.orange;
    return (
      <div style={wrap}>
        <div style={{
          ...base, color: "#fff", background: bg, padding: `${size * 0.1}px ${size * 0.3}px ${size * 0.06}px`, borderRadius: size * 0.2,
          border: `${Math.round(size / 16)}px solid #fff`, boxShadow: `0 ${Math.round(size / 10)}px 0 ${INK.navy}, 0 20px 40px rgba(0,0,0,.35)`, maxWidth: 1000,
        }}>{text}</div>
      </div>
    );
  }
  // fire: white on navy outline with an orange hard shadow; white: orange on white outline with navy shadow.
  // *word* marks a keyword drawn in the highlight colour (yellow on dark footage, blue on the orange bg).
  const [fill, line, hard] = variant === "white" ? [INK.orange, "#FFFFFF", INK.navy] : ["#FFFFFF", INK.navy, INK.orange];
  const plain = text.replace(/\*/g, "");
  const rich = text.split(/(\*[^*]+\*)/).map((part, i) =>
    part.startsWith("*") ? <span key={i} style={{ color: hl ?? INK.yellow }}>{part.slice(1, -1)}</span> : part);
  return (
    <div style={wrap}>
      <div style={{ display: "grid", maxWidth: 1000 }}>
        <div style={{
          ...base, color: line, WebkitTextStroke: `${Math.round(size / 7)}px ${line}`,
          filter: `drop-shadow(0 ${Math.round(size / 11)}px 0 ${hard}) drop-shadow(0 16px 26px rgba(0,0,0,.4))`,
        }}>{plain}</div>
        {/* filter puts the outline layer in its own stacking context; keep the fill above it */}
        <div style={{ ...base, color: fill, position: "relative", zIndex: 1 }}>{rich}</div>
      </div>
    </div>
  );
};

/** rough rendered height of a Sticker (Montserrat Black caps ≈ 0.74em wide, 1000px max line) */
export const stickerSize = (text: string, size: number) => {
  const perLine = Math.max(1, Math.floor(1000 / (0.74 * size)));
  const lines = text.replace(/\*/g, "").split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
  return { lines, height: lines * size * 1.12 + size * 0.35 };
};

/** White rounded card with soft shadow; scales in */
export const Card: React.FC<{ t: number; t0: number; style?: React.CSSProperties; dark?: boolean; children?: React.ReactNode }> = ({ t, t0, style, dark, children }) => {
  const p = pop(t, t0, 200, 16);
  return (
    <div style={{
      position: "absolute", borderRadius: 34, background: dark ? "#16161A" : "#FFFFFF",
      boxShadow: "0 24px 60px rgba(70,30,0,.28)", overflow: "hidden",
      transform: `scale(${0.88 + 0.12 * p})`, opacity: Math.min(1, p * 1.4), ...style,
    }}>{children}</div>
  );
};

export const Pill: React.FC<{ t: number; t0: number; text: string; bg?: string; color?: string; size?: number; style?: React.CSSProperties }> = ({ t, t0, text, bg = "#fff", color = C.ink, size = 40, style }) => {
  if (t < t0) return null;
  const p = pop(t, t0, 260, 12);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 12, padding: `${size * 0.35}px ${size * 0.6}px`,
      borderRadius: 999, background: bg, color, fontFamily: BVP, fontWeight: 800, fontSize: size,
      boxShadow: "0 10px 24px rgba(0,0,0,.18)", transform: `scale(${0.3 + 0.7 * p})`, ...style,
    }}>{text}</div>
  );
};

/** "BƯỚC n" badge at the top of each step scene */
export const StepBadge: React.FC<{ t: number; t0: number; n: string; title: string; color: string }> = ({ t, t0, n, title, color }) => {
  const p = pop(t, t0, 200, 14);
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${(1 - p) * -80}px)`, opacity: p }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fff", borderRadius: 999, padding: "16px 34px 16px 16px", boxShadow: "0 14px 34px rgba(0,0,0,.2)" }}>
        <div style={{ background: C.ink, color: "#fff", fontFamily: BVP, fontWeight: 900, fontSize: 40, borderRadius: 999, padding: "8px 26px" }}>BƯỚC {n}</div>
        <div style={{ fontFamily: BVP, fontWeight: 900, fontSize: 46, color }}>{title}</div>
      </div>
    </div>
  );
};

/** Brand-ish wordmark tiles (plain text marks, no official logos) */
export const Brand: React.FC<{ name: string; size?: number }> = ({ name, size = 44 }) => {
  const map: Record<string, { bg: string; fg: string; mark: string }> = {
    Claude: { bg: "#FAF3EC", fg: C.claude, mark: "✳" },
    ElevenLabs: { bg: "#111", fg: "#fff", mark: "II" },
    "Google Flow": { bg: "#fff", fg: C.flow, mark: "◆" },
    Remotion: { bg: "#fff", fg: C.remotion, mark: "▶" },
    "Prompt phong cách": { bg: C.ink, fg: "#FFD23F", mark: "✦" },
  };
  const b = map[name] ?? { bg: "#fff", fg: C.ink, mark: "•" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: b.bg, color: b.fg, borderRadius: 26, padding: `${size * 0.45}px ${size * 0.6}px`, fontFamily: BVP, fontWeight: 900, fontSize: size, boxShadow: "0 14px 30px rgba(0,0,0,.22)", whiteSpace: "nowrap" }}>
      <span style={{ fontSize: size * 1.05 }}>{b.mark}</span>{name}
    </div>
  );
};
