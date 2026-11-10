# PRD — Pra Qual Escola

> Fonte da verdade funcional: o que o sistema deve fazer. O como está em `ref/DOC.md`.
>
> Escrito em 2026-11-09 a partir do código existente (o app foi construído no Lovable sem PRD). Onde a regra é **dedução** do código, e não decisão registrada, está marcado *(dedução)*.

## 1. Contexto e visão geral

PWA (aplicativo web instalável no celular) para professores da rede municipal de Pindamonhangaba (SP) verem as escolas no mapa, compararem distância e tempo de deslocamento a partir de casa e organizarem suas prioridades nos processos de **remoção**, **formação de sede** e **atribuição**.

Desenvolvido pelo professor Raul Cabral. Público: professores da rede; não há área administrativa.

## 2. Perfis de acesso

Um único perfil: **visitante anônimo**. Não há login. Tudo o que é pessoal (casa, favoritos, distâncias) fica guardado só no aparelho da pessoa (`localStorage`).

Há um **modo desenvolvedor** escondido: digitar `/dev` na busca e apertar Enter desliga o limite diário de troca de endereço (seção 3.3).

## 3. Funcionalidades

**Navegação:** três seções — **Mapa**, **Lista** e **Favoritos** —, na barra inferior no celular e na barra lateral no computador. O app não tem canal de sugestões próprio (a seção "Contribua", com formulário do Tally, foi removida em 2026-11-10).

### 3.1 Lista de escolas (fonte de dados)

- As escolas e turmas vêm do **cadastro oficial da Secretaria de Educação** (banco Supabase "Dados", mantido pela SME), lido a cada abertura do app. Quando a SME atualiza o cadastro, o app muda sem publicar código. O app só lê esse banco, nunca escreve nele.
- Cada escola é identificada pelo **código INEP**. Tem: tipo (EM/CMEI), nome, endereço, CEP, telefone, bairro, coordenadas (conferidas pela SME), setor, polo, se é terceirizada, observação e o número de turmas por nível (berçário, infantil 1 e 2, pré 1 e 2, 1º ao 5º ano), contadas no ano letivo mais recente do cadastro. Ramal não é mostrado.
- As turmas contam para a **escola responsável**. Turma multisseriada conta em cada nível que atende.
- Escola **inativa** (hoje, o CAIC, de prédio desativado) continua aparecendo, com o selo "Prédio desativado". No detalhe, ela mostra onde as turmas dela funcionam, com link que abre o detalhe da escola-sede.
- Falha ao carregar mostra aviso de erro; cadastro vazio mostra "Nenhuma escola encontrada".
- **Recomeço de 2026:** na troca da planilha Google para o cadastro oficial, o app apagou uma única vez, em cada aparelho, os dados ligados às escolas (favoritos, endereço de casa, distâncias e a data da última troca de endereço). Quem tinha algum desses dados vê uma vez um aviso explicando que precisa defini-los de novo.

### 3.2 Mapa (`/`)

- Mostra as escolas como marcadores no Google Maps; tocar num marcador abre o detalhe da escola.
- Busca por nome, endereço ou bairro, sem diferenciar acentos.

### 3.3 Minha Casa e distâncias

- A pessoa informa o endereço de casa (autocomplete do Google Places).
- **Limite: um endereço novo por dia** (vira à meia-noite, hora local), para conter o custo da API do Google. O modo desenvolvedor ignora o limite.
- Depois de definir a casa, um botão calcula **distância e tempo de carro** até todas as escolas (Google Distance Matrix, em lotes de 25).
- Se a API falhar, a distância vira a linha reta multiplicada por 1,3 e o tempo fica sem valor *(dedução: fator de tortuosidade escolhido no código)*.
- Resultados ficam em cache no aparelho por endereço: voltar a um endereço já calculado não gasta API.
- Escola que entra no cadastro depois do cálculo ganha distância automaticamente para quem já tem casa definida: o app calcula só as que faltam, sem refazer as outras.
- Remover a casa apaga as distâncias mostradas.

### 3.4 Filtros

- Nível: creche, pré-escola, fundamental.
- Gestão: prefeitura ou terceirizada.
- Distância máxima ou tempo máximo (escolhe-se a métrica), com histograma da distribuição. Só aparece depois de calcular distâncias.
- "Só com vagas", quando há campanha ativa (seção 3.7).
- Os filtros valem para mapa e lista e duram a sessão do navegador; uma sessão nova volta ao padrão (tudo marcado, sem limite de distância). Um aviso discreto indica quando há filtro ativo.

### 3.5 Lista (`/lista`)

- Todas as escolas em cartões, com etiquetas de nível (ex.: "Inf. 1 e 2", "Pré 1", "1º ao 3º ano"; anos contínuos viram faixa).
- Ordenação: alfabética, por vagas, por distância ou por tempo (as duas últimas só com casa definida).

### 3.6 Favoritos e prioridades (`/favoritos`)

- Qualquer escola pode ser favoritada no detalhe.
- Os favoritos formam uma lista de **prioridades** que se reordena arrastando. A ordem é a que o professor levaria para o processo.

### 3.7 Campanhas

- Campanhas (ex.: "Remoção 2025 – 2ª Fase", "Vagas para Sede 2026") têm início, fim e mensagem de banner.
- Durante a campanha, aparece o banner. Fora de campanha, o app funciona sem vagas.
- **Vagas estão sem fonte:** saíram com a planilha Google e ainda não existem no cadastro oficial. Uma tabela de vagas no Supabase será feita num plano à parte, antes da próxima campanha.
- Se duas campanhas se sobrepõem, vale a primeira da lista.

### 3.8 Detalhe da escola

- Dados completos, etiquetas de nível, observação (quando houver), vagas (em campanha), distância e tempo (se calculados), botão de favoritar.
- **"Como Chegar?"**: no celular abre o seletor de apps de navegação (Maps, Waze, Uber...) pelas coordenadas; no computador abre o Google Maps.

### 3.9 PWA, atualização e manutenção

- Instalável (Android, Windows; no iOS, um banner ensina a adicionar à tela inicial).
- Quando sai versão nova, aparece um aviso com título e subtítulo próprios daquela versão (`public/version.json`) e botão para atualizar.
- **Modo manutenção**: ligado no painel da Vercel (Edge Config), sem publicar código. Com ele ligado, o app mostra só a página de manutenção com título e mensagem configurados. Se a consulta falhar, o app abre normalmente.

### 3.10 Medição de uso

- Google Analytics 4 (IP anonimizado) registra busca, visualização de escola, favoritar, reordenar, pedir rota e aplicar filtros. Vercel Analytics mede visitas.

## 4. Roadmap — ideias em análise

Nada registrado ainda.
