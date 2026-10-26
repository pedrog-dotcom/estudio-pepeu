import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C, F, brl } from "./theme";
import { Sketch, sk, useDraw, usePop } from "./sketch";

// Todos os elementos desenham em coordenadas do palco (1080 x 860) e recebem `start` = frame de entrada.
type Base = { start: number; x: number; y: number; seed?: number };

const Pop: React.FC<{ start: number; x: number; y: number; rot?: number; children: React.ReactNode }> = ({ start, x, y, rot = 0, children }) => {
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>{children}</g>;
};

const Txt: React.FC<{ x?: number; y?: number; size: number; font?: string; weight?: number; fill?: string; anchor?: "start" | "middle" | "end"; children: React.ReactNode; ls?: number }> = ({
  x = 0, y = 0, size, font = F.display, weight = 800, fill = C.ink, anchor = "middle", children, ls = 0,
}) => (
  <text x={x} y={y} fontFamily={font} fontWeight={weight} fontSize={size} fill={fill} textAnchor={anchor} dominantBaseline="middle" letterSpacing={ls}>
    {children}
  </text>
);

// Etiqueta de papel (nome de personagem, rotulo)
export const Tag: React.FC<Base & { text: string; variant?: "paper" | "ink" | "marker"; size?: number; rot?: number }> = ({ start, x, y, text, variant = "paper", size: size0 = 34, rot = -2, seed = 3 }) => {
  // caixa alta da fonte display e mais larga: folga para o texto nao encostar na borda;
  // texto longo encolhe para a etiqueta caber na area segura do palco (560 de largura)
  const caps = text === text.toUpperCase();
  const k = caps ? 0.7 : 0.6;
  const size = Math.min(size0, (540 - 48) / (text.length * k));
  const w = text.length * size * k + 48;
  const h = size * 1.55;
  const bg = variant === "ink" ? C.ink : variant === "marker" ? C.marker : C.white;
  const fg = variant === "ink" ? C.white : C.ink;
  return (
    <Pop start={start} x={x} y={y} rot={rot}>
      <rect x={-w / 2 + 5} y={-h / 2 + 6} width={w} height={h} fill={C.shade} />
      <Sketch paths={sk.rect(-w / 2, -h / 2, w, h, { seed, fill: bg, roughness: 0.6 })} />
      <Sketch paths={sk.rect(-w / 2, -h / 2, w, h, { seed, stroke: C.ink, strokeWidth: 3, roughness: 0.8 })} />
      <Txt size={size} fill={fg}>{text}</Txt>
    </Pop>
  );
};

// Personagem rabiscado com plaquinha de nome. O "VOCÊ" e o protagonista fixo das explicacoes.
export const Person: React.FC<Base & { label: string; shirt?: string; mood?: "neutro" | "feliz" | "triste"; scale?: number }> = ({
  start, x, y, label, shirt = C.pen, mood = "neutro", scale = 1, seed = 11,
}) => {
  const mouth = mood === "feliz" ? "M -12 6 Q 0 18 12 6" : mood === "triste" ? "M -12 14 Q 0 4 12 14" : "M -10 10 L 10 10";
  return (
    <Pop start={start} x={x} y={y}>
      <g transform={`scale(${scale})`}>
        <Sketch paths={sk.line(-18, 60, -24, 150, { seed, strokeWidth: 7 })} />
        <Sketch paths={sk.line(18, 60, 24, 150, { seed: seed + 1, strokeWidth: 7 })} />
        <Sketch paths={sk.rect(-38, -40, 76, 104, { seed, fill: shirt, roughness: 0.9 })} />
        <Sketch paths={sk.rect(-38, -40, 76, 104, { seed, strokeWidth: 4 })} />
        <Sketch paths={sk.line(-38, -26, -62, 40, { seed: seed + 2, strokeWidth: 7 })} />
        <Sketch paths={sk.line(38, -26, 62, 40, { seed: seed + 3, strokeWidth: 7 })} />
        <Sketch paths={sk.circle(0, -82, 78, { seed, fill: "#F2C9A0", roughness: 0.7 })} />
        <Sketch paths={sk.circle(0, -82, 78, { seed, strokeWidth: 4 })} />
        <Sketch paths={sk.path("M -38 -96 Q -30 -132 0 -128 Q 32 -132 38 -96 Q 20 -112 -38 -96 Z", { seed, fill: C.ink, roughness: 0.5 })} />
        <circle cx={-13} cy={-84} r={4.5} fill={C.ink} />
        <circle cx={13} cy={-84} r={4.5} fill={C.ink} />
        <g transform="translate(0 -84)"><path d={mouth} stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" /></g>
      </g>
      <Tag start={start + 4} x={0} y={190 * scale} text={label} variant="paper" size={30} rot={0} />
    </Pop>
  );
};

