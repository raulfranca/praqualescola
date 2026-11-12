# Assistente de Remoção 2.0: design

Data: 2026-11-12 · Status: aprovado pelo usuário em conversa (decisões abaixo)

## 1. Intenção

Professores da rede municipal fazem a remoção pela página da APUS
(`https://educ.apus.info/profWeb/atribRemocao/`). A página tem as informações, mas espalhadas:
uma tabela de escolas e, dentro de cada uma, uma lista de interessados que abre e fecha. Para
saber se tem chance numa escola, o professor precisa cruzar vagas, quem pediu aquela escola e a
classificação de cada um com a sua. Cada fase fica aberta 25 horas, e muita gente bem classificada
entra na última hora e tira a vaga de quem já tinha escolhido. Reavaliar rápido, várias vezes, faz
diferença.

O assistente responde duas perguntas, nesta ordem:

1. **Qual pedido meu está valendo agora, e eu ainda estou dentro das vagas?**
2. **Se não estou, para onde posso ir?**

Também deixa claro o estado do pedido, porque a plataforma confunde (selecionar uma escola não
grava nada; "Reiniciar" não cancela o pedido).

Já existe uma versão 1 (`remocao/Assistente de Remoção.txt`, TamperMonkey), documentada em
`remocao/documentacao_remocao.md`. Esta versão a substitui.

## 2. Objetivos, não objetivos, antiobjetivos

**Objetivos**
- Mostrar o estado do pedido e a posição real do professor, lidos do servidor a cada atualização.
- Listar as escolas onde a classificação do professor basta hoje.
- Mostrar o que mudou desde a última leitura, de forma discreta (opção B do mockup).
- Instalar com um link: uma página de passo a passo com um botão para arrastar à barra de favoritos.
- Publicar correções na hora, sem revisão de loja.

**Não objetivos**
- Escolher escola, finalizar ou qualquer ação que grave na APUS. O assistente **só lê**.
- Funcionar bem no celular. Prioridade: Chrome no computador e Chromebook. No celular a página
  orienta a usar o computador; o painel não pode quebrar em tela estreita, mas não é otimizado.
- Atualização automática periódica.
- Prever vagas em cascata (professores que vão sair de uma escola e abrir vaga).

**Antiobjetivos (seria fracasso mesmo funcionando)**
- Dizer "você entra" numa escola onde o professor não entra. Na dúvida, dizer que não conseguiu ler.
- Painel cheio de informação. Melhor perder detalhe que confundir.
- Volume de chamadas anormal no servidor da APUS (ver 5.4).

## 3. Restrições

- Roda dentro da página da APUS, no navegador do professor, com a sessão dele. Não há servidor
  próprio; não pede nem guarda senha.
- Entregue como favorito com `javascript:` (bookmarklet) que carrega um arquivo `.js` hospedado.
  Testado com sucesso em Chromebook gerenciado da Secretaria, conta de professor, em 2026-11-12
  (favorito roda e o código externo carrega na APUS).
- A APUS só tem CSP `frame-ancestors 'self'`: carregar `<script src>` de outro domínio funciona;
  embutir a APUS num iframe de outro site não.
- A página usa jQuery 1.12 e DataTables (já presentes). Pode usá-los; não carregar outras bibliotecas.
- Visual: design system `remocao/design-system/` ("Pra Qual Escola": coruja, Azul Coruja, sem
  emoji, sem linhas, voz de professor para professor, alvo de toque ≥ 44px).
- Hospedagem: GitHub Pages do repositório público `raulfranca/scripts`, a partir da raiz da
  branch `main`. Publicar = merge `dev` → `main` (ato do usuário).

## 4. Decisões do usuário

1. **Layout: opção B, "Lista que se explica"** (mockup em `remocao/.superpowers/brainstorm/.../painel-opcoes.html`):
   painel flutuante no canto superior direito; "Sua escolha" fixa no topo com etiqueta de situação
   e o "antes" escrito ao lado do "agora" (ex.: "antes era 1º"); abaixo, "Onde você entra · N" com
   etiquetas curtas por escola (Entra / Justo / Nova); uma linha discreta para escolas que saíram da
   lista desde a última leitura; cabeçalho com classificação, hora da leitura e botão de atualizar.
