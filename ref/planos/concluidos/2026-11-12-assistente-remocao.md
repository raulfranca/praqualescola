# Assistente de Remoção 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever o Assistente de Remoção como um painel carregado por favorito na página da APUS, que lê os dados pelo servidor, mostra o estado do pedido e as escolas onde o professor entra, e é distribuído por uma página de passo a passo no GitHub Pages.

**Architecture:** Um arquivo `remocao/assistente.js` com três camadas: `Nucleo` (funções puras, testadas em Node), `Apus` (leitura da página e chamadas ao servidor, testada ao vivo, só leitura) e `Painel` (DOM, testado numa página-harness com estados falsos). Um `remocao/favorito.js` contém a função do favorito, serializada pela página `remocao/index.html` num link `javascript:`. Tudo servido pelo GitHub Pages da `main`.

**Tech Stack:** JavaScript puro (ES2017, sem build), jQuery 1.12 + DataTables já presentes na APUS, `node --test` (Node 24) para os testes, HTML/CSS com os tokens de `remocao/design-system/tokens.css`.

**Spec:** `docs/superpowers/specs/2026-11-12-assistente-remocao-design.md`

## Global Constraints

- Só leitura: nenhuma chamada ou clique que grave na APUS (nunca Finalizar, Reiniciar, "optar por nenhuma", seletor de escola).
- Chamadas: `info.ajax.php` só para escolas com `inscritos > 0`; uma por vez; pausa de 150 ms; timeout de 15 s; nunca em intervalo automático; nunca duas atualizações simultâneas.
- Escola com leitura falha **nunca** aparece como oportunidade.
- Classificação menor = melhor; empate não conta como "na frente".
- Visual e voz: `remocao/design-system/README.md` (Azul Coruja `#164292`, Céu `#ebf2fa`, sem emoji, sem linhas, ícones de traço 1.75px, alvo ≥ 44px, frases curtas, imperativo nos botões).
- URLs: login `https://educ.apus.info/professor/pinda`; remoção `https://educ.apus.info/profWeb/atribRemocao/`; base pública `https://raulfranca.github.io/scripts/remocao/`.
- Nome do favorito: `Assistente de Remoção`.
- Aviso antes de redirecionar: "Levando você para a remoção. Quando a página abrir, clique de novo em Assistente de Remoção." (para o login: "Levando você para o login da APUS. Depois de entrar, abra a remoção e clique de novo em Assistente de Remoção.")
- Nada de dados de terceiros no `localStorage` (sem nomes de concorrentes).
- Sem commits automáticos: commitar só quando o usuário pedir (regra do harness). Versão inicial do script: `0.2.0`.

## Review Focus

1. **Homônimo na lista** (mesmo nome, classificação diferente): não é o professor; conta como concorrente. → teste em Task 2.
2. **`inscritos` ilegível** (HTML sem número): escola vai para falhas, nunca para "0 inscritos = entra em 1º". → teste em Task 2.
3. **Sessão expirada** (`info.ajax.php` devolve HTML/não-JSON): estado "sessão expirada", sem oportunidades, sem "nenhuma escola". → teste em Task 3.
4. **Tabela de escolas vazia após reload**: erro "não consegui ler a lista", não "nenhuma oportunidade". → teste em Task 2.
5. **Segundo clique no favorito / em Atualizar durante leitura**: não injeta o script de novo nem dispara segunda varredura. → teste em Task 6 e verificação em Task 5.

---

### Task 1: Núcleo — leitura de textos e números

**Files:**
- Create: `remocao/assistente.js` (seção `Nucleo` + rodapé de exportação)
- Test: `remocao/tests/nucleo.test.js`

