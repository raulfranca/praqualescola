---
status: em_andamento
revezamento: aguardando_usuario
criado: 2026-11-11
demanda: Agrupar escolas a até 500 m umas das outras e mandar ao Google só uma por grupo, tratando todos os efeitos colaterais
---

# Plano — Agrupamento de escolas (500 m) para poupar a cota do Google

> **Demanda original:** a cota do Google se esgota rápido porque cada endereço novo gera 67 cálculos (um por escola). Agrupar escolas próximas, sem alterar mais que 2–3 min de deslocamento, e calcular a distância da casa só até um ponto de cada grupo. O usuário escolheu grupos de **500 m** e pediu que todos os efeitos colaterais sejam tratados.
>
> **Contexto investigado:**
> - **Evidência (2026-11-11):** 16 endereços reais no cache × 67 escolas (1.072 rotas do Google). Com agrupamento *complete-linkage* (toda escola do grupo a ≤ 500 m de **todas** as outras do grupo) e representante = **medoide** (escola de menor soma de distâncias às demais do grupo), saem **44 grupos**. Usando o tempo do representante para todos do grupo: erro médio 0,6 min, máximo 1,7 min, 0% acima de 2 min. Com 800 m o erro chegava a 3,1 min (7–18% acima de 2 min), por isso 800 m foi descartado. Economia: 67 → 44 unidades por endereço novo (−34%); capacidade de ~141 → ~215 endereços novos/mês.
> - **Fluxo atual:** `api/distancias.ts` → `calcularDistancias` em `api/_lib/distancias.ts`: lê escolas (`lerEscolas`), estado da cota (`estadoDaCota` com `custoEndereco: lista.length`), cache por célula de ~200 m (`pqe_buscar`), `faltantes` = escolas sem cache, reserva `faltantes.length` unidades (`pqe_reservar`), chama `calcularRotas` (`api/_lib/google.ts`, 1 origem × N destinos, cobrança por elemento) e grava as linhas (`pqe_gravar`), validadas depois por `escola_lat/escola_lng` da própria escola (`cacheValidoPorCelula`). O modo Economia só usa célula vizinha se ela tiver **todas** as escolas (`size === lista.length`).
> - **Lógica pura compartilhada** em `src/lib/cota.ts` (sem DOM, sem imports `@/`, importável pelo servidor): `distanciaRetaKm`, `estadoDaCota`, grade de células.
> - **Painel `/admin`:** `api/admin/painel.ts` usa `custoEndereco: escolas.length` e devolve `escolas` (a tela usa em "Unidades poupadas" = `acertos_cache × escolas`, `src/components/PainelAdmin.tsx`). `api/admin/google.ts` calibra com `unidadesEstimadasRoutes(requisicoes, escolas.length)` (`api/_lib/monitoring.ts`); `pqe_calibrar` **nunca diminui** o contador, então uma estimativa inflada por 67 empurraria o contador para cima e anteciparia o modo Economia.
> - **PRD 3.3** (`ref/PRD.md`, linhas ~43–44) diz "cada cálculo novo gasta uma unidade por escola"; vira "uma unidade por grupo de escolas próximas". O usuário pediu a mudança, então não há contradição a sinalizar além de atualizar o texto.
> - **Não muda:** o app no aparelho (`useSchoolDistances`, `localStorage`), privacidade (o Google segue recebendo só o centro da célula), limite por IP, schema do banco (nenhuma migration).
> - **Decisões de desenho:** grupos calculados a cada pedido a partir da lista de escolas (67 escolas: trivial), determinísticos (ordenação por INEP, desempate por INEP); cache continua por escola: o valor do representante é gravado na linha de cada membro, com as coordenadas **do membro**. O cache antigo (valores individuais) segue válido e é até mais preciso. Opção descartada por ora: calcular individualmente as escolas a < 2 km de casa (usuário não pediu; registrar como possível ajuste futuro).

## ▶ Ponto de retomada

