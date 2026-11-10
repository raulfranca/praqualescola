# Desenho — Controle da cota do Google (fase 1)

> Data: 2026-11-10. Saída do brainstorming com o dono do app. Próximo passo: `/plano`.
> Fase 2 (telemetria) é outro projeto; as decisões dela já tomadas estão no fim, só como registro.

## 1. Por que

O cálculo de distância e tempo usa uma API paga do Google. No ano passado chegou uma conta de ~R$ 400. O app não tem login (de propósito: não se quer saber as opções de atribuição de ninguém), então não dá para limitar por pessoa. Hoje cada aparelho chama o Google direto do navegador: não há como contar, cachear entre aparelhos nem cortar de forma central.

Números atuais: 67 escolas → **67 unidades cobradas por endereço novo** (3 requisições em lotes de 25). A cota grátis é de **10.000 unidades/mês** (Distance Matrix legada e Routes "Compute Route Matrix" Essentials; renova no dia 1º, meia-noite do horário do Pacífico, e vale para a conta de faturamento inteira — considerar o Pra Qual Escola o único consumidor). Isso dá ~149 endereços novos por mês sem cache. Acima, US$ 5 por mil.

## 2. Objetivos

1. **Nunca sair da cota grátis** do Google para distâncias. Decisão do dono: sem gasto, mesmo que o app fique em modo aproximado no fim de um mês movimentado.
2. **Reaproveitar cálculos** entre aparelhos e entre vizinhos (raio de 200 m).
3. **Ver o consumo** num painel próprio, sem abrir o Google Cloud Console (o dono acha o Console confuso).
4. **Nunca quebrar**: perto ou além do limite, o app continua funcionando com estimativa.
5. **Testes nunca gastam cota**, por regra do projeto aplicada em código.

## 3. Não-objetivos

- Telemetria (fase 2).
- Outros controles no painel além dos listados aqui (o dono vai decidir depois).
- Cache ou corte automático para aberturas de mapa e busca de endereço (Places). Eles só aparecem no painel, pela leitura do Google.
- Ajustar limites pelo painel (por enquanto, configuração no servidor).

## 4. Anti-objetivos (falharia mesmo funcionando)

- Guardar algo que identifique quem consultou: endereço por escrito, IP em claro, id de aparelho, ligação entre casa e favoritos.
- Senha do painel ou chave paga no código que vai para o navegador.
- Um teste ou uma bateria de testes chamar o Google.
- O app mostrar erro ou lista vazia porque a cota acabou.

## 5. Como funciona (decidido com o dono)

### 5.1 Caminho de um cálculo

1. A busca de endereço (Places Autocomplete) continua no navegador, com a chave pública atual.
2. O app chama **uma função na Vercel** (`api/`) mandando só as coordenadas. A função lê as escolas e coordenadas ela mesma no Supabase; nunca aceita destinos vindos do cliente (senão qualquer um usaria a função para calcular rotas arbitrárias com a cota do dono).
3. A função procura no **cache compartilhado** a mesma célula de ~200 m (ver §6). Achou: devolve, custo zero. Escolas que faltem para aquela origem (escola nova no cadastro) são calculadas sozinhas, 1 unidade cada.
4. Não achou: olha o **contador do mês**. Abaixo do limite → chama o Google, grava no cache, soma no contador, devolve.
5. Limite atingido, Google recusou (teto configurado no Console) ou modo aproximado forçado no painel → devolve **estimativa aproximada**.

O cache local por endereço no aparelho (`cachedDistances_*`) continua como primeira camada: voltar ao mesmo endereço nem chega à rede.

### 5.2 Três estados

| Estado | Quando | Comportamento |
|---|---|---|
| **Normal** | consumo abaixo do limiar de economia | cache pela célula de ~200 m; o que falta vai ao Google |
| **Economia** | perto do limite | reaproveita também a célula vizinha mais próxima já calculada (~500 m) |
| **Aproximado** | limite atingido, Google recusou, ou forçado no painel | linha reta × 1,3; tempo estimado por velocidade média urbana; selo "aproximado" na interface |

