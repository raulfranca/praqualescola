---
name: mock-canvas
description: Abre um mock de tela num canvas (artifact do tipo Design), usando os tokens de design-system/ do repositório. Use quando houver decisão visual a tomar antes de construir, comparar variações, criar tela nova sem padrão no app, ou quando o usuário pedir mock, protótipo ou canvas.
---

# mock-canvas — mock de tela em canvas

O canvas é onde a decisão visual acontece. Quando a tela estiver construída, a referência passa a ser a própria tela: mock implementado não fica no repositório.

As ferramentas `mcp__claude-artifacts__*` são carregadas pelo `ToolSearch`. Se elas não existirem nesta sessão, diga isso e faça o mock como HTML avulso fora do repositório.

## Antes de desenhar

Invoque `frontend-design` com `args` apontando para `design-system/README.md` e leia `design-system/tokens.css`. Os valores vêm sempre de lá.

## Passo a passo

1. `list_types` para achar o tipo **Design**; `describe_type` dele, e a leitura de `artifact-type/reference/format.md`.
2. `create_from_type` com o título da tela.
3. `upload_asset` das imagens de `design-system/assets/`; a resposta devolve o endereço `/_blob/<id>`.
4. Monte os arquivos no scratchpad, em `canvas/project/`. Peças repetidas entre artboards: fragmentos montados por script, em UTF-8 sem BOM.
5. `publish_files` com `mode: patch`: primeiro `project/canvas.json` e `project/Main.dc.html`, depois um arquivo por chamada, usando o `version` devolvido como `base_version` da chamada seguinte.
6. Entregue o link ao usuário. Não abra nem capture o canvas para conferir sem ele pedir: as instruções do tipo vedam.
