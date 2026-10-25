import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ICONS } from "./icons";
import { C, F, brl } from "./theme";
import { Sketch, sk, usePop } from "./sketch";

// Elementos de narrativa por tema + icones animados. Coordenadas do palco, `start` = frame de entrada.
type Base = { start: number; x: number; y: number; seed?: number };

const FONT = { mono: F.mono, display: F.display, hand: F.hand } as const;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const Txt: React.FC<{ x?: number; y?: number; size: number; font?: string; weight?: number; fill?: string; anchor?: "start" | "middle" | "end"; children: React.ReactNode }> = ({
  x = 0, y = 0, size, font = F.display, weight = 800, fill = C.ink, anchor = "middle", children,
}) => (
  <text x={x} y={y} fontFamily={font} fontWeight={weight} fontSize={size} fill={fill} textAnchor={anchor} dominantBaseline="middle">{children}</text>
);

// ---------- icone: o traco se desenha e a cor entra ----------
const iconCache: Record<string, ReturnType<(typeof ICONS)[string]["draw"]>> = {};
const artOf = (name: string) => (iconCache[name] ??= (ICONS[name] ?? ICONS.lampada).draw());

export const IconArt: React.FC<{ name: string; draw?: number }> = ({ name, draw = 1 }) => {
  const art = artOf(name);
  return (
    <g>
      <Sketch paths={art.paths} draw={draw} />
      {draw > 0.75 && art.texts.map((t, i) => (
        <text key={i} x={t.x} y={t.y} fontFamily={FONT[t.font]} fontWeight={800} fontSize={t.size} fill={t.fill} textAnchor="middle" dominantBaseline="middle">{t.text}</text>
      ))}
    </g>
  );
};

