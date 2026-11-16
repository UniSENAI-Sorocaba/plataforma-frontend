# Projetos Integradores (Academic PI)

Propostas, equipes, bancas, avaliações e entregáveis.

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
