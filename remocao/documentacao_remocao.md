# Documentação: Assistente de Remoção (APUS)

Painel que roda dentro da página de remoção de professores da APUS
(`https://educ.apus.info/profWeb/atribRemocao/`). Responde duas perguntas: **qual pedido do
professor está valendo agora (e se ele está dentro das vagas)** e **em quais escolas a
classificação dele basta**, considerando os pedidos feitos até aquele momento.

* **Versão atual:** `0.2.0` (ver `remocao_changelog.md`). Requisitos: `remocao_prd.md`.
* **Distribuição:** página de passo a passo `https://praqualescola.vercel.app/remocao/` com um
  botão que o professor arrasta para a barra de favoritos (bookmarklet). Nada de TamperMonkey nem
  Chrome Web Store (revisão lenta demais para uma fase de 25 horas).
* **Dependências:** nenhuma externa. Usa o jQuery 1.12 e o DataTables que a própria APUS já carrega.
* **Design:** `design-system/` do app ("Pra Qual Escola": coruja, Azul Coruja, sem emoji). A página
  usa uma cópia de `tokens.css` e de dois ícones em `public/remocao/design-system/`.
* **Onde mora:** no repositório do app Pra Qual Escola, mas **fora do app React**: arquivos
  estáticos em `public/remocao/`, documentação e testes em `remocao/`. Até 2026-11-12 ficava em
  `raulfranca/scripts/remocao/`.
* **Histórico:** a versão 1 (userscript do TamperMonkey, `Assistente de Remoção.txt`) continua no
  repositório `raulfranca/scripts` (pasta `remocao/`) e está documentada no Anexo A.

> Escrita em 2026-11-12, com testes ao vivo na 1ª fase da remoção de 2026 (login do próprio
> usuário). O HTML e os endereços da APUS podem mudar entre um ano e outro: antes de cada processo,
> refaça a verificação da seção 4.2.

---

## 1. Como usar

1. Abra `https://praqualescola.vercel.app/remocao/` e arraste o botão **Assistente de Remoção**
   para a barra de favoritos (`Ctrl` + `Shift` + `B` se ela estiver escondida). Só uma vez.
2. Entre na APUS, abra a remoção e clique no favorito. O painel abre no canto superior direito e lê
   as escolas na hora (≈ 30 a 60 s, mostrando "Lendo X de N escolas").
3. Para ler de novo, use o botão de atualizar do painel. O painel compara com a leitura anterior.

Fora da APUS, o favorito abre o login (`https://educ.apus.info/professor/pinda`) numa nova aba e
deixa a página atual como está (se o navegador bloquear a aba, vai ao login na mesma aba); numa
página da APUS que não é a remoção, leva à remoção na mesma aba. O favorito não sobrevive à troca de página: quando a
página abrir, é preciso clicar nele de novo (o aviso diz isso).

**Testado em 2026-11-12:** Chromebook gerenciado da Secretaria, com conta de professor: o favorito
roda e o código de fora carrega na APUS.

O assistente **só lê**: nunca escolhe escola, finaliza, reinicia ou envia pedido.

**Prints da página de passo a passo** (`public/remocao/prints/*.png`): fotografias do painel real,
renderizado pelo próprio `assistente.js` com dados de exemplo (`Painel._renderEm`), sobre um esboço
da página da APUS (`remocao/tests/prints.html`). Se o visual do painel mudar, refaça os prints com
`node remocao/tests/fotografar-prints.mjs`. Os nomes de escola são inventados e não coincidem com escolas da rede.

---

## 2. A página da APUS

### 2.1. Estrutura geral

A página `atribRemocao/` é um assistente em abas (jQuery 1.12 + DataTables):

| Área | O que tem |
|---|---|
| Cabeçalho | Fase atual e prazo (`1º Fase de ... até ...`, `Encerra em: ...`) |
| Dados do professor | Matrícula, Cargo, Escola Sede, Funcionário, Vínculo e **`Classificação: NNN`** |
| Botão `#op-info-escolas` ("CLIQUE AQUI") | Abre o painel `#div-info` com a tabela `#grid-escolas` |
| Campo "Escolha a escola desejada" | Seletor de escola (tabela `#gridSelect`). **Não é usado pelo script** |
| "Optar por não escolher nenhuma escola" / "Finalizar" | Ações que gravam a escolha. **Não são usadas pelo script** |

