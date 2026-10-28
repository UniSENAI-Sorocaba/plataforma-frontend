# Painel docente — FE-012

Camada de interface para revisar solicitações acadêmicas, registrar decisão com motivo/justificativa e atualizar dinamicamente o cálculo de horas.

## Arquitetura de Mocks e Desacoplamento

Os dados e ações estão desacoplados na camada de serviço:
- `types.ts`: Define os tipos `ProjectRequest`, `DecisionStatus`, `DecisionSubmission` e `HoursSummary`.
- `faculty-service.ts`: Fornece os dados mockados (`INITIAL_FACULTY_REQUESTS`), a função de cálculo de horas (`calculateHoursSummary`) e o fluxo de submissão (`submitFacultyDecision`).
- `faculty-dashboard.tsx`: Componente interativo que gerencia o estado da decisão, valida motivo obrigatório em reprovações e atualiza os totais reativamente.

## Integração pendente com o Back-end (BE-014)

Quando a tarefa BE-014 for concluída:
1. Substituir a leitura de `INITIAL_FACULTY_REQUESTS` em `faculty-service.ts` por uma chamada GET `/api/v1/faculty/requests`.
2. Substituir `submitFacultyDecision` por uma chamada POST `/api/v1/faculty/requests/{id}/decision`.
3. Validar a autorização de sessão docente via cookies/headers da SPEC-AUTH-003.