- **Atualizado:** 2026-11-11 — plano criado, aguardando aprovação
- **Etapa 1 — Função pura de agrupamento** (`opus`) — não iniciada
- **Próxima ação:** abrir a Etapa 1: gravar as sub-tarefas aqui e escrever `gruposDeEscolas` em `src/lib/cota.ts` com os testes em `src/lib/cota.test.ts`
- **Tocados e não verificados:** nenhum
- **Em execução:** nenhum subagente
- **Esperando o usuário:** aprovação do plano

## Progresso

- [ ] 1. Função pura de agrupamento — `opus`
- [ ] 2. Servidor de distâncias calcula por grupo — `opus` *(depende de 1)*
- [ ] 3. Painel `/admin` e conferência com o Google contam por grupo — `opus` *(depende de 1)*
- [ ] 4. Documentação e encerramento — `opus` *(depende de 2 e 3)*

## Etapas

### Etapa 1 — Função pura de agrupamento

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** — · **Portão:** —

**Objetivo:** existe `gruposDeEscolas(escolas, raioMetros = 500)` em `src/lib/cota.ts`, testada com as 67 escolas reais.

**Especificação:**

- **Contexto:** o servidor vai mandar ao Google só uma escola por grupo de escolas próximas. Esta etapa cria só a lógica pura, sem ligar em nada.
- **Ler:** `src/lib/cota.ts`, `src/lib/cota.test.ts` (se existir; senão, ver padrão de outro `*.test.ts` em `src/lib/`).
- **Alterar:** `src/lib/cota.ts`, `src/lib/cota.test.ts`.
- **Fazer:**
  1. Exportar `DIAMETRO_GRUPO_M = 500`.
  2. Exportar `interface Grupo<T> { representante: T; membros: T[] }` (membros inclui o representante).
  3. Exportar `gruposDeEscolas<T extends Ponto & { inep: string }>(escolas: T[], diametroM = DIAMETRO_GRUPO_M): Grupo<T>[]`:
     - agrupamento hierárquico *complete-linkage*: começa com cada escola num grupo; repetidamente junta o par de grupos cuja **maior** distância entre membros (`distanciaRetaKm` × 1000) é a menor, enquanto ela for ≤ `diametroM`;
     - determinístico: escolas ordenadas por `inep` antes de começar; empates de distância resolvidos pela ordem;
     - representante = medoide (menor soma de distâncias aos outros membros; empate → menor `inep`);
     - escolas com o mesmo ponto caem no mesmo grupo.
  4. Testes: (a) as 67 escolas reais (coordenadas abaixo) → 44 grupos; (b) em todo grupo, todo par de membros a ≤ 500 m; (c) toda escola aparece em exatamente um grupo; (d) resultado igual com a lista embaralhada; (e) duas escolas a 1 km → dois grupos; três em linha a 0, 300 m e 600 m → o par mais próximo junta e a terceira fica só; (f) representante é membro do próprio grupo.
