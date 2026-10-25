// Iconografia do canal: desenhos de caneta num quadro de 120x120, contorno em tinta (ink) e UMA cor de preenchimento.
// Arquivo puro (sem React): usado pelo kit e pelo exportador de SVG do guia.
import rough from "roughjs";
import { C } from "./palette";

export type IconPath = { d: string; stroke: string; strokeWidth: number; fill?: string };
export type IconText = { x: number; y: number; text: string; size: number; fill: string; font: "mono" | "display" | "hand" };
export type IconArt = { paths: IconPath[]; texts: IconText[] };
export type IconCat = "trabalho" | "tdah" | "jornada" | "financas" | "powerlifting" | "estudos";

const gen = rough.generator();

// "caneta": cada forma pode levar preenchimento (desenhado antes) e contorno em tinta
const pen = (seed: number) => {
  const paths: IconPath[] = [];
  const texts: IconText[] = [];
  let s = seed;
  const o = (extra: object = {}) => ({ seed: s++, roughness: 0.9, bowing: 0.8, stroke: C.ink, strokeWidth: 4.5, preserveVertices: true, ...extra });
  const push = (d: ReturnType<typeof gen.rectangle>) => paths.push(...(gen.toPaths(d) as IconPath[]));
  const filled = (mk: (opts: object) => ReturnType<typeof gen.rectangle>, fill?: string) => {
    if (fill) push(mk(o({ fill, fillStyle: "solid", stroke: "none", roughness: 0.5 })));
    push(mk(o()));
  };
  return {
    rect: (x: number, y: number, w: number, h: number, fill?: string) => filled((op) => gen.rectangle(x, y, w, h, op), fill),
    circ: (cx: number, cy: number, d: number, fill?: string) => filled((op) => gen.circle(cx, cy, d, op), fill),
    ell: (cx: number, cy: number, w: number, h: number, fill?: string) => filled((op) => gen.ellipse(cx, cy, w, h, op), fill),
    poly: (pts: [number, number][], fill?: string) => filled((op) => gen.polygon(pts, op), fill),
    path: (d: string, fill?: string) => filled((op) => gen.path(d, op), fill),
    line: (x1: number, y1: number, x2: number, y2: number, w = 4.5, color: string = C.ink) => push(gen.line(x1, y1, x2, y2, o({ strokeWidth: w, stroke: color }))),
    curve: (pts: [number, number][], w = 4.5, color: string = C.ink) => push(gen.curve(pts, o({ strokeWidth: w, stroke: color }))),
    text: (x: number, y: number, text: string, size = 30, fill: string = C.ink, font: IconText["font"] = "mono") => texts.push({ x, y, text, size, fill, font }),
    done: (): IconArt => ({ paths, texts }),
  };
};

type Def = { cat: IconCat; label: string; draw: () => IconArt };
const W = C.white;

