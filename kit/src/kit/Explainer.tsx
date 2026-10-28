import { Audio, Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Arrow, Bars, Cell, Checklist, Counter, LineChart, Person, Pin, PostIt, Stamp, Tag, Thesis } from "./elements";
import { Barbell, Battery, Icon, IconRow, Payslip, Stairs, Streak, Tabs, Timer } from "./narrative";
import { C, F, L, loadKitFonts } from "./theme";
import { HookCard, HookProps } from "./hook";
import { BusRoute, DayClock, Door, MindNoise, PitRescue, Receipt, SalaryLadder } from "./scenes";

loadKitFonts();

// ---------- tipos do roteiro visual ----------
// Tres telas: "head" (so o rosto, padrao), "split" (explicacao em cima + rosto embaixo), "anim" (so a explicacao, com legenda).
export type Mode = "split" | "anim" | "head";
export type HeadClip = { trimBefore: number; durationInFrames: number; zoom?: number };
export type CaptionWord = { text: string; startMs: number; endMs: number };
export type Chapter = { at: number; index: number; total: number; title: string };
export type Beat = { at: number; el: keyof typeof ELEMENTS; props: Record<string, unknown>; until?: number };
export type ExplainerProps = {
  head: string; // arquivo em public/
  clips: HeadClip[];
  modes: { at: number; mode: Mode }[]; // segundos de saida; antes do primeiro, "head"
  captions: CaptionWord[];
  chapters: Chapter[];
  beats: Beat[];
  punches?: number[]; // segundos: punch-in no rosto em palavras de enfase
  sfx?: boolean;
  voice?: string; // voz montada a parte (com micro crossfade nas emendas); se existir, o video fica mudo
  hook?: HookProps; // cena de gancho por cima do rosto nos primeiros segundos
};

const ELEMENTS = { Person, Tag, PostIt, Stamp, Pin, Arrow, LineChart, Bars, Checklist, Cell, Counter, Thesis, Icon, IconRow, Tabs, Battery, Timer, Stairs, Barbell, Payslip, Streak, SalaryLadder, DayClock, Receipt, BusRoute, PitRescue, MindNoise, Door } as const;

const MODE_VALUES: Record<Mode, { div: number; capY: number }> = {
  head: { div: 0, capY: 1330 },
  split: { div: L.SPLIT_Y, capY: L.SPLIT_Y },
  anim: { div: L.H, capY: 1400 },
};
export const TRANS = 9; // frames da troca de tela (o papel desliza)
const EXIT = 6; // frames da saida de um elemento com `until`

const sortedModes = (modes: ExplainerProps["modes"]) => {
  const list = [...modes].sort((a, b) => a.at - b.at);
  return list.length && list[0].at === 0 ? list : [{ at: 0, mode: "head" as Mode }, ...list];
};

const useModeState = (modes: ExplainerProps["modes"]) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const list = sortedModes(modes);
  let cur = 0;
  for (let i = 0; i < list.length; i++) if (list[i].at * fps <= f) cur = i;
  const now = MODE_VALUES[list[cur].mode];
  const prev = MODE_VALUES[list[Math.max(0, cur - 1)].mode];
  const t = cur === 0 ? 1 : interpolate(f, [list[cur].at * fps, list[cur].at * fps + TRANS], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
  });
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return { div: lerp(prev.div, now.div), capY: lerp(prev.capY, now.capY) };
};

// ---------- papel quadriculado ----------
const Paper: React.FC = () => {
  const step = 36;
  return (
    <svg width={L.W} height={L.H} style={{ position: "absolute", top: 0, left: 0 }}>
      <rect width={L.W} height={L.H} fill={C.paper} />
      {Array.from({ length: Math.ceil(L.W / step) }).map((_, i) => (
        <line key={`v${i}`} x1={i * step} y1={0} x2={i * step} y2={L.H} stroke={i % 5 === 0 ? C.gridStrong : C.grid} strokeWidth={i % 5 === 0 ? 1.6 : 1} opacity={0.75} />
      ))}
      {Array.from({ length: Math.ceil(L.H / step) }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * step} x2={L.W} y2={i * step} stroke={i % 5 === 0 ? C.gridStrong : C.grid} strokeWidth={i % 5 === 0 ? 1.6 : 1} opacity={0.75} />
      ))}
      <line x1={108} y1={0} x2={108} y2={L.H} stroke={C.margin} strokeWidth={3} opacity={0.55} />
    </svg>
  );
};