- **Coordenadas reais** (`inep,lat,lng`, do `dados_gerais.escolas` em 2026-11-11), usar como fixture do teste:
  `35004045,-22.937140,-45.471700; 35004636,-22.914440,-45.447250; 35005620,-22.939670,-45.506660; 35005825,-22.938770,-45.508810; 35008094,-22.930521,-45.457642; 35008097,-22.884147,-45.370349; 35009928,-22.914480,-45.446630; 35010465,-22.949062,-45.402362; 35010633,-22.947624,-45.500731; 35010839,-22.954000,-45.500480; 35011066,-22.939543,-45.505119; 35011695,-22.926550,-45.449890; 35062431,-22.956070,-45.491520; 35064038,-22.887296,-45.545495; 35064191,-22.930330,-45.478160; 35064221,-22.955020,-45.458540; 35069036,-22.919820,-45.449938; 35073106,-22.932150,-45.449630; 35073118,-22.937898,-45.478290; 35073124,-22.889672,-45.386748; 35073131,-22.914780,-45.362980; 35073143,-22.944600,-45.413490; 35073155,-22.909816,-45.372186; 35073167,-22.938040,-45.473430; 35073179,-22.931720,-45.433670; 35073180,-22.891870,-45.374580; 35073192,-22.945810,-45.501420; 35073209,-22.944527,-45.457299; 35073222,-22.942240,-45.467660; 35073234,-22.940340,-45.396980; 35110206,-22.925080,-45.439320; 35191619,-22.979390,-45.408390; 35191620,-22.915227,-45.366241; 35191632,-22.890870,-45.375010; 35191644,-22.943640,-45.501560; 35206866,-22.944050,-45.421530; 35206878,-22.962090,-45.413300; 35206885,-22.940102,-45.376272; 35206891,-22.939800,-45.449860; 35225198,-22.944927,-45.506239; 35225204,-22.891030,-45.369850; 35234990,-22.950117,-45.497500; 35235003,-22.929270,-45.433460; 35235015,-22.908530,-45.371540; 35249695,-22.917950,-45.451660; 35274159,-22.938210,-45.478300; 35274161,-22.900830,-45.376340; 35274185,-22.890940,-45.381602; 35278725,-22.924220,-45.471020; 35283307,-22.962430,-45.410950; 35410330,-22.948055,-45.495771; 35410676,-22.886420,-45.369360; 35410688,-22.924565,-45.439378; 35438259,-22.798310,-45.450700; 35471598,-22.904100,-45.374870; 35471604,-22.922270,-45.365960; 35471616,-22.949689,-45.501836; 35471628,-22.935340,-45.462920; 35567012,-22.887000,-45.485150; 35567024,-22.915640,-45.428220; 35585865,-22.903830,-45.374060; 35585877,-22.916530,-45.362760; 35585889,-22.920570,-45.366430; 35652052,-22.943910,-45.467490; 35652064,-22.935620,-45.459070; 35652076,-22.960800,-45.487460; 35652088,-22.941242,-45.395685`
- **Não fazer:** ligar a função no servidor ou no painel (etapas 2 e 3).
- **Convenções:** `cota.ts` não pode importar com `@/` nem usar DOM (é importado por `api/`).

**Critérios de aceite:**

- [ ] **Comportamento:** `gruposDeEscolas(67 reais).length === 44`; todo par dentro de um grupo ≤ 500 m; partição completa; ordem de entrada não altera o resultado.
- [ ] **Portão:** `node .claude/scripts/portao.mjs`
- [ ] **Escopo:** o diff toca só `src/lib/cota.ts`, `src/lib/cota.test.ts` e este plano.

---

### Etapa 2 — Servidor de distâncias calcula por grupo

**Executor:** `opus` · **Depende de:** 1 · **Paralelo com:** 3 (arquivos disjuntos; executar em sequência por simplicidade) · **Portão:** —

**Objetivo:** `/api/distancias` manda ao Google só os representantes dos grupos que faltam, reserva e conta só eles, e grava o resultado para todas as escolas do grupo.

**Especificação:**