- Resultado aproximado **não entra no cache compartilhado**. O aparelho guarda com a marca de aproximado e, numa visita em que o servidor esteja Normal/Economia, pede de novo e substitui.
- O cache não expira.

### 5.3 Três camadas de medição e trava

1. **Nosso contador** (exato, instantâneo): soma cada unidade gasta; é o que decide o estado. Zera junto com a cota do Google (mês no fuso `America/Los_Angeles`). Deve **reservar** as unidades antes de chamar o Google (operação atômica no banco), para que picos simultâneos não estourem o limite.
2. **Leitura do Google** (Cloud Monitoring, até ~30 min de atraso): usada uma vez para **calibrar** o contador no lançamento (gasto do mês até ali) e depois como botão "conferir com o Google" no painel, que também mostra aberturas de mapa e buscas de endereço. Credencial de leitura nos segredos da Vercel.
3. **Teto no Google Cloud Console**: limite diário configurado no próprio Google para a API de distâncias da chave do servidor. Trava final se o resto falhar. Configuração manual do dono, com passo a passo entregue pela implementação.

### 5.4 Painel `/admin`

- Atalho: digitar `/admin` na busca. **Substitui o `/dev`** atual (que hoje qualquer pessoa pode usar).
- Pede senha. A senha é conferida **no servidor** contra um segredo da Vercel; o servidor devolve uma credencial temporária (algumas horas). Sem ela, nenhum dado nem comando é aceito. Tentativas erradas seguidas bloqueiam por um tempo.
- Conteúdo da primeira versão: consumo do mês (unidades usadas / cota grátis / limite), quanto o cache economizou, estado atual, botão para **forçar o modo aproximado**, botão **conferir com o Google**.
- Desenhado já com seções, porque a telemetria (fase 2) entra ali.
- Visual: rascunho no canvas (`mock-canvas`) para aprovação antes de construir, como manda o projeto.

### 5.5 Proteção contra abuso

A função fica aberta na internet. Limite por origem (IP guardado só como hash, sem o IP em claro) para cálculos que vão ao Google; respostas de cache podem ser mais folgadas. **O limite por aparelho continua, com 3 endereços novos por dia** (decisão do dono: a cota é pequena e precisa limitar até o uso legítimo). O `/dev` sai; quem tem sessão válida do painel `/admin` não tem limite.

### 5.6 Dados

- Tabelas novas no projeto Supabase **"Dados"**, num **schema próprio do app**, separado de `dados_gerais` (que o Apps Script da SME substitui inteiro; confirmar que ele não toca outros schemas). O dono é dono do projeto e há acesso administrativo (MCP do Supabase); criar schema, função atômica do contador e chave secreta é possível. Decisão do dono: muda a regra "o app só lê do Dados"; a regra nova é "só lê `dados_gerais`; escreve só no schema do app".
- **Nome:** o schema e as tabelas levam o nome do app, `praqualescola` ou o prefixo `pqe_`, para que se identifique de cara a função delas no banco da SME (pedido do dono).
- Escrita só pela função do servidor (chave secreta do Supabase no servidor). O navegador não lê nem escreve essas tabelas.
- Origem guardada **sem endereço por escrito e sem nada que identifique quem consultou**.
- Escolas identificadas pelo código INEP.

### 5.7 Testes

- O e2e intercepta a função de distâncias com `page.route`, como já faz com o Supabase.
- Trava em código: qualquer requisição do e2e para domínios do Google pagos (rotas/distâncias, e também o carregamento do mapa e Places) é **bloqueada e faz o teste falhar**. Os testes já não dependem do mapa (DOC §6); bloquear o mapa zera o consumo de aberturas de mapa nos testes.
- A lógica do servidor (estado a partir do contador, escolha da origem mais próxima, estimativa aproximada) é pura e tem teste de unidade.

## 6. Decisões minhas (o dono pode vetar)

