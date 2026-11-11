import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { Thumb } from "./Thumb";
import data from "./data.json";

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.max(1, Math.round((data as any).duration * 30))} fps={30} width={1080} height={1920} />
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