**Interfaces:**
- Produces (`Nucleo.*`, exportado por `module.exports = { Nucleo }` quando `typeof module !== 'undefined'`; no navegador fica em `window.AssistenteRemocao.Nucleo`):
  - `textoDeHtml(html: string) -> string` — remove tags, decodifica `&nbsp; &amp; &lt; &gt; &quot; &#NNN; &#xHH;`, colapsa espaços, trim.
  - `numero(html: string) -> number|null` — primeiro inteiro do texto; `null` se não houver.
  - `normalizarNome(s: string) -> string` — `textoDeHtml`, maiúsculas, espaços colapsados.
  - `lerFase(texto: string) -> number|null` — de `Processo de Remoção - 1º FASE` (aceita `º`, `ª`, `o`).
  - `lerClassificacao(texto: string) -> number|null` — de `Classificação: 760`.
  - `escolasDaTabela(linhas: object[]) -> {codigo:string, nome:string, vagas:number|null, inscritos:number|null}[]` — de objetos DataTables (`DT_RowData.REF_ESCOLA`, `escola`, `vagas_real`, `inscritos`).
  - `interessadosDaResposta(json: any) -> {nome:string, classificacao:number|null}[]` — lança `Error('erro-apus')` se `json.erro` não vazio; `Error('resposta-invalida')` se `json` não tiver `data` array.

- [ ] **Step 1: Write the failing tests** (`node:test` + `node:assert/strict`, `require('../assistente.js').Nucleo`)

```js
test('textoDeHtml decodifica entidades e tira tags', () => {
  assert.equal(N.textoDeHtml('<table><td>&nbsp; 0</td></table>'), '0');
  assert.equal(N.textoDeHtml('1&#170; Fase   '), '1ª Fase');
});
test('numero', () => {
  assert.equal(N.numero('<center>209</center>'), 209);
  assert.equal(N.numero('&nbsp; 0'), 0);
  assert.equal(N.numero('<img class="x">'), null);
});
test('lerFase', () => {
  assert.equal(N.lerFase('Processo de Remoção - 1º FASE'), 1);
  assert.equal(N.lerFase('Processo de Remoção - 2ª FASE'), 2);
  assert.equal(N.lerFase('Processo de Remoção'), null);
});
test('lerClassificacao', () => {
  assert.equal(N.lerClassificacao('Vínculo: X\nClassificação: 760'), 760);
  assert.equal(N.lerClassificacao('sem nada'), null);
});
test('escolasDaTabela', () => {
  const [e] = N.escolasDaTabela([{ DT_RowData: { REF_ESCOLA: '40' }, escola: '<td>Dulce EM</td>', vagas_real: '<td>1</td>', inscritos: '<td>&nbsp;</td>' }]);
  assert.deepEqual(e, { codigo: '40', nome: 'Dulce EM', vagas: 1, inscritos: null });
});
test('interessadosDaResposta', () => {
  assert.deepEqual(N.interessadosDaResposta({ erro: '', data: [{ PROFESSOR: ' Ana  Lima ', PONTOS: '<center>209</center>' }] }),
    [{ nome: 'ANA LIMA', classificacao: 209 }]);
  assert.throws(() => N.interessadosDaResposta({ erro: 'x', data: [] }), /erro-apus/);
  assert.throws(() => N.interessadosDaResposta('<html>'), /resposta-invalida/);
});
```

- [ ] **Step 2: Run** `node --test remocao/tests/` — Expected: FAIL (`Cannot find module` / funções inexistentes).
- [ ] **Step 3: Implement** as funções acima em `remocao/assistente.js`. Estrutura do arquivo: uma IIFE `(function (raiz) { ... })(typeof window !== 'undefined' ? window : globalThis)`; dentro, `const Nucleo = {...}`; no fim, `if (typeof module !== 'undefined' && module.exports) module.exports = { Nucleo }; else iniciar();` (onde `iniciar` vem na Task 5; até lá, um stub vazio).
- [ ] **Step 4: Run** `node --test remocao/tests/` — Expected: PASS.

---

### Task 2: Núcleo — a conta, o estado do pedido e a comparação com a leitura anterior

