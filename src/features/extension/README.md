# Extensão — FE-036 / EXT-05-FE

`enrollment-screen.tsx` contém a tela apresentacional de inscrição: estados de
carregamento, erro com nova tentativa, lista de atividades fornecida pelo
servidor, confirmação antes do envio e exibição do status devolvido pelo
servidor. Os campos da interface são um view model interno; eles não definem o
contrato HTTP.

O componente não inventa atividades nem decide elegibilidade, período ou
transições de estado. O backend continua responsável por validar a inscrição.

## Integração pendente

- A issue [EXT-05-BE](https://github.com/UniSENAI-Sorocaba/plataforma-backend/issues/35)
  está aberta e atribuída a `PedroDias010`.
- A issue funcional [EXT-05](https://github.com/UniSENAI-Sorocaba/plataforma-governance/issues/25)
  continua aberta e depende de EXT-01 a EXT-04.
- A `SPEC-EXT-001` está em Draft. Endpoints, campos, elegibilidade, janela,
  duplicidade, cancelamento e estados ainda precisam de definição e contrato
  OpenAPI antes de ligar o componente a uma rota.

Portanto, esta entrega é somente a camada de tela; não é integração ponta a
ponta nem conclusão dos critérios de aceite da issue.
