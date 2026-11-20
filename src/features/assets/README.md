# Gestão Patrimonial — Protótipo Fase 2 (`FE-023`)

Protótipo navegável de alta fidelidade funcional para validação do Product Owner (`FE-023`), vinculado ao épico **`EP05-PAT`** (Módulo 4: Gestão Patrimonial) e ao item de governança **`PG-019`** (*US14–18 refinadas e ordenadas para 2027.1*).

## Escopo e Regras de Negócio Cobertas

1. **Inventário de Notebooks e Empréstimos via QR Code (`US14`)**:
   - Validação de etiqueta QR Code institucional no padrão `PAT-NB-YYYY-NNN`.
   - Controle estrito de estados (`AVAILABLE`, `CHECKED_OUT`, `MAINTENANCE`).
   - Impedimento de empréstimo concorrente quando o ativo já está emprestado (`CHECKED_OUT`) ou bloqueado para reparo (`MAINTENANCE`).
   - Registro de retirada (*check-out*) com identificação institucional (RA/Matrícula), perfil (`STUDENT` / `FACULTY`) e finalidade acadêmica, além de devolução (*check-in*) com histórico auditável.

2. **Agendamento de Salas e Laboratórios Fora do Horário (`US15`)**:
   - Validação de janela temporal (`startTime < endTime`) e detecção preventiva de conflito de agenda (`hasRoomScheduleConflict`) na mesma sala e data.
   - Fluxo de aprovação e recusa justificada pela coordenação de laboratórios (`PENDING_APPROVAL` → `APPROVED` / `REJECTED`).

3. **Gestão de Ocorrências e Avarias Físicas (`US15`)**:
   - Registro de avarias vinculadas a notebooks ou laboratórios com classificação de severidade (`BAIXA`, `MEDIA`, `ALTA`, `CRITICA`) e validação de referência de evidência fotográfica.
   - Quarentena automática: ocorrências de severidade `ALTA` ou `CRITICA` movem o notebook preventivamente para `MAINTENANCE` até que o reparo técnico seja concluído (`resolveDamageIncident`).

4. **Isolamento de Protótipo e Homologação do PO (`PG-019`)**:
   - Rota SSR `/prototipos/patrimonio` configurada com `robots: { index: false, follow: false }` para evitar indexação pública de funcionalidades planejadas para `2027.1`.
   - Matriz interativa de validação do Product Owner cobrindo os 5 critérios de aceite de `US14`, `US15` e `PG-019`.

## Fronteiras Arquiteturais

- Rota SSR: `src/app/prototipos/patrimonio/page.tsx`
- Tipos e Contratos: `src/features/assets/assets-types.ts`
- Regras de Domínio: `src/features/assets/assets-service.ts`
- Interface Acessível: `src/features/assets/assets-prototype.tsx`
- Testes Automatizados: `tests/assets-prototype.test.mjs`