### 2.2. Tabela de escolas (`#grid-escolas`)

É uma DataTable que mostra **todas** as escolas de uma vez (`page.len() === -1`, sem paginação;
66 escolas na inspeção). Colunas:

| Índice | Coluna | Conteúdo |
|---|---|---|
| 0 | Escolas | Nome da escola |
| 1 | Vagas | Número de vagas abertas |
| 2 | Professores da Sede | Número + ícone `img.img-professores` |
| 3 | Interessados na Sede | Número + ícone `img.img-inscritos` (**só aparece quando há inscritos**) |
| 4 | Quadro de Turmas | Ícone `img.img-turmas` |

Detalhes do HTML:

* Cada `<tr>` do corpo tem `role="row"` e classe `odd`/`even` (padrão DataTables).
* Cada célula envolve o conteúdo numa tabela interna `table.grid-td` (`td.grid-td-c1` = ícone,
  `td.grid-td-c2` = número). Por isso o script usa `innerText` da célula inteira, que devolve só o número.

### 2.3. Lista de interessados (linha-filha)

Clicar em `img.img-inscritos`:

1. Faz um XHR para `/profWeb/atribRemocao/info.ajax.php`.
2. Insere, logo abaixo da linha da escola, uma **linha-filha** do DataTables:
   ```
   tr.no-padding            ← sem role="row"
   └─ td.no-padding
      └─ div.slider          (display: block quando aberta)
         └─ table.grid-slider
            ├─ thead: Professor | Vínculo | Fase | Classificação
            └─ tbody: um <tr> por professor interessado
   ```
3. A classificação de cada concorrente fica na 4ª coluna (`td[3]`), dentro de um `<center>`.

**O clique é um alternador (toggle):** clicar de novo fecha a linha-filha. Cada abertura
dispara um novo XHR.

---


## 3. Arquitetura (v2)

| Arquivo | Papel |
|---|---|
| `public/remocao/index.html` | Página de passo a passo, com a animação de arrastar e o botão-favorito. Monta o link `javascript:` a partir de `favorito.js`, trocando `__BASE__` pela pasta publicada. |
| `public/remocao/favorito.js` | `favorito(amb)`: decide o que fazer conforme a página (login / remoção / abrir). Não pode usar nada de fora nem comentários `//`: vira texto no link. Injeta `assistente.js?v=<timestamp>` uma vez só (marca `data-assistente-remocao="carregando"` no `<html>`); se não carregar em 8 s, avisa e libera nova tentativa. |
| `public/remocao/assistente.js` | O assistente, em uma IIFE com quatro partes, descritas abaixo. |
| `public/remocao/design-system/` | Cópia de `tokens.css` e dos ícones `icone-app.svg` e `coruja-branca.svg` do `design-system/` do app. Se o design system mudar, copiar de novo. |
| `remocao/tests/*.test.js` | Testes do `Nucleo` e do favorito, no Vitest do app. `carregar.js` roda o script como o navegador (script comum, não módulo) e pega o que ele expõe em `module.exports`. |
| `remocao/tests/painel.html` | Todos os estados do painel com dados inventados, para revisão visual. |
| `e2e/remocao.spec.ts` | Página no navegador (`@remocao`): passo a passo, favorito com a pasta certa, `/remocao` sem barra, script servido como JavaScript, favorito fora da APUS levando ao login. |
| `vite.config.ts` | Middleware `paginaRemocao` (o Vite entrega `/remocao/` como `index.html`, igual à Vercel) e exclusão de `/remocao/` no service worker do app (`globIgnores` e `navigateFallbackDenylist`). Sem isso, quem já abriu o app veria a página "não encontrada" do app no lugar do passo a passo. |

Partes de `assistente.js`:

