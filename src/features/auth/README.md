# Auth — FE-004

Login, sessão e autorização na interface. Regras de segurança permanecem obrigatoriamente no backend.

## Fluxo de Autenticação e Redirecionamento por Perfil (FE-004)

O módulo de autenticação implementa interface de login com:
- Validação client-side de campos obrigatórios (formato de e-mail institucional e tamanho de senha).
- Prevenção ativa de envio duplicado via desativação e estado de `isSubmitting`.
- Feedback acessível com mensagens de erro (`role="alert"`) e carregamento (`aria-busy`).
- Redirecionamento automático pós-login baseado no perfil do usuário (`UserRole`):

| Perfil | Destino de Redirecionamento | Finalidade |
| :--- | :--- | :--- |
| **ALUNO** | `/` | Portal do Aluno e Projetos Integradores |
| **DOCENTE** | `/docente` | Painel Docente e Revisão de Horas/Projetos |
| **COORDENADOR** | `/coordenacao` | Painel de Gestão e Editais |
| **ADMIN** | `/admin` | Painel Administrativo Geral |

## Fronteira de Integração com Backend (BE-004 / ADR-003)

- **Estratégia de Sessão**: Conforme ADR-003, o backend emite tokens JWT RS256 e armazena os tokens de sessão em cookies seguros `HttpOnly; SameSite=Lax`. O front-end não manipula nem expõe segredos no `localStorage`.
- **Contrato REST**: `POST /api/auth/login` recebendo `{ email, password, rememberMe }`.
- **Tratamento de Erros**:
  - `401 Unauthorized`: Mensagem amigável de credenciais inválidas.
  - `403 Forbidden`: Mensagem de conta desativada ou restrição de perfil.
  - `500+ / Falha de Rede`: Mensagem de indisponibilidade temporária.