- **Contexto:** núcleo em `api/_lib/distancias.ts` (`calcularDistancias`). Cache por célula e por escola continua igual; muda só quem vai ao Google e quanto se reserva.
- **Ler:** `api/_lib/distancias.ts`, `api/_lib/distancias.test.ts`, `api/_lib/google.ts`, `src/lib/cota.ts`.
- **Alterar:** `api/_lib/distancias.ts`, `api/_lib/distancias.test.ts`.
- **Fazer:**
  1. Depois de `lerEscolas`, `const grupos = gruposDeEscolas(lista)` e um mapa `inep → grupo`.
  2. `estadoDaCota({ custoEndereco: grupos.length, ... })` (custo de um endereço novo passa a ser o número de grupos).
  3. Depois de montar `distancias` a partir do cache escolhido, completar membros faltantes cujo grupo tem **outro membro com valor real já em `distancias`** (do cache): preferir o representante; senão qualquer membro com valor. Essas escolas copiadas também entram em `gravar` para a célula (sem custo de Google), para o cache da célula ficar completo. *(Decisão: copia do cache só na própria célula escolhida, nunca mistura células.)*
  4. `faltantes` → grupos que ainda têm membro sem distância; `destinos` = representante de cada um desses grupos. Reservar `destinos.length` unidades; `calcularRotas` com os destinos; se a rota do representante voltar `null`, os membros ficam para a estimativa (não gravar).
  5. Para cada grupo calculado, atribuir `real(metros, segundos)` a **todos os membros sem distância** e gravar uma linha por membro com `escola_lat/escola_lng` **do próprio membro** (a validação do cache por coordenada continua por escola).
  6. Comentário curto no topo do bloco explicando o agrupamento e citando `DIAMETRO_GRUPO_M`.
  7. Testes novos (fixture com escolas próximas, ex.: `C` a ~100 m de `A`): (a) cache vazio, A e C no mesmo grupo e B sozinho → Google recebe 2 destinos, `pqe_reservar` com `p_unidades: 2`, `pqe_gravar` com 3 linhas, A e C com o mesmo valor e cada linha com a coordenada da própria escola; (b) cache com A mas sem C (escola nova no grupo) → nenhuma chamada ao Google, C recebe o valor de A e é gravada; (c) rota `null` para um representante → membros daquele grupo saem `aproximado: true` e não são gravados; (d) `estadoDaCota` recebe o custo por grupos: com `unidades` tal que `unidades + nºGrupos ≤ 9.500 < unidades + nºEscolas`, o estado **não** é aproximado. Ajustar os testes existentes só no que o agrupamento muda de fato (A e B ficam a ~1,4 km: grupos separados, devem continuar passando).
- **Não fazer:** mexer no painel `/admin`, no `monitoring.ts`, no app do aparelho, no schema ou nas funções `pqe_*`.
- **Convenções:** mudanças cirúrgicas; mensagens e nomes em português como no arquivo.

**Critérios de aceite:**

- [ ] **Comportamento:** testes (a)–(d) passam; com as 67 reais e cache vazio, a reserva é de 44 unidades (asserção ad hoc ou teste).
- [ ] **Comportamento:** nenhum teste existente de `distancias.test.ts` foi removido; os que mudaram têm o motivo no Diário.
- [ ] **Portão:** `node .claude/scripts/portao.mjs`; `node .claude/scripts/portao.mjs --e2e distancias` (o app não muda, mas confirma que o fluxo segue verde).
- [ ] **Escopo:** só `api/_lib/distancias.ts`, `api/_lib/distancias.test.ts` e este plano.

---

### Etapa 3 — Painel `/admin` e conferência com o Google contam por grupo

**Executor:** `opus` · **Depende de:** 1 · **Paralelo com:** 2 (ver acima) · **Portão:** —

**Objetivo:** o painel mostra o estado e as "Unidades poupadas" pelo custo real por endereço (nº de grupos), e a calibração com o Google estima `requisições × grupos`, sem inflar o contador.

**Especificação:**