export const Icon: React.FC<Base & { name: string; size?: number; label?: string; rot?: number }> = ({ start, x, y, name, size = 1, label, rot = 0 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const draw = interpolate(f, [start, start + 8], [0.15, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale * size})`}>
      <g transform="translate(-60 -60)"><IconArt name={name} draw={draw} /></g>
      {label && <Txt y={82} size={30} font={F.hand} weight={700} fill={C.inkSoft}>{label}</Txt>}
    </g>
  );
};

// linha/grade de icones que entram em sequencia (listas faladas: "trabalho, estudo e treino")
export const IconRow: React.FC<Base & { items: { name: string; label?: string; at?: number }[]; cols?: number; gap?: number; rowGap?: number; size?: number }> = ({
  start, x, y, items, cols = 4, gap = 150, rowGap = 170, size = 0.82,
}) => {
  const rows = Math.ceil(items.length / cols);
  return (
    <g>
      {items.map((it, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const inRow = Math.min(cols, items.length - r * cols);
        const cx = x + (c - (inRow - 1) / 2) * gap;
        const cy = y + (r - (rows - 1) / 2) * rowGap;
        return <Icon key={i} start={it.at ?? start + i * 4} x={cx} y={cy} name={it.name} label={it.label} size={size} />;
      })}
    </g>
  );
};

// ---------- TDAH: abas de navegador que nao param de abrir ----------
export const Tabs: React.FC<Base & { tabs: { label: string; at: number }[]; w?: number; title?: string }> = ({ start, x, y, tabs, w = 620, title, seed = 701 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const open = tabs.filter((t) => f >= t.at);
  const tabW = Math.min(170, (w - 20) / Math.max(1, open.length));
  const colors = [C.postitPink, C.postitBlue, C.marker, C.postitGreen];
  const h = 300;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g transform={`translate(${-w / 2} ${-h / 2})`}>
        <rect x={8} y={10} width={w} height={h} fill={C.shade} />
        <rect width={w} height={h} fill={C.white} />
        <Sketch paths={sk.rect(0, 0, w, h, { seed, strokeWidth: 4, roughness: 0.6 })} />
        {open.map((t, i) => {
          const pop = interpolate(f, [t.at, t.at + 5], [0.3, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
          const tx = 10 + i * tabW;
          return (
            <g key={i} transform={`translate(${tx + tabW / 2} 30) scale(${pop}) translate(${-tabW / 2} -22)`}>
              <rect width={tabW - 6} height={44} fill={colors[i % 4]} stroke={C.ink} strokeWidth={3} />
              {tabW > 70 && <Txt x={(tabW - 6) / 2 - 8} y={23} size={Math.min(24, tabW / 6)} font={F.hand} weight={700}>{t.label.slice(0, Math.floor(tabW / 13))}</Txt>}
              <Txt x={tabW - 20} y={23} size={20} fill={C.inkSoft}>×</Txt>
            </g>
          );
        })}
        <line x1={0} y1={56} x2={w} y2={56} stroke={C.ink} strokeWidth={3} />
        {title && <Txt x={w / 2} y={170} size={46}>{title}</Txt>}
        {open.length >= 5 && (
          <g transform={`translate(${w - 20} -10)`}>
            <circle r={34} fill={C.alert} stroke={C.ink} strokeWidth={3} />
            <Txt size={30} font={F.mono} fill={C.white}>{open.length}</Txt>
          </g>
        )}
      </g>
    </g>
  );
};

// ---------- TDAH: bateria de energia/foco que enche ou esvazia ----------
export const Battery: React.FC<Base & { from: number; to: number; dur?: number; label?: string }> = ({ start, x, y, from, to, dur = 24, label, seed = 711 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const lv = interpolate(f, [start + 4, start + 4 + dur], [from, to], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const col = lv < 0.3 ? C.alert : lv < 0.6 ? C.marker : C.gain;
  const w = 360, h = 170;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {label && <Txt y={-h / 2 - 40} size={36}>{label}</Txt>}
      <rect x={-w / 2 + 12} y={-h / 2 + 18} width={(w - 24) * lv} height={h - 36} fill={col} />
      <Sketch paths={sk.rect(-w / 2, -h / 2, w, h, { seed, strokeWidth: 7, roughness: 0.6 })} />
      <Sketch paths={sk.rect(w / 2, -32, 26, 64, { seed: seed + 1, fill: C.ink, roughness: 0.4 })} />
      <Txt y={4} size={64} font={F.mono} fill={C.ink}>{Math.round(lv * 100)}%</Txt>
    </g>
  );
};

// ---------- foco/estudos: timer pomodoro que gira ----------
export const Timer: React.FC<Base & { minutes?: number; dur?: number; label?: string }> = ({ start, x, y, minutes = 25, dur = 36, label }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const t = interpolate(f, [start + 4, start + 4 + dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const r = 120;
  const left = minutes * 60 * (1 - t);
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(Math.floor(left % 60)).padStart(2, "0");
  const ang = t * Math.PI * 2;
  const end = [Math.sin(ang) * r, -Math.cos(ang) * r];
  const arc = t >= 0.999 ? `M 0 ${-r} A ${r} ${r} 0 1 1 -0.01 ${-r} Z` : `M 0 0 L 0 ${-r} A ${r} ${r} 0 ${t > 0.5 ? 1 : 0} 1 ${end[0]} ${end[1]} Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r={r + 10} fill={C.white} />
      <path d={arc} fill={C.alert} opacity={0.9} />
      <Sketch paths={sk.circle(0, 0, (r + 10) * 2, { seed: 721, strokeWidth: 7 })} />
      <Sketch paths={sk.rect(-18, -r - 38, 36, 22, { seed: 722, fill: C.ink })} />
      <rect x={-92} y={-30} width={184} height={64} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <Txt y={3} size={48} font={F.mono}>{mm}:{ss}</Txt>
      {label && <Txt y={r + 60} size={36}>{label}</Txt>}
    </g>
  );
};

