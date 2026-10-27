import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, L } from "./theme";
import { sk, Sketch } from "./sketch";

// Cena de gancho: nos 3 primeiros segundos o rosto fica inteiro e uma tira de caderno
// cai por cima da parede com a frase do gancho escrita a mao, a palavra-chave no marca-texto
// e um rabisco apontando para o Pepeu. Sai deslizando para cima antes do palco entrar.
export type HookProps = {
  title: string; // frase curta do gancho; a palavra entre *asteriscos* ganha marca-texto
  kicker?: string; // linha pequena manuscrita acima do titulo (opcional)
  doodle?: "setas" | "circulo" | "raio" | "interrogacao" | "dinheiro";
  until?: number; // segundos; padrao 3,2
  y?: number; // topo da tira (padrao 190, acima da cabeca)
};

const parts = (title: string) => title.split(/(\*[^*]+\*)/).filter(Boolean).map((p) => ({ text: p.replace(/\*/g, ""), mark: p.startsWith("*") }));

export const HookCard: React.FC<HookProps> = ({ title, kicker, doodle = "setas", until = 3.2, y = 190 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = Math.round(until * fps);
  if (f >= end) return null;
  const inT = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  const outT = interpolate(f, [end - 8, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const markT = interpolate(f, [7, 17], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const drawT = interpolate(f, [10, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const W = 920, X = (L.W - W) / 2;
  const chars = title.replace(/\*/g, "").length;
  const size = chars <= 18 ? 92 : chars <= 30 ? 76 : 62;
  const lines = chars <= 18 ? 1 : 2;
  const H = (kicker ? 62 : 0) + lines * size * 1.08 + 60;
  const ty = (inT - 1) * 260 - outT * 320;
  const rot = -2.2 + (1 - inT) * -4;

  const d = (() => {
    const b = y + H + 14, cx = L.W / 2;
    switch (doodle) {
      case "circulo": return sk.ellipse(cx, b + 210, 520, 470, { stroke: C.alert, strokeWidth: 7, roughness: 1.8, seed: 21 });
      case "raio": return [...sk.linear([[150, b + 10], [210, b + 90], [170, b + 95], [240, b + 190]], { stroke: C.marker, strokeWidth: 10, seed: 22 }), ...sk.linear([[930, b + 10], [870, b + 90], [910, b + 95], [840, b + 190]], { stroke: C.marker, strokeWidth: 10, seed: 23 })];
      case "interrogacao": return [...sk.path(`M ${W + X - 60} ${b + 40} q 60 -50 90 10 q 20 50 -40 80 v 40`, { stroke: C.alert, strokeWidth: 9, seed: 24 }), ...sk.circle(W + X - 10, b + 205, 14, { stroke: C.alert, fill: C.alert, seed: 25 })];
      case "dinheiro": return [...sk.circle(170, b + 90, 110, { stroke: C.gain, strokeWidth: 7, seed: 26 }), ...sk.path(`M 185 ${b + 55} q -40 -10 -40 20 q 0 25 30 25 q 30 0 30 25 q 0 30 -45 20 M 170 ${b + 40} v 100`, { stroke: C.gain, strokeWidth: 7, seed: 27 })];
      default: return [...sk.curve([[180, b], [140, b + 110], [230, b + 220]], { stroke: C.alert, strokeWidth: 11, seed: 28 }), ...sk.linear([[200, b + 200], [230, b + 220], [205, b + 245]], { stroke: C.alert, strokeWidth: 11, seed: 29 }),
        ...sk.curve([[900, b], [940, b + 110], [850, b + 220]], { stroke: C.alert, strokeWidth: 11, seed: 30 }), ...sk.linear([[880, b + 200], [850, b + 220], [875, b + 245]], { stroke: C.alert, strokeWidth: 11, seed: 31 })];
    }
  })();

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: L.W, height: L.H, pointerEvents: "none", opacity: 1 - outT }}>
      <svg width={L.W} height={L.H} style={{ position: "absolute", left: 0, top: 0 }}>
        <Sketch paths={d} draw={drawT * (1 - outT)} />
      </svg>
      <div style={{ position: "absolute", left: X, top: y, width: W, transform: `translateY(${ty}px) rotate(${rot}deg)`, transformOrigin: "50% 0%" }}>
        {/* fita adesiva */}
        <div style={{ position: "absolute", left: 40, top: -22, width: 150, height: 44, background: "rgba(255,232,115,0.85)", transform: "rotate(-8deg)" }} />
        <div style={{ position: "absolute", right: 40, top: -18, width: 150, height: 44, background: "rgba(255,232,115,0.85)", transform: "rotate(6deg)" }} />
        <div style={{ background: C.paper, padding: "26px 34px 30px", boxShadow: "8px 12px 0 rgba(28,32,51,0.28)", backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`, backgroundSize: "36px 36px" }}>
          {kicker && <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 46, color: C.pen, marginBottom: 6, transform: "rotate(-1deg)" }}>{kicker}</div>}
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: size, lineHeight: 1.08, color: C.ink, letterSpacing: -1.5, textTransform: "uppercase" }}>
            {parts(title).map((p, i) => p.mark ? (
              <span key={i} style={{ position: "relative", whiteSpace: "nowrap" }}>
                <span style={{ position: "absolute", left: -8, top: "22%", bottom: "4%", width: `calc(${markT * 100}% + 16px)`, background: C.marker, transform: "skewX(-8deg)", borderRadius: 4 }} />
                <span style={{ position: "relative" }}>{p.text}</span>
              </span>
            ) : <span key={i}>{p.text}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};
