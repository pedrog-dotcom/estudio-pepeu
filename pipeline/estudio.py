"""Pipeline do Estudio Pepeu: do bruto ao MP4 final, no kit Caderno de Carreira.

Uso (a partir da raiz do repo):
  python3 pipeline/estudio.py prep    <bruto.mp4> <slug>      # transcodifica, transcreve, detecta vicios
  python3 pipeline/estudio.py build   <slug>                  # le work/<slug>/cortes.json -> base de cada video + voz
  python3 pipeline/estudio.py check   <slug>                  # vicios residuais + transcricao da voz editada
  python3 pipeline/estudio.py cenas   <slug>                  # le work/<slug>/cenas.json -> kit/src/videos/*.json + registro
  python3 pipeline/estudio.py render  <slug> [video ...]      # renderiza (Remotion) com cache limitado
  python3 pipeline/estudio.py final   <slug> [--max-mb 28]    # -14 LUFS, cabe no limite, folha de quadros, checagens

Arquivos de trabalho em work/<slug>/ (fora do git). O Diretor de arte escreve cortes.json e cenas.json; formatos no README.
"""
import json, os, re, subprocess, sys, wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / "kit"
WORK = ROOT / "work"
MODELS = Path(os.environ.get("WHISPER_DIR", str(ROOT / "models")))
FPS = 30
THR = -38  # dB: silencio
PROMPT = ("Carreira, CLT, promoção, TDAH, superdotação, altas habilidades, foco, estágio, júnior, pleno, sênior, especialista, "
          "dados, Python, SQL, Poli-USP, USP, UNIVESP, Decolar, Claro, martech, one-on-one, feedback, powerlifting, agachamento, "
          "supino, terra, ansiedade, burnout, terapia, psiquiatra.")


def sh(cmd, **kw):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, **kw)


def wdir(slug):
    d = WORK / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


# ------------------------------------------------------------------ whisper
def whisper_model():
    from pywhispercpp.model import Model
    path = MODELS / "ggml-base.bin"
    if not path.exists():
        MODELS.mkdir(parents=True, exist_ok=True)
        url = "https://github.com/aethersdr/AetherSDR/releases/download/asr-models-v1/ggml-base.bin"
        r = sh(f'curl -sSL -o "{path}" "{url}"')
        if r.returncode or path.stat().st_size < 1e8:
            sys.exit(f"Nao consegui baixar o modelo whisper de {url}. Coloque ggml-base.bin em {MODELS}.")
    return Model(str(path), n_threads=max(1, os.cpu_count() or 2), print_progress=False, print_realtime=False)


def load16(path):
    w = wave.open(str(path))
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