// Post-it com anotacao a mao
export const PostIt: React.FC<Base & { text: string; color?: keyof typeof POSTIT; w?: number; rot?: number }> = ({ start, x, y, text, color = "yellow", w = 250, rot = -4, seed = 5 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < start) return null;
  const t = Math.min(1, (f - start) / (0.22 * fps));
  const drop = interpolate(t, [0, 1], [-70, 0], { easing: Easing.out(Easing.back(1.6)) });
  const r = interpolate(t, [0, 1], [rot - 10, rot]);
  // quebra e tamanho seguem a largura do post-it: o texto nunca vaza da folha
  const lines = wrap(text, Math.max(6, Math.floor(w / 19)));
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(44, Math.floor((w - 28) / (longest * 0.5)));
  return (
    <g transform={`translate(${x} ${y + drop}) rotate(${r})`} opacity={Math.min(1, t * 3)}>
      <rect x={-w / 2 + 8} y={-w / 2 + 12} width={w} height={w} fill={C.shade} />
      <rect x={-w / 2} y={-w / 2} width={w} height={w} fill={POSTIT[color]} />
      <rect x={-w / 2} y={-w / 2} width={w} height={26} fill="rgba(0,0,0,0.06)" />
      {lines.map((ln, i) => (
        <Txt key={i} y={(i - (lines.length - 1) / 2) * size * 1.14 + 8} size={size} font={F.hand} weight={700}>{ln}</Txt>
      ))}
    </g>
  );
};
const POSTIT = { yellow: C.postitYellow, pink: C.postitPink, blue: C.postitBlue, green: C.postitGreen };

// Carimbo de borracha que "bate" no papel
export const Stamp: React.FC<Base & { text: string; color?: string; rot?: number; size?: number }> = ({ start, x, y, text, color = C.alert, rot = -8, size = 64, seed = 9 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < start) return null;
  const t = Math.min(1, (f - start) / (0.12 * fps));
  const s = interpolate(t, [0, 1], [1.9, 1], { easing: Easing.in(Easing.quad) });
  const w = text.length * size * 0.66 + 60;
  const h = size * 1.7;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={interpolate(t, [0, 0.5, 1], [0, 0.9, 0.92])}>
      <Sketch paths={sk.rect(-w / 2, -h / 2, w, h, { seed, stroke: color, strokeWidth: 7, roughness: 1.6 })} />
      <Sketch paths={sk.rect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, { seed: seed + 1, stroke: color, strokeWidth: 3, roughness: 1.4 })} />
      <Txt size={size} fill={color} ls={2}>{text}</Txt>
    </g>
  );
};

// Pino de mapa com local
export const Pin: React.FC<Base & { label: string; color?: string }> = ({ start, x, y, label, color = C.alert, seed = 21 }) => (
  <Pop start={start} x={x} y={y}>
    <Sketch paths={sk.path("M 0 0 C -46 -60 -40 -120 0 -120 C 40 -120 46 -60 0 0 Z", { seed, fill: color, roughness: 0.6 })} />
    <Sketch paths={sk.path("M 0 0 C -46 -60 -40 -120 0 -120 C 40 -120 46 -60 0 0 Z", { seed, strokeWidth: 4 })} />
    <circle cx={0} cy={-78} r={15} fill={C.white} />
    <Tag start={0} x={0} y={44} text={label} size={30} rot={2} />
  </Pop>
);

// Seta de caneta que se desenha
export const Arrow: React.FC<{ start: number; from: [number, number]; to: [number, number]; bend?: number; color?: string; label?: string; seed?: number; dur?: number }> = ({
  start, from, to, bend = -60, color = C.pen, label, seed = 31, dur = 10,
}) => {
  const draw = useDraw(start, dur);
  const f = useCurrentFrame();
  if (f < start) return null;
  const mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2 + bend;
  const body = sk.curve([from, [mx, my], to], { seed, stroke: color, strokeWidth: 6, roughness: 0.8 });
  const ang = Math.atan2(to[1] - my, to[0] - mx);
  const a1: [number, number] = [to[0] - 34 * Math.cos(ang - 0.45), to[1] - 34 * Math.sin(ang - 0.45)];
  const a2: [number, number] = [to[0] - 34 * Math.cos(ang + 0.45), to[1] - 34 * Math.sin(ang + 0.45)];
  return (
    <g>
      <Sketch paths={body} draw={draw} />
      {draw > 0.95 && <Sketch paths={sk.linear([a1, to, a2], { seed, stroke: color, strokeWidth: 6, roughness: 0.6 })} />}
      {label && draw > 0.6 && (
        <Txt x={mx} y={my - 26} size={40} font={F.hand} weight={700} fill={color}>{label}</Txt>
      )}
    </g>
  );
};

