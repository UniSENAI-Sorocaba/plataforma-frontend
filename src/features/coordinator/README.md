# Feature — Coordenação (AUTH-08-FE-06)

Implementação da tela inicial e navegação da coordenação acadêmica conforme os requisitos da especificação `SPEC-AUTH-003-rbac`.

## Escopo Atendido
- Dashboard acadêmico em rota SSR `/coordenador`.
- Indicadores de turmas ativas, projetos integradores, alunos matriculados e docentes orientadores.
- Atalhos para importação em lote (CSV), gestão de turmas, projetos integradores e relatórios institucionais.
- Listagem e filtragem de turmas com status acadêmico.
- Camada mock desacoplada em `coordinator-service.ts` para futura integração com `AUTH-08-BE`.