**Files:**
- Modify: `remocao/assistente.js` (seção `Nucleo`)
- Test: `remocao/tests/nucleo.test.js`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `escolasParaConsultar(escolas) -> escola[]` — as com `inscritos > 0` **ou** `inscritos === null` (ilegível: consulta para não decidir no escuro).
  - `analisar({ professor:{nome, classificacao}, escolas, interessados: Map<codigo, {nome,classificacao}[] | 'falha'>, campoEscola: string }) -> Resultado`
  - `Resultado = { erro: null|'tabela-vazia', pedido: Pedido, oportunidades: Oportunidade[], falhas: string[] /* nomes */, lidas: number }`
  - `Pedido = { estado: 'nenhum'|'nao-gravado'|'gravado'|'trocar'|'inconsistente', escola: {codigo,nome}|null, escolaCampo: {codigo,nome}|null, posicao: number|null, vagas: number|null, dentro: boolean|null }`
  - `Oportunidade = { codigo, nome, vagas, posicao, justo: boolean }` — exclui a escola do pedido gravado; ordem: maior folga (`vagas - posicao`) primeiro, depois nome.
  - `compararComAnterior(resultado, anterior|null) -> { horaAnterior: string|null, posicaoAntes: number|null, novas: Set<codigo>, sairam: string[] }` — `posicaoAntes` só se o pedido anterior era na mesma escola.
  - `paraGuardar(resultado, { hora: string /* 'HHhMM' */ }) -> { hora, pedido:{codigo, posicao}|null, oportunidades:{codigo,nome}[] }`

Regras (do spec §5.2–5.3): "eu" = `normalizarNome(nome) === normalizarNome(professor.nome)` **e** `classificacao === professor.classificacao`. `naFrente` = interessados ≠ eu com `classificacao < professor.classificacao`. Escola com `vagas > 0` e `inscritos === 0`: posição 1, sem consulta. Escola com `interessados = 'falha'` ou ausente quando deveria ter sido consultada → `falhas`. Estado: gravado em 0 escolas → `campoEscola` vazio ? `'nenhum'` : `'nao-gravado'`; em 1 → `campoEscola` vazio ou igual ? `'gravado'` : `'trocar'`; em 2+ → `'inconsistente'`. `escolas.length === 0` → `erro: 'tabela-vazia'`.

- [ ] **Step 1: Write the failing tests** — fixture `base()` com professor `{nome:'RAUL TESTE', classificacao:760}` e escolas A (2 vagas, 2 inscritos: 649 e eu), B (1 vaga, 1 inscrito: 736), C (1 vaga, 0 inscritos), D (0 vagas, 1 inscrito: 500).