# ------------------------------------------------------------------ prep
def prep(raw, slug):
    d = wdir(slug)
    head = KIT / "public" / f"bruto_{slug}.mp4"
    print("1/4 transcodificando para 1080x1920 30fps...")
    r = sh(f'ffmpeg -v error -y -i "{raw}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" '
           f'-c:v libx264 -crf 18 -preset veryfast -g 30 -c:a aac -b:a 192k "{head}"')
    if r.returncode: sys.exit(r.stderr)
    sh(f'ffmpeg -v error -y -i "{head}" -vn -ac 1 -ar 16000 "{d}/audio16k.wav"')
    sh(f'ffmpeg -v error -y -i "{head}" -vn -ac 1 -ar 48000 "{d}/voz48k.wav"')
    a = load16(d / "audio16k.wav")
    n = len(a) // 160
    db = 20 * np.log10(np.sqrt((a[: n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-9)
    np.save(d / "db10ms.npy", db)

    dur = len(a) / 16000
    print("2/4 transcrevendo por trechos de fala...")
    transcrever(slug, a, db)

    print("3/4 detectando vicios de linguagem (eeee, aaaa, palavra alongada)...")
    fillers = detect_fillers(d / "audio16k.wav", db)
    json.dump(fillers, open(d / "vicios.json", "w"))
    meta = {"slug": slug, "head": head.name, "duracao_s": round(dur, 2), "bruto": str(raw)}
    json.dump(meta, open(d / "meta.json", "w"), ensure_ascii=False, indent=1)
    print(f"4/4 pronto: {len(fillers)} vicios. Transcricao em {d / 'transcricao.txt'}")


def speech_segments(db, min_pause=0.25):
    """Trechos de fala separados por pausas reais (envelope RMS de 10ms abaixo de -38 dB por >= min_pause)."""
    sil = db <= THR
    pauses, st = [], None
    for i, v in enumerate(np.r_[sil, False]):
        if v and st is None: st = i
        if not v and st is not None:
            if (i - st) / 100 >= min_pause: pauses.append((st / 100, i / 100))
            st = None
    dur, prev, speech = len(db) / 100, 0.0, []
    for s, e in pauses:
        if s - prev > 0.05: speech.append((prev, s))
        prev = e
    if dur - prev > 0.1: speech.append((prev, dur))
    return speech


def transcrever(slug, a=None, db=None):
    d = wdir(slug)
    if a is None: a = load16(d / "audio16k.wav")
    if db is None: db = np.load(d / "db10ms.npy")
    dur = len(a) / 16000
    merged = []
    for s, e in speech_segments(db):
        if merged and s - merged[-1][1] < 0.35 and e - merged[-1][0] < 12: merged[-1] = (merged[-1][0], e)
        else: merged.append((s, e))
    m = whisper_model()
    chunks = []
    for i, (s, e) in enumerate(merged):
        s0, e0 = max(0, s - 0.08), min(dur, e + 0.08)
        seg = np.concatenate([np.zeros(4800, np.float32), a[int(s0 * 16000):int(e0 * 16000)], np.zeros(4800, np.float32)])
        r = m.transcribe(seg, language="pt", initial_prompt=PROMPT, beam_search={"beam_size": 5, "patience": -1.0})
        chunks.append({"i": i, "s": round(s, 2), "e": round(e, 2), "text": " ".join(x.text.strip() for x in r)})
    json.dump(chunks, open(d / "chunks.json", "w"), ensure_ascii=False, indent=1)
    with open(d / "transcricao.txt", "w") as f:
        for c in chunks: f.write(f"{c['i']:03d} {c['s']:7.2f}-{c['e']:7.2f} | {c['text']}\n")
    return chunks


def flux(y, sr=16000):
    import librosa
    H = 160
    M = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=14, n_fft=512, hop_length=H)[1:]
    M = (M - M.mean(1, keepdims=True)) / (M.std(1, keepdims=True) + 1e-6)
    d = np.r_[0, np.linalg.norm(M[:, 2:] - M[:, :-2], axis=0), 0]
    d = np.convolve(d, np.ones(5) / 5, "same")
    _, vf, _ = librosa.pyin(y, fmin=70, fmax=300, sr=sr, frame_length=1024, hop_length=H)
    return d, vf


def sustained(d, voiced, T=1.70, W=30, min_frames=25):
    """Janelas de 0,3s com voz e espectro quase parado = vogal sustentada."""
    k = np.ones(W) / W
    md, mv = np.convolve(d, k, "same"), np.convolve(voiced.astype(float), k, "same")
    hit = (mv > 0.85) & (md < T)
    mark = np.zeros_like(hit)
    for c in np.where(hit)[0]: mark[max(0, c - W // 2):c + W // 2] = True
    mark &= voiced
    segs, st = [], None
    for i, x in enumerate(np.r_[mark, False]):
        if x and st is None: st = i
        if not x and st is not None:
            if segs and st - segs[-1][1] <= 5: segs[-1][1] = i
            else: segs.append([st, i])
            st = None
    out = []
    for a, b in segs:  # estende enquanto continua parado
        while a > 0 and voiced[a - 1] and d[a - 1] < 2.0: a -= 1
        while b < len(d) - 1 and voiced[b] and d[b] < 2.0: b += 1
        if b - a >= min_frames: out.append([a / 100, b / 100])
    return out


def detect_fillers(wav16, db):
    import librosa
    y, _ = librosa.load(str(wav16), sr=16000)
    d, vf = flux(y)
    n = min(len(d), len(db), len(vf))
    voiced = (db[:n] > -36) & vf[:n]
    return sustained(d[:n], voiced)


# ------------------------------------------------------------------ build (cortes + voz)
class Cutter:
    def __init__(self, d):
        self.d = d
        self.DB = np.load(d / "db10ms.npy")
        self.FILL = json.load(open(d / "vicios.json"))
        w = wave.open(str(d / "voz48k.wav")); self.SR = w.getframerate()
        self.AUD = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)
        self.meta = json.load(open(d / "meta.json"))

    def silent(self, t): return self.DB[min(max(int(t / 0.01), 0), len(self.DB) - 1)] <= THR

    def around(self, t):
        DB, i = self.DB, int(t / 0.01); l = r = i
        while l > 0 and DB[l - 1] <= THR: l -= 1
        while r < len(DB) - 1 and DB[r] <= THR: r += 1
        return l * 0.01, r * 0.01

    def sil_before(self, t):
        i, n = int(t / 0.01) - 1, 0
        while i > 0 and self.DB[i] <= THR: n += 1; i -= 1
        return n * 0.01

    def sil_after(self, t):
        i, n = int(t / 0.01), 0
        while i < len(self.DB) - 1 and self.DB[i] <= THR: n += 1; i += 1
        return n * 0.01

    def voiced(self, s, e, thr=-36, bridge=0.06):
        a, b = int(s / 0.01), int(e / 0.01); on = self.DB[a:b] > thr
        regs, st = [], None
        for k, v in enumerate(on):
            t = (a + k) * 0.01
            if v and st is None: st = t
            if not v and st is not None: regs.append([st, t]); st = None
        if st is not None: regs.append([st, b * 0.01])
        m = []
        for r in regs:
            if m and r[0] - m[-1][1] <= bridge: m[-1][1] = r[1]
            else: m.append(r)
        return [r for r in m if r[1] - r[0] >= 0.04] or [[s, e]]

    def phrase(self, ps, pe, first, last, tail):
        rem, log = [], []
        for a, b in [(a, b) for a, b in self.FILL if b > ps - 0.1 and a < pe + 0.1]:
            a, b = max(a, ps), min(b, pe)
            if b - a < 0.2: continue
            iso = self.sil_before(a) >= 0.12 and self.sil_after(b) >= 0.12
            if iso and a - ps > 0.3 and pe - b > 0.3:
                rem.append((a - min(0.25, self.sil_before(a)) + 0.12, b + min(0.25, self.sil_after(b)) - 0.12)); log.append(("isolado", a))
            elif pe - b < 0.35: pe = a + 0.07; log.append(("fim", a))
            elif a - ps < 0.35: ps = b - 0.05; log.append(("inicio", a))
            elif b - a > 0.22: rem.append((a + 0.09, b - 0.05)); log.append(("alongado", a))
        t = ps
        while t < pe:  # pausas longas viram 0,3s
            if self.silent(t):
                l, r = self.around(t)
                if r - l > 0.42 and l > ps and r < pe: rem.append((l + 0.15, r - 0.15))
                t = r + 0.01
            else: t += 0.01
        pieces, cur = [], ps
        for a, b in sorted(rem):
            if a > cur: pieces.append([cur, a])
            cur = max(cur, b)
        pieces.append([cur, pe])
        pieces = [p for p in pieces if p[1] - p[0] > 0.05]
        pre = min(0.16, self.sil_before(ps) / 2) if not first else min(0.04, self.sil_before(ps))
        post = min(0.22, self.sil_after(pe) / 2) if not last else min(tail, self.sil_after(pe))
        if not any(k == "inicio" for k, _ in log): pieces[0][0] -= pre
        pieces[-1][1] += 0.05 if any(k == "fim" for k, _ in log) else post
        return pieces, log

    def build(self, vid, units, tail=1.0):
        phrases = []
        for s, e, _ in units:
            if phrases and 0 <= s - phrases[-1][1] < 1.0: phrases[-1][1] = e
            else: phrases.append([s, e])
        clips, logs = [], []
        for pi, (ps, pe) in enumerate(phrases):
            pieces, log = self.phrase(ps, pe, pi == 0, pi == len(phrases) - 1, tail)
            logs += log
            for a, b in pieces:
                f0, f1 = int(round(a * FPS)), int(round(b * FPS))
                if f1 - f0 >= 2: clips.append({"trimBefore": f0, "durationInFrames": f1 - f0})
        for k, c in enumerate(clips): c["zoom"] = 1.0 if k % 2 == 0 else 1.08
        spans = [(c["trimBefore"] / FPS, (c["trimBefore"] + c["durationInFrames"]) / FPS) for c in clips]

        def to_out(t):
            o, best = 0.0, None
            for a, b in spans:
                if a - 1e-6 <= t <= b + 1e-6: return o + (t - a)
                if t < a and best is None: best = o
                o += b - a
            return best if best is not None else o

        words = []
        for ui, (s, e, text) in enumerate(units):
            regs = [[max(a, sa), min(b, sb)] for a, b in self.voiced(s - 0.03, e + 0.03) for sa, sb in spans if min(b, sb) - max(a, sa) > 0.02] or [[s, e]]
            ws = text.split(); total = sum(b - a for a, b in regs)
            wts = [max(len(re.sub(r"[^\wà-úÀ-Ú0-9%]", "", x)), 1) + 1.5 for x in ws]; W = sum(wts)

            def at(fr):
                x = fr * total
                for a, b in regs:
                    if x <= b - a: return a + x
                    x -= b - a
                return regs[-1][1]
            acc = 0
            for x, wt in zip(ws, wts):
                t0 = at(acc / W); acc += wt; t1 = at(acc / W)
                o0, o1 = to_out(t0), to_out(t1)
                words.append({"text": x, "startMs": round(o0 * 1000), "endMs": round(max(o1, o0 + 0.12) * 1000), "unit": ui})

        fade, parts = int(0.006 * self.SR), []
        for c in clips:
            a = int(c["trimBefore"] / FPS * self.SR); n = int(round(c["durationInFrames"] / FPS * self.SR))
            seg = self.AUD[a:a + n].copy()
            if len(seg) < n: seg = np.r_[seg, np.zeros(n - len(seg), np.float32)]
            ramp = np.linspace(0, 1, fade); seg[:fade] *= ramp; seg[-fade:] *= ramp[::-1]
            parts.append(seg)
        slug = self.meta["slug"]
        vname = f"voz_{slug}_{vid}.wav"
        vw = wave.open(str(KIT / "public" / vname), "w"); vw.setnchannels(1); vw.setsampwidth(2); vw.setframerate(self.SR)
        vw.writeframes(np.clip(np.concatenate(parts), -32768, 32767).astype(np.int16).tobytes()); vw.close()
        total = sum(c["durationInFrames"] for c in clips)
        return {"head": self.meta["head"], "voice": vname, "clips": clips, "captions": words, "durationInFrames": total}, logs


def build(slug):
    d = wdir(slug)
    cortes = json.load(open(d / "cortes.json"))
    cut = Cutter(d)
    for vid, spec in cortes["videos"].items():
        units = [tuple(u) for u in spec["trechos"]]
        base, logs = cut.build(vid, units)
        json.dump(base, open(d / f"base_{vid}.json", "w"), ensure_ascii=False)
        print(f"=== {vid}: {base['durationInFrames'] / FPS:.1f}s, {len(base['clips'])} cortes, {len(logs)} vicios tratados")
        print(" ".join(f"{w['text']}@{w['startMs'] / 1000:.1f}" for w in base["captions"]))


# ------------------------------------------------------------------ check
def check(slug, rounds=3):
    """Transcreve a voz editada e procura vogais sustentadas que sobraram; repete o build ate limpar (max 3 rodadas)."""
    d = wdir(slug)
    cortes = json.load(open(d / "cortes.json"))
    m = whisper_model()
    for it in range(rounds):
        residual = {}
        for vid in cortes["videos"]:
            base = json.load(open(d / f"base_{vid}.json"))
            r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(KIT / "public" / base["voice"]), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True)
            y = np.frombuffer(r.stdout, np.int16).astype(np.float32) / 32768
            dd, vf = flux(y)
            n = len(y) // 160
            db = 20 * np.log10(np.sqrt((y[: n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-9)
            n = min(len(dd), len(db), len(vf))
            voiced = (db[:n] > db.max() - 40) & vf[:n]
            hits = sustained(dd[:n], voiced, min_frames=15)
            srcs = []
            for a, b in hits:
                t, o = (a + b) / 2, 0
                for c in base["clips"]:
                    dur = c["durationInFrames"] / FPS
                    if o <= t < o + dur: srcs.append(c["trimBefore"] / FPS + (t - o)); break
                    o += dur
            residual[vid] = srcs
            if it == rounds - 1 or not srcs:
                txt = " ".join(x.text.strip() for x in m.transcribe(y, language="pt", initial_prompt=PROMPT))
                open(d / f"verificacao_{vid}.txt", "w").write(txt)
        print(f"rodada {it}: residuos {({k: len(v) for k, v in residual.items()})}")
        if not any(residual.values()): break
        F = json.load(open(d / "vicios.json")) + [[round(s - 0.17, 2), round(s + 0.17, 2)] for v in residual.values() for s in v]
        F.sort(); M = []
        for a, b in F:
            if M and a <= M[-1][1] + 0.05: M[-1][1] = max(M[-1][1], b)
            else: M.append([a, b])
        json.dump(M, open(d / "vicios.json", "w"))
        build(slug)
    for vid in cortes["videos"]:
        n = suspeitas(slug, vid)
        print(f"{vid}: {n} trechos suspeitos de gagueira ou recomeço em suspeitas_{vid}.txt")
    print(f"Transcricao da voz editada em {d}/verificacao_<video>.txt. Compare com o texto de cortes.json antes das cenas.")
    print("O Diretor resolve cada suspeita (corta, troca o trecho ou pede regravação) antes do render.")


def suspeitas(slug, vid):
    """Gagueira e recomeço: o Whisper limpa a fala e esconde repeticoes, entao procura no audio
    2 ou mais rajadas curtas (0,06 a 0,4s) separadas por micro pausas dentro de 1,2s.
    E um alerta para o Diretor ouvir o trecho, nao um corte automatico."""
    d = wdir(slug)
    base = json.load(open(d / f"base_{vid}.json"))
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(KIT / "public" / base["voice"]), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True)
    y = np.frombuffer(r.stdout, np.int16).astype(np.float32) / 32768
    n = len(y) // 160
    db = 20 * np.log10(np.sqrt((y[: n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-9)
    v = db > db.max() - 28
    segs, st = [], None
    for i, x in enumerate(np.r_[v, False]):
        if x and st is None: st = i
        if not x and st is not None: segs.append((st / 100, i / 100)); st = None
    bursts = []
    for k, (a, b) in enumerate(segs):
        gb = a - segs[k - 1][1] if k else 9
        ga = segs[k + 1][0] - b if k + 1 < len(segs) else 9
        if 0.06 <= b - a <= 0.40 and gb >= 0.05 and ga >= 0.05: bursts.append(a)
    groups = []
    for t in bursts:
        if groups and t - groups[-1][-1] <= 0.6: groups[-1].append(t)
        else: groups.append([t])
    groups = [g for g in groups if len(g) >= 2 and g[-1] - g[0] <= 1.2]

    def fonte(t):
        o = 0
        for c in base["clips"]:
            dur = c["durationInFrames"] / FPS
            if o <= t < o + dur: return c["trimBefore"] / FPS + (t - o)
            o += dur
        return -1

    cap = base["captions"]
    with open(d / f"suspeitas_{vid}.txt", "w") as f:
        f.write("Trechos com cara de gagueira ou recomeço (ouvir antes do render)\n")
        for g in groups:
            words = " ".join(c["text"] for c in cap if c["startMs"] / 1000 <= g[-1] + 0.3 and c["endMs"] / 1000 >= g[0] - 0.3)
            f.write(f"- video {g[0]:.1f}s a {g[-1]:.1f}s | bruto {fonte(g[0]):.1f}s | {words}\n")
    return len(groups)


# ------------------------------------------------------------------ cenas + registro
def cenas(slug):
    d = wdir(slug)
    spec = json.load(open(d / "cenas.json"))
    vdir = KIT / "src" / "videos"; vdir.mkdir(exist_ok=True)
    for vid, sc in spec["videos"].items():
        base = json.load(open(d / f"base_{vid}.json"))
        modes = sc["modes"]
        assert modes[0] == [0, "head"] and modes[1][0] >= 3.0, f"{vid}: o video abre no rosto e o palco so entra depois de 3s"

        def conv(o):  # "t" em segundos -> "at" em frames (itens de checklist, degraus, anilhas...)
            if isinstance(o, dict): return {("at" if k == "t" else k): (round(v * FPS) if k == "t" else conv(v)) for k, v in o.items()}
            if isinstance(o, list): return [conv(x) for x in o]
            return o
        beats = [{"at": b["at"], "el": b["el"], "props": conv(b.get("props", {})), **({"until": b["until"]} if "until" in b else {})} for b in sc["beats"]]
        out = dict(base, modes=[{"at": a, "mode": m} for a, m in modes], chapters=sc.get("chapters", []), beats=beats, punches=sc.get("punches", []))
        T = out["durationInFrames"] / FPS
        ms = modes + [[T, "end"]]
        stage = sum(ms[i + 1][0] - ms[i][0] for i in range(len(modes)) if modes[i][1] != "head")
        json.dump(out, open(vdir / f"{slug}_{vid}.json", "w"), ensure_ascii=False, indent=1)
        print(f"{slug}_{vid}: {T:.1f}s, palco {stage / T:.0%}, {len(beats)} animacoes")
    registrar()


def comp_id(name):
    return re.sub(r"[^A-Za-z0-9-]", "-", name)


def registrar():
    vdir = KIT / "src" / "videos"
    files = sorted(p for p in vdir.glob("*.json"))
    lines = ["// Gerado por pipeline/estudio.py. Nao edite a mao."]
    for i, p in enumerate(files): lines.append(f'import v{i} from "./{p.name}";')
    lines.append("export const VIDEOS: { id: string; data: { durationInFrames: number } }[] = [")
    for i, p in enumerate(files): lines.append(f'  {{ id: "{comp_id(p.stem)}", data: v{i} }},')
    lines.append("];")
    open(vdir / "index.ts", "w").write("\n".join(lines) + "\n")


# ------------------------------------------------------------------ render + final
def render(slug, vids):
    vdir = KIT / "src" / "videos"
    if not vids: vids = [p.stem.split("_")[-1] for p in vdir.glob(f"{slug}_*.json")]
    out = wdir(slug) / "render"; out.mkdir(exist_ok=True)
    if not (KIT / "node_modules").exists(): sh("npm ci --no-audit --no-fund", cwd=KIT)
    for v in vids:
        cid = comp_id(f"{slug}_{v}")
        print(f"renderizando {cid}...", flush=True)
        r = sh(f'npx remotion render {cid} "{out}/{v}_raw.mp4" --concurrency=2 --crf=18 --log=error --timeout=120000 '
               f'--offthreadvideo-cache-size-in-bytes=700000000 --media-cache-size-in-bytes=400000000', cwd=KIT)
        if r.returncode: sys.exit(f"falhou {cid}:\n{r.stdout[-2000:]}\n{r.stderr[-2000:]}")


def final(slug, max_mb=28.0):
    d = wdir(slug); out = d / "render"
    for raw in sorted(out.glob("*_raw.mp4")):
        v = raw.stem.replace("_raw", "")
        fin = out / f"{slug}_{v}.mp4"
        r = sh(f'ffmpeg -hide_banner -i "{raw}" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1')
        m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stdout + r.stderr, re.S).group(0))
        af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
              f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,alimiter=limit=0.89,aresample=48000")
        dur = float(sh(f'ffprobe -v error -show_entries format=duration -of csv=p=0 "{raw}"').stdout)
        vkbps = int(min(8000, (max_mb * 8 * 1024 / dur) - 192) * 0.96)  # cabe no limite de envio
        sh(f'ffmpeg -y -hide_banner -i "{raw}" -c:v libx264 -b:v {vkbps}k -pass 1 -preset medium -an -f null /dev/null', cwd=out)
        sh(f'ffmpeg -y -hide_banner -i "{raw}" -af "{af}" -c:v libx264 -b:v {vkbps}k -pass 2 -preset medium -pix_fmt yuv420p '
           f'-c:a aac -b:a 192k -movflags +faststart "{fin}"', cwd=out)
        e = sh(f'ffmpeg -hide_banner -i "{fin}" -af ebur128=peak=true -f null - 2>&1 | tail -12').stdout
        I = re.search(r"I:\s+(-?[\d.]+) LUFS", e).group(1); P = re.search(r"Peak:\s+(-?[\d.]+)", e).group(1)
        sil = sh(f'ffmpeg -hide_banner -i "{fin}" -af silencedetect=n=-45dB:d=1.2 -f null - 2>&1 | grep -c silence_start').stdout.strip()
        sh(f'ffmpeg -y -v error -i "{fin}" -vf "fps=1/2.5,scale=180:320,tile=8x6" -frames:v 1 "{out}/{slug}_{v}_folha.png"')
        mb = fin.stat().st_size / 1e6
        print(f"{fin.name}: {dur:.1f}s, {mb:.1f} MB, {I} LUFS, pico {P} dBFS, silencios >1,2s: {sil}")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    cmd = a[0]
    if cmd == "prep": prep(Path(a[1]).resolve(), a[2])
    elif cmd == "transcrever": transcrever(a[1])
    elif cmd == "build": build(a[1])
    elif cmd == "check": check(a[1])
    elif cmd == "cenas": cenas(a[1])
    elif cmd == "registrar": registrar()
    elif cmd == "render": render(a[1], a[2:])
    elif cmd == "final": final(a[1], float(a[a.index("--max-mb") + 1]) if "--max-mb" in a else 28.0)
    else: sys.exit(__doc__)
