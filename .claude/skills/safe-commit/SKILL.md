---
name: safe-commit
description: Roda verificacoes de seguranca (insecure-defaults + security-review) antes de commitar e fazer push. Use ao finalizar alteracoes prontas para commit.
---

# Safe Commit Skill

Run security checks automatically before committing and pushing. Combines insecure-defaults detection and security review into a single command.

## When to Use

Invoke `/safe-commit` whenever you are ready to commit and push changes. It replaces the manual `/insecure-defaults` + `/security-review` + commit workflow.

## Workflow (execute in order, do not skip phases)

---

### Phase 1 — Git Diagnostics

Run these commands in parallel:
- `git status` — identify staged, unstaged, and untracked files
- `git diff --cached` — get the full staged diff to analyze
- `git diff HEAD` — get all local changes (staged + unstaged)
- `git log --oneline -5` — understand this project's commit message style
- `git branch --show-current` — determine the push target branch

Summarize: what is staged, what is not, and what branch will be pushed.

---

### Phase 2 — Insecure-Defaults Analysis

Analyze all **modified files** (staged and unstaged) for fail-open security patterns. Read each changed file. Focus on:

**Critical patterns (block on any of these):**
- Hardcoded credentials, API keys, tokens, or passwords in source code
- Fail-open fallbacks: `process.env.KEY || 'default'`, `env.get('KEY') or 'fallback'`, `config.secret ?? 'hardcoded'`
- Boolean security flags defaulting to insecure: `skipAuth = true`, `verifySSL = false`, `debug = true` shipped to production
- Weak cryptography: MD5/SHA1 for passwords, static IVs, fixed salts
- Sensitive files not covered by `.gitignore`: `.env`, `.mcp.json`, `*.pem`, `*.key`, `*.p12`, `*_rsa`, `credentials.json`, `service-account.json`
- Files that are tracked by git but should not be (run `git ls-files <file>` to check)

**Exclusions — do NOT flag:**
- Test files (`*.test.*`, `*.spec.*`, files in `__tests__/` or `test/`)
- Example/template files (`*.example`, `*.template`, `.env.example`)
- Documentation files (`.md`)
- Build-time configs that are clearly replaced during deployment

For each finding, assign: severity (HIGH/MEDIUM/LOW) and confidence (1–10). Only report confidence ≥ 8.

---

### Phase 3 — Security Review of Changes

Analyze the staged diff for security vulnerabilities introduced by the changes. Check for:

**Injection vulnerabilities:**
- SQL injection via unsanitized user input passed to raw queries
- Command injection in shell calls or subprocesses
- Template injection in dynamic code

**Authentication & Authorization:**
- Authentication bypass logic (conditions that skip auth checks)
- Privilege escalation (a lower-privilege user reaching admin operations)
- Session management flaws
- RLS policies that are too permissive (`USING (true)` on sensitive tables)

**Data Exposure:**
- PII or secrets written to logs (`console.log(password)`, `logger.info(token)`)
- API responses leaking more data than the caller needs
- `dangerouslySetInnerHTML` with user-controlled content (React XSS)

**Secrets Management:**
- Hardcoded API keys or tokens in new code
- JWT/token validation skipped or weakened

For each finding: file, line, severity, confidence. Only report confidence ≥ 8.

**Do NOT report:**
- Theoretical issues without clear exploit paths
- Denial-of-service / rate limiting concerns
- Missing audit logs
- React/Angular components using normal data binding (only flag `dangerouslySetInnerHTML`)
- Client-side JS missing server-side checks (backend is responsible)
- Issues in test or documentation files

---

### Phase 4 — Consolidated Report and Go/No-Go Decision

Present a single report combining findings from Phases 2 and 3:

```
## Security Check Results

### Blocking Issues (HIGH)
<list or "None">

### Warnings (MEDIUM)
<list or "None">

### Informational (LOW)
<list or "None">
```

**Decision logic:**

| Situation | Action |
|---|---|
| Any HIGH findings | STOP. Do not commit. Tell the user exactly what must be fixed and wait. |
| MEDIUM findings only | Show the warnings. Ask the user: "These are warnings, not blockers. Proceed with commit?" Wait for explicit "yes" before continuing. |
| LOW / no findings | Print "No blocking security issues found." and proceed immediately to Phase 5. |

---

### Phase 5 — Commit and Push

Only reach this phase if Phase 4 gave a green light (no HIGH, and MEDIUM acknowledged by user).

**Step 1 — Ensure files are staged:**
- If nothing is staged: ask the user which files to include, or show `git status` and suggest `git add <files>`.
- Never run `git add .` or `git add -A` without listing the files first for the user to confirm. Sensitive files could be accidentally included.

**Step 2 — Generate commit message:**
- Analyze the staged diff to understand the change (new feature, bug fix, refactor, etc.)
- Follow the project's commit message style from `git log`
- Keep it concise (1–2 sentences). Focus on the "why", not the "what".
**Step 3 — Commit:**

Pass the message so that newlines and special characters survive: a single-quoted here-string in PowerShell (`git commit -m @'…'@`), a heredoc in Bash (`git commit -F - <<'EOF'`).

**Step 4 — Push:**
```powershell
git push origin <branch-from-phase-1>
```

**Step 5 — Confirm:**
- Show the output of the push command.
- Report the final status: committed hash, branch pushed, remote URL.

---

## Error Handling

- If `git push` fails (e.g., branch protection, diverged history): report the error verbatim, suggest the correct fix (e.g., `git pull --rebase` then retry), and do NOT force-push without explicit user instruction.
- If a pre-commit hook fails: do NOT use `--no-verify`. Report the hook output and ask the user to fix the underlying issue.
- If the repo has no remote: warn the user and skip the push step.