2. **Situação do pedido no topo**, com uma dica do próximo passo:
   - Nenhum pedido valendo (nunca escolheu ou optou por nenhuma escola).
   - Escola selecionada no campo, mas não gravada → "Clique em Finalizar para valer."
   - Pedido gravado → posição real naquela escola (dentro / fora das vagas).
   - Selecionou outra escola, mas o pedido gravado é outro → "Clique em Finalizar para trocar."
3. **Guardar só a leitura anterior** (para o "antes"/"o que mudou"). Vagas e concorrentes são
   relidos a cada atualização; nada da 1ª fase vale na 2ª.
4. **Distribuição: página de passo a passo + favorito.** Nada de Chrome Web Store (revisão lenta) nem
   TamperMonkey (etapas demais).
5. **Página de passo a passo**: conferir a barra de favoritos (Ctrl+Shift+B); **animação** mostrando o
   gesto de arrastar o botão até a barra; o botão real ao lado; como usar.
6. **Comportamento do favorito por local:**
   - Fora de `educ.apus.info` → vai para `https://educ.apus.info/professor/pinda` (login).
   - Em `educ.apus.info`, fora de `/profWeb/atribRemocao/` → vai para `https://educ.apus.info/profWeb/atribRemocao/`.
   - Na página da remoção → abre o painel.
   - Antes de redirecionar, aviso curto: "Levando você para a remoção. Quando a página abrir,
     clique de novo em Assistente de Remoção." (o favorito não sobrevive à troca de página).
7. Nome do favorito: **"Assistente de Remoção"**.

## 5. Como funciona (decidido na investigação; detalhes em `remocao/documentacao_remocao.md` §6)

### 5.1. Fontes de dados (só leitura)

- **Professor:** `#formEtapa3` → `ddREF_FUNCIONARIO` (código), `ddVIRTUAL_REF_FUNCIONARIO` (nome),
  `ddREF_PERIODO` (período, ex. 2027), `ddREF_ESCOLA_OPCAO1` / `ddVIRTUAL_REF_ESCOLA_OPCAO1`
  (escola **selecionada no campo**). Classificação: `td` com `Classificação: NNN`.
- **Fase:** título `Processo de Remoção - Nº FASE` → `remocaoFase = N`. Prazo: `Encerra em: ...`.
- **Escolas:** `jQuery('#grid-escolas').DataTable()` já existe ao carregar (vazia).
  `dt.ajax.reload(cb, false)` busca a lista (≈7 s; abre a janela `#div-info` sozinho: fechar com
  `#div-info .escolasBtFechar` se ela não estava aberta antes). Por linha: `DT_RowData.REF_ESCOLA`,
  `escola`, `vagas_real`, `inscritos` (HTML: extrair texto com o parser do navegador, por causa de
  `&nbsp;`).
- **Interessados:** `POST info.ajax.php` com `{ref_escola, ref_periodo, opcao:'img-inscritos', remocaoFase}`
  → `{erro, data:[{PROFESSOR, VINCULO, OPCAO, PONTOS}]}`. `PONTOS` = classificação em HTML.

### 5.2. Pedido gravado

O professor aparece na lista de interessados de **no máximo uma** escola (verificado: trocar de
escola o tira da anterior na hora; "optar por nenhuma" o tira de todas). Identificar por nome
(`PROFESSOR` = `ddVIRTUAL_REF_FUNCIONARIO`, sem diferenciar maiúsculas/espaços) **e** classificação.
- Encontrado em uma escola → pedido gravado nela.
- Encontrado em nenhuma → sem pedido valendo.
- Encontrado em duas → leitura inconsistente: avisar e pedir para atualizar.
- Comparar com `ddREF_ESCOLA_OPCAO1` para os estados "não gravada" e "trocar".

Observação: o professor só aparece em escolas com `inscritos > 0`, então a varredura de 5.4 sempre
o encontra se ele tiver pedido.

### 5.3. Conta

Para cada escola com vagas: `naFrente` = interessados com classificação **menor** que a do professor
(menor = melhor; empate não conta), **excluindo o próprio professor**. Posição = `naFrente + 1`.
- Entra: posição ≤ vagas. "Justo" quando posição = vagas.
- Escola com vagas e 0 inscritos: entra em 1º, sem chamada.
- Escola cuja lista falhou: **não** entra na lista de oportunidades; contar e avisar
  ("Não consegui ler N escolas. Atualize de novo.").