// Grafico de linha em quadro de papel: a linha se desenha com a fala
export const LineChart: React.FC<Base & { w?: number; h?: number; points: number[]; title?: string; color?: string; endLabel?: string; dur?: number }> = ({
  start, x, y, w = 460, h = 300, points, title, color = C.gain, endLabel, seed = 41, dur = 18,
}) => {
  const draw = useDraw(start + 3, dur);
  const pts: [number, number][] = points.map((v, i) => [24 + (i / (points.length - 1)) * (w - 48), h - 24 - v * (h - 70)]);
  const end = pts[pts.length - 1];
  return (
    <Pop start={start} x={x} y={y} rot={-1.5}>
      <g transform={`translate(${-w / 2} ${-h / 2})`}>
        <rect x={8} y={10} width={w} height={h} fill={C.shade} />
        <rect width={w} height={h} fill={C.white} />
        {Array.from({ length: Math.floor(w / 28) }).map((_, i) => <line key={`v${i}`} x1={i * 28} y1={0} x2={i * 28} y2={h} stroke={C.grid} strokeWidth={1.5} />)}
        {Array.from({ length: Math.floor(h / 28) }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 28} x2={w} y2={i * 28} stroke={C.grid} strokeWidth={1.5} />)}
        <Sketch paths={sk.linear([[24, 30], [24, h - 24], [w - 18, h - 24]], { seed, strokeWidth: 4 })} />
        {title && <Txt x={w / 2} y={34} size={30}>{title}</Txt>}
        <Sketch paths={sk.linear(pts, { seed: seed + 1, stroke: color, strokeWidth: 9, roughness: 0.7 })} draw={draw} />
        {draw > 0.98 && <circle cx={end[0]} cy={end[1]} r={11} fill={color} />}
        {endLabel && draw > 0.98 && <Txt x={end[0] - 10} y={end[1] < h * 0.45 ? end[1] + 52 : end[1] - 40} size={40} font={F.mono} weight={700} fill={color} anchor="end">{endLabel}</Txt>}
      </g>
    </Pop>
  );
};