* **`Nucleo`** (puro, testado em Node): `textoDeHtml`, `numero` (aceita negativo), `lerFase`,
  `lerClassificacao`, `parametrosEscolas`, `escolasDaResposta` (lista de escolas: não-JSON = sessão
  expirada; `error` preenchido, lista vazia ou menor que `recordsTotal` = erro), `escolasDaTabela`
  (escola sem `REF_ESCOLA` fica com `codigo: null` e conta como falha), `interessadosDaResposta`,
  `respostaDoServidor`, `escolasParaConsultar`, `analisar`, `compararComAnterior`, `paraGuardar`, `emFila`.
* **`Apus`** (navegador): `lerPagina`, `carregarEscolas` (GET direto em `server_processing.info.php`,
  timeout 30 s; **não usa a tabela da tela**, nada abre e nenhum filtro digitado interfere),
  `buscarInteressados` (`info.ajax.php`, timeout 15 s).

**O que ainda vem da página (e por quê).** Só dados que a APUS escreve no HTML ao carregar a página e
que não mudam enquanto ela está aberta: os campos escondidos usados nas consultas (6.3), o formulário
`#formEtapa3` (nome, escola selecionada) e o texto "Classificação: NNN" (não existe consulta ao
servidor que devolva a classificação). Vagas, inscritos e concorrentes vêm sempre do servidor.
* **`Painel`**: Shadow DOM (a CSS da APUS não vaza), tokens do design system embutidos, opção B do
  mockup. Todo texto vindo da APUS entra por `textContent`.
* **Integração**: `iniciar` (segundo clique só reabre), `atualizar` (ignora clique enquanto lê),
  memória da leitura anterior em `localStorage` (`assistente-remocao:v1:<funcionário>:<período>:<fase>`;
  guarda hora, pedido e lista de escolas, sem nomes de concorrentes; só grava leitura sem falhas).
  Remove o painel da v1 (`#dash-container`) se estiver na página.

### 3.1. Regras da conta

* Classificação menor = melhor; empate não conta como "na frente".
* "É o professor" = nome igual (maiúsculas, espaços colapsados) **e** classificação igual.
* Posição na escola = concorrentes na frente + 1. Entra se posição ≤ vagas; **"Justo"** se posição = vagas.
* Escola com vagas ≤ 0 nunca é oportunidade. Escola com vaga e 0 inscritos: 1º lugar, sem chamada.
* Escola com leitura falha ou número ilegível **nunca** vira oportunidade: entra em "Não consegui ler N escolas".
* Estado do pedido: aparece em 1 lista → `gravado` (ou `trocar`, se o campo da tela mostra outra
  escola); em nenhuma → `nenhum` (campo vazio) ou `nao-gravado` (campo preenchido); em 2+ → `inconsistente`.
* A escola do pedido gravado não se repete em "Escolas com possibilidade". Ordem: maior folga, depois nome.

### 3.2. Chamadas ao servidor

Uma chamada `server_processing.info.php` (todas as escolas) + `info.ajax.php` **só para escolas com inscritos > 0** (15 na 1ª
fase de 2026), uma por vez, com 150 ms entre elas. Nunca em intervalo automático. Medido em
2026-11-12: 15 chamadas, nunca mais de uma ao mesmo tempo, ≈ 30 s no total (a tabela de escolas
sozinha leva ≈ 7 s).

---

## 4. Testes

### 4.1. Automáticos

`npx vitest run remocao` (entram no `npm test` e no portão do app) e
`node .claude/scripts/portao.mjs --e2e remocao` para a página.

### 4.2. Ao vivo, na APUS (só leitura)

1. A APUS é https: o script precisa vir de https (`localhost` seria bloqueado como conteúdo misto).
   Use a **prévia da Vercel** da branch (endereço no GitHub, na verificação da Vercel) ou, sem push,
   `npm run dev` com `cloudflared tunnel --url http://127.0.0.1:8080`.
2. Abrir `<endereço>/remocao/`, conferir a página e usar o link do botão na APUS (ou injetar
   `<script src="<endereço>/remocao/assistente.js?v=...">` pelo console). O favorito montado na
   prévia aponta para a prévia: serve só para testar.
