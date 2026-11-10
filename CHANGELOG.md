# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Corrigido

- Escolas novas deixam de sumir da lista e do mapa para quem já tinha o endereço de casa salvo: o app calcula a distância só das que faltam e guarda junto com as outras.
- Com o endereço de casa salvo, o filtro de distância não fica mais preso em 10 km (ou 30 minutos) ao abrir o app, o que escondia as escolas mais longe.

## [2.1.0] - 2026-11-10 - Novo design system

### Alterado

- Nova identidade visual a partir do logotipo da coruja: cores em azul-coruja, letras novas (Inter), cartões e barras mais limpos, com sombras suaves no lugar de bordas, e botões e áreas de toque maiores no celular. As letras vêm junto com o app, então continuam iguais mesmo sem internet.
- Marcadores do mapa redesenhados: cada nível de ensino tem sua cor, as escolas favoritas aparecem como estrela com contorno dourado e a sua casa como um alfinete com a coruja.
- Atualizada a ferramenta que prepara o modo offline do app, que usava componentes antigos e sem manutenção.
- Atualizadas as bibliotecas de navegação entre telas, de montagem e de testes, eliminando todas as falhas de segurança graves e críticas conhecidas.
- O app publicado não registra mais as mensagens internas de depuração no console do navegador.

### Removido

- Peças de interface e bibliotecas que vieram no modelo inicial do projeto e nunca foram usadas (formulários, calendário, gráficos, carrossel e outras), deixando o projeto mais leve de manter.
- A seção "Contribua" e o formulário de sugestões saíram do menu e do app.

## [2.0.0] - 2026-11-09 - Não mais desenvolvido no Lovable, agora em loop agêntico (local e nuvem)

Nova fase do projeto: o aplicativo deixa o Lovable, a plataforma em que foi criado, e passa a ser desenvolvido num ciclo próprio, com verificação automática antes de cada publicação. Para quem usa o app, nada muda na tela.

### Adicionado

- Testes automáticos: a cada envio de código, o GitHub confere se o app continua montando e funcionando. Uma versão com defeito é barrada antes de chegar ao site.
- Documentação do que o app faz e de como ele é construído, para que qualquer pessoa (ou agente de IA) possa dar manutenção.

### Alterado

- O desenvolvimento saiu do Lovable e passou a ser feito localmente e na nuvem com o Claude Code, num ciclo de planejamento, testes e publicação. Mudanças feitas pelo Lovable não são mais aceitas no repositório.
- A chave do Google Maps saiu do código-fonte e passou a ser configurada no painel da Vercel. O repositório é público, e chave no código pode ser copiada por robôs que vasculham o GitHub.

### Removido

- Restos do Lovable, a ferramenta em que o app foi criado: arquivos de documentação gerados automaticamente, código e arquivos que não eram mais usados, e a imagem de prévia com a marca do Lovable ao compartilhar o link.
- Configuração do Supabase, um banco de dados que nunca chegou a ser usado, e a rotina automática que o mantinha ligado.

## [1.4.1] - 2025-12-15

### Adicionado

- Modo Manutenção pode ser ativado/desativado por meio de Edge Config no Vercel, sem necessidade de novo deploy. 

### Modificado

- Botão "Ver no Google Maps" modificado para "Como Chegar?". No Mobile, chama uma função GEO e permite ao usuário escolher com qual aplicativo quer continuar (Maps, Waze, Uber, etc.). O destino é definido por coordenadas, não por endereço.

### Removido

- Arquivos de ícones antigos removidos e referências atualizadas.

### Corrigido

- PWA instalável em Windows.
- Banner convidando para instalar aparece corretamente a cada nova versão.
- Toast de nova versão não usa a mensagem em cache, mas puxa o arquivo novo do servidor para mostrar mensagem atualizada.
- Refatoração do código e remoção de partes obsoletas.

## [1.4.0] - 2025-12-10

### Adicionado

- Aba "Lista", com visualização em lista de todas as escolas e funções de filtro e ordenamento.
- Nova identidade visual: ícone da coruja em cima do mapa.
- Mensagens personalizadas para nova versão (editar arquivo version.json).
- Modo desenvolvedor (desativa os limites de definição de endereço). Digitar "/dev" na caixa de busca.

