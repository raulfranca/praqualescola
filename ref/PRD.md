# PRD — Pra Qual Escola

> Fonte da verdade funcional: o que o sistema deve fazer. O como está em `ref/DOC.md`.
>
> Escrito em 2026-11-09 a partir do código existente (o app foi construído no Lovable sem PRD). Onde a regra é **dedução** do código, e não decisão registrada, está marcado *(dedução)*.

## 1. Contexto e visão geral

PWA (aplicativo web instalável no celular) para professores da rede municipal de Pindamonhangaba (SP) verem as escolas no mapa, compararem distância e tempo de deslocamento a partir de casa e organizarem suas prioridades nos processos de **remoção**, **formação de sede** e **atribuição**.

Desenvolvido pelo professor Raul Cabral. Público: professores da rede; não há área administrativa.

## 2. Perfis de acesso

Um único perfil público: **visitante anônimo**. Não há login para o público. Tudo o que é pessoal (casa, favoritos, distâncias) fica guardado só no aparelho da pessoa (`localStorage`).

Há uma **área do administrador** escondida: digitar `/admin` na busca e apertar Enter pede uma senha (validada no servidor; tentativas limitadas). Com a sessão aberta (8 h, só naquela aba), o administrador vê o painel da cota do Google: estado atual (Normal, Economia ou Aproximado), unidades usadas no mês contra a cota grátis, reaproveitamentos de cálculo; pode forçar o modo aproximado e conferir o contador com os números do Google, ajustando-o para cima. A sessão também dispensa o limite diário de endereços do aparelho (seção 3.3).

O endereço de casa sai do aparelho só para o servidor do app, que calcula as distâncias. O Google recebe apenas o centro de um quadrado de cerca de 200 m, nunca a coordenada exata; o servidor guarda as distâncias por quadrado (para reaproveitar entre pessoas) e o IP só como resumo criptográfico, para limitar abusos.

## 3. Funcionalidades

**Navegação:** três seções — **Mapa**, **Lista** e **Favoritos** —, na barra inferior no celular e na barra lateral no computador. O app não tem canal de sugestões próprio (a seção "Contribua", com formulário do Tally, foi removida em 2026-11-10).

### 3.1 Lista de escolas (fonte de dados)

- As escolas e turmas vêm do **cadastro oficial da Secretaria de Educação** (banco Supabase "Dados", mantido pela SME), lido a cada abertura do app. Quando a SME atualiza o cadastro, o app muda sem publicar código. O app só lê o cadastro, nunca escreve nele (o que o app grava, o cache de distâncias e o contador da cota, fica numa área separada do mesmo banco).
- Cada escola é identificada pelo **código INEP**. Tem: tipo (EM/CMEI), nome, endereço, CEP, telefone, bairro, coordenadas (conferidas pela SME), setor, polo, se é terceirizada, observação e o número de turmas por nível (berçário, infantil 1 e 2, pré 1 e 2, 1º ao 5º ano), contadas no ano letivo mais recente do cadastro. Ramal não é mostrado.
- As turmas contam para a **escola responsável**. Turma multisseriada conta em cada nível que atende.
- Escola **inativa** (hoje, o CAIC, de prédio desativado) continua aparecendo, com o selo "Prédio desativado". No detalhe, ela mostra onde as turmas dela funcionam, com link que abre o detalhe da escola-sede.
- Falha ao carregar mostra aviso de erro; cadastro vazio mostra "Nenhuma escola encontrada".
- **Recomeço de 2026:** na troca da planilha Google para o cadastro oficial, o app apagou uma única vez, em cada aparelho, os dados ligados às escolas (favoritos, endereço de casa, distâncias e a data da última troca de endereço). Não há aviso sobre isso: o tour de primeira visita (seção 3.11) apresenta o app a todos.

### 3.2 Mapa (`/`)

- Mostra as escolas como marcadores no Google Maps; tocar num marcador abre o detalhe da escola.
- Busca por nome, endereço ou bairro, sem diferenciar acentos.