3. Conferir: estado do pedido igual ao real, número de chamadas `info.ajax.php` = escolas com
   inscritos, uma só chamada `server_processing.info.php`, sem chamadas simultâneas, janela
   "Lista de pontuação" nunca aberta.
4. Visual: com `npm run dev`, `http://localhost:8080/remocao/tests/painel.html`. A página recarrega
   sozinha ao salvar `public/remocao/assistente.js` (plugin `paginaRemocao` em `vite.config.ts`).

---

## 5. Limitações conhecidas (v2)

* **Precisa de um clique a cada página.** O favorito não roda sozinho ao abrir a APUS.
* **Celular:** não é alvo. Arrastar não funciona; o painel não quebra, mas a APUS não é feita para celular.
* **É uma foto do momento.** Novos pedidos mudam o quadro: o professor precisa atualizar.
* **Vagas em cascata** (professores que vão sair de uma escola e abrir vaga) não entram na conta.
* **"Optou por nenhuma" e "nunca escolheu"** aparecem iguais (`nenhum`): a APUS não diferencia na página.
* **Leitura lenta** (30 a 60 s): o servidor responde uma chamada por vez.
* **Sessão expirada** não foi testada de verdade (derrubaria a sessão do usuário): o script trata
  resposta que não é JSON como sessão expirada.
* **Confiança no endereço:** quem controla o deploy de `praqualescola.vercel.app` (contas do GitHub e
  da Vercel) controla o código que roda na sessão dos professores na APUS. Manter verificação em
  duas etapas nas duas contas.

---

## 6. Fontes de dados da APUS (descobertas em 2026-11-12)

Mapeamento feito durante a 1ª fase de 2026, base da v2 (seção 3). Permite ler **tudo pelo
servidor, sem clicar na tela**, usando a sessão do próprio professor (mesma origem, cookies já
presentes). Todas as chamadas abaixo são **somente leitura**.

### 6.1. Tabela de escolas: DataTables server-side

* `jQuery('#grid-escolas').DataTable()` está em modo `serverSide`, com `ajax` GET em
  `server_processing.info.php` (relativo a `/profWeb/atribRemocao/`).
* Cada linha tem um objeto de dados (`dt.row(tr).data()` / `dt.rows().data()`):

  | Chave | Conteúdo |
  |---|---|
  | `escola` | Nome (HTML, extrair texto) |
  | `vagas_real` | Vagas (HTML com o número dentro de `table.grid-td`) |
  | `professores` | Professores da sede (HTML) |
  | `inscritos` | Nº de interessados (HTML; o ícone `img-inscritos` só vem quando > 0) |
  | `turmas` | Quadro de turmas (HTML) |
  | `DT_RowId` | `row_<REF_ESCOLA>_` |
  | `DT_RowData.REF_ESCOLA` | **Código da escola** (usado na chamada 6.2) |
  | `DT_RowData.COORD` | Latitude;longitude da escola |

* **Chamada direta (usada pela v2 desde 2026-11-12):** GET `server_processing.info.php` com o protocolo
  do DataTables (`draw`, `start=0`, `length=-1`, `search[value]=''`, `columns[i][data]` para
  `escola, vagas_real, professores, inscritos, turmas`) mais os campos que a própria tabela envia:
  `ref_periodo` (`#pIdDireita`), `remocaoFase` (`#remocaoFase`), `ref_funcionario` (`#pCdUsuario`),
  `id_menu` (`#id_menu`), `usuario_nome` (`#usuario_nome`). Resposta: `{ error, recordsTotal,
  recordsFiltered, data: [...] }`. Verificado ao vivo: 66 de 66 escolas, sem abrir nada na tela.
* **Por que não `dt.ajax.reload`:** o `dataSrc` da tabela da APUS abre a janela "Lista de pontuação"
  a cada resposta e mostra um alerta (SweetAlert) quando `error` vem preenchido. A v2 usava esse
  caminho e precisava fechar a janela depois; a chamada direta evita isso e não depende do filtro
  ou da paginação da tabela.

