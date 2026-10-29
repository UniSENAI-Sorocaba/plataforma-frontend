# Entrega de Nicolas — FE-005, FE-015, FE-020 e FE-025

Responsável pelas issues: Nicolas Leão (`Nicolas1xx`). Implementação preparada com assistência de Codex para revisão por Paola e, no protótipo CPA, Gustavo/Produto. Não representa aprovação, merge ou conclusão das dependências de outras equipes.

## O que foi implementado

| Issue | Código e comportamento | Limite da entrega |
| --- | --- | --- |
| FE-005 / #5 | `SessionClient` usa cookie de mesma origem, timeout, uma tentativa de refresh por leitura, deduplicação de refresh concorrente, proteção contra respostas atrasadas, encerramento idempotente e callback de redirecionamento. Uma segunda resposta 401 encerra o fluxo; 403 não dispara refresh. Mutações não são repetidas automaticamente. | BE-006 ainda precisa publicar o contrato. Demonstração isolada em `/demonstracao/sessao`, sem login acadêmico real. |
| FE-015 / #15 | `/catalogo` é SSR, com formulário GET utilizável sem JavaScript, filtros combinados, paginação estável, estado vazio, recuperação de erro, layout responsivo e DTO público com allowlist. | Filtros/campos/ordem são proposta demonstrativa. Contrato de BE-018 e regras completas do catálogo precisam ser aprovados. |
| FE-020 / #20 | Vitest com cobertura mínima de 70% em linhas, statements, funções e branches da lógica `.ts` em `src/features`; testes Playwright de SSR, filtros, paginação, sessão, isolamento e CPA. CI executa lint, tipos, testes, build, auditoria e E2E. | Não cobre módulos futuros ainda não implementados. Cobertura de lógica não significa cobertura de toda a interface. |
| FE-025 / #25 | `/prototipos/cpa` contém prévia acessível por teclado, escala de três perguntas, confirmação e reinício. Sem nome, CPF, e-mail, texto livre, endpoint de submissão ou persistência. | Demonstração do horizonte 2027.1. Não é pesquisa ativa nem garantia de anonimato para um serviço futuro. Aprovação de Produto/Segurança pendente. |

FE-010 / #10 requer reconciliação com a decisão oficial de não implementar bancas/agenda. Sua divergência será registrada em uma proposta separada de documentação, sem declarar uma agenda inexistente como entregue.

## Executar localmente

Recomendado Node.js 24, com npm. Dependências e versões estão no lockfile.

```bash
npm ci
cp .env.example .env.local
```

Para revisar as duas prévias, configurar em `.env.local`:

```dotenv
CATALOG_SOURCE=mock
ENABLE_SESSION_DEMO=true
ENABLE_PROTOTYPES=true
```

```bash
npm run dev
```

Abrir `/catalogo`, `/demonstracao/sessao` e `/prototipos/cpa`. Sessão e CPA retornam 404 quando suas flags não são `true`. O catálogo mostra um aviso de dados fictícios em modo mock; nunca usa um mock silencioso após falha de API.

```bash
npm run check
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
npm run spec-compliance
```

O último comando deve retornar **FAIL** enquanto as pendências normativas desta entrega existirem. Gera `target/spec-compliance.json`. Não equivale aos testes técnicos e não é promovido a PASS pelo fato de os mocks funcionarem.

Para testar a aplicação compilada, `npm run build` prepara o artefato standalone com seus arquivos estáticos; `npm start` o executa. Playwright configura seu próprio servidor em `127.0.0.1:3100`, habilitando somente as prévias sintéticas.

## Conexão com o backend: o que foi verificado

Consulta a `main` e `develop` do backend em 28/10/2026. O bootstrap em `main` não fornece login/refresh/catálogo. A branch `develop`, SHA `8a657edf980d6bb6eb70bf2e0646ea5879fc4cc8`, oferece CRUD local em `/api/v1/projects`, condicionado ao perfil local. Esse DTO inclui `leaderId`/`advisorId`, não contém ODS ou confirmação de publicação, e a listagem não filtra projetos publicados. Não é uma API de catálogo público.

A branch `feat/BE-003-openapi-contracts` declara apenas health, liveness, readiness e info; seu README também informa que login e recurso paginado não estão implementados no bootstrap. Não há serviço respondendo em `localhost:8080` nesta máquina. Java/Maven não estão disponíveis e o daemon Docker não está ativo. Não foi feita conexão a banco remoto ou ambiente de produção.

Por esses motivos, a sessão é mock e o catálogo usa fixtures sintéticas por padrão. O CRUD antigo não é exposto ao visitante. Nenhum endpoint real foi declarado integrado sem evidência.

### Adaptador de catálogo para integração futura

Definir apenas no servidor, depois de alinhar com BE-018:

```dotenv
CATALOG_SOURCE=api
CATALOG_API_URL=https://api-do-ambiente.example/rota-publica-aprovada
```