// ---------- jornada: escada de carreira, cada degrau no seu tempo ----------
export const Stairs: React.FC<Base & { steps: { label: string; at: number }[]; w?: number; h?: number; flag?: boolean }> = ({ start, x, y, steps, w = 680, h = 400, flag = true, seed = 731 }) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const n = steps.length, sw = w / n, sh = h / n;
  return (
    <g transform={`translate(${x - w / 2} ${y + h / 2})`}>
      {steps.map((s, i) => {
        if (f < s.at) return null;
        const pop = interpolate(f, [s.at, s.at + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
        const bx = i * sw, bh = (i + 1) * sh;
        return (
          <g key={i} transform={`translate(${bx} 0) scale(1 ${pop})`}>
            <Sketch paths={sk.rect(0, -bh, sw, bh, { seed: seed + i, fill: i === n - 1 ? C.postitGreen : C.white, roughness: 0.6 })} />
            <Sketch paths={sk.rect(0, -bh, sw, bh, { seed: seed + i, strokeWidth: 4, roughness: 0.7 })} />
            {pop > 0.9 && <Txt x={sw / 2} y={-bh + 32} size={Math.min(30, sw / 5.5)} font={F.hand} weight={700}>{s.label}</Txt>}
          </g>
        );
      })}
      {flag && f >= steps[n - 1].at + 4 && (
        <g transform={`translate(${w - sw / 2} ${-h - 4})`}>
          <Sketch paths={sk.line(0, 0, 0, -90, { seed: seed + 50, strokeWidth: 5 })} />
          <Sketch paths={sk.path("M0 -90 L56 -74 L0 -56 Z", { seed: seed + 51, fill: C.alert, roughness: 0.5 })} />
          <Sketch paths={sk.path("M0 -90 L56 -74 L0 -56 Z", { seed: seed + 51, strokeWidth: 4 })} />
        </g>
      )}
    </g>
  );
};

// ---------- powerlifting: anilhas entram na barra e o total soma ----------
export const Barbell: React.FC<Base & { plates: { kg: number; at: number }[]; bar?: number; label?: string; pr?: boolean; size?: number }> = ({ start, x, y, plates, bar = 20, label, pr = false, seed = 741, size = 1 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const colorOf = (kg: number) => (kg >= 25 ? C.alert : kg >= 20 ? C.pen : kg >= 15 ? C.marker : kg >= 10 ? C.gain : C.white);
  const on = plates.filter((p) => f >= p.at);
  const total = bar + on.reduce((s, p) => s + p.kg * 2, 0);
  const last = on.length ? on[on.length - 1].at : start;
  const shownTotal = Math.round(interpolate(f, [last, last + 6], [total - (on.length ? on[on.length - 1].kg * 2 : 0), total], clamp));
  let off = 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * size})`}>
      {label && <Txt y={-200} size={36}>{label}</Txt>}
      <Txt y={-140} size={86} font={F.mono} fill={C.ink}>{shownTotal} kg</Txt>
      <Sketch paths={sk.line(-400, 0, 400, 0, { seed, strokeWidth: 12, roughness: 0.4 })} />
      <Sketch paths={sk.rect(-250, -14, 18, 28, { seed: seed + 1, fill: C.ink })} />
      <Sketch paths={sk.rect(232, -14, 18, 28, { seed: seed + 2, fill: C.ink })} />
      {on.map((p, i) => {
        const hgt = 70 + p.kg * 4.4, th = 22 + p.kg * 0.6;
        const slide = interpolate(f, [p.at, p.at + 5], [140, 0], { ...clamp, easing: Easing.out(Easing.quad) });
        const xs = 256 + off; off += th + 4;
        return (
          <g key={i}>
            <g transform={`translate(${xs + slide} 0)`}>
              <Sketch paths={sk.rect(0, -hgt / 2, th, hgt, { seed: seed + 10 + i, fill: colorOf(p.kg), roughness: 0.5 })} />
              <Sketch paths={sk.rect(0, -hgt / 2, th, hgt, { seed: seed + 10 + i, strokeWidth: 4, roughness: 0.6 })} />
            </g>
            <g transform={`translate(${-xs - th - slide} 0)`}>
              <Sketch paths={sk.rect(0, -hgt / 2, th, hgt, { seed: seed + 30 + i, fill: colorOf(p.kg), roughness: 0.5 })} />
              <Sketch paths={sk.rect(0, -hgt / 2, th, hgt, { seed: seed + 30 + i, strokeWidth: 4, roughness: 0.6 })} />
            </g>
          </g>
        );
      })}
      {pr && on.length === plates.length && f >= last + 8 && (
        <g transform={`translate(0 140) rotate(-6) scale(${interpolate(f, [last + 8, last + 12], [1.8, 1], clamp)})`}>
          <Sketch paths={sk.rect(-110, -46, 220, 92, { seed: seed + 60, stroke: C.alert, strokeWidth: 7, roughness: 1.4 })} />
          <Txt size={64} fill={C.alert}>PR!</Txt>
        </g>
      )}
    </g>
  );
};

// ---------- financas: holerite que se preenche linha a linha ----------
export const Payslip: React.FC<Base & { rows: { label: string; value: number; at: number; kind?: "+" | "-" | "=" }[]; title?: string; w?: number }> = ({ start, x, y, rows, title = "HOLERITE", w = 520, seed = 751 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const rowH = 70, h = 110 + rows.length * rowH + 30;
  const zig = Array.from({ length: 14 }).map((_, i) => `L ${w - (i + 1) * (w / 14)} ${h + (i % 2 === 0 ? 14 : 0)}`).join(" ");
  return (
    <g transform={`translate(${x} ${y}) rotate(-1.5) scale(${scale})`}>
      <g transform={`translate(${-w / 2} ${-h / 2})`}>
        <path d={`M 8 10 H ${w + 8} V ${h + 10} ${zig.replace(/L (\S+) (\S+)/g, (_, a, b) => `L ${+a + 8} ${+b + 10}`)} Z`} fill={C.shade} />
        <path d={`M 0 0 H ${w} V ${h} ${zig} Z`} fill={C.white} stroke={C.ink} strokeWidth={3} />
        <Txt x={w / 2} y={52} size={38}>{title}</Txt>
        <line x1={30} y1={88} x2={w - 30} y2={88} stroke={C.gridStrong} strokeWidth={3} strokeDasharray="10 8" />
        {rows.map((r, i) => {
          if (f < r.at) return null;
          const ry = 118 + i * rowH + 20;
          const typed = interpolate(f, [r.at, r.at + 8], [0, 1], clamp);
          const col = r.kind === "-" ? C.alert : r.kind === "=" ? C.gain : C.ink;
          const val = (r.kind === "-" ? "- " : "") + brl(Math.abs(r.value) * typed, 0);
          return (
            <g key={i}>
              {r.kind === "=" && <line x1={30} y1={ry - 34} x2={w - 30} y2={ry - 34} stroke={C.ink} strokeWidth={4} />}
              <Txt x={36} y={ry} size={34} font={F.hand} weight={700} anchor="start" fill={C.inkSoft}>{r.label}</Txt>
              <Txt x={w - 36} y={ry} size={r.kind === "=" ? 44 : 36} font={F.mono} weight={700} anchor="end" fill={col}>{val}</Txt>
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ---------- estudos/treino: sequencia de dias (constancia) ----------
export const Streak: React.FC<Base & { marks: ("ok" | "falha")[]; every?: number; label?: string; cols?: number; cell?: number }> = ({ start, x, y, marks, every = 4, label, cols = 7, seed = 761, cell = 92 }) => {
  const f = useCurrentFrame();
  const { scale, visible } = usePop(start);
  if (!visible) return null;
  const rows = Math.ceil(marks.length / cols);
  const w = cols * cell, h = rows * cell;
  const done = marks.filter((_, i) => f >= start + 6 + i * every).filter((m) => m === "ok").length;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {label && <Txt y={-h / 2 - 50} size={36}>{label}</Txt>}
      <g transform={`translate(${-w / 2} ${-h / 2})`}>
        <rect width={w} height={h} fill={C.white} />
        {marks.map((m, i) => {
          const cx = (i % cols) * cell, cy = Math.floor(i / cols) * cell;
          const at = start + 6 + i * every;
          const d = interpolate(f, [at, at + 5], [0, 1], clamp);
          return (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              <rect width={cell} height={cell} fill={d > 0 && m === "ok" ? "#EAF6EF" : "none"} stroke={C.gridStrong} strokeWidth={2.5} />
              <text x={10} y={22} fontFamily={F.mono} fontSize={18} fill={C.inkSoft}>{i + 1}</text>
              {m === "ok" && <Sketch paths={sk.linear([[22, 50], [40, 70], [72, 28]], { seed: seed + i, stroke: C.gain, strokeWidth: 8 })} draw={d} />}
              {m === "falha" && <Sketch paths={sk.linear([[26, 26], [66, 66]], { seed: seed + i, stroke: C.alert, strokeWidth: 8 })} draw={d} />}
              {m === "falha" && <Sketch paths={sk.linear([[66, 26], [26, 66]], { seed: seed + i + 40, stroke: C.alert, strokeWidth: 8 })} draw={Math.max(0, d * 2 - 1)} />}
            </g>
          );
        })}
        <Sketch paths={sk.rect(0, 0, w, h, { seed, strokeWidth: 4, roughness: 0.6 })} />
      </g>
      <Txt y={h / 2 + 46} size={40} font={F.mono} fill={C.gain}>{done}/{marks.length}</Txt>
    </g>
  );
};