### 6.2. Interessados por escola: `info.ajax.php`

```js
jQuery.ajax({
  url: 'info.ajax.php', type: 'POST', dataType: 'json',
  data: { ref_escola: REF_ESCOLA, ref_periodo: PERIODO, opcao: 'img-inscritos', remocaoFase: FASE }
});
// → { erro: "", columns: {...}, data: [ { PROFESSOR, VINCULO, OPCAO, PONTOS }, ... ] }
```

* `PONTOS` é a **classificação**, embrulhada em HTML (`<center>209</center>`): extrair dígitos.
* `OPCAO` é a fase do pedido, com entidade HTML e espaços à direita (`"1&#170; Fase   "`).
  Segundo o usuário, a lista só mostra pedidos da fase atual: a coluna não muda a conta.
* `erro` vem como string vazia quando deu certo: **checar `erro` e o status HTTP** e tratar a
  escola como "não lida" em caso de falha (nunca como "sem concorrentes").
* É exatamente a chamada que o clique em `.img-inscritos` faz (`opcao` é o nome da classe do ícone).

### 6.3. Dados do professor e da fase

| Dado | Onde |
|---|---|
| Código do funcionário | `#formEtapa3 [name=ddREF_FUNCIONARIO]` |
| Nome | `#formEtapa3 [name=ddVIRTUAL_REF_FUNCIONARIO]` (campo desabilitado) |
| Período (`ref_periodo`) | `#formEtapa3 [name=ddREF_PERIODO]` (ex.: `2027`) |
| **Escola selecionada no campo** | `[name=ddREF_ESCOLA_OPCAO1]` (código) e `[name=ddVIRTUAL_REF_ESCOLA_OPCAO1]` (nome) |
| Classificação | `td` com o texto `Classificação: NNN` (não há campo próprio) |
| Fase (`remocaoFase`) | Campo escondido `#remocaoFase` (ex.: `1`; é o que a APUS envia nas consultas). Reserva: título `Processo de Remoção - 1º FASE` |
| Campos da consulta de escolas | Escondidos: `#pIdDireita` (= período), `#pCdUsuario` (= código do funcionário), `#id_menu`, `#usuario_nome` (login) |
| Prazo | Texto `Encerra em: Xdias HHh MMm SSs` |

A página é um assistente em abas: `#tabs-3` (escolha, `#formEtapa3`) e `#tabs-5` (finalização,
`#formEtapa5`, texto "Inscrição finalizada com sucesso").

### 6.4. Escolha selecionada x escolha gravada

**O campo `ddREF_ESCOLA_OPCAO1` não prova que o pedido foi gravado.** Teste de 2026-11-12: o
usuário selecionou uma escola no seletor sem finalizar. O campo passou a ter o código da escola,
mas a lista de interessados daquela escola (6.2), lida direto do servidor, **não** incluía o
professor.

Regra para o script:
* **Escolha gravada** = o professor aparece em `info.ajax.php` de alguma escola. Identificar por
  nome (`PROFESSOR` = `ddVIRTUAL_REF_FUNCIONARIO`, sem diferenciar maiúsculas) **e** classificação
  (`PONTOS` = classificação do cabeçalho), para não confundir homônimos.
* **Escolha só na tela** = campo preenchido, mas o professor não aparece em nenhuma lista. Avisar
  que o pedido ainda não vale.
### 6.5. Ciclo de vida do pedido (teste de 2026-11-12, 1ª fase)

O usuário fez o ciclo completo com o próprio login:

| Passo | Campo `ddREF_ESCOLA_OPCAO1` | Aba visível | Professor na lista (6.2)? |
|---|---|---|---|
| Página aberta, nada escolhido | vazio | `#tabs-3` | não |
| Escola selecionada no seletor | código da escola | `#tabs-3` | **não** |
| Clicou **Finalizar** | código | `#tabs-5`: `Protocolo: NNNNNNN` + "Inscrição finalizada com sucesso." | **sim** |
| Clicou **Reiniciar** (`#btInicio-tabs-5`) | código (mantido) | `#tabs-3` | **sim**: Reiniciar só volta à tela de escolha, **não cancela** o pedido |
| Recarregou a página | código (vem do servidor) | **`#tabs-5`** com o protocolo | sim |