### Modificado

- Limites para uso da API Google Maps: só é possível definir endereço 1x ao dia. Após definir endereço, é preciso clicar em um botão para calcular a distância e tempo. Cache agressivo. Autocomplete da busca de endereços segue a lógica Session Tokens.
- Diminui a largura do slider do filtro de distância para não acionar acidentalmente o gesto de voltar.
- Zoom do mapa muda automaticamente para enquadrar as escolas ativas no filtro.
- Filtros persistentes entre a aba Mapa e Lista.

### Corrigido

- Remove funções nativas do navegador que atrapalham a experiência nativa do PWA: autocomplete com sugestões de senha e cartão de crédito, sugestões de busca do Google quando seleciona texto

## [1.3.0] - 2025-11-30

### Adicionado

- Instala o Google Analytics 4 para rastrear eventos e comportamento do usuário no uso do aplicativo

## [1.2.1] - 2025-11-27

### Corrigido

- Impede o navegador de traduzir o site e bagunçar os rótulos.

## [1.2.0] - 2025-11-25

### Adicionado

- Filtro de tempo: tempo de deslocamento, alternável com filtro de distância
- Abertura da campanha: Remoção 2025 - 3a fase

### Modificado

- Histograma do filtro de distância: tamanho das barras se atualiza para refletir os outros filtros ativos
- Cálculo de distância pelo traçado da rua, não em linha reta (Haversine)
- Inclui um fallback que calcula em Haversine, caso API do Maps esteja indisponível

## [1.1.0] - 2025-11-24

### Adicionado

- Calcula as distâncias imediatamente assim que o usuário define endereço da Minha Casa e salva localmente, criando uma lista interna, ordenada da mais próxima para a mais distante.
- **Função Filtro (novo botão)**
  - Filtro por Nível (Creche, Pré, Fundamental)
  - Filtro Administração (Prefeitura, Terceirizada)
  - Filtro por Distância controlado por um slider com histograma (estilo AirBnb)
- **Modo Campanha**
  - Incluir dados da 2ª remoção na base de dados
  - Banner do modo campanha
  - Opção de filtro: escolas com vagas
  - Modal de cada escola mostra badge com o número de vagas

### Modificado

- Refatoração da UI na página Favoritos para visual mais leve e organizado

### Removido

- Unidades não escolares (NAP, Casa Verde, etc.) saíram do mapa

## [1.0.0] - 2025-11-19

### 🎉 Lançamento Inicial

Primeira versão pública do aplicativo **Pra Qual Escola?**. Uma ferramenta de utilidade pública focada em auxiliar professores de Pindamonhangaba durante o processo de atribuição de aulas e escolha de sede.

**Principais Funcionalidades e Design:**

- **Navegação Híbrida & Responsiva:** Interface otimizada para celular com Barra de Navegação Inferior, adaptando-se automaticamente para uma Barra Lateral em telas maiores (Desktop/Tablet).
- **Mapa Imersivo:** Visualização limpa e sem distrações, com controles flutuantes e busca inteligente integrada.
- **Busca & Localização:** Pesquisa rápida de escolas (indiferente a acentos) e definição de endereço residencial ("Minha Casa") para cálculos automáticos.
- **Sistema de Favoritos:** Permite favoritar escolas (transformando pinos em estrelas destacadas), reordenar a lista de prioridades e visualizar distância e tempo de deslocamento para cada unidade.
- **Marcadores Inteligentes:**
  - **Hierarquia Visual:** Escolas favoritas ganham destaque (estrelas maiores com brilho) sobre as demais.
  - **Código de Cores:** Preenchimento dos pinos indica os níveis de ensino atendidos (Creche, Pré, Fundamental).
- **Interface de Detalhes:** Modal de informações responsivo que atua como "gaveta" deslizante no celular e janela flutuante no computador.
- **Arquitetura Leve:** Funciona como PWA (Aplicativo Web Progressivo), com dados atualizados em tempo real via planilha e preferências salvas localmente no dispositivo do usuário (sem necessidade de login).