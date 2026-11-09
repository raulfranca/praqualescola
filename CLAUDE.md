@AGENTS.md

---

## Claude Code — notas específicas

Este arquivo importa todas as regras de projeto de `AGENTS.md` acima. As seções abaixo cobrem apenas comportamentos e ferramentas específicos do Claude Code.

### Graphify — grafo de conhecimento do código

Há um grafo determinístico (só-AST) em `graphify-out/graph.json` mapeando símbolos, imports, chamadas e dependências entre módulos. **Para perguntas de arquitetura, relações entre módulos, fluxo, dependências e impacto de mudanças, consulte o grafo antes de grep/find ou leitura ampla.** Comandos em `graphify --help`; um hook `PreToolUse` reinjeta o lembrete. Após mudar código, `graphify update .` reextrai o grafo.

> Não use `graphify extract`, `label` nem `cluster-only`: exigem chave de API de um modelo, que o projeto não tem.
