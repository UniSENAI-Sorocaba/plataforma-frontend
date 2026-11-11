# Avaliação de rubricas

`RubricScoreForm` apresenta critérios em controles HTML nativos, permite navegação por teclado e valida valores com os limites recebidos em cada critério. O componente encaminha as notas individuais para o callback de integração e somente apresenta o texto de resultado fornecido pelo servidor.

O componente não soma pesos nem calcula notas. Escala, precisão, arredondamento, ausência de avaliação e fórmula ainda aguardam aprovação do PO na SPEC-PI-003/BE-015. Quando o contrato backend for concluído, a rota consumidora deverá converter o DTO aprovado em `RubricCriterionInput` e passar o resultado oficial recebido.

Este componente não persiste dados nem substitui autorização: o servidor continua responsável por verificar o docente responsável e quem pode consultar notas individuais.
