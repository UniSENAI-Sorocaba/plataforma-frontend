# Runbook SSR e Guia de Troubleshooting — Plataforma Digital UniSENAI

**Work ID:** `FE-022`  
**Prioridade/Sprint:** P1 / S6  
**Responsável:** Kaique Silva  
**Revisor:** Paola  
**Repositório:** `plataforma-frontend` (Next.js 16 / TypeScript / App Router)  
**Governança:** Normativa fixada em `.governance-baseline` e alinhada a `AGENTS.md`.

---

## 1. Visão Geral e Arquitetura SSR

A aplicação utiliza o **Next.js 16** com o **App Router** (`src/app`), projetado para máxima performance, segurança e acessibilidade institucional.

### 1.1 Modelo de Renderização Híbrido
- **React Server Components (RSC):** Padrão em todos os arquivos de rota (`page.tsx`, `layout.tsx`). Executam exclusivamente no servidor Node.js, não enviam JavaScript para o bundle do cliente e garantem SEO e renderização inicial instantânea.
- **Client Components (`'use client'`):** Utilizados estritamente nos limites de interação de usuário (ex.: formulários interativos, captura de eventos de clique, estado local reativo com hooks).
- **Fronteiras Arquiteturais:**
  - `src/app`: Rotas e composição SSR.
  - `src/components`: Componentes compartilhados acessíveis (botões, inputs, modais).
  - `src/features`: Lógica de domínio isolada (`auth`, `academic-pi`, `extension`, `portal`, `runbook`).

---

## 2. Requisitos de Ambiente

Para manter compatibilidade estrita com a baseline e pipelines de CI:

| Recurso | Versão Homologada | Arquivo de Configuração |
|---|---|---|
| **Node.js** | `>= 22.0.0` (recomendado: Node 22 LTS) | `.nvmrc`, `package.json` (`engines`) |
| **npm** | `>= 10.0.0` | `package-lock.json` |
| **Next.js** | `16.3.5` (Turbopack) | `package.json` |
| **TypeScript** | `5.9.3` | `tsconfig.json` |

### Instalação Limpa
```bash
# Sincronizar com a versão exata do nvmrc
nvm use

# Instalação reprodutível e determinística
npm ci
```

---

## 3. Comandos e Ciclo de Vida do Desenvolvimento

| Comando | Descrição Técnica | Frequência de Uso |
|---|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento com suporte Turbopack e HMR. | Desenvolvimento ativo. |
| `npm run lint` | Executa o ESLint 9 com `--max-warnings=0` (Flat Config). | Antes de commitar. |
| `npm run typecheck` | Executa `tsc --noEmit` para validação estrita de tipos sem geração de JS. | Antes de commitar. |
| `npm test` | Executa a suíte de testes com o runner nativo do Node.js (`node --test`). | Validação contínua. |
| `npm run build` | Compila o build de produção, gerando páginas SSR (`ƒ`) e SSG (`○`). | Pré-deploy / gate. |
| `npm run check` | Gate de conformidade: executa lint, typecheck, test e build sequencialmente. | Obrigatório antes de push/PR. |

---

## 4. Guia Detalhado de Troubleshooting (Resolução de Problemas)

### 4.1 Erro de Hydration Mismatch (`Text content does not match server-rendered HTML`)
- **Causa:** O HTML gerado no servidor pelo RSC difere do primeiro render do cliente (CSR). Ocorre frequentemente ao renderizar datas com timezone local (`new Date().toLocaleString()`), `Math.random()`, ou acessar `window`/`localStorage` diretamente na renderização.
- **Diagnóstico:** O console do navegador exibe aviso vermelho de `Hydration failed`.
- **Solução:**
  1. Isole o acesso a APIs de navegador dentro de `useEffect` ou renderize condicionalmente após montagem (`const [mounted, setMounted] = useState(false)`).
  2. Garanta que atributos semânticos (`id`, `aria-describedby`) usem `useId()` do React 19 para gerar identificadores idênticos no servidor e no cliente.
  3. Formate datas utilizando fuso horário determinístico UTC no servidor ou no payload de dados.

---

