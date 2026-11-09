# Documentação Técnica — Pra Qual Escola

> Estado atual do sistema, para qualquer agente entender o projeto sem ler todo o código. O que o sistema deve fazer está em `ref/PRD.md`.

## 1. Visão geral

SPA (aplicação de página única) em React, empacotada como PWA, sem back-end próprio além de uma função de borda na Vercel. Os dados vêm de uma planilha Google; o estado pessoal fica no `localStorage` do navegador.

## 2. Stack e dependências

- **Vite 5 + React 18 + TypeScript** (`strict: false`), roteamento com `react-router-dom`.
- **UI:** Tailwind 3 + shadcn/ui (`src/components/ui/`, gerados pelo CLI do shadcn; não editar à mão sem motivo).
- **Mapa:** `@react-google-maps/api` (Maps JavaScript, Places, Distance Matrix).
- **PWA:** `vite-plugin-pwa` (Workbox), `registerType: "prompt"`.
- **Medição:** `react-ga4` e `@vercel/analytics`.
- **Gerenciador de pacotes:** **npm** (`package-lock.json`). O projeto não usa Bun.

## 3. Estrutura de diretórios

```
api/maintenance.ts     Função de borda da Vercel: lê o Edge Config (modo manutenção)
public/version.json    Título e subtítulo do aviso de nova versão
src/main.tsx           Consulta /api/maintenance antes de montar o app; inicia o GA
src/App.tsx            Providers, LoadScript do Google Maps, rotas
src/pages/             Index (mapa), Lista, Favoritos, Feedback, NotFound
src/components/        Componentes do app; ui/ = shadcn
src/contexts/          FilterContext (filtros compartilhados, em sessionStorage)
src/hooks/             Dados (useSchoolsData), casa, distâncias, favoritos, campanha, PWA
src/lib/               Lógica pura: csvParser, distanceCalculator, distanceMatrix, schoolTags, utils
src/config/            campaign_config.ts (campanhas)
e2e/                   Testes de navegador (Playwright)
```

## 4. Dados

- **Escolas:** CSV exportado da planilha Google (URL em `src/hooks/useSchoolsData.ts`), interpretado por `src/lib/csvParser.ts`. A ordem das colunas é fixa (A=ID … X=5º ano); a coluna de vagas é achada pelo **nome do cabeçalho** definido na campanha ativa (`VAGAS_REMO`, `VAGAS_SEDE`...). Tipo em `src/types/school.ts`.
- **No aparelho (`localStorage`):** `school-favorites` (ids em ordem de prioridade), `home-location`, `school-distances` (distâncias atuais), `cachedDistances_<lat>_<lng>` (cache por endereço, 5 casas decimais), data da última troca de endereço, `app-version-seen`.
- **Na sessão (`sessionStorage`):** `escola-filters-session`.
- Sem banco de dados. (Havia um projeto Supabase herdado do Lovable, nunca usado pelo código; removido em 2026-11-09.)

## 5. Infraestrutura e ambientes

- **Hospedagem:** Vercel. Todo push na `main` é publicado automaticamente. A `dev` é integração; publicar é mesclar `dev` na `main` (`git-deploy` na máquina, `publicar.yml` na nuvem).
- **Variáveis de ambiente** (modelo em `.env.example`; o `.env` não vai para o git):
  - `VITE_GOOGLE_MAPS_API_KEY`: chave do Google Maps. É pública por natureza (vai no JavaScript do navegador); a proteção é a **restrição por referenciador** no Google Cloud Console.
  - `VITE_GA_TRACKING_ID`: ID do Google Analytics 4.
  - Em produção, as duas ficam em *Vercel > Settings > Environment Variables*.
- **Modo manutenção:** Edge Config da Vercel com `isUnderMaintenance`, `title`, `message`. Localmente (`vite`) a rota `/api/maintenance` não existe e o app abre normalmente.
- **Cache do PWA:** `version.json` em NetworkFirst (1 min); Google Maps em CacheFirst (1 ano); planilha em NetworkFirst (1 h).

## 6. Testes

Como rodar: `node .claude/scripts/portao.mjs`. Comandos em `.claude/loop.json`.

- **Unidade (Vitest):** `src/**/*.test.ts`, ambiente `node`. Cobrem a lógica pura de `src/lib/`.
- **Navegador (Playwright):** `e2e/`, servidor próprio na porta 8090. Nessa porta o Google Maps mostra erro de carregamento, porque a chave só aceita os domínios autorizados; os testes não dependem do mapa.

## 7. Convenções e padrões

- Alias `@/` → `src/`.
- Textos de interface em português; muitos comentários e logs de console herdados estão em inglês.
- Nova campanha: acrescentar em `src/config/campaign_config.ts` e criar a coluna de vagas na planilha.
- Nova versão publicada: atualizar `public/version.json` (`version`, `title`, `subtitle`) junto com o `CHANGELOG.md`.

## 8. Estado de implementação

Todas as funcionalidades do PRD estão no ar (versão 1.4.1). Pontos conhecidos:

- Logs de depuração (`console.log` com emojis) espalhados por hooks e `csvParser`.
- `strict: false` no TypeScript: o typecheck pega pouco.
- O lint tem 9 avisos antigos (sem erros).
