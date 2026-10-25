# Elementos do kit e formato dos arquivos de edição

Referência do Diretor de arte e do Editor de vídeo. Os arquivos ficam em `work/<slug>/`.

## cortes.json (Diretor de arte escreve, Editor executa)

Cada vídeo é uma lista de trechos do bruto: início e fim em segundos e o texto exato falado, que vira a legenda.

```json
{
  "videos": {
    "v1": {
      "titulo": "Não dá pra salvar todo mundo",
      "mensagem": "Quem sai da pobreza precisa aceitar que não pode salvar todo mundo",
      "gancho": "Uma das coisas mais difíceis da vida adulta...",
      "trechos": [
        [1.14, 10.83, "Uma das coisas mais difíceis da vida adulta de alguém que nasce de família pobre,"],
        [11.85, 16.85, "é perceber que você realmente não pode salvar todo mundo."]
      ]
    }
  }
}
```

Regras dos trechos:
- Use os limites de `transcricao.txt` (cada linha é um trecho entre pausas). Corte só em pausa; dentro de um trecho, só se `db10ms.npy` mostrar pausa de 0,12s ou mais.
- O texto é o que foi dito, corrigido. Se o pipeline remover um "Então" alongado no começo, tire a palavra da legenda.
- Não use trechos que são só vício ("Eeeee", "Ahm", "Kiii").
- O primeiro trecho é o gancho e precisa caber a frase-gancho nos primeiros 3s.

## cenas.json (Diretor de arte escreve depois do `build`, usando os tempos de saída das palavras)

```json
{
  "videos": {
    "v1": {
      "modes": [[0, "head"], [3.3, "split"], [9.8, "head"], [28.6, "anim"], [35.3, "head"]],
      "chapters": [{"at": 14.6, "index": 1, "total": 3, "title": "De onde você vem"}],
      "beats": [
        {"at": 3.4, "el": "Person", "props": {"x": 300, "y": 470, "label": "VOCÊ", "shirt": "#2A55C9"}},
        {"at": 12.45, "el": "Checklist", "props": {"x": 540, "y": 520, "w": 440, "title": "NOVA FUNÇÃO",
          "items": [{"text": "não sei fazer", "t": 12.8, "state": "falha"}, {"text": "assumo", "t": 15.4, "state": "ok"}]}}
      ],
      "punches": [1.4, 13.2]
    }
  }
}
```

- `at` dos beats e `punches` em segundos do vídeo final. Dentro de props, use `"t"` em segundos para tempos de itens (checklist, degraus, anilhas, abas); o pipeline converte para frames.
- `until` (opcional, segundos) faz o elemento sair antes da próxima troca de tela.

## Telas

| Modo | Uso | Regras |
| --- | --- | --- |
| head | Padrão, gancho e frases pessoais | O vídeo SEMPRE abre em head e o palco só entra a partir de 3,0s. Mais da metade do vídeo em head. |
| split | Tópico pontual, de 3 a 5s | Palco em cima (0 a 860 px), rosto embaixo. Elementos entre y=300 e y=760. Personagens com y ≤ 470, para o rótulo não cair na divisória. |
| anim | Momento mais visual, de 4 a 6s | O palco escala 1,68x a partir de (540, 520). Mantenha x entre 260 e 820 e y entre 400 e 730, senão corta na borda. |

## Elementos (props principais)

| Elemento | Props | Som automático |
| --- | --- | --- |
| Person | x, y, label, shirt (cor), mood (neutro, feliz, triste), scale | pop |
| Tag | x, y, text, variant (paper, ink, marker), size, rot | pop |
| PostIt | x, y, text, color (yellow, pink, blue, green), w, rot | papel |
| Stamp | x, y, text, color, size, rot | carimbo |
| Pin | x, y, label, color | pop |
| Arrow | from [x,y], to [x,y], bend, label, color | rabisco |
| LineChart | x, y, w, h, points (0 a 1), title, color, endLabel, dur (frames) | rabisco + ding |
| Bars | x, y, w, h, title, bars [{label, value, color}] | tique por barra |
| Checklist | x, y, w, title, items [{text, t, state: ok, falha ou aberto}] | check ou erro |
| Cell | x, y, ref_, formula, value, color, w | digitação + ding |
| Counter | x, y, from, to, dur, color, size, label | moedas |
| Thesis | x, y, not, is | rabisco + pop |
| Icon | x, y, name, size, label | pop |
| IconRow | x, y, items [{name, label, t}], cols, gap, rowGap, size | pop por ícone |
| Tabs | x, y, w, title, tabs [{label, t}] | tique por aba |
| Battery | x, y, from, to (0 a 1), dur, label | ding ou erro |
| Timer | x, y, minutes, dur, label | tique e ding |
| Stairs | x, y, w, h, steps [{label, t}], flag | pop por degrau |
| Barbell | x, y, plates [{kg, t}], bar, label, pr, size | baque por anilha |
| Payslip | x, y, w, title, rows [{label, value, t, kind: +, - ou =}] | digitação e moedas |
| Streak | x, y, marks [ok, falha...], every, label, cols, cell | check ou erro |

Ícones (48): trabalho: notebook, maleta, email, agenda, cafe, cracha, reuniao, planilha · TDAH: cerebro, abas, sino, bateria, relogio, fone, lampada, emaranhado · jornada: escada, alvo, bandeira, foguete, trofeu, caminho, porta, medalha · finanças: moeda, cofrinho, cartao, holerite, cedula, cadeado, calculadora, crescimento · powerlifting: barra, anilha, halter, kettlebell, cinto, rack, pr, giz · estudos: livro, pilha, capelo, lapis, caderno, diploma, quadro, pomodoro.

Cores: ink #1C2033, pen #2A55C9, gain #1E8C5A (só ganho), alert #EE4E36 (só perda ou alerta), marker #FFDD3C. Uma linha "parada" ou neutra vai em ink, nunca em verde.

## Componente novo (Designer)

Quando o Editor precisar de algo que não existe acima, o Designer cria um componente novo em `kit/src/kit/` seguindo `docs/identidade-caderno-de-carreira.md` (traço roughjs com semente fixa, paleta, fontes), registra em `ELEMENTS` e em `SFX_OF` no `Explainer.tsx`, e documenta aqui.
