# FE-010 — reconciliação da agenda com o escopo atual

Issue: [Frontend #10](https://github.com/UniSENAI-Sorocaba/plataforma-frontend/issues/10).
Responsável: Nicolas Leão (`Nicolas1xx`), com assistência Codex.
Estado desta proposta: aguardando revisão de Paola e decisão de Produto; não é uma agenda implementada.

## Divergência identificada

A issue FE-010 pede agenda com timezone, conflito e feedback de erro, dependente de BE-011. A SPEC-PI-002 atual diz que não haverá bancas, agendamento de sala ou link e orienta não criar entidade/agenda de banca. A transcrição das decisões oficiais do caderno de 22/10/2026 confirma essa retirada. O índice normativo da KB dá precedência às respostas oficiais nos temas respondidos.

Referências consultadas na governança, commit `7baa42afcdbee8e93f55aca138d475060849aa49`:

- [_KB/README.md](https://github.com/UniSENAI-Sorocaba/plataforma-governance/blob/7baa42afcdbee8e93f55aca138d475060849aa49/_KB/README.md): hierarquia e autoridade do caderno.
- [Decisões oficiais](https://github.com/UniSENAI-Sorocaba/plataforma-governance/blob/7baa42afcdbee8e93f55aca138d475060849aa49/_KB/product/official-validation-decisions.md): seção Avaliação e bancas.
- [SPEC-PI-002](https://github.com/UniSENAI-Sorocaba/plataforma-governance/blob/7baa42afcdbee8e93f55aca138d475060849aa49/_KB/specs/SPEC-PI-002-boards.md): avaliações sem agenda de banca.
- [Reconciliação funcional](https://github.com/UniSENAI-Sorocaba/plataforma-governance/blob/7baa42afcdbee8e93f55aca138d475060849aa49/_KB/product/functional-rules-reconciliation.md): remover banca, agenda, sala e link dos artefatos incompatíveis.

## Trabalho entregue nesta proposta

- Conferida a divergência entre card antigo e decisões recentes.
- Registrados os vínculos e o impacto na dependência BE-011.
- Não foi criada uma funcionalidade de agenda contrária ao escopo oficial.
- Não foi renomeada a tarefa nem criada uma nova regra de calendário por inferência.

## Disposição recomendada para revisão

Paola/PO devem reconciliar FE-010 e sua dependência BE-011: encerrar a tarefa antiga como retirada/substituída por mudança de escopo, preservando o histórico, ou publicar uma nova definição específica de trabalho com critérios e vínculos revisados. A regra de retirada de bancas já é oficial; o que falta aqui é sua transposição ao planejamento e às atribuições.

Há datas de períodos de Extensão no fuso UTC-3 e atribuição de avaliações em datas, mas isso não autoriza transformar FE-010 em uma agenda nova. Caso haja trabalho de frontend nessa área, precisa de escopo próprio para evitar duplicação com outros cards. O conflito entre prazo não prorrogável e ajuste pelo docente também permanece sob esclarecimento de Produto.

## Critérios propostos para concluir a reconciliação

1. Registrar no card a regra oficial que retirou a agenda de bancas.
2. Atualizar vínculos com BE-011 e quaisquer dependências afetadas, sem apagar histórico.
3. Registrar por decisão de Produto se FE-010 será retirada ou substituída e quem será responsável pela eventual substituta.
4. Não marcar uma implementação de agenda como concluída; o resultado correto é reconciliação aceita, se aprovada.

## Validação e limitações

Mudança exclusivamente documental, conferida contra fontes versionadas. Sem alteração de código, banco ou infraestrutura. A tag fixada em `.governance-baseline` permanece ausente e não foi alterada. Não há declaração de PASS normativo nem autorização de merge automática. Este PR aguarda revisão humana.