### 3.3 Minha Casa e distâncias

- A pessoa informa o endereço de casa (autocomplete do Google Places).
- **Limite: três endereços novos por dia por aparelho** (vira à meia-noite, hora local), para conter o custo da API do Google. Voltar a um endereço já calculado no aparelho não conta. A sessão do administrador ignora o limite.
- Depois de definir a casa, o app pede ao **servidor** a **distância e o tempo de carro** até todas as escolas. O servidor usa a Routes API do Google e guarda o resultado num cache compartilhado: outra pessoa num endereço próximo (mesmo quadrado de ~200 m) recebe o mesmo cálculo sem nova consulta ao Google.
- **Regra da cota: o app fica sempre dentro da cota gratuita do Google** (10.000 unidades por mês; cada cálculo novo gasta uma unidade por escola). O servidor conta as unidades e muda de estado sozinho:
  - **Normal** (até 8.000): cálculo novo vai ao Google.
  - **Economia** (de 8.000 a 9.500): reaproveita o cálculo de um quadrado vizinho que cubra todas as escolas; só vai ao Google se não houver.
  - **Aproximado** (a partir de 9.500, ou forçado pelo administrador): o Google não é chamado; vale o cache, e o resto é estimado.
  - Além disso, cada IP tem um teto diário de idas ao Google, e há teto diário configurado no próprio Google.
- **Estimativa aproximada:** linha reta × 1,3 para a distância e essa distância a 30 km/h para o tempo. É usada no estado Aproximado e quando o servidor não responde. Distâncias estimadas mostram o selo "aproximado" (lista, detalhe, prioridades) e o app tenta trocá-las pelas reais uma vez por sessão.
- Resultados ficam também em cache no aparelho por endereço: voltar a um endereço já calculado não chama o servidor. Abrir o detalhe de uma escola ou as prioridades usa a distância salva, sem chamar nada.
- Escola que entra no cadastro depois do cálculo ganha distância automaticamente para quem já tem casa definida: o app calcula só as que faltam, sem refazer as outras.
- Remover a casa apaga as distâncias mostradas.

### 3.4 Filtros

- Nível: creche, pré-escola, fundamental.
- Gestão: prefeitura ou terceirizada.
- Distância máxima ou tempo máximo (escolhe-se a métrica), com histograma da distribuição (barras dentro do limite destacadas) e quantas escolas ficam dentro do limite. Só aparece depois de calcular distâncias.
- "Só escolas com vagas", num cartão com o nome do processo e quantas escolas têm vaga, quando há campanha no ar (seção 3.7).
- Os filtros valem para mapa e lista e duram a sessão do navegador; uma sessão nova volta ao padrão (tudo marcado, sem limite de distância). Um aviso discreto indica quando há filtro ativo.

### 3.5 Lista (`/lista`)

- Todas as escolas em cartões, com etiquetas de nível (ex.: "Inf. 1 e 2", "Pré 1", "1º ao 3º ano"; anos contínuos viram faixa).
- Ordenação: alfabética, por vagas, por distância ou por tempo (as duas últimas só com casa definida).

### 3.6 Favoritos e prioridades (`/favoritos`)

- Qualquer escola pode ser favoritada no detalhe.
- Os favoritos formam uma lista de **prioridades** que se reordena arrastando. A ordem é a que o professor levaria para o processo.

### 3.7 Campanhas