- **Trocar a Distance Matrix (legada) pela Routes API, "Compute Route Matrix"**, chamada do servidor. Mesmo preço e mesma cota; a legada está em vias de ser descontinuada.
- **A casa vira uma célula de uma grade de ~200 m antes de qualquer coisa.** O Google calcula a partir do centro da célula, e só a célula vai ao banco; a casa exata nunca sai do aparelho. Numa cidade pequena, 100 m ainda aponta um quarteirão; 200 m não. O erro (até ~140 m) é desprezível num trajeto de quilômetros. Isso substitui a busca por raio: mesma célula = reaproveita (Normal); no modo Economia, vale também a célula vizinha mais próxima já calculada (≈ os 500 m).
- **O cache guarda as coordenadas da escola usadas no cálculo.** Se a SME corrigir a localização de uma escola, a distância dela é recalculada (1 unidade por célula) na próxima consulta daquela célula.
- **Teto diário no Google Console: ~1/3 da cota mensal** (≈ 3.300 unidades/dia). Protege contra um defeito que dispare chamadas sem parar, sem travar dias de pico legítimos. Se a Routes API só aceitar teto por minuto, usar o teto por minuto equivalente; quem decide o estado continua sendo o nosso contador.
- **Produção e preview da `dev` compartilham contador, cache e chave do servidor**, porque a cota do Google é uma só. O caminho real (função + Google) é exercitado no preview da `dev` antes de publicar; local e e2e nunca chegam ao Google.
- **Calibração:** a cota grátis é por produto (SKU). Ler no Google o uso do mês do produto que a função usa (Routes); se lançar no meio do mês, o uso antigo da Distance Matrix pelo navegador conta na cota *dela*, não na da Routes. Confirmar essa regra na documentação de faturamento ao implementar.
- **Limiares:** Economia a partir de 80% da cota (8.000 unidades); Aproximado quando faltar menos que o custo de um endereço novo mais uma margem, com teto em 95% (9.500). A margem cobre erro de calibração.
- Velocidade média para o tempo aproximado: 30 km/h sobre a distância × 1,3.
- **Duas chaves do Google**: a pública atual (mapa + Places, restrita por referenciador; remover dela a permissão de distâncias) e uma nova só de servidor (só Routes API, nunca com prefixo `VITE_`).

## 7. Restrições e pontos de atenção

- Localmente o `vite` não roda as funções de `api/` (como já acontece com `/api/maintenance`). Sem a função, o app deve cair no modo aproximado, nunca quebrar.
- `playwright.config.ts` recusa o e2e se existir uma pasta `supabase/` sem banco local. Se as migrations forem versionadas no repositório, escolher outro caminho ou ajustar a trava conscientemente.
- A calibração converte o que o Google registra em unidades cobradas. Se o Monitoring só der contagem de requisições, estimar (lotes de até 25) e **arredondar para cima**.
- O PRD muda em: §2 (o que fica só no aparelho: as coordenadas arredondadas passam a ir ao servidor), §2/§3.3 (`/dev` sai, `/admin` entra; limite diário sai), §3.3 (servidor, cache compartilhado, modo aproximado com tempo estimado).
- Atualizar `ref/DOC.md` (dados, infraestrutura, variáveis, regra do Supabase), `CHANGELOG.md` e `.github/maintenance.yml` se algo tiver prazo.

## 8. Fica para quem constrói

Nomes de tabelas, colunas e do schema; onde versionar as migrations (fora de uma pasta `supabase/`, ou ajustando a trava do Playwright); formato da requisição e da resposta da função; runtime da função (edge ou node); tamanho exato da célula da grade; valores exatos do limite por IP; duração da credencial do painel; textos e lugar exato do selo "aproximado"; layout do painel (via canvas).

## 9. Registro para a fase 2 (telemetria) — não construir agora

- Só **contagens agregadas**; nenhuma lista individual guardada.
- Casa reduzida ao **bairro** para cruzar com favoritas ("entre quem mora no Santana, alta demanda pelo CMEI Tabaú"). O bairro sai de um mapa de bairros guardado no app, nunca do Google (custo).
- Candidatos com mais valor: ranking de favoritas (e ponderado pela posição), distância/tempo reais até as favoritas, região de casa × região das favoritas, filtros de distância/tempo usados. Parte já existe no GA4 (busca, escola vista, favoritar, reordenar, rota, filtros de nível/gestão).
- Aviso curto de privacidade no app (LGPD).
- Entra como seção do painel `/admin`.
