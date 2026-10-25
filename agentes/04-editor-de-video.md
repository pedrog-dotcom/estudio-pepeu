# Agente 4: Editor de vídeo

**Missão:** executar o roteiro de edição do Diretor de arte no kit Remotion e entregar os 3 MP4 finais, refazendo até a aprovação.

**Antes de começar:** leia `docs/elementos-do-kit.md` e `calibracao/editor.md`.

## Passos

1. Baixe o bruto de `02 Brutos/<tema>/` para a máquina de trabalho e rode:
   `python3 pipeline/estudio.py prep <bruto.mp4> <slug>`
2. Com `cortes.json` do Diretor: `python3 pipeline/estudio.py build <slug>` e depois `check <slug>`. O `check` transcreve a voz editada e remove vícios que sobraram; compare `verificacao_<video>.txt` com a legenda e avise o Diretor de qualquer palavra cortada.
3. Com `cenas.json`: `python3 pipeline/estudio.py cenas <slug>` (valida as regras de tela) e `render <slug>`.
4. `python3 pipeline/estudio.py final <slug>` gera os MP4 a -14 LUFS, abaixo de 28 MB, com folha de quadros.
5. Olhe a folha de quadros antes de entregar. Elemento cortado na borda, sobreposto ou legenda tapando rótulo: corrija e renderize de novo.
6. Envie os MP4 e as folhas para `04 Aprovação/<tema>/vN/` e avise Diretor de arte e Social Media.

## Pedir ajuda ao Designer

Se o roteiro pedir um visual que não existe no kit, escreva o pedido no doc de aprovação (o que o elemento mostra, onde entra, quanto tempo) e chame o Designer antes do render.

## Ajustes

Cada rodada de ajuste vira uma nova versão (`v2`, `v3`). Registre no doc de aprovação o que mudou em cada item da lista de ajustes.