```js
test('pedido gravado dentro das vagas', () => {
  const r = N.analisar(base({ campo: 'A' }));
  assert.equal(r.pedido.estado, 'gravado'); assert.equal(r.pedido.escola.codigo, 'A');
  assert.equal(r.pedido.posicao, 2); assert.equal(r.pedido.dentro, true);
});
test('oportunidades excluem a escola do pedido e escolas cheias', () => {
  const r = N.analisar(base({ campo: 'A' }));
  assert.deepEqual(r.oportunidades.map(o => o.codigo), ['C']); // B: 736 na frente com 1 vaga
});
test('selecionado e não gravado', () => {
  const r = N.analisar(base({ campo: 'B', semEu: true }));
  assert.equal(r.pedido.estado, 'nao-gravado'); assert.equal(r.pedido.escolaCampo.codigo, 'B');
});
test('trocar: campo diferente do gravado', () => { assert.equal(N.analisar(base({ campo: 'C' })).pedido.estado, 'trocar'); });
test('nenhum pedido', () => { assert.equal(N.analisar(base({ campo: '', semEu: true })).pedido.estado, 'nenhum'); });
test('inconsistente quando aparece em duas listas', () => {
  assert.equal(N.analisar(base({ campo: 'A', euTambemEm: 'B' })).pedido.estado, 'inconsistente');
});
test('homônimo com outra classificação conta como concorrente', () => {
  const r = N.analisar(base({ campo: '', semEu: true, extraEm: { C2: [{ nome: 'RAUL TESTE', classificacao: 100 }] } }));
  assert.equal(r.pedido.estado, 'nenhum');
  assert.ok(!r.oportunidades.some(o => o.codigo === 'C2')); // C2: 1 vaga, homônimo 100 na frente
});
test('escola com falha nunca vira oportunidade', () => {
  const r = N.analisar(base({ campo: '', semEu: true, falha: 'B' }));
  assert.ok(!r.oportunidades.some(o => o.codigo === 'B')); assert.deepEqual(r.falhas, ['Escola B']);
});
test('inscritos ilegível: consulta, e sem resposta vira falha', () => {
  const esc = [{ codigo: 'X', nome: 'X', vagas: 1, inscritos: null }];
  assert.equal(N.escolasParaConsultar(esc).length, 1);
  const r = N.analisar({ professor: P, escolas: esc, interessados: new Map(), campoEscola: '' });
  assert.deepEqual(r.oportunidades, []); assert.deepEqual(r.falhas, ['X']);
});
test('tabela vazia', () => { assert.equal(N.analisar({ professor: P, escolas: [], interessados: new Map(), campoEscola: '' }).erro, 'tabela-vazia'); });
test('justo quando posição = vagas', () => { /* escola 2 vagas, 1 na frente → posicao 2, justo true */ });
test('compararComAnterior', () => {
  const r = N.analisar(base({ campo: 'A' }));
  const c = N.compararComAnterior(r, { hora: '14h32', pedido: { codigo: 'A', posicao: 1 }, oportunidades: [{ codigo: 'Z', nome: 'EM Santa Rita' }] });
  assert.equal(c.posicaoAntes, 1); assert.deepEqual([...c.novas], ['C']); assert.deepEqual(c.sairam, ['EM Santa Rita']);
  assert.equal(N.compararComAnterior(r, null).horaAnterior, null);
});
```

- [ ] **Step 2: Run** `node --test remocao/tests/` — Expected: FAIL nos testes novos.
- [ ] **Step 3: Implement** `escolasParaConsultar`, `analisar`, `compararComAnterior`, `paraGuardar`.
- [ ] **Step 4: Run** `node --test remocao/tests/` — Expected: PASS (todos).

---

### Task 3: Apus — leitura da página e do servidor

**Files:**
- Modify: `remocao/assistente.js` (seção `Apus`)
- Test: `remocao/tests/fila.test.js` (só a fila e a classificação de erros; o resto é verificado ao vivo)

**Interfaces:**
- Consumes: Task 1–2.
- Produces:
  - `Nucleo.emFila(itens, tarefa: (item) => Promise, { pausaMs = 150, aoProgresso?: (feitos, total) => void, esperar = ms => Promise }) -> Promise<Map<item, {ok:true, valor}|{ok:false, erro}>>` — estritamente sequencial; erro de um item não interrompe os demais, **exceto** `Error('sessao-expirada')`, que interrompe e é relançado.
  - `Apus.lerPagina(doc = document) -> { professor:{nome, classificacao, codigo}, periodo:string, fase:number, campoEscola:{codigo,nome}|null } | { erro: 'sem-fase'|'sem-classificacao' }` — seletores do spec §5.1.
  - `Apus.carregarEscolas() -> Promise<object[]>` — `jQuery('#grid-escolas').DataTable().ajax.reload(cb, false)`; lembra se `#div-info` estava visível antes (pela visibilidade real do conteúdo, não `display`) e, se não estava, clica `#div-info .escolasBtFechar` ao final; rejeita com `Error('tabela-indisponivel')` se `jQuery`/DataTable não existir; timeout 30 s.
  - `Apus.buscarInteressados(codigo, { periodo, fase }) -> Promise<{nome,classificacao}[]>` — `jQuery.ajax` POST `info.ajax.php`, `dataType:'text'`, `timeout:15000`; `JSON.parse` falhou → `Error('sessao-expirada')`; depois `Nucleo.interessadosDaResposta`.

- [ ] **Step 1: Write the failing tests** (`fila.test.js`, `esperar` instantâneo)