Conclusões:
* **O pedido só vale depois de "Finalizar".** Selecionar a escola no campo não grava nada.
* **Pedido gravado ao abrir a página:** a página carrega direto em `#tabs-5` com `Protocolo: \d+`,
  e o campo já vem preenchido com a escola gravada. Bom sinal rápido, mas a fonte de verdade
  continua sendo a lista de interessados (6.2).
* **Depois de "Reiniciar",** o campo mostra a escola gravada até o professor trocar. Se ele
  selecionar outra escola e não finalizar, o pedido gravado continua sendo o antigo. O script
  deve comparar o campo com a escola em que o professor aparece nas listas e, se forem
  diferentes, avisar: "Você selecionou X, mas o pedido gravado ainda é Y. Clique em Finalizar
  para trocar."
* **Troca de pedido (verificado):** Reiniciar → selecionar outra escola → Finalizar. Gera um
  **protocolo novo**, e o professor **sai na hora** da lista da escola anterior e entra na da nova.
  Nunca há dois pedidos ao mesmo tempo: o professor aparece em no máximo uma lista por fase.
  Se aparecer em duas, tratar como leitura inconsistente e pedir para atualizar.
* **"Optar por não escolher nenhuma escola nesta fase" (botão azul "Clique Aqui"):** também gera
  protocolo ("Inscrição finalizada com sucesso"), esvazia o campo e **tira o professor da lista**
  da escola em que estava (verificado na escola anterior). Ao recarregar, a página abre em
  `#tabs-3` com o campo vazio, **igual a quem nunca escolheu**: pela página não dá para
  distinguir "optou por nenhuma" de "ainda não escolheu". Para o assistente, as duas situações
  são "sem pedido valendo".

### 6.6. Carga no servidor: ler pouco e em fila

Teste de 2026-11-12: disparar `info.ajax.php` para as 66 escolas ao mesmo tempo (mais uma
varredura em série que tinha ficado rodando) gerou mais de 100 requisições em cerca de 1 minuto.
O servidor passou a responder uma por vez, devagar (dezenas ficaram pendentes), o que sugere
que as requisições da mesma sessão são processadas em fila no servidor. A varredura foi
interrompida recarregando a página.

Regras para o script:
* **Só consultar escolas com inscritos > 0** (dado da lista de escolas, 6.1), inclusive as sem vaga,
  porque o pedido gravado do professor pode estar numa delas. Escola sem inscrito não precisa de
  chamada. Na 1ª fase de 2026 isso deu entre 15 e 18 chamadas, não 66.
* **Em fila, uma de cada vez**, com uma pequena pausa entre elas. Nunca em paralelo.
* **Só quando o professor clicar em Atualizar.** Sem atualização automática periódica.
* O volume resultante equivale ao de um professor abrindo os ícones de "Interessados" à mão.

### 6.7. Ressalvas da inspeção

* O fechamento da linha-filha é animado (`slideUp`): por alguns instantes a `.grid-slider` continua
  no DOM depois do clique de fechar. Outro motivo para não depender do DOM.
* As ferramentas de inspeção bloquearam a leitura do corpo das funções de clique da página
  (contêm dados de sessão). Os parâmetros foram obtidos interceptando `ajaxSend`.

---

### 6.8. Vagas negativas (achado no teste da v2)

A coluna **Vagas** pode vir **negativa** (ex.: `-2`), provavelmente professores excedentes na escola.
Em 2026-11-12, 10 das 66 escolas estavam assim. Uma leitura que descarte o sinal transforma "-2"
em "2 vagas" e lista a escola como oportunidade. `Nucleo.numero` preserva o sinal e a conta trata
vagas ≤ 0 como "sem vaga".

---

## 7. Publicação

