# Sistema visual do Front-end

Este documento registra os tokens CSS e os padrões reutilizáveis do frontend Next.js. Os tokens vivem em `src/app/styles.css`; componentes devem usar os valores semânticos abaixo em vez de duplicar cores e espaçamentos.

## Cores semânticas

| Token | Tema claro | Uso |
| --- | --- | --- |
| `--ds-color-primary` | `#d71920` | Ação principal, links de destaque e foco |
| `--ds-color-primary-hover` | `#b3131a` | Estado hover da ação principal |
| `--ds-color-background` | `#f5f7fa` | Fundo geral da página |
| `--ds-color-surface` | `#ffffff` | Cartões e superfícies elevadas |
| `--ds-color-text` | `#172033` | Texto principal |
| `--ds-color-muted` | `#5f6b7c` | Texto secundário |
| `--ds-color-border` | `#e2e8f0` | Bordas e divisores |
| `--ds-color-success` | `#1f9d55` | Estado positivo |
| `--ds-color-warning` | `#b45309` | Avisos |
| `--ds-color-danger` | `#b5121b` | Erros |

O tema escuro é ativado por `data-theme="dark"` no elemento `html`. Ele substitui as cores semânticas e o navegador acompanha `color-scheme`; componentes não devem codificar cores do tema diretamente.

## Espaçamento, tipografia e superfícies

Use a escala `--ds-space-1/2/3/4/6/8/12` (4, 8, 12, 16, 24, 32 e 48 px na unidade padrão do navegador). O contêiner principal é limitado por `--ds-content-width` (72 rem). Títulos usam `clamp()` para crescer sem ultrapassar a largura disponível e `text-wrap: balance` para evitar linhas órfãs.

Raios e sombra de cartões são `--ds-radius-sm/md/lg` e `--ds-shadow-card`. Bordas, fundos e textos usam os respectivos tokens semânticos.

## Grid e pontos de quebra

- Base móvel: uma coluna, sem largura mínima de conteúdo além de 320 px.
- A partir de 40 rem: `.ds-grid--2` passa a duas colunas.
- A partir de 64 rem: `.ds-grid--3` passa a três colunas.
- Use `minmax(0, 1fr)` e `min-width: 0` para evitar overflow de conteúdo longo.
- `.ds-container`, `.ds-grid`, `.ds-stack` e `.ds-card` compõem os padrões compartilhados.

Os breakpoints são limites de layout, não alvos de dispositivos específicos. Conteúdo deve fluir entre eles e não depender de dimensões fixas de aparelho.

## Acessibilidade

- Interativos recebem contorno visível via `:focus-visible`; não remova o foco sem alternativa equivalente.
- Mantenha rótulos e nomes acessíveis nos componentes; cor não deve ser o único indicador de estado.
- Respeite `prefers-reduced-motion` para transições e animações.
- Verifique contraste dos pares semânticos quando um novo componente introduzir combinações.

## Verificação

`tests/design-system.test.mjs` protege os tokens, temas e breakpoints documentados. A issue FE-003 depende da publicação dos cinco componentes acessíveis da FE-002; esta base pode ser consumida por eles após integração.