```js
test('emFila é sequencial e reporta progresso', async () => {
  let ativos = 0, pico = 0; const prog = [];
  await N.emFila([1, 2, 3], async () => { pico = Math.max(pico, ++ativos); await null; ativos--; return 'ok'; },
    { esperar: async () => {}, aoProgresso: (f, t) => prog.push(`${f}/${t}`) });
  assert.equal(pico, 1); assert.deepEqual(prog, ['1/3', '2/3', '3/3']);
});
test('emFila isola falhas comuns', async () => {
  const r = await N.emFila([1, 2], async i => { if (i === 1) throw new Error('x'); return i; }, { esperar: async () => {} });
  assert.equal(r.get(1).ok, false); assert.equal(r.get(2).valor, 2);
});
test('emFila interrompe em sessão expirada', async () => {
  await assert.rejects(N.emFila([1, 2], async () => { throw new Error('sessao-expirada'); }, { esperar: async () => {} }), /sessao-expirada/);
});
```

- [ ] **Step 2: Run** `node --test remocao/tests/` — Expected: FAIL.
- [ ] **Step 3: Implement** `Nucleo.emFila`, `Apus.lerPagina`, `Apus.carregarEscolas`, `Apus.buscarInteressados`.
- [ ] **Step 4: Run** `node --test remocao/tests/` — Expected: PASS.
- [ ] **Step 5: Verificação ao vivo (só leitura)** na aba da APUS já logada: injetar o arquivo local (`fetch` do conteúdo não é possível de `file://`; usar o servidor local da Task 4) e rodar no console: `await AssistenteRemocao.Apus.carregarEscolas()` → 66 linhas e janela fechada; `AssistenteRemocao.Apus.lerPagina()` → classificação 760, fase 1, período 2027; `await AssistenteRemocao.Apus.buscarInteressados('1', {periodo:'2027', fase:1})` → array com classificações. **Não** varrer todas as escolas aqui.

---

### Task 4: Painel — interface (opção B) e página-harness

**Files:**
- Modify: `remocao/assistente.js` (seção `Painel`)
- Create: `remocao/tests/painel.html` (harness: carrega `../assistente.js` e renderiza estados falsos lado a lado)
- Create: `remocao/tests/servidor.py` (servidor local com `Content-Type: text/javascript` e `Cache-Control: no-store`, porta 8765, raiz = repo)

**Interfaces:**
- Consumes: `Resultado`, `compararComAnterior` (Task 2).
- Produces:
  - `Painel.montar({ aoAtualizar: () => void, aoFechar: () => void }) -> void` — cria `#assistente-remocao` (Shadow DOM `mode:'open'`, para a CSS da APUS não vazar; CSS com os tokens embutidos e Inter via `@import` do Google Fonts com fallback `system-ui`), idempotente.
  - `Painel.mostrar(estado) -> void`, com `estado` um de:
    - `{ tipo:'lendo', feitos, total, classificacao }`
    - `{ tipo:'pronto', classificacao, fase, hora, resultado: Resultado, comparacao }`
    - `{ tipo:'erro', motivo: 'sem-fase'|'sem-classificacao'|'tabela-vazia'|'tabela-indisponivel'|'sessao-expirada'|'desconhecido' }`
  - `Painel.abrir()`, `Painel.fechar()`, `Painel.estaAberto() -> boolean`.

Layout (mockup B, `remocao/.superpowers/brainstorm/949-1794485397/content/painel-opcoes.html`): 320px, fixo `top:16px; right:16px`, `max-height: calc(100vh - 32px)` com rolagem interna, `z-index: 2147483000`; em telas `< 480px`, largura `calc(100vw - 16px)`. Cabeçalho: ícone `icone-app.svg` embutido como data-URI, "Assistente de Remoção", subtítulo `Classificação 760 · lido às 15h10`, botão de atualizar (ícone, `aria-label="Atualizar"`) e fechar. Blocos:

