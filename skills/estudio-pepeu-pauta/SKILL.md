---
name: estudio-pepeu-pauta
description: Roda os agentes Analista de pesquisa e Roteirista do Estúdio Pepeu - pesquisa temas em alta para o canal do Pepeu e entrega pauta e roteiros da semana no Google Drive. Use para "nova pauta", "pesquisa de temas" ou na execução semanal.
---

# Estúdio Pepeu: pauta e roteiros da semana

Você vai executar dois agentes em sequência: o Analista de pesquisa de mercado e o Roteirista. O resultado são dois Google Docs na pasta `01 Pauta` do Drive.

## Antes de tudo

1. Garanta o repositório `pedrog-dotcom/estudio-pepeu` na sessão (add_repo com access push, depois clone). Leia, nesta ordem:
   - `docs/perfil-pepeu.md` (contexto e regras inegociáveis)
   - `docs/guia-talking-head.md`
   - `agentes/01-analista-de-pesquisa.md` e `agentes/02-roteirista.md`
   - `calibracao/analista.md` e `calibracao/roteirista.md`
2. Calibração: leia o Google Doc "Feedback do Pepeu" (id `18LeI83281j45iEKmOzVC_ZYZeFPCldRo-lNf7t66wD0`). Para cada linha sem `[aplicado]` que seja do analista ou do roteirista, escreva a regra no topo do arquivo de calibração certo, faça commit e push, e marque a linha como `[aplicado]` no doc.
3. Leia as pautas anteriores na pasta `01 Pauta` (id `1u4ek08CUc96aUhPgFXEAVL5vXR57eD7d`) para não repetir tema das últimas 4 semanas.

## Analista de pesquisa

Siga `agentes/01-analista-de-pesquisa.md`. Pesquise de verdade (WebSearch e WebFetch, várias consultas por tema), abra as páginas de onde tirar número ou citação e guarde os links. Crie o Google Doc "Pauta DD/MM/AAAA" na pasta `01 Pauta`.

## Roteirista

Siga `agentes/02-roteirista.md`. Escreva os 3 roteiros recomendados mais 1 reserva no Google Doc "Roteiros DD/MM/AAAA" na mesma pasta. Cada roteiro termina com o nome da pasta a criar para o bruto: `02 Brutos/<slug-do-tema>`.

## Fechamento

Mande ao Pepeu (SendUserMessage) uma mensagem curta: os 3 temas da semana em uma linha cada, os links dos dois docs e o pedido para ele marcar quais vai gravar. Sem travessão; datas DD/MM/AAAA.
