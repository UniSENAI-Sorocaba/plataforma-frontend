# Projetos Integradores (Academic PI)

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

## Módulo: Submissão e Validação de Propostas (`FE-006`)

Responsável pela captura de novas propostas de Projeto Integrador (PI 1 a 4) e Extensão Universitária, com validação de campos obrigatórios, restrições acadêmicas e preservação de rascunhos.

### Funcionalidades Implementadas

1. **Validação Rigorosa de Campos (`validation.ts`)**:
   - `title`: obrigatório, de 5 a 120 caracteres.
   - `theme`: obrigatório, área de concentração.
   - `modality`: PI1, PI2, PI3, PI4 ou EXTENSAO.
   - `problemStatement`, `objectives`, `justification`: obrigatórios, com limites entre 20 e 1000 caracteres e contadores visuais em tempo real.
   - `ods`: obrigatoriedade de seleção de ao menos um Objetivo de Desenvolvimento Sustentável da Agenda 2030 da ONU.
   - `teamMembers`: validação de 1 a 6 integrantes com formato de e-mail institucional e RA.

2. **Preservação de Rascunho Permitido (`draft-storage.ts`)**:
   - Armazenamento em `localStorage` com controle de versão e timestamp de salvamento.
   - `canSaveDraft()`: valida se o formulário possui conteúdo válido para salvar sem exigir campos pendentes completos.
   - Recuperação automática de rascunho ao carregar a página.
   - Botão para descarte explícito de rascunho.
   - Limpeza automática de rascunho após submissão com sucesso.

3. **Acessibilidade e Usabilidade (`proposal-form.tsx`)**:
   - Labels semânticos com `htmlFor` e `id`.
   - `aria-invalid` e `aria-describedby` vinculados a mensagens de erro (`role="alert"`).
   - Foco automático no primeiro campo inválido em caso de erro na submissão.
   - Suporte completo a navegação por teclado nos cards de ODS e ações.

4. **Fronteiras Arquiteturais**:
   - Rota SSR: `src/app/academic-pi/propostas/nova/page.tsx`
   - Componentes acessíveis reutilizáveis: `src/components/` (`button.tsx`, `input.tsx`, `textarea.tsx`, `alert.tsx`, `badge.tsx`)
   - Testes unitários com o test runner nativo: `tests/proposal-validation.test.mjs`