`CATALOG_API_URL` é uma URL de configuração do mantenedor, não entrada do visitante. O caminho acima é exemplo, não endpoint existente. O adaptador experimental envia `course`, `semester`, `ods`, `page` (base 1) e `pageSize=6`. Aceita HTTPS; HTTP é permitido somente para localhost/127.0.0.1. Sem cookies de usuário, sem redirects e sem cache, com timeout de oito segundos.

Formato **proposto**, não contrato institucional aprovado:

```json
{
  "items": [{
    "id": "projeto-1",
    "published": true,
    "title": "Título público",
    "summary": "Resumo público",
    "course": "Análise e Desenvolvimento de Sistemas",
    "semester": "2026.2",
    "ods": [4, 9]
  }],
  "total": 1,
  "page": 1,
  "pageSize": 6
}
```

O backend deve fazer filtro e paginação somente sobre itens publicados. Sem `published: true` em cada item, o adaptador rejeita a resposta inteira. Campos extras são removidos por allowlist antes de enviar dados à UI. Não há persistência nem cache de respostas, reduzindo retenção após retirada de publicação. Erro de transporte, payload inválido ou indisponibilidade mostram estado de erro; não mostram dados fictícios no lugar dos dados reais. As opções de curso/semestre usadas no mock precisam ser substituídas pelas opções aprovadas para produção.

### Integrar sessão com o login da equipe

O cliente é independente do PR #39 e não substitui o formulário de login de Kaique. Após BE-006 definir transporte e contrato, criar uma única instância compartilhada por sessão no shell autenticado:

```ts
const client = new SessionClient({
  origin: window.location.origin,
  refreshPath: caminhoDeRefreshAprovado,
  logoutPath: caminhoDeLogoutAprovado,
  onExpired: () => window.location.assign('/login'),
});
const response = await client.request('/rota-protegida-aprovada');
```

Os caminhos são parâmetros do adaptador, não endpoints inventados como se existissem. Não guardar tokens em localStorage/sessionStorage e não inferir permissão por endereço de e-mail. Cookies, CSRF, revogação, login por CPF e reset de senha dependem da implementação aprovada do backend. Requisição POST/PUT/PATCH/DELETE que receba 401 volta ao chamador sem replay automático para evitar duplicação de efeitos. Se houver falha de rede no logout, a UI encerra localmente, mas a revogação no servidor não pode ser garantida; isso exige acompanhamento no backend e expiração segura.

## Testes e evidências

- Testes de sessão: sucesso, 401→refresh→retry, segundo 401, falha de refresh/rede/timeout, 403, concorrência, 401 atrasado, logout concorrente/idempotente e bloqueio de outra origem.
- Catálogo: filtros combinados, entrada inválida, publicação, paginação estável, vazio, contrato inválido, allowlist de campos, parâmetros HTTP e falha de API sem fallback silencioso.
- CPA: validação das respostas; E2E por teclado confirma ausência de POST e de localStorage e descarte das escolhas.
- E2E: SSR real, formulário sem JavaScript, paginação, filtros, renovação/falha/logout, cookie HttpOnly, rejeição de origem externa e isolamento entre contextos de navegador.
- Escopo da cobertura: arquivos de lógica `.ts` de `src/features`; componentes React são exercitados pelos E2E, sem afirmar cobertura unitária de TSX.

Os números finais e resultados remotos ficam no relatório de entrega/PR. Nenhuma evidência técnica substitui aprovação funcional.

## Dependências, segurança e governança

Next.js e eslint-config-next atualizados de 16.3.5 para 16.4.3 para corrigir advisories detectados na instalação. Dependências transitivas corrigidas pelo npm; auditoria local terminou sem vulnerabilidades. A arquitetura permanece Next.js/TypeScript/React/SSR.

O mock de sessão é isolado em `/api/demo/session`, opt-in, com cookie HttpOnly/SameSite Strict restrito ao seu path, expiração de dez minutos, limite de 500 sessões e validação de origem para mutações. Só guarda contadores e flags sintéticos na memória de um processo. Reinício descarta sessões; não suporta persistência ou balanceamento e não deve ser usado como autenticação real.

A tag `governance-v0.1.0` fixada em `.governance-baseline` continua ausente. SPEC-AUTH-002 e SPEC-PORTAL-001 estão Draft. As regras oficiais do caderno prevalecem nos temas respondidos, sem autorizar inventar os detalhes ausentes. `.governance-baseline` e documentos normativos não foram alterados. Resultado de compliance da entrega: **FAIL — dependências de baseline, contratos e aceite pendentes**.

## Revisão e rollback

Solicitar revisão de Paola nas entregas frontend e Gustavo/Produto na prévia CPA. Manter PR em draft enquanto baseline, contratos e integração exigidos não forem resolvidos. Não marcar as issues Done nem fechar automaticamente FE-005/FE-015 como integração real concluída. Revert do PR retira as telas, o cliente e as ferramentas adicionadas; não há migration ou mudança de dado persistido. As prévias também podem ser desabilitadas pelas flags.
