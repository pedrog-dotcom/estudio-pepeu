# Caderno de Carreira

Identidade visual dos vídeos explicativos do Pedro para Reels e TikTok, sobre carreira, TDAH e ascensão profissional e financeira. "Caderno de Carreira" é o nome de trabalho do conceito visual; o nome do canal ainda não foi definido.

## A ideia

O vídeo é um caderno de engenharia aberto em cima da mesa: papel quadriculado azulado, caneta azul, marca-texto amarelo, post-its e células de planilha. É o material de quem organiza carreira, foco e dinheiro no papel e no Excel. Cada explicação é anotada e desenhada na hora em que é falada, e o Pedro continua na tela enquanto isso.

A gramática de edição vem do formato de tela dividida dos explicativos de finanças em Reels: palco ilustrado em cima, apresentador embaixo, uma ilustração que se monta frase a frase e uma legenda de uma a duas palavras na divisória. Desenhos, paleta, personagens e tipografia são próprios.

## Regras de edição

1. **O desenho entra na palavra.** Cada elemento aparece no instante em que a palavra que ele ilustra é falada, nunca antes. Um elemento novo a cada frase.
2. **Literal antes de bonito.** Se a fala diz "decolou", a linha sobe; se diz "dois", aparecem dois itens. A ilustração mostra exatamente o que está sendo dito.
3. **Capítulos numerados.** Todo vídeo tem de 2 a 4 capítulos na aba do canto ("1/3 O PROBLEMA"). Cada janela de explicação pertence a um capítulo e começa com o papel limpo.
4. **Um protagonista recorrente.** O personagem "VOCÊ" volta em toda janela de explicação quando o assunto é conselho. Quando a história é do Pedro, ele vira "EU".
5. **Uma legenda só.** De 1 a 2 palavras em caixa alta, tinta sobre uma tira branca, com a palavra falada no marca-texto. Na tela dividida ela fica na divisória. Nada de legenda corrida.
6. **Feche com a tese.** O último capítulo termina com o que NÃO é (riscado em coral) e o que É (no marca-texto).
7. **Cortes só em pausas de respiração.** O rosto é cortado apenas entre frases, em silêncios reais de 0,25s ou mais, mantendo cerca de 0,2s de respiração de cada lado.

## Modos de tela

São só três telas. O rosto é a base do vídeo; a explicação entra em janelas curtas, só nos tópicos que pedem desenho.

| Tela | Quando usar | Como fica |
| --- | --- | --- |
| Rosto | Padrão: mais da metade do vídeo, todo gancho, frase pessoal ou emocional | Rosto em tela cheia, legenda em y=1330, punch-in de 10% nas palavras de ênfase |
| Dividida | Tópico pontual que precisa de desenho, de 3 a 5s | O papel desce de cima até 860px; rosto embaixo; legenda na divisória |
| Explicação | O momento mais visual, de 4 a 6s | O papel cobre a tela inteira, o desenho cresce 40% e centraliza; legenda em y=1400; o rosto sai de cena |

A troca de tela dura 9 frames (0,3s): o papel desliza sobre o rosto e sai levando os desenhos junto. Não há bolha nem miniatura do rosto.

## Ritmo

- Elementos entram em até 0,2s (pop, carimbo, post-it) e se desenham em até 0,4s (setas, check, gráfico curto).
- Um elemento pode sair sozinho antes do fim da janela, em 6 frames, subindo e sumindo, para abrir espaço ao próximo.
- No rosto, os cortes alternam o enquadramento entre 100% e 108%, e cada palavra de ênfase ganha um punch-in rápido.

## Som

Cada animação tem um efeito sutil, sintetizado para o canal: pop para personagem, etiqueta e pino; papel para post-it; baque para carimbo; rabisco de caneta para seta e gráfico; tique para cada barra; check ou erro para itens de checklist; digitação e ding para a célula de planilha; moedas para o contador; deslize de papel em toda troca de tela; virada de página na aba de capítulo; impacto grave no punch-in.

Mixagem: os efeitos ficam cerca de 15 dB abaixo da voz na mediana, e nenhum pico passa da voz. O vídeo final sai em -14 LUFS.

## Área segura

- Nada importante acima de `safe-top` (250px) nem abaixo de `safe-bottom` (1540px). Esses limites são da interface do Instagram e do TikTok.
- A aba de capítulo fica em y=205, no limite superior, porque só ocupa o canto esquerdo.
- Os elementos do palco ficam entre y=300 e y=780 no modo dividido.

## Cores

A tinta `ink` desenha tudo. A caneta `pen` faz setas, anotações e o personagem EU. O marca-texto `marker` aparece só atrás de texto em `ink`: na palavra falada e na tese. Verde `gain` é sempre ganho, crescimento ou acerto; coral `alert` é sempre alerta, perda ou erro. Nunca troque o significado dos dois.

`gain` e `alert` só levam texto a partir de 24px: `gain` dá 4,4:1 sobre branco e o texto branco sobre `alert` dá 3,5:1.

