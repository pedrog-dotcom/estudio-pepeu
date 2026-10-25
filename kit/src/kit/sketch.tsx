import { evolvePath } from "@remotion/paths";
import React from "react";
import rough from "roughjs";
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C } from "./theme";

// Traco "desenhado a caneta": roughjs gera caminhos com tremor deterministico (seed fixa = sem tremer entre frames).
const gen = rough.generator();

export type SketchOpts = { seed?: number; roughness?: number; stroke?: string; strokeWidth?: number; fill?: string; fillStyle?: string; bowing?: number };

const toPaths = (drawable: ReturnType<typeof gen.rectangle>) => gen.toPaths(drawable);

const base = (o: SketchOpts) => ({
  seed: o.seed ?? 7,
  roughness: o.roughness ?? 1.1,
  bowing: o.bowing ?? 1,
  stroke: o.stroke ?? C.ink,
  strokeWidth: o.strokeWidth ?? 4,
  fill: o.fill,
  fillStyle: (o.fillStyle as "solid" | "hachure" | undefined) ?? "solid",
  disableMultiStroke: false,
  preserveVertices: true,
});

export const sk = {
  rect: (x: number, y: number, w: number, h: number, o: SketchOpts = {}) => toPaths(gen.rectangle(x, y, w, h, base(o))),
  line: (x1: number, y1: number, x2: number, y2: number, o: SketchOpts = {}) => toPaths(gen.line(x1, y1, x2, y2, base(o))),
  circle: (x: number, y: number, d: number, o: SketchOpts = {}) => toPaths(gen.circle(x, y, d, base(o))),
  ellipse: (x: number, y: number, w: number, h: number, o: SketchOpts = {}) => toPaths(gen.ellipse(x, y, w, h, base(o))),
  curve: (pts: [number, number][], o: SketchOpts = {}) => toPaths(gen.curve(pts, base(o))),
  linear: (pts: [number, number][], o: SketchOpts = {}) => toPaths(gen.linearPath(pts, base(o))),
  path: (d: string, o: SketchOpts = {}) => toPaths(gen.path(d, base(o))),
};

type P = { d: string; stroke: string; strokeWidth: number; fill?: string };

// Desenha caminhos; com `draw` (0..1) os tracos aparecem como se a caneta estivesse escrevendo.
export const Sketch: React.FC<{ paths: P[]; draw?: number; opacity?: number }> = ({ paths, draw = 1, opacity = 1 }) => (
  <g opacity={opacity}>
    {paths.map((p, i) => {
      const filled = p.fill && p.fill !== "none";
      if (filled) return <path key={i} d={p.d} fill={p.fill} stroke="none" opacity={Math.min(1, draw * 1.4)} />;
      if (draw >= 1) return <path key={i} d={p.d} fill="none" stroke={p.stroke} strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />;
      const ev = evolvePath(Math.max(0.0001, draw), p.d);
      return (
        <path key={i} d={p.d} fill="none" stroke={p.stroke} strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
      );
    })}
  </g>
);

// Progresso de desenho a partir do frame local
export const useDraw = (startFrame: number, durFrames = 12) => {
  const f = useCurrentFrame();
  return interpolate(f, [startFrame, startFrame + durFrames], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
};

export const usePop = (startFrame: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // mola curta: entra com leve overshoot, como um adesivo colado
  const t = Math.max(0, f - startFrame);
  const x = Math.min(1, t / (0.2 * fps));
  const s = 1 - Math.pow(1 - x, 3);
  const over = Math.sin(x * Math.PI) * 0.12;
  return { scale: f < startFrame ? 0 : s + over * (1 - x), visible: f >= startFrame };
};
