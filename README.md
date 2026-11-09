# Pra Qual Escola

PWA para professores da rede municipal de Pindamonhangaba verem as escolas no mapa, compararem distância e tempo de deslocamento a partir de casa e organizarem suas prioridades em remoção, formação de sede e atribuição.

Desenvolvido pelo professor Raul Cabral.

## Rodar localmente

```sh
npm ci
cp .env.example .env   # preencha as chaves
npm run dev            # http://localhost:8080
```

## Verificar

```sh
node .claude/scripts/portao.mjs           # lint + tipos + testes
node .claude/scripts/portao.mjs --final   # + build + testes de navegador
```

## Documentação

- `ref/PRD.md`: o que o app faz
- `ref/DOC.md`: como ele é construído
- `AGENTS.md`: regras para agentes de IA
- `CHANGELOG.md`: histórico de versões

Publicação: todo push na `main` é publicado pela Vercel.
