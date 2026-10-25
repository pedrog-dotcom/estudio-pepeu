# Estúdio Pepeu

A rotina de 7 agentes de IA que produz os vídeos do canal do Pepeu, da pesquisa de tema à copy de postagem, com a identidade Caderno de Carreira.

## O fluxo

| # | Etapa | Agente | Entrada | Saída (Google Drive, pasta Estúdio Pepeu) | Quem aprova |
| --- | --- | --- | --- | --- | --- |
| 1 | Pesquisa semanal | Analista de pesquisa | Buscas, fóruns, redes, comentários | `01 Pauta/Pauta AAAA-MM-DD` | |
| 2 | Roteiros | Roteirista | Pauta | `01 Pauta/Roteiros AAAA-MM-DD` | **Pepeu escolhe o que gravar** |
| 3 | Gravação | Pepeu | Roteiros aprovados | `02 Brutos/<tema>/` (um bruto por tema) | |
| 4 | Roteiro de edição | Diretor de arte | Bruto + transcrição | `03 Edição/<tema>/Roteiro de edição` + `cortes.json` e `cenas.json` | |
| 5 | Edição | Editor de vídeo (+ Designer se precisar) | Roteiro de edição | `04 Aprovação/<tema>/v1/` com os 3 MP4 e as folhas de quadros | |
| 6 | Revisão | Diretor de arte + Social Media | MP4 da versão | `04 Aprovação/<tema>/Aprovação` (aprovado ou lista de ajustes) | Volta pro passo 5 até aprovar |
| 7 | Aprovação final | Pepeu | Vídeos aprovados pelos agentes | Responde "aprovado" ou com ajustes | **Pepeu** |
| 8 | Copies | Redator | Vídeos aprovados | `05 Publicação/<tema>/Copies` + MP4 finais | |
| 9 | Calibração | Todos | `Feedback do Pepeu` (doc na raiz) | `calibracao/<agente>.md` neste repo | |

Os papéis estão em `agentes/`. O contexto comum (quem é o Pepeu, regras inegociáveis do canal) está em `docs/perfil-pepeu.md`. A identidade visual está em `docs/identidade-caderno-de-carreira.md` e o formato de edição em `docs/elementos-do-kit.md`.

## Como cada parte roda

- **Pesquisa e roteiros:** tarefa agendada toda segunda, no Claude, com a skill `estudio-pepeu-pauta`.
- **Produção (passos 4 a 6):** quando o Pepeu avisa que subiu um bruto, ou na verificação diária, com a skill `estudio-pepeu-producao`. O render roda na nuvem; o bruto vem do Google Drive sincronizado no computador do Pepeu, então o computador precisa estar ligado com o app do Claude aberto.
- **Copies e calibração (passos 8 e 9):** skill `estudio-pepeu-publicacao`, depois da aprovação final.

## Pipeline de vídeo

```
python3 pipeline/estudio.py prep    <bruto.mp4> <slug>   # transcodifica, transcreve, acha vícios
python3 pipeline/estudio.py build   <slug>               # cortes.json -> cortes + voz sem vícios
python3 pipeline/estudio.py check   <slug>               # limpa vícios que sobraram e transcreve a voz editada
python3 pipeline/estudio.py cenas   <slug>               # cenas.json -> composições do kit (valida regras de tela)
python3 pipeline/estudio.py render  <slug>               # Remotion
python3 pipeline/estudio.py final   <slug>               # -14 LUFS, até 28 MB, folha de quadros
```

Dependências: `ffmpeg`, Node 20+, `npm ci` dentro de `kit/`, Python com `numpy`, `librosa` e `pywhispercpp`. O modelo whisper (`ggml-base.bin`) é baixado em `models/` na primeira execução.

## Calibração

Cada feedback do Pepeu vira uma regra curta no topo de `calibracao/<agente>.md`. Todo agente lê o seu arquivo antes de trabalhar. Quando um arquivo passar de 30 regras, junte as parecidas e apague as que outra regra já cobre.
