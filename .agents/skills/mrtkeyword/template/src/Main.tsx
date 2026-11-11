import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import data from "./data.json";
import { C, FPS, MONT, Sticker, pop, ramp, stickerSize } from "./ui";
import { ThumbArt } from "./Thumb";
import sfxPlan from "./sfx.json";
import { CmdPill, HEAD, Vid, headAt } from "./fx/common";
import { FX } from "./fx/library";

/* Generic keyword-fx video. Everything comes from src/data.json, written by scripts/build_data.py from
   work/plan.json (which keyword on which A-roll segment, cue words, content) + the assembled timeline. */

const D = data as any;
const F = (s: number) => Math.round(s * FPS);
const LAYOUT: Record<string, string> = D.layouts ?? {}; // keyword -> full | half | cutout | circle

export const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const list = [
      new FontFace("BVP", `url(${staticFile("fonts/BeVietnamPro-Black.ttf")})`, { weight: "900" }),
      new FontFace("BVP", `url(${staticFile("fonts/BeVietnamPro-ExtraBold.ttf")})`, { weight: "800" }),
      new FontFace("BVP", `url(${staticFile("fonts/BeVietnamPro-SemiBold.ttf")})`, { weight: "600" }),
      new FontFace("Mont", `url(${staticFile("fonts/Montserrat-Variable.ttf")})`, { weight: "100 900" }),
      new FontFace("MontBlack", `url(${staticFile("fonts/Montserrat-Black.ttf")})`, { weight: "900" }),
    ];
    Promise.all(list.map((f) => f.load().then((x) => (document as any).fonts.add(x))))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};

/* hard punch-ins per clip: data.punch = {"01": [[t, zoom], …]} */
const zoomAt = (id: string, t: number) => {
  let z = 1;
  for (const [t0, v] of (D.punch?.[id] ?? []) as [number, number][]) if (t >= t0) z = v;
  return z;
};

/* stickers on A-roll never cover the face: above the head if it fits, else in the chest band above captions */
const TOP_SAFE = 120, CAPTION_TOP = 1420, GAP = 36;
const FaceSafeSticker: React.FC<React.ComponentProps<typeof Sticker> & { clip: string }> = ({ clip, ...p }) => {
  const head = headAt(clip, zoomAt(clip, p.t));
  let size = p.size ?? 96;
  let h = stickerSize(p.text, size).height;
  if (head.y0 - GAP - TOP_SAFE >= h) return <Sticker {...p} size={size} y={head.y0 - GAP - h} />;
  const band = CAPTION_TOP - (head.y1 + GAP);
  while (h > band && size > 60) h = stickerSize(p.text, (size -= 4)).height;
  return <Sticker {...p} size={size} y={head.y1 + GAP + Math.max(0, (band - h) / 2)} />;
};

const fxOf = (id: string) => (D.fx as any[]).find((f) => f.seg === id);

const Segment: React.FC<{ s: any; t: number }> = ({ s, t }) => {
  const f = fxOf(s.id);
  const z = zoomAt(s.id, t);
  const Comp = f && FX[f.fx];
  if (!Comp) return <Vid s={s} z={z} />;
  return <Comp t={t} s={s} c={f.cues ?? {}} p={f.params ?? {}} z={z} />;
};

/* the "#n /effects keyword" bar: chest band for full layouts, above the head for half cards */
const pillY = (f: any) => (LAYOUT[f.fx] === "half" ? Math.min(560, 520 + (HEAD[f.seg]?.y0 ?? 250) - 110) : 1300);

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const c = (D.captions as any[]).find((x) => t >= x.s - 0.05 && t < x.e + 0.05);
  if (!c) return null;
  const p = pop(t, c.s - 0.05, 320, 18);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1440, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 64, color: "#fff", textAlign: "center", lineHeight: 1.15,
        WebkitTextStroke: "6px #13213F", paintOrder: "stroke fill", // navy outline keeps captions readable on light voice-over cards too
        textShadow: "0 4px 10px rgba(0,0,0,.55), 0 0 2px rgba(0,0,0,.6)", transform: `scale(${0.85 + 0.15 * p})` }}>{String(c.text).replace(/[.,!?…:;]+$/, "")}</div>
    </div>
  );
};

const THUMB = D.cover ? 0.5 : 0;
const sfx = sfxPlan as { f: string; t: number; v: number }[];

export const Main: React.FC = () => {
  useFonts();
  const t = useCurrentFrame() / FPS;
  const cuts: number[] = D.cuts ?? [];
  const flash = Math.max(0, ...cuts.map((c) => (t >= c && t < c + 0.16 ? 1 - (t - c) / 0.16 : 0)));
  return (
    <AbsoluteFill style={{ backgroundColor: C.orange }}>
      {(D.segments as any[]).map((s) => (
        <Sequence key={s.id} from={F(s.start)} durationInFrames={F(s.end - s.start + 0.12)}>
          <Segment s={s} t={t} />
        </Sequence>
      ))}

      {(D.fx as any[]).filter((f) => f.n).map((f) => (
        <CmdPill key={f.seg} t={t} t0={f.pillAt} t1={f.pillEnd} n={f.n} kw={f.fx} y={pillY(f)} />
      ))}

      {(D.stickers as any[]).map((k, i) => (k.clip
        ? <FaceSafeSticker key={i} clip={k.clip} t={t} t0={k.t0} t1={k.t1} text={k.text} y={0} size={k.size} variant={k.variant} shake={k.shake} />
        : <Sticker key={i} t={t} t0={k.t0} t1={k.t1} text={k.text} y={k.y ?? 170} size={k.size} variant={k.variant} shake={k.shake} rotate={k.rotate} />))}

      <Captions t={t} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.55, pointerEvents: "none" }} />
      {THUMB > 0 && t < THUMB + 0.2 && (
        <AbsoluteFill style={{ opacity: 1 - ramp(t, THUMB, 0.2), transform: `scale(${1 + 0.08 * ramp(t, THUMB, 0.2)})` }}>
          <ThumbArt />
          <AbsoluteFill style={{ background: "#fff", opacity: 0.6 * ramp(t, THUMB, 0.08) }} />
        </AbsoluteFill>
      )}

      <Audio src={staticFile("master.wav")} />
      {D.hasBgm && <Audio src={staticFile("bgm.wav")} volume={0.9} />}
      {sfx.filter((s) => s.t > 0).map((s, i) => (
        <Sequence key={i} from={F(s.t)} durationInFrames={F(1.2)}>
          <Audio src={staticFile(`sfx/${s.f}.wav`)} volume={s.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
