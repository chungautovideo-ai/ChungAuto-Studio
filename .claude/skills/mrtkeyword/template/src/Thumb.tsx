import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import data from "./data.json";
import { useFonts } from "./Main";
import { HEAD, fitSize } from "./fx/common";
import { C, INK, MONT, STK } from "./ui";

/* Cover frame from data.cover = {label, line1, line2, tag, clip}. Person (public/thumb_face.jpg) in the lower
   half, type in the upper half; fits TikTok's centred 3:4 crop (y 240–1680): type from y 300, face above 1680. */
const SHIFT = 480;

const Out: React.FC<{ children: React.ReactNode; size: number; fill?: string; style?: React.CSSProperties }> = ({ children, size, fill = "#fff", style }) => {
  const base: React.CSSProperties = { gridArea: "1 / 1", fontFamily: STK, fontWeight: 900, fontSize: size, lineHeight: 0.95, letterSpacing: -1, whiteSpace: "nowrap" };
  return (
    <div style={{ display: "grid", ...style }}>
      <div style={{ ...base, color: INK.navy, WebkitTextStroke: `${Math.round(size / 7)}px ${INK.navy}`, filter: `drop-shadow(0 ${Math.round(size / 11)}px 0 ${INK.orange})` }}>{children}</div>
      <div style={{ ...base, color: fill, position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
};

export const Thumb: React.FC = () => {
  useFonts();
  return <ThumbArt />;
};

export const ThumbArt: React.FC = () => {
  const cv = (data as any).cover ?? { line1: "TITLE" };
  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${C.peach} 0%, #EFA766 45%, ${C.orange} 100%)` }}>
      {/* a voice-only video has no speaker clip → cover is type only (cover.clip left empty) */}
      {cv.clip && <Img src={staticFile("thumb_face.jpg")} style={{ position: "absolute", top: SHIFT, left: 0, width: 1080, height: 1920,
        WebkitMaskImage: "linear-gradient(180deg, transparent 0px, #000 260px)", maskImage: "linear-gradient(180deg, transparent 0px, #000 260px)" }} />}
      <div style={{ position: "absolute", top: 300, left: 108, right: 108, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {cv.label && <div style={{ fontFamily: MONT, fontWeight: 500, fontSize: 40, letterSpacing: "0.3em", color: INK.navy }}>{cv.label}</div>}
        <Out size={fitSize(cv.line1 ?? "", 190, 860)} style={{ marginTop: 26 }}>{cv.line1}</Out>
        {cv.line2 && <Out size={fitSize(cv.line2, 150, 860)} fill={INK.yellow} style={{ marginTop: 14 }}>{cv.line2}</Out>}
        {cv.tag && (
          <div style={{ marginTop: 34, transform: "rotate(-5deg)", fontFamily: STK, fontSize: fitSize(cv.tag, 84, 800), color: "#fff", background: INK.blue, padding: "8px 26px 4px",
            borderRadius: 18, border: "5px solid #fff", boxShadow: `0 8px 0 ${INK.navy}`, whiteSpace: "nowrap" }}>{cv.tag}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
export { HEAD };
