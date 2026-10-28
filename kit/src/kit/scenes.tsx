import { getLength, getPointAtLength } from "@remotion/paths";
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { Sketch, sk, usePop } from "./sketch";

// Cenas desenhadas sob encomenda do Diretor (Designer, 27/10/2026). Coordenadas do palco, `start` = frame de entrada.
type Base = { start: number; x: number; y: number; seed?: number };
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = { ...clamp, easing: Easing.out(Easing.cubic) };

const Txt: React.FC<{ x?: number; y?: number; size: number; font?: string; weight?: number; fill?: string; anchor?: "start" | "middle" | "end"; children: React.ReactNode }> = ({
  x = 0, y = 0, size, font = F.display, weight = 800, fill = C.ink, anchor = "middle", children,
}) => (
  <text x={x} y={y} fontFamily={font} fontWeight={weight} fontSize={size} fill={fill} textAnchor={anchor} dominantBaseline="middle">{children}</text>
);

// ---------- escada de salarios: cada degrau sobe quando o valor e falado ----------
export const SalaryLadder: React.FC<Base & { steps: { label: string; value: string; h: number; at: number; kind?: "gain" | "alert" | "ink" }[]; w?: number; h?: number; title?: string }> = ({
  start, x, y, steps, w = 620, h = 380, title, seed = 801,
}) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const n = steps.length, gap = 14, bw = (w - gap * (n - 1)) / n;
  const live = steps.filter((s) => f >= s.at);
  const last = live[live.length - 1];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {title && <Txt y={-h / 2 - 70} size={34} fill={C.inkSoft}>{title}</Txt>}
      <Sketch paths={sk.line(-w / 2 - 10, h / 2, w / 2 + 10, h / 2, { seed, strokeWidth: 4 })} />
      {steps.map((s, i) => {
        if (f < s.at) return null;
        const t = interpolate(f, [s.at, s.at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
        const bh = Math.max(8, s.h * h * t);
        const bx = -w / 2 + i * (bw + gap);
        const col = s.kind === "alert" ? C.alert : s.kind === "ink" ? C.inkSoft : C.gain;
        const isLast = s === last;
        return (
          <g key={i}>
            <Sketch paths={sk.rect(bx, h / 2 - bh, bw, bh, { seed: seed + i, fill: col, fillStyle: "hachure", stroke: col, strokeWidth: 3, roughness: 1.2 })} />
            <Sketch paths={sk.rect(bx, h / 2 - bh, bw, bh, { seed: seed + 20 + i, stroke: C.ink, strokeWidth: 3, roughness: 0.9 })} />
            <g opacity={t}>
              {isLast && <rect x={bx - 6} y={h / 2 - bh - 64} width={bw + 12} height={46} fill={C.marker} transform={`skewX(-6)`} />}
              <Txt x={bx + bw / 2} y={h / 2 - bh - 40} size={bw > 110 ? 34 : bw > 90 ? 28 : 24} font={F.mono} weight={700} fill={C.ink}>{s.value}</Txt>
              <Txt x={bx + bw / 2} y={h / 2 + 34} size={bw > 110 ? 28 : 24} font={F.hand} weight={700} fill={C.inkSoft}>{s.label}</Txt>
            </g>
          </g>
        );
      })}
    </g>
  );
};

