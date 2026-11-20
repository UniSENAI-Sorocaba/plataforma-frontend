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

## Módulo: Upload e Confirmação de Entregáveis (`FE-011`)

Responsável pelo fluxo de submissão, validação de formato/limites, acompanhamento de progresso, cancelamento seguro e confirmação criptográfica (`SHA-256`) de entregáveis de Projeto Integrador, alinhado à **`SPEC-PI-004`** e aos contratos de backend **`BE-012`** e **`BE-013`**.

### Funcionalidades e Regras de Negócio Implementadas

1. **Validação de Formatos Oficiais e Assinatura Binária (`deliverable-validation.ts`)**:
   - **Formatos aceitos (`AC-PI-004-03`)**: Documentos `.pdf`, `.docx` e Imagens `.png`, `.jpg/.jpeg`, `.webp`.
   - **Inspeção real de conteúdo (`detectFormatFromHeaderBytes`)**: Verifica os *magic bytes* do arquivo (`%PDF-`, container ZIP `PK\x03\x04` para DOCX, `PNG`, `JPEG` e `RIFF/WEBP`) além da extensão e do tipo MIME, impedindo o envio de executáveis ou arquivos renomeados.
   - **Limites parametrizáveis (`SPEC-PI-004`)**: Política configurável via `DeliverableUploadPolicy` (padrão provisório de 25 MB para documentos e 10 MB para imagens até definição contratual final pelo PO).
   - **Cálculo de SHA-256 no cliente**: Utiliza `crypto.subtle.digest("SHA-256", ...)` para verificação de integridade fim a fim.

2. **Controle de Escopo, Janela de Edição e Direito de Imagem (`SPEC-PI-004`)**:
   - **Isolamento de leitura (`AC-PI-004-01`)**: Apenas integrantes vinculados ao projeto, docente orientador e administração podem visualizar metadados e entregáveis; atores não vinculados recebem bloqueio (`403`).
   - **Janela de edição (`AC-PI-004-02`)**: Envios e substituições só são permitidos antes do início da avaliação (`!evaluationStarted`).
   - **Publicação de fotografias (`AC-PI-004-04`)**: Entregáveis de imagem recebem status inicial `PENDING_FACULTY_DECISION` e aviso explícito de que permanecem restritos internamente até autorização do docente responsável (considerando menores de idade e terceiros).

3. **Progresso, Cancelamento e Confirmação Idempotente (`deliverable-upload-client.ts`)**:
   - **Autorização S3 curta e restrita (`BE-012`)**: Emissão e validação de URL pré-assinada privada com TTL de 15 minutos (`900s`) e `correlationId`.
   - **Progresso e Cancelamento (`FE-011`)**: Transmissão em etapas com atualização de percentual/bytes e suporte a interrupção imediata via `AbortController` (`UploadCanceledError`).
   - **Confirmação com SHA-256 (`BE-013`)**: Verifica validade do TTL, correspondência de metadados, igualdade do hash `SHA-256` e idempotência por `idempotencyKey`.

4. **Fronteiras Arquiteturais e Acessibilidade**:
   - Rota SSR: `src/app/academic-pi/entregaveis/page.tsx`
   - Componentes reutilizáveis acessíveis: `src/components/progress-bar.tsx` (`role="progressbar"`, `aria-valuenow`, `aria-valuetext`), `src/components/alert.tsx`, `src/components/button.tsx`, `src/components/badge.tsx`
   - Feature: `src/features/academic-pi/deliverable-upload.tsx`, `deliverable-validation.ts`, `deliverable-upload-client.ts`, `deliverable-types.ts`
   - Testes automatizados: `tests/deliverable-upload.test.mjs`

5. **Limitações Conhecidas e Follow-ups de Integração**:
   - As dependências `BE-012` e `BE-013` no repositório `plataforma-backend` ainda estão em desenvolvimento (`OPEN`). O adaptador em `deliverable-upload-client.ts` opera com simulação determinística compatível com o contrato e está pronto para apontar para os endpoints REST assim que forem publicados.
