# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## \[1.4.1\] \- 2025-12-15

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

## \[1.4.0\] \- 2025-12-10

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

## \[1.3.0\] \- 2025-11-30

### Adicionado

- Instala o Google Analytics 4 para rastrear eventos e comportamento do usuário no uso do aplicativo

## \[1.2.1\] \- 2025-11-27

### Corrigido

- Impede o navegador de traduzir o site e bagunçar os rótulos.

## \[1.2.0\] \- 2025-11-25

### Adicionado

- Filtro de tempo: tempo de deslocamento, alternável com filtro de distância
- Abertura da campanha: Remoção 2025 \- 3a fase

### Modificado

- Histograma do filtro de distância: tamanho das barras se atualiza para refletir os outros filtros ativos
- Cálculo de distância pelo traçado da rua, não em linha reta (Haversine)
- Inclui um fallback que calcula em Haversine, caso API do Maps esteja indisponível

## \[1.1.0\] \- 2025-11-24

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

## \[1.0.0\] \- 2025-11-19

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