export const ICONS: Record<string, Def> = {
  // ---------------- trabalho ----------------
  notebook: { cat: "trabalho", label: "notebook", draw: () => { const p = pen(101); p.rect(22, 24, 76, 52, C.postitBlue); p.line(34, 40, 70, 40, 3.5); p.line(34, 52, 60, 52, 3.5); p.poly([[10, 80], [110, 80], [100, 96], [20, 96]], W); return p.done(); } },
  maleta: { cat: "trabalho", label: "maleta", draw: () => { const p = pen(111); p.path("M46 40 V28 H74 V40", undefined); p.rect(16, 40, 88, 58, C.pen); p.line(16, 64, 104, 64, 4); p.rect(52, 58, 16, 14, C.marker); return p.done(); } },
  email: { cat: "trabalho", label: "e-mail", draw: () => { const p = pen(121); p.rect(14, 32, 88, 60, W); p.curve([[14, 34], [58, 68], [102, 34]], 4.5); p.circ(98, 32, 28, C.alert); p.text(98, 33, "9", 20, W, "mono"); return p.done(); } },
  agenda: { cat: "trabalho", label: "agenda", draw: () => { const p = pen(131); p.rect(16, 26, 88, 78, W); p.rect(16, 26, 88, 20, C.alert); p.line(40, 16, 40, 34, 6); p.line(80, 16, 80, 34, 6); [[36, 62], [60, 62], [84, 62], [36, 84], [60, 84]].forEach(([x, y]) => p.line(x - 6, y, x + 6, y, 4)); p.curve([[76, 84], [82, 90], [94, 76]], 5, C.gain); return p.done(); } },
  cafe: { cat: "trabalho", label: "café", draw: () => { const p = pen(141); p.ell(88, 66, 26, 30); p.poly([[26, 46], [82, 46], [76, 100], [32, 100]], W); p.rect(26, 46, 56, 10, C.marker); p.curve([[44, 38], [38, 28], [46, 16]], 3.5); p.curve([[62, 38], [56, 28], [64, 16]], 3.5); return p.done(); } },
  cracha: { cat: "trabalho", label: "crachá", draw: () => { const p = pen(151); p.line(60, 6, 60, 20, 4); p.rect(30, 20, 60, 88, W); p.rect(48, 14, 24, 12, C.ink); p.circ(60, 52, 28, C.postitBlue); p.line(42, 80, 78, 80, 4); p.line(46, 92, 74, 92, 4); return p.done(); } },
  reuniao: { cat: "trabalho", label: "reunião", draw: () => { const p = pen(161); p.circ(34, 40, 24, C.postitPink); p.circ(86, 40, 24, C.postitBlue); p.path("M18 74 Q34 52 50 74", undefined); p.path("M70 74 Q86 52 102 74", undefined); p.ell(60, 88, 104, 26, C.marker); return p.done(); } },
  planilha: { cat: "trabalho", label: "planilha", draw: () => { const p = pen(171); p.rect(14, 20, 92, 80, W); p.rect(14, 20, 92, 18, C.gain); [44, 74].forEach((x) => p.line(x, 38, x, 100, 3)); [58, 79].forEach((y) => p.line(14, y, 106, y, 3)); p.text(30, 49, "A", 14, W, "mono"); return p.done(); } },

  // ---------------- TDAH ----------------
  cerebro: { cat: "tdah", label: "cérebro", draw: () => { const p = pen(201); p.ell(60, 58, 92, 74, C.postitPink); p.line(60, 24, 60, 92, 3.5); p.curve([[26, 50], [38, 42], [46, 54]], 3.5); p.curve([[30, 72], [42, 64], [50, 76]], 3.5); p.curve([[74, 48], [84, 40], [94, 52]], 3.5); p.curve([[70, 74], [82, 66], [92, 76]], 3.5); p.line(56, 96, 64, 110, 5); return p.done(); } },
  abas: { cat: "tdah", label: "abas abertas", draw: () => { const p = pen(211); p.rect(14, 26, 30, 18, C.postitPink); p.rect(44, 26, 30, 18, C.postitBlue); p.rect(74, 26, 32, 18, C.marker); p.rect(14, 44, 92, 58, W); p.line(22, 60, 70, 60, 3.5); p.line(22, 74, 86, 74, 3.5); p.line(22, 88, 56, 88, 3.5); return p.done(); } },
  sino: { cat: "tdah", label: "notificação", draw: () => { const p = pen(221); p.path("M60 18 C40 18 34 38 34 58 L26 82 H94 L86 58 C86 38 80 18 60 18 Z", C.marker); p.circ(60, 92, 16, C.ink); p.curve([[98, 26], [106, 36], [104, 50]], 4); p.curve([[22, 26], [14, 36], [16, 50]], 4); return p.done(); } },
  bateria: { cat: "tdah", label: "energia", draw: () => { const p = pen(231); p.rect(14, 38, 82, 46, W); p.rect(96, 51, 10, 20, C.ink); p.rect(22, 46, 22, 30, C.alert); p.line(56, 48, 50, 62, 4); p.line(50, 62, 62, 62, 4); p.line(62, 62, 56, 76, 4); return p.done(); } },
  relogio: { cat: "tdah", label: "tempo", draw: () => { const p = pen(241); p.rect(52, 10, 16, 10, C.ink); p.circ(60, 66, 84, W); p.line(60, 66, 60, 38, 5); p.line(60, 66, 80, 76, 5); p.circ(60, 66, 8, C.alert); return p.done(); } },
  fone: { cat: "tdah", label: "foco", draw: () => { const p = pen(251); p.path("M24 72 C24 26 96 26 96 72", undefined); p.rect(14, 64, 20, 34, C.pen); p.rect(86, 64, 20, 34, C.pen); return p.done(); } },
  lampada: { cat: "tdah", label: "ideia", draw: () => { const p = pen(261); p.circ(60, 50, 58, C.marker); p.rect(46, 76, 28, 24, W); p.line(48, 86, 72, 86, 3.5); p.line(60, 8, 60, 16, 4); p.line(20, 24, 26, 30, 4); p.line(100, 24, 94, 30, 4); p.line(12, 52, 22, 52, 4); p.line(108, 52, 98, 52, 4); return p.done(); } },
  emaranhado: { cat: "tdah", label: "mil coisas", draw: () => { const p = pen(271); p.curve([[16, 64], [34, 26], [62, 40], [44, 70], [82, 84], [96, 44], [66, 22], [38, 92], [100, 96]], 5, C.pen); p.circ(100, 96, 12, C.alert); return p.done(); } },

  // ---------------- jornada profissional ----------------
  escada: { cat: "jornada", label: "degraus", draw: () => { const p = pen(301); p.poly([[12, 104], [12, 84], [36, 84], [36, 64], [60, 64], [60, 44], [84, 44], [84, 24], [108, 24], [108, 104]], C.postitGreen); p.line(98, 24, 98, 6, 4); p.poly([[98, 6], [114, 11], [98, 16]], C.alert); return p.done(); } },
  alvo: { cat: "jornada", label: "meta", draw: () => { const p = pen(311); p.circ(56, 64, 88, W); p.circ(56, 64, 58, C.alert); p.circ(56, 64, 28, W); p.circ(56, 64, 8, C.ink); p.line(56, 64, 104, 16, 5); p.line(96, 14, 108, 10, 4); p.line(106, 24, 110, 12, 4); return p.done(); } },
  bandeira: { cat: "jornada", label: "conquista", draw: () => { const p = pen(321); p.ell(40, 106, 56, 12, C.postitGreen); p.line(34, 12, 34, 106, 6); p.poly([[34, 16], [100, 30], [34, 54]], C.alert); return p.done(); } },
  foguete: { cat: "jornada", label: "decolar", draw: () => { const p = pen(331); p.poly([[48, 92], [60, 110], [72, 92]], C.marker); p.poly([[44, 70], [26, 92], [46, 88]], C.alert); p.poly([[76, 70], [94, 92], [74, 88]], C.alert); p.path("M60 10 C84 30 80 70 74 92 H46 C40 70 36 30 60 10 Z", W); p.circ(60, 50, 18, C.pen); return p.done(); } },
  trofeu: { cat: "jornada", label: "vitória", draw: () => { const p = pen(341); p.curve([[30, 30], [12, 34], [20, 56], [38, 58]], 4.5); p.curve([[90, 30], [108, 34], [100, 56], [82, 58]], 4.5); p.path("M30 20 H90 C90 60 76 74 60 74 C44 74 30 60 30 20 Z", C.marker); p.rect(52, 74, 16, 14); p.rect(36, 88, 48, 16, C.ink); return p.done(); } },
  caminho: { cat: "jornada", label: "caminho", draw: () => { const p = pen(351); p.curve([[14, 108], [44, 92], [30, 66], [66, 56], [70, 34], [96, 22]], 9, C.ink); p.curve([[14, 108], [44, 92], [30, 66], [66, 56], [70, 34], [96, 22]], 3, C.marker); p.circ(98, 20, 18, C.alert); return p.done(); } },
  porta: { cat: "jornada", label: "oportunidade", draw: () => { const p = pen(361); p.rect(28, 14, 64, 94, C.marker); p.poly([[28, 14], [64, 26], [64, 114], [28, 108]], W); p.circ(56, 66, 8, C.ink); p.line(92, 108, 112, 108, 4); return p.done(); } },
  medalha: { cat: "jornada", label: "reconhecimento", draw: () => { const p = pen(371); p.poly([[34, 10], [52, 10], [66, 50], [52, 54]], C.pen); p.poly([[86, 10], [68, 10], [54, 50], [68, 54]], C.alert); p.circ(60, 78, 52, C.marker); p.text(60, 79, "1", 28, C.ink, "display"); return p.done(); } },

  // ---------------- financas ----------------
  moeda: { cat: "financas", label: "dinheiro", draw: () => { const p = pen(401); p.circ(60, 62, 86, C.marker); p.circ(60, 62, 62); p.text(60, 64, "R$", 28, C.ink, "display"); return p.done(); } },
  cofrinho: { cat: "financas", label: "reserva", draw: () => { const p = pen(411); p.circ(64, 18, 22, C.marker); p.ell(58, 68, 88, 60, C.postitPink); p.ell(102, 66, 16, 20, C.postitPink); p.line(48, 40, 70, 40, 5); p.line(34, 94, 34, 108, 6); p.line(78, 94, 78, 108, 6); p.circ(84, 58, 6, C.ink); return p.done(); } },
  cartao: { cat: "financas", label: "cartão", draw: () => { const p = pen(421); p.rect(12, 28, 96, 64, C.pen); p.rect(12, 42, 96, 12, C.ink); p.rect(22, 64, 20, 16, C.marker); p.line(54, 76, 96, 76, 3.5); return p.done(); } },
  holerite: { cat: "financas", label: "holerite", draw: () => { const p = pen(431); p.poly([[26, 12], [94, 12], [94, 104], [82, 96], [70, 104], [58, 96], [46, 104], [34, 96], [26, 104]], W); p.line(36, 30, 84, 30, 3.5); p.line(36, 46, 70, 46, 3.5); p.line(36, 60, 76, 60, 3.5); p.line(36, 80, 84, 80, 6, C.gain); return p.done(); } },
  cedula: { cat: "financas", label: "cédula", draw: () => { const p = pen(441); p.rect(10, 34, 100, 54, C.postitGreen); p.circ(60, 61, 32, W); p.text(60, 62, "$", 22, C.ink, "display"); p.line(18, 42, 30, 42, 3); p.line(90, 80, 102, 80, 3); return p.done(); } },
  cadeado: { cat: "financas", label: "segurança", draw: () => { const p = pen(451); p.path("M38 54 V38 C38 12 82 12 82 38 V54", undefined); p.rect(26, 52, 68, 54, C.marker); p.circ(60, 74, 14, C.ink); p.line(60, 78, 60, 92, 5); return p.done(); } },
  calculadora: { cat: "financas", label: "conta", draw: () => { const p = pen(461); p.rect(28, 12, 64, 96, W); p.rect(36, 20, 48, 20, C.postitGreen); [52, 70, 88].forEach((y) => [44, 60, 76].forEach((x) => p.rect(x - 5, y - 5, 10, 10, (y === 88 && x === 76) ? C.alert : undefined))); return p.done(); } },
  crescimento: { cat: "financas", label: "rendimento", draw: () => { const p = pen(471); p.line(14, 104, 106, 104, 4); p.rect(22, 76, 16, 28, C.postitGreen); p.rect(48, 60, 16, 44, C.postitGreen); p.rect(74, 38, 16, 66, C.gain); p.curve([[18, 64], [46, 46], [70, 34], [100, 12]], 5, C.gain); p.line(100, 12, 88, 12, 5, C.gain); p.line(100, 12, 98, 24, 5, C.gain); return p.done(); } },

  // ---------------- powerlifting ----------------
  barra: { cat: "powerlifting", label: "barra", draw: () => { const p = pen(501); p.line(6, 60, 114, 60, 7); p.rect(18, 26, 12, 68, C.alert); p.rect(30, 34, 10, 52, C.pen); p.rect(90, 26, 12, 68, C.alert); p.rect(80, 34, 10, 52, C.pen); return p.done(); } },
  anilha: { cat: "powerlifting", label: "anilha", draw: () => { const p = pen(511); p.circ(60, 60, 96, C.alert); p.circ(60, 60, 40, W); p.circ(60, 60, 12, C.ink); p.text(60, 26, "20", 18, W, "mono"); return p.done(); } },
  halter: { cat: "powerlifting", label: "halter", draw: () => { const p = pen(521); p.line(30, 60, 90, 60, 8); p.rect(14, 36, 18, 48, C.ink); p.rect(88, 36, 18, 48, C.ink); p.rect(6, 44, 8, 32, C.pen); p.rect(106, 44, 8, 32, C.pen); return p.done(); } },
  kettlebell: { cat: "powerlifting", label: "kettlebell", draw: () => { const p = pen(531); p.path("M38 52 C30 14 90 14 82 52", undefined); p.circ(60, 76, 70, C.ink); p.rect(42, 102, 36, 8, C.ink); p.text(60, 80, "24", 22, W, "mono"); return p.done(); } },
  cinto: { cat: "powerlifting", label: "cinturão", draw: () => { const p = pen(541); p.rect(8, 44, 104, 32, C.alert); p.rect(46, 36, 28, 48, C.marker); p.rect(54, 46, 12, 28, W); [20, 30, 90, 100].forEach((x) => p.circ(x, 60, 6, C.ink)); return p.done(); } },
  rack: { cat: "powerlifting", label: "agachamento", draw: () => { const p = pen(551); p.line(26, 12, 26, 108, 6); p.line(94, 12, 94, 108, 6); p.line(10, 108, 110, 108, 6); p.line(6, 46, 114, 46, 6); p.rect(10, 28, 10, 36, C.alert); p.rect(100, 28, 10, 36, C.alert); p.rect(36, 70, 48, 8, C.pen); return p.done(); } },
  pr: { cat: "powerlifting", label: "recorde", draw: () => { const p = pen(561); p.rect(14, 30, 92, 62, C.marker); p.text(54, 63, "PR", 40, C.ink, "display"); p.line(90, 82, 90, 44, 5, C.gain); p.line(90, 44, 82, 54, 5, C.gain); p.line(90, 44, 98, 54, 5, C.gain); return p.done(); } },
  giz: { cat: "powerlifting", label: "constância", draw: () => { const p = pen(571); p.rect(14, 22, 92, 80, W); [0, 1, 2, 3].forEach((i) => p.line(28 + i * 12, 40, 28 + i * 12, 72, 5)); p.line(22, 64, 70, 46, 5, C.alert); p.line(84, 40, 84, 72, 5); p.line(96, 40, 96, 72, 5); p.text(60, 88, "DIAS", 13, C.ink, "display"); return p.done(); } },

  // ---------------- estudos ----------------
  livro: { cat: "estudos", label: "livro", draw: () => { const p = pen(601); p.poly([[60, 30], [12, 22], [12, 92], [60, 100]], W); p.poly([[60, 30], [108, 22], [108, 92], [60, 100]], C.postitYellow); p.line(60, 30, 60, 100, 4); p.line(22, 42, 50, 46, 3); p.line(22, 58, 50, 62, 3); p.line(70, 46, 98, 42, 3); return p.done(); } },
  pilha: { cat: "estudos", label: "leitura", draw: () => { const p = pen(611); p.rect(18, 80, 84, 22, C.pen); p.rect(24, 58, 76, 22, C.alert); p.rect(14, 36, 82, 22, C.gain); p.line(28, 47, 80, 47, 3, W); p.line(34, 69, 86, 69, 3, W); p.line(30, 91, 88, 91, 3, W); return p.done(); } },
  capelo: { cat: "estudos", label: "formatura", draw: () => { const p = pen(621); p.path("M30 58 V82 C46 96 74 96 90 82 V58", C.ink); p.poly([[60, 22], [114, 46], [60, 70], [6, 46]], C.ink); p.line(96, 52, 96, 84, 4, C.marker); p.circ(96, 88, 10, C.marker); return p.done(); } },
  lapis: { cat: "estudos", label: "anotação", draw: () => { const p = pen(631); p.poly([[30, 98], [20, 108], [24, 92]], C.ink); p.poly([[24, 92], [82, 34], [94, 46], [36, 104], [30, 98]], C.marker); p.poly([[82, 34], [92, 24], [104, 36], [94, 46]], C.postitPink); return p.done(); } },
  caderno: { cat: "estudos", label: "caderno", draw: () => { const p = pen(641); p.rect(30, 12, 70, 96, C.postitBlue); [24, 44, 64, 84].forEach((y) => p.circ(30, y, 12, W)); p.line(48, 36, 88, 36, 3.5); p.line(48, 52, 82, 52, 3.5); p.line(48, 68, 86, 68, 3.5); return p.done(); } },
  diploma: { cat: "estudos", label: "certificado", draw: () => { const p = pen(651); p.rect(16, 30, 88, 56, W); p.ell(16, 58, 14, 56, C.postitYellow); p.ell(104, 58, 14, 56, C.postitYellow); p.line(32, 46, 88, 46, 3.5); p.line(32, 60, 76, 60, 3.5); p.circ(80, 86, 24, C.alert); p.line(74, 96, 70, 112, 4, C.alert); p.line(86, 96, 90, 112, 4, C.alert); return p.done(); } },
  quadro: { cat: "estudos", label: "aula", draw: () => { const p = pen(661); p.rect(12, 16, 96, 66, "#2F4F45"); p.curve([[24, 36], [40, 30], [56, 40], [72, 32]], 3.5, W); p.text(84, 60, "=1", 18, W, "mono"); p.line(32, 82, 22, 110, 5); p.line(88, 82, 98, 110, 5); return p.done(); } },
  pomodoro: { cat: "estudos", label: "pomodoro", draw: () => { const p = pen(671); p.circ(60, 66, 84, C.alert); p.curve([[52, 26], [60, 16], [70, 24]], 5, C.gain); p.line(60, 66, 60, 42, 5, W); p.line(60, 66, 78, 66, 5, W); p.text(60, 92, "25", 16, W, "mono"); return p.done(); } },
};

export const CATS: { id: IconCat; label: string }[] = [
  { id: "trabalho", label: "Trabalho" },
  { id: "tdah", label: "TDAH" },
  { id: "jornada", label: "Jornada profissional" },
  { id: "financas", label: "Finanças" },
  { id: "powerlifting", label: "Powerlifting" },
  { id: "estudos", label: "Estudos" },
];
