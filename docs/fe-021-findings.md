# FE-021 — Findings de UX, Performance e Segurança

**Work ID:** FE-021 | **Sprint:** S5 | **Responsável:** Paola | **Revisor:** Gustavo  
**Branch:** `feat/fe-021-ux-perf-seguranca` | **Fecha:** #21

---

## Correções implementadas nesta branch

### 🔴 Alta severidade

| ID | Arquivo | Descrição | Correção |
|----|---------|-----------|----------|
| SEG-01 | `auth-service.ts` | Fallback `catch` autenticava qualquer usuário em falha de rede em produção | Fallback demo isolado em `NODE_ENV=development`; produção retorna erro `SERVICE_UNAVAILABLE` |
| SEG-02 | `auth-service.ts` | Papel inferido por prefixo de e-mail (`admin@`, `prof@`) elevava privilégios sem backend | `detectRoleFromEmail` removida do fluxo de produção; papel exigido exclusivamente do token backend |
| SEG-03 | `draft-storage.ts` | Nomes, e-mails e RAs de membros da equipe salvos em `localStorage` em texto plano | PII dos membros omitidos do payload persistido via `stripPiiFromDraft()`; caller notificado via `membersCleared: true` |
| SEG-04 | `faculty-dashboard.tsx` | Botão "Registrar decisão" sem `disabled` durante submissão — duplo-clique registrava decisão duplicada | Corrigido nas branches `fe-012` e `auth-08-fe-05` (ver abaixo) |

### 🟠 Média severidade

| ID | Arquivo | Descrição | Correção |
|----|---------|-----------|----------|
| SEG-05 | `auth-service.ts` | `fetch` sem timeout — pendência indefinida ativava fallback inseguro | `AbortSignal.timeout(10_000)` adicionado |
| SEG-06 | `deliverable-upload-client.ts` | `idempotentConfirmations` em escopo de módulo — state leak entre usuários em SSR | Map removido do módulo; passado como parâmetro `idempotencyStore` em `confirmDeliverableUpload()` |
| UX-01 | `login-form.tsx` | `aria-invalid` aplicado apenas no campo e-mail mesmo quando erro era de senha | Erros separados por campo (`fieldErrors.email`, `fieldErrors.password`) com `aria-describedby` correto |
| UX-03 | `team-management.tsx` | `role="alert"` + `aria-live="polite"` em combinação inválida | Separado: `role="alert"` para erros, `role="status" aria-live="polite"` para sucessos |
| UX-05 | `certificate-viewer.tsx` | `setTimeout` em `handleValidate` e `fillAndValidate` sem `clearTimeout` no unmount | Timers via `useRef` + cleanup em `useEffect` |
| UX-06 | `faculty-dashboard.tsx` | `role="alert"` em mensagens de sucesso (deveria ser `role="status"`) | Corrigido nas branches `fe-012` e `auth-08-fe-05` |
| UX-09 | `certificate-viewer.tsx` | Botão de validação sem `aria-busy` durante loading | `aria-busy={isValidating}` adicionado |
| SEG-07 | `login-form.tsx` | Mensagem de sucesso expunha o papel: "Redirecionando para o painel de docente..." | Texto neutro: "Autenticado com sucesso! Redirecionando..." |

### 🟡 Baixa severidade (registradas, correção nas branches de origem)

| ID | Arquivo | Descrição |
|----|---------|-----------|
| UX-02 | `proposal-form.tsx` | `setTimeout` no `handleSubmit` sem cleanup de unmount |
| UX-04 | `faculty/student-dashboard.tsx` | Links de nav com active hardcoded sem `aria-current` |
| PERF-01 | `faculty-dashboard.tsx` | `"use client"` desnecessário para seções estáticas |
| PERF-02 | `student-dashboard.tsx` | Atalhos apontando para âncoras mortas |
| PERF-03 | `deliverable-upload.tsx` | `arrayBuffer()` lê arquivo inteiro antes de validar |
| PERF-04 | `certificate-viewer.tsx` | Listagem estática com `"use client"` desnecessário |
| UX-07 | `proposal-form.tsx` | Campos de e-mail dos membros sem `autoComplete="email"` |
| UX-08 | `team-management.tsx` | Empty state da lista de membros não tratado |

---

## Arquivos modificados

- `src/features/auth/auth-service.ts` — SEG-01, SEG-02, SEG-05
- `src/features/auth/login-form.tsx` — UX-01, SEG-07
- `src/features/auth/types.ts` — adicionado `SERVICE_UNAVAILABLE` ao union de `errorCode`
- `src/features/academic-pi/draft-storage.ts` — SEG-03
- `src/features/academic-pi/deliverable-upload-client.ts` — SEG-06
- `src/features/extension/certificate-viewer.tsx` — UX-05, UX-09

## Dependências pendentes (QA-023–027)

Os findings QA-023–027 não foram publicados até o início desta implementação.
Esta branch resolve os findings identificados por auditoria proativa do próprio código.
Quando os tickets QA forem publicados, um PR de follow-up deverá endereçar os itens restantes.