// Barras que crescem (comparacoes: tempo, dinheiro, energia)
export const Bars: React.FC<Base & { bars: { label: string; value: number; color?: string; note?: string }[]; max?: number; w?: number; h?: number; title?: string }> = ({
  start, x, y, bars, max, w = 420, h = 300, title, seed = 51,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < start) return null;
  const m = max ?? Math.max(...bars.map((b) => b.value));
  const bw = (w - 40 * (bars.length + 1)) / bars.length;
  return (
    <g transform={`translate(${x - w / 2} ${y - h / 2})`}>
      {title && <Txt x={w / 2} y={-10} size={30}>{title}</Txt>}
      <Sketch paths={sk.line(0, h, w, h, { seed, strokeWidth: 5 })} />
      {bars.map((b, i) => {
        const t = interpolate(f, [start + i * 3, start + i * 3 + 0.28 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        const bh = (b.value / m) * (h - 60) * t;
        const bx = 40 + i * (bw + 40);
        return (
          <g key={i}>
            {bh > 2 && <Sketch paths={sk.rect(bx, h - bh, bw, bh, { seed: seed + i, fill: b.color ?? C.pen, fillStyle: "solid", roughness: 0.8 })} />}
            {bh > 2 && <Sketch paths={sk.rect(bx, h - bh, bw, bh, { seed: seed + i, strokeWidth: 4, roughness: 0.8 })} />}
            {t > 0.9 && b.note && <Txt x={bx + bw / 2} y={h - bh - 30} size={34} font={F.mono} weight={700}>{b.note}</Txt>}
            <Txt x={bx + bw / 2} y={h + 34} size={28}>{b.label}</Txt>
          </g>
        );
      })}
    </g>
  );
};

// Checklist: cada item entra no seu tempo e recebe check ou X
export const Checklist: React.FC<Base & { title?: string; items: { text: string; at: number; state: "ok" | "falha" | "aberto" }[]; w?: number }> = ({ start, x, y, title, items, w = 480, seed = 61 }) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const rowH = 76;
  const h = (title ? 80 : 30) + items.length * rowH;
  return (
    <Pop start={start} x={x} y={y} rot={1}>
      <g transform={`translate(${-w / 2} ${-h / 2})`}>
        <rect x={8} y={10} width={w} height={h} fill={C.shade} />
        <rect width={w} height={h} fill={C.white} />
        {title && <Txt x={w / 2} y={42} size={34}>{title}</Txt>}
        {items.map((it, i) => {
          if (f < it.at) return null;
          const ry = (title ? 80 : 30) + i * rowH + rowH / 2;
          const mark = (f - it.at) / 6;
          return (
            <g key={i}>
              <Sketch paths={sk.rect(28, ry - 22, 44, 44, { seed: seed + i, strokeWidth: 4 })} />
              {it.state === "ok" && <Sketch paths={sk.linear([[34, ry], [48, ry + 16], [78, ry - 26]], { seed: seed + i, stroke: C.gain, strokeWidth: 8 })} draw={Math.min(1, mark)} />}
              {it.state === "falha" && (
                <>
                  <Sketch paths={sk.line(32, ry - 18, 68, ry + 18, { seed: seed + i, stroke: C.alert, strokeWidth: 8 })} draw={Math.min(1, mark * 2)} />
                  <Sketch paths={sk.line(68, ry - 18, 32, ry + 18, { seed: seed + i + 9, stroke: C.alert, strokeWidth: 8 })} draw={Math.max(0, Math.min(1, mark * 2 - 1))} />
                </>
              )}
              <Txt x={96} y={ry + 2} size={40} font={F.hand} weight={700} anchor="start" fill={it.state === "falha" ? C.inkSoft : C.ink}>{it.text}</Txt>
            </g>
          );
        })}
      </g>
    </Pop>
  );
};

// Celula de planilha com barra de formula: assinatura de quem vive no Excel
export const Cell: React.FC<Base & { ref_: string; formula: string; value: string; color?: string; w?: number }> = ({ start, x, y, ref_, formula, value, color = C.gain, w = 600 }) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const typed = Math.max(0, Math.min(formula.length, Math.floor((f - start - 3) / 1)));
  const done = typed >= formula.length;
  return (
    <Pop start={start} x={x} y={y}>
      <g transform={`translate(${-w / 2} -95)`}>
        <rect x={8} y={10} width={w} height={190} fill={C.shade} />
        <rect width={w} height={190} fill={C.white} stroke={C.gridStrong} strokeWidth={3} />
        <rect width={w} height={64} fill="#F6F8FA" stroke={C.gridStrong} strokeWidth={3} />
        <rect width={110} height={64} fill="#E9EEF2" stroke={C.gridStrong} strokeWidth={3} />
        <Txt x={55} y={33} size={30} font={F.mono} weight={700}>{ref_}</Txt>
        <Txt x={130} y={33} size={30} font={F.mono} weight={500} anchor="start" fill={C.inkSoft}>fx</Txt>
        <Txt x={180} y={33} size={30} font={F.mono} weight={700} anchor="start">{formula.slice(0, typed)}{!done && (f % 16 < 8) ? "|" : ""}</Txt>
        <rect x={110} y={84} width={w - 140} height={86} fill={done ? "#EAF6EF" : C.white} stroke={done ? color : C.gridStrong} strokeWidth={done ? 6 : 3} />
        {done && <Txt x={110 + (w - 140) / 2} y={128} size={54} font={F.mono} weight={700} fill={color}>{value}</Txt>}
      </g>
    </Pop>
  );
};

// Contador de dinheiro que rola ate o valor
export const Counter: React.FC<Base & { from: number; to: number; dur?: number; color?: string; size?: number; label?: string }> = ({ start, x, y, from, to, dur = 18, color = C.gain, size = 92, label }) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const t = interpolate(f, [start, start + dur], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <Pop start={start} x={x} y={y}>
      {label && <Txt y={-size * 0.95} size={32}>{label}</Txt>}
      <Txt size={size} font={F.mono} weight={700} fill={color}>{brl(from + (to - from) * t)}</Txt>
    </Pop>
  );
};

// Frase-tese: o que NAO e (riscado) e o que E (marcado)
export const Thesis: React.FC<Base & { not: string; is: string; at2?: number }> = ({ start, x, y, not, is, at2 }) => {
  const f = useCurrentFrame();
  const strike = useDraw(start + 4, 8);
  if (f < start) return null;
  const second = at2 ?? start + 14;
  const wNot = not.length * 30;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Txt y={-50} size={52} fill={C.inkSoft}>{not}</Txt>
      <Sketch paths={sk.line(-wNot / 2 - 10, -46, wNot / 2 + 10, -54, { seed: 71, stroke: C.alert, strokeWidth: 8 })} draw={strike} />
      {f >= second && <Tag start={second} x={0} y={40} text={is} variant="marker" size={58} rot={-2} />}
    </g>
  );
};

const wrap = (s: string, n: number) => {
  const out: string[] = []; let cur = "";
  for (const w of s.split(" ")) {
    if ((cur + " " + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  if (cur) out.push(cur);
  return out;
};