* A Vercel publica `public/remocao/` como está (sem build): `https://praqualescola.vercel.app/remocao/`
  (página) e `.../remocao/assistente.js` (assistente). Cabeçalho padrão da Vercel para arquivos
  estáticos: `max-age=0, must-revalidate`.
* **Publicar = publicar o app** (`git-deploy`, merge `dev` → `main`). Vale no próximo clique de cada professor: o favorito pede
  `assistente.js?v=<timestamp>`, sem cache, e não precisa reinstalar.
* O favorito em si (o texto `javascript:`) só muda se `favorito.js` mudar. Nesse caso, quem já tinha o
  favorito continua com o antigo. Evite mudar `favorito.js`; mudanças de comportamento vão em `assistente.js`.
* **Versão própria**, separada da do app: `VERSAO` em `assistente.js`, rodapé de `index.html`,
  `remocao_prd.md` e `remocao_changelog.md` devem concordar. O `CHANGELOG.md` do app registra só o
  efeito para quem usa (ex.: "página do Assistente de Remoção").

---

## Anexo A. Versão 1 (TamperMonkey, histórico)

O que segue descreve o arquivo `Assistente de Remoção.txt` (v1, `@version 2.0`), substituído pela v2. Mantido como registro dos problemas que motivaram a reescrita.

### A.1. Seletores usados pelo script

| Seletor / critério | Para que serve | Onde |
|---|---|---|
| `td` cujo texto contém `Classificação:` | Ler a classificação do usuário | `getMyClassification` |
| `tr[role="row"]` | Percorrer as escolas | `runAnalysis` |
| `row.cells[0]`, `row.cells[1]` | Nome da escola e número de vagas | `runAnalysis` |
| `.img-inscritos` | Ícone que abre a lista de interessados | `runAnalysis` |
| `row.nextElementSibling` com classe `no-padding` | Linha-filha com os interessados | `waitForContent` |
| `.slider` (visível) e `.grid-slider` | Confirmar que a lista carregou | `waitForContent` |
| `.grid-slider tbody tr` → `td[3]` | Classificação de cada concorrente | `runAnalysis` |

> **Atenção:** a classe `no-padding` aparece tanto na `<tr>` da linha-filha quanto no `<td>`
> dentro dela; o script depende da classe na `<tr>`. Esse é o ponto mais frágil caso a APUS
> mude a forma de montar a linha-filha.

---

### A.2. Funcionamento do código

O script é uma IIFE única, sem estado persistente (nada em `localStorage`).

#### A.2.1. Inicialização (executa ao carregar a página)

1. Injeta o CSS (`<style>`) do painel e do modal.
2. Cria o painel flutuante `#dash-container` (fixo, canto superior direito, `z-index: 99999`) com:
   * `#user-rank-display`: classificação detectada (borda verde) ou aviso "⚠️ Não achei sua classificação" (borda vermelha);
   * `#btn-analyze`: botão "🔍 Analisar Minhas Chances";
   * `#status-msg`: linha de status.
3. Cria o overlay `.overlay-bg` e o modal `#result-modal` (ocultos) com a tabela `#res-tbody`.
4. Chama `getMyClassification()` uma vez e guarda em `myRank`.

#### A.2.2. Funções

| Função | Responsabilidade |
|---|---|
| `clean(text)` | Colapsa espaços e faz `trim`. |
| `wait(ms)` | `Promise` com `setTimeout`. |
| `getMyClassification()` | Acha o `td` com `Classificação:`, extrai o número por regex (`/Classificação:\s*(\d+)/i`); se falhar, junta todos os dígitos do texto. Retorna `null` se não achar o `td`. |
| `waitForContent(row, timeout)` | Polling a cada 200 ms até a linha-filha estar visível com a `.grid-slider`. Retorna a linha ou `null` no timeout. |
| `runAnalysis()` | Varredura principal (4.3). |
| `renderResults(data)` | Ordena, preenche `#res-tbody` e abre o modal. |

#### A.2.3. Algoritmo de `runAnalysis`

