# Changelog — Assistente de Remoção

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versionamento: SemVer, linha própria deste script.

## [Não publicado]

### Alterado
- Progresso da leitura em percentual ("Analisando as escolas… 45%") em vez de "X de N escolas".
- A lista passa a se chamar "Escolas com vaga" e mostra todas as escolas com vaga para remoção, inclusive as sem chance, com etiqueta vermelha "Zero" (posição > vagas). A linha de comparação vira "Perdeu a chance desde HHhMM".
- Favorito fora da APUS abre o login numa nova aba (`window.open`), sem sair da página atual. Se o navegador bloquear a aba, cai no comportamento antigo (leva ao login na mesma aba).
- Página de passo a passo: trecho "Na remoção, passo a passo" com prints do painel real (dados de exemplo) sobre um esboço da página da APUS, em `public/remocao/prints/`.

## [0.2.0] — 2026-11-12

Reescrita completa. A v1 (`Assistente de Remoção.txt`, userscript do TamperMonkey, `@version 2.0`) fica como histórico.

### Adicionado
- Estado do pedido no topo do painel: sem pedido, não gravado, gravado (dentro/fora das vagas), trocar e leitura inconsistente, com a dica do próximo passo.
- Comparação com a leitura anterior: "antes era Nº", etiqueta "Nova" e "Saiu da lista desde HHhMM".
- Etiqueta "Justo" quando a posição é igual ao número de vagas.
- Aviso de escolas que não puderam ser lidas, de sessão expirada e de fase fechada.
- Favorito (bookmarklet) que leva ao login, leva à remoção ou abre o painel, conforme a página.
- Página de passo a passo (`remocao/index.html`) com animação de arrastar o botão para a barra de favoritos.
- Testes automáticos (Vitest e Playwright do app) e página de estados do painel.

### Alterado
- Leitura direto do servidor da APUS (lista de escolas e interessados) em vez de clicar nos ícones da tabela: nada abre na tela, filtros digitados não interferem e não há falsos positivos por lista já aberta ou demora.
- A fase é lida do campo que a própria APUS usa nas consultas, não do título da página.
- Só consulta escolas com inscritos, uma por vez, com pausa.
- Visual novo com o design system "Pra Qual Escola", em Shadow DOM.
- Distribuição pela página `praqualescola.vercel.app/remocao/`, publicada junto com o app Pra Qual Escola, em vez do TamperMonkey.

### Corrigido
- Escolas com vagas negativas (excedentes) não aparecem mais como oportunidade.
- Escola que demora ou falha não é mais tratada como "sem concorrentes".
- Escola sem código na resposta da APUS conta como "não consegui ler", em vez de virar o código "undefined".

### Removido
- `prompt()` pedindo a classificação manualmente.
- Painel da v1 é removido da página quando a v2 abre.
