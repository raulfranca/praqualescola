# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Alterado

- O tour de primeira visita abre com uma apresentação do app: a coruja e uma frase sobre o que ele é, antes de mostrar as funções.

## [2.4.0] - 2026-11-11 - Tour de primeira visita

### Adicionado

- Tour de primeira visita: ao abrir o mapa pela primeira vez, o app apresenta em seis passos curtos as cores dos ícones (creche, pré-escola e fundamental), a busca, a Minha Casa, os filtros, a lista e os favoritos. Aparece uma única vez em cada aparelho; quem pular ou fechar não vê de novo.

### Alterado

- O convite para instalar o aplicativo só aparece depois que o tour é fechado.
- O banner de campanha e o aviso de nova versão agora aparecem só para quem já instalou o aplicativo.

### Removido

- O aviso "O app foi atualizado", que explicava o recomeço dos favoritos e do endereço. O tour passa a apresentar o app.
- A dica de arrastar na tela de Favoritos. A explicação agora está no tour.

## [2.3.0] - 2026-11-10 - Controle da cota gratuita do Google Maps

### Adicionado

- Área do administrador (digite `/admin` na busca, com senha): mostra quanto da cota gratuita do Google já foi usada no mês, em três estados (Normal, Economia, Aproximado), permite forçar o modo aproximado e conferir o contador com os números do próprio Google.
- Quando uma distância é estimada (sem consulta ao Google), ela aparece com o selo "aproximado" na lista, no detalhe da escola e nas prioridades.

### Alterado

- As distâncias e os tempos agora são calculados pelo servidor do app, e não mais direto no aparelho. Endereços iguais ou muito próximos reaproveitam o cálculo já feito por outra pessoa, sem nova consulta ao Google.
- Perto do limite da cota gratuita, o app passa sozinho a reaproveitar cálculos de endereços vizinhos e, no limite, usa uma estimativa pela distância em linha reta, para nunca gerar cobrança. A coordenada exata da casa nunca sai do aparelho para o Google: o servidor usa o centro de um quadrado de cerca de 200 m.
- Cada aparelho pode cadastrar até 3 endereços novos por dia (antes era 1).
- Abrir o detalhe de uma escola ou a lista de prioridades não consulta mais o Google: usa a distância já calculada.

### Removido

- O atalho de desenvolvedor `/dev`, que liberava a troca de endereço sem senha. Foi substituído pela área do administrador.

## [2.2.0] - 2026-11-10 - Dados oficiais do Supabase da Secretaria de Educação

### Adicionado

- O CAIC, cujo prédio está desativado, aparece com o selo "Prédio desativado". No detalhe da escola, uma seção mostra onde as turmas dele funcionam, com link que abre a escola-sede.
- O detalhe da escola mostra a observação cadastrada pela Secretaria, quando houver.

### Alterado

- As escolas agora vêm do cadastro oficial da Secretaria de Educação, e não mais de uma planilha: a localização de cada escola foi conferida e as turmas são as de 2027. Quando a Secretaria atualiza o cadastro, o app muda sozinho.
- Recomeço do zero para todos: como as escolas ganharam uma identificação nova (o código do INEP), o endereço de casa e os favoritos guardados no aparelho são apagados uma única vez e precisam ser definidos de novo. Na primeira abertura, um aviso explica isso, e o endereço pode ser cadastrado no mesmo dia.
- O telefone da escola aparece sem o ramal.
- As vagas das campanhas ficam temporariamente sem fonte: não há campanha aberta agora, e elas voltarão quando o cadastro oficial tiver uma tabela de vagas.

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