# Projetos Integradores

Propostas, equipes, bancas, avaliações e entregáveis.

## Gestão de Equipe — FE-009

Módulo de gestão de equipes de Projetos Integradores, cobrindo:
- Listagem e visualização de membros da equipe com respectivos papéis (Líder / Membro).
- Envio de convites para novos integrantes por e-mail institucional e nome, com validação de formato e prevenção ativa de duplicidade.
- Fluxo de aceite de convites pendentes com atualização de estado e inclusão na equipe.
- Fluxo de recusa de convites.
- Remoção de integrantes da equipe com diálogo acessível de confirmação e proteção contra remoção acidental do líder.
- Limite de integrantes por equipe parametrizado (capacidade padrão: 5 alunos).

### Fronteira de Integração com Backend (BE-008 / SPEC-PI-001)

A implementação no frontend utiliza tipos estritos e serviços preparados para desacoplamento e consumo da API REST:
- **Dependência**: `BE-008` (Convites aceitam/recusam sem duplicidade; rastreado na issue #8 de `plataforma-backend`).
- **SPEC**: `SPEC-PI-001` (Propostas e Equipes).
- **Contrato**: `CONTRACT-PI-001`.
- **Idempotência**: O backend deve garantir unicidade sob concorrência e retorno 409 em tentativas de convite duplicado. O frontend previne preventivamente no estado local e trata códigos de erro HTTP.
- **Autorização (RBAC)**: Apenas usuários autenticados com papel de Aluno/Líder ou Docente/Orientador podem gerenciar convites da equipe (`403 Forbidden` tratado na camada de serviço).