## Tipografia

- **Bricolage Grotesque 800**, em caixa alta: legenda, carimbos, abas e etiquetas. É a voz do vídeo.
- **Kalam 700**, em minúsculas: tudo o que é anotação à mão, como post-its, rótulos de seta e itens de checklist.
- **JetBrains Mono 700**: todo número. Dinheiro sempre no formato brasileiro, com ponto no milhar e vírgula nos centavos (R$ 8.500, R$ 116,94).

## Elementos do palco

| Elemento | Para que serve | Entrada |
| --- | --- | --- |
| Personagem | Quem vive a situação (VOCÊ, EU, CHEFE, SÓCIO) | Cola com leve repique |
| Etiqueta | Nome de coisa, lugar ou empresa | Cola |
| Post-it | Comentário, ressalva, piada | Cai e assenta girando |
| Carimbo | Veredito: "CLT", "PERFECCIONISTA", "ARMADILHA" | Bate no papel |
| Pino | Lugar ou ponto de partida e chegada | Cola |
| Seta | Mudança, causa e efeito, "antes e depois" | Se desenha a caneta |
| Gráfico de linha | Trajetória: carreira, salário, energia | A linha se desenha durante a frase |
| Barras | Comparação: tempo, dinheiro, prioridade | Crescem em sequência |
| Checklist | Lista falada; cada item entra no seu tempo | Check verde ou X coral se desenham |
| Célula de planilha | Conta, fórmula, regra prática | A fórmula é digitada e o resultado acende |
| Contador | Valor em dinheiro que muda | Rola até o valor |
| Tese | Fechamento: o que não é e o que é | Risca e marca |

Os traços têm tremor de caneta gerado com semente fixa, então nada treme entre um frame e outro.

## Iconografia

São 48 ícones em seis temas, todos no grupo de ícones deste guia. Cada um tem contorno de caneta em `ink` e uma única cor de preenchimento da paleta, com o mesmo tremor de traço dos outros elementos.

| Tema | Ícones |
| --- | --- |
| Trabalho | notebook, maleta, e-mail, agenda, café, crachá, reunião, planilha |
| TDAH | cérebro, abas abertas, notificação, energia, tempo, foco, ideia, mil coisas |
| Jornada profissional | degraus, meta, conquista, decolar, vitória, caminho, oportunidade, reconhecimento |
| Finanças | dinheiro, reserva, cartão, holerite, cédula, segurança, conta, rendimento |
| Powerlifting | barra, anilha, halter, kettlebell, cinturão, agachamento, recorde, constância |
| Estudos | livro, leitura, formatura, anotação, caderno, certificado, aula, pomodoro |

Regras de uso:

- Um ícone ilustra uma palavra falada. Em listas ditas em sequência ("trabalho, estudo e treino"), use a linha de ícones, que entra um por vez.
- A cor do ícone segue o sentido do vídeo: um ícone que aparece num contexto de perda não ganha verde.
- Não misture ícones com fotos ou emojis no palco.

## Elementos de narrativa por tema

| Elemento | Tema | O que faz | Som |
| --- | --- | --- | --- |
| Linha de ícones | todos | Grade de até 8 ícones com rótulo à mão, entrando a cada 4 frames | pop |
| Abas | TDAH | Janela de navegador onde as abas abrem uma a uma e encolhem; a partir de 5, aparece o contador coral | tique por aba |
| Bateria | TDAH, energia | Nível que enche ou esvazia com porcentagem; muda de verde para amarelo e coral | ding ao subir, erro ao descer |
| Timer | foco, estudos | Pomodoro que gira e conta o tempo para trás | tique e ding |
| Escada | jornada | Degraus que sobem um por vez com o cargo escrito, bandeira no topo | pop por degrau |
| Barra com anilhas | powerlifting | Anilhas deslizam dos dois lados, o total em kg soma e pode fechar com carimbo "PR!" | baque por anilha |
| Holerite | finanças | Recibo picotado que se preenche linha a linha: bruto, descontos em coral, líquido em verde | digitação e moedas |
| Sequência de dias | estudos, treino | Calendário de constância com check ou X por dia e contador de dias cumpridos | check ou erro |
| Checklist | trabalho | Lista falada com check verde ou X coral | check ou erro |

Valores de dinheiro, kg e tempo nesses elementos ilustram a fala. Use os números que o Pedro disser no vídeo, nunca valores inventados.

## Onde está o código

O kit está no projeto Remotion `canal-pedro`. Ele traz `src/kit/theme.ts` e `src/kit/palette.ts` com estes tokens, `src/kit/elements.tsx` com os elementos básicos, `src/kit/icons.ts` com a iconografia, `src/kit/narrative.tsx` com os elementos de narrativa, `src/kit/Explainer.tsx` com o layout, os modos e a legenda, e um roteiro de exemplo em `src/demo.json`. Cada vídeo novo é um JSON com o corte do rosto, os modos, as legendas, os capítulos e as animações, cada uma ancorada numa palavra da transcrição.