### 4.2 Erro TypeScript TS5097 / Resolução de Módulos em Turbopack
- **Causa:** No TypeScript 5.9 com suporte nativo a ESM/Turbopack, imports relativos de arquivos TypeScript podem exigir extensões explícitas (`.ts`) ou caminhos resolvidos por `paths` configurados no `tsconfig.json`.
- **Diagnóstico:** O comando `npm run typecheck` falha com `TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled`.
- **Solução:**
  1. Utilize caminhos relativos consistentes com extensão explícita onde requerido pelo módulo ESM.
  2. Nunca importe arquivos TypeScript em arquivos JS compilados sem a configuração adequada de resolução.
  3. Mantenha os aliases `@/*` alinhados em `tsconfig.json` e validados via `tsc --noEmit`.

---

### 4.3 Alerta `MODULE_TYPELESS_PACKAGE_JSON` na Execução dos Testes Nativos
- **Causa:** O runner nativo `node --test` identifica sintaxe ESM em módulos TypeScript/ESM quando `package.json` não especifica `"type": "module"`.
- **Impacto:** O Node realiza reparsing dinâmico para ES module sem quebrar a execução dos testes.
- **Solução Recomendada:**
  1. Manter os arquivos de teste com extensão `.test.mjs` para indicar explicitamente módulo ESM ao Node.
  2. Importar serviços com extensões canônicas resolvidas.

---

### 4.4 Rota Estática (`○`) vs. Rota Dinâmica SSR (`ƒ`) no Next.js App Router
- **Causa:** Se uma rota não lê parâmetros de busca (`searchParams`), cookies ou cabeçalhos dinâmicos, o Next.js tenta pré-renderizá-la estaticamente durante o `npm run build`. Se a rota depende de dados em tempo de execução, isso pode causar dados obsoletos.
- **Diagnóstico:** O sumário do build exibe `○ (Static)` em vez de `ƒ (Dynamic)`.
- **Solução:**
  1. Para forçar renderização no servidor a cada requisição (SSR puro), declare no topo do `page.tsx`:
     ```typescript
     export const dynamic = 'force-dynamic';
     ```
  2. Para controle de cache de requisições de API no servidor, configure:
     ```typescript
     fetch(url, { cache: 'no-store' });
     ```

---

### 4.5 Prevenção de Vazamento de Variáveis de Ambiente em SSR
- **Regra de Segurança:** Nenhuma chave de API de backend, segredo institucional ou token interno pode conter o prefixo `NEXT_PUBLIC_`.
- **Diagnóstico:** Se um segredo estiver com `NEXT_PUBLIC_`, ele será embutido no JavaScript enviado ao navegador.
- **Solução:**
  - Segredos acessados no servidor: `process.env.INTERNAL_SERVICE_TOKEN` (consumido apenas em RSC ou Route Handlers).
  - Variáveis públicas: `process.env.NEXT_PUBLIC_API_URL` (apenas endpoints públicos).

---

### 4.6 Acessibilidade (WCAG 2.1 AA) e Renderização Semântica Server-Side
- **Requisitos Institucionais:**
  - Uso estrito de landmarks HTML5 (`<header>`, `<main>`, `<nav>`, `<footer>`).
  - Avisos dinâmicos com `role="alert"` e `aria-live="polite"` para leitores de tela.
  - Indicadores de foco visíveis (`:focus-visible`) com contraste mínimo de 4.5:1.
  - Campos de entrada associados a `<label for="...">` explícitos.

---

### 4.7 Falha no Gate de CI / `npm run check`
- **Ordem de Execução:** `npm run lint` -> `npm run typecheck` -> `npm test` -> `npm run build`.
- **Troubleshooting:**
  1. Se `npm run lint` falhar por quebras de linha CRLF/LF no Windows, execute `git config core.autocrlf true`.
  2. Se `npm run typecheck` falhar, verifique tipos ausentes ou assinaturas alteradas em `src/features/*/types.ts`.
  3. Se `npm test` falhar, examine a asserção exata no relatório do Node test runner.
  4. Se `npm run build` falhar, inspecione a saída de coleta de páginas para verificar se algum componente utilizou hooks de cliente em Server Component sem `'use client'`.

---

## 5. Checklist de Entrega para Code Review

Antes de submeter o PR para a revisora **Paola**:

- [x] O comando `npm run check` executou com sucesso (0 warnings, 0 erros).
- [x] Rastreabilidade mantida com vínculo à issue (`Closes #22`).
- [x] Sem alterações fora de escopo no backend ou na governança.
- [x] Acessibilidade e responsividade validadas.
