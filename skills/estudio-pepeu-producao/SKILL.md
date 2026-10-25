---
name: estudio-pepeu-producao
description: Roda Diretor de arte, Editor de vídeo, Designer e Social Media do Estúdio Pepeu - pega um bruto gravado pelo Pepeu, decide 3 vídeos, edita no kit Remotion e revisa até aprovar. Use quando o Pepeu disser que subiu um bruto ou na verificação de brutos novos.
---

# Estúdio Pepeu: produção dos 3 vídeos de um bruto

## Antes de tudo

1. Repositório `pedrog-dotcom/estudio-pepeu` na sessão (add_repo com push, clone). Leia `docs/perfil-pepeu.md`, `docs/identidade-caderno-de-carreira.md`, `docs/elementos-do-kit.md`, `docs/guia-talking-head.md`, os agentes 03, 04, 05 e 06 e os arquivos `calibracao/diretor-de-arte.md`, `editor.md`, `social-media.md`, `designer.md`.
2. Aplique o feedback novo do doc "Feedback do Pepeu" (id `18LeI83281j45iEKmOzVC_ZYZeFPCldRo-lNf7t66wD0`) para esses agentes, como descrito na skill de pauta.
3. Ambiente: `apt`/`pip install --break-system-packages numpy librosa pywhispercpp` se faltar, `npm ci` em `kit/`.

## Achar o bruto

- Pastas de tema em `02 Brutos` (id `1r7lt6zMSB5LLq-G7Qoa52fRorcDjgE_j`) sem pasta correspondente em `03 Edição` (id `1zENv6eXLWZqTqnipimf5S1JYbPzQWEHA`) são brutos novos. Se o Pepeu citou um tema, use esse.
- O vídeo bruto é grande demais para o conector do Drive. Pegue o arquivo pelo computador do Pepeu: a pasta do Google Drive para desktop está conectada à sessão; liste com `device_list_dir` e traga com `device_stage_files`. Se o computador não responder, avise o Pepeu (computador ligado e app do Claude aberto) e pare.
- Vários arquivos na mesma pasta de tema são partes do mesmo bruto: concatene em ordem de nome com ffmpeg antes do `prep`.

## Diretor de arte, Editor e Designer

Siga os agentes 03, 04 e 06 com `pipeline/estudio.py` (prep, build, check, cenas, render, final). O Diretor escreve `cortes.json`, confere `verificacao_<video>.txt` e escreve `cenas.json`. Crie a pasta `03 Edição/<tema>` com o Google Doc "Roteiro de edição" (os 3 vídeos, cortes, telas, animações, punch-ins, palavras em dúvida). Se faltar um elemento visual, o Designer cria antes do render e faz commit no repo.

## Revisão (loop até aprovar, no máximo 3 versões)

1. Envie os MP4 finais (até 28 MB cada) e as folhas de quadros para o computador do Pepeu, na pasta sincronizada `04 Aprovação/<tema>/vN/` (device_commit_files). Olhe você mesmo as folhas de quadros (Read na imagem).
2. Diretor de arte e Social Media revisam seguindo os agentes 03 e 05 e registram no Google Doc "Aprovação" em `04 Aprovação/<tema>`: aprovado ou lista de ajustes com tempo e motivo.
3. Com ajustes, o Editor gera a próxima versão e registra o que mudou. Depois de 3 versões sem acordo, pare e leve a divergência ao Pepeu.

## Fechamento

Quando os dois agentes aprovarem, mande ao Pepeu (SendUserMessage, e SendUserFile com os 3 MP4): o nome e a mensagem de cada vídeo, as palavras da legenda em dúvida e o pedido de aprovação final. A copy só é escrita depois que ele aprovar (skill estudio-pepeu-publicacao). Faça commit no repo de qualquer mudança no kit ou na calibração.