- **Contexto:** `pqe_calibrar` nunca diminui o contador. Estimar com 67 em vez de 44 empurraria o contador para cima e anteciparia o modo Economia.
- **Ler:** `api/admin/painel.ts`, `api/admin/google.ts`, `api/_lib/monitoring.ts` (`unidadesEstimadasRoutes`) e seu teste, `src/components/PainelAdmin.tsx` (tipo `Painel` e `AbaCota`), `src/lib/admin*` se o tipo `Painel` estiver lá, `e2e/admin.spec.ts`.
- **Alterar:** os arquivos acima, conforme necessário.
- **Fazer:**
  1. `painel.ts`: `const grupos = gruposDeEscolas(escolas).length`; `custoEndereco: grupos`; devolver também `grupos` (manter `escolas`).
  2. `google.ts`: `unidadesEstimadasRoutes(uso.requisicoes.routes, gruposDeEscolas(escolas).length)`. Atualizar o comentário de `unidadesEstimadasRoutes` em `monitoring.ts`: o teto por requisição é o número de grupos (1 origem × representantes). O parâmetro pode ser renomeado para `destinos`. **Registrar no Diário:** requisições feitas antes da publicação custaram 67 cada; no mês da troca a estimativa fica abaixo do real, o que é seguro (a calibração só sobe), mas o contador próprio continua sendo a fonte principal.
  3. Tipo `Painel` ganha `grupos: number`; `AbaCota` usa `resumo.acertos_cache * grupos` em "Unidades poupadas".
  4. `e2e/admin.spec.ts`: o mock do painel ganha `grupos: 44` e a asserção "Unidades poupadas" passa para `5.632` (128 × 44), com o comentário atualizado.
  5. Testes unitários que cobrem `unidadesEstimadasRoutes` e o painel: ajustar ao novo multiplicador.
- **Não fazer:** mudar o visual do painel (só o número); mexer em `distancias.ts`.
- **Convenções:** muda tela (valor exibido) → e2e `@admin` obrigatório; a skill `frontend-design` não é necessária, pois não há mudança de layout.

**Cenários de interface** — tag `@admin`:

1. Administrador abre `/admin` pela busca, entra com a senha (APIs simuladas) → aba Cota mostra "Unidades poupadas 5.632" (128 reaproveitamentos × 44 grupos).

**Critérios de aceite:**

- [ ] **Comportamento:** `unidadesEstimadasRoutes(10, 44) === 440`; o painel devolve `grupos` e o estado usa `custoEndereco` = grupos.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e admin`
- [ ] **Escopo:** só os arquivos listados e este plano.

---

### Etapa 4 — Documentação e encerramento

**Executor:** `opus` · **Depende de:** 2, 3 · **Portão:** —

**Objetivo:** PRD, DOC e CHANGELOG descrevem o agrupamento; portão final verde; plano concluído.

**Especificação:**

- **Alterar:** `ref/PRD.md` (seção 3.3: "cada cálculo novo gasta uma unidade por **grupo de escolas próximas** (escolas a até 500 m umas das outras contam como um ponto só; hoje 44 grupos para 67 escolas). A diferença de tempo dentro de um grupo fica abaixo de 2 minutos."), `ref/DOC.md` (linha da "Cota do Google": agrupamento em `src/lib/cota.ts`, representante enviado ao Google, valor gravado por membro; linha do Monitoring: estimativa = requisições × grupos), `CHANGELOG.md` (`[Unreleased]` → `Alterado`: cada endereço novo consome cerca de um terço a menos da cota grátis do Google, porque escolas vizinhas, a até 500 m, passam a ser calculadas juntas; diferença de tempo abaixo de 2 minutos).
- **Não fazer:** editar versões numeradas do CHANGELOG.
- `.github/maintenance.yml`: não se aplica (nada com prazo).

**Critérios de aceite:**

- [ ] **Portão:** `node .claude/scripts/portao.mjs --final`
- [ ] **Escopo:** só documentação e este plano.

## Encerramento do plano

- [ ] Portão de fim de plano: `node .claude/scripts/portao.mjs --final`
- [ ] `CHANGELOG.md` — entrada única da feature em `[Unreleased]`, para leitor não técnico
- [ ] `ref/DOC.md` / `ref/PRD.md` — atualizados na Etapa 4
- [ ] `.github/maintenance.yml` — não se aplica
- [ ] Migrations pendentes de produção — nenhuma (o plano não muda o banco)
- [ ] Frontmatter → `status: concluido`; `git mv` deste arquivo para `ref/planos/concluidos/`

## Diário de execução

<!-- HISTÓRICO: uma entrada por etapa, no máximo 10 linhas. Nunca apague entradas anteriores. -->