// borda picotada do caderno, com sombra sobre o video
const PaperEdge: React.FC<{ y: number }> = ({ y }) => (
  <svg width={L.W} height={80} style={{ position: "absolute", left: 0, top: y - 30 }}>
    <defs>
      <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgba(0,0,0,0.38)" />
        <stop offset="1" stopColor="rgba(0,0,0,0)" />
      </linearGradient>
    </defs>
    <rect x={0} y={30} width={L.W} height={34} fill="url(#sh)" />
    <path d={`M0 0 H${L.W} V30 ${Array.from({ length: 41 }).map((_, i) => `L${L.W - i * 27} ${i % 2 ? 36 : 30}`).join(" ")} Z`} fill={C.paper} />
    {Array.from({ length: 20 }).map((_, i) => <circle key={i} cx={27 + i * 54} cy={14} r={9} fill={C.ink} opacity={0.85} />)}
  </svg>
);

// ---------- aba de capitulo ----------
const ChapterTab: React.FC<{ chapters: Chapter[] }> = ({ chapters }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cur = [...chapters].reverse().find((c) => c.at * fps <= f);
  if (!cur) return null;
  const t = interpolate(f, [cur.at * fps, cur.at * fps + 7], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 0, top: 205, transform: `translateX(${(t - 1) * 120}%)`, display: "flex", boxShadow: "4px 6px 0 rgba(28,32,51,0.18)" }}>
      <div style={{ background: C.alert, color: C.white, fontFamily: F.mono, fontWeight: 700, fontSize: 42, padding: "12px 18px 12px 44px", display: "flex", alignItems: "center" }}>
        {cur.index}<span style={{ fontSize: 26, opacity: 0.85 }}>/{cur.total}</span>
      </div>
      <div style={{ background: C.white, color: C.ink, fontFamily: F.display, fontWeight: 800, fontSize: 40, padding: "12px 26px", textTransform: "uppercase", letterSpacing: 1 }}>
        {cur.title}
      </div>
    </div>
  );
};

// ---------- legenda: 1 a 2 palavras, a falada no marca-texto ----------
const pagesOf = (words: CaptionWord[]) => {
  const pages: CaptionWord[][] = []; let cur: CaptionWord[] = [];
  for (const w of words) {
    // duas palavras longas nao cabem na tira: a segunda vai para a proxima pagina
    if (cur.length && [...cur, w].map((c) => c.text).join(" ").length > 17) { pages.push(cur); cur = []; }
    cur.push(w);
    const len = cur.map((c) => c.text).join(" ").length;
    if (cur.length >= 2 || len >= 13 || /[.,?!:…]$/.test(w.text)) { pages.push(cur); cur = []; }
  }
  if (cur.length) pages.push(cur);
  return pages;
};