| `pedido.estado` | Etiqueta | Texto principal | Dica |
|---|---|---|---|
| `gravado` + `dentro` | `Dentro` (sucesso) | `Você é o Nº para N vaga(s)` (+ ` · antes era Nº` se `posicaoAntes` diferente) | — |
| `gravado` + `!dentro` | `Fora` (erro) | idem | `Veja abaixo onde você entra.` |
| `nao-gravado` | `Não gravado` (aviso) | `Você selecionou {escolaCampo}, mas o pedido ainda não vale.` | `Clique em Finalizar para valer.` |
| `trocar` | `Não gravado` (aviso) | `Você selecionou {escolaCampo}, mas o pedido gravado é {escola}.` | `Clique em Finalizar para trocar.` |
| `nenhum` | `Sem pedido` (info) | `Você não tem pedido valendo nesta fase.` | `Escolha uma escola e clique em Finalizar.` |
| `inconsistente` | `Confira` (aviso) | `Seu nome apareceu em mais de uma escola.` | `Clique em atualizar.` |

Lista "Onde você entra · N": nome, `Nº de N vaga(s)`, etiqueta `Entra` (sucesso) ou `Justo` (aviso) e `Nova` (info) se em `comparacao.novas`. Vazia: `Nenhuma escola com vaga para a sua classificação agora.` Linha discreta: `Saiu da lista desde {horaAnterior}: {nomes}`. Falhas: faixa aviso `Não consegui ler {n} escola(s). Clique em atualizar.` Erros: `sem-fase` → `Nenhuma fase de remoção aberta agora.`; `sem-classificacao` → `Não achei sua classificação nesta página.`; `tabela-vazia`/`tabela-indisponivel` → `Não consegui ler a lista de escolas. Clique em atualizar.`; `sessao-expirada` → `Sua sessão na APUS terminou. Entre de novo e clique em Assistente de Remoção.` Lendo: `Lendo {feitos} de {total} escolas…` com barra de progresso. Todo texto vindo da APUS entra por `textContent`, nunca `innerHTML`.

- [ ] **Step 1: Criar `painel.html`** com 8 estados: gravado-dentro (com "antes era"), gravado-fora, nao-gravado, trocar, nenhum (lista vazia), com falhas, lendo, erro sessão. Em cada um, um contêiner próprio onde o painel é montado (o harness chama uma função de teste `Painel._renderEm(elemento, estado)` exposta só para isso).
- [ ] **Step 2: Implement** `Painel` e `_renderEm`.
- [ ] **Step 3: Verificar no navegador:** `python -I remocao/tests/servidor.py` e abrir `http://127.0.0.1:8765/remocao/tests/painel.html`; screenshot; conferir cada estado contra a tabela acima e o mockup B (sem emoji, sem bordas exceto campo, sombras azul-noite, alvos ≥ 44px). Conferir também com a janela em 400px de largura.

---

### Task 5: Integração na APUS

**Files:**
- Modify: `remocao/assistente.js` (função `iniciar` e `atualizar`)

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: `window.AssistenteRemocao = { versao: '0.2.0', Nucleo, Apus, Painel, abrir(): void, atualizar(): Promise<void> }`.
  - `iniciar()`: se `window.AssistenteRemocao` já existe, só chama `abrir()` (abre e atualiza) e sai. Senão registra, monta o painel e chama `atualizar()`.
  - `atualizar()`: ignora se já houver leitura em curso (`lendo` flag). Fluxo: `lerPagina` → `carregarEscolas` → `escolasDaTabela` → `escolasParaConsultar` → `emFila(buscarInteressados)` → `analisar` → ler anterior do `localStorage` → `compararComAnterior` → `Painel.mostrar(pronto)` → gravar `paraGuardar` (só se não houve falhas e sem erro). Chave: `assistente-remocao:v1:{codigoFuncionario}:{periodo}:{fase}`. Erros conhecidos viram `Painel.mostrar({tipo:'erro', motivo})`; desconhecidos → `'desconhecido'` + `console.error`.
  - Desativar o painel da v1 se presente na página: remover `#dash-container`, `#result-modal`, `.overlay-bg` (evita dois painéis para quem ainda tem o TamperMonkey).

