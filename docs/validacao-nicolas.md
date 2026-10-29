# Evidências locais — 28/10/2026

- Responsável das issues: Nicolas Leão / Nicolas1xx; implementação com assistência Codex.
- Base frontend: `292cd3e32e24d63add56a5c03d965b5bbfec8a3c` (`main`).
- Contexto consultado de governance: `7baa42afcdbee8e93f55aca138d475060849aa49`.
- Ambiente: macOS, Node 24.21.0, Next 16.4.3.

| Verificação | Resultado |
| --- | --- |
| ESLint, zero warnings | PASS |
| TypeScript | PASS |
| Teste original de bootstrap | 1 PASS |
| Vitest — lógica de sessão, catálogo, adaptador, protótipos | 39 PASS |
| Linhas / statements / funções / branches de lógica em `src/features/**/*.ts` | 100% / 97,97% / 96,66% / 97,22% |
| Build de produção SSR + runtime standalone | PASS |
| Playwright Chromium | 6 PASS |
| Layout mobile 390 × 844 e ausência de overflow | PASS |
| npm audit | 0 vulnerabilidades |
| Spec compliance | FAIL: tag não publicada, contratos e aceite pendentes |

E2E executa a aplicação compilada e cobre: catálogo SSR sem rascunho no HTML,
filtros e paginação, formulário sem JavaScript, sessão com cookie HttpOnly,
expiração/refresh/falha/logout, rejeição de origem externa, isolamento entre
usuários, protótipo CPA por teclado sem POST/localStorage e layout mobile.

Os relatórios reproduzíveis ficam em `coverage/` e `playwright-report/`; captura
mobile em `test-results/catalog-mobile.png`; diagnóstico normativo em
`target/spec-compliance.json`. Esses diretórios são gerados e ignorados no Git.
O workflow `Frontend verification` repete os checks técnicos no GitHub. Seu
resultado remoto deve ser conferido no PR; não foi presumido a partir do local.

As verificações não testam um backend real: não há endpoint compatível pronto
nem serviço local respondendo. O mock de sessão não comprova rotação/revogação
real no BE-006. A allowlist do catálogo não torna o CRUD antigo uma API pública.

A leitura do código React segue as skills react-best-practices e verification:
catálogo continua Server Component; interação fica em componentes client
isolados, sem efeitos para ações de formulário; labels, fieldsets, foco,
mensagens de estado e navegação sem JS foram considerados. Isso não substitui
auditoria completa de acessibilidade ou homologação funcional.