const Caption: React.FC<{ words: CaptionWord[]; y: number }> = ({ words, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (f / fps) * 1000;
  const pages = React.useMemo(() => pagesOf(words), [words]);
  let idx = -1;
  for (let i = 0; i < pages.length; i++) if (pages[i][0].startMs <= t + 30) idx = i;
  if (idx < 0) return null;
  const page = pages[idx];
  const end = pages[idx + 1] ? pages[idx + 1][0].startMs : page[page.length - 1].endMs + 500;
  if (t > end) return null;
  const pop = interpolate(f - (page[0].startMs / 1000) * fps, [0, 4], [0.84, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const clean = (s: string) => s.replace(/[,.;:]$/, "").toUpperCase();
  // palavra unica muito longa (ex.: SUPERPROCESSAMENTO) encolhe para caber na tira
  const chars = page.map((w) => clean(w.text)).join(" ").length;
  const size = Math.min(84, Math.floor((84 * 15) / Math.max(chars, 1)));
  return (
    <div style={{ position: "absolute", left: 0, width: L.W, top: y - 62, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `rotate(-1.2deg) scale(${pop})`, background: C.white, padding: "8px 26px 12px", boxShadow: "5px 7px 0 rgba(28,32,51,0.25)", display: "flex", gap: 18 }}>
        {page.map((w, i) => {
          const active = t >= w.startMs - 30 && t < (page[i + 1]?.startMs ?? end);
          return (
            <span key={i} style={{ position: "relative", fontFamily: F.display, fontWeight: 800, fontSize: size, lineHeight: 1.05, color: C.ink, letterSpacing: -1 }}>
              {active && <span style={{ position: "absolute", left: -10, right: -10, top: "18%", bottom: "8%", background: C.marker, transform: "skewX(-8deg) rotate(-1deg)", borderRadius: 4 }} />}
              <span style={{ position: "relative" }}>{clean(w.text)}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- rosto: tela cheia ou faixa de baixo; punch-in nas palavras de enfase ----------
const FACE_Y = 600;
const Head: React.FC<{ src: string; clips: HeadClip[]; div: number; punches: number[]; muted?: boolean }> = ({ src, clips, div, punches, muted = false }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!clips.length) return null;
  // o video continua montado mesmo escondido: e ele que carrega a voz
  const hidden = div >= L.H - 1;
  // punch-in: entra em 3 frames e segura 1,6s
  let punch = 1;
  for (const p of punches) {
    const pf = p * fps;
    if (f >= pf && f < pf + 1.6 * fps) punch = interpolate(f, [pf, pf + 3], [1, 1.1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  }
  const top = -230 * Math.min(1, div / L.SPLIT_Y);
  let from = 0;
  return (
    <div style={{ position: "absolute", left: 0, top: hidden ? L.H : div, width: L.W, height: hidden ? 0 : L.H - div, overflow: "hidden", background: "#111" }}>
      <div style={{ position: "absolute", left: 0, top, width: L.W, height: L.H, transform: `scale(${punch})`, transformOrigin: `50% ${(FACE_Y / L.H) * 100}%` }}>
        {clips.map((c, i) => {
          const el = (
            <Sequence key={i} from={from} durationInFrames={c.durationInFrames} trimBefore={c.trimBefore} name={`rosto ${i + 1}`}>
              <AbsoluteFill style={{ transform: `scale(${c.zoom ?? 1})`, transformOrigin: `50% ${(FACE_Y / L.H) * 100}%` }}>
                <Video src={staticFile(src)} muted={muted} style={{ width: L.W, height: L.H }} />
              </AbsoluteFill>
            </Sequence>
          );
          from += c.durationInFrames;
          return el;
        })}
      </div>
    </div>
  );
};

// fim de vida de cada elemento: `until` (com saida rapida) ou a proxima troca de tela (sai junto com o papel)
const lifeOf = (b: Beat, modes: ExplainerProps["modes"], chapters: Chapter[], fps: number) => {
  if (b.until !== undefined) return { end: Math.round(b.until * fps), exits: true };
  // sai junto com o papel na proxima troca de tela, ou rapido na virada de capitulo (papel limpo)
  const next = sortedModes(modes).find((m) => m.at > b.at + 1e-6);
  const nextCh = chapters.map((c) => c.at).filter((t) => t > b.at + 1e-6).sort((a, c) => a - c)[0];
  const byMode = next ? Math.round(next.at * fps) + TRANS : Infinity;
  const byCh = nextCh !== undefined ? Math.round(nextCh * fps) : Infinity;
  return byCh < byMode ? { end: byCh, exits: true } : { end: byMode, exits: false };
};

const StageBeats: React.FC<{ beats: Beat[]; modes: ExplainerProps["modes"]; chapters: Chapter[] }> = ({ beats, modes, chapters }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg width={L.W} height={L.STAGE_H} viewBox={`0 0 ${L.W} ${L.STAGE_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform="translate(540 520) scale(1.2) translate(-540 -520)">
        {beats.map((b, i) => {
          const startF = Math.round(b.at * fps);
          const { end, exits } = lifeOf(b, modes, chapters, fps);
          if (f < startF || f >= end) return null;
          const out = exits ? interpolate(f, [end - EXIT, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }) : 0;
          const Comp = ELEMENTS[b.el] as React.FC<Record<string, unknown>>;
          return (
            <g key={i} opacity={1 - out} transform={`translate(0 ${-28 * out})`}>
              <Comp start={startF} {...b.props} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------- trilha de efeitos sonoros, derivada das animacoes ----------
type Cue = { f: number; s: string; v: number };
// mixagem: efeitos ~12-15 dB abaixo da voz; os mais "cheios" levam corte extra
export const SFX_GAIN = 0.3;
const SFX_TRIM: Record<string, number> = { stamp: 0.6, scribble_long: 0.6, whoosh: 0.8, coins: 0.7 };
const SFX_OF: Record<string, (b: Beat, s: number) => Cue[]> = {
  Person: (_, s) => [{ f: s, s: "pop", v: 0.32 }],
  Tag: (_, s) => [{ f: s, s: "pop", v: 0.28 }],
  Pin: (_, s) => [{ f: s, s: "pop", v: 0.32 }],
  PostIt: (_, s) => [{ f: s, s: "paper", v: 0.4 }],
  Stamp: (_, s) => [{ f: s + 3, s: "stamp", v: 0.5 }],
  Arrow: (_, s) => [{ f: s, s: "scribble", v: 0.28 }],
  LineChart: (b, s) => [{ f: s, s: "pop", v: 0.25 }, { f: s + 3, s: "scribble_long", v: 0.24 }, { f: s + 3 + ((b.props.dur as number) ?? 18), s: "ding", v: 0.2 }],
  Bars: (b, s) => ((b.props.bars as unknown[]) ?? []).map((_, i) => ({ f: s + i * 3 + 4, s: "tick", v: 0.35 })),
  Checklist: (b, s) => [{ f: s, s: "pop", v: 0.25 }, ...((b.props.items as { at: number; state: string }[]) ?? []).map((it) => ({ f: it.at, s: it.state === "falha" ? "error" : "check", v: 0.3 }))],
  Cell: (b, s) => [{ f: s + 3, s: "typing", v: 0.3 }, { f: s + 3 + String(b.props.formula ?? "").length, s: "ding", v: 0.22 }],
  Counter: (_, s) => [{ f: s, s: "coins", v: 0.28 }],
  Thesis: (_, s) => [{ f: s + 4, s: "scribble", v: 0.3 }, { f: s + 14, s: "pop", v: 0.3 }],
  Icon: (_, s) => [{ f: s, s: "pop", v: 0.28 }],
  IconRow: (b, s) => ((b.props.items as { at?: number }[]) ?? []).map((it, i) => ({ f: it.at ?? s + i * 4, s: "pop", v: 0.22 })),
  Tabs: (b, s) => [{ f: s, s: "pop", v: 0.25 }, ...((b.props.tabs as { at: number }[]) ?? []).map((t) => ({ f: t.at, s: "tick", v: 0.32 }))],
  Battery: (b, s) => [{ f: s, s: "pop", v: 0.25 }, { f: s + 4 + ((b.props.dur as number) ?? 24), s: (b.props.to as number) < (b.props.from as number) ? "error" : "ding", v: 0.22 }],
  Timer: (b, s) => [{ f: s, s: "tick", v: 0.35 }, { f: s + 4 + ((b.props.dur as number) ?? 36), s: "ding", v: 0.25 }],
  Stairs: (b, s) => ((b.props.steps as { at: number }[]) ?? []).map((st) => ({ f: st.at, s: "pop", v: 0.25 })),
  Barbell: (b, s) => [{ f: s, s: "pop", v: 0.22 }, ...((b.props.plates as { at: number }[]) ?? []).map((p) => ({ f: p.at + 4, s: "stamp", v: 0.22 }))],
  Payslip: (b, s) => [{ f: s, s: "paper", v: 0.35 }, ...((b.props.rows as { at: number; kind?: string }[]) ?? []).map((r) => ({ f: r.at, s: r.kind === "=" ? "coins" : "typing", v: r.kind === "=" ? 0.28 : 0.2 }))],
  SalaryLadder: (b, s) => ((b.props.steps as { at: number }[]) ?? []).map((st) => ({ f: st.at, s: "coins", v: 0.22 })),
  DayClock: (b, s) => [{ f: s, s: "tick", v: 0.3 }, ...((b.props.arcs as { at: number }[]) ?? []).map((a) => ({ f: a.at, s: "scribble", v: 0.22 }))],
  Receipt: (b, s) => [{ f: s, s: "paper", v: 0.35 }, ...((b.props.rows as { at: number }[]) ?? []).map((r) => ({ f: r.at, s: "typing", v: 0.2 })), ...(b.props.total ? [{ f: (b.props.total as { at: number }).at, s: "stamp", v: 0.3 }] : [])],
  BusRoute: (_, s) => [{ f: s, s: "scribble_long", v: 0.24 }, { f: s + 6, s: "whoosh", v: 0.2 }],
  PitRescue: (b, s) => [{ f: s, s: "pop", v: 0.25 }, { f: s + 6, s: "scribble", v: 0.25 }, ...(b.props.sinkAt !== undefined ? [{ f: Math.round((b.props.sinkAt as number)), s: "whoosh", v: 0.22 }] : [])],
  MindNoise: (b, s) => [{ f: s, s: "scribble_long", v: 0.22 }, ...(b.props.quietAt !== undefined ? [{ f: b.props.quietAt as number, s: "ding", v: 0.25 }] : [])],
  Door: (b, s) => [{ f: s, s: "pop", v: 0.25 }, ...(b.props.openAt !== undefined ? [{ f: b.props.openAt as number, s: "page", v: 0.3 }] : [])],
  Streak: (b, s) => ((b.props.marks as string[]) ?? []).map((m, i) => ({ f: s + 6 + i * ((b.props.every as number) ?? 4), s: m === "falha" ? "error" : "check", v: 0.2 })),
};

const SfxTrack: React.FC<Pick<ExplainerProps, "beats" | "modes" | "chapters" | "punches" | "hook">> = ({ beats, modes, chapters, punches = [], hook }) => {
  const { fps } = useVideoConfig();
  const cues: Cue[] = [];
  if (hook) cues.push({ f: 0, s: "paper", v: 0.35 }, { f: 10, s: "scribble", v: 0.25 });
  for (const b of beats) cues.push(...(SFX_OF[b.el]?.(b, Math.round(b.at * fps)) ?? []));
  const list = sortedModes(modes);
  list.slice(1).forEach((m, i) => { if (m.mode !== list[i].mode) cues.push({ f: Math.round(m.at * fps), s: "whoosh", v: 0.22 }); });
  for (const c of chapters) {
    const live = [...list].reverse().find((m) => m.at <= c.at + 0.05);
    if (live && live.mode !== "head") cues.push({ f: Math.round(c.at * fps) + 2, s: "page", v: 0.2 });
  }
  for (const p of punches) cues.push({ f: Math.round(p * fps), s: "punch", v: 0.22 });
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.max(0, c.f)} durationInFrames={Math.round(fps * 1.2)} name={`sfx ${c.s}`} layout="none">
          <Audio src={staticFile(`sfx/${c.s}.wav`)} volume={c.v * SFX_GAIN * (SFX_TRIM[c.s] ?? 1)} />
        </Sequence>
      ))}
    </>
  );
};

export const Explainer: React.FC<ExplainerProps> = ({ head, clips, modes, captions, chapters, beats, punches = [], sfx = true, voice, hook }) => {
  const { div, capY } = useModeState(modes);
  // o papel desce de cima ate a divisoria; no modo animacao cobre tudo e o desenho centraliza
  const slide = Math.min(0, div - L.STAGE_H);
  const k = Math.min(1, Math.max(0, (div - L.STAGE_H) / (L.H - L.STAGE_H)));
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <Head src={head} clips={clips} div={div} punches={punches} muted={!!voice} />
      {voice && <Audio src={staticFile(voice)} />}
      {div > 1 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: L.W, height: div, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: slide, width: L.W, height: L.H }}>
            <Paper />
            <div style={{ position: "absolute", left: 0, top: 0, width: L.W, height: L.STAGE_H, transformOrigin: "50% 520px", transform: `translateY(${k * 300}px) scale(${1 + 0.4 * k})` }}>
              <StageBeats beats={beats} modes={modes} chapters={chapters} />
            </div>
            <ChapterTab chapters={chapters} />
          </div>
        </div>
      )}
      {div > 1 && div < L.H - 2 && <PaperEdge y={div} />}
      {hook && <HookCard {...hook} />}
      <Caption words={captions} y={capY} />
      {sfx && <SfxTrack beats={beats} modes={modes} chapters={chapters} punches={punches} hook={hook} />}
    </AbsoluteFill>
  );
};