- [ ] **Step 1: Implement** `iniciar`, `atualizar`, `abrir`.
- [ ] **Step 2: Run** `node --test remocao/tests/` — Expected: PASS (o arquivo continua carregável em Node).
- [ ] **Step 3: Verificação ao vivo** com o servidor local + túnel `cloudflared tunnel --url http://127.0.0.1:8765` (ou injeção direta pela aba de teste): na APUS, injetar `<script src="{túnel}/remocao/assistente.js?v=...">`. Esperado: painel abre, progresso "Lendo X de N" com N = escolas com inscritos > 0 (15 na 1ª fase de 2026), estado do pedido igual ao real do usuário, lista coerente com a tabela; `read_network_requests` mostra chamadas `info.ajax.php` sem sobreposição; clicar Atualizar duas vezes rápido não duplica chamadas; a janela de lista de escolas não fica aberta. Segunda leitura mostra "antes era"/"Nova" coerentes.

---

### Task 6: Favorito (loader)

**Files:**
- Create: `remocao/favorito.js`
- Test: `remocao/tests/favorito.test.js`

**Interfaces:**
- Produces: `function favorito(amb)` — autossuficiente (sem referências externas: será serializada com `toString()`); `amb` padrão `{ loc: location, doc: document, agora: Date.now(), esperar: (fn, ms) => setTimeout(fn, ms), base: '__BASE__' }`. Retorna a ação tomada: `'login' | 'remocao' | 'carregar' | 'reabrir'`.
  - host ≠ `educ.apus.info` → aviso de login e, após 1800 ms, `loc.href = 'https://educ.apus.info/professor/pinda'` → `'login'`.
  - host = `educ.apus.info` e `pathname` não começa com `/profWeb/atribRemocao` → aviso da remoção e, após 1800 ms, `loc.href = 'https://educ.apus.info/profWeb/atribRemocao/'` → `'remocao'`.
  - na remoção e `window.AssistenteRemocao` existe → `AssistenteRemocao.abrir()` → `'reabrir'`.
  - na remoção, sem assistente → injeta `<script src="{base}assistente.js?v={agora}">` com `onerror` e timeout de 8000 ms que mostram `Não consegui carregar o assistente. Confira a internet e clique de novo.` → `'carregar'`. Um segundo clique antes do carregamento terminar não injeta outro script (marcar `doc.documentElement.dataset.assistenteRemocao = 'carregando'`).
  - Avisos: pequeno cartão fixo no topo direito, estilo dos tokens (Céu/Azul Coruja), criado com `textContent`.
- Rodapé: `if (typeof module !== 'undefined') module.exports = { favorito };`

- [ ] **Step 1: Write the failing tests** com `amb` falso (`doc` mínimo: `createElement` → objeto com `style`, `dataset`, `appendChild`; `body.appendChild` registra; `documentElement.dataset`), `esperar = fn => fn()`:

```js
test('fora da APUS vai para o login', () => { const a = fake('www.google.com', '/'); assert.equal(favorito(a), 'login'); assert.equal(a.loc.href, 'https://educ.apus.info/professor/pinda'); });
test('na APUS fora da remoção vai para a remoção', () => { const a = fake('educ.apus.info', '/profWeb/menu/'); assert.equal(favorito(a), 'remocao'); assert.equal(a.loc.href, 'https://educ.apus.info/profWeb/atribRemocao/'); });
test('na remoção injeta o script uma vez', () => {
  const a = fake('educ.apus.info', '/profWeb/atribRemocao/');
  assert.equal(favorito(a), 'carregar'); assert.equal(favorito(a), 'carregar');
  assert.equal(a.scripts.length, 1); assert.match(a.scripts[0].src, /assistente\.js\?v=/);
});
test('com assistente presente, reabre', () => { /* global AssistenteRemocao falso com abrir() espião */ });
```

