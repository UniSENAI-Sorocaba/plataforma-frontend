# Portal Público e Impacto

Catálogo, busca, filtros e impacto comunitário, sempre SSR e apenas com conteúdo publicado.

## Módulo: Vitrine e Governança de Impacto Comunitário (`FE-016`)

Responsável por garantir que a vitrine de impacto comunitário renderize **exclusivamente** conteúdos aprovados e com publicação ativa pelo docente responsável, protegendo informações internas, notas/horas individuais e fotografias sem autorização, em conformidade com a **`SPEC-PORTAL-002`**, **`SPEC-PORTAL-001`**, pacote **`S4-extensao-impacto-publicacao.md`** e o contrato OpenAPI 3.1 de **`BE-019`**.

### Regras de Negócio e Critérios de Aceite Implementados

1. **Rascunho Exige Origem Rastreável (`AC-01` / `impact-validation.ts`)**:
   - Criação (`POST /api/v1/impacts`) e revisão (`POST /api/v1/impacts/{id}/versions`) validam obrigatoriamente `title` (1..200), `summary` (1..10000), `sourceReference` (1..512), `responsibleReference` (1..200) e datas ISO `periodStart` / `periodEnd` com `periodStart <= periodEnd`.
   - Rejeita payloads com propriedades extras não previstas no contrato (`additionalProperties: false`).

2. **Conteúdo Não Aprovado ou Não Publicado Nunca é Renderizado (`AC-02` / `FE-016`)**:
   - Separação estrita entre aprovação (`POST /versions/{version}/approval`) e publicação (`PUT /publication`).
   - Rascunhos (`DRAFT`), versões aprovadas aguardando publicação (`APPROVED_UNPUBLISHED`) e itens sem opção de publicação ativa pelo docente (`!teacherPublicationOptIn`) retornam `null` em `toPublicImpactDto()` e `404` em `readPublicImpact()`, nunca aparecendo na vitrine pública.

3. **Publicação Segue o Ponteiro Explícito da Versão Aprovada (`AC-03`)**:
   - Quando um impacto já publicado na versão `v1` recebe uma nova versão `v2` em rascunho (`latestVersion = 2`, `publishedVersion = 1`), a vitrine pública continua exibindo `v1` (aprovada e publicada) sem expor o rascunho `v2`.
   - Tentativas de publicar versão não aprovada são bloqueadas com erro contratual `409 Conflict` (RFC 9457 `ProblemDetails`).

4. **Retirada Remove Exposição Pública e Preserva Histórico (`AC-04` / `AC-S4-09`)**:
   - A operação `withdrawImpactPublication()` (`DELETE /api/v1/impacts/{id}/publication`) limpa imediatamente `publishedVersion = null` e responde com `Cache-Control: no-store`, fazendo com que novas consultas públicas retornem `404` enquanto versões e histórico permanecem íntegros para auditoria.

5. **Proveniência, Privacidade e Direito de Imagem (`AC-05`, `AC-S4-07`, `AC-S4-08`, `AC-S3-09`)**:
   - **Allowlist pública (`ImpactPublicResponse`)**: O DTO público nunca inclui `provenance`, `sourceReference`, `responsibleReference`, `internalStudentHours`, `internalStudentGrades` nem métricas não homologadas pelo PO (`internalUnapprovedMetrics`).
   - **Fotografias (`AC-PORTAL-001-05` / `AC-S3-09`)**: Legendas e registros fotográficos só entram na projeção pública quando `teacherPhotoPublicationAuthorized === true`.
   - **Auditoria de Origem (`AC-05`)**: Consultas de proveniência (`readImpactProvenance`) e histórico (`readImpactHistory`) exigem permissão `AUDIT` (`401` para visitante anônimo, `403` para perfis sem permissão de auditoria).
   - **Concorrência Otimista e Correlação (`BE-019`)**: Validação de cabeçalho `If-Match` / `ETag` (`412` em divergência de revisão, `428` quando ausente/inválido) e sanitização de `X-Correlation-Id` (`^[A-Za-z0-9._-]{1,64}$`).

### Fronteiras Arquiteturais e Acessibilidade

- **Rota SSR**: `src/app/impacto/page.tsx`
- **Componentes reutilizáveis acessíveis**: `src/components/alert.tsx`, `src/components/badge.tsx`, `src/components/button.tsx`, `src/components/input.tsx`, `src/components/textarea.tsx`
- **Feature (`src/features/portal/`)**:
  - `impact-types.ts`: Tipos e schemas alinhados ao OpenAPI 3.1 de `BE-019`.
  - `impact-validation.ts`: Validação de rascunho/origem, controle de permissões RBAC, projeção por allowlist (`toPublicImpactDto`) e filtragem pública (`filterPublishedImpactsForVisitor`).
  - `impact-client.ts`: Store isolado por instância (sem estado mutável global em módulo SSR), operações completas do ciclo de vida e adaptador HTTP `fetchPublicImpactFromApi` com timeout de 10s e `Cache-Control: no-store`.
  - `impact-showcase.tsx`: Vitrine pública com busca e filtros combinados (curso, semestre, ODS) e simulador interativo de governança/auditoria acessível por teclado e leitor de tela.
- **Testes automatizados**: `tests/impact-publication.test.mjs`

### Limitações Conhecidas e Follow-ups de Integração

- A dependência `BE-019` (`feat/BE-019-impact-publication` em `plataforma-backend`) e a `SPEC-PORTAL-002` encontram-se em revisão normativa pelo PO (definição final das métricas institucionais de impacto e SLA de expurgo de CDN). O cliente em `impact-client.ts` segue integralmente o contrato `contracts/impact.openapi.json` de `BE-019` e está preparado para integração com o endpoint REST assim que homologado.