### 5.4. Chamadas ao servidor

- Só quando o professor abre o painel ou clica em Atualizar. Nunca em intervalo automático.
- Uma leitura da tabela de escolas + `info.ajax.php` **apenas** para escolas com vagas > 0 **e**
  inscritos > 0 (15 na 1ª fase de 2026), **mais** escolas com inscritos > 0 e 0 vagas só se for
  preciso achar o pedido do professor (ele pode ter pedido uma escola sem vaga). Decisão: ler todas
  com inscritos > 0 (cobre o pedido gravado e a conta); escolas com 0 inscritos nunca.
- Em fila, uma por vez, com pausa curta (≈150 ms) entre elas. Timeout por chamada (≈15 s).
- Mostrar progresso ("Lendo 4 de 15 escolas").
- Não executar duas atualizações ao mesmo tempo (clique repetido é ignorado enquanto lê).

### 5.5. Memória entre leituras

`localStorage` da origem `educ.apus.info`, chave por professor + período + fase. Guarda só a leitura
anterior: hora, pedido gravado e posição, e o conjunto de escolas onde entrava. Usada para:
"antes era Nº", etiqueta "Nova" e a linha "Saiu da lista desde HHhMM: ...". Leitura de outra fase ou
período é ignorada. Sem dados pessoais de terceiros (sem nomes de concorrentes).

## 6. Arquivos

| Arquivo | Papel |
|---|---|
| `remocao/assistente.js` | O assistente (IIFE, sem dependências externas, CSS injetado com tokens do design system). Exposto em `https://raulfranca.github.io/scripts/remocao/assistente.js` |
| `remocao/index.html` | Página de passo a passo com animação e o botão-favorito. `https://raulfranca.github.io/scripts/remocao/` |
| `remocao/coruja.svg` (ou embutida) | Marca no painel e na página |
| `.nojekyll` (raiz) | Faz o GitHub Pages servir os arquivos sem processar |
| `remocao/documentacao_remocao.md` | Atualizar: arquitetura nova, seção 5 (limitações) reescrita |
| `remocao/remocao_prd.md`, `remocao/remocao_changelog.md` | Criar, no padrão do repositório; versão inicial `0.2.0` (a v1 vira histórico) |
| `remocao/Assistente de Remoção.txt` | Manter como histórico da v1, sem uso |

**Favorito (loader):** `javascript:` curto que (a) fora de `educ.apus.info` redireciona para o login,
(b) fora da página de remoção redireciona para ela, (c) na página de remoção injeta
`<script src=".../assistente.js?v=<timestamp>">`. Se o script já estiver na página, o clique só
reabre/atualiza o painel (sem injetar de novo). Se o `.js` não carregar em 8 s, aviso de erro.

## 7. O que fica com quem constrói

- Microtexto exato (seguindo a voz do design system), animações do painel, ícones de traço.
- Animação da página de passo a passo (CSS/SVG; sem vídeo, sem GIF pesado).
- Estrutura interna do `assistente.js` (funções puras para a conta, testáveis com `node`).
- Como o painel se recolhe/fecha e reabre.

## 8. Chamadas minhas (não decididas explicitamente pelo usuário)

- Ler interessados de todas as escolas com inscritos > 0, inclusive sem vagas, para achar o pedido gravado.
- Escola com falha de leitura nunca aparece como oportunidade.
- Versão inicial `0.2.0` e arquivos PRD/changelog novos.
- GitHub Pages a partir da raiz da `main` com `.nojekyll`. **Ativar o Pages é configuração do
  repositório: pedir ao usuário.**
- Página de remoção sem fase aberta (título sem `Nº FASE` ou sem `#formEtapa3`): o painel mostra
  "Nenhuma fase de remoção aberta agora" e não faz chamadas.
- Classificação não encontrada: o painel explica e não calcula (sem `prompt()` como na v1).
- Quem tem a v1 instalada no TamperMonkey verá dois painéis: a página de passo a passo avisa para
  desativar a versão antiga.
- Comportamento da sessão expirada não foi testado (não quis derrubar a sessão do usuário): se
  `info.ajax.php` ou o reload devolverem algo que não seja JSON, tratar como "sessão expirada,
  entre de novo" e não como erro de escola.
