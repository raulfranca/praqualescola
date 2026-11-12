# PRD — Assistente de Remoção

**Versão atual:** 0.2.0
**Design aprovado:** `ref/specs/2026-11-12-assistente-remocao-design.md`
**Documentação técnica:** `remocao/documentacao_remocao.md`

## 1. Problema

Na remoção da rede municipal, o professor escolhe uma escola por fase (cada fase fica aberta 25 horas)
na página da APUS. Para saber se tem chance numa escola, ele precisa cruzar vagas, quem pediu aquela
escola e a classificação de cada um com a dele, abrindo e fechando a lista de interessados escola por
escola. Muita gente bem classificada entra na última hora e tira a vaga de quem já tinha escolhido;
reavaliar rápido faz diferença. A plataforma também confunde: selecionar uma escola não grava o
pedido, e "Reiniciar" não o cancela.

## 2. Público e plataforma

* Professores da rede, em geral pouco técnicos.
* **Alvo:** Chrome no computador e Chromebook (inclusive Chromebook gerenciado da Secretaria, com conta de professor).
* **Fora do alvo:** celular (o painel não pode quebrar, mas não é otimizado).

## 3. Requisitos funcionais

| # | Requisito |
|---|---|
| RF1 | Mostrar o **estado do pedido** da fase: sem pedido; escola selecionada mas não gravada ("Clique em Finalizar para valer"); gravado, com posição e se está dentro das vagas; selecionou outra escola mas o gravado é outro ("Clique em Finalizar para trocar"); leitura inconsistente. |
| RF2 | Listar **"Escolas com vaga"**: todas as escolas com vaga para remoção (vagas > 0), com posição ("2º lugar em 3 vagas") e chance Maior / Menor (posição = vagas) / Zero (posição > vagas). Maior folga primeiro. |
| RF3 | Mostrar **o que mudou** desde a leitura anterior do mesmo professor, período e fase: linha "Perdeu a chance desde HHhMM". |
| RF4 | Ler tudo do servidor a cada atualização: vagas, interessados e classificação. Nada de uma fase vale na outra. |
| RF5 | Atualizar só quando o professor abre o painel ou clica em atualizar. Nunca automaticamente. |
| RF6 | Escola que não pôde ser lida **nunca** aparece como oportunidade; o painel avisa "Não consegui ler N escolas". |
| RF7 | Avisos claros para: sem fase aberta, classificação não encontrada, lista de escolas ilegível, sessão expirada. |
| RF8 | Favorito: fora da APUS abre o login (`https://educ.apus.info/professor/pinda`) numa nova aba, sem tirar o professor da página em que está; na APUS fora da remoção leva à remoção (`https://educ.apus.info/profWeb/atribRemocao/`); na remoção abre o painel. Antes de redirecionar, avisa que é preciso clicar de novo. |
| RF9 | Página de passo a passo com animação do gesto de arrastar, o botão-favorito, instruções para criar o favorito à mão, aviso para celular e prints do uso do painel durante a remoção (ver, escolher e finalizar, conferir, acompanhar, trocar). |
| RF10 | **Só leitura.** Nunca escolher escola, finalizar, reiniciar ou enviar nada. |

## 4. Regras de negócio

* Classificação menor = melhor; empate não conta como "na frente".
* Posição = concorrentes na frente + 1; entra se posição ≤ vagas.
* Vagas ≤ 0 (a APUS mostra negativos) = sem vaga.
* O professor aparece na lista de interessados de no máximo uma escola por fase; é isso que define o pedido gravado (nome **e** classificação).

## 5. Restrições não funcionais

* Chamadas `info.ajax.php` só para escolas com inscritos > 0, uma por vez, 150 ms entre elas, timeout de 15 s.
* Sem dados de terceiros no `localStorage`.
* Visual e voz do design system `remocao/design-system/`.
* Publicação junto com o app Pra Qual Escola (Vercel, `main`), em `/remocao/`, fora do app React; correções valem no próximo clique, sem reinstalar.

## 6. Fora do escopo

* Prever vagas em cascata.
* Notificações ou atualização automática.
* Distribuição pela Chrome Web Store ou TamperMonkey.