- Campanhas (ex.: "Remoção 2027 · 1ª fase") ficam no banco, com nome, descrição, início, fim, interruptor "ligada" e as vagas de cada escola (código INEP). Só número **positivo** é vaga; zero ou negativo é "sem vaga".
- **"Campanha" é termo interno:** nunca aparece em texto que o professor vê (nem em leitor de tela). Na tela fica o nome do processo e palavras como "vagas" e "aberta até". No painel `/admin` pode aparecer.
- Uma campanha está **no ar** quando está dentro das datas **e** ligada **e** não arquivada. Se duas estão no ar ao mesmo tempo, vale a que começou primeiro (o painel avisa). Fora de campanha, o app funciona sem vagas.
- **Carga:** o agente monta a campanha e as vagas a partir do documento da Secretaria (`db/campanhas/README.md`); ela nasce desligada. **Painel `/admin`, aba Campanhas:** edita nome, descrição, início e fim (horário de Brasília) e o interruptor; arquiva só campanha encerrada ("Arquivadas" recolhida, com desarquivar); mostra as vagas só para leitura. Pôr no ar não depende de publicar o app.
- **Com campanha no ar:** marcadores do mapa mostram o número de vagas; filtro "Só escolas com vagas" (3.4); ordenação por vagas (3.5); vagas no detalhe (3.8); em Favoritos, quantas prioridades têm vaga nesta fase. "Sem vagas" aparece em cinza, não em vermelho.
- **Ordem na abertura:** tour de primeira visita → aviso de abertura da campanha (com ou sem app instalado; dispensado, não volta para aquela campanha) → convite para instalar (só sem app instalado).

### 3.8 Detalhe da escola

- Dados completos, etiquetas de nível, vagas (em campanha), distância e tempo (se calculados), botão de favoritar.
- **"Como Chegar?"**: no celular abre o seletor de apps de navegação (Maps, Waze, Uber...) pelas coordenadas; no computador abre o Google Maps.

### 3.9 PWA, atualização e manutenção

- Instalável (Android, Windows; no iOS, um banner ensina a adicionar à tela inicial). O convite para instalar só aparece depois que o tour de primeira visita e o aviso de campanha foram fechados.
- Quando sai versão nova, quem abre o app instalado vê um aviso com título e subtítulo próprios daquela versão (`public/version.json`) e botão para atualizar. No navegador o aviso não aparece: a versão nova entra quando todas as abas do app são fechadas e ele é aberto de novo.
- **Modo manutenção**: ligado no painel da Vercel (Edge Config), sem publicar código. Com ele ligado, o app mostra só a página de manutenção com título e mensagem configurados. Se a consulta falhar, o app abre normalmente.

### 3.10 Medição de uso

- Google Analytics 4 (IP anonimizado) registra busca, visualização de escola, favoritar, reordenar, pedir rota e aplicar filtros. Vercel Analytics mede visitas.

### 3.11 Tour de primeira visita

- Na primeira vez que o aparelho abre a tela do mapa, um tour de sete etapas apresenta o app, todo sobre o mapa. Abre com a coruja e uma frase sobre o que é o app ("um mapa com todas as escolas municipais de Pindamonhangaba e informações atualizadas sobre vagas para remoção e atribuição"); depois ilumina um ponto por vez: cores dos marcadores (creche, pré-escola, fundamental), busca, Minha Casa, Filtros, Lista e Favoritos (favoritar pela estrela e arrastar para montar as prioridades).
- O tour só aponta e explica: não abre telas nem preenche nada. Tem "Próximo", "Voltar" e "Pular".
- Aparece **uma vez por aparelho**. Concluir, pular ou fechar (tecla Esc) grava que foi visto, e ele não volta.
- Enquanto o tour não foi fechado, nenhum outro aviso aparece (instalar, campanha, nova versão). Ordem dos avisos depois dele: seção 3.7.

### 3.12 Assistente de Remoção (`/remocao/`)

- Página à parte, fora do app, com o passo a passo para instalar um favorito no Chrome (computador e Chromebook). Clicado na página de remoção da APUS, o favorito abre um painel que mostra se o pedido do professor está valendo e em quais escolas a classificação dele basta. Só lê a APUS; não escolhe nem envia nada.
- Requisitos próprios em `remocao/remocao_prd.md`. Integração com o app (mapa, favoritos) fica para depois.

## 4. Roadmap — ideias em análise

- **Atualização silenciosa:** trocar o aviso de nova versão por uma atualização automática em segundo plano, sem recarregar a tela enquanto a pessoa digita. Resolveria também o navegador, onde hoje o aviso não aparece.
