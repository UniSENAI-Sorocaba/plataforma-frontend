# Projetos Integradores (Academic PI)

Propostas, equipes, bancas, avaliações e entregáveis.

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
