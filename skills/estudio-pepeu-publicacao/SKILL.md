---
name: estudio-pepeu-publicacao
description: Roda o Redator do Estúdio Pepeu e a calibração - escreve as copies de Reels e TikTok dos vídeos aprovados pelo Pepeu e transforma o feedback dele em regras para os agentes. Use quando o Pepeu aprovar vídeos ou der feedback sobre qualquer entrega.
---

# Estúdio Pepeu: copies e calibração

## Antes de tudo

Repositório `pedrog-dotcom/estudio-pepeu` na sessão (add_repo com push, clone). Leia `docs/perfil-pepeu.md`, `agentes/07-redator.md` e `calibracao/redator.md`.

## Copies (depois da aprovação final do Pepeu)

1. Leia a pauta, o roteiro e o "Roteiro de edição" do tema (mensagem, palavras-chave e fontes de cada vídeo) e a transcrição final de cada vídeo.
2. Siga `agentes/07-redator.md` e crie o Google Doc "Copies" em `05 Publicação/<tema>` (pasta-mãe id `1HwYriJk3FwnaLhqtX-T-rQ23WwuxQSKM`), um bloco por vídeo, com a ordem e o dia de postagem que o Social Media sugeriu.
3. Copie os MP4 aprovados para `05 Publicação/<tema>` em `C:\Users\Pepeu\Downloads\Estúdio Pepeu\05 Publicação\<tema>\` no computador do Pepeu (device_commit_files).
4. Mande ao Pepeu o link do doc em uma linha.

## Calibração (sempre que o Pepeu der feedback, aqui ou no doc)

1. Leia o Google Doc "Feedback do Pepeu" (id `1OynTOcX3M8VMYOnD_FJuSOO_2kfB9vInTaR99DAV6bg`) e qualquer feedback que ele deu na conversa.
2. Para cada feedback novo, escreva no topo de `calibracao/<agente>.md` uma linha: `DD/MM/AAAA · gostou | não gostou | alterou · o que foi · regra que fica`, com a regra em uma frase imperativa e geral (o que fazer da próxima vez, não só neste vídeo). Se ele alterou um texto, compare a versão dele com a sua e escreva a regra que explica a diferença.
3. Se o feedback contradiz uma regra antiga, substitua a antiga. Acima de 30 regras num arquivo, junte as parecidas.
4. Commit e push com a mensagem "calibração: <agente>"; marque a linha do doc como `[aplicado]`.
5. Diga ao Pepeu, em uma linha por agente, que regra mudou.