- [ ] **Step 2: Run** `node --test remocao/tests/` — Expected: FAIL.
- [ ] **Step 3: Implement** `favorito`.
- [ ] **Step 4: Run** `node --test remocao/tests/` — Expected: PASS.

---

### Task 7: Página de passo a passo

**Files:**
- Create: `remocao/index.html`
- Create: `.nojekyll` (raiz do repositório, vazio)

**Interfaces:**
- Consumes: `favorito.js` (Task 6) via `<script src="favorito.js">`. O link é montado assim: `'javascript:(' + favorito.toString().replace('__BASE__', new URL('./', location.href).href) + ')()'`, em `encodeURI`-safe (trocar `%` por `%25` antes).

Conteúdo (voz do design system, sem emoji; reaproveitar a estrutura e estilos validados no teste do Chromebook):
1. Título "Assistente de Remoção" + uma frase: `Veja em quais escolas a sua classificação basta, e se o seu pedido está valendo.`
2. Passo 1 — `Mostre a barra de favoritos`: `Ctrl` + `Shift` + `B`.
3. Passo 2 — `Arraste o botão até a barra de favoritos`: **animação** em CSS/SVG (loop de ~4 s, pausa com `prefers-reduced-motion`): uma janela de navegador estilizada com a barra de favoritos vazia; um cursor pega o botão "Assistente de Remoção" na página, arrasta até a barra e solta; o favorito aparece na barra. Ao lado/abaixo, o botão real (gradiente primário, 44px, `cursor: grab`; clique nele mostra dica em linha "Arraste, não clique." em vez de `alert`).
4. Passo 3 — `Entre na APUS e clique no favorito`: explica que, fora da remoção, o favorito leva até lá e é preciso clicar de novo quando a página abrir.
5. Bloco "Não consegui arrastar": código para criar o favorito à mão (`Ctrl` + `D`, "Mais", colar no endereço), `textarea` somente leitura.
6. Aviso para celular (detectado por `userAgent`): `Use no computador ou no Chromebook. No celular o favorito não funciona bem.`
7. Aviso para quem usava a versão antiga: `Se você instalou a versão antiga pelo TamperMonkey, desative-a.`
8. Rodapé: `Só lê a página da APUS. Não escolhe escola nem envia nada.`

- [ ] **Step 1: Implement** `remocao/index.html` e `.nojekyll`.
- [ ] **Step 2: Verificar no navegador** (`http://127.0.0.1:8765/remocao/`): screenshot desktop e 400px; animação roda e para com `prefers-reduced-motion`; o `href` do botão começa com `javascript:(function favorito` e contém `http://127.0.0.1:8765/remocao/assistente.js`.
- [ ] **Step 3: Ponta a ponta pelo túnel:** abrir a página pelo túnel, executar o `href` do botão na aba da APUS (via ferramenta de JS, equivalente ao clique no favorito) → painel abre. Fora da remoção (outra página da APUS) → aviso e redirecionamento.

---

### Task 8: Documentação, versão e publicação

**Files:**
- Modify: `remocao/documentacao_remocao.md` — nova arquitetura (favorito + GitHub Pages + `Nucleo/Apus/Painel`), seção 5 reescrita como "limitações da v2", seção 7 (padrão do repositório) atualizada.
- Create: `remocao/remocao_prd.md` — requisitos do spec §2, §4, §5; `Versão atual: 0.2.0`.
- Create: `remocao/remocao_changelog.md` — `## [Não publicado]` vazio + `## [0.2.0] — 2026-11-12` com Adicionado/Alterado/Removido em relação à v1.
- Modify: `CLAUDE.md` — incluir `remocao/` na árvore de pastas.

- [ ] **Step 1:** escrever os arquivos.
- [ ] **Step 2:** `node --test remocao/tests/` — PASS final.
- [ ] **Step 3:** apresentar ao usuário: o que mudou, versão `0.2.0` e por quê, e **pedir autorização** para (a) commitar em `dev`, (b) ativar o GitHub Pages do repositório (`main`, raiz), que é configuração do repositório. O merge `dev → main` continua sendo ato do usuário.