```
userRank = myRank  ou  prompt() pedindo a classificação manualmente
para cada tr[role="row"]:
    nome  = cells[0];  vagas = parseInt(cells[1]) || 0
    se vagas == 0 → pula (não abre a lista)
    se existe .img-inscritos:
        clica, espera a linha-filha (até 6 s)
        melhoresQueEu = nº de concorrentes com classificação < userRank
    posicaoReal = melhoresQueEu + 1
    se posicaoReal <= vagas → oportunidade
```

Regras de negócio embutidas:

* **Classificação menor = melhor** (1º lugar tem prioridade).
* Empate (mesma classificação) **não** conta como "melhor que eu".
* Escola com vagas e **sem nenhum inscrito** sempre vira oportunidade (posição 1).
* Linhas de cabeçalho também têm `role="row"`, mas `parseInt("Vagas")` dá `NaN → 0` e elas são puladas.

#### A.2.4. Resultado

* Ordenação: por `posicao - vagas` crescente, ou seja, primeiro as escolas com **mais folga**.
* Colunas do modal: **Escola** (com "N inscritos no total"), **Vagas**, **Sua Posição Real**
  (`Nº lugar`), **Concorrentes Melhores**, **Status** (sempre "Dentro das Vagas ✅").
* Sem oportunidades: mostra "Nenhuma escola encontrada onde sua classificação garanta a vaga no momento. 😔".
* O botão volta a ficar ativo como "🔍 Analisar Novamente".

---

### A.3. Limitações e armadilhas conhecidas

#### A.3.1. Precisa abrir a lista de escolas antes
Ao carregar a página, `#grid-escolas` ainda está vazia (só o cabeçalho). Se o usuário clicar em
"Analisar" antes do "CLIQUE AQUI", o script percorre só os cabeçalhos e diz que não há
oportunidades, sem avisar que faltou um passo.

#### A.3.2. Linhas já abertas são fechadas, e a escola vira falso positivo
Como o clique em `.img-inscritos` é um alternador, se o usuário já tiver aberto a lista de
interessados de uma escola, o script **fecha** a lista em vez de abrir. `waitForContent` dá
timeout, `melhoresQueEu` fica 0 e a escola aparece como oportunidade mesmo que não seja.
Também vale para quem roda a análise **duas vezes**: o código que fecharia a lista após ler
está comentado (`// btnInteressados.click();`), então na segunda execução as listas abertas
pela primeira são fechadas. **Recarregue a página antes de analisar de novo.**

#### A.3.3. Timeout trata a escola como livre
Se o XHR `info.ajax.php` demorar mais de 6 s, a escola é avaliada com 0 concorrentes, ou seja,
como oportunidade. Não há aviso de erro.

#### A.3.4. Coluna "Fase" é ignorada
A lista de interessados tem a coluna **Fase** (ex.: "1ª Fase"). O script conta todos os
interessados como concorrentes, sem distinguir em qual fase cada um pediu.

#### A.3.5. Só vagas já abertas
O cálculo usa a coluna **Vagas** do momento. Vagas que podem surgir por efeito cascata
(professores da escola que saírem para outra) não entram. Escolas com 0 vagas são puladas sem
abrir a lista.

#### A.3.6. É uma foto do momento
O resultado reflete os pedidos feitos até a hora da análise. Novos pedidos de professores
mais bem classificados mudam o quadro: a mensagem do modal ("no momento") já indica isso.

#### A.3.7. Outros pontos
* `@match *://educ.apus.info/*`: o painel aparece em **qualquer** página da APUS, não só na de remoção.
* `getMyClassification` roda só uma vez, no carregamento. Se o `td` não existir ainda, o usuário
  é obrigado a digitar a classificação no `prompt`.
* O fallback de `getMyClassification` junta **todos** os dígitos do `td`; se a célula tiver outros
  números além da classificação, o valor sai errado.
* O painel fixo cobre o menu do usuário no canto superior direito da APUS.
* Nomes de escola entram no modal via `innerHTML` sem escape (vêm da própria APUS, risco baixo).
* A análise é sequencial: uma escola por vez, com um XHR por escola que tenha vagas e inscritos.

---