// ---------- relogio de 24h: as horas do dia vao sendo tomadas ----------
export const DayClock: React.FC<Base & { arcs: { from: number; to: number; kind: "work" | "extra" | "alert" | "rest"; label?: string; at: number }[]; r?: number; center?: string; title?: string }> = ({
  start, x, y, arcs, r = 170, center, title, seed = 811,
}) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const col = { work: C.pen, extra: C.alert, alert: C.alert, rest: C.gain } as const;
  const pt = (h: number, rr: number) => { const a = (h / 24) * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * rr, Math.sin(a) * rr] as const; };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {title && <Txt y={-r - 120} size={34} fill={C.inkSoft}>{title}</Txt>}
      <circle r={r + 14} fill={C.white} />
      <Sketch paths={sk.circle(0, 0, (r + 14) * 2, { seed, strokeWidth: 4 })} />
      {Array.from({ length: 24 }).map((_, h) => {
        const [a1, b1] = pt(h, r + 2), [a2, b2] = pt(h, h % 6 === 0 ? r - 22 : r - 10);
        return <line key={h} x1={a1} y1={b1} x2={a2} y2={b2} stroke={C.ink} strokeWidth={h % 6 === 0 ? 4 : 2} opacity={0.6} />;
      })}
      {[0, 6, 12, 18].map((h) => { const [a, b] = pt(h, r - 46); return <Txt key={h} x={a} y={b} size={26} font={F.mono} weight={700} fill={C.inkSoft}>{h === 0 ? "24h" : `${h}h`}</Txt>; })}
      {arcs.map((a, i) => {
        if (f < a.at) return null;
        const t = interpolate(f, [a.at, a.at + 10], [0, 1], ease);
        const end = a.from + (a.to - a.from) * t;
        const rr = r - 70;
        const [x1, y1] = pt(a.from, rr), [x2, y2] = pt(end, rr);
        const large = end - a.from > 12 ? 1 : 0;
        const mid = pt((a.from + a.to) / 2, r + 66);
        return (
          <g key={i}>
            <path d={`M ${x1} ${y1} A ${rr} ${rr} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={col[a.kind]} strokeWidth={46} strokeLinecap="butt" opacity={0.85} />
            {a.label && t > 0.9 && (
              <g transform={`translate(${mid[0] * 1.25} ${mid[1]})`}>
                <rect x={-a.label.length * 9 - 14} y={-24} width={a.label.length * 18 + 28} height={48} fill={col[a.kind]} />
                <Txt size={28} font={F.display} fill={C.white}>{a.label}</Txt>
              </g>
            )}
          </g>
        );
      })}
      {center && <Txt size={44} font={F.mono} weight={700}>{center}</Txt>}
    </g>
  );
};

// ---------- cupom fiscal: o que aparece e o que nao aparece na conta ----------
export const Receipt: React.FC<Base & { rows: { label: string; value: string; at: number; kind?: "zero" | "cost" }[]; title?: string; total?: { label: string; value: string; at: number }; w?: number }> = ({
  start, x, y, rows, title = "CUPOM", total, w = 500, seed = 821,
}) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const rowH = 62, h = 120 + rows.length * rowH + (total ? 100 : 30);
  const zig = (yy: number) => Array.from({ length: 16 }).map((_, i) => `L ${w - (i + 1) * (w / 16)} ${yy + (i % 2 === 0 ? 14 : 0)}`).join(" ");
  const print = interpolate(f, [start, start + 10], [0.25, 1], ease);
  return (
    <g transform={`translate(${x} ${y - h / 2}) rotate(1.5) scale(${scale})`}>
      <clipPath id={`rc${seed}`}><rect x={-20} y={-20} width={w + 40} height={(h + 40) * print} /></clipPath>
      <g clipPath={`url(#rc${seed})`} transform={`translate(${-w / 2} 0)`}>
        <path d={`M 10 12 H ${w + 10} V ${h + 12} ${zig(h).replace(/L (\S+) (\S+)/g, (_, a, b) => `L ${+a + 10} ${+b + 12}`)} Z`} fill={C.shade} />
        <path d={`M 0 0 H ${w} V ${h} ${zig(h)} Z`} fill={C.white} stroke={C.ink} strokeWidth={3} />
        <Txt x={w / 2} y={50} size={36} font={F.mono} weight={700}>{title}</Txt>
        <line x1={24} y1={88} x2={w - 24} y2={88} stroke={C.ink} strokeWidth={3} strokeDasharray="4 8" />
        {rows.map((r, i) => {
          if (f < r.at) return null;
          const t = interpolate(f, [r.at, r.at + 6], [0, 1], ease);
          const ry = 124 + i * rowH;
          const col = r.kind === "zero" ? C.gain : C.alert;
          return (
            <g key={i} opacity={t}>
              <Txt x={28} y={ry} size={30} font={F.mono} weight={500} anchor="start" fill={C.ink}>{r.label}</Txt>
              <Txt x={w - 28} y={ry} size={32} font={F.mono} weight={700} anchor="end" fill={col}>{r.value}</Txt>
            </g>
          );
        })}
        {total && f >= total.at && (
          <g opacity={interpolate(f, [total.at, total.at + 6], [0, 1], ease)}>
            <line x1={24} y1={h - 92} x2={w - 24} y2={h - 92} stroke={C.ink} strokeWidth={4} />
            <rect x={w - 28 - total.value.length * 21 - 12} y={h - 74} width={total.value.length * 21 + 24} height={50} fill={C.marker} />
            <Txt x={28} y={h - 49} size={32} font={F.mono} weight={700} anchor="start">{total.label}</Txt>
            <Txt x={w - 28} y={h - 49} size={34} font={F.mono} weight={700} anchor="end" fill={C.alert}>{total.value}</Txt>
          </g>
        )}
      </g>
    </g>
  );
};

// ---------- trajeto: o onibus atravessa o mapa rabiscado ----------
export const BusRoute: React.FC<Base & { from: string; to: string; dur?: number; note?: string; w?: number }> = ({ start, x, y, from, to, dur = 45, note, w = 560, seed = 831 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const d = `M ${-w / 2 + 30} 90 C ${-w / 4} -120, ${-40} 160, ${60} 20 S ${w / 4} -110, ${w / 2 - 30} -60`;
  const t = interpolate(f, [start + 6, start + 6 + dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const L = getLength(d);
  const p = getPointAtLength(d, t * L * 0.999) ?? { x: -w / 2 + 30, y: 90 };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Sketch paths={sk.path(d, { seed, stroke: C.inkSoft, strokeWidth: 5, roughness: 1.3 })} draw={interpolate(f, [start, start + 10], [0, 1], ease)} />
      <path d={d} fill="none" stroke={C.marker} strokeWidth={16} opacity={0.6} strokeDasharray={`${t * L} ${L * 2}`} />
      <Sketch paths={sk.circle(-w / 2 + 30, 90, 26, { seed: seed + 1, fill: C.pen, stroke: C.ink })} />
      <Sketch paths={sk.circle(w / 2 - 30, -60, 26, { seed: seed + 2, fill: C.alert, stroke: C.ink })} />
      <Txt x={-w / 2 + 30} y={150} size={32} font={F.hand} weight={700} fill={C.ink}>{from}</Txt>
      <Txt x={w / 2 - 60} y={-140} size={32} font={F.hand} weight={700} fill={C.ink}>{to}</Txt>
      <g transform={`translate(${p.x} ${p.y - 30})`}>
        <rect x={-44} y={-26} width={88} height={52} rx={10} fill={C.marker} stroke={C.ink} strokeWidth={4} />
        <rect x={-34} y={-16} width={22} height={16} fill={C.white} stroke={C.ink} strokeWidth={2} />
        <rect x={-6} y={-16} width={22} height={16} fill={C.white} stroke={C.ink} strokeWidth={2} />
        <circle cx={-24} cy={28} r={9} fill={C.ink} />
        <circle cx={24} cy={28} r={9} fill={C.ink} />
      </g>
      {note && t >= 1 && <Txt y={200} size={34} font={F.display} fill={C.alert}>{note}</Txt>}
    </g>
  );
};

// ---------- bonequinho simples (para cenas) ----------
const Stick: React.FC<{ x: number; y: number; s?: number; shirt?: string; seed: number; arm?: number }> = ({ x, y, s = 1, shirt = C.pen, seed, arm = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Sketch paths={sk.line(-14, 46, -18, 110, { seed, strokeWidth: 6 })} />
    <Sketch paths={sk.line(14, 46, 18, 110, { seed: seed + 1, strokeWidth: 6 })} />
    <Sketch paths={sk.rect(-28, -26, 56, 76, { seed, fill: shirt, roughness: 0.9 })} />
    <Sketch paths={sk.rect(-28, -26, 56, 76, { seed: seed + 2, strokeWidth: 3 })} />
    <Sketch paths={sk.line(-28, -16, -48, 34 - arm, { seed: seed + 3, strokeWidth: 6 })} />
    <Sketch paths={sk.line(28, -16, 48, 34 - arm, { seed: seed + 4, strokeWidth: 6 })} />
    <Sketch paths={sk.circle(0, -58, 58, { seed, fill: "#F2C9A0", roughness: 0.7 })} />
    <Sketch paths={sk.circle(0, -58, 58, { seed: seed + 5, strokeWidth: 3 })} />
    <circle cx={-9} cy={-60} r={3.5} fill={C.ink} /><circle cx={9} cy={-60} r={3.5} fill={C.ink} />
  </g>
);

// ---------- o buraco: voce estende a mao, a corda puxa voce para baixo ----------
export const PitRescue: React.FC<Base & { you?: string; them?: string; sinkAt?: number; caption?: string }> = ({ start, x, y, you = "VOCÊ", them = "QUEM FICOU", sinkAt, caption, seed = 841 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const rope = interpolate(f, [start + 6, start + 16], [0, 1], ease);
  const sink = sinkAt !== undefined ? interpolate(f, [sinkAt, sinkAt + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const lean = 70 * sink;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Sketch paths={sk.line(-300, 0, -90, 0, { seed, strokeWidth: 5 })} />
      <Sketch paths={sk.line(90, 0, 300, 0, { seed: seed + 1, strokeWidth: 5 })} />
      <Sketch paths={sk.path("M -90 0 C -110 120, -90 230, 0 240 C 90 230, 110 120, 90 0", { seed: seed + 2, fill: "#3B3F52", fillStyle: "hachure", stroke: C.ink, strokeWidth: 5, roughness: 1.4 })} />
      <Stick x={0} y={110} s={0.9} shirt={C.inkSoft} seed={seed + 10} arm={60} />
      <g transform={`translate(${-150 + lean * 1.2} ${-110 + lean * 1.9}) rotate(${sink * 40})`}>
        <Stick x={0} y={0} s={1} seed={seed + 20} arm={40} />
      </g>
      <Sketch paths={sk.curve([[-110 + lean * 1.2, -100 + lean * 1.9], [-40, -10 + lean], [-10, 30]], { seed: seed + 30, stroke: C.alert, strokeWidth: 6 })} draw={rope} />
      <Txt x={-150} y={58} size={26} font={F.hand} weight={700} fill={C.ink}>{you}</Txt>
      <Txt x={0} y={286} size={26} font={F.hand} weight={700} fill={C.inkSoft}>{them}</Txt>
      {caption && sink > 0.9 && <Txt x={0} y={-190} size={34} font={F.display} fill={C.alert}>{caption}</Txt>}
    </g>
  );
};

// ---------- a cabeca barulhenta: rabiscos que viram uma linha reta quando a barra sobe ----------
export const MindNoise: React.FC<Base & { quietAt?: number; label?: string; quietLabel?: string }> = ({ start, x, y, quietAt, label = "MENTE COM TDAH", quietLabel = "SILÊNCIO", seed = 851 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const q = quietAt !== undefined ? interpolate(f, [quietAt, quietAt + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const jitter = (i: number) => Math.sin(f * 0.9 + i * 1.7) * 14 * (1 - q);
  const lines = Array.from({ length: 7 }).map((_, i) => {
    const yy = -70 + i * 24;
    const pts = Array.from({ length: 9 }).map((__, k) => `${-110 + k * 27.5} ${yy * (1 - q) + (k % 2 ? 1 : -1) * (18 + (i % 3) * 6) * (1 - q) + jitter(i + k)}`);
    return `M ${pts.join(" L ")}`;
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Sketch paths={sk.path("M -150 40 C -170 -120, -40 -200, 60 -160 C 160 -130, 170 -10, 130 50 L 130 140 L -60 140 L -60 100 C -110 100, -150 80, -150 40 Z", { seed, fill: C.white, stroke: C.ink, strokeWidth: 5, roughness: 1.1 })} />
      <g transform="translate(0 -30)">
        {lines.map((d, i) => <path key={i} d={d} fill="none" stroke={q > 0.5 ? C.gain : i % 2 ? C.alert : C.pen} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />)}
      </g>
      <Txt y={210} size={30} font={F.display} fill={q > 0.5 ? C.gain : C.alert}>{q > 0.5 ? quietLabel : label}</Txt>
    </g>
  );
};

// ---------- a porta: a faculdade publica abre para as grandes empresas ----------
export const Door: React.FC<Base & { label: string; behind: string; openAt?: number; size?: number }> = ({ start, x, y, label, behind, openAt, size = 1, seed = 861 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const o = openAt !== undefined ? interpolate(f, [openAt, openAt + 12], [0, 1], ease) : 0;
  const W = 220, H = 340;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * size})`}>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} fill={C.marker} opacity={0.9} />
      <Txt x={20} y={-18} size={26} font={F.display} fill={C.ink}>{behind.split(" ")[0]}</Txt>
      <Txt x={20} y={18} size={26} font={F.display} fill={C.ink}>{behind.split(" ").slice(1).join(" ")}</Txt>
      <Sketch paths={sk.rect(-W / 2 - 16, -H / 2 - 16, W + 32, H + 16, { seed, strokeWidth: 6 })} />
      <g transform={`translate(${-W / 2} 0) scale(${1 - 0.82 * o} 1) translate(${W / 2} 0)`}>
        <Sketch paths={sk.rect(-W / 2, -H / 2, W, H, { seed: seed + 1, fill: "#C98B52", stroke: C.ink, strokeWidth: 4, roughness: 0.8 })} />
        <circle cx={W / 2 - 28} cy={10} r={9} fill={C.ink} opacity={1 - o} />
        <g opacity={1 - o}><Txt y={-60} size={30} font={F.display} fill={C.white}>{label}</Txt></g>
      </g>
      <Sketch paths={sk.line(-W / 2 - 60, H / 2, W / 2 + 60, H / 2, { seed: seed + 2, strokeWidth: 5 })} />
    </g>
  );
};
