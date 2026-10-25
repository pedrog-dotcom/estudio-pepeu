import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Identidade do canal: "caderno de engenharia + planilha".
// Papel quadriculado azulado, tinta azul-preta, marca-texto amarelo, verde de planilha para ganho,
// coral de carimbo para alerta. Tudo parece anotado a mao por quem organiza a vida no papel e no Excel.
export { C } from "./palette";
import { C } from "./palette";
void C;

export const F = {
  display: "Bricolage",
  hand: "Kalam",
  mono: "JetMono",
} as const;

// Canvas 1080x1920. Palco (animacao) em cima, rosto embaixo.
export const L = {
  W: 1080,
  H: 1920,
  SPLIT_Y: 860, // divisoria no modo dividido
  STAGE_H: 860, // altura de desenho do palco (coordenadas dos elementos)
  SAFE_TOP: 250, // UI do Instagram/TikTok no topo
  SAFE_BOTTOM: 1540, // UI no rodape
} as const;

let loaded = false;
export const loadKitFonts = () => {
  if (loaded) return;
  loaded = true;
  loadFont({ family: F.display, url: staticFile("fonts/bricolage-grotesque-latin-800-normal.woff2"), weight: "800" });
  loadFont({ family: F.display, url: staticFile("fonts/bricolage-grotesque-latin-700-normal.woff2"), weight: "700" });
  loadFont({ family: F.hand, url: staticFile("fonts/kalam-latin-700-normal.woff2"), weight: "700" });
  loadFont({ family: F.hand, url: staticFile("fonts/kalam-latin-400-normal.woff2"), weight: "400" });
  loadFont({ family: F.mono, url: staticFile("fonts/jetbrains-mono-latin-700-normal.woff2"), weight: "700" });
  loadFont({ family: F.mono, url: staticFile("fonts/jetbrains-mono-latin-500-normal.woff2"), weight: "500" });
};

export const brl = (v: number, decimals = 0) =>
  "R$ " +
  v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
