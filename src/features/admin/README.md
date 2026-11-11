# Feature — Administração (AUTH-08-FE-07)

Implementação da tela inicial e navegação do administrador do sistema conforme os requisitos da especificação `SPEC-AUTH-003-rbac` e `SPEC-AUTH-004-audit`.

## Escopo Atendido
- Dashboard de infraestrutura e governança em rota SSR `/admin`.
- Métricas de usuários cadastrados, sessões ativas (JWT RS256) e conformidade de segurança.
- Atalhos para controle de acessos RBAC, parâmetros de período letivo, configurações e logs de auditoria.
- Monitoramento de saúde e latência dos microsserviços.
- Tabela de eventos recentes de auditoria (rastreabilidade OWASP).
- Camada mock desacoplada em `admin-service.ts` para futura integração com `AUTH-08-BE`.
